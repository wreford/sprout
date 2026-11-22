// Basketball Legends 8: a bot builds a player, beats TANK in 1960 to 11 with dunks and jump shots let go at the top of
// the jump (released, decision 121), and moves on to 1970; holding a jump shot to the floor is a travel.
module.exports = ({ S, ok, logs, game, held, quiet }) => {
  const restore = quiet("zzfx", ["preset", "play"]);
  logs.length = 0;
  const make = () => game("basketball-legends", { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()) }, onEffect: () => {} });
  const g = make(), st = k => g.state.field(k), tick = keys => g.tick(1 / 60, held(keys)), tap = k => { tick([k]); tick([]); };
  tick([]);
  tap("one");                                              // title → build
  tap("right"); tap("right"); tap("down"); tap("down"); tap("right"); tap("right");
  const build = S.partsOf(st("build"));
  ok("basketball legends: four points spent on SHOT and HOPS", build.join() === "4,2,4,2" && st("spare") === 0, build.join() + " spare " + st("spare"));
  tap("one"); tap("one");                                  // to PLAY, then to the talk
  for (let i = 0; i < 40; i++) tick([]);
  tap("one");
  ok("basketball legends: the game tips off with your ball at the top", st("mode") === "play" && st("ball").field("by") === "me");
  let jumpers = 0, slams = 0, greens = 0;
  for (let t = 0; t < 40000; t++) {
    const mode = st("mode");
    if (mode === "won" || mode === "lost") break;
    if (mode !== "play") { tick([]); continue; }
    const me = st("me"), foe = st("foe"), ball = st("ball"), mx = me.field("x"), fx = foe.field("x");
    const bm = ball.field("mode"), by = ball.field("by"), keys = [];
    if (bm === "held" && by === "me") {
      const dunker = st("mine") % 4 < 2;
      if (st("cleared") === false) keys.push("left");
      else if (me.field("rising") === true) { if (me.field("vh") > 0) keys.push("one"); }
      else if (me.field("dunking") === true) keys.push("one", "right");
      else if (mx < (dunker ? 188 : 170)) keys.push("right");
      else { keys.push("one"); if (dunker) keys.push("right"); }
    } else if (bm === "held" && by === "foe") {
      const spot = Math.min(fx + 20, 222);
      if (spot - mx > 3) keys.push("right"); else if (mx - spot > 3) keys.push("left");
      if (foe.field("rising") === true && Math.abs(fx - mx) < 26 && me.field("h") <= 0) keys.push("one");
    } else {
      const bx = bm === "shot" ? 196 : ball.field("x");
      if (bx - mx > 3) keys.push("right"); else if (mx - bx > 3) keys.push("left");
    }
    const said = st("said"), at = st("said-at");
    tick(keys);
    if (st("said-at") !== at) { const now = st("said"); if (now === "GREEN!") greens++; if (now === "SLAM!") slams++; if (now === "+2" || now === "+3") jumpers++; }
  }
  ok("basketball legends: the bot beats TANK to 11", st("mode") === "won" && st("mine") >= 11, st("mode") + " " + st("mine") + "-" + st("theirs"));
  ok("basketball legends: it scores with slams and with green releases at the top of the jump", slams > 0 && greens > 0, "slams " + slams + " greens " + greens);
  for (let i = 0; i < 80; i++) tick([]);
  tap("one");                                              // won → one more point
  ok("basketball legends: a win gives one more point to spend", st("mode") === "level");
  tap("one");
  ok("basketball legends: then on to JET in 1970, a point stronger", st("mode") === "talk" && st("era") === 2 && S.partsOf(st("build")).reduce((a, b) => a + b, 0) === 13 && st("best") === 1);
  // holding a jump shot all the way back down to the floor is a travel
  const h = make(), hs = k => h.state.field(k), htick = keys => h.tick(1 / 60, held(keys));
  htick([]); for (const k of ["one", "", "down", "", "down", "", "down", "", "down", "", "down", "", "one", ""]) htick(k ? [k] : []);
  for (let i = 0; i < 40; i++) htick([]);
  htick(["one"]); htick([]);
  for (let i = 0; i < 90 && hs("mode") === "play"; i++) htick(["one"]);
  ok("basketball legends: landing with the ball still held is a TRAVEL", hs("mode") === "point" && hs("said") === "TRAVEL" && hs("next-ball") === "foe", hs("mode") + " " + hs("said"));
  ok("basketball legends: plays a game without a message", logs.length === 0, logs.slice(0, 3));
  restore();
};
