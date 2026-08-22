// idle-power probe: with chips at rest the rAF loop must sleep
const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true})).newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message));
  await p.goto('http://localhost:8899/alchemy/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.CR);
  await p.evaluate(()=>{
    document.getElementById('scStart').classList.remove('show');
    CR.spawn('fire',{x:120,y:300}); CR.spawn('water',{x:300,y:300}); CR.spawn('earth',{x:210,y:450});
  });
  await p.waitForTimeout(2500);                       // let everything settle + loop go quiet
  const f0 = await p.evaluate(()=>CR.frames);
  await p.waitForTimeout(2000);
  const f1 = await p.evaluate(()=>CR.frames);
  const idleFps=(f1-f0)/2;
  idleFps<=3 ? ok('idle rAF: '+idleFps.toFixed(1)+' fps (chips at rest, loop asleep)')
    : fail('idle rAF still running: '+idleFps.toFixed(1)+' fps');

  // a merge wakes it, then it sleeps again
  await p.evaluate(async ()=>{
    const a=CR.chips[0], c=CR.chips[1];
    CR.startMerge(a,c);
  });
  await p.waitForTimeout(600);
  const f2 = await p.evaluate(()=>CR.frames);
  (f2>f1+10) ? ok('merge wakes the loop ('+(f2-f1)+' frames during action)') : fail('merge did not animate: '+(f2-f1));
  await p.waitForTimeout(2600);
  const f3 = await p.evaluate(()=>CR.frames);
  await p.waitForTimeout(2000);
  const f4 = await p.evaluate(()=>CR.frames);
  const idle2=(f4-f3)/2;
  idle2<=3 ? ok('back to sleep after the merge ('+idle2.toFixed(1)+' fps)') : fail('loop stuck awake: '+idle2.toFixed(1)+' fps');

  // steam got made, chips visible and positioned
  const st = await p.evaluate(()=>({ steam: !!CR.S.found.steam, chips: CR.chips.length,
    bob: getComputedStyle(CR.chips[0].el).animationName }));
  (st.steam&&st.chips===2&&st.bob==='chipbob') ? ok('fusion worked, chips bob via CSS ('+st.bob+')')
    : fail('state: '+JSON.stringify(st));

  await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
