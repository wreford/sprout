// Headless tests for the example games: node game-tests.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log("FAIL", name, extra === undefined ? "" : extra); } };
const logs = []; S.setLog(m => logs.push(m));
const game = (name, opts) => L.makeGame(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8"), opts);
const held = keys => S.VFM([], new Map(keys.map(k => [k, true])));
const f = (g, k) => g.state.field(k);

// ---------------- Bounce
{
  const fx = [], g = game("bounce", { onEffect: e => fx.push(e[0]) });
  // follow the ball with a finger: it keeps bouncing and the score climbs
  let hits = 0;
  for (let t = 0; t < 1200; t++) { g.down(f(g, "ball").field("x"), 400); g.tick(1 / 60); }
  ok("bounce: following the ball scores", f(g, "score") >= 3, f(g, "score"));
  ok("bounce: hits beep", fx.filter(x => x === "beep").length >= 3);
  // let go: the ball is lost, score resets, best remembers
  g.up();
  const before = f(g, "score");
  for (let t = 0; t < 600; t++) { g.down(0, 400); g.tick(1 / 60); }
  ok("bounce: missing resets the score", f(g, "score") < before || before === 0, f(g, "score"));
  ok("bounce: best is kept", f(g, "best") >= before, [f(g, "best"), before]);
  ok("bounce: draws 5 things", g.draw().length === 5);
}

// ---------------- Snake
{
  const fx = [], g = game("snake", { onEffect: e => fx.push(e[0]) });
  // food sits 4 squares ahead: going straight eats it
  for (let t = 0; t < 40; t++) g.tick(1 / 60);
  ok("snake: moves on the beat", f(g, "body").part(1).field("x") > 5, S.fmt(f(g, "body").part(1)));
  for (let t = 0; t < 40; t++) g.tick(1 / 60);
  ok("snake: eats and grows", f(g, "score") === 1 && f(g, "body").count() === 4, [f(g, "score"), f(g, "body").count()]);
  ok("snake: eating beeps", fx.includes("beep"));
  // wraps around the right edge
  for (let t = 0; t < 120; t++) g.tick(1 / 60);
  const hx = f(g, "body").part(1).field("x");
  ok("snake: wraps around", hx >= 0 && hx < 20, hx);
  // turning: down then left then up bites a long enough snake
  const g2 = game("snake");
  g2.swap(fs.readFileSync(__dirname + "/examples/snake.sp", "utf8").replace("body : [[x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]",
    "body : [[x : 8, y : 10], [x : 7, y : 10], [x : 6, y : 10], [x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]").replace("food : [x : 9, y : 10]", "food : [x : 0, y : 0]"));
  const steer = (keys, n) => { for (let t = 0; t < n; t++) g2.tick(1 / 60, held(keys)); };
  steer(["down"], 8); steer(["left"], 8); steer(["up"], 8);
  ok("snake: biting yourself ends the game", f(g2, "over") === true, S.fmt(f(g2, "body")));
  g2.down(10, 10); g2.tick(1 / 60);
  ok("snake: a tap starts again", f(g2, "over") === false && f(g2, "score") === 0);
  ok("snake: can't reverse", (() => { const g3 = game("snake"); g3.tick(1 / 60, held(["left"])); return f(g3, "dx") === 1; })());
}

// ---------------- Breakout
{
  const g = game("breakout");
  ok("breakout: 40 bricks", f(g, "bricks").count() === 40);
  const b1 = f(g, "bricks").part(1), b40 = f(g, "bricks").part(40);
  ok("breakout: wall layout", b1.field("x") === 4 && b1.field("y") === 60 && b40.field("x") === 312 && b40.field("y") === 140, [S.fmt(b1), S.fmt(b40)]);
  for (let t = 0; t < 3000; t++) { g.down(f(g, "ball").field("x"), 400); g.tick(1 / 60); }
  ok("breakout: bricks break and score", f(g, "bricks").count() < 40 && f(g, "score") === 40 - f(g, "bricks").count(), [f(g, "bricks").count(), f(g, "score")]);
  ok("breakout: following the ball keeps lives", f(g, "lives") === 3, f(g, "lives"));
  const g2 = game("breakout");
  for (let t = 0; t < 600; t++) { g2.down(0, 400); g2.tick(1 / 60); }
  ok("breakout: missing loses lives", f(g2, "lives") < 3, f(g2, "lives"));
  const g3 = game("breakout"); let lost = 0, prev = 3;
  for (let t = 0; t < 400 && !lost; t++) { g3.down(0, 400); g3.tick(1 / 60); if (f(g3, "lives") < prev) { lost++; prev = f(g3, "lives"); } }
  for (let t = 0; t < 20; t++) { g3.down(0, 400); g3.tick(1 / 60); if (f(g3, "lives") < prev) { lost++; prev = f(g3, "lives"); } }
  ok("breakout: one miss costs one life", lost === 1 && f(g3, "lives") === 2, [lost, f(g3, "lives")]);
  ok("breakout: the ball comes back after a miss", typeof f(g2, "ball").field("x") === "number", S.fmt(f(g2, "ball")));
}

// ---------------- Fireflies
{
  const g = game("fireflies");
  for (let t = 0; t < 300; t++) g.tick(1 / 60);
  ok("fireflies: they hatch up to the count, stored as columns", f(g, "flies").count() === 400 && f(g, "flies") instanceof S.ColCell, f(g, "flies").count());
  const spread = () => { const p = S.partsOf(f(g, "flies")); return p.reduce((a, r) => a + Math.hypot(r.field("x") - 80, r.field("y") - 120), 0) / p.length; };
  const before = spread();
  g.down(80, 120); for (let t = 0; t < 240; t++) g.tick(1 / 60);
  ok("fireflies: holding a finger down gathers them", spread() < before * 0.6, [before, spread()]);
  ok("fireflies: two circles each", g.draw().length === 2 + 800 + 1);
}

// ---------------- Orbit
{
  const fx = [], g = game("orbit", { onEffect: e => fx.push(e[0]) });
  const fling = (x, y, x2, y2) => { g.down(x, y); g.tick(1 / 60); for (let k = 1; k <= 10; k++) { g.move(x + (x2 - x) * k / 10, y + (y2 - y) * k / 10); g.tick(1 / 60); } g.up(); g.tick(1 / 60); };
  fling(180, 120, 132, 120);
  for (let t = 0; t < 900; t++) g.tick(1 / 60);
  ok("orbit: a sideways throw stays in orbit", f(g, "moons").count() === 1 && f(g, "lost") === 0, [f(g, "moons").count(), f(g, "lost")]);
  fling(180, 60, 180, 30);
  for (let t = 0; t < 300; t++) g.tick(1 / 60);
  ok("orbit: a throw straight at the sun falls in", f(g, "moons").count() === 1 && f(g, "lost") === 1 && fx.includes("shake"), [f(g, "moons").count(), f(g, "lost")]);
}

// ---------------- Life
{
  const g = game("life");
  const live = b => S.partsOf(b).filter(v => v === 1).length;
  ok("life: starts with the glider and the R-pentomino", live(f(g, "board")) === 10);
  const blink = L.makeGame(fs.readFileSync(__dirname + "/examples/life.sp", "utf8").replace(/seed : .*/, "seed : [[5, 5], [6, 5], [7, 5]]"));
  const b0 = S.fmt(f(blink, "board"));
  for (let t = 0; t < 7; t++) blink.tick(1 / 60);
  const b1 = S.fmt(f(blink, "board"));
  for (let t = 0; t < 6; t++) blink.tick(1 / 60);
  ok("life: a blinker flips and flips back", f(blink, "generation") === 2 && b1 !== b0 && S.fmt(f(blink, "board")) === b0, f(blink, "generation"));
  const n0 = live(f(g, "board"));
  g.down(200, 300); g.tick(1 / 60); g.move(230, 300); g.tick(1 / 60);
  ok("life: drawing brings squares to life and stops time", live(f(g, "board")) === n0 + 2 && f(g, "generation") === 0, live(f(g, "board")));
}

// ---------------- Hop
{
  const src = fs.readFileSync(__dirname + "/examples/hop.sp", "utf8");
  const place = (x, y, vx, vy) => L.makeGame(src.replace("ship : [x : 70, y : 70, vx : 40, vy : 0]", "ship : [x : " + x + ", y : " + y + ", vx : " + vx + ", vy : " + vy + "]"));
  const soft = place(220, 420, 0, 5); for (let t = 0; t < 60; t++) soft.tick(1 / 60);
  ok("hop: a gentle landing on the pad scores", f(soft, "phase") === "landed" && f(soft, "score") === 150 && f(soft, "best") === 150, [f(soft, "phase"), f(soft, "score")]);
  const hard = place(220, 300, 0, 120); for (let t = 0; t < 60; t++) hard.tick(1 / 60);
  ok("hop: coming down too fast crashes", f(hard, "phase") === "crashed" && f(hard, "score") === 0);
  const off = place(60, 420, 0, 5); for (let t = 0; t < 60; t++) off.tick(1 / 60);
  ok("hop: missing the pad crashes", f(off, "phase") === "crashed");
  const fire = place(220, 200, 0, 60); for (let t = 0; t < 40; t++) fire.tick(1 / 60, held(["up"]));
  ok("hop: the engine slows the fall and uses fuel", f(fire, "ship").field("vy") < 10 && f(fire, "fuel") < 100 && f(fire, "burning") === true);
  // a careful pilot: steer toward the pad, and brake late
  const g = game("hop"); const rounds = [];
  for (let r = 0; r < 3; r++) {
    for (let t = 0; t < 5000 && f(g, "phase") === "flying"; t++) {
      const s = f(g, "ship"), x = s.field("x"), y = s.field("y"), vx = s.field("vx"), vy = s.field("vy");
      const want = Math.max(-22, Math.min(22, (f(g, "pad-x") - x) * 0.6));
      const brake = vy > 0 && vy * vy > 2 * 85 * Math.max(1, 416 - y) * 0.6 || vy > 40, side = Math.abs(vx - want) > 3;
      if (brake || side) g.down(x + (side ? (vx > want ? 60 : -60) : 0), y + 40); else g.up();
      g.tick(1 / 60);
    }
    rounds.push(f(g, "phase"));
    g.up(); g.tick(1 / 60); g.down(5, 5); g.tick(1 / 60); g.up(); g.tick(1 / 60);
  }
  ok("hop: a careful pilot lands round after round", rounds.join() === "landed,landed,landed" && f(g, "best") > 200, [rounds, f(g, "best")]);
}

// ---------------- Recipes (a program, not a game)
{
  const lines = []; S.setOut(s => lines.push(s));
  S.load(fs.readFileSync(__dirname + "/examples/recipes.sp", "utf8")).run(S.BANG);
  S.setOut(() => {});
  const want = ["[1, 1, 3, 4, 5, 8, 9]", "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]", "[1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz]",
    "tuorps", "true", "111", "[1]", "[1, 1]", "[1, 2, 1]", "[1, 3, 3, 1]", "[1, 4, 6, 4, 1]", "[1, 5, 10, 10, 5, 1]", "5", "12, 16", "[mon, tue, wed]",
    "[work, work, work, work, work, rest, rest]"];
  ok("recipes: every answer", JSON.stringify(lines) === JSON.stringify(want), lines);
}

// ---------------- ACE (the Atomic Constraint Engine) examples
{
  const printed = name => { const lines = []; S.setOut(x => lines.push(x)); S.load(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8")).run(S.BANG); S.setOut(() => {}); return lines; };
  const d = printed("ace-derive");
  ok("ace-derive: done is derived, 4 of 11 today", d.includes("done      4 of 11") && d.some(l => l.startsWith("[ ] gate      RFI: splice length") && l.endsWith("waits on eng-reply")));
  ok("ace-derive: the gate closes itself once the reply is in", d.includes("workable  rebar-on-site, eng-reply") && d.includes("workable  place-rebar") && d.includes("done      7 of 11"), d.filter(l => l.startsWith("workable")));
  ok("ace-derive: a signed inspection isn't done until it has a narrative", d.some(l => l.startsWith("[!] verified  Pre-pour inspection") && l.endsWith("closed, but needs a narrative")) && d.includes("done      8 of 11"));
  ok("ace-derive: writing it up closes it and frees the pour", d.includes("done      9 of 11") && d.includes("workable  pour"));
  const sc = printed("ace-schedule");
  ok("ace-schedule: the critical path", sc.includes("finish on day 21, through rebar > place-rebar > inspect > pour > cure"), sc.find(l => l.startsWith("finish")));
  const p = sc.find(l => l.startsWith("P10")), nums = (p || "").match(/\d+/g).map(Number);
  ok("ace-schedule: monte carlo percentiles in order, and later than the likely plan", nums.length === 8 && nums[1] >= 21 && nums[1] <= nums[3] && nums[3] <= nums[5] && nums[5] <= nums[7] && nums[3] > 21, p);

  ok("ace-schedule: cost is a view of crews, rates, time, materials and equipment", sc.includes("labour     $58,900    crews x days x $950") && sc.includes("budget     $149,535"));
  ok("ace-schedule: earned value on the status day", sc.includes("SPI 0.83  behind schedule") && sc.includes("CPI 0.96  over budget") && sc.includes("forecast at completion  $156,284  (budget / CPI)"), sc.filter(l => /SPI|CPI|forecast/.test(l)));
  const src = fs.readFileSync(__dirname + "/examples/ace-board.sp", "utf8"), AT = S.partsOf(S.load(src).field("atoms"));
  const fx = [], b = L.makeGame(src, { onEffect: e => fx.push(e[0]) });
  const tapOn = id => { const a = AT.find(r => r.field("id") === id); b.down(a.field("x") + 50, a.field("y") + 18); b.tick(1 / 60); b.up(); b.tick(1 / 60); return f(b, "msg"); };
  const header = () => { const t = b.draw().filter(x => x[0] === "text"); return t[t.length - 3][1][0]; };
  b.tick(1 / 60);
  ok("ace-board: starts 3 of 11 done, 14 days of work", header() === "ACE  3/11 done  ·  14d of work left", header());
  ok("ace-board: blocked work can't be closed", tapOn("place") === "place rebar waits on dig, rebar, rfi" && fx.includes("shake"));
  ok("ace-board: a gate isn't tapped", tapOn("rfi") === "RFI: splice is a gate: it closes by itself");
  for (const id of ["dig", "rebar", "reply", "place"]) tapOn(id);
  ok("ace-board: verified needs the work and then a witness", tapOn("inspect") === "inspection done: now tap again to sign" && tapOn("inspect") === "inspection signed by the witness");
  tapOn("forms"); tapOn("pour");
  ok("ace-board: everything done, nothing left", header() === "ACE  11/11 done  ·  0d of work left", header());
  tapOn("dig");
  ok("ace-board: reopening upstream work reopens what depends on it", /^ACE  \d\/11 done/.test(header()) && !header().startsWith("ACE  11/11"), header());

  const fx2 = [], st = L.makeGame(fs.readFileSync(__dirname + "/examples/ace-site.sp", "utf8"), { onEffect: e => fx2.push(e[0]) });
  const size = x => { st.down(x, 200); st.tick(1 / 60); st.up(); st.tick(1 / 60); return [f(st, "rb-d"), f(st, "clashes")]; };
  st.tick(1 / 60);
  ok("ace-site: no clashes at 46 m", f(st, "clashes") === 0);
  ok("ace-site: a bigger reactor pushes the service building into the fuel bay", JSON.stringify(size(250)) === "[58,1]" && fx2.includes("shake"), size(250));
  ok("ace-site: and the turbine hall off the site", JSON.stringify(size(300)) === "[63,2]");
  ok("ace-site: shrinking clears them", JSON.stringify(size(0)) === "[30,0]");
}

// ---------------- ACE crews: capacity constraints
{
  const src = fs.readFileSync(__dirname + "/examples/ace-crews.sp", "utf8");
  const statusOf = g => S.partsOf(f(g, "packages")).map(p => p.field("status"));
  const runOut = g => { for (let t = 0; t < 4000 && statusOf(g).some(x => x !== "done"); t++) g.tick(0.05); return f(g, "day"); };
  const all = L.makeGame(src);
  ok("ace-crews: with every crew, the slab is done on day 23", runOut(all) === 23, f(all, "day"));
  const rows = S.partsOf(f(all, "packages"));
  const rec = id => rows.find(p => p.field("id") === id);
  ok("ace-crews: a package starts only after what it requires", rec("pour").field("begun") >= rec("embeds").field("ended") && rec("rebar").field("begun") >= rec("piles").field("ended"));
  ok("ace-crews: each package is done by a crew of its trade", rows.every(p => p.field("crew").startsWith(p.field("trade"))));
  const chip = n => [(n - 1) * 86 + 48, 440];
  const g = L.makeGame(src); g.tick(0.05);
  g.down(...chip(3)); g.tick(0.05); g.up(); g.tick(0.05);
  ok("ace-crews: tapping a crew sends it home", f(g, "crews").part(3).field("on") === false);
  for (let t = 0; t < 4000 && f(g, "day") < 10; t++) g.tick(0.05);
  const notes = g.draw().filter(d => d[0] === "text").map(d => d[1][0]);
  ok("ace-crews: work that needs a crew that isn't there says so", notes.includes("needs an iron crew") && rows.length === 10, notes.filter(x => /crew/.test(x)));
  g.down(...chip(3)); g.tick(0.05); g.up(); g.tick(0.05);
  ok("ace-crews: the slab slips while the iron crew is away", runOut(g) > 23, f(g, "day"));
}

const errs = logs.slice();
ok("no unexpected runtime messages", errs.length === 0, errs.slice(0, 5));
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
