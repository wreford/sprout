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
  (boot.vents===12&&boot.shopRows===22&&boot.help&&boot.st.treats===0&&boot.st.title==='Derp Intern'
    &&boot.st.eggs===0)
    ? ok('boots: 12 ventures, training, 7 dream perks, nap and Save Keeper in the shop')
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
    const st0=KT.state();
    KT.give(200); KT.buyVent(1);
    return { bv: st0.boopVal, em: st0.eggMult, rate: KT.state().rate, em2: KT.state().eggMult };
  });
  (Math.abs(mult.bv-1.2*mult.em)<.001&&Math.abs(mult.rate-1.2*mult.em2)<.01)
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

  const egg1 = await p.evaluate(()=>{
    KT.reset();
    KT.boop();
    const st=KT.state();
    return { n: st.eggs, ids: st.eggIds,
      btn: document.getElementById('eggBtn').style.display!=='none' };
  });
  (egg1.n===1&&egg1.ids.includes('boop1')&&egg1.btn)
    ? ok('first secret: one boop unlocks First Contact and the \ud83e\udd5a album button appears')
    : fail('egg1: '+JSON.stringify(egg1));

  const album = await p.evaluate(()=>{
    KT.openEggs();
    const cells=document.querySelectorAll('#eggGrid .egg');
    const got=document.querySelectorAll('#eggGrid .egg.got');
    const title=document.getElementById('eggTitle').textContent;
    cells[cells.length-1].click();
    const hint=document.getElementById('eggHint').textContent;
    KT.dismiss();
    return { total: cells.length, got: got.length, title, hint, defs: KT.EGGS.length };
  });
  (album.total===50&&album.defs===50&&album.got===1&&album.title.includes('1/50')
    &&album.hint.includes('every other secret'))
    ? ok('the album: 50 secrets defined, one lit, hidden ones give cryptic hints')
    : fail('album: '+JSON.stringify(album));

  const eggBonus = await p.evaluate(()=>{
    KT.reset();
    KT.EGGS.slice(0,10).forEach(eg=>KT.egg(eg.id));
    const em=KT.state().eggMult;
    KT.give(200); KT.buyVent(1);
    return { em, rate: KT.state().rate, bow: KT.state().hats.includes('bow') };
  });
  (Math.abs(eggBonus.em-1.1)<.001&&Math.abs(eggBonus.rate-1.1)<.01&&eggBonus.bow)
    ? ok('secrets pay: 10 found = +10% production, and the Fancy Bow hat unlocks')
    : fail('eggBonus: '+JSON.stringify(eggBonus));

  const scenery = await p.evaluate(()=>{
    KT.reset();
    for(let k=0;k<5;k++) KT.tapAt(85,60);
    [[130,196],[286,196],[208,222]].forEach(([x,y])=>KT.tapAt(x,y));
    const ids=KT.state().eggIds;
    return { win: ids.includes('window5'), paws: ids.includes('paws') };
  });
  (scenery.win&&scenery.paws)
    ? ok('scenery secrets: five window taps (Bird Watcher), three paw prints (Follow the Paw Prints)')
    : fail('scenery: '+JSON.stringify(scenery));

  const grow = await p.evaluate(()=>{
    KT.reset(); KT.quiet();
    KT.give(2100000); KT.ff(1);
    const deco=KT.state().deco.slice();
    const held=KT.state().eggIds.includes('hold1m');
    KT.nap(); KT.ff(1);
    KT.setHat('party');
    const st=KT.state();
    return { deco, held, hats: st.hats, hat: st.hat, nap1: st.eggIds.includes('nap1'),
      decoAfterNap: st.deco.length,
      hatBtn: document.getElementById('hatBtn').style.display!=='none' };
  });
  (grow.deco.length===3&&grow.deco.includes('tank')&&grow.held
    &&grow.hats.includes('party')&&grow.hat==='party'&&grow.nap1
    &&grow.decoAfterNap===3&&grow.hatBtn)
    ? ok('gradual unlocks: 3 room decorations at 2.1M lifetime, nap-proof, Party Cone worn')
    : fail('grow: '+JSON.stringify(grow));

  const wardrobe = await p.evaluate(()=>{
    KT.openHats();
    const rows=document.querySelectorAll('.hatRow');
    const locked=document.querySelectorAll('.hatRow.lk');
    const on=document.querySelector('.hatRow.on');
    KT.dismiss();
    return { rows: rows.length, locked: locked.length,
      onName: on?on.querySelector('.nm').textContent:null };
  });
  (wardrobe.rows===9&&wardrobe.locked===7&&wardrobe.onName==='Party Cone')
    ? ok('wardrobe: 9 rows, locked hats show their unlock riddle, Party Cone equipped')
    : fail('wardrobe: '+JSON.stringify(wardrobe));

  const giftT = await p.evaluate(()=>{
    KT.reset(); KT.quiet(); KT.clearGift();
    KT.give(30000); KT.ff(1);
    const shown=KT.state().gift;
    const t0=KT.state().treats;
    KT.tapAt(56,186);
    const gained=KT.state().treats-t0;
    KT.ff(1);
    return { shown, gained, again: KT.state().gift };
  });
  (giftT.shown&&giftT.gained>=300&&giftT.again===false)
    ? ok('daily gift: appears at 25k lifetime, pays out (+'+Math.round(giftT.gained)+'), once per day')
    : fail('gift: '+JSON.stringify(giftT));

  const gold = await p.evaluate(()=>{
    KT.reset(); KT.quiet();
    KT.give(300); KT.buyVent(1);
    const r1=KT.state().rate;
    KT.spawn('gold');
    const ev=KT.state().event;
    KT.tapEvent();
    const st=KT.state();
    const r2=st.rate;
    KT.ff(50);
    return { r1, ev, gold: st.gold, golds: st.golds, r2, r3: KT.state().rate };
  });
  (gold.ev==='gold'&&gold.gold>40&&gold.golds===1
    &&gold.r2>=gold.r1*1.9&&gold.r2<=gold.r1*2.1&&gold.r3<=gold.r1*1.1)
    ? ok('golden yarn: tap it for ×2 production for 45 seconds, then it fades')
    : fail('gold: '+JSON.stringify(gold));

  const robo = await p.evaluate(()=>{
    KT.reset(); KT.quiet(); KT.setYarn(12);
    const okR=KT.buyPerk('robo');
    const t0=KT.state().treats, b0=KT.state().boops;
    KT.ff(10);
    const st=KT.state();
    return { okR, gained: st.treats-t0, boops: st.boops-b0 };
  });
  (robo.okR&&robo.gained>=9&&robo.gained<=11.5&&robo.boops>=9&&robo.boops<=11)
    ? ok('Robo-Paw: 12 yarn buys an auto-booper, one boop per second while you watch')
    : fail('robo: '+JSON.stringify(robo));

  const meta = await p.evaluate(()=>{
    KT.reset();
    KT.EGGS.filter(eg=>eg.id!=='meta').forEach(eg=>KT.egg(eg.id));
    const st=KT.state();
    return { n: st.eggs, meta: st.eggIds.includes('meta'),
      halo: st.hats.includes('halo'), em: st.eggMult };
  });
  (meta.n===50&&meta.meta&&meta.halo&&Math.abs(meta.em-1.5)<.001)
    ? ok('The Completionist: 49 secrets found grants the 50th, the Golden Halo, and +50% forever')
    : fail('meta: '+JSON.stringify(meta));

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

  await p.evaluate(()=>{ KT.dismiss(); KT.setHat('party'); KT.spawn('dot'); });
  await p.waitForTimeout(700);
  await p.screenshot({path:SP+'sammy.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
