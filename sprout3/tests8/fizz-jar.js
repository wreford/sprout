// Fizz Jar: a bot that plans where each pair goes clears the first jar; a jar left to fill fizzles out; all quietly
module.exports = ({ S, L, fs, ok, logs, held, quiet, dir }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  const src = fs.readFileSync(dir + "/examples/fizz-jar.sp", "utf8");
  const make = () => L.makeGame(src, { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  logs.length = 0;
  const g = make(), st = k => g.state.field(k), tick = k => g.tick(1 / 60, held(k ? [k] : []));
  const tap = k => { tick(k); tick(); };
  const OFF = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const wellOf = () => S.partsOf(st("well")).map(r => r.split(""));
  // the same rules as the game: loose (small) letters fall onto the bottom, a cell or a sour; runs of four pop
  const settle = w => { for (let c = 0; c < 8; c++) { let floor = 14; for (let r = 14; r >= 0; r--) { const v = w[r][c]; if (v === ".") continue; if (v === v.toUpperCase()) { floor = r - 1; continue; } w[r][c] = "."; w[floor][c] = v; floor--; } } return w; };
  const runsOf = w => { const out = []; for (let r = 0; r < 15; r++) for (let c = 0; c < 8; c++) { const v = w[r][c].toLowerCase(); if (v === ".") continue;
    const same = (dr, dc) => { let n = 0, rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 15 && cc >= 0 && cc < 8 && w[rr][cc].toLowerCase() === v) { n++; rr += dr; cc += dc; } return n; };
    if (same(0, -1) + 1 + same(0, 1) >= 4 || same(-1, 0) + 1 + same(1, 0) >= 4) out.push([r, c]); } return out; };
  const score = (well, col, turn, colours) => {
    const [dx, dy] = OFF[turn - 1], w = well.map(r => r.slice()), open = (c, r) => c >= 0 && c < 8 && r >= 0 && r < 15 && w[r][c] === ".";
    let r = 0; if (!open(col, 0) || !open(col + dx, dy)) return -1e9;
    while (open(col, r + 1) && open(col + dx, r + 1 + dy)) r++;
    w[r][col] = colours[0]; w[r + dy][col + dx] = colours[1]; settle(w);
    let value = 0, found;
    for (let chain = 1; (found = runsOf(w)).length; chain++) { for (const [pr, pc] of found) { value += (w[pr][pc] === w[pr][pc].toUpperCase() ? 1000 : 10) * chain; w[pr][pc] = "."; } settle(w); }
    for (const [pr, pc] of [[r, col], [r + dy, col + dx]]) for (const [a, b] of OFF) { const v = (w[pr + b] || [])[pc + a]; if (v && v !== "." && w[pr][pc] !== "." && v.toLowerCase() === w[pr][pc]) value += v === v.toUpperCase() ? 60 : 25; }
    const top = w.findIndex(row => row.some(v => v !== ".")); return value + (top < 0 ? 15 : top) * 8 - (top >= 0 && top < 4 ? 5000 : 0);
  };
  let t = 0, seen = -1, reachedTwo = false;
  tap("one");
  while (t++ < 6000 && !reachedTwo && st("mode") !== "over") {
    if (st("mode") === "play" && st("jar") === 2) { reachedTwo = true; break; }
    if (st("mode") !== "play" || st("phase") !== "fall" || st("dropped") === seen) { tick(); continue; }
    seen = st("dropped");
    const colours = S.partsOf(st("piece").field("colours")), well = wellOf();
    let best = [4, 1], top = -1e10;
    for (const turn of [1, 2, 3]) for (let col = 0; col < 8; col++) { const v = score(well, col, turn, colours); if (v > top) { top = v; best = [col + 1, turn]; } }
    for (let i = 0; i < (best[1] - 1); i++) tap("one");
    for (let i = 0; i < 10 && st("piece").field("at").x !== best[0]; i++) tap(st("piece").field("at").x < best[0] ? "right" : "left");
    for (let i = 0; i < 400 && st("dropped") === seen && st("mode") === "play"; i++) tick("down");
  }
  ok("fizz jar: a bot that plans each pair pops every sour and reaches the second jar", reachedTwo, [st("mode"), st("jar"), st("score"), S.format(st("well"))]);
  ok("fizz jar: clearing a jar scores and keeps the best", st("score") >= 500 && st("best") === st("score") && st("keep").field("best") === st("score"), st("score"));
  ok("fizz jar: the second jar holds more sours than the first", S.partsOf(st("well")).join("").replace(/[^RGB]/g, "").length >= 5);
  const g2 = make(); g2.tick(1 / 60, held([])); g2.tick(1 / 60, held(["one"]));
  for (let i = 0; i < 9000 && g2.state.field("mode") !== "over"; i++) g2.tick(1 / 60, held(["down"]));
  ok("fizz jar: a jar left to fill up fizzles out", g2.state.field("mode") === "over");
  for (let i = 0; i < 120; i++) g2.tick(1 / 60, held(i === 100 ? ["two"] : []));
  ok("fizz jar: after fizzling out, a button goes back to the title", g2.state.field("mode") === "title");
  g.draw(); g2.draw();
  ok("fizz jar: plays and draws without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
