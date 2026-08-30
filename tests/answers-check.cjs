const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:430,height:900},isMobile:true,hasTouch:true,
    reducedMotion:'reduce'});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,150)));
  const reqs=[];
  p.on('request', r=>{ const u=r.url(); if(!u.startsWith('http://localhost')) reqs.push(u); });
  await p.goto('http://localhost:8899/answers/', {waitUntil:'domcontentloaded'});
  await p.waitForTimeout(1200);
  const boot = await p.evaluate(()=>({
    wall: document.body.textContent.includes('ANSWERS WILL BE CHECKED'),
    signal: document.getElementById('sig').textContent.includes('SIGNAL'),
    choice: !!document.querySelector('button.ch') }));
  (boot.wall&&boot.signal&&boot.choice) ? ok('boots: intake form, signal bar, first choice') : fail(JSON.stringify(boot));
  reqs.length===0 ? ok('zero external requests — answers stay on the page') : fail('external: '+reqs.join(','));

  const clickChoice = async (idx=0) => {
    await p.waitForSelector('button.ch', {timeout:15000});
    const btns = await p.$$('button.ch');
    await btns[Math.min(idx,btns.length-1)].click();
    await p.waitForTimeout(400);
  };
  const answer = async (txt) => {
    await p.waitForSelector('input.term', {timeout:15000});
    await p.fill('input.term', txt);
    await p.press('input.term','Enter');
    await p.waitForTimeout(400);
  };
  await clickChoice(0);
  await answer('Test Person');
  await answer('Sam');
  await clickChoice(0);
  await clickChoice(0);
  await p.waitForFunction(()=>document.getElementById('lvl').textContent.includes('LEVEL 0'),{timeout:20000});
  ok('intake complete → LEVEL 0 — LOBBY reached');
  await clickChoice(0);
  await clickChoice(2);
  await clickChoice(1);
  await clickChoice(2);
  const jrn = await p.evaluate(()=>{
    document.getElementById('btnJrn').click();
    const open=document.getElementById('jrn').classList.contains('open');
    const has=document.getElementById('jrnBody').textContent.includes('Test Person');
    document.getElementById('jrnClose').click();
    return {open,has};
  });
  (jrn.open&&jrn.has) ? ok('journal opens and holds the personalized entry') : fail('journal: '+JSON.stringify(jrn));
  await answer('drumming my fingers');
  await clickChoice(0);
  await clickChoice(1);
  await answer('12 Maple Street');
  await p.waitForFunction(()=>document.getElementById('lvl').textContent.includes('LEVEL 1'),{timeout:20000});
  ok('descended the hatch → LEVEL 1 — THE WET');
  await answer('happy birthday');
  await clickChoice(0);
  await clickChoice(0);
  await clickChoice(0);
  await clickChoice(2);
  await clickChoice(1);
  await clickChoice(1);
  await clickChoice(0);
  await clickChoice(0);
  await p.waitForFunction(()=>document.getElementById('lvl').textContent.includes('ARCHIVE'),{timeout:20000});
  ok('reached LEVEL Ø — THE ARCHIVE (echo scene, skin wall, vent all traversed)');
  const sig = await p.evaluate(()=>document.getElementById('sig').textContent);
  ok('signal meter live: '+sig.replace(/[▮▯]/g,m=>m).slice(0,20)+'…');
  await p.screenshot({path:SP+'aw-archive.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
