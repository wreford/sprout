// Sprout 3 tests: node test.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("FAIL", name); } };
const logs = []; S.setLog(m => logs.push(m));
const out = []; S.setOut(s => out.push(s));
const run = src => { out.length = 0; S.load(src).run(S.BANG); return out.slice(); };
const val = src => S.fmt(S.load("result : " + src).field("result"));

// the tour gives exactly these lines
const want = ["1","1","480","20","true","7","7","3","42","long","anon","[x : 1, y : 5]","[3, 1, 4, 9]","n=4","p is at 1, 2",
  "[30, 10, 40]","[3, 4]","8","hi","hi","hi","tapped","11","hello","true","true","false","6765"];
const got = run(fs.readFileSync(__dirname + "/examples/tour.sp", "utf8"));
ok("tour", JSON.stringify(got) === JSON.stringify(want));
if (JSON.stringify(got) !== JSON.stringify(want)) console.log(got);

// one decision per line
ok("1 -- only comments", val("1 -- note") === "1");
ok("' is a word character", val("[don't : 5] don't") === "5");
ok("-2 is a number", val("3 + -2") === "1");
ok("9 left to right", val("2 + 3 * 4") === "20");
ok("8 ( ) groups", val("2 + (3 * 4)") === "14");
ok("F @ reads a part", val("[3, 1, 4] @ 3") === "4");
ok("F a number is input, not index", val("[3, 1, 4] 2") === "4");
ok("71 [[x]] holds a cell", val("[[1, 2]] @ 1") === "[1, 2]");
ok("71 a branch can give back a record", val("true [[x : 1]] else [7]") === "[x : 1]");
ok("60 [x | [..]] keeps the inner cell", val("([x | [a : x]] 5) a") === "5");
ok("51 lazy once", S.fmt(S.load("r : [rand [0, 1000]]\nresult : (r @ 1) = (r @ 1)").field("result")) === "true");
ok("51 run is fresh", val("([] .. [1]) @ 1") === "1");
ok("81 template [ ]", val('"a[1 + 1]b"') === "a2b");
{ const before = logs.length;
  ok("83 a read before else may miss quietly", val('[x : 1] name else "anon"') === "anon" && logs.length === before);
  val('[x : 1] name'); ok("83 a read without else still logs the miss", logs.length === before + 1 && /doesn't know name/.test(logs[logs.length - 1]));
  ok("83 a miss deeper inside the left side still logs", (val('[x : [y : 1]] x z w else 0'), logs.slice(before).some(m => /doesn't know z/.test(m)))); }
ok("84 match gives a false answer instead of falling through", val('match ["leaf", ["leaf", false, any, true]]') === "false" && val('match [2, [1, "a", 2, "b", any, "c"]]') === "b" && val('match [9, [1, "a"]]') === "false");
ok("84 cond too", val('cond [true, false, any, 5]') === "false" && val('cond [false, 1, 2 > 1, 2, any, 3]') === "2");
ok("84 match only works out the answer it picks", val('match [1, [1, "one", 2, nope]]') === "one");
{ const before = logs.length;
  S.load("count : 3\nresult : cuont + 1").field("result");
  S.load("result : [speed : 3] sped").field("result");
  S.load("result : zzz-not-close").field("result");
  const got = logs.slice(before).join(" | ");
  ok("typos: an unknown word suggests the nearest name", /"cuont" isn't a word Sprout knows yet \(did you mean "count"\?\)/.test(got), got);
  ok("typos: a missing field suggests the nearest field", /doesn't know sped \(did you mean speed\?\)/.test(got), got);
  ok("typos: nothing close, no suggestion", /"zzz-not-close" isn't a word Sprout knows yet( \(line \d+\))?( \||$)/.test(got), got); }
{ const lineOf = src => { try { S.load(src); return 0; } catch (e) { return e.line; } };
  ok("an unclosed [ is reported where it opened", lineOf("a : 1\nb : [2, 3\nc : 4\nd : [5]\ne : 6") === 2);
  ok("an unclosed ( too", lineOf("a : 1\nb : (2 + 3\nc : 4") === 2); }
{ const sp = S.load("xs : []\nf : [p | p x > 1]\na : xs collect [p | p with [x : p x + 1]]\nb : xs keep [p | p x > 1]\nc : xs keep [p | f p]\nd : xs collect [p | p with [x : rand [0, 1]]]\ne : xs keep [p | p name = \"a\"]").speed;
  const at = l => sp.find(n => n.line === l);
  ok("86 speed notes: a with of number maths runs over columns", at(3).fast && at(3).word === "collect" && at(4).fast && at(4).word === "keep");
  ok("86 speed notes: say why a body runs item by item", at(5).why === "it calls f for each item" && /calls something/.test(at(6).why) && at(7).why === "it works with words, not numbers", sp.map(n => n.line + " " + n.why)); }
{ const n1 = +val("noise [3, 7]"), n2 = +val("noise [3, 7]"), n3 = +val("noise [3, 8]");
  ok("87 noise: the same inputs give the same number, from 0 up to 1", n1 === n2 && n1 !== n3 && n1 >= 0 && n1 < 1);
  const xs = Array.from({ length: 2000 }, (_, k) => +val("noise [" + k + ", 1]")), mean = xs.reduce((a, b) => a + b) / xs.length;
  ok("87 noise: spread evenly", mean > 0.47 && mean < 0.53 && Math.min(...xs) < 0.01 && Math.max(...xs) > 0.99, mean);
  const prog = "ps : range 50 collect [n | [x : n, y : 0]]\nresult : ps collect [p | p with [y : noise [p x, 9]]]";
  const a = S.load(prog).field("result"); S.columns(false); const b = S.load(prog).field("result"); S.columns(true);
  ok("87 noise runs inside a column loop, with the same results", a instanceof S.ColCell && S.fmt(a) === S.fmt(b) && S.load(prog).speed.find(n => n.line === 2).fast); }
ok("and/or run a call on their right before checking it", val("[k | k > 1 and ([d | d = 3] k)] 3") === "true" && val("[k | k > 9 or ([d | d = 3] k)] 3") === "true");
ok("81 ( ) is plain text", val('"rgba(0,0,0,0.5)"') === "rgba(0,0,0,0.5)");
ok("81 escaped bracket", val('"a\\[b]"') === "a[b]");
ok("15 by position", val("[x y | x - y] [5, 2]") === "3");
ok("15 by name", val("[x y | x - y] [y : 2, x : 5]") === "3");
ok("19 one name takes the cell", val("[xs | xs length] [1, 2, 3]") === "3");
ok("20 missing is false", val("[x y | y] [1]") === "false");
ok("21 defaults", val("[x y : 10 | x + y] [1]") === "11");
ok("69 ! fills defaults", val("[x : 1, y : 2 | x + y] !") === "3");
ok("22 equal contents", val("[1, [2, 3]] = [1, [2, 3]]") === "true");
ok("72 records compare by value", val("[x : 1 + 1, y : 2] = [x : 2, y : 2]") === "true" && val("[random] = [random]") === "false");
ok("23 cells that take input compare by code", val("[n | n + 1] = [n | n + 1]") === "true" && val("[n | n + 1] = [n | n + 2]") === "false");
ok("24 names filled in", val("(([x | [y | x + y]] 1) = ([x | [y | x + y]] 2))") === "false");
ok("26 booleans only", val("3 [\"yes\"]") === "false");
ok("28 miss gives false", val("5 frobnicate") === "false");
ok("36/37 operator on a cell", S.fmt(S.load("v : [+ : [right | left with [n : left n + (right n)]]]\na : v with [n : 2]\nb : v with [n : 5]\nresult : a + b n").field("result")) === "7");
ok("38/52 method runs on read", S.fmt(S.load("r : [w : 3, h : 4, area : [left w * (left h)]]\nresult : r area").field("result")) === "12");
ok("52 a value cell comes back", S.fmt(S.load("g : [ball : [x : 1]]\nresult : g ball x").field("result")) === "1");
ok("41/42 .. joins", val('"a" .. "b" .. 3') === "ab3" && val("[1] .. [2, 3]") === "[1, 2, 3]");
ok("45 with merges fields", val("[x : 1, y : 2] with [y : 9]") === "[x : 1, y : 9]");
ok("46 else", val("false else 7") === "7" && val("4 else 7") === "4");
ok("62 a boolean runs a cell", val("1 < 2 [\"a\"] else [\"b\"]") === "a" && val("1 > 2 [\"a\"] else [\"b\"]") === "b");
ok("62 catch: then gives false", val("true [false] else [\"b\"]") === "b");
ok("35 match", val('match [2, [1, "one", 2, "two", any, "many"]]') === "two" && val('match [9, [1, "one", any, "many"]]') === "many");
ok("55 collect keep fold", val("range 5 collect [n | n * n] keep [n | n > 4] fold [0, [t n | t + n]]") === "50");
ok("29 times", run("3 times [_ print]").join() === "1,2,3");
ok("59 indent is a cell", S.fmt(S.load("box :\n  w : 3\n  h : 4\nresult : box h").field("result")) === "4");
ok("61 named inputs with an indented body", S.fmt(S.load("f : [n |\n  m : n * 2\n  m + 1\n]\nresult : f 5").field("result")) === "11");
ok("25 self-recursion and tail calls", S.fmt(S.load("count : [n acc | n = 0 [acc] else [count [n - 1, acc + n]]]\nresult : count [100000, 0]").field("result")) === "5000050000");
ok("13 bound twice is an error", (() => { try { S.load("a : 1\na : 2"); return false; } catch (e) { return /bound twice/.test(e.message); } })());
ok("50 every and wave", val("every [0.5, 1.0, 0.1]") === "true" && val("every [0.5, 0.9, 0.1]") === "false");

// voice-call decisions (73-78)
logs.length = 0; S.load("x : 1\np : [x : 5]\nresult : p x").field("result");
ok("73 a field/name clash is loud", logs.some(m => /"x" is both a field here and a name in scope/.test(m)));
ok("75 a cell that takes input still has readable fields", val("[n | doc : \"doubles\", n * 2] doc") === "doubles");
ok("75 a binding that uses the input is a local", val("[n | m : n * 2, m + 1] m") === "false");
ok("75 its body still runs", val("[n | doc : \"doubles\", n * 2] 21") === "42");
logs.length = 0; S.load("a : 1\nb : 2\nresult : true [false] else [1]");
ok("74 a false then-branch before else is flagged", logs.some(m => /gives false before else/.test(m)));
ok("76 colour cells", val("rgba [0, 0, 0, 0.5]") === "rgba(0,0,0,0.5)" && val("rgb [255, 0, 0]") === "rgb(255,0,0)");
ok("77 cond", val('cond [1 > 2, "a", 2 > 1, "b", any, "c"]') === "b" && val('cond [1 > 2, "a"]') === "false");
ok("77 take", val("take [[5, 6, 7], 2]") === "[5, 6]" && val("take [[5], 9]") === "[5]");
ok("35 match with no match gives false", val('match [9, [1, "one"]]') === "false");
{
  const { sqliteCell } = require("./sqlite-host.js");
  process.removeAllListeners("warning");
  const db = sqliteCell(":memory:");
  db.raw.exec("create table atoms(id integer, zone integer, hours real); insert into atoms values (1, 3, 8), (2, 3, 4), (3, 5, 2);");
  S.G.db = db;
  ok("78 sqlite reads give cells", S.fmt(S.load('result : db query ["select hours from atoms where zone = ?", [3]] collect [r | r hours] fold [0, [t h | t + h]]').field("result")) === "12");
  const c = S.load('w : [db run ["insert into atoms values (?, ?, ?)", [4, 9, 1]]]');
  S.queueEffects(); c.field("w").run(S.BANG);
  ok("78 writes are queued", db.raw.prepare("select count(*) n from atoms").get().n === 3);
  S.runEffects();
  ok("78 and carried out after", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  S.queueEffects(); c.field("w").run(S.BANG); S.dropEffects();
  ok("78 and dropped on replay", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  delete S.G.db;
}

// 82: columns. Lists of number records are stored as columns, with exactly the same results as without them.
{
  const both = src => { const a = S.load(src).field("result"); S.columns(false); const b = S.load(src).field("result"); S.columns(true); return [a, b]; };
  const [a, b] = both(`step : [rs | rs collect [r | r with [y : r y + 1, z : r x * 2]] keep [r | (r y % 3) != 0 or (r x > 50)]]
go : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]
result : go [range 100 collect [n | [x : n, y : 0]], 5]`);
  ok("82 columns are used", a instanceof S.ColCell && !(b instanceof S.ColCell));
  ok("82 columns give the same list", S.fmt(a) === S.fmt(b) && S.eq(a, b) && S.eq(b, a) && a.count() === 50);
  ok("82 a part of a column list is a record", S.fmt(a.part(2)) === "[x : 52, y : 5, z : 104]" && a.part(0) === false && a.part(51) === false);
  const [c, d] = both(`xs : range 40 collect [n | [x : n, y : n * 2]]
result : xs collect [r | r with [x : r x + 1]] .. [[x : 0, y : 0]] .. (range 3 collect [n | [x : n, y : n]])`);
  ok("82 .. keeps columns", c instanceof S.ColCell && c.count() === 44 && S.fmt(c) === S.fmt(d));
  const [e, f] = both(`xs : range 40 collect [n | [x : n, name : "a"]]
result : xs collect [r | r with [x : r x + 1]]`);
  ok("82 a record with words stays as records", !(e instanceof S.ColCell) && S.fmt(e) === S.fmt(f));
  const [g2, h] = both(`xs : range 40 collect [n | [x : n]]
result : xs collect [r | r with [x : r nope + 1]]`);
  ok("82 a missing field falls back to the ordinary way", !(g2 instanceof S.ColCell) && S.fmt(g2) === S.fmt(h));
  // the particle fountain plays the same with and without columns
  const psrc = fs.readFileSync(__dirname + "/examples/particles.sp", "utf8");
  const play = on => {
    S.columns(on); const mr = Math.random; let seed = 7; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pg = L.makeGame(psrc); for (let t = 0; t < 150; t++) pg.tick(1 / 60);
    const dr = JSON.stringify(pg.draw()); Math.random = mr; S.columns(true);
    return [pg.state.field("sparks"), dr];
  };
  const [p1, d1] = play(true), [p2, d2] = play(false);
  ok("82 particles use columns", p1 instanceof S.ColCell && p1.count() > 1000);
  ok("82 particles play the same", S.fmt(p1) === S.fmt(p2) && d1 === d2);
}

// the game: events in, states out; effects queued; rewind, replay, hot-swap
S.setLog(() => {});
const src = fs.readFileSync(__dirname + "/examples/sprout.sp", "utf8");
const fx = [];
const g = L.makeGame(src, { onEffect: e => fx.push(e[0]) });
let maxScore = 0;
for (let f = 0; f < 900; f++) { if (f % 30 === 0) g.down(60 + (f * 7) % 240, 300); if (f % 30 === 15) g.up(); g.tick(1 / 60); maxScore = Math.max(maxScore, g.state.field("score")); }
ok("game scores", maxScore > 0);
ok("game effects are queued and carried out", fx.includes("beep"));
ok("game draws", g.draw().length > 5);
ok("replay is exact", S.fmt(g.history[100].state) === S.fmt(g.history[100].state) && S.fmt(g.history[201].state) === S.fmt(g.replayFrom(200, 1 / 60)));
const sc = g.state.field("score");
g.swap(src.replace("beep [880, 0.06]", "beep [660, 0.06]"));
ok("hot-swap keeps live state", g.state.field("score") === sc);
g.swap(src.replace("height : 40", "height : 99"));
ok("hot-swap takes a changed start value", g.state.field("height") === 99);

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
