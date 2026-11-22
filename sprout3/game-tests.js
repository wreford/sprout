// Headless tests for the example games: node game-tests.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
// the games read random through the game layer, which reads Math.random: seeded here, so every run is the same
{ let seed = 12345; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log("FAIL", name, extra === undefined ? "" : extra); } };
const logs = []; S.setLog(m => logs.push(m));
const game = (name, opts) => L.makeGame(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8"), opts);
const held = keys => S.valueCellOf([], new Map(keys.map(k => [k, true])));
const f = (g, k) => g.state.field(k);
// putCell: the code with one top-level cell (name : [ ... ] ending in a "]" line) replaced by new text
const putCell = (code, name, text) => { const b = code.search(new RegExp("^" + name + " : \\[", "m")), e = code.indexOf("\n]\n", b); return code.slice(0, b) + text.trim() + code.slice(e + 2); };

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
  ok("snake: moves on the beat", f(g, "body").part(1).field("x") > 5, S.format(f(g, "body").part(1)));
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
  ok("snake: biting yourself ends the game", f(g2, "over") === true, S.format(f(g2, "body")));
  g2.down(10, 10); g2.tick(1 / 60);
  ok("snake: a tap starts again", f(g2, "over") === false && f(g2, "score") === 0);
  ok("snake: can't reverse", (() => { const g3 = game("snake"); g3.tick(1 / 60, held(["left"])); return f(g3, "dx") === 1; })());
}

// ---------------- Breakout
{
  const g = game("breakout");
  ok("breakout: 40 bricks", f(g, "bricks").count() === 40);
  const b1 = f(g, "bricks").part(1), b40 = f(g, "bricks").part(40);
  ok("breakout: wall layout", b1.field("x") === 4 && b1.field("y") === 60 && b40.field("x") === 312 && b40.field("y") === 140, [S.format(b1), S.format(b40)]);
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
  ok("breakout: the ball comes back after a miss", typeof f(g2, "ball").field("x") === "number", S.format(f(g2, "ball")));
}

