/* BLENDED ZEBRA · QA BOT
   Drives the real game with the real Coach AI. Two jobs:
   1. NEVER STUCK  — watchdog every state; any frozen screen, stuck busy flag,
                     unplayable hand with no exit, or non-advancing floor is a FAIL.
   2. HARD BUT FAIR — telemetry on death floors, fight length, HP pressure,
                      economy, and content coverage.
   Usage: node qa-bot.cjs [runs] [maxFloor]
*/
const { chromium } = require('playwright');
const RUNS = +(process.argv[2] || 6);
const MAX_FLOOR = +(process.argv[3] || 30);
const SP = '/tmp/claude-0/-home-user-sprout/12b11e48-c931-5cfc-8740-403ce467b352/scratchpad/';

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  const crashes = [];
  page.on('pageerror', e => crashes.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|net::ERR|fonts|404/i.test(m.text())) crashes.push('CONSOLE: ' + m.text()); });

  await page.goto('http://localhost:8899/zebra/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  /* install the driver inside the page: one tick = read screen, act, log */
  await page.evaluate(() => {
    window.QA = {
      log: [], stalls: [], runs: [], cur: null, sig: '', same: 0, ticks: 0,
      fightTurns: [], lowHp: 0, sunsets: 0, seenScreens: {}, seenTraits: {}, seenVerbs: {}, seenKinds: {},
    };
    /* fast + fully-crewed so the AI itself is under test */
    ZB.META.tips = { guide:1, map:1, b1:1, b2:1, b3:1, reward:1, rest:1, blendsel:1, tree:1 };
    ZB.META.helpers = ['gary', 'ox', 'val', 'tempo', 'coach'];
    ZB.META.helperOn = { gary: true, ox: true, val: true, tempo: true, coach: false };
    ZB.saveMeta && ZB.saveMeta();

    window.QA.screen = () => {
      const has = id => !!document.getElementById(id);
      const txt = document.body.textContent.toUpperCase();
      if (document.querySelector('#tutScrim')) return 'tut';
      if (document.querySelector('.ovlDeck')) return 'overlay';
      if (document.querySelector('.ceremony')) return 'ceremony';
      if (has('btm') && document.querySelector('#hand')) return 'battle';
      if (has('bSkip')) return 'reward';
      if (document.querySelector('.crossPath')) return 'crossing';
      if (document.querySelector('.door')) return 'map';
      if (has('bAgain')) return 'death';
      if (has('bC0') || has('bPakS') || has('bBanish') || has('bWheel')) return 'shop';
      if (has('bDo')) return 'blend';
      if (has('bBlend')) return 'rest';
      if (has('bRun')) return 'title';
      if (txt.includes('WHERE DOES THE HERD')) return 'drop';
      return 'unknown';
    };
    window.QA.sigNow = () => {
      const s = window.QA.screen();
      const B = ZB.B(), R = ZB.R();
      return s + '|' + (R ? R.floor + ':' + R.hp : 'x') + '|' + (B ? B.turn + ':' + B.foe.hp + ':' + B.hand.length + ':' + B.energy : 'x');
    };
  });

  const runOnce = async (runIdx) => {
    await page.evaluate(() => {
      ZB.R() && (window.__x = 1);
      localStorage.removeItem('zebra-run');
      ZB.newRun();
      window.QA.cur = { run: window.QA.runs.length + 1, maxFloor: 0, deathFloor: null, fights: 0,
        longestFight: 0, stalls: 0, sunsets: 0, lowHp: 0, endedBy: null, screens: {} };
      screenMap();
    });

    let lastSig = '', same = 0;
    for (let tick = 0; tick < 4000; tick++) {
      const st = await page.evaluate((MAX_FLOOR) => {
        const Q = window.QA, s = Q.screen(), B = ZB.B(), R = ZB.R();
        Q.cur.screens[s] = (Q.cur.screens[s] || 0) + 1;
        Q.seenScreens[s] = (Q.seenScreens[s] || 0) + 1;
        if (R){ Q.cur.maxFloor = Math.max(Q.cur.maxFloor, R.floor); Q.cur.hpPct = Math.round(R.hp / R.mhp * 100); }

        try {
          if (s === 'tut'){ const b = document.querySelector('#tutScrim button'); if (b) b.click(); }
          else if (s === 'overlay'){
            const x = document.querySelector('#dcClose,#dClose,#dwClose,#cbX,#dsX,.ovlDeck .btn.red');
            if (x) x.click();
          }
          else if (s === 'ceremony'){ /* let it play out */ }
          else if (s === 'battle'){
            if (B && !B.over && !B.busy && !B.aiPending){
              Q.cur.lastFoe = B.foe.name + (B.foe.trait ? ' [' + B.foe.trait + ']' : '') + ' (' + B.kind + ' f' + R.floor + ')';
              Q.seenKinds[B.kind] = (Q.seenKinds[B.kind] || 0) + 1;
              if (B.foe.trait) Q.seenTraits[B.foe.trait] = (Q.seenTraits[B.foe.trait] || 0) + 1;
              const k = B.foe.pat[B.foe.pi % B.foe.pat.length];
              Q.seenVerbs[k] = (Q.seenVerbs[k] || 0) + 1;
              if (B.turn >= 12) Q.cur.sunsets++;
              if (R && R.hp / R.mhp < .25) Q.cur.lowHp++;
              Q.cur.longestFight = Math.max(Q.cur.longestFight, B.turn);
              autoPolicy();
            }
          }
          else if (s === 'reward'){
            const cards = document.querySelectorAll('#hand > div');
            const pow = document.querySelector('.pow');
            if (pow) pow.click();
            else if (cards.length && Math.random() < .75) cards[Math.floor(Math.random() * cards.length)].click();
            else document.querySelector('#bSkip').click();
          }
          else if (s === 'crossing'){
            const paths = document.querySelectorAll('.crossPath');
            paths[Math.floor(Math.random() * paths.length)].click();
          }
          else if (s === 'map'){
            const doors = document.querySelectorAll('.door');
            doors[Math.floor(Math.random() * doors.length)].click();
          }
          else if (s === 'shop'){
            /* buy something affordable sometimes, then leave */
            const btns = [...document.querySelectorAll('.btn')].filter(b => !b.disabled && /◆/.test(b.textContent) && b.id !== 'bGo');
            if (btns.length && Math.random() < .4) btns[Math.floor(Math.random() * btns.length)].click();
            else document.querySelector('#bGo').click();
          }
          else if (s === 'rest'){
            const blend = document.querySelector('#bBlend');
            if (blend && Math.random() < .5) blend.click();
            else { const r = document.querySelector('#bRest'); if (r) r.click(); }
          }
          else if (s === 'blend'){
            const cards = document.querySelectorAll('#hand .card');
            if (cards.length >= 2){
              const a = Math.floor(Math.random() * cards.length);
              let b = Math.floor(Math.random() * cards.length);
              if (b === a) b = (a + 1) % cards.length;
              cards[a].click(); cards[b].click();
              const go = document.querySelector('#bDo');
              if (go && !go.disabled) go.click();
              else { const bk = document.querySelector('#bBack'); if (bk) bk.click(); }
            } else { const bk = document.querySelector('#bBack'); if (bk) bk.click(); }
          }
          else if (s === 'death'){ Q.cur.deathFloor = Q.cur.maxFloor; Q.cur.endedBy = 'death'; return { done: true, why: 'died to ' + (Q.cur.lastFoe || '?') }; }
          else if (s === 'drop'){ const b = document.querySelector('.btn'); if (b) b.click(); }

          else if (s === 'title'){ const b = document.querySelector('#bRun'); if (b) b.click(); }
          else {
            /* unknown screen: press the most exit-looking button rather than idling */
            const ex = document.querySelector('#bGo,#bBack,#bLeave,#bSkip,.btn.red') || document.querySelector('.btn');
            if (ex) ex.click();
          }
        } catch (e) { return { done: true, why: 'THREW: ' + e.message }; }

        if (R && R.floor >= MAX_FLOOR){ Q.cur.endedBy = 'reached cap'; return { done: true, why: 'cap' }; }
        const sig = Q.sigNow();
        if (sig === Q.lastSig){ Q.rep = (Q.rep || 0) + 1; } else { Q.rep = 0; Q.lastSig = sig; }
        if (Q.rep === 40){
          Q.nudges = (Q.nudges || 0) + 1;
          const ex = document.querySelector('#bGo,#bBack,#bLeave,#bSkip') || document.querySelector('.btn');
          if (ex) ex.click();
        }
        return { done: false, sig, screen: s, busy: !!(B && B.busy), rep: Q.rep };
      }, MAX_FLOOR);

      if (st.done) return st.why;

      /* WATCHDOG · nothing changed for 90 ticks (~9s) = a real stall */
      if (st.sig === lastSig) same++; else { same = 0; lastSig = st.sig; }
      if (same > 90) {
        const dbg = await page.evaluate(() => {
          const B = ZB.B(), R = ZB.R();
          return { screen: window.QA.screen(), floor: R && R.floor, hp: R && R.hp,
            busy: B && B.busy, over: B && B.over, aiPending: B && B.aiPending, turn: B && B.turn,
            energy: B && B.energy, foe: B && B.foe.name, foeHp: B && B.foe.hp, foeTrait: B && B.foe.trait,
            hand: B && B.hand.map(c => c.id + ':' + c.cost + (c.cursed ? ':CURSED' : '')),
            btns: [...document.querySelectorAll('.btn')].slice(0, 6).map(b => (b.id || '?') + ':' + b.textContent.trim().slice(0, 14)) };
        });
        await page.screenshot({ path: SP + `qa-stall-run${runIdx}.png` });
        await page.evaluate(d => { window.QA.stalls.push(d); window.QA.cur.stalls++; }, dbg);
        return 'STALL: ' + JSON.stringify(dbg);
      }
      await page.waitForTimeout(100);
    }
    return 'tick limit';
  };

  const results = [];
  for (let i = 1; i <= RUNS; i++) {
    const why = await runOnce(i);
    const cur = await page.evaluate(() => { window.QA.runs.push(window.QA.cur); return window.QA.cur; });
    results.push({ run: i, why, ...cur });
    console.log(`run ${i}: floor ${cur.maxFloor} · ${why.slice(0, 90)} · longest fight ${cur.longestFight}t · sunset turns ${cur.sunsets} · low-HP turns ${cur.lowHp} · stalls ${cur.stalls}`);
  }

  const agg = await page.evaluate(() => ({ traits: window.QA.seenTraits, verbs: window.QA.seenVerbs,
    kinds: window.QA.seenKinds, screens: window.QA.seenScreens, stalls: window.QA.stalls }));

  const floors = results.map(r => r.maxFloor).sort((a, b) => a - b);
  const deaths = results.filter(r => r.endedBy === 'death').length;
  const med = floors[Math.floor(floors.length / 2)];
  console.log('\n===== QA REPORT =====');
  console.log('floors reached  :', floors.join(', '), '| median', med);
  console.log('deaths          :', deaths + '/' + RUNS, '| reached cap:', results.filter(r => r.endedBy === 'reached cap').length);
  console.log('longest fight   :', Math.max(...results.map(r => r.longestFight)), 'turns');
  console.log('sunset turns    :', results.reduce((s, r) => s + r.sunsets, 0), '(fights dragging past turn 12)');
  console.log('low-HP turns    :', results.reduce((s, r) => s + r.lowHp, 0), '(tension)');
  console.log('STALLS          :', agg.stalls.length ? JSON.stringify(agg.stalls) : 'NONE — always progressing ✅');
  console.log('content seen    : traits', JSON.stringify(agg.traits), '\n                  verbs', JSON.stringify(agg.verbs), '\n                  fights', JSON.stringify(agg.kinds));
  console.log('screens visited :', JSON.stringify(agg.screens));
  console.log('harness nudges  :', await page.evaluate(() => window.QA.nudges || 0), '(bot escapes; not game stalls)');
  console.log('crashes         :', crashes.length ? crashes.slice(0, 5) : 'none');
  await browser.close();
})();
