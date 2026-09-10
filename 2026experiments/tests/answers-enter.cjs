const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:400,height:850},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,120)));
  await p.goto('http://localhost:8899/answers/', {waitUntil:'domcontentloaded'});
  await p.waitForTimeout(400);

  const t0=Date.now();
  await p.evaluate(()=>document.getElementById('btnFast').click());
  const lbl = await p.evaluate(()=>document.getElementById('btnFast').textContent);
  lbl==='TYPING: INSTANT' ? ok('footer toggle flips to TYPING: INSTANT') : fail('label: '+lbl);
  await p.waitForSelector('#choices button.ch', {timeout:6000});
  const bootMs=Date.now()-t0;
  bootMs<5500 ? ok('intro rendered instantly with typing skipped ('+bootMs+'ms)') : fail('slow: '+bootMs+'ms');

  await p.click('#choices button.ch');
  await p.waitForSelector('.termrow button.enter', {timeout:6000});
  ok('visible ENTER ⏎ button rendered beside the input');
  await p.fill('input.term','Button Presser');
  await p.click('.termrow button.enter');
  await p.waitForTimeout(300);
  const echoed = await p.evaluate(()=>document.getElementById('scroll').textContent.includes('› Button Presser'));
  echoed ? ok('tapping ENTER submits the answer (no keyboard needed)') : fail('button submit failed');

  await p.waitForSelector('.termrow button.enter', {timeout:6000});
  await p.fill('input.term','Sam');
  await p.press('input.term','Enter');
  await p.waitForTimeout(250);
  const doubled = await p.evaluate(()=>{
    const m=document.getElementById('scroll').textContent.match(/› Sam/g);
    return m?m.length:0; });
  doubled===1 ? ok('keyboard Enter still works; no double-submit') : fail('submits: '+doubled);

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForTimeout(600);
  const persist = await p.evaluate(()=>document.getElementById('btnFast').textContent);
  persist==='TYPING: INSTANT' ? ok('instant-typing preference survives reload') : fail('persist: '+persist);

  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
