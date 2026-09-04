const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:460,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/sammy/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KT);

  const boot = await p.evaluate(()=>({
    vents: KT.VENTS.length,
    shopRows: document.querySelectorAll('#shop .v').length,
    help: document.getElementById('helpOv').classList.contains('show'),
    st: KT.state() }));
  (boot.vents===8&&boot.shopRows===10&&boot.help&&boot.st.treats===0&&boot.st.title==='Derp Intern')
    ? ok('boots: 8 ventures + training + nap in the shop, a fresh Derp Intern')
    : fail('boot: '+JSON.stringify(boot));

  const boop = await p.evaluate(()=>{
    KT.dismiss(); KT.seed(3);
    const t0=KT.state().treats;
    KT.boop();
    return { gained: KT.state().treats-t0, boops: KT.state().boops };
  });
  (boop.gained>=1&&boop.boops===1)
    ? ok('a boop earns treats (+'+boop.gained+')') : fail('boop: '+JSON.stringify(boop));

  const crits = await p.evaluate(()=>{
    for(let k=0;k<80;k++) KT.boop();
    return KT.state();
  });
  (crits.crits>=2&&crits.treats>80)
    ? ok('MEGA DERPs land about 1 in 10 ('+crits.crits+' crits in 81 boops)')
    : fail('crits: '+JSON.stringify({crits:crits.crits,treats:crits.treats}));

  const buy = await p.evaluate(()=>{
    KT.give(100);
    const c0=KT.state().costs[0];
    const okBuy=KT.buyVent(0);
    const st=KT.state();
    return { c0, okBuy, owned: st.vent[0], c1: st.costs[0], rate: st.rate };
  });
  (buy.okBuy&&buy.owned===1&&buy.c1>buy.c0&&buy.rate>0)
    ? ok('hiring the Yarn Untangling Service: cost paid, rate starts, price escalates')
    : fail('buy: '+JSON.stringify(buy));

  const poor = await p.evaluate(()=>{
    KT.reset();
    return { okBuy: KT.buyVent(7), treats: KT.state().treats };
  });
  (!poor.okBuy&&poor.treats===0)
    ? ok('Sammy Aerospace politely declines the unfunded') : fail('poor: '+JSON.stringify(poor));

  const idle = await p.evaluate(()=>{
    KT.reset(); KT.give(200); KT.buyVent(1);
    const t0=KT.state().treats;
    KT.ff(10);
    return { gained: KT.state().treats-t0 };
  });
  (idle.gained>=9.5&&idle.gained<=11)
    ? ok('the Box Inspection Bureau earns 1/s while you watch ('+idle.gained.toFixed(1)+' in 10s)')
    : fail('idle: '+JSON.stringify(idle));

  const train = await p.evaluate(()=>{
    KT.give(500);
    const v0=KT.state().boopVal;
    KT.buyBoop();
    return { v0, v1: KT.state().boopVal };
  });
  (train.v0===1&&train.v1===4)
    ? ok('boop training: toe beans conditioned, boop ×4') : fail('train: '+JSON.stringify(train));

  const dot = await p.evaluate(()=>{
    KT.spawn('dot');
    const e1=KT.state().event;
    const t0=KT.state().treats;
    KT.tapEvent();
    return { e1, gained: KT.state().treats-t0, dots: KT.state().dots, after: KT.state().event };
  });
  (dot.e1==='dot'&&dot.gained>=50&&dot.dots===1&&dot.after===null)
    ? ok('the red dot: caught (+'+Math.round(dot.gained)+')') : fail('dot: '+JSON.stringify(dot));

  const vase = await p.evaluate(()=>{
    KT.spawn('vase');
    const t0=KT.state().treats;
    KT.tapEvent();
    return { gained: KT.state().treats-t0, vases: KT.state().vases };
  });
  (vase.gained>=80&&vase.vases===1)
    ? ok('the vase: relocated to the floor (+'+Math.round(vase.gained)+')') : fail('vase: '+JSON.stringify(vase));

  const zoom = await p.evaluate(()=>{
    KT.spawn('zoom');
    const r1=KT.state().rate, z=KT.state().zoom;
    KT.ff(15);
    return { r1, z, r2: KT.state().rate };
  });
  (zoom.z>10&&zoom.r1>=zoom.r2*2.9&&zoom.r1<=zoom.r2*3.1)
    ? ok('ZOOMIES: production ×3 for 12 seconds, then calm returns')
    : fail('zoom: '+JSON.stringify(zoom));

  const nap = await p.evaluate(()=>{
    KT.reset();
    const early=KT.nap();
    KT.give(2100000);
    const g=KT.state().napGain;
    const add=KT.nap();
    const st=KT.state();
    return { early, g, add, yarn: st.yarn, treats: st.treats, vent0: st.vent[0], naps: st.naps };
  });
  (nap.early===false&&nap.g===2&&nap.add===2&&nap.yarn===2&&nap.treats===0&&nap.naps===1)
    ? ok('Take a Nap: refused when broke, then dreams +2 yarn and resets the empire')
    : fail('nap: '+JSON.stringify(nap));

  const mult = await p.evaluate(()=>{
    const bv=KT.state().boopVal;
    KT.give(200); KT.buyVent(1);
    return { bv, rate: KT.state().rate };
  });
  (Math.abs(mult.bv-1.2)<.001&&Math.abs(mult.rate-1.2)<.01)
    ? ok('dream yarn pays forever: +20% on boops and ventures alike')
    : fail('mult: '+JSON.stringify(mult));

  const title = await p.evaluate(()=>{
    KT.give(30000);
    return KT.state().title;
  });
  title==='Derp Manager'
    ? ok('career progression: Sammy is now a '+title) : fail('title: '+title);

  const head = await p.evaluate(async ()=>{
    const h1=KT.state().headline;
    KT.ff(20);
    return { h1, h2: KT.state().headline };
  });
  (head.h2&&head.h1!==head.h2)
    ? ok('the financial press keeps up ("'+head.h2+'")') : fail('head: '+JSON.stringify(head));

  const fmt2 = await p.evaluate(()=>[KT.fmt(950),KT.fmt(1500),KT.fmt(2500000),KT.fmt(7.2e9)].join('|'));
  fmt2==='950|1.5k|2.5M|7.2B'
    ? ok('big numbers stay readable ('+fmt2+')') : fail('fmt: '+fmt2);

  await p.evaluate(()=>KT.save());
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KT);
  const persist = await p.evaluate(()=>{
    KT.dismiss();
    return { yarn: KT.state().yarn, naps: KT.state().naps, vent1: KT.state().vent[1] };
  });
  (persist.yarn===2&&persist.naps===1&&persist.vent1===1)
    ? ok('the empire survives reload: yarn, naps, and hires intact')
    : fail('persist: '+JSON.stringify(persist));

  const offline = await p.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('sammy'));
    s.ts=Date.now()-3600*1000;
    localStorage.setItem('sammy',JSON.stringify(s));
    localStorage.setItem=()=>{};
    return true;
  });
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KT);
  const back = await p.evaluate(()=>({
    shown: document.getElementById('backOv').classList.contains('show'),
    text: document.getElementById('backText').textContent,
    treats: KT.state().treats }));
  (back.shown&&back.text.includes('table')&&back.treats>2000)
    ? ok('offline earnings: an hour away pays half rate, with a welcome-back note')
    : fail('offline: '+JSON.stringify({shown:back.shown,treats:back.treats}));

  await p.evaluate(()=>{ KT.dismiss(); KT.spawn('dot'); });
  await p.waitForTimeout(700);
  await p.screenshot({path:SP+'sammy.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
