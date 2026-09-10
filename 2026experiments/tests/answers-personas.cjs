const { chromium } = require('playwright');
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  async function persona(name, answers, route, checks, opts={}){
    const ctx = await b.newContext({viewport:{width:opts.wide?1100:400,height:opts.wide?800:850},
      isMobile:!opts.wide, hasTouch:!opts.wide, reducedMotion:'reduce'});
    const p = await ctx.newPage();
    const perr=[];
    p.on('pageerror', e=>perr.push(e.message.slice(0,120)));
    await p.goto('http://localhost:8899/answers/', {waitUntil:'domcontentloaded'});
    await p.waitForTimeout(600);
    const ai=[...answers], ri=[...route];
    for(let step=0; step<90; step++){
      const ended = await p.evaluate(()=>document.getElementById('scroll').textContent.includes('ENDING —'));
      if(ended) break;
      try{ await p.waitForSelector('input.term, #choices button.ch', {timeout:12000}); }
      catch(e){
        const tail=await p.evaluate(()=>document.getElementById('scroll').textContent.slice(-200).replace(/\s+/g,' '));
        fail(name+': stuck at step '+step+' routeLeft='+ri.length+' ansLeft='+ai.length+' tail=…'+tail);
        break; }
      const ended2 = await p.evaluate(()=>document.getElementById('scroll').textContent.includes('ENDING —'));
      if(ended2) break;
      const isInput = await p.$('input.term');
      if(isInput){
        const v = ai.length? ai.shift() : '';
        if(v) await p.fill('input.term', v);
        await p.press('input.term','Enter');
      } else {
        const btns = await p.$$('#choices button.ch');
        let idx = 0;
        if(btns.length>1){
          idx = ri.length? ri.shift() : 0;
          if(idx>=btns.length){ fail(name+': route idx '+idx+' but only '+btns.length+' choices at step '+step); idx=0; }
        }
        await btns[idx].click();
      }
      await p.waitForTimeout(160);
    }
    const state = await p.evaluate(()=>({
      text: document.getElementById('scroll').textContent,
      xss: window.__xss||null,
      imgs: document.querySelectorAll('#scroll img, #jrnBody img').length,
      lvl: document.getElementById('lvl').textContent
    }));
    if(state.text.includes('SCENE FAULT')) fail(name+': SCENE FAULT in transcript');
    if(/\bundefined\b/.test(state.text)) fail(name+': literal "undefined" leaked into prose');
    if(perr.length) fail(name+': pageerrors '+perr.join('|'));
    await checks(p, state, ok, fail);
    await ctx.close();
  }

  await persona('P1 nihilist (all blanks, avoids everything)',
    ['','','','','','','',''],
    [3, 2, 3, 1, 0, 1, 1, 2, 1, 1, 1, 1, 1, 0],
    async (p, s, ok, fail)=>{
      s.text.includes('AN ADDRESS YOU NO LONGER REMEMBER') ? ok('P1: blank address falls back to the eerie stencil') : fail('P1: address fallback missing');
      s.text.includes("no one") ? ok('P1: blank contact reads as "no one" throughout') : fail('P1: contact fallback missing');
      s.text.includes('ENDING — THE KEEPER') ? ok('P1: blank-everything run completes → THE KEEPER') : fail('P1: no ending; lvl='+s.lvl);
    });

  await persona('P2 speedrunner (index 0, same junk answer, fast)',
    ['x','x','x','x','x','x','x','x'],
    new Array(20).fill(0),
    async (p, s, ok, fail)=>{
      s.text.includes('continuity restored') ? ok('P2: drowned and merged at speed without breaking') : fail('P2: merge path missed');
      s.text.includes('ENDING — THE SUM') ? ok('P2: mash-through run completes → THE SUM') : fail('P2: no ending; lvl='+s.lvl);
    }, {fast:true});

  await persona('P3 adversarial (HTML in every answer)',
    ['<img src=x onerror="window.__xss=1">','<b>Bob</b>','<svg onload=window.__xss=3>','"quotes\\\\slashes"','<i>song</i>','<b>Bob</b>','x','x'],
    [0, 0, 0, 2, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0],
    async (p, s, ok, fail)=>{
      (!s.xss) ? ok('P3: no injected handler executed') : fail('P3: XSS fired: '+s.xss);
      s.imgs===0 ? ok('P3: zero injected elements rendered') : fail('P3: '+s.imgs+' injected elements');
      s.text.includes('<b>Bob</b>') ? ok('P3: markup shown as literal text in the story') : fail('P3: markup swallowed');
      const jrn = await p.evaluate(()=>{ document.getElementById('btnJrn').click();
        const n=document.querySelectorAll('#jrnBody img,#jrnBody svg,#jrnBody b').length;
        const t=document.getElementById('jrnBody').textContent;
        document.getElementById('jrnClose').click(); return {n,t}; });
      jrn.n===0 ? ok('P3: journal renders hostile input inert') : fail('P3: journal rendered elements');
    });

  {
    const ctx = await b.newContext({viewport:{width:1100,height:800},reducedMotion:'reduce'});
    const p = await ctx.newPage();
    await p.goto('http://localhost:8899/answers/', {waitUntil:'domcontentloaded'});
    await p.waitForTimeout(500);
    const a11y = await p.evaluate(()=>({
      zoom: !document.querySelector('meta[name=viewport]').content.includes('user-scalable=no'),
      live: document.getElementById('scroll').getAttribute('aria-live')==='polite',
      dlg: document.getElementById('jrn').getAttribute('role')==='dialog',
      sig: (document.getElementById('sig').getAttribute('aria-label')||'').includes('percent') }));
    (a11y.zoom&&a11y.live&&a11y.dlg&&a11y.sig) ? ok('P4: zoom allowed, live region, dialog role, spoken signal meter')
      : fail('P4: '+JSON.stringify(a11y));
    await p.click('#choices button.ch');
    await p.waitForSelector('input.term');
    const lbl = await p.evaluate(()=>document.querySelector('input.term').getAttribute('aria-label'));
    lbl ? ok('P4: inputs carry aria-labels ("'+lbl+'")') : fail('P4: no input label');
    await p.fill('input.term','Keyboard User'); await p.press('input.term','Enter');
    await p.waitForSelector('input.term'); await p.press('input.term','Enter');
    await p.waitForSelector('#choices button.ch');
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    const focused = await p.evaluate(()=>document.activeElement.className);
    await p.evaluate(()=>{ document.getElementById('btnJrn').click(); });
    await p.keyboard.press('Escape');
    const closed = await p.evaluate(()=>!document.getElementById('jrn').classList.contains('open'));
    closed ? ok('P4: Escape closes the journal') : fail('P4: journal stuck open');
    await ctx.close();
  }

  const endRoutes = [
    ['THE ORIGINAL', ['Careful Casey','Sam','tapping','1 Elm St','Song','Sam','1 Elm St','tapping'],
      [0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 1, 1, 0, 1, 1]],
    ['THE LAST ONE', ['Kay','Sam','tap','1 Elm','song','Sam','1 Elm','tap'],
      [0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 1, 1, 0, 2]],
    ['PROCESSING', ['Lu','Sam','tap','1 Elm','song','NOT SAM','WRONG','different'],
      [0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 1, 1, 0, 1, 1]],
    ['THE SUM', ['Mo','Sam','tap','1 Elm','song','Sam','1 Elm','tap'],
      [0, 0, 0, 0, 0, 1, 0, 0, 2, 1, 0, 1, 0, 1, 3]],
  ];
  for(const [want, answers, route] of endRoutes){
    await persona('P5 completionist → '+want, answers, route,
      async (p, s, ok, fail)=>{
        s.text.includes('ENDING — '+want) ? ok('P5: reached '+want+(want==='THE SUM'?' via the once-dead stairwell option':''))
          : fail('P5: wanted '+want+', transcript tail: …'+s.text.slice(-160).replace(/\s+/g,' '));
      });
  }

  await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
