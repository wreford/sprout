// quick end-to-end smoke: boot, fuse, hint, toggles, automata, codes
const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message));
  await p.goto('http://localhost:8899/alchemy/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.CR);
  await p.evaluate(()=>document.getElementById('scStart').classList.remove('show'));

  const fuse = await p.evaluate(async ()=>{
    const a=CR.spawn('fire',{x:150,y:300}), c=CR.spawn('water',{x:280,y:300});
    CR.startMerge(a,c);
    await new Promise(r=>setTimeout(r,900));
    return { steam: !!CR.S.found.steam, chips: CR.chips.length };
  });
  (fuse.steam&&fuse.chips===1) ? ok('fire+water fuses to Steam') : fail('fuse: '+JSON.stringify(fuse));

  await p.evaluate(()=>document.getElementById('found').classList.remove('show'));
  await p.evaluate(()=>document.getElementById('bHint').click());
  const hint = await p.evaluate(()=>document.getElementById('toast').textContent);
  /→/.test(hint) ? ok('hint suggests: '+hint) : fail('hint: '+hint);

  const probes = await p.evaluate(()=>[["lake","country"],["greed","country"],["democracy","country"],["tea","country"],["cedar","country"],["dodo","country"],["bungee","country"],["firepit","country"],["map","flag"]].map(([a,z])=>{
    const r=CR.combine(a,z); return a+"+"+z+"="+(r?CR.EL[r].n:"NOTHING"); }));
  probes.every(x=>!/NOTHING/.test(x)) ? ok(probes.join(' · ')) : fail('probes: '+probes.join(' · '));

  const ui = await p.evaluate(()=>({
    ret: !!document.getElementById('bRet'), auto: !!document.getElementById('bAuto'),
    autos: CR.AUTOMATA.length, ach: CR.ACH.length }));
  (ui.ret&&ui.auto&&ui.autos===6&&ui.ach===19) ? ok('menu toggles, automata and achievements intact') : fail('ui: '+JSON.stringify(ui));

  const code = await p.evaluate(()=>{ const c=CR.exportCode(); return CR.importCode(c).ok; });
  code ? ok('transfer code round-trips') : fail('code failed');

  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
