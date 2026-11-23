// Starlane 2025 (decision 134), the SPROUT·256 showcase: a bot surfs, jumping gates, spinning through mines, boosting,
// bombing once, and catching orbs, on a 480x270 screen
module.exports = ({ S, L, fs, ok, logs, held, dir, quiet }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const g = L.makeGame(fs.readFileSync(dir + "/examples/starlane.sp", "utf8"), { W: 480, H: 270, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.fieldNames().includes(k) ? g.state.field(k) : undefined;
  const tap = keys => { g.tick(1 / 60, held(keys)); g.tick(1 / 60, held([])); };
  tap(["one"]);
  ok("starlane: button 1 starts a run", st("mode") === "run", st("mode"));
  const used = new Set();
  let drawn = 0, t = 0, bombed = false;
  for (; t < 60 * 60 && st("mode") === "run"; t++) {
    const lane = st("lane"), things = S.partsOf(st("things")).map(x => ({ kind: x.field("kind"), lane: x.field("lane"), z: x.field("z") }));
    const danger = things.find(x => x.lane === lane && x.z < 0.22 && (x.kind === "gate" || x.kind === "mine"));
    const prize = things.filter(x => (x.kind === "orb" || x.kind === "star") && x.z < 0.6).sort((a, b) => a.z - b.z)[0];
    let keys = [];
    if (danger) keys = [danger.kind === "mine" && t % 2 ? "three" : "two"];
    else if (!bombed && things.filter(x => x.kind !== "orb" && x.kind !== "star").length >= 3) { keys = ["four"]; bombed = true; }
    else if (t % 300 === 120) keys = ["one"];
    else if (prize && prize.lane !== lane && !things.some(x => x.lane === prize.lane && x.z < 0.3 && (x.kind === "gate" || x.kind === "mine"))) keys = [prize.lane < lane ? "left" : "right"];
    keys.forEach(k => used.add(k));
    if (keys.length) tap(keys); else g.tick(1 / 60, held([]));
    if (t % 30 === 0) drawn += g.draw().length;
  }
  ok("starlane: a bot surfs past a minute or scores well, catching orbs", st("score") > 150, [st("score"), st("shields"), t]);
  ok("starlane: all four buttons have a use", ["one", "two", "three", "four"].every(k => used.has(k)), [...used]);
  ok("starlane: draws its sky, lane and surfer", drawn > 500, drawn);
  ok("starlane: plays without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
