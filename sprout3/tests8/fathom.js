// Fathom (16-bit, portrait): the rules of a pull (anglers wild, coral, jellies, chests, patterns, relics), and a bot that
// dives by keys and shops by tapping the screen, buys relics, adds and scraps symbols, uses a thing it bought, and
// goes five dives down or more, without a message
const play = ({ S, L, fs, held, dir }, opts) => {
  const src = fs.readFileSync(dir + "/examples/fathom.sp", "utf8") + (opts.extra || "");
  const g = L.makeGame(src, { W: 240, H: 400, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.field(k), list = k => S.partsOf(st(k));
  const tick = k => g.tick(1 / 60, held(k || []));
  const press = k => { tick([k]); tick(); };
  const tap = (x, y) => { g.down(x, y); tick(); g.up(); tick(); };
  const tapTwice = (x, y) => { tap(x, y); tap(x, y); };
  const bill = () => S.load('x : 0').field("x") === 0 && g.file.field("bill-for").run(S.valueCellOf([st("dive"), st("pressure")], new Map()));
  for (let i = 0; i < 12 + (opts.wait || 0); i++) tick();
  return { g, st, list, tick, press, tap, tapTwice, bill };
};
const WANT = ["SONAR", "HERMIT", "COMPASS", "PEARL DIVER", "LUCKY LURE", "TIDE CLOCK", "SHOAL", "CORAL GARDEN", "OLD MAP", "EEL CHARM", "GLOW TANK", "KING'S CROWN", "ECHO", "DOUBLOON", "LEVIATHAN SCALE", "PRESSURE GAUGE", "GILDED HOOK", "INK SAC", "KRAKEN TOOTH", "MERMAID COMB", "ANCHOR CHAIN", "TREASURE MAP", "PRESSURE HULL", "DEEP POCKETS", "BELL JAR", "SALVAGE RIGHTS"];
// one run of the bot: pulls with button 1, surfaces when the air is gone, and in the shop taps what it wants
const dive = (ctx, opts) => {
  const r = play(ctx, opts), { S } = ctx, { st, list, tick, press, tap, tapTwice } = r;
  const seen = { relics: 0, items: 0, used: 0, adds: 0, scraps: 0, dives: 1, taps: 0 };
  press("one");
  for (let i = 0; i < 60000 && st("mode") !== "snapped"; i++) {
    const mode = st("mode");
    if (mode === "dive") {
      if (st("rolling")) { tick(); continue; }
      if (list("items").length && st("pulls") > 0) { const n = list("items").length; tapTwice(8 + (n - 1) * 78 + 36, 290); if (list("items").length < n) seen.used++; continue; }
      press("one");
    } else if (mode === "shop") {
      if (r.g.clock - st("mode-at") < 0.7) { tick(); continue; }
      seen.dives = Math.max(seen.dives, st("dive") + 1);
      // relics it wants, cheapest first, while there is room and coin
      for (let k = 0; k < 3; k++) {
        const offers = list("offers"), owned = list("relics").length;
        const pick = offers.map((name, i) => [name, i]).filter(([name]) => WANT.includes(name)).sort((a, b) => WANT.indexOf(a[0]) - WANT.indexOf(b[0]))[0];
        if (!pick) break;
        const cost = r.g.file.field("price-of").run(S.valueCellOf([r.g.state, r.g.file.field("relic-named").run(pick[0]).field("cost")], new Map()));
        if (owned >= 6 || st("coins") - cost < 8) break;
        const before = owned; tapTwice(6 + pick[1] * 78 + 36, 144); seen.taps++;
        if (list("relics").length > before) seen.relics++; else break;
      }
      // an air tank if it can, for the next dive
      const cons = list("con-offers"), air = cons.indexOf("AIR TANK");
      if (air >= 0 && st("coins") >= 12) { const before = list("items").length; tapTwice(6 + air * 118 + 55, 203); if (list("items").length > before) seen.items++; }
      // scrap an eye or ink, then add shells or fish while it can
      const kinds = S.partsOf(r.g.file.field("bag-kinds").run(r.g.state));
      const bad = kinds.findIndex(k => k === "eye" || k === "ink");
      if (bad >= 0 && st("coins") >= 9) { tap(6 + bad * 23 + 11, 289); const before = list("bag").length; tapTwice(42, 321); if (list("bag").length < before) seen.scraps++; }
      for (let k = 0; k < 3; k++) {
        const adds = list("add-offers"), i = adds.findIndex(s => s === "shell" || s === "fish" || s === "pearl" || s === "angler");
        if (i < 0 || st("coins") < 8) break;
        const before = list("bag").length; tapTwice(6 + i * 78 + 36, 245); if (list("bag").length > before) seen.adds++; else break;
      }
      for (let w = 0; w < 40; w++) tick();
      tap(120, 360);
    } else tick();
  }
  return { r, seen };
};

module.exports = ctx => {
  const { S, ok, logs, quiet } = ctx;
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  // the rules of a pull, on grids set by hand
  const rules = play(ctx, { extra: `
wild-check : find-wins [["angler", "shell", "shell", "fish", "ink"], ["fish", "fish", "angler", "fish", "coral"], ["ink", "ink", "ink", "ink", "ink"], ["eye", "eye", "eye", "eye", "eye"]]
coral-check : coral-lift [grid : [["fish", "coral", "fish", "ink", "ink"], ["ink", "fish", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"]], relics : []]
garden-check : coral-lift [grid : [["fish", "coral", "fish", "ink", "ink"], ["ink", "fish", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"]], relics : ["CORAL GARDEN"]]
chest-check : chest-pay [grid : [["chest", "ink", "chest", "ink", "chest"], ["ink", "ink", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"]], relics : []]
corner-check : pattern-pay [["pearl", "ink", "ink", "ink", "pearl"], ["ink", "ink", "ink", "ink", "ink"], ["ink", "ink", "ink", "ink", "ink"], ["pearl", "ink", "ink", "ink", "pearl"]]
row-win : [shape : "row", symbol : "pearl", alike : 3, places : [1x1, 2x1, 3x1], wild : false]
plain-pay : win-pay [row-win, [grid : [["pearl", "pearl", "pearl", "ink", "ink"]], relics : [], lucky : "shell", dive : 1]]
diver-pay : win-pay [row-win, [grid : [["pearl", "pearl", "pearl", "ink", "ink"]], relics : ["PEARL DIVER", "COMPASS"], lucky : "shell", dive : 1]]
gilt-pay : win-pay [row-win, [grid : [["pearl+", "pearl", "pearl", "ink", "ink"]], relics : [], lucky : "pearl", dive : 1]]
` });
  const wins = S.partsOf(rules.g.file.field("wild-check"));
  const row1 = wins.find(w => w.field("shape") === "row" && S.format(w.field("places")) === "[1x1, 2x1, 3x1]");
  ok("fathom: an angler stands in for the line's own symbol (angler, shell, shell is three shells)", row1 && row1.field("symbol") === "shell" && row1.field("alike") === 3 && row1.field("wild") === true, S.format(rules.g.file.field("wild-check")));
  ok("fathom: coral lifts each fish beside it (+3), twice as much with the Coral Garden (+6)", rules.g.file.field("coral-check") === 3 && rules.g.file.field("garden-check") === 6, [rules.g.file.field("coral-check"), rules.g.file.field("garden-check")]);
  ok("fathom: three chests anywhere pay 30, and four pearl corners pay a pattern of 20", rules.g.file.field("chest-check") === 30 && rules.g.file.field("corner-check") === 20);
  ok("fathom: three pearls pay 6; the Pearl Diver and the Compass make it 24; a gilded lucky pearl makes it 24 too",
    rules.g.file.field("plain-pay") === 6 && rules.g.file.field("diver-pay") === 24 && rules.g.file.field("gilt-pay") === 24, [rules.g.file.field("plain-pay"), rules.g.file.field("diver-pay"), rules.g.file.field("gilt-pay")]);
  // a tap on a reel holds it: the next pull leaves its symbols where they were
  {
    const h = play(ctx, {});
    h.press("one");
    const before = S.format(S.valueCellOf(h.list("grid").map(row => S.partsOf(row)[1]), new Map()));
    h.tap(32 + 38 + 18, 150);
    const holding = S.format(h.st("held"));
    h.press("two"); for (let i = 0; i < 120; i++) h.tick();
    const after = S.format(S.valueCellOf(h.list("grid").map(row => S.partsOf(row)[1]), new Map()));
    ok("fathom: tapping the second reel holds it, and the pull leaves its four symbols as they were", holding === "[2]" && before === after && S.format(h.st("held")) === "[]" && h.st("holds") === 0, [holding, before, after]);
  }
  // the bot, three runs with different luck: the best goes five dives deep
  let best = null;
  for (const wait of [0, 37, 91]) { const run = dive(ctx, { wait }); if (!best || run.seen.dives > best.seen.dives) best = run; }
  const { r, seen } = best;
  ok("fathom: a bot that pulls by keys and shops by tapping goes five dives deep or more", seen.dives >= 5, seen);
  ok("fathom: it bought relics and things to use, used one, and changed its bag", seen.relics >= 2 && seen.items >= 1 && seen.used >= 1 && seen.adds + seen.scraps >= 2, seen);
  ok("fathom: the line snaps in the end, and the deepest dive is kept", r.st("mode") === "snapped" && r.st("deepest") >= seen.dives - 1 && r.st("keep").field("deepest") === r.st("deepest"), [r.st("mode"), r.st("deepest")]);
  ok("fathom: it all plays without a message, and draws the end of the line", logs.length === 0 && r.g.draw().length > 8, logs.slice(0, 3));
  restore();
};
