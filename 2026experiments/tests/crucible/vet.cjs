const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const lines = fs.readFileSync(process.argv[2] || 'recipes.txt', 'utf8')
    .split('\n').map(s => s.trim()).filter(Boolean);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext()).newPage();
  await p.goto('http://localhost:8899/alchemy/', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.CR);
  const r = await p.evaluate(ls => {
    const bad = [], taken = [], selfmade = [], dup = [], good = [];
    const seen = {};
    for (const line of ls) {
      const m = line.match(/^([a-z0-9]+)\+([a-z0-9]+)=([a-z0-9]+)$/);
      if (!m) { bad.push(line + ' (malformed)'); continue; }
      const [, a, z, res] = m;
      const miss = [a, z, res].filter(x => !CR.EL[x] || CR.EL[x].made);
      if (miss.length) { bad.push(line + ' → no such element: ' + miss.join(',')); continue; }
      if (res === a || res === z) { selfmade.push(line); continue; }
      const key = [a, z].sort().join('+');
      if (seen[key]) { dup.push(line + ' (already in this list as ' + seen[key] + ')'); continue; }
      seen[key] = line;
      const cur = CR.combine(a, z);
      if (cur) { taken.push(line + ' → already makes ' + (CR.EL[cur] ? CR.EL[cur].n : cur)); continue; }
      good.push(line);
    }
    return { bad, taken, selfmade, dup, good };
  }, lines);
  const show = (t, a) => { console.log('\n' + t + ' (' + a.length + ')'); a.slice(0, 400).forEach(x => console.log('  ' + x)); };
  console.log('GOOD: ' + r.good.length + ' of ' + lines.length);
  show('UNKNOWN ELEMENT', r.bad);
  show('MAKES AN INGREDIENT', r.selfmade);
  show('PAIR ALREADY BUSY', r.taken);
  show('DUPLICATE IN LIST', r.dup);
  fs.writeFileSync('recipes-good.txt', r.good.join('\n') + '\n');
  await b.close();
})();
