// Brick Snap: a bot snaps bricks where they pop the most lines, until no brick fits; swapping and dealing work
module.exports = ({ S, L, fs, ok, logs, held, quiet, dir }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const g = L.makeGame(fs.readFileSync(dir + "/examples/brick-snap.sp", "utf8"), { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.field(k), tap = k => { g.tick(1 / 60, held([k])); g.tick(1 / 60, held([])); };
  const board = () => S.partsOf(st("board")).map(r => S.partsOf(r));
  const cellsOf = pc => S.partsOf(pc.field("cells")).map(p => p.unpackParts());
  const fits = (b, cs, x, y) => cs.every(([dx, dy]) => x + dx >= 1 && y + dy >= 1 && x + dx <= 8 && y + dy <= 8 && b[y + dy - 1][x + dx - 1] === 0);
  const popped = (b, cs, x, y) => { const nb = b.map(r => r.slice()); for (const [dx, dy] of cs) nb[y + dy - 1][x + dx - 1] = 1; return nb.filter(r => r.every(v => v)).length + [0, 1, 2, 3, 4, 5, 6, 7].filter(c => nb.every(r => r[c])).length; };
  tap("one");
  ok("brick snap: 1 starts a game with three bricks in the tray", st("mode") === "play" && S.partsOf(st("tray")).length === 3);
  const firstHold = st("hold"); tap("two");
  ok("brick snap: 2 takes the next brick in the tray", st("hold") === firstHold % 3 + 1);
  let placed = 0, clears = 0, dealsSeen = st("deals");
  for (let turn = 0; turn < 400 && st("mode") === "play"; turn++) {
    const b = board(); let best = null;
    S.partsOf(st("tray")).forEach((pc, i) => { if (pc.field("used")) return; const cs = cellsOf(pc);
      for (let y = 1; y <= 8; y++) for (let x = 1; x <= 8; x++) if (fits(b, cs, x, y)) {
        const n = popped(b, cs, x, y), score = n * 100 - cs.reduce((s, [dx, dy]) => s + x + dx + y + dy, 0) / cs.length;
        if (!best || score > best.score) best = { i: i + 1, x, y, score, n }; } });
    if (!best) break;
    for (let k = 0; k < 3 && st("hold") !== best.i; k++) tap("two");
    for (let k = 0; k < 9; k++) { const [ax, ay] = st("at").unpackParts(); if (ax === best.x && ay === best.y) break; tap(ax < best.x ? "right" : ax > best.x ? "left" : ay < best.y ? "down" : "up"); }
    tap("one"); placed++; if (best.n) clears++;
    if (turn % 7 === 0) g.draw();
  }
  ok("brick snap: a bot snaps bricks down and pops lines, with new bricks dealt as the tray empties", placed >= 30 && clears >= 8 && st("deals") > dealsSeen + 8, [placed, clears, st("deals")]);
  ok("brick snap: the game ends when no brick left fits, and the best score is kept", st("mode") === "over" && st("best") === st("score") && st("keep").field("best") === st("score") && st("score") > 200, [st("mode"), st("score"), st("best")]);
  for (let t = 0; t < 90; t++) g.tick(1 / 60, held([]));
  tap("one");
  ok("brick snap: from game over, 1 goes back to the title", st("mode") === "title");
  ok("brick snap: plays without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
