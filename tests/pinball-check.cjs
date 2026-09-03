const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:700,height:900}});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/pinball/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.PB7);

  const boot = await p.evaluate(()=>({ st: PB7.state(),
    w: document.getElementById('cv').width, h: document.getElementById('cv').height }));
  (boot.st.mode==='attract'&&boot.w===160&&boot.h===288)
    ? ok('boots to attract mode on a 160×288 canvas') : fail('boot: '+JSON.stringify(boot));

  const started = await p.evaluate(()=>{ PB7.start(); return PB7.state(); });
  (started.mode==='play'&&started.ballNum===1&&started.lane&&started.score===0)
    ? ok('start: ball 1 served to the plunger lane') : fail('start: '+JSON.stringify(started));

  const launched = await p.evaluate(()=>{ PB7.launch(0.9); PB7.ff(1.2); return PB7.state(); });
  (launched.ball&&launched.ball.x<143&&!launched.lane)
    ? ok('plunger launch: ball crests the arc into the playfield (x='+launched.ball.x+')')
    : fail('launch: '+JSON.stringify(launched));

  const power = await p.evaluate(()=>{
    PB7.start();
    PB7.press('P',true); PB7.ff(0.7);
    const charged=PB7.state().power;
    PB7.press('P',false);
    let minx=999,miny=999;
    for(let i=0;i<150;i++){ PB7.ff(1/60);
      const bl=PB7.state().ball; if(bl){ minx=Math.min(minx,bl.x); miny=Math.min(miny,bl.y); } }
    return { charged, minx:+minx.toFixed(1), miny:+miny.toFixed(1) };
  });
  (power.charged>0.5&&power.minx<60&&power.miny<70)
    ? ok('full plunge: gauge charged to '+power.charged+', ball rockets around the arc to x'+power.minx)
    : fail('full plunge too weak: '+JSON.stringify(power));

  const half = await p.evaluate(()=>{
    PB7.start(); PB7.launch(0.5);
    let entered=false, miny=999;
    for(let i=0;i<150;i++){ PB7.ff(1/60);
      const bl=PB7.state().ball; if(bl){ if(bl.x<140) entered=true; miny=Math.min(miny,bl.y); } }
    return { entered, miny:+miny.toFixed(1) };
  });
  (half.entered&&half.miny<120)
    ? ok('half plunge: comfortably enters play (apex y'+half.miny+')')
    : fail('half plunge too weak: '+JSON.stringify(half));

  const bump = await p.evaluate(()=>{
    const s0=PB7.state().score;
    PB7.setBall(80,110,0,-260); PB7.ff(0.6);
    return { gained: PB7.state().score-s0, ball: PB7.state().ball };
  });
  bump.gained>=100 ? ok('bumper: center bumper kicks and scores (+'+bump.gained+')') : fail('bump: '+JSON.stringify(bump));

  const flip = await p.evaluate(()=>{
    PB7.setBall(66,235,0,90);
    PB7.ff(0.12);
    PB7.press('L',true);
    PB7.ff(0.25);
    PB7.press('L',false);
    const st=PB7.state();
    return { vy: st.ball?st.ball.vy:999, y: st.ball?st.ball.y:999 };
  });
  (flip.vy<0&&flip.y<250)
    ? ok('left flipper sends a dropping ball back up (vy='+flip.vy+')') : fail('flip: '+JSON.stringify(flip));

  const multi = await p.evaluate(()=>{
    PB7.start(); PB7.launch(0.5); PB7.ff(0.4);
    PB7.TGT[0].up=false; PB7.TGT[1].up=false;
    const s0=PB7.state().score;
    PB7.setBall(89,145,0,-160); PB7.ff(0.3);
    const st=PB7.state();
    return { gained: st.score-s0, onTable: st.onTable, mult: st.mult, up: st.targetsUp };
  });
  (multi.gained>=5500&&multi.onTable>=3&&multi.mult===2)
    ? ok('7-B-T bank: last target down → +'+multi.gained+', multiball ('+multi.onTable+' balls), ×2 scoring')
    : fail('multi: '+JSON.stringify(multi));

  const ufo = await p.evaluate(async ()=>{
    await new Promise(r=>setTimeout(r,1000));
    PB7.SAUCER.cool=0;
    const s0=PB7.state().score;
    PB7.setBall(26,70,-20,60); PB7.ff(0.3);
    const during={ held: PB7.state().held, gained: PB7.state().score-s0 };
    PB7.ff(1.2);
    const after=PB7.state();
    return { during, ejected: !after.held&&after.onTable>=1 };
  });
  (ufo.during.held&&ufo.during.gained>=2500&&ufo.ejected)
    ? ok('UFO saucer: abducts (+'+ufo.during.gained+'), holds, ejects') : fail('ufo: '+JSON.stringify(ufo));

  const drain = await p.evaluate(()=>{
    PB7.start();
    PB7.setBall(80,270,0,300); PB7.ff(1.0);
    return PB7.state();
  });
  (drain.ballNum===2&&drain.lane)
    ? ok('drain: ball 2 auto-served to the lane') : fail('drain: '+JSON.stringify(drain));

  const unstick = await p.evaluate(()=>{
    PB7.start(); PB7.launch(0.5); PB7.ff(0.4);
    PB7.setBall(64,250,0,0); PB7.ff(0.6);
    const before=PB7.state().ball;
    PB7.nudge(); PB7.ff(0.35);
    const after=PB7.state().ball;
    const moved=after?Math.hypot(after.x-before.x,after.y-before.y):99;
    return { before:[before.x,before.y], after:after?[after.x,after.y]:null,
      moved:+moved.toFixed(1), tilted: PB7.state().tilted };
  });
  (unstick.moved>=8&&!unstick.tilted)
    ? ok('nudge unsticks a ball cradled on the flipper (moved '+unstick.moved+'px, no tilt)')
    : fail('nudge too weak for a stuck ball: '+JSON.stringify(unstick));

  const tilt = await p.evaluate(()=>{
    PB7.start(); PB7.launch(0.5); PB7.ff(0.4);
    PB7.setBall(80,120,0,0);
    PB7.nudge(); PB7.nudge(); PB7.nudge(); PB7.nudge();
    return PB7.state().tilted;
  });
  tilt ? ok('four fast nudges = TILT') : fail('no tilt after 4 nudges');

  const over = await p.evaluate(()=>{
    PB7.start();
    PB7.setBall(80,110,0,-260); PB7.ff(0.5);
    for(let i=0;i<3;i++){ PB7.setBall(80,270,0,300); PB7.ff(1.0); }
    return PB7.state();
  });
  (over.mode==='over'&&over.hi>0)
    ? ok('three drains: game over, high score '+over.hi+' recorded') : fail('over: '+JSON.stringify(over));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.PB7);
  const persist = await p.evaluate(()=>PB7.state().hi);
  persist>0 ? ok('high score survives reload ('+persist+')') : fail('persist: '+persist);

  await p.evaluate(()=>{ PB7.start(); PB7.launch(0.8); PB7.ff(0.8); });
  await p.waitForTimeout(300);
  await p.screenshot({path:SP+'pb7.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
