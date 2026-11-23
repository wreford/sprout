// HEADSTRONG (16-bit): a bot runs the first room, jumping gaps and ducks and head-butting through the cracked wall to
// the towel; the dash breaks tiles, a bubble bounces the head up, and the game says nothing on the way
module.exports = ({ S, L, fs, ok, logs, held, dir, quiet }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const g = L.makeGame(fs.readFileSync(dir + "/examples/headstrong.sp", "utf8"), { W: 320, H: 224, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const st = k => g.state.fieldNames().includes(k) ? g.state.field(k) : undefined;
  const xy = p => [p.methods.x.run(p), p.methods.y.run(p)];
  g.tick(1 / 60, held([])); g.tick(1 / 60, held(["one"])); g.tick(1 / 60, held([]));
  ok("headstrong: a press starts the first room", st("mode") === "play" && st("room") === 1, st("mode"));
  const before = S.partsOf(st("world")).map(String).join("").split("%").length;
  let jumpFor = 0, lastX = 0, stuck = 0, bounced = false;
  for (let t = 0; t < 60 * 60 && st("mode") === "play"; t++) {
    const h = st("player"), [x, y] = xy(h.field("at")), ground = h.field("ground");
    const world = S.partsOf(st("world")).map(String), col = c => Math.floor(c / 16), row = Math.floor((y + 30) / 16);
    const ahead = c => (world[row] || "")[col(x + 9 + c)] || "#";
    const gap = ahead(18) === "." || ahead(18) === "~" || ahead(30) === "~";
    const duckNear = S.partsOf(st("ducks")).some(d => { const [dx, dy] = xy(d.field("at")); return d.field("bonked") < 0 && dx > x && dx - x < 54 && Math.abs(dy - y) < 30; });
    const wall = (world[Math.floor((y + 14) / 16)] || "")[col(x + 22)];
    if (x - lastX < 0.2) stuck++; else stuck = 0; lastX = x;
    const keys = ["right"];
    if (ground && jumpFor <= 0 && (gap || duckNear || (stuck > 8 && wall === "#"))) jumpFor = 26;
    if (jumpFor > 0) { keys.push("one"); jumpFor--; }
    if (stuck > 8 && wall === "%" && t % 20 === 0) keys.push("two");
    if (stuck > 40 && t % 90 === 0) { keys.length = 0; keys.push("left"); }
    const vy = h.field("speed").methods.y.run(h.field("speed"));
    g.tick(1 / 60, held(keys));
    const after = st("player"); if (after && vy > 0 && after.field("speed").methods.y.run(after.field("speed")) <= -400) bounced = true;
  }
  ok("headstrong: a bot clears the first room, through the cracked wall to the towel", st("mode") === "dry" && st("room") === 1 && st("score") > 500, [st("mode"), st("room"), st("score")]);
  ok("headstrong: the head-butt dash breaks cracked tiles", S.partsOf(st("world")).map(String).join("").split("%").length < before);
  // a bubble: drop the head onto one and it bounces up high
  const bub = L.makeGame(fs.readFileSync(dir + "/examples/headstrong.sp", "utf8"), { W: 320, H: 224, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  bub.tick(1 / 60, held([])); bub.tick(1 / 60, held(["one"])); bub.tick(1 / 60, held([]));
  const b0 = S.partsOf(bub.state.field("bubbles"))[0], home = b0.field("home"), [bx, by] = xy(home);
  const m = new Map(S.fieldsOf(bub.state)), p = new Map(S.fieldsOf(m.get("player")));
  p.set("at", S.load(`p : pair [${bx - 9}, ${by - 40}]`).field("p")); p.set("speed", S.load("p : 0x60").field("p")); p.set("ground", false);
  m.set("player", S.valueCellOf([], p)); bub.setState(S.valueCellOf([], m));
  let up = false; for (let t = 0; t < 30 && !up; t++) { bub.tick(1 / 60, held([])); const sp = bub.state.field("player").field("speed"); up = sp.methods.y.run(sp) <= -400; }
  ok("headstrong: a falling head bounces high off a bubble, which pops", up && S.partsOf(bub.state.field("bubbles"))[0].field("popped") > 0);
  const drawn = g.draw().length;
  ok("headstrong: draws the room, the hero and the strip on a 320 by 224 screen", drawn > 15, drawn);
  ok("headstrong: plays without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
