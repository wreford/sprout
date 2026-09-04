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
  (boot.vents===12&&boot.shopRows===21&&boot.help&&boot.st.treats===0&&boot.st.title==='Derp Intern')
    ? ok('boots: 12 ventures, training, 6 dream perks, nap and Save Keeper in the shop')
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
    KT.quiet(); KT.reset(); KT.give(200); KT.buyVent(1);
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
    KT.quiet();
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

  const mil = await p.evaluate(()=>{
    KT.reset(); KT.setVent(1,25);
    const r25=KT.state().rate;
    KT.setVent(1,50);
    const r50=KT.state().rate;
    KT.setVent(1,0);
    return { r25, r50 };
  });
  (mil.r25===50&&mil.r50===200)
    ? ok('milestones: 25 boxes doubles the Bureau (50/s), 50 doubles it again (200/s)')
    : fail('mil: '+JSON.stringify(mil));

  const perks = await p.evaluate(()=>{
    KT.reset(); KT.setYarn(3);
    const okP=KT.buyPerk('beans');
    const cc=KT.state().critChance, yLeft=KT.state().yarn;
    KT.setYarn(4); KT.buyPerk('zoomp');
    KT.spawn('zoom');
    const zl=KT.state().zoom;
    KT.setYarn(25); KT.buyPerk('weaver');
    KT.setYarn(2);
    const bv=KT.state().boopVal;
    return { okP, cc, yLeft, zl, bv, owned: KT.state().perks.length };
  });
  (perks.okP&&perks.cc===0.15&&perks.yLeft===0&&perks.zl>15
    &&Math.abs(perks.bv-1.4)<.001&&perks.owned===3)
    ? ok('dream perks: softer beans 15% crits, 20s zoomies, Dream Weaver doubles yarn power')
    : fail('perks: '+JSON.stringify(perks));

  const bulk = await p.evaluate(()=>{
    KT.reset();
    const c10=KT.bulkCost(0,10);
    KT.give(c10);
    const okB=KT.buyVent(0,10);
    const st=KT.state();
    return { c10, okB, owned: st.vent[0], left: st.treats };
  });
  (bulk.okB&&bulk.owned===10&&bulk.left===0&&bulk.c10>100)
    ? ok('bulk hiring: ×10 untanglers for exactly '+bulk.c10+' treats, not a crumb more')
    : fail('bulk: '+JSON.stringify(bulk));

  const maxb = await p.evaluate(()=>{
    KT.reset(); KT.give(1000);
    const n=KT.maxAfford(0);
    KT.buyVent(0,'max');
    const st=KT.state();
    return { n, owned: st.vent[0], left: st.treats, next: st.costs[0] };
  });
  (maxb.n>5&&maxb.owned===maxb.n&&maxb.left<maxb.next)
    ? ok('MAX buy: '+maxb.n+' hires on 1000 treats, wallet left below the next price')
    : fail('maxb: '+JSON.stringify(maxb));

  const qtyUi = await p.evaluate(()=>{
    KT.setQty(10);
    const q1=KT.state().qty;
    const lit=document.querySelector('#qtyRow button.on');
    KT.setQty(1);
    return { q1, pill: lit?lit.dataset.q:null,
      pills: document.querySelectorAll('#qtyRow button').length };
  });
  (qtyUi.q1===10&&qtyUi.pill==='10'&&qtyUi.pills===3)
    ? ok('quantity pills: ×1 / ×10 / MAX, selection lights up and sticks')
    : fail('qtyUi: '+JSON.stringify(qtyUi));

  const saveio = await p.evaluate(()=>{
    KT.reset(); KT.give(777); KT.buyVent(0,3);
    const kept=KT.state();
    const s1=KT.exportStr();
    KT.reset();
    const okBad=KT.importStr('definitely not a sammy save');
    const wiped=KT.state().treats;
    const okGood=KT.importStr(s1);
    const st=KT.state();
    return { pfx: s1.startsWith('SAMMY1.'), okBad, wiped, okGood,
      treats: st.treats, owned: st.vent[0],
      wantTreats: kept.treats, wantOwned: kept.vent[0],
      btns: !!document.getElementById('expBtn')&&!!document.getElementById('impBtn') };
  });
  (saveio.pfx&&saveio.okBad===false&&saveio.wiped===0&&saveio.okGood===true
    &&saveio.treats===saveio.wantTreats&&saveio.owned===saveio.wantOwned&&saveio.btns)
    ? ok('Save Keeper: export makes a SAMMY1 file, garbage is refused, import restores the empire')
    : fail('saveio: '+JSON.stringify(saveio));

  const noscroll = await p.evaluate(()=>({
    bodyX: document.body.scrollWidth<=document.body.clientWidth,
    docX: document.documentElement.scrollWidth<=document.documentElement.clientWidth,
    meta: document.querySelector('meta[name=viewport]').content.includes('maximum-scale=1') }));
  (noscroll.bodyX&&noscroll.docX&&noscroll.meta)
    ? ok('no sideways scroll, no pinch zoom: the page is locked to the viewport')
    : fail('noscroll: '+JSON.stringify(noscroll));

  await p.evaluate(()=>{ KT.reset(); KT.give(2100000); KT.nap(); });
  await p.evaluate(()=>KT.save());
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KT);
  const persist = await p.evaluate(()=>{
    KT.dismiss();
    return { yarn: KT.state().yarn, naps: KT.state().naps };
  });
  (persist.yarn===2&&persist.naps===1)
    ? ok('the empire survives reload: yarn and naps intact')
    : fail('persist: '+JSON.stringify(persist));

  await p.evaluate(()=>{ KT.give(400); KT.buyVent(1); KT.save(); });

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
