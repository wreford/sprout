// structural health: dup recipe pairs, census, reachability, boot errors
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({viewport:{width:430,height:900}})).newPage();
  let errs = 0;
  p.on('pageerror', e => { errs++; console.log('PAGEERROR:', e.message); });
  await p.goto('http://localhost:8899/alchemy/', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.CR);
  const r = await p.evaluate(() => {
    const have = { water: 1, fire: 1, earth: 1, air: 1 };
    for (let pass = 0; pass < 120; pass++) {
      let grew = 0;
      for (const key in CR.RECIPES) {
        const res = CR.RECIPES[key];
        if (have[res]) continue;
        const i = key.indexOf('+');
        if (have[key.slice(0, i)] && have[key.slice(i + 1)]) { have[res] = 1; grew++; }
      }
      if (!grew) break;
    }
    const base = Object.values(CR.EL).filter(e => !e.made);
    const unreachable = base.filter(e => !have[e.id]).map(e => e.id);
    return { census: CR.CENSUS, bad: CR.badRecipes.length, dup: CR.dupRecipes.length,
      base: base.length, unreachable: unreachable.slice(0, 20), un: unreachable.length };
  });
  console.log('CENSUS', JSON.stringify(r.census));
  console.log('bad:', r.bad, 'dupPairs:', r.dup, 'unreachable:', r.un, r.unreachable.join(' '));
  console.log('pageerrors:', errs);
  await b.close();
  process.exit((r.bad || r.dup || r.un || errs) ? 1 : 0);
})();
