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

  const quest0 = await p.evaluate(()=>{
    const q=CR.questInfo();
    const d=CR.depthMap();
    return { id:q.id, ok:!!CR.EL[q.id], depth:d[q.id], done:q.done,
      line:document.getElementById('questLine').textContent,
      shown:document.getElementById('questLine').classList.contains('on') };
  });
  (quest0.ok&&quest0.depth>=4&&quest0.depth<=9&&!quest0.done&&quest0.shown&&/quest/i.test(quest0.line))
    ? ok('daily quest: '+CRLF(quest0.line)+' (depth '+quest0.depth+')')
    : fail('quest0: '+JSON.stringify(quest0));

  const fused = await p.evaluate(async ()=>{
    document.getElementById('scStart').classList.remove('show');
    const q=CR.questInfo();
    let rec=null;
    for(const k in CR.RECIPES){ if(CR.RECIPES[k]===q.id){ const i=k.indexOf('+'); rec=[k.slice(0,i),k.slice(i+1)]; break; } }
    CR.S.found[rec[0]]=1; CR.S.found[rec[1]]=1;
    const a=CR.spawn(rec[0],{x:150,y:300}), c=CR.spawn(rec[1],{x:280,y:300});
    CR.startMerge(a,c);
    await new Promise(r=>setTimeout(r,1600));
    const q2=CR.questInfo();
    return { done:q2.done, streak:q2.streak, toast:document.getElementById('toast').textContent,
      line:document.getElementById('questLine').className };
  });
  (fused.done&&fused.streak===1) ? ok('quest completes on forge · streak '+fused.streak)
    : fail('questDone: '+JSON.stringify(fused));

  await p.evaluate(()=>{ CR.saveNow(); });
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.CR);
  const persisted = await p.evaluate(()=>CR.questInfo());
  (persisted.done&&persisted.streak===1) ? ok('quest completion survives reload')
    : fail('persist: '+JSON.stringify(persisted));

  const stats = await p.evaluate(()=>{
    document.getElementById('scStart').classList.remove('show');
    document.getElementById('bMenu').click();
    document.getElementById('bStats').click();
    return { shown:document.getElementById('scStats').classList.contains('show'),
      rows:document.querySelectorAll('#statsList .amb').length,
      bars:document.querySelectorAll('#statsBars .cstat').length,
      sub:document.getElementById('statsSub').textContent };
  });
  (stats.shown&&stats.rows===11&&stats.bars>=10) ? ok('stats screen: '+stats.rows+' rows, '+stats.bars+' category bars')
    : fail('stats: '+JSON.stringify(stats));
  await p.evaluate(()=>document.getElementById('bStatsBack').click());

  const tree = await p.evaluate(()=>{
    CR.renderTree('casablanca');
    document.getElementById('scTree').classList.add('show');
    const chips=document.querySelectorAll('#treeWrap .tchip').length;
    const starts=document.querySelectorAll('#treeWrap .tchip.tstart').length;
    return { chips, starts, sub:document.getElementById('treeSub').textContent };
  });
  (tree.chips>=5&&tree.starts>=2) ? ok('lineage tree for Casablanca: '+tree.chips+' nodes, '+tree.starts+' starters — '+tree.sub)
    : fail('tree: '+JSON.stringify(tree));
  const treeTap = await p.evaluate(()=>{
    document.querySelector('#treeWrap .tchip.tstart').click();
    return { treeGone:!document.getElementById('scTree').classList.contains('show'),
      sheet:document.getElementById('sheet').classList.contains('show') };
  });
  (treeTap.treeGone&&treeTap.sheet) ? ok('tree chip tap opens element sheet')
    : fail('treeTap: '+JSON.stringify(treeTap));
  await p.evaluate(()=>document.getElementById('bSheetClose').click());

  const sheetTree = await p.evaluate(()=>{
    CR.openSheet('steam');
    document.getElementById('bSheetTree').click();
    const on=document.getElementById('scTree').classList.contains('show');
    document.getElementById('bTreeBack').click();
    const back=document.getElementById('sheet').classList.contains('show');
    document.getElementById('bSheetClose').click();
    return {on,back};
  });
  (sheetTree.on&&sheetTree.back) ? ok('sheet → origins → back round-trip')
    : fail('sheetTree: '+JSON.stringify(sheetTree));

  const perf = await p.evaluate(async ()=>{
    const ids=Object.keys(CR.EL).slice(0,3000);
    ids.forEach(id=>CR.S.found[id]=1);
    CR.renderPal();
    const t0=performance.now();
    for(let i=0;i<5;i++) CR.renderPal();
    const per=(performance.now()-t0)/5;
    const pits=document.querySelectorAll('#pal .pit').length;
    const more=!!document.getElementById('palMore');
    return { per:Math.round(per*10)/10, pits, more };
  });
  (perf.per<120&&perf.pits<=360&&perf.more)
    ? ok('palette @3k found: '+perf.per+'ms per rebuild, '+perf.pits+' nodes rendered, show-all button present')
    : fail('perf: '+JSON.stringify(perf));

  const expand = await p.evaluate(()=>{
    document.getElementById('palMore').click();
    return document.querySelectorAll('#pal .pit').length;
  });
  (expand>360) ? ok('show-all expands to '+expand+' items') : fail('expand: '+expand);

  const search = await p.evaluate(async ()=>{
    const s=document.getElementById('search');
    s.value='star';
    s.dispatchEvent(new Event('input',{bubbles:true}));
    const immediate=document.querySelectorAll('#pal .pit[data-id]').length;
    await new Promise(r=>setTimeout(r,220));
    const after=document.querySelectorAll('#pal .pit[data-id]').length;
    const names=[...document.querySelectorAll('#pal .pit[data-id]')].slice(0,3).map(b=>b.textContent);
    s.value=''; s.dispatchEvent(new Event('input',{bubbles:true}));
    return { after, names };
  });
  (search.after>0&&search.names.join()!=='') ? ok('debounced search: '+search.after+' hits for "star"')
    : fail('search: '+JSON.stringify(search));

  const hint = await p.evaluate(async ()=>{
    const t0=performance.now();
    document.getElementById('bHint').click();
    const ms=performance.now()-t0;
    return { ms:Math.round(ms*10)/10, toast:document.getElementById('toast').textContent };
  });
  (/→/.test(hint.toast)&&hint.ms<80) ? ok('indexed hint in '+hint.ms+'ms: '+hint.toast)
    : fail('hint: '+JSON.stringify(hint));

  function CRLF(s){ return s; }
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
