const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:460,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/kiwibench/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KW);

  const boot = await p.evaluate(()=>{
    KW.reset();
    const st=KW.state();
    return { orders: KW.ORDERS.length, cur: st.order, unlocked: st.unlocked,
      blank: KW.profile().every(r=>r===60),
      help: document.getElementById('helpOv').classList.contains('show'),
      rows: document.querySelectorAll('.ord').length,
      locked: document.querySelectorAll('.ord.locked').length };
  });
  (boot.orders===6&&boot.cur==='pin'&&boot.unlocked===1&&boot.blank
    &&boot.rows===6&&boot.locked===5)
    ? ok('boots: 6 orders, only the Rolling Pin unlocked, a fresh full blank in the chuck')
    : fail('boot: '+JSON.stringify(boot));

  const cad = await p.evaluate(()=>{
    KW.setCad([0.9,0.8,0.5,0.3,0.5,0.7,0.5,0.3,0.2]);
    const t=KW.target();
    const accBefore=KW.accuracy();
    return { mid: t[24], end: t[47], hi: t[0], accBefore };
  });
  (cad.mid>25&&cad.mid<40&&cad.end<20&&cad.hi>45&&cad.accBefore<0.9)
    ? ok('CAD: control points spline into a target profile, match meter reads the gap')
    : fail('cad: '+JSON.stringify(cad));

  const carve = await p.evaluate(()=>{
    KW.carve(10,30);
    const r1=KW.profile()[10];
    KW.carve(10,55);
    const r2=KW.profile()[10];
    return { r1, r2 };
  });
  (Math.abs(carve.r1-30)<2&&Math.abs(carve.r2-carve.r1)<2)
    ? ok('lathe truth: the gouge cuts to depth, and wood never grows back')
    : fail('carve: '+JSON.stringify(carve));

  const sanding = await p.evaluate(()=>{
    const jag=[];
    for(let i=0;i<48;i++)jag.push(30+(i%2?6:-6));
    KW.setProfile(jag);
    const sdBefore=Math.sqrt(jag.reduce((a,v)=>a+(v-30)*(v-30),0)/48);
    KW.sand(3);
    const after=KW.profile();
    const m=after.reduce((a,v)=>a+v,0)/48;
    const sdAfter=Math.sqrt(after.reduce((a,v)=>a+(v-m)*(v-m),0)/48);
    return { sdBefore, sdAfter };
  });
  (sanding.sdAfter<sanding.sdBefore*0.5)
    ? ok('sandpaper smooths a jagged part (roughness '+sanding.sdBefore.toFixed(1)+' → '+sanding.sdAfter.toFixed(1)+')')
    : fail('sanding: '+JSON.stringify(sanding));

  const pin = await p.evaluate(()=>{
    KW.setOrder(0);
    KW.setProfile(Array(48).fill(30));
    const smooth=KW.test();
    const jag=[];for(let i=0;i<48;i++)jag.push(30+(i%3?8:-8));
    KW.setProfile(jag);
    const lumpy=KW.test();
    return { smooth: smooth.stars, lumpy: lumpy.stars };
  });
  (pin.smooth===3&&pin.lumpy<=1)
    ? ok('rolling pin physics: perfect cylinder = ⭐⭐⭐, lumpy log disappoints Mom')
    : fail('pin: '+JSON.stringify(pin));

  const top = await p.evaluate(()=>{
    KW.setOrder(1);
    const cone=[];for(let i=0;i<48;i++)cone.push(Math.max(4,55-i*1.15));
    KW.setProfile(cone);
    const good=KW.test();
    KW.setProfile(Array(48).fill(60));
    const log=KW.test();
    return { spin: good.spinT, goodStars: good.stars, logStars: log.stars };
  });
  (top.spin>=8&&top.goodStars>=2&&top.logStars===0)
    ? ok('top physics: sharp cone spins '+top.spin.toFixed(1)+'s, an uncarved log spins 0s')
    : fail('top: '+JSON.stringify(top));

  const pawn = await p.evaluate(()=>{
    KW.setOrder(3);
    const good=[];
    for(let i=0;i<48;i++)good.push(i<4?40:i<21?14:i<41?28:20);
    KW.setProfile(good);
    const g=KW.test();
    const thin=good.map((v,i)=>i>=8&&i<16?5:v);
    KW.setProfile(thin);
    const snap=KW.test();
    return { gStars: g.stars, gSnap: g.snap, sSnap: snap.snap, sStars: snap.stars };
  });
  (pawn.gStars===3&&!pawn.gSnap&&pawn.sSnap&&pawn.sStars===0)
    ? ok('pawn physics: shapely pawn survives the bonks, needle-neck SNAPS')
    : fail('pawn: '+JSON.stringify(pawn));

  const batWheel = await p.evaluate(()=>{
    KW.setOrder(2);
    KW.setProfile(Array(48).fill(58));
    const wheel=KW.test();
    KW.setOrder(4);
    const bat=[];for(let i=0;i<48;i++)bat.push(i<10?12:12+(i-10)*0.85);
    KW.setProfile(bat);
    const batR=KW.test();
    return { wheelDist: wheel.dist, wheelStars: wheel.stars,
      batDist: batR.dist, batStars: batR.stars };
  });
  (batWheel.wheelDist>=52&&batWheel.wheelStars===3&&batWheel.batDist>=40&&batWheel.batStars>=2)
    ? ok('wheel rolls '+batWheel.wheelDist.toFixed(0)+'m, bat sends it '+batWheel.batDist.toFixed(0)+'m over the fence')
    : fail('batWheel: '+JSON.stringify(batWheel));

  const trophy = await p.evaluate(()=>{
    KW.setOrder(5);
    const t=[];
    for(let i=0;i<48;i++)t.push(i<4?42:i<11?30:i<17?40:i<25?22:i<31?34:i<41?16:10);
    KW.setProfile(t);
    const r=KW.test();
    return { stars: r.stars, beads: r.beads, pass: r.pass };
  });
  (trophy.pass&&trophy.beads>=2&&trophy.stars>=2)
    ? ok('trophy physics: '+trophy.beads+' fancy beads, stands steady — horse show ready')
    : fail('trophy: '+JSON.stringify(trophy));

  const flow = await p.evaluate(()=>{
    KW.reset(); KW.setOrder(0);
    KW.setProfile(Array(48).fill(30));
    KW.runTest();
    return true;
  });
  await p.waitForTimeout(3200);
  const flowRes = await p.evaluate(()=>{
    const st=KW.state();
    return { stars: st.stars.pin, unlocked: st.unlocked,
      ov: document.getElementById('resultOv').classList.contains('show'),
      shelf: document.querySelectorAll('#shelf canvas').length,
      title: document.getElementById('resTitle').textContent };
  });
  (flowRes.stars===3&&flowRes.unlocked===2&&flowRes.ov&&flowRes.shelf===1
    &&flowRes.title==='PERFECT PART!')
    ? ok('full loop: run rig → ⭐⭐⭐ → next order unlocks → part goes on the shelf')
    : fail('flow: '+JSON.stringify(flowRes));

  await p.evaluate(()=>KW.save());
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KW);
  const persist = await p.evaluate(()=>{
    const st=KW.state();
    return { stars: st.stars.pin, unlocked: st.unlocked, parts: st.parts,
      help: document.getElementById('helpOv').classList.contains('show') };
  });
  (persist.stars===3&&persist.unlocked===2&&persist.parts===1&&!persist.help)
    ? ok('workshop survives reload: stars, unlocks and shelf intact, no re-tutorial')
    : fail('persist: '+JSON.stringify(persist));

  const noscroll = await p.evaluate(()=>({
    bodyX: document.body.scrollWidth<=document.body.clientWidth,
    docX: document.documentElement.scrollWidth<=document.documentElement.clientWidth,
    meta: document.querySelector('meta[name=viewport]').content.includes('maximum-scale=1') }));
  (noscroll.bodyX&&noscroll.docX&&noscroll.meta)
    ? ok('locked viewport: no sideways scroll, no pinch zoom')
    : fail('noscroll: '+JSON.stringify(noscroll));

  await p.evaluate(()=>{ KW.dismiss(); KW.setTab('lathe');
    const t=KW.target();
    for(let i=0;i<48;i++)KW.setProfile(KW.profile().map((v,k)=>Math.max(t[k]+2,20)));
  });
  await p.waitForTimeout(500);
  await p.screenshot({path:SP+'kiwibench.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
