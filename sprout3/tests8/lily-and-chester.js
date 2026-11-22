// Lily and Chester: a bot looks after Chester for a whole week (hay, water, a brush, a ride, a mucked-out stall, then
// bed) and takes him to the county show; he comes home with a ribbon, the best is kept, and the game says nothing
module.exports = ({ S, L, fs, ok, logs, held, quiet, dir }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const g = L.makeGame(fs.readFileSync(dir + "/examples/lily-and-chester.sp", "utf8"), { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.field(k), tap = k => { g.tick(1 / 60, held([k])); g.tick(1 / 60, held([])); };
  const idle = n => { for (let i = 0; i < n; i++) g.tick(1 / 60, held([])); };
  // the menu is two across: HAY AN-APPLE / WATER BRUSH / MUCK-OUT RIDE / SLEEP
  const pick = k => { for (let i = 0; i < 4; i++) tap("up"); tap("left"); for (let i = 0; i < (k - 1) % 2; i++) tap("right"); for (let i = 0; i < Math.floor((k - 1) / 2); i++) tap("down"); tap("one"); };
  const ride = () => {
    for (let t = 0; t < 3000 && st("mode") === "ride"; t++) {
      const r = st("ride"), lane = S.partsOf(g.file.field("course-for").run(st("day")));
      const soon = lane.some(o => { const sx = o.field("at") - r.field("dist"); return sx > 96 && sx < 104; });
      g.tick(1 / 60, held(soon && r.field("hy") <= 0 ? ["one"] : []));
    }
    idle(80); tap("one");
  };
  idle(2); tap("one");
  let shoes = 0, bumps = 0, rides = 0;
  for (let day = 1; day <= 6; day++) {
    pick(1); pick(3);
    pick(4); for (let i = 0; i < 16; i++) tap(i % 2 ? "left" : "right"); idle(250);
    if (st("levels").field("rest") >= 25) { pick(6); const r0 = st("mode"); if (r0 === "ride") { ride(); rides++; shoes += st("ride").field("shoes"); bumps += st("ride").field("bumps"); } }
    pick(5);
    pick(7); idle(200);
  }
  ok("lily and chester: a week of care ends at the county show", st("mode") === "show" && st("day") === 7, [st("mode"), st("day")]);
  ok("lily and chester: a careful rider clears nearly every jump", rides >= 5 && bumps <= rides * 2 && shoes >= rides * 12, [rides, shoes, bumps]);
  const score = g.file.field("show-score").run(g.state), place = g.file.field("place-of").run(score);
  idle(240); tap("one");
  ok("lily and chester: a well-kept horse wins at least a red ribbon, and the best is kept", place >= 2 && st("mode") === "title" && st("best") === place + 1 && st("keep").field("best") === place + 1, [score, place, st("best")]);
  g.draw();
  ok("lily and chester: a whole week without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