// ---------------- Fireflies
{
  const g = game("fireflies");
  for (let t = 0; t < 300; t++) g.tick(1 / 60);
  ok("fireflies: they hatch up to the count, stored as columns", f(g, "flies").count() === 400 && f(g, "flies") instanceof S.ColumnCell, f(g, "flies").count());
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
  const b0 = S.format(f(blink, "board"));
  for (let t = 0; t < 7; t++) blink.tick(1 / 60);
  const b1 = S.format(f(blink, "board"));
  for (let t = 0; t < 6; t++) blink.tick(1 / 60);
  ok("life: a blinker flips and flips back", f(blink, "generation") === 2 && b1 !== b0 && S.format(f(blink, "board")) === b0, f(blink, "generation"));
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

  ok("ace-schedule: seeded, so the same graph and seed give the same histogram", JSON.stringify(sc) === JSON.stringify(printed("ace-schedule")) && sc.includes("P10 day 22   P50 day 25   P80 day 28   P90 day 29"), sc.find(l => l.startsWith("P10")));
  ok("ace-schedule: cost is a view of crews, rates, time, materials and equipment", sc.includes("labour     $58,900    crews x days x $950") && sc.includes("budget     $149,535"));
  ok("ace-schedule: earned value on the status day", sc.includes("SPI 0.83  behind schedule") && sc.includes("CPI 0.96  over budget") && sc.includes("forecast at completion  $156,284  (budget / CPI)"), sc.filter(l => /SPI|CPI|forecast/.test(l)));
  const mo = printed("ace-morning");
  ok("ace-morning: what changed since yesterday", mo.includes("cleared   Conduit delivered, Excavate north footings") && mo.includes("can start Form north footings") && mo.includes("ready     1 package, 220 hours"));
  ok("ace-morning: constraints ranked by the hours they release", mo.includes("1. South access road              180 h   1 package   <- this one first") && mo.some(l => l.startsWith("2. Electrical drawings rev C")) && mo.some(l => l.startsWith("4. RFI 118: grounding depth")), mo.slice(4, 10));
  ok("ace-morning: a pair that only releases work together", mo.includes("   RFI 112: splice length         with Rebar delivery, north: 260 h") && mo.includes("   Anchor bolts                   waits on other work first"));
  const src = fs.readFileSync(__dirname + "/examples/ace-board.sp", "utf8"), AT = S.partsOf(S.load(src).field("atoms"));
  const fx = [], b = L.makeGame(src, { onEffect: e => fx.push(e[0]) });
  const tapOn = id => { const a = AT.find(r => r.field("id") === id); b.down(a.field("x") + 50, a.field("y") + 18); b.tick(1 / 60); b.up(); b.tick(1 / 60); return f(b, "msg"); };
  const header = () => { const t = b.draw().filter(x => x[0] === "text"); return t[t.length - 3][1][0]; };
  b.tick(1 / 60);
  ok("ace-board: starts 3 of 11 done, 14 days of work", header() === "ACE  3/11 done  ·  14d of work left", header());
  ok("ace-board: blocked work can't be closed", tapOn("place") === "place rebar waits on dig, rebar, rfi" && fx.includes("shake"));
  ok("ace-board: a gate isn't tapped", tapOn("rfi") === "RFI: splice is a gate: it closes by itself");
  for (const id of ["dig", "rebar", "reply", "place"]) tapOn(id);
  ok("ace-board: verified needs the work and then a witness", tapOn("inspect") === "inspection done: now tap again to sign" && tapOn("inspect") === "inspection signed: now write it up");
  ok("ace-board: a signed inspection still needs its write-up", tapOn("inspect") === "write up the inspection first: choose below" && !header().startsWith("ACE  9/"));
  const tapAt = (x, y) => { b.down(x, y); b.tick(1 / 60); b.up(); b.tick(1 / 60); return f(b, "msg"); };
  ok("ace-board: written up as nominal, it closes", tapAt(60, 445) === "inspection written up: nominal" && header().startsWith("ACE  9/11 done"), header());
  tapOn("forms"); tapOn("pour");
  ok("ace-board: everything done, nothing left", header() === "ACE  11/11 done  ·  0d of work left", header());
  // narrative is structure: an inspection that finds rework adds an atom the pour has to wait for
  const r = L.makeGame(src); r.tick(1 / 60);
  const rtap = id => { const a = AT.find(x => x.field("id") === id); r.down(a.field("x") + 50, a.field("y") + 18); r.tick(1 / 60); r.up(); r.tick(1 / 60); return f(r, "msg"); };
  const rhead = () => { const t = r.draw().filter(x => x[0] === "text").map(x => x[1][0]); return t.find(x => x.startsWith("ACE")); };
  for (const id of ["dig", "rebar", "reply", "place", "inspect", "inspect", "forms"]) rtap(id);
  r.down(175, 445); r.tick(1 / 60); r.up(); r.tick(1 / 60);
  ok("ace-board: finding rework adds an atom to the graph", f(r, "msg") === "inspection found rework: new work joins the graph" && rhead().startsWith("ACE  10/12 done"), rhead());
  ok("ace-board: and the pour waits for it", rtap("pour") === "pour waits on rework");
  r.down(296, 284); r.tick(1 / 60); r.up(); r.tick(1 / 60);
  ok("ace-board: once the rework is done, the pour can go", rtap("pour") === "closed pour" && rhead() === "ACE  12/12 done  ·  0d of work left", rhead());
  ok("ace-board: reopening the inspection takes the added atom away", rtap("inspect") === "reopened inspection" && / \d+\/11 done/.test(rhead()) && f(r, "story") === "", rhead());
  tapOn("dig");
  ok("ace-board: reopening upstream work reopens what depends on it", /^ACE  \d\/11 done/.test(header()) && !header().startsWith("ACE  11/11"), header());

  const siteSrc = fs.readFileSync(__dirname + "/examples/ace-site.sp", "utf8");
  const fx2 = [], st = L.makeGame(siteSrc, { onEffect: e => fx2.push(e[0]) });
  const size = x => { st.down(x, 200); st.tick(1 / 60); st.up(); st.tick(1 / 60); return [f(st, "rb-d"), f(st, "failing")]; };
  const failing = g => g.draw().filter(d => d[0] === "text").map(d => d[1][0]).filter(t => t.startsWith("FAIL "));
  st.tick(1 / 60);
  ok("ace-site: every constraint holds at 46 m", f(st, "failing") === 0 && failing(st).length === 0);
  ok("ace-site: a bigger reactor stretches the cable run first", JSON.stringify(size(270)) === "[55,1]" && failing(st)[0] === "FAIL must: cable run under 65 m", failing(st));
  ok("ace-site: then the service building hits the fuel bay", JSON.stringify(size(300)) === "[58,2]" && fx2.includes("shake"));
  ok("ace-site: and the turbine hall leaves the site", JSON.stringify(size(359)) === "[65,3]");
  ok("ace-site: too small breaks the design basis", JSON.stringify(size(0)) === "[25,1]" && failing(st)[0] === "FAIL must: reactor at least 36 m across");
  const narrow = L.makeGame(siteSrc.replace("gap : 15", "gap : 10")); narrow.tick(1 / 60);
  ok("ace-site: a narrow road fails the fire rule", failing(narrow).join() === "FAIL must: fire road at least 12 m wide");
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

// ---------------- ACE ledger: SQLite (node:sqlite here, sql.js on the page)
{
  const { sqliteCell } = require("./sqlite-host.js");
  const saved = S.globals.db; S.globals.db = sqliteCell(":memory:");
  const src = fs.readFileSync(__dirname + "/examples/ace-ledger.sp", "utf8");
  const day = () => { const lines = []; S.setOut(x => lines.push(x)); S.load(src).run(S.BANG); S.setOut(() => {}); return lines; };
  const d1 = day(), d2 = day(), d3 = day();
  ok("ace-ledger: each run is a day, and the database remembers", d1[0] === "== day 1 ==" && d3[0] === "== day 3 ==" && d3.includes("day 1  closed Survey and layout") && d3.includes("day 3  closed Rebar delivered"), d3);
  ok("ace-ledger: what's workable is derived from the rows", d3.some(l => l.startsWith("[>] Place rebar")) && d3.some(l => l.startsWith("[ ] Pre-pour inspection")));
  for (let k = 0; k < 4; k++) day();
  const end = day();
  ok("ace-ledger: it finishes, and the log keeps every day", end.includes("the pedestal is finished") && S.globals.db.raw.prepare("select count(*) n from events").get().n === 6);
  S.globals.db = saved;
}

// ace-risk: a million runs through spork (decision 91); with fewer runs, the whole program prints the same with collect
{
  const src = fs.readFileSync(__dirname + "/examples/ace-risk.sp", "utf8");
  const run = text => { const lines = []; S.setOut(x => lines.push(x)); S.load(text).run(S.BANG); S.setOut(() => {}); return lines; };
  const full = run(src), info = S.sporkInfo;
  ok("ace-risk: a million runs, as one kernel", full[0] === "== 1000000 runs of the pedestal job ==" && info.n === 1000000 && info.how === "simd", info);
  const p = (full[1].match(/[\d.]+/g) || []).map(Number);
  ok("ace-risk: P10 to P90 in order", p.length === 8 && p[1] < p[3] && p[3] < p[5] && p[5] < p[7], full[1]);
  const adds = full.filter(l => /\+[\d.]+ days$/.test(l));
  ok("ace-risk: what each risk adds at P80, weather the most", adds.length === 4 && adds[0].startsWith("wet weather on the pour") && Math.max(...adds.map(l => +l.match(/\+([\d.]+)/)[1])) === +adds[0].match(/\+([\d.]+)/)[1], adds);
  const small = src.replace("runs : 1000000", "runs : 3000");
  ok("ace-risk: spork prints exactly what collect prints", JSON.stringify(run(small)) === JSON.stringify(run(small.replace("range runs spork one-run", "range runs collect one-run"))));
}

// Galaxy: twenty thousand stars in columns, moved and drawn by fused loops
{
  const g = game("galaxy");
  ok("galaxy: every loop is fused", g.speedNotes.length === 4 && g.speedNotes.every(n => n.fast), g.speedNotes.map(n => n.word + " " + n.why));
  for (let t = 0; t < 120; t++) g.tick(1 / 60);
  const stars = f(g, "stars"), draws = g.draw();
  ok("galaxy: 20,000 stars, kept as columns", stars.count() === 20000 && stars instanceof S.ColumnCell, stars.count());
  ok("galaxy: every star is drawn, blue or white, and the count", draws.filter(d => d[0] === "circle").length === 20000 && draws.some(d => d[0] === "text" && d[1][0] === "20000 stars"));
  const inView = draws.filter(d => d[0] === "circle" && d[1][0] > 0 && d[1][0] < 360 && d[1][1] > 0 && d[1][1] < 480).length;
  ok("galaxy: the stars stay in the sky", inView > 18000, inView);
}

// a fused each calls the host words of its own game, even after another game is made (each game has its own circle)
{
  const first = game("particles"); for (let t = 0; t < 60; t++) first.tick(1 / 60);
  const second = game("fireflies"); for (let t = 0; t < 5; t++) second.tick(1 / 60);
  ok("two games: the first still draws its own circles", first.draw().length === f(first, "sparks").count() + 1, [first.draw().length, f(first, "sparks").count()]);
}

const errs = logs.slice();
ok("no unexpected runtime messages", errs.length === 0, errs.slice(0, 5));
// ---------------- Gears: a parametric tool, changed while it runs
{
  const src = fs.readFileSync(__dirname + "/examples/gears.sp", "utf8"), g = L.makeGame(src, {});
  for (let t = 0; t < 30; t++) g.tick(1 / 60);
  const lines = g.draw().filter(d => d[0] === "line").length, texts = g.draw().filter(d => d[0] === "text").map(d => d[1][0]);
  ok("gears: one edge per tooth side, 4 per tooth", lines === (16 + 28) * 4, lines);
  ok("gears: the readouts", texts[0] === "16 : 28 teeth    ratio 1.75 : 1" && texts[3] === "20 rpm in, 11.43 rpm out", texts);
  const turn = f(g, "turn");
  g.swap(src.replace("teeth-a : 16", "teeth-a : 12")); g.tick(1 / 60);
  ok("gears: a changed number takes at once, and the turning goes on", g.draw().filter(d => d[0] === "line").length === (12 + 28) * 4 && f(g, "turn") > turn);
}

// ---------------- Terrain: two wrapped libraries in a game
{
  const g = L.makeGame(fs.readFileSync(__dirname + "/examples/terrain.sp", "utf8"), {});
  for (let t = 0; t < 10; t++) g.tick(1 / 60);
  const rects = g.draw().filter(d => d[0] === "rect"), colours = new Set(rects.map(d => String(d[1][4])));
  ok("terrain: a square for every cell", rects.length === 30 * 40, rects.length);
  ok("terrain: land and water in many shades", colours.size > 12, colours.size);
  const first = JSON.stringify(g.draw()); g.tick(1); ok("terrain: it flies", JSON.stringify(g.draw()) !== first);
}

// ---------------- two players (decision 107)
{
  const src = fs.readFileSync(__dirname + "/examples/volley.sp", "utf8");
  // two screens, the same seed and the same inputs: the same game, frame by frame
  const seeded = seed => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const one = L.makeGame(src, { players: 2, me: 1, random: seeded(99) }), two = L.makeGame(src, { players: 2, me: 2, random: seeded(99) });
  // another game made in between must not take the random numbers (the page makes cover art)
  L.makeGame(fs.readFileSync(__dirname + "/examples/sprout.sp", "utf8"), {});
  for (let t = 0; t < 400; t++) {
    for (const g of [one, two]) { if (t % 50 === 5) g.down(120, 400); if (t % 50 === 20) g.up(); if (t % 60 === 10) g.down(250, 60, 2); g.tick(1 / 60, null, null); }
  }
  ok("two players: both screens keep the same game", S.format(one.state) === S.format(two.state));
  ok("two players: player 2's touch moves player 2's paddle", f(one, "far") !== 180 && f(one, "input2").field("touch-x") === 250, f(one, "far"));
  ok("two players: each screen draws its own player at the bottom", JSON.stringify(one.draw()) !== JSON.stringify(two.draw()));
  const alone = L.makeGame(src, {}); for (let t = 0; t < 200; t++) alone.tick(1 / 60);
  ok("volley alone: no input2, and the top paddle plays itself", alone.state.field("input2") === S.UNSET && f(alone, "far") !== 180);
}

// ---------------- SilverEye 2D: a raycaster with guards and proximity mines
{
  const src = fs.readFileSync(__dirname + "/examples/silvereye-2d.sp", "utf8"), held = ks => S.valueCellOf([], new Map(ks.map(k => [k, true])));
  const fresh = () => L.makeGame(src, {});
  const place = (g, hero) => { const m = new Map(S.fieldsOf(g.state)); m.set("hero", S.valueCellOf([], new Map(Object.entries(hero)))); g.setState(S.valueCellOf([], m)); };
  const g = fresh(); g.tick(1 / 60);
  const walls = g.draw().filter(d => d[0] === "rect").slice(1, 73);
  ok("silvereye 2d: a wall strip for every ray, nearer walls taller", walls.length === 72 && new Set(walls.map(d => Math.round(d[1][3]))).size > 5);
  for (let t = 0; t < 30; t++) g.tick(1 / 60, held(["up"]));
  ok("silvereye 2d: walking moves you", f(g, "hero").field("x") > 2.6);
  const a = fresh(); place(a, { x: 9.5, y: 7.5, angle: 0, health: 100 });
  for (let t = 0; t < 240; t++) a.tick(1 / 60, held(t % 20 < 2 ? ["space"] : []));
  ok("silvereye 2d: two hits take down a guard", f(a, "guards").part(3).field("health") <= 0);
  const b = fresh(); place(b, { x: 12.5, y: 3.6, angle: Math.PI / 2, health: 100 });
  for (let t = 0; t < 3; t++) b.tick(1 / 60, held(["m"]));
  ok("silvereye 2d: a mine is dropped and one fewer is carried", f(b, "mines").count() === 1 && f(b, "carried") === 5);
  for (let t = 0; t < 400; t++) b.tick(1 / 60);
  ok("silvereye 2d: a guard who walks onto an armed mine is blown up", f(b, "guards").part(1).field("health") <= 0 && f(b, "mines").count() === 0);
  const c = fresh(); place(c, { x: 2.5, y: 2.5, angle: 0, health: 100 });
  c.tick(1 / 60, held(["m"])); for (let t = 0; t < 120; t++) c.tick(1 / 60);
  ok("silvereye 2d: your own mine goes off under you too", f(c, "hero").field("health") < 100 && f(c, "mines").count() === 0);
}

// ---------------- SilverEye: guards alone, a duel for two; a pocket console's stick and buttons arrive as held values
{
  const src = fs.readFileSync(__dirname + "/examples/silvereye.sp", "utf8");
  { const before = logs.length, first = L.makeGame(src, {}), padOn = S.valueCellOf([], new Map([["shell", true], ["walk", 1], ["fire", true]]));
    // a frame and a draw too: some lints only show when the code they're in first runs
    for (let t = 0; t < 30; t++) first.tick(1 / 60, padOn); first.draw();
    // and a guard on alert, and a scientist hit: code that only runs then is checked too
    { const m = new Map(S.fieldsOf(first.state)), ags = S.partsOf(m.get("agents")).slice(), a = new Map(S.fieldsOf(ags[0])); a.set("x", 9.5); a.set("y", 7.5); a.set("angle", 0); ags[0] = S.valueCellOf([], a); m.set("agents", S.valueCellOf(ags, new Map())); first.setState(S.valueCellOf([], m)); }
    for (let t = 0; t < 90; t++) first.tick(1 / 60, padOn); first.draw();
    const lints = logs.slice(before).filter(m => /lint|isn't a word/.test(m));
    ok("silvereye: the program loads, runs and draws with no lints or unknown words", lints.length === 0, lints); }
  const pad = o => S.valueCellOf([], new Map(Object.entries(Object.assign({ shell: true }, o))));
  const keys = ks => S.valueCellOf([], new Map(ks.map(k => [k, true])));
  const put = (g, i, o) => { const m = new Map(S.fieldsOf(g.state)), ags = S.partsOf(m.get("agents")).slice(), a = new Map(S.fieldsOf(ags[i])); for (const k in o) a.set(k, o[k]); ags[i] = S.valueCellOf([], a); m.set("agents", S.valueCellOf(ags, new Map())); g.setState(S.valueCellOf([], m)); };
  const agent = (g, n) => f(g, "agents").part(n);
  const fx = [], g = L.makeGame(src, { onEffect: e => fx.push(e[0] + ":" + e[1][0]) });
  g.tick(1 / 60);
  const d = g.draw(), count = w => d.filter(x => x[0] === w).length;
  ok("silvereye: a camera, the walls as blocks, the guards as models, the gun held", count("view") === 1 && count("block") > 100 && d.filter(x => x[0] === "model" && x[1][0] === "adventurer").length === 6 && count("hold") === 1);
  ok("silvereye: the overlay is still 2D words, with touch buttons in the editor", count("text") > 0 && d.some(x => x[0] === "text" && x[1][0] === "MINE"));
  // the stick walks and strafes, the look drag turns
  const w = L.makeGame(src, {}); w.tick(1 / 60, pad({ look: 0 }));
  for (let t = 0; t < 30; t++) w.tick(1 / 60, pad({ walk: 1, look: 0.5 }));
  ok("silvereye: the stick walks and the look drag turns you by what it moved", agent(w, 1).field("x") > 2.7 && Math.abs(agent(w, 1).field("angle") - 1.1) < 1e-9, agent(w, 1).field("angle"));
  ok("silvereye: on the console there are no touch buttons on the screen", !w.draw().some(x => x[0] === "text" && x[1][0] === "MINE"));
  { const sw = L.makeGame(src, {}); sw.tick(1 / 60, pad({})); const xs = [];
    for (let t = 0; t < 20; t++) { sw.tick(1 / 60, pad({ walk: 1 })); xs.push(sw.draw().find(x => x[0] === "hold")[1][1]); }
    ok("silvereye: the gun sways as you walk, and its place is always a number", xs.every(Number.isFinite) && new Set(xs.map(x => x.toFixed(4))).size > 5, xs.slice(0, 3)); }
  { const quiet = L.makeGame(src, {}); for (let t = 0; t < 400; t++) quiet.tick(1 / 60, pad({}));
    const bars = quiet.draw().filter(x => x[0] === "rect" && x[1][2] === 7 && x[1][3] === 9).length;
    ok("silvereye: the health bar stays out of the way until you're hurt", bars === 0, bars); }
  put(g, 0, { x: 9.5, y: 7.5, angle: 0 });
  for (let t = 0; t < 240; t++) g.tick(1 / 60, keys(t % 20 < 2 ? ["space"] : []));
  const fallen = g.draw().filter(x => x[0] === "model" && x[1][0] === "adventurer" && x[1][6] === "Death");
  ok("silvereye: a guard who is shot plays his fall, timed from when he fell", fallen.length >= 1 && fallen[0][1][7] >= 0 && fallen[0][1][7] < 4, fallen.map(x => x[1][7]));
  ok("silvereye: shots make a sound", fx.includes("sound:shoot"));
  { const hs = L.makeGame(src, {}); hs.tick(1 / 60, pad({})); put(hs, 0, { x: 9.5, y: 7.5, angle: 0 }); hs.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: a hit sparks on what it hit", hs.draw().some(x => x[0] === "flash" && x[1][4] === "#ffe08a" && Math.abs(x[1][0] - 13.5) < 0.5)); }
  { const al = L.makeGame(src, {}); al.tick(1 / 60, pad({})); put(al, 0, { x: 9.5, y: 7.5, angle: 0 }); for (let k = 0; k < 10; k++) al.tick(1 / 60, pad({}));
    const lights = al.draw().filter(x => x[0] === "light");
    ok("silvereye: when the alarm is up the light turns red", lights.length === 1 && ["#ff5a4a", "#c0605a"].includes(String(lights[0][1][2]).toLowerCase()), lights.map(l => l[1])); }
  { const bd = st => { const m = L.makeGame(src.replace(/^stage : 1/m, "stage : " + st), {}); m.tick(1 / 60, pad({})); return m.draw().filter(x => x[0] === "block" && x[1][1] === 1.05 && x[1][4] === 0.14); };
    const lab = bd(1), yard = bd(4);
    ok("silvereye: indoors, the walls have a painted band in the place's colour; out in the compound, none", lab.length > 50 && lab.every(x => String(x[1][6]).toLowerCase() === "#2a9d8f") && yard.length === 0); }
  { const dr = L.makeGame(src, {}); dr.tick(1 / 60, pad({}));
    ok("silvereye: a green light glows over every door", dr.draw().filter(x => x[0] === "block" && x[1][6] === "glow:#3ddc84").length === dr.draw().filter(x => x[0] === "block" && x[1][6] === "#d6a531").length); }
  { const mp = L.makeGame(src, {}); mp.tick(1 / 60, pad({})); const d = mp.draw();
    ok("silvereye: the mini-map shows the targets and the intel, and which way you face", d.filter(x => x[0] === "rect" && x[1][2] === 3 && x[1][4] === "#ffd166").length === 2 && d.some(x => x[0] === "rect" && x[1][2] === 3 && x[1][4] === "#ff7ab2") && d.some(x => x[0] === "line" && x[1][4] === "#ffffff")); }
  { const am = L.makeGame(src, {}); am.tick(1 / 60, pad({})); put(am, 0, { clip: 3, ammo: 2 }); am.tick(1 / 60, pad({}));
    const low = am.draw().some(x => x[0] === "text" && x[1][0] === "LOW AMMO");
    put(am, 0, { clip: 0, ammo: 0 }); am.tick(1 / 60, pad({}));
    ok("silvereye: low on shots it says LOW AMMO, and out it says where to find more", low && am.draw().some(x => x[0] === "text" && x[1][0] === "OUT OF AMMO · FIND A CRATE")); }
  { const wk = L.makeGame(src, {}); wk.tick(1 / 60, pad({}));
    const st = new Map(S.fieldsOf(wk.state)), ms = S.partsOf(st.get("machines")).map((m, i) => i ? m : S.valueCellOf([], new Map([...S.fieldsOf(m), ["health", 0]])));
    st.set("machines", S.valueCellOf(ms, new Map())); st.set("blasts", S.valueCellOf([S.valueCellOf([], new Map([["x", 5], ["y", 5], ["at", wk.clock - 1]]))], new Map())); wk.setState(S.valueCellOf([], st), wk.clock);
    const d = wk.draw();
    ok("silvereye: a wrecked target sinks and smokes", d.some(x => x[0] === "model" && x[1][2] === -0.1) && d.filter(x => x[0] === "flash" && x[1][4] === "smoke:#3f3f44").length === 3);
    ok("silvereye: a blast's fireball gives way to smoke", d.filter(x => x[0] === "flash" && x[1][4] === "smoke:#4d4d52").length === 3 && !d.some(x => x[0] === "flash" && x[1][4] === "#ffb347" && x[1][3] >= 0.5)); }
  { const sd = L.makeGame(src, {}); sd.tick(1 / 60, pad({})); put(sd, 0, { x: 8.0, y: 7.5, angle: 0 });
    const g3 = () => S.partsOf(f(sd, "guards")).find(g => g.field("id") === 3);
    const ys = []; for (let k = 0; k < 90; k++) { sd.tick(1 / 60, pad({})); put(sd, 0, { x: 8.0, y: 7.5, health: 100 }); if (g3().field("alert")) ys.push(g3().field("y")); }
    ok("silvereye: an alert guard at range steps from side to side", ys.length > 30 && Math.max(...ys) - Math.min(...ys) > 0.15, [ys.length, Math.min(...ys), Math.max(...ys)]); }
  // guards hear a shot through a wall and come on alert; a quiet player behind the same wall goes unnoticed
  { const quiet = L.makeGame(src, {}), loud = L.makeGame(src, {});
    for (const [gm, fire] of [[quiet, false], [loud, true]]) { gm.tick(1 / 60, pad({})); put(gm, 0, { x: 6.5, y: 1.5, angle: Math.PI }); for (let k = 0; k < 20; k++) gm.tick(1 / 60, pad({ fire })); }
    const g1 = gm => S.partsOf(f(gm, "guards")).find(g => g.field("id") === 1);
    ok("silvereye: a guard behind a wall doesn't notice a quiet player", g1(quiet).field("alert") === false);
    ok("silvereye: but hears a shot fired there, and comes on alert", g1(loud).field("alert") === true);
    // the silencer: each mission hides one; with it the blaster isn't heard (the heavy blaster still is)
    const sl = L.makeGame(src, {}); sl.tick(1 / 60, pad({}));
    ok("silvereye: the lab hides a silencer", S.partsOf(f(sl, "pickups")).some(p => p.field("kind") === "quiet" && p.field("x") === 1.5 && p.field("y") === 10.5));
    put(sl, 0, { x: 1.5, y: 10.5 }); sl.tick(1 / 60, pad({}));
    ok("silvereye: walking over it fits it, and says so", agent(sl, 1).field("quiet") === true && sl.draw().some(x => x[0] === "text" && /^SILENCER/.test(x[1][0])) && sl.draw().some(x => x[0] === "text" && x[1][0] === "BLASTER · SILENCED"));
    const fx2 = []; const sq = L.makeGame(src, { onEffect: e => fx2.push(e) }); sq.tick(1 / 60, pad({})); put(sq, 0, { x: 6.5, y: 1.5, angle: Math.PI, quiet: true });
    for (let k = 0; k < 20; k++) sq.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: a silenced shot isn't heard through the wall", g1(sq).field("alert") === false && agent(sq, 1).field("shots-fired") > 0); }
  // objects: what's in your sight is named (with what it has left), objectives are marked, pickups say what you got
  { const texts = g => g.draw().filter(x => x[0] === "text").map(x => x[1]);
    const ai = L.makeGame(src, {}); ai.tick(1 / 60, pad({})); put(ai, 0, { x: 9.5, y: 7.5, angle: 0 }); ai.tick(1 / 60, pad({}));
    ok("silvereye: a guard in your sight is named under it, with a health bar", texts(ai).some(t => t[0] === "GUARD") && ai.draw().some(x => x[0] === "rect" && x[1][3] === 2 && x[1][4] === "#00000099"));
    const mi2 = L.makeGame(src, {}); mi2.tick(1 / 60, pad({})); put(mi2, 0, { x: 6.5, y: 7.7, angle: Math.PI }); mi2.tick(1 / 60, pad({}));
    ok("silvereye: a target in your sight is named as one of the mission's", texts(mi2).some(t => t[0] === "GENERATOR"));
    const pk = L.makeGame(src, {}); pk.tick(1 / 60, pad({})); put(pk, 0, { x: 5.5, y: 1.5, angle: 0 }); pk.tick(1 / 60, pad({}));
    ok("silvereye: walking over ammo says so", texts(pk).some(t => t[0] === "+16 SHOTS"));
    const mk = L.makeGame(src, {}); for (let k = 0; k < 300; k++) { mk.tick(1 / 60, pad({})); put(mk, 0, { x: 2.5, y: 2.5, angle: 0.3, health: 100 }); }
    const marks = texts(mk).filter(t => /^\d+m$/.test(t[0]));
    ok("silvereye: the two generators and the intel are marked, with how far", marks.filter(t => t[4] === "#ffd166cc").length === 2 && marks.filter(t => t[4] === "#ff7ab2cc").length === 1, marks);
    put(mk, 0, { angle: 0.3 + Math.PI }); mk.tick(1 / 60, pad({}));
    const nm = L.makeGame(src.replace(/^markers : true/m, "markers : false"), {}); for (let k = 0; k < 300; k++) { nm.tick(1 / 60, pad({})); put(nm, 0, { x: 2.5, y: 2.5, angle: 0.3, health: 100 }); }
    ok("silvereye: with markers off there are none", !nm.draw().some(x => x[0] === "text" && /^\d+m$/.test(x[1][0])));
    ok("silvereye: a marker off to one side sits at the edge, pointing", texts(mk).filter(t => t[0] === "▶" || t[0] === "◀").length === 3);
    const edge = texts(mk).filter(t => t[0] === "▶" || t[0] === "◀");
    ok("silvereye: and markers at the same edge don't sit on top of each other", edge.every((t, i) => edge.every((u, j) => i === j || t[1] !== u[1] || Math.abs(t[2] - u[2]) >= 20)), edge.map(t => t.slice(0, 3))); }
  { const mi = L.makeGame(src, {}); mi.tick(1 / 60, pad({})); put(mi, 0, { x: 2.5, y: 2.5, angle: Math.PI }); mi.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: a missed shot sparks on the wall", mi.draw().filter(x => x[0] === "flash" && x[1][4] === "#fff2b3" && Math.abs(x[1][0] - 1.0) < 0.1).length === 1); }
  { const gd = L.makeGame(src, {}); gd.tick(1 / 60, pad({})); put(gd, 0, { x: 9.5, y: 7.5, angle: 0 });
    let said = false; for (let k = 0; k < 150 && !said; k++) { gd.tick(1 / 60, pad({ fire: true })); said = gd.draw().some(x => x[0] === "text" && x[1][0] === "GUARD DOWN · 1/6"); }
    ok("silvereye: a guard going down says so, with the count", said); }
  ok("silvereye: a guard who goes down drops ammo", f(g, "pickups").count() === 10 && f(g, "pickups").part(10).field("kind") === "ammo");
  // turrets: set one down and its program takes the guards on
  const sentry = code => {
    const t = L.makeGame(code, {}); t.tick(1 / 60); put(t, 0, { x: 9.5, y: 7.5, angle: 0 });
    for (let k = 0; k < 2; k++) t.tick(1 / 60, pad({ sentry: true }));
    for (let k = 0; k < 300; k++) t.tick(1 / 60, pad({}));
    return t;
  };
  const s1 = sentry(src);
  ok("silvereye: a turret is set down and one fewer is carried", f(s1, "turrets").count() === 1 && agent(s1, 1).field("sentries-left") === 1);
  ok("silvereye: the turret's program shoots the guard it sees", f(s1, "turrets").part(1).field("shots") > 0 && f(s1, "guards").part(3).field("health") <= 0);
  ok("silvereye: the turret is drawn as a model", s1.draw().some(x => x[0] === "model" && x[1][0] === "turret"));
  const s2 = sentry(src.replace("fire : (it sees-someone) and (it can-fire) and (it off-target abs < 0.1)", "fire : false"));
  ok("silvereye: change turret-program and the turret changes", src.includes("fire : (it sees-someone) and (it can-fire)") && f(s2, "turrets").part(1).field("shots") === 0);
  { const t = L.makeGame(src, {}); t.tick(1 / 60); put(t, 0, { x: 9.5, y: 7.5, angle: 0 });
    for (let k = 0; k < 2; k++) t.tick(1 / 60, pad({ sentry: true }));
    for (let k = 0; k < 6; k++) t.tick(1 / 60, pad({}));
    const k = f(t, "turrets").part(1).field("knows");
    ok("silvereye: a turret keeps what its program knew, in plain words", k.field("sees-someone") === true && typeof k.field("off-target") === "number" && k.field("how-far") > 1 && k.field("how-far") < 7 && k.field("how-many") >= 1, S.format(k));
    ok("silvereye: with no one in sight, how-far is far", f(s1, "turrets").part(1).field("knows").field("how-far") === 99); }
  // a program written with the older names (dx, dy, aim, cool, sees) still works
  const s3 = sentry(putCell(src, "turret-program", "turret-program : [t |\n  off : wrap (t dy atan2 (t dx) - (t aim))\n  [turn : clamp [off * 4, -1, 1], fire : (t sees) and (t cool <= 0) and (off abs < 0.1)]\n]\n"));
  ok("silvereye: a turret program in the older names still shoots", f(s3, "turrets").part(1).field("shots") > 0);
  // two players: a duel with no guards; a takedown scores, the other comes back, five wins (no simulants here)
  const duelSrc = src.replace(/^simulants : 3/m, "simulants : 0");
  const v = L.makeGame(duelSrc, { players: 2, me: 1 });
  v.tick(1 / 60, pad({}), pad({}));
  ok("silvereye: two players make a duel, with no guards", f(v, "versus") === true && f(v, "agents").count() === 2 && f(v, "guards").count() === 0);
  const face = () => { put(v, 0, { x: 8.5, y: 7.5, angle: 0 }); put(v, 1, { x: 12.5, y: 7.5, angle: Math.PI }); };
  face(); for (let t = 0; t < 60; t++) v.tick(1 / 60, pad({ fire: true }), pad({}));
  ok("silvereye: three shots take the other player down, and that scores", agent(v, 2).field("down-at") !== false && agent(v, 1).field("kills") === 1);
  for (let t = 0; t < 160; t++) v.tick(1 / 60, pad({}), pad({}));
  ok("silvereye: the one taken down comes back in a far corner", agent(v, 2).field("health") === 100 && agent(v, 2).field("down-at") === false && agent(v, 2).field("x") !== 12.5);
  { const back = agent(v, 2).field("safe-until"); ok("silvereye: coming back, you're protected for two seconds", back > f(v, "clock") - 1 && back <= f(v, "clock") + 2, back); }
  for (let r = 0; r < 4; r++) { for (let t = 0; t < 140; t++) v.tick(1 / 60, pad({}), pad({})); face(); for (let t = 0; t < 60; t++) v.tick(1 / 60, pad({ fire: true }), pad({})); for (let t = 0; t < 160; t++) v.tick(1 / 60, pad({}), pad({})); }
  const sees = n => { const o = L.makeGame(duelSrc, { players: 2, me: n }); o.setState(v.state, v.clock); return o.draw().filter(x => x[0] === "text").map(x => x[1][0]); };
  { const fe = L.makeGame(duelSrc, { players: 2, me: 1 }); fe.tick(1 / 60, pad({}), pad({}));
    const pf = (i, o) => { const m = new Map(S.fieldsOf(fe.state)), ags = S.partsOf(m.get("agents")).slice(), a = new Map(S.fieldsOf(ags[i])); for (const k in o) a.set(k, o[k]); ags[i] = S.valueCellOf([], a); m.set("agents", S.valueCellOf(ags, new Map())); fe.setState(S.valueCellOf([], m)); };
    pf(0, { x: 8.5, y: 7.5, angle: 0 }); pf(1, { x: 12.5, y: 7.5, angle: Math.PI });
    for (let t = 0; t < 60; t++) fe.tick(1 / 60, pad({ fire: true }), pad({}));
    const said = o => { const w = L.makeGame(duelSrc, { players: 2, me: o }); w.setState(fe.state, fe.clock); return w.draw().filter(x => x[0] === "text").map(x => x[1][0]); };
    ok("silvereye: the feed says who took down whom, from each phone's side", said(1).includes("YOU took down RIVAL") && said(2).includes("RIVAL took down YOU"), said(1));
    ok("silvereye: when you're down, your screen says who did it", said(2).includes("TAKEN DOWN BY THE RIVAL"), said(2)); }
  ok("silvereye: five takedowns win, and each phone says who won", f(v, "over") === "p1" && sees(1).includes("YOU WIN") && sees(2).includes("YOU LOSE"), f(v, "over"));
  ok("silvereye: each phone sees the duel from its own player", sees(1).includes("YOU 5 · 0 RIVAL") && sees(2).includes("YOU 0 · 5 RIVAL"));
  for (let t = 0; t < 120; t++) v.tick(1 / 60, pad({ fire: true }), pad({}));
  ok("silvereye: fire starts the duel again", f(v, "over") === "" && f(v, "versus") === true && agent(v, 1).field("kills") === 0);
  // a mine laid by one player goes off under the other
  const m = L.makeGame(duelSrc, { players: 2, me: 1 }); m.tick(1 / 60, pad({}), pad({}));
  put(m, 0, { x: 4.5, y: 7.5, angle: 0 }); put(m, 1, { x: 2.5, y: 13.5, angle: 0 });
  m.tick(1 / 60, pad({ mine: true }), pad({}));
  put(m, 0, { x: 2.5, y: 2.5, angle: 0 });
  for (let t = 0; t < 90; t++) m.tick(1 / 60, pad({}), pad({}));
  put(m, 1, { x: 6.3, y: 7.5, angle: 0 });
  for (let t = 0; t < 3; t++) m.tick(1 / 60, pad({}), pad({}));
  ok("silvereye: a mine goes off under the other player", agent(m, 2).field("health") < 100 && f(m, "mines").count() === 0);
  // ammo: a clip of eight, a reload by itself when it runs out, or when you ask, from your spare shots
  const r = L.makeGame(src, {}); r.tick(1 / 60, pad({}));
  for (let t = 0; t < 125; t++) r.tick(1 / 60, pad({ fire: true }));
  ok("silvereye: a clip runs out after eight shots and reloads by itself", agent(r, 1).field("clip") === 0 && agent(r, 1).field("reloading") > 0);
  for (let t = 0; t < 75; t++) r.tick(1 / 60, pad({}));
  ok("silvereye: a reload fills the clip from your spare shots", agent(r, 1).field("clip") === 8 && agent(r, 1).field("ammo") === 40, [agent(r, 1).field("clip"), agent(r, 1).field("ammo")]);
  for (let t = 0; t < 20; t++) r.tick(1 / 60, pad({ fire: true }));
  for (let t = 0; t < 80; t++) r.tick(1 / 60, pad({ reload: t < 2 }));
  ok("silvereye: you can reload a half-empty clip", agent(r, 1).field("clip") === 8 && agent(r, 1).field("ammo") < 40);
  // the mission: guards, generators, the intel case, then the lift
  const ms = L.makeGame(src, {}); ms.tick(1 / 60, pad({}));
  ok("silvereye: a mission has two generators and an intel case to find", f(ms, "machines").count() === 2 && S.partsOf(f(ms, "pickups")).some(p => p.field("kind") === "intel"));
  put(ms, 0, { x: 7.5, y: 10.7, angle: 0 });
  for (let t = 0; t < 120; t++) ms.tick(1 / 60, pad({ fire: true }));
  ok("silvereye: shots wreck a generator", f(ms, "machines").part(1).field("health") === 0, f(ms, "machines").part(1).field("health"));
  { const m2 = new Map(S.fieldsOf(ms.state)); m2.set("guards", S.valueCellOf([], new Map())); m2.set("machines", S.valueCellOf([S.valueCellOf([], new Map([["id", 1], ["x", 9], ["y", 10.7], ["health", 0]]))], new Map())); ms.setState(S.valueCellOf([], m2)); }
  put(ms, 0, { x: 14.5, y: 12.5, health: 100 }); ms.tick(1 / 60, pad({}));
  ok("silvereye: picking up the case takes the intel, but the mission isn't over yet", f(ms, "intel") === true && f(ms, "over") === "");
  put(ms, 0, { x: 2.5, y: 2.6 }); ms.tick(1 / 60, pad({}));
  ok("silvereye: with everything done, the lift ends the mission", f(ms, "over") === "won", f(ms, "over"));
  // difficulty: tougher guards and more to do at ace, fewer at rookie
  const ace = L.makeGame(src.replace(/^difficulty : 2/m, "difficulty : 3"), {}), rookie = L.makeGame(src.replace(/^difficulty : 2/m, "difficulty : 1"), {});
  ace.tick(1 / 60); rookie.tick(1 / 60);
  ok("silvereye: an ace mission has tougher guards, a rookie one no generators", f(ace, "guards").part(1).field("health") === 140 && f(rookie, "guards").part(1).field("health") === 70 && f(rookie, "machines").count() === 0 && f(ace, "machines").count() === 2);
  // the end screen: time, accuracy and takedowns
  { const e = L.makeGame(src, {}); e.tick(1 / 60, pad({})); const m3 = new Map(S.fieldsOf(e.state)); m3.set("over", "won"); m3.set("over-at", 75.4); e.setState(S.valueCellOf([], m3));
    ok("silvereye: a finished mission shows the time, accuracy and takedowns", e.draw().some(x => x[0] === "text" && x[1][0] === "TIME 1:15   ACCURACY 0%   TAKEDOWNS 0"));
    ok("silvereye: a finished mission shows its medals", e.draw().some(x => x[0] === "text" && x[1][0] === "★ TIME   ☆ AIM   ★ UNHURT"), e.draw().filter(x => x[0] === "text").map(x => x[1][0])); }
  // the alarm: one guard who sees you brings the others close by
  { const al = L.makeGame(src, {}); al.tick(1 / 60, pad({}));
    const gm = new Map(S.fieldsOf(al.state)), gs = S.partsOf(gm.get("guards")).slice(), g1 = new Map(S.fieldsOf(gs[1])); g1.set("alert", true); gs[1] = S.valueCellOf([], g1); gm.set("guards", S.valueCellOf(gs, new Map())); al.setState(S.valueCellOf([], gm));
    al.tick(1 / 60, pad({}));
    ok("silvereye: a guard on alert calls the guards near them, not the far ones", f(al, "guards").part(4).field("alert") === true && f(al, "guards").part(1).field("alert") === false); }
  // the heavy blaster: pick it up and it's in your hands; it hits harder; swap back and forth
  { const hv = L.makeGame(duelSrc, { players: 2, me: 1 }); hv.tick(1 / 60, pad({}), pad({}));
    put(hv, 0, { x: 12.5, y: 9.5 }); hv.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: picking up the heavy blaster puts it in your hands", agent(hv, 1).field("weapon") === "heavy" && agent(hv, 1).field("has-heavy") === true);
    put(hv, 0, { x: 8.5, y: 7.5, angle: 0 }); put(hv, 1, { x: 12.5, y: 7.5, angle: Math.PI }); hv.tick(1 / 60, pad({ fire: true }), pad({}));
    ok("silvereye: a heavy shot hits harder", agent(hv, 2).field("health") === 30, agent(hv, 2).field("health"));
    for (let t = 0; t < 2; t++) hv.tick(1 / 60, pad({ swap: true }), pad({}));
    ok("silvereye: swap goes back to the blaster", agent(hv, 1).field("weapon") === "blaster"); }
  { const th = L.makeGame(duelSrc, { players: 2, me: 1 }); th.tick(1 / 60, pad({}), pad({})); put(th, 0, { x: 4.5, y: 7.5, angle: 0 }); th.tick(1 / 60, pad({ mine: true }), pad({}));
    const mx = f(th, "mines").part(1).field("x");
    for (let t = 0; t < 40; t++) th.tick(1 / 60, pad({}), pad({})); put(th, 0, { x: 5.5, y: 7.5, angle: -Math.PI / 2 }); th.tick(1 / 60, pad({ mine: true }), pad({}));
    ok("silvereye: a mine is thrown ahead, and lands short of a wall", Math.abs(mx - 6.3) < 1e-9 && f(th, "mines").part(2).field("y") > 7.0, [mx, f(th, "mines").part(2).field("y")]); }
  // the time limit: when it's up, the most takedowns wins; a tie is a draw
  { const tl = L.makeGame(duelSrc.replace(/^time-limit : 300/m, "time-limit : 2"), { players: 2, me: 1 }); tl.tick(1 / 60, pad({}), pad({}));
    for (let t = 0; t < 150; t++) tl.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: when time runs out with no takedowns, it's a draw", f(tl, "over") === "draw", f(tl, "over")); }
  // turrets can be shot down, but never by the one who set them
  { const ts = L.makeGame(duelSrc.replace("fire : (t sees) and (t cool <= 0) and (off abs < 0.1)", "fire : false"), { players: 2, me: 1 }); ts.tick(1 / 60, pad({}), pad({}));
    put(ts, 1, { x: 9.5, y: 7.5, angle: 0 }); put(ts, 0, { x: 2.5, y: 13.5 }); ts.tick(1 / 60, pad({}), pad({ sentry: true }));
    put(ts, 1, { x: 2.5, y: 2.5 }); put(ts, 0, { x: 13.0, y: 7.5, angle: Math.PI });
    for (let t = 0; t < 45; t++) ts.tick(1 / 60, pad({ fire: true }), pad({}));
    ok("silvereye: two shots bring down someone else's turret", f(ts, "turrets").count() === 0);
    put(ts, 1, { x: 9.5, y: 7.5, angle: 0 }); ts.tick(1 / 60, pad({}), pad({ sentry: true })); put(ts, 1, { x: 13.0, y: 7.5, angle: Math.PI });
    for (let t = 0; t < 45; t++) ts.tick(1 / 60, pad({}), pad({ fire: true }));
    ok("silvereye: your own turret isn't in your sights", f(ts, "turrets").count() === 1); }
  // a guard who is hit staggers for a moment
  { const sg = L.makeGame(src, {}); sg.tick(1 / 60, pad({})); put(sg, 0, { x: 9.5, y: 7.5, angle: 0 });
    sg.tick(1 / 60, pad({ fire: true })); const g3 = f(sg, "guards").part(3);
    ok("silvereye: a guard who is hit staggers and can't fire back at once", g3.field("stagger") > 0.3 && g3.field("fired") === false); }
  // every mode played for a while, with every control used, must not make Sprout warn about anything
  { const said = []; S.setLog(m => said.push(m));
    const runs = [[src, {}, 1], [src.replace(/^mode : "mission"/m, 'mode : "sim"'), {}, 1], [src, { players: 2, me: 1 }, 2]];
    for (const [code, opts, n] of runs) {
      const w = L.makeGame(code, opts);
      for (let t = 0; t < 600; t++) {
        const a = pad({ walk: Math.sin(t / 30), strafe: Math.cos(t / 47), look: t * 0.01, fire: t % 40 < 20, zoom: t % 200 > 150, mine: t % 150 === 0, sentry: t % 290 === 0, reload: t % 333 === 0, swap: t % 250 === 0 });
        if (n === 2) w.tick(1 / 60, a, pad({ walk: 1, look: -t * 0.01, fire: t % 30 < 10 })); else w.tick(1 / 60, a);
        if (t % 50 === 0) w.draw();
      }
    }
    S.setLog(m => logs.push(m));
    ok("silvereye: every mode plays with every control and Sprout warns about nothing", said.length === 0, said.slice(0, 3)); }
  // the depot: a second map for matches; a mission stays in the lab
  { const simHere = src.replace(/^mode : "mission"/m, 'mode : "sim"'); const dp = L.makeGame(simHere.replace(/^arena : "lab"/m, 'arena : "depot"'), {}); dp.tick(1 / 60, pad({}));
    const walls = dp.draw().filter(x => x[0] === "block").length, labWalls = L.makeGame(simHere, {}).draw().filter(x => x[0] === "block").length;
    for (let t = 0; t < 600; t++) dp.tick(1 / 60, pad({}));
    ok("silvereye: the depot is its own map, and a match plays in it", walls !== labWalls && [2, 3, 4].some(n => agent(dp, n).field("kills") > 0 || agent(dp, n).field("x") !== 0), [walls, labWalls]);
    const dm = L.makeGame(src.replace(/^arena : "lab"/m, 'arena : "depot"'), {}); dm.tick(1 / 60, pad({}));
    ok("silvereye: a mission stays in the lab whatever the arena", dm.draw().filter(x => x[0] === "block").length === labWalls && f(dm, "guards").count() === 6); }
  // co-op: two phones play the mission together; the guards go for whoever is nearer; it's lost only if both are down
  { const coSrc = src.replace(/^two-phones : "duel"/m, 'two-phones : "coop"'), co = L.makeGame(coSrc, { players: 2, me: 2 }); co.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: co-op is the mission for two, guards and all", f(co, "versus") === false && f(co, "agents").count() === 2 && f(co, "guards").count() === 6 && co.draw().some(x => x[0] === "text" && /GUARDS/.test(x[1][0])));
    put(co, 0, { x: 2.5, y: 2.5, health: 0, "down-at": 0.01 }); co.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: in co-op, one player down doesn't end the mission", f(co, "over") === ""); }
  { const tb = L.makeGame(src.replace(/^turbo : false/m, "turbo : true"), {}), nt = L.makeGame(src, {});
    tb.tick(1 / 60, pad({})); nt.tick(1 / 60, pad({}));
    for (let t = 0; t < 20; t++) { tb.tick(1 / 60, pad({ walk: 1 })); nt.tick(1 / 60, pad({ walk: 1 })); }
    ok("silvereye: turbo moves you half as fast again", Math.abs((agent(tb, 1).field("x") - 2.5) / (agent(nt, 1).field("x") - 2.5) - 1.5) < 0.05); }
  { const sa = L.makeGame(src.replace(/^sight-always : true/m, "sight-always : false"), {}); sa.tick(1 / 60, pad({}));
    const sightLines = () => sa.draw().filter(x => x[0] === "line" && Math.abs(x[1][1] - x[1][3]) < 1e-9 && x[1][1] === 240 && Math.abs(x[1][0] - 180) < 8).length;
    const before = sightLines(); sa.tick(1 / 60, pad({ zoom: true }));
    ok("silvereye: with the sight set to aiming, it shows only while you aim", before === 0 && sightLines() === 2, [before, sightLines()]); }
  { const dd = L.makeGame(duelSrc, { players: 2, me: 1 }); dd.tick(1 / 60, pad({}), pad({}));
    put(dd, 0, { x: 8.5, y: 7.5, angle: -Math.PI / 2 }); put(dd, 1, { x: 12.5, y: 7.5, angle: Math.PI }); dd.tick(1 / 60, pad({}), pad({ fire: true }));
    const mark = dd.draw().find(x => x[0] === "circle" && x[1][3] === "#ff3b30cc");
    ok("silvereye: when you're hit, a red mark points to where it came from", agent(dd, 1).field("hurt-x") === 12.5 && mark && mark[1][0] > 300, mark && mark[1]); }
  { const ah = h => { const t = L.makeGame(src, {}); t.tick(1 / 60, pad({})); put(t, 0, { x: 9.5, y: 7.5, angle: 0.14 }); t.tick(1 / 60, pad({ assist: h })); return agent(t, 1).field("aimed") !== false; };
    ok("silvereye: aim help is set by each player: more help locks on from further off the middle", ah(1.6) === true && ah(1) === false && ah(0) === false); }
  { const cs = L.makeGame(src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^simulants : 3/m, "simulants : 1"), {}); cs.tick(1 / 60, pad({}));
    put(cs, 0, { x: 12.5, y: 7.5, angle: Math.PI }); put(cs, 1, { x: 8.5, y: 7.5, angle: 0 });
    for (let t = 0; t < 120; t++) cs.tick(1 / 60, pad({ fire: true }));
    const texts = cs.draw().filter(x => x[0] === "text").map(x => x[1][0]);
    ok("silvereye: in a combat sim, player 2 is a simulant with a codename, not a rival", texts.includes("YOU took down ASTER") && !texts.some(t => /RIVAL$/.test(t) && /took down/.test(t)), texts); }
  { const seven = L.makeGame(src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^simulants : 3/m, "simulants : 7"), {}); seven.tick(1 / 60, pad({}));
    const spots = new Set(S.partsOf(f(seven, "agents")).map(a => a.field("x") + "," + a.field("y")));
    for (let t = 0; t < 300; t++) seven.tick(1 / 60, pad({}));
    ok("silvereye: seven simulants each start in their own place and play", f(seven, "agents").count() === 8 && spots.size === 8); }
  // the example programs on the console's program sheet: each one runs in the game, with turrets and firing, and nothing warns
  { const html = fs.readFileSync(__dirname + "/../silvereye/index.html", "utf8"), examples = [...html.matchAll(/`(-- [\s\S]*?)`/g)].map(m => m[1]);
    const putCell = (code, name, text) => { const b = code.search(new RegExp("^" + name + " : \\[", "m")), e = code.indexOf("\n]\n", b); return code.slice(0, b) + text.trim() + code.slice(e + 2); };
    const said = []; S.setLog(m => said.push(m));
    for (const x of examples) {
      const code = putCell(src.replace(/^mode : "mission"/m, 'mode : "sim"'), /turret-program/.test(x) ? "turret-program" : "simulant-program", x), w = L.makeGame(code, {});
      for (let t = 0; t < 200; t++) w.tick(1 / 60, pad({ sentry: t < 2, fire: t % 20 < 5, walk: Math.sin(t / 20) }));
    }
    S.setLog(m => logs.push(m));
    ok("silvereye: the ten example programs all run, and nothing warns", examples.length === 10 && said.length === 0, said.slice(0, 2));
    ok("silvereye: the example programs are written in the plain words", examples.every(x => /\[it \|/.test(x) && !/atan2|clamp/.test(x))); }
  // the campaign: three missions, each with its own map, guards, targets and way out, all on open floor
  { const mapOf = name => { const m = src.match(new RegExp("^" + name + " : \\[\\n([\\s\\S]*?)\\n\\]", "m")); return m[1].split("\n").map(l => l.trim().replace(/"/g, "")); };
    const maps = { lab: mapOf("lab"), depot: mapOf("depot"), relay: mapOf("relay"), compound: mapOf("compound"), quarry: mapOf("quarry") }, said = []; S.setLog(m => said.push(m));
    const counts = [];
    for (const [stage, map, guards, targets] of [[1, "lab", 6, 2], [2, "depot", 7, 3], [3, "relay", 9, 2], [4, "compound", 10, 2], [5, "quarry", 10, 2]]) {
      const ms = L.makeGame(src.replace(/^stage : 1/m, "stage : " + stage), {}); ms.tick(1 / 60, pad({}));
      const M = maps[map], open = (x, y) => ".,".includes((M[Math.floor(y)] || "")[Math.floor(x)] || "#");
      const pts = [...S.partsOf(f(ms, "guards")).flatMap(g => [[g.field("x"), g.field("y")], [g.field("to-x"), g.field("to-y")]]), ...S.partsOf(f(ms, "machines")).map(m => [m.field("x"), m.field("y")]), ...S.partsOf(f(ms, "pickups")).map(p => [p.field("x"), p.field("y")]), [agent(ms, 1).field("x"), agent(ms, 1).field("y")]];
      const walls = ms.draw().filter(x => x[0] === "block" && x[1][4] === 2.5 && x[1][6] !== "plate").length, wallCount = M.join("").split("#").length - 1;
      counts.push([stage, f(ms, "guards").count(), f(ms, "machines").count(), pts.filter(([x, y]) => !open(x, y)), walls === wallCount]);
      for (let t = 0; t < 300; t++) ms.tick(1 / 60, pad({ walk: 1, look: t * 0.02, fire: t % 30 < 8 }));
    }
    S.setLog(m => logs.push(m));
    ok("silvereye: five missions, each with its guards and targets on open floor of its own map", counts.length === 5 && counts.every(([st, g, m, bad, walls], i) => g === [6, 7, 9, 10, 10][i] && m === [2, 3, 2, 2, 2][i] && bad.length === 0 && walls), counts);
    ok("silvereye: every mission plays without a warning", said.length === 0, said.slice(0, 2)); }
  // the campaign moves on: a won mission waits; swapping in the next stage starts it fresh, with its title card
  { const camp = src.replace(/^campaign : false/m, "campaign : true"), cg = L.makeGame(camp, {}); cg.tick(1 / 60, pad({}));
    ok("silvereye: a mission opens with its title card", cg.draw().some(x => x[0] === "text" && x[1][0] === "MISSION 1 · THE LAB"));
    const m4 = new Map(S.fieldsOf(cg.state)); m4.set("over", "won"); m4.set("over-at", 10); cg.setState(S.valueCellOf([], m4), 20);
    for (let t = 0; t < 120; t++) cg.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: in a campaign a won mission waits for the next", f(cg, "over") === "won" && cg.draw().some(x => x[0] === "text" && x[1][0] === "press A for the next mission"));
    cg.swap(camp.replace(/^stage : 1/m, "stage : 2")); cg.tick(1 / 60, pad({}));
    ok("silvereye: the next stage starts fresh, in its own map, with its card", f(cg, "over") === "" && f(cg, "guards").count() === 7 && cg.draw().some(x => x[0] === "text" && x[1][0] === "MISSION 2 · THE DEPOT"), [f(cg, "over"), f(cg, "guards").count()]);
    const last = L.makeGame(camp.replace(/^stage : 1/m, "stage : 5"), {}); last.tick(1 / 60, pad({})); const m5 = new Map(S.fieldsOf(last.state)); m5.set("over", "won"); last.setState(S.valueCellOf([], m5));
    ok("silvereye: the last mission ends the campaign", last.draw().some(x => x[0] === "text" && x[1][0] === "CAMPAIGN COMPLETE")); }
  { const fl = L.makeGame(src, {}); fl.tick(1 / 60, pad({})); const v0 = fl.draw().find(x => x[0] === "view")[1];
    for (let t = 0; t < 200; t++) fl.tick(1 / 60, pad({})); const v1 = fl.draw().find(x => x[0] === "view")[1];
    ok("silvereye: a mission opens with the camera sweeping down to your eyes", v0[1] > 3 && Math.abs(v1[1] - 1.55) < 1e-9 && Math.abs(v1[0] - agent(fl, 1).field("x")) < 1e-9, [v0.slice(0, 3), v1.slice(0, 3)]); }
  // scientists: they walk their rounds, freeze when the alarm is up, and hurting one fails the mission
  { const sc = L.makeGame(src, {}); sc.tick(1 / 60, pad({}));
    ok("silvereye: the lab has two scientists, drawn as workers, and an objective to keep them safe", f(sc, "scientists").count() === 2 && sc.draw().some(x => x[0] === "model" && x[1][0] === "worker") && sc.draw().some(x => x[0] === "text" && /BONUS: NO SCIENTISTS HURT/.test(x[1][0])));
    const x0 = f(sc, "scientists").part(1).field("x"); for (let t = 0; t < 60; t++) sc.tick(1 / 60, pad({}));
    ok("silvereye: a scientist walks their rounds", f(sc, "scientists").part(1).field("x") > x0 + 0.3);
    put(sc, 0, { x: 13.5, y: 1.5, angle: Math.PI }); const before = f(sc, "scientists").part(1).field("x");
    for (let t = 0; t < 30 && f(sc, "scientists").part(1).field("health") > 0; t++) sc.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: hurting a scientist loses the bonus, but the mission goes on", f(sc, "over") === "" && f(sc, "scientists").part(1).field("health") <= 0 && sc.draw().some(x => x[0] === "text" && x[1][0] === "SCIENTIST HURT · BONUS LOST"), [f(sc, "over"), before]); }
  { const ex = L.makeGame(src, {}); ex.tick(1 / 60, pad({})); put(ex, 0, { x: 9.5, y: 7.5, angle: 0 });
    for (let t = 0; t < 90 && !f(ex, "guards").part(3).field("alert"); t++) ex.tick(1 / 60, pad({}));
    const mark = ex.draw().find(x => x[0] === "text" && x[1][0] === "!");
    ok("silvereye: a guard who spots you gets a ! over their head, in front of you", f(ex, "guards").part(3).field("alert") === true && mark && Math.abs(mark[1][1] - 180) < 40 && mark[1][2] < 240, mark && mark[1]); }
  { const ob = L.makeGame(src, {}); ob.tick(1 / 60, pad({})); put(ob, 0, { x: 14.5, y: 12.5 }); ob.tick(1 / 60, pad({}));
    ok("silvereye: taking the intel flashes OBJECTIVE COMPLETE", f(ob, "intel") === true && ob.draw().some(x => x[0] === "text" && x[1][0] === "OBJECTIVE COMPLETE")); }
  { const wd = L.makeGame(src.replace(/^stage : 1/m, "stage : 3"), {}); wd.tick(1 / 60, pad({}));
    const w = S.partsOf(f(wd, "guards")).find(g => g.field("boss") === true);
    ok("silvereye: the relay has the Warden, a mech with four times a guard's health", w && w.field("health") === 400 && wd.draw().some(x => x[0] === "model" && x[1][0] === "mech")); }
  { const bd = L.makeGame(src, {}); bd.tick(1 / 60, pad({})); put(bd, 0, { x: 9.5, y: 7.5, angle: 0 });
    for (let t = 0; t < 30; t++) bd.tick(1 / 60, pad({ fire: true }));
    const soldiers = () => bd.draw().filter(x => x[0] === "model" && x[1][0] === "adventurer").length, before = soldiers();
    for (let t = 0; t < 60 * 7; t++) bd.tick(1 / 60, pad({}));
    ok("silvereye: a fallen guard is gone after a few seconds", f(bd, "guards").part(3).field("health") <= 0 && soldiers() === before - 1, [before, soldiers()]); }
  { const bh = L.makeGame(src, {}); bh.tick(1 / 60, pad({})); put(bh, 0, { x: 2.5, y: 2.5, angle: Math.PI });
    for (let t = 0; t < 60 * 10; t++) bh.tick(1 / 60, pad({ fire: t % 20 < 2, reload: t % 200 === 0 }));
    const hs = S.partsOf(f(bh, "holes"));
    ok("silvereye: misses leave holes in the wall, the last 24 kept", hs.length > 3 && hs.length <= 24 && hs.every(h => Math.abs(h.field("x") - 1.0) < 0.05), [hs.length, hs[0] && hs[0].field("x")]); }
  // doors: shut when nobody is near, slid up when someone comes close; you can walk through a door's cell
  { const dr = L.makeGame(src, {}); dr.tick(1 / 60, pad({}));
    const door = () => dr.draw().filter(x => x[0] === "block" && x[1][6] === "plate" && x[1][4] === 2.5).find(x => Math.abs(x[1][0] - 7.5) < 0.01 && Math.abs(x[1][2] - 4.5) < 0.01);
    const shut = door()[1][1]; put(dr, 0, { x: 6.2, y: 4.5, angle: 0 }); dr.tick(1 / 60, pad({})); const opened = door()[1][1];
    for (let t = 0; t < 60; t++) dr.tick(1 / 60, pad({ walk: 1 }));
    ok("silvereye: a door slides up as you come near, and you walk through", shut === 1.25 && opened > 2.5 && agent(dr, 1).field("x") > 8.5, [shut, opened, agent(dr, 1).field("x")]); }
  { const sk = L.makeGame(src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^simulants : 3/m, "simulants : 2"), {}); sk.tick(1 / 60, pad({}));
    const pm = (i, o) => put(sk, i, o);
    pm(0, { x: 4.5, y: 7.5, angle: 0 }); pm(1, { x: 6.0, y: 7.3, health: 10 }); pm(2, { x: 6.0, y: 7.7, health: 10 });
    for (let t = 0; t < 40; t++) sk.tick(1 / 60, pad({ fire: true }));
    ok("silvereye: two takedowns in quick succession are a double", agent(sk, 1).field("streak") >= 2 && agent(sk, 1).field("kills") >= 2, [agent(sk, 1).field("streak"), agent(sk, 1).field("kills")]); }
  { const mt = L.makeGame(src, {}); for (let t = 0; t < 60 * 6; t++) mt.tick(1 / 60, pad({}));
    ok("silvereye: a mission shows its clock once the card has gone", mt.draw().some(x => x[0] === "text" && x[1][0] === "0:05")); }
  // an alert guard faces you, not away from you
  { const fc = L.makeGame(src, {}); fc.tick(1 / 60, pad({})); put(fc, 0, { x: 9.5, y: 7.5, angle: 0 });
    for (let t = 0; t < 120 && !f(fc, "guards").part(3).field("alert"); t++) fc.tick(1 / 60, pad({}));
    fc.tick(1 / 60, pad({})); const g3 = f(fc, "guards").part(3), toYou = Math.atan2(7.5 - g3.field("y"), 9.5 - g3.field("x"));
    const off = Math.abs(((g3.field("angle") - toYou) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
    ok("silvereye: an alert guard turns to face you, not away", g3.field("alert") === true && off < 0.2, [g3.field("angle"), toYou]); }
  ok("silvereye: guards are the adventurer, with a blaster in his hand", g.draw().filter(x => x[0] === "model" && x[1][0] === "adventurer" && x[1][8] === "blaster_g").length >= 5);
  { const bodies = st => { const m = L.makeGame(src.replace(/^stage : 1/m, "stage : " + st), {}); m.tick(1 / 60, pad({})); return m.draw().filter(x => x[0] === "model" && ["adventurer", "soldier", "hooded_adventurer"].includes(x[1][0])).map(x => x[1][0] + ":" + x[1][6]); };
    const depot = bodies(2), relay = bodies(3), yard = bodies(4);
    ok("silvereye: each mission has its own guards: soldiers in the depot, hooded elites with field agents at the relay, a mix in the compound",
      depot.length === 7 && depot.every(b => b === "soldier:Run") && relay.length === 8 && relay.filter(b => b === "hooded_adventurer:Walk").length === 4 && relay.filter(b => b === "adventurer:Walk").length === 4 && yard.filter(b => /^soldier/.test(b)).length === 5 && yard.filter(b => /^adventurer/.test(b)).length === 5, [depot, relay, yard]); }
  // shooting a mine sets it off
  const sm = L.makeGame(duelSrc, { players: 2, me: 1 }); sm.tick(1 / 60, pad({}), pad({}));
  put(sm, 0, { x: 4.5, y: 7.5, angle: 0 }); put(sm, 1, { x: 2.5, y: 13.5 });
  sm.tick(1 / 60, pad({ mine: true }), pad({}));
  put(sm, 0, { x: 1.6, y: 7.5, angle: 0 }); put(sm, 1, { x: 7.6, y: 7.5 });
  for (let t = 0; t < 3; t++) sm.tick(1 / 60, pad({ fire: true }), pad({}));
  ok("silvereye: a shot sets off a mine, and the blast reaches whoever is near", f(sm, "mines").count() === 0 && agent(sm, 2).field("health") < 100, agent(sm, 2).field("health"));
  // pickups: ammo adds spare shots, armour takes hits before your health; in a match they come back later
  const pk = L.makeGame(duelSrc, { players: 2, me: 1 }); pk.tick(1 / 60, pad({}), pad({}));
  put(pk, 0, { x: 5.5, y: 1.5 }); pk.tick(1 / 60, pad({}), pad({}));
  ok("silvereye: walking over ammo takes it, and it's gone for a while", agent(pk, 1).field("ammo") === 64 && f(pk, "pickups").part(1).field("back-at") > f(pk, "clock") + 10);
  put(pk, 0, { x: 8.5, y: 5.5 }); pk.tick(1 / 60, pad({}), pad({}));
  put(pk, 0, { x: 8.5, y: 7.5, angle: 0 }); put(pk, 1, { x: 12.5, y: 7.5, angle: Math.PI });
  for (let t = 0; t < 10; t++) pk.tick(1 / 60, pad({}), pad({ fire: true }));
  ok("silvereye: armour takes the hits first", agent(pk, 1).field("health") === 100 && agent(pk, 1).field("armour") < 50, [agent(pk, 1).field("health"), agent(pk, 1).field("armour")]);
  // the combat sim: you against simulants, which hunt, shoot and score; the takedown goes to whoever did it
  const simSrc = src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^simulants : 3/m, "simulants : 3");
  const c = L.makeGame(simSrc, {}); c.tick(1 / 60, pad({}));
  ok("silvereye: a combat sim is you and the simulants, with no guards", f(c, "agents").count() === 4 && f(c, "guards").count() === 0 && f(c, "versus") === true && agent(c, 2).field("bot") === true);
  for (let t = 0; t < 60 * 40; t++) c.tick(1 / 60, pad({}));
  const kills = [1, 2, 3, 4].map(n => agent(c, n).field("kills")), roamed = [2, 3, 4].some(n => agent(c, n).field("x") !== [0, 0, 13.5, 13.5, 2.5][n]);
  ok("silvereye: simulants roam the lab and take each other (and you) down", roamed && kills.slice(1).reduce((x, y) => x + y) > 0, kills);
  { const st = L.makeGame(simSrc, {}); st.tick(1 / 60, pad({}));
    put(st, 0, { x: 8.5, y: 7.5, angle: 0 }); put(st, 1, { x: 12.5, y: 7.5, angle: Math.PI }); put(st, 2, { x: 2.5, y: 13.5 }); put(st, 3, { x: 13.5, y: 2.5 });
    for (let t = 0; t < 30; t++) st.tick(1 / 60, pad({}));
    ok("silvereye: a camper simulant holds its ground when it sees you", Math.abs(agent(st, 2).field("x") - 12.5) < 1e-9, agent(st, 2).field("x")); }
  const both = L.makeGame(src, { players: 2, me: 1 }); both.tick(1 / 60, pad({}), pad({}));
  ok("silvereye: simulants join a duel too", f(both, "agents").count() === 5 && agent(both, 3).field("bot") === true);
  ok("silvereye: simulants are drawn as robots, a player as their look (the operative by default)", both.draw().filter(x => x[0] === "model" && x[1][0] === "robot_gunner").length === 3 && both.draw().filter(x => x[0] === "model" && x[1][0] === "hooded_adventurer").length === 1);
  // the console starts a two-phone duel with mode "duel": the second player must get a body (they once didn't)
  { const dd = L.makeGame(src.replace(/^mode : "mission"/m, 'mode : "duel"'), { players: 2, me: 1 }); dd.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: a duel from the console has both players in it, and simulants", f(dd, "agents").count() === 5 && agent(dd, 2).field("bot") !== true && f(dd, "versus") === true && f(dd, "guards").count() === 0);
    put(dd, 0, { x: 8.5, y: 7.5, angle: 0 }); put(dd, 1, { x: 12.5, y: 7.5, angle: Math.PI });
    for (let t = 0; t < 30; t++) dd.tick(1 / 60, pad({}), pad({ fire: true }));
    ok("silvereye: and the second player's shots land", agent(dd, 1).field("health") < 100); }
  // the compound as an arena: out in the open, for a combat sim or a duel
  { const yardSrc = src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^arena : "lab"/m, 'arena : "compound"').replace(/^simulants : 3/m, "simulants : 7");
    const yd = L.makeGame(yardSrc, {}); yd.tick(1 / 60, pad({}));
    const rows = (src.match(/^compound : \[\n([\s\S]*?)\n\]/m)[1]).split("\n").map(l => l.trim().replace(/"/g, ""));
    const onOpen = (x, y) => ".,".includes(rows[Math.floor(y)][Math.floor(x)]);
    ok("silvereye: a combat sim in the compound starts everyone on open ground, apart", S.partsOf(f(yd, "agents")).every(a => onOpen(a.field("x"), a.field("y"))) && new Set(S.partsOf(f(yd, "agents")).map(a => a.field("x") + "," + a.field("y"))).size === 8);
    ok("silvereye: its pickups lie on open ground too", S.partsOf(f(yd, "pickups")).every(p => onOpen(p.field("x"), p.field("y"))) && f(yd, "pickups").count() === 7);
    ok("silvereye: and it's drawn out under the sky", yd.draw().some(x => x[0] === "sky") && yd.draw().some(x => x[0] === "model" && x[1][0] === "tree_pine"));
    for (let t = 0; t < 300; t++) yd.tick(1 / 60, pad({ fire: t % 30 < 5, walk: 1 }));
    ok("silvereye: and the simulants play there", S.partsOf(f(yd, "agents")).filter(a => a.field("bot")).every(a => onOpen(a.field("x"), a.field("y")))); }
  { const qSrc = src.replace(/^mode : "mission"/m, 'mode : "sim"').replace(/^arena : "lab"/m, 'arena : "quarry"').replace(/^simulants : 3/m, "simulants : 7");
    const qd = L.makeGame(qSrc, {}); qd.tick(1 / 60, pad({}));
    const rows = (src.match(/^quarry : \[\n([\s\S]*?)\n\]/m)[1]).split("\n").map(l => l.trim().replace(/"/g, ""));
    const onOpen = (x, y) => ".,".includes(rows[Math.floor(y)][Math.floor(x)]);
    ok("silvereye: the quarry is an arena too: everyone starts on open ground, apart, with its pickups, under the sky", S.partsOf(f(qd, "agents")).every(a => onOpen(a.field("x"), a.field("y"))) && new Set(S.partsOf(f(qd, "agents")).map(a => a.field("x") + "," + a.field("y"))).size === 8 && S.partsOf(f(qd, "pickups")).every(p => onOpen(p.field("x"), p.field("y"))) && qd.draw().some(x => x[0] === "sky"));
    for (let t = 0; t < 200; t++) qd.tick(1 / 60, pad({ fire: t % 30 < 5, walk: 1 }));
    ok("silvereye: and the simulants play there", S.partsOf(f(qd, "agents")).every(a => onOpen(a.field("x"), a.field("y")))); }
  { const dy = L.makeGame(duelSrc.replace(/^mode : "mission"/m, 'mode : "duel"').replace(/^arena : "lab"/m, 'arena : "compound"'), { players: 2, me: 1 }); dy.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: a duel in the compound puts the two players in far corners", agent(dy, 1).field("x") === 2.5 && agent(dy, 1).field("y") === 21.5 && agent(dy, 2).field("x") === 20.5 && agent(dy, 2).field("y") === 1.5); }
  { const tp = L.makeGame(duelSrc, { players: 2, me: 1 }); tp.tick(1 / 60, pad({}), pad({}));
    put(tp, 0, { x: 8.5, y: 7.5, angle: 0 }); put(tp, 1, { x: 12.5, y: 7.5, angle: Math.PI });
    for (let k = 0; k < 2; k++) tp.tick(1 / 60, pad({}), pad({ sentry: true }));
    tp.tick(1 / 60, pad({}), pad({}));
    ok("silvereye: a rival's turret in your sight is named, with what it has left", tp.draw().some(x => x[0] === "text" && x[1][0] === "TURRET") && tp.draw().some(x => x[0] === "rect" && x[1][3] === 2 && x[1][4] === "#ff5a4f")); }
  { const np = L.makeGame(duelSrc, { players: 2, me: 1 }); np.tick(1 / 60, pad({}), pad({ skin: 5, tag: "VIPER" }));
    put(np, 0, { x: 8.5, y: 7.5, angle: 0 }); put(np, 1, { x: 12.5, y: 7.5, angle: Math.PI }); np.tick(1 / 60, pad({}), pad({ skin: 5, tag: "VIPER" }));
    ok("silvereye: a rival's codename shows over their head, in red", np.draw().some(x => x[0] === "text" && x[1][0] === "VIPER" && x[1][4] === "#ff9b8f"));
    np.tick(1 / 60, pad({}), pad({ skin: 5, tag: "" }));
    ok("silvereye: with no codename, it's the name of their look", np.draw().some(x => x[0] === "text" && x[1][0] === "TROOPER")); }
  { const co = L.makeGame(src.replace(/^two-phones : "duel"/m, 'two-phones : "coop"'), { players: 2, me: 1 }); co.tick(1 / 60, pad({}), pad({ tag: "ACE" }));
    put(co, 0, { x: 2.5, y: 2.5, angle: 0 }); put(co, 1, { x: 5.5, y: 2.5, angle: 0 }); co.tick(1 / 60, pad({}), pad({ tag: "ACE" }));
    ok("silvereye: in a two-phone mission your partner is blue, on the map and over their head", co.draw().some(x => x[0] === "text" && x[1][0] === "ACE" && x[1][4] === "#9be7ff") && co.draw().some(x => x[0] === "circle" && x[1][2] === 1.6 && x[1][3] === "#5fa8ff"));
    for (let t = 0; t < 40; t++) co.tick(1 / 60, pad({ fire: true }), pad({ tag: "ACE" }));
    ok("silvereye: and your shots don't hurt them", agent(co, 2).field("health") === 100 && agent(co, 1).field("shots-fired") >= 3); }
  { const lk = L.makeGame(duelSrc, { players: 2, me: 1 }); lk.tick(1 / 60, pad({}), pad({ skin: 5, tag: "VIPER" }));
    put(lk, 0, { x: 8.5, y: 7.5, angle: 0 }); put(lk, 1, { x: 12.5, y: 7.5, angle: Math.PI });
    for (let t = 0; t < 60; t++) lk.tick(1 / 60, pad({ fire: true }), pad({ skin: 5, tag: "VIPER" }));
    const texts = lk.draw().filter(x => x[0] === "text").map(x => x[1][0]);
    ok("silvereye: the other player looks as they chose, and goes by their codename", lk.draw().some(x => x[0] === "model" && x[1][0] === "soldier") && texts.includes("YOU took down VIPER"), texts.slice(0, 6)); }
  // credit: with three in the lab, a takedown counts only for the one who made it
  const t3 = L.makeGame(src.replace(/^simulants : 3/m, "simulants : 1"), { players: 2, me: 1 }); t3.tick(1 / 60, pad({}), pad({}));
  put(t3, 0, { x: 8.5, y: 7.5, angle: 0 }); put(t3, 1, { x: 12.5, y: 7.5, angle: Math.PI }); put(t3, 2, { x: 2.5, y: 13.5, angle: 0 });
  for (let t = 0; t < 60; t++) t3.tick(1 / 60, pad({ fire: true }), pad({}));
  ok("silvereye: the takedown is credited to the one who made it", agent(t3, 1).field("kills") === 1 && agent(t3, 3).field("kills") === 0 && agent(t3, 2).field("last-by") === 1);
  // aim mode: a narrower view, slower feet, and a steadier, harder shot
  const z = L.makeGame(duelSrc, { players: 2, me: 1 }); z.tick(1 / 60, pad({}), pad({}));
  put(z, 0, { x: 8.5, y: 7.5, angle: 0 }); put(z, 1, { x: 12.5, y: 7.5, angle: Math.PI });
  const wide = z.draw().find(x => x[0] === "view")[1][5];
  z.tick(1 / 60, pad({ zoom: true, fire: true }), pad({}));
  const narrow = z.draw().find(x => x[0] === "view")[1][5];
  ok("silvereye: aiming narrows the view and a steady shot hits harder", narrow < wide * 0.6 && agent(z, 2).field("health") === 50, [wide, narrow, agent(z, 2).field("health")]);
  // the field of view is set across the screen, and the camera gets the matching angle top to bottom
  const fv = L.makeGame(src, { W: 300, H: 330 }); fv.tick(1 / 60, pad({ fov: 100 }));
  const tall = fv.draw().find(x => x[0] === "view")[1][5], want = 2 * Math.atan(Math.tan(50 * Math.PI / 180) * 330 / 300) * 180 / Math.PI;
  ok("silvereye: the field of view is how wide you see across, set from the console", Math.abs(tall - want) < 1e-6, [tall, want]);
}

// ---------------- Swarm: thousands of drones in columns, turrets with a program
{
  const src = fs.readFileSync(__dirname + "/examples/swarm.sp", "utf8"), g = L.makeGame(src, {});
  const notes = g.speedNotes, line = (re) => { const n = src.split("\n").findIndex(l => re.test(l)) + 1; return notes.filter(x => x.line === n); };
  ok("swarm: the wave is a spork kernel", line(/spork spawn/).some(n => n.word === "spork" && n.fast));
  ok("swarm: moving every drone is one fused loop", line(/flown : game drones/).some(n => n.fast));
  ok("swarm: drawing every drone is fused", line(/game drones each/).some(n => n.fast));
  for (let t = 0; t < 60 * 8; t++) g.tick(1 / 60);
  ok("swarm: the drones are kept in columns", f(g, "drones") instanceof S.ColumnCell, f(g, "drones").constructor.name);
  ok("swarm: turrets fire and drones go down", f(g, "kills") > 50 && f(g, "turrets").part(1).field("shots") > 5, f(g, "kills"));
  // the program is the turrets' brain: a program that never fires shoots nothing
  const idle = L.makeGame(src.replace("fire : (t far < reach) and (t cool <= 0) and (off abs < 0.06)", "fire : false"), {});
  for (let t = 0; t < 60 * 8; t++) idle.tick(1 / 60);
  ok("swarm: change turret-program and the turrets change", f(idle, "kills") === 0);
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
