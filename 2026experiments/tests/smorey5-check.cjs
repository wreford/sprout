const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:640,height:900},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/smorey5/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM5);

  const boot = await p.evaluate(()=>({
    st: SM5.state(), boards: SM5.BOARDS.length, rules: SM5.RULEDEF.length,
    w: document.getElementById('cv').width }));
  (boot.st.mode==='attract'&&boot.boards===5&&boot.rules===6&&boot.w===832
    &&boot.st.xp>=0&&boot.st.level>=0)
    ? ok('boots: 5 boards, 6 house rules, XP ledger live')
    : fail('boot: '+JSON.stringify(boot));

  const classic = await p.evaluate(()=>{
    SM5.seed(7); SM5.setBoard('classic');
    ["quick","spicy","gentle","sudden","slippery","cozy"].forEach(k=>SM5.setRule(k,false));
    SM5.start();
    SM5.setPawn(0,0,14); SM5.setCard(3); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===17));
    return SM5.state();
  });
  (classic.slides===8&&classic.pawns[0][0]===20)
    ? ok('classic board carries over: land 17, ride to 20') : fail('classic: '+JSON.stringify(classic));

  const royale = await p.evaluate(()=>{
    SM5.setBoard('royale'); SM5.start();
    SM5.setPawn(0,0,13); SM5.setCard(3); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===16));
    return SM5.state();
  });
  (royale.slides===8&&royale.pawns[0][0]===21)
    ? ok('RAPIDS ROYALE: monster five carries 16 → 21') : fail('royale: '+JSON.stringify(royale));

  const tangle = await p.evaluate(()=>{
    SM5.setBoard('tangle'); SM5.start();
    SM5.setPawn(0,0,16); SM5.setCard(2); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===18));
    return SM5.state();
  });
  (tangle.slides===20&&tangle.pawns[0][0]===20)
    ? ok('THE TANGLE: twenty little hops, Choco\'s 18 skips you to 20') : fail('tangle: '+JSON.stringify(tangle));

  const slippery = await p.evaluate(()=>{
    SM5.setBoard('classic');
    SM5.setRule('slippery',true); SM5.start();
    SM5.setPawn(0,0,1); SM5.setCard(1); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===2));
    const on=SM5.state().pawns[0][0];
    SM5.setRule('slippery',false); SM5.start();
    SM5.setPawn(0,0,1); SM5.setCard(1); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===2));
    const off=SM5.state().pawns[0][0];
    return { on, off };
  });
  (slippery.on===5&&slippery.off===2)
    ? ok('SLIPPERY LOGS: your own slide carries you (2→5), off it does not')
    : fail('slippery: '+JSON.stringify(slippery));

  const toastxp = await p.evaluate(()=>{
    SM5.start();
    const x0=SM5.state().xp, t0=SM5.state().career.toasts;
    SM5.setPawn(0,0,7); SM5.setPawn(1,0,55);
    SM5.setCard(3); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.pj===0&&m.dest===10));
    const st=SM5.state();
    return { dx: st.xp-x0, dt: st.career.toasts-t0, them: st.pawns[1][0] };
  });
  (toastxp.dx>=10&&toastxp.dt===1&&toastxp.them===-1)
    ? ok('toasting a rival earns +10 XP and a career toast')
    : fail('toastxp: '+JSON.stringify(toastxp));

  const music = await p.evaluate(()=>{
    const seq=[SM5.state().mus];
    for(let i=0;i<4;i++){ SM5.cycleMusic(); seq.push(SM5.state().mus); }
    return { seq: seq.join(','), label: document.getElementById('oMus').textContent };
  });
  (music.seq==='calm,star,hype,off,calm'&&music.label==='MUSIC CALM')
    ? ok('music cycles CALM → STAR → HYPE → OFF, starlight in the rotation')
    : fail('music: '+JSON.stringify(music));

  const cam = await p.evaluate(()=>{
    document.getElementById('oCam').click();
    const a=SM5.state().cam;
    const lbl=document.getElementById('oCam').textContent;
    document.getElementById('oCam').click();
    return { a, lbl, back: SM5.state().cam };
  });
  (cam.a==='orbit'&&cam.lbl==='CAM ORBIT'&&cam.back==='sway')
    ? ok('camera toggles SWAY ↔ ORBIT') : fail('cam: '+JSON.stringify(cam));

  const duo = await p.evaluate(()=>{
    SM5.setHumans(2); SM5.start();
    SM5.setCard(3); SM5.draw(); SM5.ff(1.5);
    const st=SM5.state();
    SM5.setHumans(1);
    return { turn: st.turn, phase: st.phase, humans: st.humans };
  });
  (duo.turn===1&&duo.phase==='draw'&&duo.humans===2)
    ? ok('pass-and-play: with 2 campers human, Choco waits for a human draw')
    : fail('duo: '+JSON.stringify(duo));

  const trophies = await p.evaluate(()=>{
    SM5.openTrophies();
    const m1=SM5.state().mode;
    SM5.setup();
    return { m1, m2: SM5.state().mode };
  });
  (trophies.m1==='trophies'&&trophies.m2==='setup')
    ? ok('trophy cabinet opens and closes') : fail('trophies: '+JSON.stringify(trophies));

  const cpus = await p.evaluate(()=>{
    SM5.start(); SM5.setCard(3); SM5.draw(); SM5.ff(1.5);
    const d0=SM5.state().deck;
    SM5.ff(12);
    const st=SM5.state();
    return { turn: st.turn, phase: st.phase, drew: d0-st.deck>=2, mode: st.mode };
  });
  (cpus.turn===0&&cpus.phase==='draw'&&cpus.drew&&cpus.mode==='play')
    ? ok('crafty AI campers play a clean full round back to Mallow')
    : fail('cpus: '+JSON.stringify(cpus));

  const sudden = await p.evaluate(()=>{
    SM5.setRule('sudden',true); SM5.start();
    SM5.setPawn(0,0,65); SM5.setPawn(0,1,64);
    SM5.setCard(1); SM5.draw();
    SM5.play(SM5.moves().findIndex(m=>m.dest===65));
    const st=SM5.state();
    SM5.setRule('sudden',false);
    return st;
  });
  (sudden.mode==='over'&&sudden.winner===0&&sudden.standings&&sudden.standings[0]===0)
    ? ok('SUDDEN S\'MORES: two mallows home ends it — Mallow tops the standings')
    : fail('sudden: '+JSON.stringify({mode:sudden.mode,winner:sudden.winner,standings:sudden.standings}));

  const gam = await p.evaluate(()=>SM5.state());
  (gam.wins>=1&&gam.xp>=150&&gam.achCount>=2)
    ? ok('victory pays: '+gam.xp+' XP, level '+gam.level+', '+gam.achCount+' trophies unlocked')
    : fail('gam: '+JSON.stringify({wins:gam.wins,xp:gam.xp,ach:gam.achCount}));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SM5);
  const persist = await p.evaluate(()=>{
    const st=SM5.state();
    return { wins: st.wins, xp: st.xp, ach: st.achCount, board: st.board };
  });
  (persist.wins>=1&&persist.xp>=150&&persist.ach>=2)
    ? ok('XP, trophies, and record survive reload')
    : fail('persist: '+JSON.stringify(persist));

  const core = await p.evaluate(()=>{
    SM5.setBoard('classic'); SM5.start();
    SM5.setPawn(0,0,2); SM5.setCard(4); SM5.draw();
    const back=SM5.moves().find(m=>m.pj===0);
    SM5.setRule('gentle',true); SM5.start();
    SM5.setPawn(0,0,20); SM5.setCard(4); SM5.draw();
    const fwd=SM5.moves().find(m=>m.pj===0);
    SM5.setRule('gentle',false);
    SM5.setRule('spicy',true); SM5.start();
    const spicyDeck=SM5.state().deck;
    SM5.setRule('spicy',false);
    return { back: back&&back.dest, fwd: fwd&&fwd.dest, spicyDeck };
  });
  (core.back===58&&core.fwd===24&&core.spicyDeck===49)
    ? ok('legacy rules intact: backward wrap, gentle fours, spicy 49-card deck')
    : fail('core: '+JSON.stringify(core));

  await p.evaluate(()=>{ SM5.setBoard('royale'); SM5.seed(42); SM5.start();
    SM5.setPawn(0,0,12); SM5.setPawn(1,0,30); SM5.setPawn(2,2,8); SM5.setPawn(3,1,50);
    SM5.setCard(8); SM5.draw(); });
  await p.waitForTimeout(1000);
  await p.screenshot({path:SP+'sm5-play.png'});
  await p.evaluate(()=>{ SM5.setup(); });
  await p.waitForTimeout(300);
  await p.screenshot({path:SP+'sm5-setup.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
