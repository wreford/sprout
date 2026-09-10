const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:460,height:860},hasTouch:true});
  await ctx.route(/cdnjs|openstreetmap|wikipedia|open-meteo|fonts\.g/,r=>r.abort());
  let page=null;
  async function open(app,waitFn){
    if(page)await page.close();
    page=await ctx.newPage();
    page.on('pageerror',e=>fail(app+' PAGEERROR: '+e.message.slice(0,140)));
    await page.goto('http://localhost:8899/'+app+'/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(waitFn);
    return page;
  }

  console.log('— parametric —');
  await open('parametric',()=>window.PM);
  const pm=await page.evaluate(()=>{
    const s0=PM.state();
    PM.set('sides',6);PM.set('rings',10);
    const s1=PM.state();
    PM.preset('tower');
    const s2=PM.state();
    const obj=PM.exportOBJ();
    return{v0:s0.verts,f1:s1.faces,v1:s1.verts,tw:s2.params.twist,
      objOk:obj.startsWith('# parametric')&&obj.includes('\nf '),presets:s0.presets.length};
  });
  (pm.v1===6*11&&pm.f1===60&&pm.tw===220&&pm.objOk&&pm.presets===5)
    ? ok('mesh follows the sliders (6×10 → 66 verts / 60 faces), presets + OBJ export work')
    : fail('parametric: '+JSON.stringify(pm));

  console.log('— photostamp —');
  await open('photostamp',()=>window.PS);
  const ps=await page.evaluate(async()=>{
    PS.loadDemo();
    await new Promise(r=>setTimeout(r,300));
    PS.setMeta({lat:49.2827,lon:-123.1207,temp:-3.5,note:'footing pour'});
    document.getElementById('tempBtn').click();
    await new Promise(r=>setTimeout(r,400));
    const st=PS.state();
    return{...st,dataLen:PS.dataURL().length,msg:document.getElementById('msg').textContent};
  });
  (ps.hasPhoto&&ps.temp===-3.5&&Math.abs(ps.lat-49.2827)<1e-6&&ps.note==='footing pour'
    &&ps.w<=1280&&ps.dataLen>20000)
    ? ok('demo photo stamped with temp + coords + note, weather API failure handled ("'+ps.msg.slice(0,30)+'…")')
    : fail('photostamp: '+JSON.stringify({t:ps.temp,lat:ps.lat,w:ps.w}));

  console.log('— mood —');
  await open('mood',()=>window.MD);
  const md=await page.evaluate(()=>{
    MD.clear();
    const d=n=>Date.now()-n*864e5;
    MD.log(0,4,'good pour',d(2));
    MD.log(7,2,'long day',d(1));
    MD.log(9,5,'crushed it',d(0));
    const wk=MD.weekText();
    return{count:MD.entries().length,streak:MD.streak(),
      wk:wk&&wk.includes('😄')&&wk.includes('🤩'),
      grid:document.querySelectorAll('#grid div').length,
      moods:MD.MOODS.length};
  });
  (md.count===3&&md.streak===3&&md.wk&&md.grid===56&&md.moods===10)
    ? ok('3 days logged = 3-day streak, 8-week grid, shareable week text with the right emoji')
    : fail('mood: '+JSON.stringify(md));

  const persistMood=await page.reload({waitUntil:'domcontentloaded'})
    .then(()=>page.waitForFunction(()=>window.MD))
    .then(()=>page.evaluate(()=>MD.state().count));
  persistMood===3
    ? ok('mood log survives reload') : fail('mood persist: '+persistMood);

  console.log('— ideas —');
  await open('ideas',()=>window.IG);
  const ig=await page.evaluate(()=>{
    const c=IG.counts();
    IG.seed(42);
    const t1=IG.forge();
    const w1=document.querySelector('#idea .w').textContent;
    IG.lock(0);
    IG.forge();
    const w2=document.querySelector('#idea .w').textContent;
    IG.clearLocks();
    IG.saveFav();
    return{base:c.base,combos:c.combos,premade:c.premade,tpls:c.templates,
      clean:!t1.includes('{')&&t1.length>20,lockHeld:w1===w2,favs:IG.favs().length,
      p5:IG.premade(5).length>10};
  });
  (ig.base>500&&ig.combos>1e6&&ig.premade>=100&&ig.tpls>=20&&ig.clean&&ig.lockHeld&&ig.favs===1&&ig.p5)
    ? ok('forge: '+ig.base+' terms, '+(ig.combos/1e6).toFixed(0)+'M+ combos, '+ig.premade+' premade; word-locking + favourites work')
    : fail('ideas: '+JSON.stringify(ig));

  console.log('— pdfmark —');
  await open('pdfmark',()=>window.PDM);
  const pdm=await page.evaluate(()=>{
    const libs=PDM.libs();
    PDM.tool('pen');
    PDM.addStroke([[100,100],[200,150],[300,120]]);
    PDM.addText(120,300,'check this beam');
    const m2=PDM.state().marks;
    PDM.undo();
    return{libs,m2,m3:PDM.state().marks,w:PDM.state().w,pages:PDM.state().pages};
  });
  (!pdm.libs.pdf&&pdm.m2===2&&pdm.m3===1&&pdm.w===1000&&pdm.pages===1)
    ? ok('CDN blocked → blank-sheet mode still boots; pen + text + undo all work offline')
    : fail('pdfmark: '+JSON.stringify(pdm));

  console.log('— mapsketch —');
  await open('mapsketch',()=>window.MS);
  const ms=await page.evaluate(()=>{
    const fb=MS.fallback();
    MS.addLine([[100,100],[150,180],[200,160]]);
    const d=MS.lineLen([[49,-123],[49,-122.9]]);
    return{fb,items:MS.items().length,km:d/1000,fmt:MS.fmtDist(d)};
  });
  (ms.fb&&ms.items===1&&ms.km>7&&ms.km<7.6&&ms.fmt.includes('km'))
    ? ok('tiles blocked → grid sketchpad fallback; haversine says 0.1° at 49°N = '+ms.km.toFixed(2)+' km')
    : fail('mapsketch: '+JSON.stringify(ms));

  console.log('— measure —');
  await open('measure',()=>window.ME);
  const me=await page.evaluate(async()=>{
    ME.loadDemo();
    await new Promise(r=>setTimeout(r,300));
    ME.calibrate(100,2,'m');
    ME.setMode('dist');
    ME.tapAt(100,100);ME.tapAt(200,100);
    ME.setMode('area');
    ME.tapAt(100,100);ME.tapAt(200,100);ME.tapAt(200,200);ME.tapAt(100,200);
    ME.closeArea();
    const r=ME.results();
    return{n:r.length,d:r[0].val,a:r[1].val,dl:r[0].label,al:r[1].label};
  });
  (me.n===2&&Math.abs(me.d-2)<.01&&Math.abs(me.a-4)<.05
    &&me.dl.includes('2.00 m')&&me.al.includes('m²'))
    ? ok('calibrate 100px=2m → 100px line reads 2.00 m, 100px square reads 4 m²')
    : fail('measure: '+JSON.stringify(me));

  console.log('— voicememo —');
  await open('voicememo',()=>window.VM&&VM.ready());
  const vm=await page.evaluate(async()=>{
    const id=await VM.addFake('pour checklist',2);
    const l1=await VM.list();
    const dom=document.querySelectorAll('.memo').length;
    const audio=!!document.querySelector('.memo audio');
    await VM.del(id);
    const l2=await VM.list();
    return{n1:l1.length,size:l1[0].blob.size,dom,audio,n2:l2.length};
  });
  (vm.n1===1&&vm.size>30000&&vm.dom===1&&vm.audio&&vm.n2===0)
    ? ok('memos persist in IndexedDB with playable audio ('+(vm.size/1024).toFixed(0)+'kb WAV), delete works')
    : fail('voicememo: '+JSON.stringify(vm));

  console.log('— sunpath —');
  await open('sunpath',()=>window.SP);
  const sp=await page.evaluate(()=>{
    const summer=SP.set(51.5,-0.12,'2026-06-21');
    const winter=SP.set(51.5,-0.12,'2026-12-21');
    const shadow=SP.shadowLen(2,45);
    const equator=SP.set(0,0,'2026-03-20');
    return{sLen:summer.dayLen,sMax:summer.maxElev,wLen:winter.dayLen,
      shadow,eMax:equator.maxElev};
  });
  (sp.sLen>16&&sp.sLen<17.5&&sp.sMax>60&&sp.sMax<64
    &&sp.wLen>7&&sp.wLen<9&&Math.abs(sp.shadow-2)<.01&&sp.eMax>85)
    ? ok('London solstice: '+sp.sLen.toFixed(1)+'h summer / '+sp.wLen.toFixed(1)+'h winter, 45° sun = 1:1 shadow, equator equinox near-zenith')
    : fail('sunpath: '+JSON.stringify(sp));

  console.log('— tapemath —');
  await open('tapemath',()=>window.TM);
  const tm=await page.evaluate(()=>{
    const add=TM.calcStr(`3' 4-1/2" + 2' 7-3/4"`);
    const f=TM.fmtFrac(add);
    TM.press('5');TM.press('ft');TM.press('3');TM.frac(1,2);
    const v=TM.value();
    TM.press('add');TM.press('6');TM.press('eq');
    const v2=TM.value();
    return{add,f,v,v2,parsed:TM.parse(`10' 6"`)};
  });
  (Math.abs(tm.add-72.25)<.001&&tm.f.includes(`6'`)&&tm.f.includes('1/4')
    &&tm.v===63.5&&tm.v2===69.5&&tm.parsed===126)
    ? ok(`3' 4-1/2" + 2' 7-3/4" = `+tm.f+' — keypad chain 5\'3-1/2" + 6" = '+TM_FMT(tm.v2))
    : fail('tapemath: '+JSON.stringify(tm));
  function TM_FMT(v){return Math.floor(v/12)+"' "+(v%12)+'"';}

  await page.screenshot({path:SP+'tinyapps-last.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
