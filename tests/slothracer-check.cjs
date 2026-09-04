const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:460,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/slothracer/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SR);

  const boot = await p.evaluate(()=>({
    courses: SR.COURSES.length,
    help: document.getElementById('helpOv').classList.contains('show'),
    st: SR.state() }));
  (boot.courses===3&&boot.help&&boot.st.mode==='menu'&&boot.st.races===0)
    ? ok('boots to the jungle menu: 3 courses, rules overlay, fresh career')
    : fail('boot: '+JSON.stringify(boot));

  const start = await p.evaluate(()=>{
    SR.dismiss(); SR.seed(7); SR.start(0);
    return SR.state();
  });
  (start.mode==='race'&&start.pos===0&&start.len===320&&start.ai.every(a=>a===0))
    ? ok('The Branch begins: everyone at the start line, 10 metres of destiny')
    : fail('start: '+JSON.stringify(start));

  const good = await p.evaluate(()=>{
    SR.setBreath(0.2); SR.tap();
    const s1=SR.state();
    SR.ff(3);
    return { s1, s2: SR.state() };
  });
  (good.s1.streak===1&&good.s1.pending>10&&good.s2.pos>3)
    ? ok('a breath at the still point: zen +1, a long smooth pull follows')
    : fail('good: '+JSON.stringify(good));

  const bad = await p.evaluate(()=>{
    SR.setBreath(2.2); SR.tap();
    return SR.state();
  });
  (bad.yawn>2&&bad.streak===0)
    ? ok('rushing mid-breath: the sloth yawns, zen resets — hurrying never pays')
    : fail('bad: '+JSON.stringify(bad));

  const drift = await p.evaluate(()=>{
    SR.start(0);
    SR.ff(10);
    return SR.state();
  });
  (drift.pos>=8&&drift.pos<=13)
    ? ok('no taps at all: the sloth still inches forward ('+drift.pos+' units in 10s)')
    : fail('drift: '+JSON.stringify(drift));

  const doubleTap = await p.evaluate(()=>{
    SR.start(0);
    SR.setBreath(0.1); SR.tap(); SR.tap(); SR.tap();
    return SR.state();
  });
  (doubleTap.streak===1&&doubleTap.yawn===0)
    ? ok('eager extra taps in one still point are gently ignored')
    : fail('doubleTap: '+JSON.stringify(doubleTap));

  const flutter = await p.evaluate(()=>{
    SR.start(0);
    for(let k=0;k<3;k++){ SR.setBreath(0.1); SR.tap(); SR.ff(4.4); }
    return SR.state();
  });
  (flutter.streak>=3&&flutter.flutter>=1)
    ? ok('three calm breaths in a row: a butterfly lands ('+flutter.flutter+')')
    : fail('flutter: '+JSON.stringify(flutter));

  const snail = await p.evaluate(()=>{
    SR.start(0); SR.ff(20);
    return SR.state().snail;
  });
  (snail>15&&snail<21)
    ? ok('the snail is out there, making steady progress ('+snail+')')
    : fail('snail: '+snail);

  const auto = await p.evaluate(()=>{
    SR.seed(11); SR.start(0); SR.setAuto(true);
    SR.ff(300);
    const st=SR.state();
    SR.setAuto(false);
    return st;
  });
  (auto.mode==='done'&&auto.place>=1&&auto.place<=4&&auto.raceT>50&&auto.raceT<200
    &&auto.races===1&&auto.pb.c0>0)
    ? ok('AUTO zen mode finishes the race: place '+auto.place+' in '+Math.round(auto.raceT)+'s, PB saved')
    : fail('auto: '+JSON.stringify({mode:auto.mode,place:auto.place,t:auto.raceT,races:auto.races,pb:auto.pb}));

  const unlock = await p.evaluate(()=>{
    SR.menu();
    return { races: SR.state().races };
  });
  unlock.races>=1
    ? ok('The Long Yawn unlocks after your first finish')
    : fail('unlock: '+JSON.stringify(unlock));

  const course3 = await p.evaluate(()=>{
    SR.start(2);
    return SR.state();
  });
  (course3.len===560&&course3.mode==='race')
    ? ok('The Long Yawn: 20 metres, 560 units of patience')
    : fail('course3: '+JSON.stringify(course3));

  const commentary = await p.evaluate(()=>{
    const c1=SR.state().comment;
    SR.ff(12);
    const c2=SR.state().comment;
    return { c1, c2, changed: c1!==c2&&c2.length>0 };
  });
  commentary.changed
    ? ok('deadpan commentary rotates ("'+commentary.c2+'")')
    : fail('commentary: '+JSON.stringify(commentary));

  const toggles = await p.evaluate(()=>{
    const m0=SR.state().music;
    document.getElementById('musBtn').click();
    const m1=SR.state().music;
    document.getElementById('musBtn').click();
    return { m0, m1, m2: SR.state().music };
  });
  (toggles.m0===true&&toggles.m1===false&&toggles.m2===true)
    ? ok('ambient kalimba toggles on ♪') : fail('toggles: '+JSON.stringify(toggles));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.SR);
  const persist = await p.evaluate(()=>SR.state());
  (persist.races>=1&&persist.pb.c0>0)
    ? ok('career and personal bests survive reload')
    : fail('persist: '+JSON.stringify({races:persist.races,pb:persist.pb}));

  await p.evaluate(()=>{ SR.dismiss(); SR.seed(5); SR.start(0);
    SR.setBreath(0.1); SR.tap(); SR.ff(6);
    SR.setBreath(0.1); SR.tap(); SR.ff(6);
    SR.setBreath(0.1); SR.tap(); });
  await p.waitForTimeout(700);
  await p.screenshot({path:SP+'sloth.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
