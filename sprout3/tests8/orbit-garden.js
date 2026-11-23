// Orbit Garden (decision 145): a bot hops from ring to ring with taps, aiming at the next ring; it climbs, gathers
// light, loses, plays again, and the game says nothing
module.exports = ({ S, L, fs, ok, logs, held, dir }) => {
  logs.length = 0;
  const src = fs.readFileSync(dir + "/examples/orbit-garden.sp", "utf8");
  const fx = [];
  const g = L.makeGame(src, { W: 390, H: 780, host: { saved: S.valueCellOf([], new Map()) }, onEffect: e => fx.push(e[0]) });
  const st = k => g.state.field(k), none = held([]);
  const tap = () => { g.down(195, 500); g.tick(1 / 60, none); g.up(); };
  g.tick(1 / 60, none);
  ok("orbit garden: it opens on its title, a seed already riding the first ring", st("mode") === "title" && g.draw().length > 20);
  tap();
  ok("orbit garden: a tap on the screen begins a climb", st("mode") === "play" && st("score") === 0);
  let best = 0, games = 0, lit = 0;
  for (let t = 0; t < 60 * 240 && games < 6; t++) {
    const mode = st("mode");
    if (mode === "over") { best = Math.max(best, st("score")); lit = Math.max(lit, st("light")); games++; for (let w = 0; w < 60; w++) g.tick(1 / 60, none); tap(); continue; }
    if (mode === "play" && st("flying") === false) {
      const rings = S.partsOf(st("rings")), on = st("on"), cur = rings[on - 1], next = rings[on];
      const turn = (((st("turn0") + cur.field("spin") * (st("clock") + 1 / 60 - st("on-at"))) % 1) + 1) % 1;
      const want = (((Math.atan2(next.field("y") - cur.field("y"), next.field("x") - cur.field("x")) / (2 * Math.PI)) % 1) + 1) % 1;
      let d = Math.abs(turn - want); d = Math.min(d, 1 - d);
      if (d < 0.015) { tap(); continue; }
    }
    g.tick(1 / 60, none);
    if (t % 30 === 0) g.draw();
  }
  ok("orbit garden: a bot that lets go when the next ring is straight out climbs past the fifth ring", best >= 5, [best, games]);
  ok("orbit garden: it gathers light on the way, and a fall ends the climb and keeps the best", lit >= 1 && games >= 1 && S.libraries.toJS(st("keep")).best >= best, [lit, games]);
  ok("orbit garden: taps buzz the phone and every hop and landing chimes", fx.includes("buzz") && fx.filter(n => n === "beep").length > 5, fx.slice(0, 8));
  ok("orbit garden: it climbs and draws without a message", logs.length === 0, logs.slice(0, 3));
};
