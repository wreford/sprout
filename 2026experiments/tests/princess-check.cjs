const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';
(async () => {
  const errs=[];
  const ok=m=>console.log('  ✓ '+m), fail=m=>{ errs.push(m); console.log('  ✗ '+m); };
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({viewport:{width:460,height:860},hasTouch:true});
  const p = await ctx.newPage();
  p.on('pageerror', e=>fail('PAGEERROR: '+e.message.slice(0,160)));
  await p.goto('http://localhost:8899/princess/', {waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.PP);

  const boot = await p.evaluate(()=>{
    PP.reset();
    const st=PP.state();
    return { items: st.items, slots: PP.SLOTS.length, coins: st.coins,
      unlocked: st.unlocked, help: document.getElementById('helpOv').classList.contains('show'),
      rack: document.querySelectorAll('#rack .item').length,
      req: document.getElementById('reqText').textContent.includes('wishes') };
  });
  (boot.items===38&&boot.slots===5&&boot.coins===0&&boot.unlocked===7
    &&boot.rack===12&&boot.req)
    ? ok('boots: 38 boutique items over 5 slots, 12 gowns on the rack, a guest already wishing')
    : fail('boot: '+JSON.stringify(boot));

  const art = await p.evaluate(()=>{
    const count=c=>c.flat().filter(Boolean).length;
    const base=count(PP.compose());
    PP.equip('dress','mermaid-teal');
    PP.unlock('mermaid-teal');
    const mer=count(PP.compose());
    PP.equip('dress','gown-pink');
    const back=count(PP.compose());
    return { base, mer, differs: base!==mer, restores: back===base };
  });
  (art.base>350&&art.differs&&art.restores)
    ? ok('pixel compositor: '+art.base+' colored cells, outfit swaps actually change the sprite')
    : fail('art: '+JSON.stringify(art));

  const thumbs = await p.evaluate(()=>{
    PP.reset(); PP.tab('dress');
    const items=[...document.querySelectorAll('#rack .item')];
    const locked=items.filter(el=>el.classList.contains('locked'));
    const priced=locked.filter(el=>el.querySelector('.price'));
    const drawn=items.every(el=>{
      const c=el.querySelector('canvas');
      const x=c.getContext('2d');
      return x.getImageData(0,0,c.width,c.height).data.some(v=>v>0);
    });
    return { n: items.length, locked: locked.length, priced: priced.length, drawn };
  });
  (thumbs.n===12&&thumbs.locked===11&&thumbs.priced===11&&thumbs.drawn)
    ? ok('rack thumbnails all render pixels; locked ones show 🔒 and a sparkle price')
    : fail('thumbs: '+JSON.stringify(thumbs));

  const tags = await p.evaluate(()=>{
    const t=PP.outfitTags();
    return { t, hasPink: t.includes('pink'), hasPoofy: t.includes('poofy'),
      hasMagical: t.includes('magical') };
  });
  (tags.hasPink&&tags.hasPoofy&&tags.hasMagical)
    ? ok('outfit tags union colors + styles (starter kit reads pink, poofy, magical)')
    : fail('tags: '+JSON.stringify(tags.t));

  const scoring = await p.evaluate(()=>{
    PP.setGuest('pink','poofy');
    const s3=PP.score().stars;
    PP.setGuest('blue','poofy');
    const s2=PP.score().stars;
    PP.setGuest('blue','sporty');
    const s1=PP.score().stars;
    return { s3, s2, s1 };
  });
  (scoring.s3===3&&scoring.s2===2&&scoring.s1===1)
    ? ok('scoring: both wishes = ⭐⭐⭐, one = ⭐⭐, none = a kind single star')
    : fail('scoring: '+JSON.stringify(scoring));

  const show = await p.evaluate(()=>{
    PP.dismiss(); PP.setGuest('pink','poofy');
    const r=PP.doShow();
    const st=PP.state();
    return { stars: r.stars, coins: st.coins, parties: st.parties,
      ov: document.getElementById('resultOv').classList.contains('show'),
      starTxt: document.getElementById('stars').textContent };
  });
  (show.stars===3&&show.coins===17&&show.parties===1&&show.ov&&show.starTxt==='⭐⭐⭐')
    ? ok('SHOW!: 3 stars pays 17 sparkles, result overlay celebrates')
    : fail('show: '+JSON.stringify(show));

  const nextg = await p.evaluate(()=>{
    PP.seed(9);
    document.getElementById('nextBtn').click();
    const g=PP.guest();
    return { ov: document.getElementById('resultOv').classList.contains('show'), g,
      banner: document.getElementById('reqText').textContent.includes(g.name) };
  });
  (!nextg.ov&&nextg.g&&nextg.g.color&&nextg.banner)
    ? ok('next guest arrives with a fresh wish ('+nextg.g.name+' wants '+nextg.g.color+' + '+nextg.g.style+')')
    : fail('nextg: '+JSON.stringify(nextg));

  const shop = await p.evaluate(()=>{
    PP.reset(); PP.give(15);
    const okBuy=PP.buy('gown-blue');
    const dup=PP.buy('gown-blue');
    const broke=PP.buy('snow-white');
    const st=PP.state();
    return { okBuy, dup, broke, coins: st.coins, unlocked: st.unlocked };
  });
  (shop.okBuy===true&&shop.dup===false&&shop.broke===false&&shop.coins===0&&shop.unlocked===8)
    ? ok('boutique: 15 sparkles buys the Sky Ballgown once; broke and double buys refused')
    : fail('shop: '+JSON.stringify(shop));

  const uiBuy = await p.evaluate(()=>{
    PP.give(12); PP.tab('dress');
    const card=[...document.querySelectorAll('#rack .item')].find(el=>
      el.classList.contains('locked')&&el.querySelector('.price')&&
      el.querySelector('.price').textContent==='✨12');
    card.click();
    const st=PP.state();
    return { coins: st.coins, unlocked: st.unlocked };
  });
  (uiBuy.coins===0&&uiBuy.unlocked===9)
    ? ok('tapping a locked card spends the sparkles and unlocks it in place')
    : fail('uiBuy: '+JSON.stringify(uiBuy));

  const mus = await p.evaluate(()=>{
    const m0=PP.state().music;
    document.getElementById('musBtn').click();
    const m1=PP.state().music;
    document.getElementById('musBtn').click();
    return { m0, m1, m2: PP.state().music };
  });
  (mus.m1===!mus.m0&&mus.m2===mus.m0)
    ? ok('waltz toggles on and off ♪') : fail('mus: '+JSON.stringify(mus));

  await p.evaluate(()=>{ PP.give(40); PP.buy('hair-pink-buns'); PP.equip('hair','hair-pink-buns'); PP.save(); });
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>window.PP);
  const persist = await p.evaluate(()=>{
    const st=PP.state();
    return { hair: st.outfit.hair, unlocked: st.unlocked,
      help: document.getElementById('helpOv').classList.contains('show') };
  });
  (persist.hair==='hair-pink-buns'&&persist.unlocked===10&&persist.help===false)
    ? ok('wardrobe survives reload: Bubblegum Buns still on, no re-tutorial')
    : fail('persist: '+JSON.stringify(persist));

  const noscroll = await p.evaluate(()=>({
    bodyX: document.body.scrollWidth<=document.body.clientWidth,
    docX: document.documentElement.scrollWidth<=document.documentElement.clientWidth,
    meta: document.querySelector('meta[name=viewport]').content.includes('maximum-scale=1') }));
  (noscroll.bodyX&&noscroll.docX&&noscroll.meta)
    ? ok('locked viewport: no sideways scroll, no pinch zoom')
    : fail('noscroll: '+JSON.stringify(noscroll));

  await p.evaluate(()=>{ PP.dismiss(); PP.setGuest('teal','magical');
    PP.give(99); PP.buy('mermaid-teal'); PP.equip('dress','mermaid-teal'); });
  await p.waitForTimeout(600);
  await p.screenshot({path:SP+'princess.png'});
  await ctx.close(); await b.close();
  console.log('\nERRORS: '+errs.length);
  process.exit(errs.length?1:0);
})();
