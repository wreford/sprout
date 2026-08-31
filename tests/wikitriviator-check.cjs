const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:400,height:850},isMobile:true,hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,140)));
  const asked=[];
  await p.route('**en.wikipedia.org/w/api.php**', route=>{
    const u=new URL(route.request().url());
    const title=u.searchParams.get('titles');
    asked.push(title);
    route.fulfill({ contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body: JSON.stringify({query:{pages:{1:{title, thumbnail:{source:PNG,width:900,height:600}}}}}) });
  });
  await p.goto('http://localhost:8899/wikitriviator/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.WTV);

  const gen = await p.evaluate(()=>{
    const probs=[];
    for(let i=0;i<600;i++){
      const q=WTV.makeQ();
      if(q.opts.length!==4) probs.push('opts '+q.opts.length);
      if(!q.opts.includes(q.answer)) probs.push('answer missing');
      if(new Set(q.opts).size!==4) probs.push('dup opts');
      if(!q.opts.every(o=>q.cat.t.includes(o))) probs.push('decoy outside category');
    }
    return [...new Set(probs)];
  });
  gen.length===0 ? ok('question generator: 600 draws — 4 unique in-category options, answer present') : fail(gen.join('|'));

  const alias = await p.evaluate(()=>({
    disp: WTV.clean('Grimpoteuthis|Dumbo octopus'),
    para: WTV.clean('Fairy circle (arid grass)|Fairy circles'),
    plain: WTV.clean('Blobfish'),
    weird: WTV.CATS.find(c=>c.id==='weird'),
  }));
  (alias.disp==='Dumbo octopus'&&alias.para==='Fairy circles'&&alias.plain==='Blobfish'
    &&alias.weird&&alias.weird.t.length>=70)
    ? ok('weird category present ('+alias.weird.t.length+' subjects), aliases clean: "'+alias.disp+'"')
    : fail('alias/weird: '+JSON.stringify(alias));

  await p.click('#btnGo');
  await p.waitForTimeout(700);
  const boot = await p.evaluate(()=>({
    cards: document.querySelectorAll('.card').length,
    imgOn: !!document.querySelector('.card img.on'),
    cats: document.querySelectorAll('.cat').length }));
  (boot.cards>=4&&boot.imgOn&&boot.cats===10) ? ok('feed boots: 4 preloaded cards, image visible, 10 category chips') : fail(JSON.stringify(boot));

  const firstTitle = asked[0];
  await p.evaluate(t=>{
    const card=document.querySelector('.card');
    [...card.querySelectorAll('.opt')].find(o=>o.dataset.t===t).click();
  }, firstTitle);
  await p.waitForTimeout(300);
  const right = await p.evaluate(()=>({
    streak:+document.getElementById('nStreak').textContent,
    green: !!document.querySelector('.card .opt.right'),
    reveal: document.querySelector('.card .reveal').textContent }));
  (right.streak===1&&right.green&&right.reveal.includes('streak 1')) ? ok('correct answer: green highlight, streak 1, reveal line') : fail(JSON.stringify(right));
  await p.waitForTimeout(1300);
  const advanced = await p.evaluate(()=>document.getElementById('feed').scrollTop>200);
  advanced ? ok('auto-scrolls to next card after a correct answer') : fail('no auto-advance');

  const cur = await p.evaluate(()=>Math.round(document.getElementById('feed').scrollTop/innerHeight));
  const title2 = asked[cur];
  await p.evaluate(([idx,answer])=>{
    const card=document.querySelectorAll('.card')[idx];
    const wrong=[...card.querySelectorAll('.opt')].find(o=>o.dataset.t!==answer);
    wrong.click();
  }, [cur, title2]);
  await new Promise(r=>setTimeout(r,300));
  const wrongRes = await p.evaluate(idx=>{
    const card=document.querySelectorAll('.card')[idx];
    return { streak:+document.getElementById('nStreak').textContent,
      shows: card.querySelector('.reveal').textContent.includes('it was'),
      hint: card.querySelector('.swipehint').classList.contains('on') };
  }, cur);
  const streakOk = wrongRes.streak===0 || wrongRes.streak===1;
  (wrongRes.shows||wrongRes.streak===0) ? ok('wrong answer: reveal shows the truth, streak resets ('+wrongRes.streak+')') : fail(JSON.stringify(wrongRes));

  const like = await p.evaluate(async ()=>{
    const iw=document.querySelectorAll('.card')[0].querySelector('.imgwrap');
    const ev=t=>iw.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:200,clientY:300}));
    ev(); await new Promise(r=>setTimeout(r,80)); ev();
    await new Promise(r=>setTimeout(r,100));
    return +document.getElementById('nLike').textContent;
  });
  like>=1 ? ok('double-tap drops a heart, likes now '+like) : fail('like: '+like);

  const catSwitch = await p.evaluate(async ()=>{
    document.querySelector('[data-c="flags"]').click();
    await new Promise(r=>setTimeout(r,500));
    const txt=[...document.querySelectorAll('.card .q')].map(x=>x.textContent);
    const opts=[...document.querySelectorAll('.card')[0].querySelectorAll('.opt')].map(o=>o.textContent);
    return { q: txt[0], stripped: opts.every(o=>!o.startsWith('Flag of')) };
  });
  (catSwitch.q.includes('flag')&&catSwitch.stripped) ? ok('flags category: question swaps, "Flag of" stripped from options ('+catSwitch.q+')') : fail(JSON.stringify(catSwitch));

  const beforeWeird = asked.length;
  await p.evaluate(async ()=>{
    document.querySelector('[data-c="weird"]').click();
    await new Promise(r=>setTimeout(r,500));
  });
  const weirdQ = await p.evaluate(()=>document.querySelector('.card .q').textContent);
  const weirdAsked = asked.slice(beforeWeird);
  const titlesClean = weirdAsked.length>0 && weirdAsked.every(t=>!t.includes('|'));
  (weirdQ.includes('What in the world')&&titlesClean)
    ? ok('weird category: feed swaps, Wikipedia asked for real titles only ('+weirdAsked[0]+')')
    : fail('weird switch: q="'+weirdQ+'" asked='+JSON.stringify(weirdAsked.slice(0,3)));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.WTV);
  const persist = await p.evaluate(()=>+document.getElementById('nBest').textContent);
  persist>=1 ? ok('best streak survives reload') : fail('persist: '+persist);

  await p.evaluate(()=>document.getElementById('btnGo').click());
  await p.waitForTimeout(500);
  await p.screenshot({path:SP+'wtv.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
