const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
const SOLUTIONS=[
  [['gum',255,131]],
  [['cactus',830,62]],
  [['wax',640,340]],
  [['gum',470,455],['cactus',868,50]],
  [['gum',195,124],['wax',760,340]],
  [['cactus',400,60],['wax',640,340]],
  [['gum',190,124],['gum',660,443],['cactus',868,50]],
  [['wax',430,340],['gum',795,449],['cactus',890,85]],
  [['gum',430,488]],
  [['gum',100,107],['cactus',430,60],['wax',640,340]],
];
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:900,height:620},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.addInitScript(()=>{
    window.__played=[];
    HTMLMediaElement.prototype.play=function(){ window.__played.push(this.src); return Promise.resolve(); };
    HTMLMediaElement.prototype.pause=function(){ window.__paused=true; };
  });
  await p.route('**archive.org/advancedsearch.php**', r=>r.fulfill({ contentType:'application/json',
    headers:{'access-control-allow-origin':'*'},
    body: JSON.stringify({response:{docs:[{identifier:'mock-rag-1',title:'Mock Rag'},{identifier:'mock-rag-2',title:'Second Rag'}]}}) }));
  await p.route('**archive.org/metadata/**', r=>{
    const id=r.request().url().split('/metadata/')[1];
    r.fulfill({ contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body: JSON.stringify({metadata:{title:'Maple Mock Rag ('+id+')'},files:[{name:'side-a.mp3',format:'VBR MP3'},{name:'cover.jpg',format:'JPEG'}]}) });
  });
  await p.goto('http://localhost:8899/kiwi/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KBM);

  const boot = await p.evaluate(()=>({
    levels: KBM.LEVELS.length,
    days: document.querySelectorAll('.day').length,
    intro: document.getElementById('ovl').classList.contains('on'),
    canvas: !!document.getElementById('cv') }));
  (boot.levels===10&&boot.days===10&&boot.intro&&boot.canvas)
    ? ok('boots: 10 days, intro overlay, canvas') : fail('boot: '+JSON.stringify(boot));
  await p.evaluate(()=>document.getElementById('ovlStart').click());

  await p.evaluate(()=>document.dispatchEvent(new PointerEvent('pointerdown')));
  await p.waitForFunction(()=>window.__played&&window.__played.length>0,{timeout:5000}).catch(()=>{});
  const music = await p.evaluate(()=>({
    n: KBM.MUSIC.list.length,
    first: KBM.MUSIC.list[0]&&KBM.MUSIC.list[0].u,
    played: window.__played,
    cached: !!localStorage.getItem('kbm-tracks'),
    cap: document.getElementById('cap').textContent }));
  (music.n>=2&&music.first.includes('/download/mock-rag-1/side-a.mp3')
    &&music.played.some(u=>u.includes('mock-rag-1'))&&music.cached&&music.cap.includes('\u266a'))
    ? ok('music: free-API playlist resolved ('+music.n+' 78s), mp3 streaming, cached, credited in caption')
    : fail('music: '+JSON.stringify(music));

  const mtoggle = await p.evaluate(()=>{
    document.getElementById('mus').click();
    return { off: document.getElementById('mus').classList.contains('off'),
      paused: !!window.__paused, pref: KBM.P.music };
  });
  (mtoggle.off&&mtoggle.paused&&mtoggle.pref===false)
    ? ok('music toggle: pauses, dims button, saves pref') : fail('mtoggle: '+JSON.stringify(mtoggle));
  await p.evaluate(()=>document.getElementById('mus').click());

  const sane = await p.evaluate(()=>{
    const probs=[];
    KBM.LEVELS.forEach((L,i)=>{
      const total=Object.values(L.inv).reduce((a,b)=>a+b,0);
      if(total<1||total>3) probs.push('L'+(i+1)+' inv '+total);
      if(!L.hint||!L.win||!L.fact) probs.push('L'+(i+1)+' missing text');
      (L.ropes||[]).forEach(r=>{ if(r.y2<=r.y1) probs.push('L'+(i+1)+' rope inverted'); });
    });
    return probs;
  });
  sane.length===0 ? ok('level data: inventories 1-3 items, hints/wins/facts present, ropes sane') : fail(sane.join('|'));

  const noCheat = await p.evaluate(()=>{
    KBM.load(0); KBM.go(); KBM.ff(30);
    return KBM.state();
  });
  noCheat.mode==='failed' ? ok('day 1 with no placements fails honestly ('+noCheat.mode+')') : fail('no-placement run: '+JSON.stringify(noCheat));

  for(let i=0;i<SOLUTIONS.length;i++){
    const res = await p.evaluate(async sol=>{
      KBM.load(sol.i);
      sol.s.forEach(([t,x,y])=>KBM.place(t,x,y));
      KBM.go(); KBM.ff(32);
      return { st: KBM.state(), trace: KBM.trace.slice(-6) };
    }, {i, s:SOLUTIONS[i]});
    res.st.mode==='won'
      ? ok('day '+(i+1)+' solvable — won at T='+res.st.T+'s')
      : fail('day '+(i+1)+' NOT solved: '+JSON.stringify(res.st)+' trace='+JSON.stringify(res.trace));
  }

  const prog = await p.evaluate(()=>({ day:KBM.P.day, done:Object.keys(KBM.P.done).length }));
  (prog.day===10&&prog.done===10) ? ok('progress saved: day 10 unlocked, all 10 done') : fail('prog: '+JSON.stringify(prog));

  const reject = await p.evaluate(()=>{
    KBM.load(0);
    const before=KBM.inv.gum;
    KBM.place('gum',100,100); KBM.place('gum',200,200);
    return { before, after: KBM.inv.gum };
  });
  (reject.before===1&&reject.after===0) ? ok('inventory enforced: second gum placement rejected') : fail('inv: '+JSON.stringify(reject));

  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.KBM);
  const persist = await p.evaluate(()=>({ day:KBM.P.day, intro:document.getElementById('ovl').classList.contains('on') }));
  (persist.day===10&&!persist.intro) ? ok('reload: progress persists, intro skipped for veterans') : fail('persist: '+JSON.stringify(persist));

  await p.evaluate(()=>KBM.load(2));
  await p.waitForTimeout(400);
  await p.screenshot({path:SP+'kiwi.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
