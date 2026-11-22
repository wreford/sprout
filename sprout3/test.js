// Sprout 3 tests: node test.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("FAIL", name); } };
const logs = []; S.setLog(m => logs.push(m));
const out = []; S.setOut(s => out.push(s));
const run = src => { out.length = 0; S.load(src).run(S.BANG); return out.slice(); };
const val = src => S.format(S.load("result : " + src).field("result"));

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
ok("51 lazy once", S.format(S.load("r : [rand [0, 1000]]\nresult : (r @ 1) = (r @ 1)").field("result")) === "true");
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
{ const sp = S.load("xs : []\nf : [p | p x > 1]\na : xs collect [p | p with [x : p x + 1]]\nb : xs keep [p | p x > 1]\nc : xs keep [p | f p]\nd : xs collect [p | p with [x : rand [0, 1]]]\ne : xs keep [p | p name = \"a\"]").speedNotes;
  const at = l => sp.find(n => n.line === l);
  ok("86 speed notes: a with of number math runs over columns", at(3).fast && at(3).word === "collect" && at(4).fast && at(4).word === "keep");
  ok("86 speed notes: say why a body runs item by item", at(5).fast && /random/.test(at(6).why) && !at(6).fast, sp.map(n => n.line + " " + n.why)); }
// loop fusion (decision 95): a run of collect, keep, fold and length is one loop, with the same answer as the steps one by one
{ const both = src => { const a = S.format(S.load(src).field("result")); S.fastPaths(false); const b = S.format(S.load(src).field("result")); S.fastPaths(true); return [a, b]; };
  const fused = {
    "collect, keep and fold over range": "result : range 1000 collect [n | n * n] keep [n | n % 3 = 0] fold [0, [t n | t + (n / 7)]]",
    "keep then length counts without a list": "xs : range 500 collect [n | noise [n, 1]]\nresult : xs keep [u | u < 0.25] length",
    "a list of numbers in, a list out": "result : [3, 1, 4, 1, 5, 9, 2, 6] collect [n | n * 2 - 1] keep [n | n > 4]",
    "records in columns: keep, collect, fold": "rs : range 200 collect [n | [zone : n % 4, hours : n / 3]]\nresult : rs keep [r | r zone = 3] collect [r | r hours] fold [0, [t h | t + h]]",
    "records with fields laid over": "rs : range 100 collect [n | [x : n, y : n * 2]]\nresult : rs keep [r | r x > 50] collect [r | r with [y : r y + 1, z : r x * (r y)]]",
    "a record made each step": "result : range 60 collect [n | [a : n, b : n sqrt]] keep [r | r b > 3]",
    "a cell from outside, inlined": "big : [n | n > 10]\nsq : [n | n * n]\nresult : range 40 keep big collect sq",
    "an outside number read once": "k : 7\nresult : range 300 keep [n | n % k = 0] collect [n | n / k] fold [0, [t n | t max n]]",
    "true or false out": "result : range 50 collect [n | n % 2 = 0] keep [b | b or true]",
    "a test that changes per item": "result : range 80 collect [n | n > 40 [n * 2] else [0 - n]] keep [n | n != 0]",
  };
  for (const k in fused) { const [a, b] = both(fused[k]); ok("95 fusion: " + k, a === b && a !== "false", [a.slice(0, 60), b.slice(0, 60)]); }
  // anything the loop can't do runs as written: words in the list, a position outside a list
  for (const src of ['result : ["a", "b", "c"] collect [w | w .. "!"] keep [w | w != "b!"]', "w : [3, 1, 4]\nresult : range 9 collect [n | (w @ n) else [0]] keep [n | n > 0]", "result : [] collect [n | n + 1] fold [5, [t n | t + n]]"]) {
    const [a, b] = both(src); ok("95 fusion: falls back the same: " + src.slice(0, 40), a === b, [a, b]); }
  // library cells (decision 97) inline: clamp, toward and dist are prelude cells now, and cond picks its answer per item
  for (const src of ["result : range 200 collect [n | clamp [n * 3, 50, 400] + (toward [0, 10, n / 200]) + (dist [0, 0, n, 7])]",
      "result : range 120 collect [n | cond [n < 30, n * 2, n < 60, 0 - n, any, n / 4]] fold [0, [t x | t + x]]",
      "result : range 90 collect [n | match [n % 3, [0, 10, 1, 20, any, 30]]] keep [x | x > 15] length"]) {
    const [a, b] = both(src); ok("97 fusion: library cells inline: " + src.slice(9, 40), a === b && a !== "false" && S.load(src).speedNotes.every(x => x.fast), [a.slice(0, 50), b.slice(0, 50)]); }
  // each with a host word ends a fused run: the same calls, in the same order
  { const calls = [], host = { dot: new S.Native("dot", a => { calls.push(S.format(a)); return false; }, true) };
    host.dot.direct = (x, y, c) => { calls.push("[" + S.format(x) + ", " + S.format(y) + ", " + c + "]"); return false; };
    const src = "rs : range 50 collect [n | [x : n, y : n * 2]]\nresult : rs keep [r | r x % 3 = 0] each [r | r x > 20 [dot [r x, r y, \"red\"]] else [dot [r y, r x, \"blue\"]]]";
    const run = () => { calls.length = 0; S.load(src, { host }).field("result"); return calls.slice(); };
    logs.length = 0;
    const a = run(), notes = S.load(src, { host }).speedNotes; S.fastPaths(false); const b = run(); S.fastPaths(true);
    // dot gives false, so past x 20 the else draws too (decision 74), fused or not; and the lint says so
    ok("95 fusion: each with host words, the same calls in the same order", a.length === 26 && JSON.stringify(a) === JSON.stringify(b) && notes.some(x => x.word === "keep each" && x.fast), [a.slice(0, 3), b.slice(0, 3), notes]);
    ok("74: a branch that ends with a host word before else is named", logs.some(l => /ends with dot, which gives false/.test(l)), logs); logs.length = 0; }
  ok("97 the moved built-ins: rand, clamp, toward and dist give what they gave", (() => {
    const c = S.load("a : clamp [5, 0, 3]\nb : clamp [-1, 0, 3]\nc : toward [10, 20, 0.25]\nd : dist [0, 0, 3, 4]\ne : rand [10, 20]");
    const e = c.field("e"); return c.field("a") === 3 && c.field("b") === 0 && c.field("c") === 12.5 && c.field("d") === 5 && e >= 10 && e < 20; })());
  const notes = S.load("result : range 9 collect [n | n * 2] keep [n | n > 4] fold [0, [t n | t + n]]").speedNotes;
  ok("95 fusion: one speed note for the run", notes.length === 1 && notes[0].word === "collect keep fold" && notes[0].fast, notes); }
{ const n1 = +val("noise [3, 7]"), n2 = +val("noise [3, 7]"), n3 = +val("noise [3, 8]");
  ok("87 noise: the same inputs give the same number, from 0 up to 1", n1 === n2 && n1 !== n3 && n1 >= 0 && n1 < 1);
  const xs = Array.from({ length: 2000 }, (_, k) => +val("noise [" + k + ", 1]")), mean = xs.reduce((a, b) => a + b) / xs.length;
  ok("87 noise: spread evenly", mean > 0.47 && mean < 0.53 && Math.min(...xs) < 0.01 && Math.max(...xs) > 0.99, mean);
  const prog = "ps : range 50 collect [n | [x : n, y : 0]]\nresult : ps collect [p | p with [y : noise [p x, 9]]]";
  const a = S.load(prog).field("result"); S.fastPaths(false); const b = S.load(prog).field("result"); S.fastPaths(true);
  ok("87 noise runs inside a column loop, with the same results", a instanceof S.ColumnCell && S.format(a) === S.format(b) && S.load(prog).speedNotes.find(n => n.line === 2).fast); }
{ const both = src => { const a = S.format(S.load(src).field("result")); S.fastPaths(false); const b = S.format(S.load(src).field("result")); S.fastPaths(true); return [a, b]; };
  ok("fold loop: a sum over range", val("range 1000 fold [0, [t n | t + n]]") === "500500");
  ok("fold loop: over a list of numbers, with an outside name", S.format(S.load("k : 3\nresult : [1, 2, 3, 4] fold [0, [t n | t + (n * k)]]").field("result")) === "30");
  for (const src of ["result : range 500 fold [0, [t n | t + (n * n) - (t / 7)]]", "result : [1.5, 2, -3, 4] fold [1, [t n | t * n + 1]]", "result : range 40 fold [0, [t n | n > 20 [t + n] else [t - 1]]]", "result : range 64 fold [0, [t n | t + (noise [n, 2])]]"]) {
    const [a, b] = both(src); ok("fold loop: same answer with and without it: " + src, a === b && a !== "false"); }
  ok("fold loop: anything else still works the ordinary way", val('["a", "b"] fold ["", [t n | t .. n]]') === "ab" && val("[1, 2] fold [[], [t n | t .. [n]]]") === "[1, 2]");
  const sp = S.load("a : range 9 fold [0, [t n | t + n]]\nb : range 9 fold [0, [t n | t .. n]]").speedNotes;
  ok("fold loop: speed notes say which folds run as a tight loop", sp.find(n => n.line === 1).fast && !sp.find(n => n.line === 2).fast && sp.every(n => n.word === "fold"), sp); }
// decision 74, decided: else keeps its one rule; a branch whose answer is a test is named, and cond keeps a false answer
{ logs.length = 0;
  const c = S.load("x : 3\na : x > 0 [x < 2] else [x = 3]\nb : x > 0 [x < 2] else [false]\nc : cond [x > 0, x < 2, any, x = 3]");
  ok("74: a branch that gives true or false before else is named", logs.length === 1 && /line 2: this branch gives true or false/.test(logs[0]) && /cond/.test(logs[0]), logs);
  ok("74: else still runs when the branch gives false, and cond keeps the false", c.field("a") === true && c.field("b") === false && c.field("c") === false);
  logs.length = 0; }
// spork (decisions 47 and 91): the same answer as collect, whichever way it runs
{ const W = S.sporkWays({}).wasm;
  const three = (src, xs, f) => {
    f = f || "f";
    const c = S.load(src + "\nA : [k | k spork " + f + "]\nB : [k | k collect " + f + "]"), a = c.field("A"), b = c.field("B");
    const L = xs || S.load("r : range 300").field("r");
    S.sporkWays({ wasm: W }); const simd = a.run(L), how1 = S.sporkInfo && S.sporkInfo.how; S.sporkWays({ info: null });
    S.sporkWays({ wasm: null }); const js = a.run(L), how2 = S.sporkInfo && S.sporkInfo.how; S.sporkWays({ wasm: W, info: null });
    const plain = b.run(L), want = S.format(plain);
    return { same: S.format(simd) === want && S.format(js) === want && S.equal(simd, plain), how: [how1, how2], speed: c.speedNotes };
  };
  const kernels = {
    "number math and noise": "f : [n | noise [n, 7] * 10 floor + (n / 3 round) - (n sqrt)]",
    "a test that changes from run to run": "f : [n | n > 150 [n * 2] else [0 - n]]",
    "else catching a false branch": "f : [n | n > 5 [n < 80] else [n = 2]]",
    "a record each run": "f : [n | [a : n * 2, b : noise [n, 1]]]",
    "calls, lists and fold worked out ahead": "w : [3, 1, 4, 1, 5]\ng : [a b | a * 10 + b]\nf : [n | w fold [0, [t x | t + (g [x, n])]]]",
    "a position that changes from run to run": "w : [3, 1, 4, 1, 5]\nf : [n | w @ (n % 5 + 1)]",
    "text and records only used ahead": "rs : [[id : \"a\", v : 3], [id : \"b\", v : 5]]\nf : [n | rs keep [r | r id = \"b\"] first v * n]",
    "clamp, toward, min and max": "f : [n | clamp [n, 50, 200] + (toward [0, 10, n / 300]) min 180 max 60]",
  };
  for (const k in kernels) { const r = three(kernels[k]); ok("spork: " + k, r.same && r.how[0] === (/%/.test(kernels[k]) ? "js" : "simd") && r.how[1] === "js", r.how); }
  // the ACE schedule's own run (strings, a walk over requires, triangle draws, a shared risk) is worked out into one kernel
  const ace = fs.readFileSync(__dirname + "/examples/ace-schedule.sp", "utf8").replace(/\nfinishes :[^\n]*/, "\nfinishes : [3]");
  const r = three(ace, S.load("r : range 3000").field("r"), "one-run");
  ok("spork: ace-schedule's Monte Carlo run, same numbers as collect", r.same && r.how[0] === "simd", r.how);
  // a position outside the list, or anything spork can't work out ahead, runs the ordinary way
  ok("spork: a position outside the list falls back", (() => { const r = three("w : [3, 1, 4]\nf : [n | (w @ n) else [0]]"); return r.same && r.how[0] === "collect" && r.how[1] === "collect"; })());
  ok("collect [r | r f] over columns gives that column", (() => { const c = S.load("rs : range 100 collect [n | [a : n, b : n * 2]]\nA : rs collect [r | r b]\nB : rs collect [r | r b + 0]"); return S.format(c.field("A")) === S.format(c.field("B")) && c.field("A") instanceof S.NumberList; })());
  const rnd = S.load("f : [n | random + n]\nA : range 5 spork f").speedNotes.find(x => x.word === "spork");
  ok("spork: speed notes say why a cell can't be worked out ahead", rnd && !rnd.fast && /random/.test(rnd.why), rnd);
  ok("spork: a cell written in place", S.format(S.load("A : range 40 spork [n | n * n]").field("A")) === S.format(S.load("A : range 40 collect [n | n * n]").field("A")));
  ok("spork: a list of numbers in, and noise bit for bit", (() => { const L = S.load("r : range 64 collect [n | n * 1.37 - 40]").field("r"); return three("f : [n | noise [n, 0 - n]]", L).same; })());
  const sorted = S.load("a : [3, 1, 2] sort\nb : [\"pear\", \"fig\"] sort\nc : range 2000 spork [n | noise [n, 1]] sort");
  ok("sort: numbers and words", S.format(sorted.field("a")) === "[1, 2, 3]" && S.format(sorted.field("b")) === "[fig, pear]");
  const c3 = sorted.field("c"); let up = true; for (let i = 2; i <= 2000; i++) if (c3.part(i) < c3.part(i - 1)) up = false;
  ok("sort: a spork's numbers, least to most", up && c3.count() === 2000 && c3 instanceof S.NumberList); }
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
ok("36/37 operator on a cell", S.format(S.load("v : [+ : [right | left with [n : left n + (right n)]]]\na : v with [n : 2]\nb : v with [n : 5]\nresult : a + b n").field("result")) === "7");
ok("38/52 method runs on read", S.format(S.load("r : [w : 3, h : 4, area : [left w * (left h)]]\nresult : r area").field("result")) === "12");
ok("52 a value cell comes back", S.format(S.load("g : [ball : [x : 1]]\nresult : g ball x").field("result")) === "1");
ok("41/42 .. joins", val('"a" .. "b" .. 3') === "ab3" && val("[1] .. [2, 3]") === "[1, 2, 3]");
ok("45 with merges fields", val("[x : 1, y : 2] with [y : 9]") === "[x : 1, y : 9]");
ok("46 else", val("false else 7") === "7" && val("4 else 7") === "4");
ok("62 a boolean runs a cell", val("1 < 2 [\"a\"] else [\"b\"]") === "a" && val("1 > 2 [\"a\"] else [\"b\"]") === "b");
ok("62 catch: then gives false", val("true [false] else [\"b\"]") === "b");
ok("35 match", val('match [2, [1, "one", 2, "two", any, "many"]]') === "two" && val('match [9, [1, "one", any, "many"]]') === "many");
ok("55 collect keep fold", val("range 5 collect [n | n * n] keep [n | n > 4] fold [0, [t n | t + n]]") === "50");
ok("29 times", run("3 times [_ print]").join() === "1,2,3");
ok("59 indent is a cell", S.format(S.load("box :\n  w : 3\n  h : 4\nresult : box h").field("result")) === "4");
ok("61 named inputs with an indented body", S.format(S.load("f : [n |\n  m : n * 2\n  m + 1\n]\nresult : f 5").field("result")) === "11");
ok("25 self-recursion and tail calls", S.format(S.load("count : [n acc | n = 0 [acc] else [count [n - 1, acc + n]]]\nresult : count [100000, 0]").field("result")) === "5000050000");
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
  S.globals.db = db;
  ok("78 sqlite reads give cells", S.format(S.load('result : db query ["select hours from atoms where zone = ?", [3]] collect [r | r hours] fold [0, [t h | t + h]]').field("result")) === "12");
  const c = S.load('w : [db run ["insert into atoms values (?, ?, ?)", [4, 9, 1]]]');
  S.queueEffects(); c.field("w").run(S.BANG);
  ok("78 writes are queued", db.raw.prepare("select count(*) n from atoms").get().n === 3);
  S.runEffects();
  ok("78 and carried out after", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  S.queueEffects(); c.field("w").run(S.BANG); S.dropEffects();
  ok("78 and dropped on replay", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  delete S.globals.db;
}

// 82: columns. Lists of number records are stored as columns, with exactly the same results as without them.
{
  const both = src => { const a = S.load(src).field("result"); S.fastPaths(false); const b = S.load(src).field("result"); S.fastPaths(true); return [a, b]; };
  const [a, b] = both(`step : [rs | rs collect [r | r with [y : r y + 1, z : r x * 2]] keep [r | (r y % 3) != 0 or (r x > 50)]]
go : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]
result : go [range 100 collect [n | [x : n, y : 0]], 5]`);
  ok("82 columns are used", a instanceof S.ColumnCell && !(b instanceof S.ColumnCell));
  ok("82 columns give the same list", S.format(a) === S.format(b) && S.equal(a, b) && S.equal(b, a) && a.count() === 50);
  ok("82 a part of a column list is a record", S.format(a.part(2)) === "[x : 52, y : 5, z : 104]" && a.part(0) === false && a.part(51) === false);
  const [c, d] = both(`xs : range 40 collect [n | [x : n, y : n * 2]]
result : xs collect [r | r with [x : r x + 1]] .. [[x : 0, y : 0]] .. (range 3 collect [n | [x : n, y : n]])`);
  ok("82 .. keeps columns", c instanceof S.ColumnCell && c.count() === 44 && S.format(c) === S.format(d));
  const [e, f] = both(`xs : range 40 collect [n | [x : n, name : "a"]]
result : xs collect [r | r with [x : r x + 1]]`);
  ok("82 a record with words stays as records", !(e instanceof S.ColumnCell) && S.format(e) === S.format(f));
  const [g2, h] = both(`xs : range 40 collect [n | [x : n]]
result : xs collect [r | r with [x : r nope + 1]]`);
  ok("82 a missing field falls back to the ordinary way", !(g2 instanceof S.ColumnCell) && S.format(g2) === S.format(h));
  // the particle fountain plays the same with and without columns
  const psrc = fs.readFileSync(__dirname + "/examples/particles.sp", "utf8");
  const play = on => {
    S.fastPaths(on); const mr = Math.random; let seed = 7; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pg = L.makeGame(psrc); for (let t = 0; t < 150; t++) pg.tick(1 / 60);
    const dr = JSON.stringify(pg.draw()); Math.random = mr; S.fastPaths(true);
    return [pg.state.field("sparks"), dr];
  };
  const [p1, d1] = play(true), [p2, d2] = play(false);
  ok("82 particles use columns", p1 instanceof S.ColumnCell && p1.count() > 1000);
  ok("82 particles play the same", S.format(p1) === S.format(p2) && d1 === d2);
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
ok("replay is exact", S.format(g.history[100].state) === S.format(g.history[100].state) && S.format(g.history[201].state) === S.format(g.replayFrom(200, 1 / 60)));
const sc = g.state.field("score");
g.swap(src.replace("beep [880, 0.06]", "beep [660, 0.06]"));
ok("hot-swap keeps live state", g.state.field("score") === sc);
g.swap(src.replace("height : 40", "height : 99"));
ok("hot-swap takes a changed start value", g.state.field("height") === 99);

// ---------------- the standard words (decision 99): Clojure's sequences, Lua's strings
{
  const W = [
    ["[3, 1, 4, 1] reverse", "[1, 4, 1, 3]"], ["[3, 1, 4, 1] distinct", "[3, 1, 4]"], ["[3, 1, 4] sum", "8"], ["[3, 1, 4] largest", "4"],
    ["[3, 1, 4, 1] frequencies", "[3 : 1, 1 : 2, 4 : 1]"], ["[1, 2, 3, 4] group-by [n | n even]", "[false : [1, 3], true : [2, 4]]"],
    ["[1, 2, 3, 4, 5] partition 2", "[[1, 2], [3, 4]]"], ["[1, 2, 3, 4, 5] chunks 2", "[[1, 2], [3, 4], [5]]"],
    ["[3, 1, 2] sort-by [n | 0 - n]", "[3, 2, 1]"], ["[1, 2] zip [\"a\", \"b\", \"c\"]", "[[1, a], [2, b]]"],
    ["[1, 2, 3] scan [0, [t n | t + n]]", "[0, 1, 3, 6]"], ["[1, 5, 9] find [n | n > 4]", "5"], ["[1, 5, 9] count [n | n > 4]", "2"],
    ["[[1, 2], [3, [4]]] flatten", "[1, 2, 3, 4]"], ["1 to 4", "[1, 2, 3, 4]"],
    ["iterate [1, [n | n * 2]] take 5", "[1, 2, 4, 8, 16]"], ["iterate [1, [n | n + 1]] keep [n | n % 3 = 0] take 3", "[3, 6, 9]"],
    ["cycle [\"a\", \"b\"] take 3", "[a, b, a]"], ["iterate [1, [n | n + 1]]", "[1, 2, 3, ...]"],
    ["[a : [b : 1]] update-in [[\"a\", \"b\"], [n | n + 1]]", "[a : [b : 2]]"], ["[a : [b : 1]] get-in [\"a\", \"b\"]", "1"],
    ["[a : 1, b : 2] without \"a\"", "[b : 2]"], ["[a : 1, b : 2] keys", "[a, b]"],
    ["\"a,b\" split \",\"", "[a, b]"], ["\" x \" trim", "x"], ["\"hello\" slice [2, -2]", "ell"], ["\"ab\" repeat 2", "abab"],
    ["\"42\" number + 1", "43"], ["\"x\" number", "false"], ["[1, 2] join \"-\"", "1-2"], ["\"7\" pad-left [3, \"0\"]", "007"], ["5 pad-left [2, \"0\"]", "05"], ["12 pad-right [4, \".\"]", "12.."], ["75.4 clock", "1:15"], ["3600 clock", "60:00"],
    ["3 kind", "number"], ["[a : 1] kind", "record"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("99 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
  S.setLog(m => logs.push(m)); logs.length = 0; val("iterate [1, [n | n + 1]] keep [n | n % 7 = 0] collect [n | n * n] take 2");
  ok("99 an endless list goes through a fusable chain quietly", logs.length === 0);
  logs.length = 0; val("iterate [1, [n | n + 1]] length");
  ok("99 an endless list says it has no length", logs.some(m => /endless/.test(m)));
}

// ---------------- Rebol's literals (decision 100)
{
  const W = [
    ["2026-11-20 + 30", "2026-12-20"], ["2026-11-20 weekday", "Friday"], ["2026-12-25 - 2026-11-20", "35"], ["2026-01-31 add-months 1", "2026-02-28"],
    ["2026-11-20 add-workdays 5", "2026-11-27"], ["2026-11-20 < 2026-12-01", "true"], ["2026-11-20 = 2026-11-20", "true"],
    ["9:30 + 0:45", "10:15"], ["(17:00 - 9:30) in-hours", "7.5"], ["$19.99 * 3 + $5.00", "$64.97"], ["$100.00 split 3", "[$33.34, $33.33, $33.33]"],
    ["$0.10 + $0.20 = $0.30", "true"], ["$1234567.5", "$1,234,567.50"], ["640x480 / 2", "320x240"], ["640x480 x", "640"],
    ["https://taskiap.com/sprout3/ host", "taskiap.com"], ["https://taskiap.com/sprout3/ / \"play.html\"", "https://taskiap.com/sprout3/play.html"],
    ["ada@example.com user", "ada"], ["#ff8800 mix [#0000ff, 0.5]", "#804480"], ["#f80", "#ff8800"], ["'move", "move"], ["'move = 'move", "true"],
    ["'move = 'stop", "false"], ["'move kind", "word"], ["20% * 50", "10"], ["2026 - 11", "2015"], ["[don't : 1] don't", "1"],
    ["match [2026-11-20, [2026-11-20, \"today\", any, \"other\"]]", "today"], ["date [2026, 11, 20] = 2026-11-20", "true"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("100 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
  const L3 = require("./live3.js"), g = L3.makeGame("start :\n  x : 1\nupdate : [game | game]\ndraw : [game | circle [1, 2, 3, #ff8800]]", {}); g.tick(1 / 60);
  ok("100 a colour draws as its text", JSON.stringify(g.draw()) === '[["circle",[1,2,3,"#ff8800"]]]' && String(g.draw()[0][1][3]) === "#ff8800");
}

// ---------------- destructuring (decision 101)
{
  const W = [
    ["[[x, y] | x + y] [3, 4]", "7"], ["[[x, y] | x + y] 3x4", "7"], ["[[name, age : 0] | \"[name] [age]\"] [name : \"Ada\", age : 36]", "Ada 36"],
    ["[[name, age : 0] | \"[name] [age]\"] [\"Alan\"]", "Alan 0"], ["([first, ..others] : [1, 2, 3], others)", "[2, 3]"],
    ["[[a, [b, c]] : [1, [2, 3]], a + b + c] @ 1", "6"], ["[[1, 2], [3, 4]] collect [[x, y] | x * y]", "[2, 12]"],
    ["[[1, 2], [3, 4]] fold [0, [total [x, y] | total + x + y]]", "10"], ["[[x1, y1] [x2, y2] | x2 - x1 + (y2 - y1)] [[0, 0], [3, 4]]", "7"],
    ["[[x, y] : [10, 20], sum : x + y]", "[sum : 30]"], ["range 40 collect [n | [n, n * 2]] collect [[a, b] | a + b] sum", "2460"],
    ["([y, m, d] : 2026-11-20, d)", "20"], ["[[w, h] : 640x480, w * h] @ 1", "307200"],
    ["[[x, y] | x] = [[x, y] | x]", "true"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("101 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
}

// ---------------- code as data (decision 102)
{
  const W = [
    ["quote [move 10, turn 90]", "[move 10, turn 90]"], ["quote [move 10, turn 90] length", "2"], ["quote [move 10] @ 1 kind", "phrase"],
    ["quote [move 10] @ 1 @ 1 = 'move", "true"], ["[n | n * 2] code", "[n | n * 2]"], ["[n | n * 2] code inputs", "[n]"],
    ["eval quote [1 + 2, 3 * 4]", "12"], ["eval quote [x : 5, x * x]", "25"], ["(eval quote [n | n * n]) 7", "49"],
    ["eval-with [[double : [n | n * 2]], phrase ['double, 21]]", "42"], ["quote [a, b] = quote [a, b]", "true"], ["quote [a, b] = quote [a, c]", "false"],
    ["quote [x : \"hi [name]\", 2026-11-20 + 1, $1234.50, (1 + 2)]", "[x : \"hi [name]\", 2026-11-20 + 1, $1234.50, (1 + 2)]"],
    ["quote [move 10, turn 90, move 5] fold [[x : 0, h : 0], [s [c, n] | match [c, ['move, s with [x : s x + n], 'turn, s with [h : s h + n], any, s]]]]", "[x : 15, h : 90]"],
    ["[a : 1, b : \"two\"] source", "[a : 1, b : \"two\"]"], ["eval ([a : 1, b : \"two\"] source)", "[a : 1, b : two]"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("102 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
  ok("102 a program can still name something quote", val("([quote : [x | x + 1]], 1) @ 1") !== "" && S.format(S.load("quote : [x | x + 1]\nresult : quote 4").field("result")) === "5");
}

// ---------------- parse (decision 103)
{
  const W = [
    ["\"2026-11-20\" parse [repeat [4, digit], \"-\", repeat [2, digit], \"-\", repeat [2, digit]]", "true"],
    ["\"2026-11-20\" parse [repeat [4, digit] as \"year\", \"-\", repeat [2, digit] as \"month\", \"-\", repeat [2, digit] as \"day\"]", "[year : 2026, month : 11, day : 20]"],
    ["\"2026-11-2x\" parse [repeat [4, digit], \"-\", repeat [2, digit], \"-\", repeat [2, digit]]", "false"],
    ["\"call 555-1234 or 555-9876\" find-all [repeat [3, digit], \"-\", repeat [4, digit]]", "[555-1234, 555-9876]"],
    ["\"hello   big  world\" replace-all [some space, \" \"]", "hello big world"],
    ["\"a1b22\" find-all (some digit as [\"n\", [t | t number]])", "[[n : 1], [n : 22]]"],
    ["\"cat, dog\" parse [some [some letter all-as \"pet\", maybe \", \"]]", "[pet : [cat, dog]]"],
    ["\"ab12cd\" parse [maybe-some one-of \"abcd\", some digit as \"n\", some letter]", "[n : 12]"],
    ["quote [move 10, turn 90, stop] parse some one-of [into ['move, a-number], into ['turn, a-number], 'stop]", "true"],
    ["quote [move 10, jump 3] parse some one-of [into ['move, a-number], into ['turn, a-number], 'stop]", "false"],
    ["\"<b>x</b>\" replace-all [[\"<\", maybe \"/\", some letter, \">\"], \"\"]", "x"],
    ["\"x9\" parse [letter, [c | c = \"9\"]]", "true"], ["[1, 2, 3] parse [some a-number]", "true"], ["\"abc\" parse [to \"c\", \"c\"]", "true"],
    ["\"a-b\" parse [thru \"-\" as \"head\", \"b\"]", "[head : a-]"], ["\"ab\" parse [not-ahead \"b\", \"ab\"]", "true"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("103 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
  const grammar = "expr : [\n  factor : one-of [some digit, [\"(\", expr, \")\"]]\n  term : [factor, maybe-some [one-of \"*/\", factor]]\n  term, maybe-some [one-of \"+-\", term]\n]\nresult : [\"2*(3+4)\", \"2*(3+4\", \"1+2*3-4/5\"] collect [t | t parse expr]";
  ok("103 a rule can hold itself: a grammar for arithmetic", S.format(S.load(grammar).field("result")) === "[true, false, true]");
  ok("103 a list that names itself is lazy", val("([digits : [digit, maybe digits]], \"123\" parse digits) @ 1") !== "" && S.format(S.load("digits : [digit, maybe digits]\nresult : \"123\" parse digits").field("result")) === "true");
}

// ---------------- scripts (decision 104)
{
  const prog = (src, field) => S.format(S.load(src + "\nresult : " + field).field("result"));
  const counter = "counter : script [|\n  yield 1\n  got : yield 2\n  \"sent [got]\"\n]\na : counter next\nb : a next\nc : b resume \"hi\"";
  ok("104 a script yields in turn", prog(counter, "[a value, b value, c value, c done]") === "[1, 2, sent hi, true]");
  ok("104 resuming gives a new script; the old one is unchanged", prog(counter, "[a value, a steps, b steps]") === "[1, 1, 2]");
  ok("104 a generator from an endless loop", val("script [| go : [n | yield (n * n), go (n + 1)], go 1] take 5") === "[1, 4, 9, 16, 25]");
  ok("104 a script's input is the first value sent", prog("total : script [start | go : [sum | go (sum + (yield sum))], go start]", "total resume 5 resume 10 resume 7 value") === "22");
  ok("104 the same script resumed the same way gives the same answer", prog("t : script [n | yield (n * 2), yield (n * 3)] resume 4", "(t next value) = (t next value)") === "true");
  ok("104 yields lists them all", val("script [| yield 1, yield 2, \"end\"] yields") === "[1, 2]");
  out.length = 0; S.load("s : script [| \"one\" print, yield 1, \"two\" print, yield 2]\nr : s next next next").run(S.BANG);
  ok("104 a step's effects happen once, however often it is run again", JSON.stringify(out) === '["one","two"]');
  out.length = 0; S.load("d : script [| a : yield (rand [0, 1]), yield (rand [0, 1])]\nx : d next\ny : x next\n(x value) = (y next value) print\n(y value) = (y value) print").run(S.BANG);
  ok("104 random gives a step the same numbers when it is run again", out[1] === "true");
  const L3 = require("./live3.js");
  const g = L3.makeGame("scene : script [|\n  yield \"hello\"\n  wait 1\n  yield \"after\"\n  \"after\"\n]\nstart :\n  story : scene next\nupdate : [game | game with [story : game story resume (game dt)]]\ndraw : [game | text [game story value str, 1, 1, 9, \"#fff\"]]", {});
  const seen = []; for (let i = 0; i < 90; i++) { g.tick(1 / 60); const v = S.format(g.state.field("story").value); if (seen[seen.length - 1] !== v) seen.push(v); }
  ok("104 wait in a game script waits about a second", JSON.stringify(seen) === '["waiting","after"]' && S.format(g.history[30].state.field("story").value) === "waiting");
  ok("104 a game with a script replays exactly", S.format(g.history[70].state) === S.format(g.replayFrom(69, 1 / 60)));
  S.setLog(m => logs.push(m)); logs.length = 0; S.load("x : [| yield 1, yield 2]");
  ok("104 [| ...] is code, run later", !logs.some(m => /yield/.test(m)));
}

// ---------------- fixes after decision 104
{
  S.setLog(m => logs.push(m)); logs.length = 0;
  ok("money divided by 0 is logged, not $Infinity.NaN", val("$1.00 / 0") === "false" && logs.some(m => /shared by 0/.test(m)));
  logs.length = 0;
  ok("a date compared with money says so", val("2026-11-20 < $5.00") === "false" && logs.some(m => /a date can't be compared with \$5\.00/.test(m)));
  ok("the editor's literal matcher is the lexer's", S.lexLiteral("9:30 x", 0).length === 4 && S.lexLiteral("don't", 0) === null);
}

// ---------------- the standard library (decisions 105, 111 and 112)
{
  const libDir = __dirname + "/lib", files = fs.readdirSync(libDir).filter(f => f.endsWith(".sp")).sort();
  ok("105 stdlib.js holds exactly what lib/ holds (run node make-stdlib.js)", JSON.stringify(Object.keys(S.stdlib.SOURCES).sort()) === JSON.stringify(files.map(f => f.slice(0, -3))) && files.every(f => S.stdlib.SOURCES[f.slice(0, -3)] === fs.readFileSync(libDir + "/" + f, "utf8")));
  S.setLog(m => logs.push(m));
  // every example states its answer (decision 112): each one is run, quietly, and must give what it says
  let examples = 0, answers = 0, quiet = true, right = true;
  for (const name of S.stdlib.names) for (const m of S.stdlib.SOURCES[name].matchAll(/^-- e\.g\. (.*)$/gm)) {
    const [src, stated] = m[1].split(" → ");
    logs.length = 0; const got = val(src).replace(/\n/g, "\\n"); examples++;
    if (logs.length) { quiet = false; console.log("   example logs:", src, logs); }
    if (stated === undefined) { right = false; console.log("   example states no answer:", src); }
    else { answers++; if (got !== stated.trim()) { right = false; console.log("   example", src, "gives", got, "not", stated.trim()); } }
  }
  ok("105 every example in lib/ runs without a message (" + examples + " of them)", quiet && examples > 150);
  ok("112 every example in lib/ states its answer, and gives it (" + answers + " of them)", right && answers === examples);
  // one way of working (decision 112): the time or the seed comes last, and chance comes only from a seed
  const late = ["dt", "now", "elapsed", "today", "seed"], misplaced = [];
  for (const f of files) for (const m of fs.readFileSync(libDir + "/" + f, "utf8").matchAll(/^([a-z][\w-]*) : \[([^|\[\]]*)\|/gm)) {
    const inputs = m[2].trim().split(/\s+/), first = inputs.findIndex(i => late.includes(i));
    if ((first >= 0 && !inputs.slice(first).every(i => late.includes(i))) || (inputs.includes("seed") && inputs[inputs.length - 1] !== "seed")) misplaced.push(f.slice(0, -3) + " " + m[1]);
  }
  ok("112 a word's time or seed is its last input" + (misplaced.length ? " (not in " + misplaced.join(", ") + ")" : ""), misplaced.length === 0);
  ok("112 nothing in lib/ calls rand: chance comes from seeded", files.every(f => !/\brand\b/.test(fs.readFileSync(libDir + "/" + f, "utf8").replace(/^--.*$/gm, ""))));
  // more than the examples show: edges, ties, empty cases and points where numbers go
  const W = [
    ["motion tween [0, 300, 0, 1, ease out-cubic, 0.5]", "262.5"], ["motion progress [2, 3]", "1"], ["motion progress [2, -1]", "0"],
    ["vec toward [0x0, 3x0, 4]", "3x0"], ["grid at [[[1, 2], [3, 4]], 3x1]", "false"], ["grid path [[[0, 1], [1, 0]], 1x1, 2x2, [v | v = 0]]", "false"],
    ["grid slide [2, 2, 2, 2]", "[row : [4, 4, false, false], points : 8]"], ["grid sees [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1x1, 3x1, 1]", "true"],
    ["seeded whole [1, 6, 42] = (seeded whole [1, 6, 42])", "true"], ["seeded shuffle [[1, 2, 3, 4, 5], 7] sort", "[1, 2, 3, 4, 5]"],
    ["format commas -1234567", "-1,234,567"], ["format ordinal 13", "13th"], ["format clock 65", "1:05"], ["format short 950", "950"], ["format short 3400000000", "3.4B"],
    ["shape holds [shape box [0x0, 4x2], 5x1]", "false"], ["palette hsl [0, 1, 0.5]", "#ff0000"], ["csv read \"a,b\\n1,x\" @ 1 b", "x"],
    ["json read (json write [a : [1, 2], b : \"t\"])", "[a : [1, 2], b : t]"],
    ["collide boxes [[at : 0x0, size : 10x10], [at : 10x0, size : 5x5]]", "false"],
    ["cards shuffled 7 length", "52"], ["cards shuffled 7 distinct length", "52"], ["cards deal [cards deck, 2] pile length", "50"],
    ["cards blackjack [[rank : 1, suit : \"♠\"], [rank : 1, suit : \"♥\"], [rank : 10, suit : \"♥\"]]", "12"],
    ["cards poker [[rank : 10, suit : \"♠\"], [rank : 11, suit : \"♠\"], [rank : 12, suit : \"♠\"], [rank : 13, suit : \"♠\"], [rank : 1, suit : \"♠\"]]", "straight flush"],
    ["cards poker [[rank : 2, suit : \"♠\"], [rank : 2, suit : \"♥\"], [rank : 5, suit : \"♦\"], [rank : 5, suit : \"♣\"], [rank : 9, suit : \"♠\"]]", "two pair"],
    ["dice odds [3, 6] length", "16"], ["dice rolls [3, 6, 7] all [f | (f >= 1) and (f <= 6)]", "true"], ["dice roll [\"d20\", 3] between [1, 20]", "true"], ["dice roll [\"3d1-2\", 3]", "1"],
    ["combat level-of 800", "5"], ["combat level-of 799", "4"], ["combat ready [2, 1, 2.5]", "false"],
    ["league rounds [\"A\", \"B\", \"C\"] collect-flat [r | r] length", "3"], ["league rate [1500, 1500, 1, 32]", "[1516, 1484]"],
    ["league table [[\"A\", \"B\", 2, 1], [\"B\", \"C\", 0, 0], [\"C\", \"A\", 1, 3]] collect [t | t team]", "[A, B, C]"],
    ["wordplay marks [\"crane\", \"crane\"]", "GGGGG"], ["wordplay marks [\"LLAMA\", \"HELLO\"]", "YY---"],
    ["wordplay scramble [\"planet\", 7] chars sort = (\"planet\" chars sort)", "true"], ["wordplay solved [\"planet\", \"plan\"]", "false"],
    ["rewards streak-points [100, 30]", "200"], ["rewards day-streak [6, 41, 41]", "6"], ["rewards day-streak [6, 38, 42]", "1"],
    ["rewards earned [[[\"First steps\", [s | s steps >= 1]], [\"Marathon\", [s | s steps >= 1000]]], [steps : 12], [\"First steps\"]]", "[]"],
    ["story open [[start : [text : \"A door.\", choices : [[\"Open it\", \"hall\"], [\"Pick the lock\", \"vault\", \"lockpick\"]]]], \"start\", [\"lockpick\"]] length", "2"],
    ["story flag [[\"has-key\"], \"has-key\"]", "[has-key]"], ["story typed-all [\"Hello\", 10, 0.5]", "true"],
    ["daytime part 3", "night"], ["daytime light 19", "0.5"], ["daytime season [113, 28]", "spring"], ["daytime stage [0, [10, 10, 10], 31]", "4"], ["daytime grown [0, [10, 10, 10], 30]", "true"],
    ["hex around 3x3 all [h | hex steps [3x3, h] = 1]", "true"], ["hex from-screen [hex to-screen [pair [2, -1], 10], 10]", "2x-1"],
    ["particles step [particles burst [0x0, 4, 50, 1, [#ffd166], 0, 7], 200, 0.1, 2] length", "0"],
    ["camera follow [0x0, 5x0, 0.9, 10, 0.1]", "0x0"], ["camera to-world [100x100, camera on-screen [100x100, 7x9, 320x240], 320x240]", "7x9"], ["waves boss [11, 5]", "false"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("112 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
}

// ---------------- cond works out only what it chooses (decision 119)
{
  S.setLog(m => logs.push(m)); logs.length = 0;
  ok("119 cond gives the same answers", val('cond [false, 1, true, 2, any, 3]') === "2" && val('cond [1 > 2, "a", any, "b"]') === "b" && val('cond [false, 1]') === "false" && val('cond [any, "first"]') === "first" && val('cond [false, 1, true]') === "false");
  ok("119 an answer can call its own cell again, as deep as it likes", S.format(S.load("f : [n | cond [n < 1, 0, any, f (n - 1)]]\nresult : f 20000").field("result")) === "0" && logs.length === 0);
  out.length = 0; S.load('r : cond [true, "a" print, any, "b" print]').run(S.BANG);
  ok("119 the effects of the answers not chosen don't happen", JSON.stringify(out) === '["a"]');
  ok("119 a program's own cond is its own", S.format(S.load("cond : [x | \"mine\"]\nresult : cond [1, 2]").field("result")) === "mine");
  ok("119 cond written with a list made elsewhere still works", S.format(S.load("cases : [false, 1, any, 2]\nresult : cond cases").field("result")) === "2");
  logs.length = 0; S.load("draw : [game | game]\nresult : piles draw [[stock : [1, 2], hand : [], discard : []], 1, 7] hand").field("result");
  ok("119 a library's word read in place doesn't clash with the program's own name", !logs.some(m => /both a field/.test(m)), logs);
  logs.length = 0; S.load("size : 3\nbox : [size : 4]\nresult : box size").field("result");
  ok("119 a program's own record still lints when its field is named like a name in scope", logs.some(m => /both a field/.test(m)));
}

// ---------------- pressed and released (decision 121)
{
  const keysOf = names => S.valueCellOf([], new Map(names.map(n => [n, true])));
  const seen = src => { const g = L.makeGame(src); return t => { g.tick(1 / 60, keysOf(t[0]), t[1] ? keysOf(t[1]) : undefined); return g; }; };
  const step = seen("start : [log : []]\nupdate : [g | g with [log : g log .. [[g input pressed keys, g input released keys]]]]");
  let g; for (const t of [[[]], [["one"]], [["one", "left"]], [["left"]], [[]]]) g = step(t);
  ok("121 a key is pressed on the tick it goes down, and released on the tick it comes up", S.format(g.state.field("log")) === "[[[], []], [[one], []], [[left], []], [[], [one]], [[], [left]]]", S.format(g.state.field("log")));
  const two = L.makeGame("start : [log : []]\nupdate : [g | g with [log : g log .. [g input2 pressed keys]]]", { players: 2 });
  two.tick(1 / 60, keysOf([]), keysOf(["two"])); two.tick(1 / 60, keysOf([]), keysOf(["two"]));
  ok("121 the second player's keys are pressed in input2", S.format(two.state.field("log")) === "[[two], []]", S.format(two.state.field("log")));
  ok("121 a game reads a key pressed as it reads one held", S.format(S.load('i : fresh-input with [pressed : [one : true]]\nresult : [i pressed "one", i pressed "two"]').field("result")) === "[true, false]");
}

// ---------------- kits: modules that draw (decision 122)
{
  const kitDir = __dirname + "/kit", files = fs.readdirSync(kitDir).filter(f => f.endsWith(".sp")).sort();
  ok("122 stdlib.js holds exactly what kit/ holds (run node make-stdlib.js)", JSON.stringify(Object.keys(S.stdlib.KITS).sort()) === JSON.stringify(files.map(f => f.slice(0, -3))) && files.every(f => S.stdlib.KITS[f.slice(0, -3)] === fs.readFileSync(kitDir + "/" + f, "utf8")));
  S.setLog(m => logs.push(m));
  let drawn = 0, right = true;
  for (const name of S.stdlib.kitNames) for (const m of S.stdlib.KITS[name].matchAll(/^-- e\.g\. (.*)$/gm)) {
    logs.length = 0; drawn++;
    const [src, draws] = m[1].split(" draws "), [, stated] = m[1].split(" → ");
    const got = draws !== undefined ? L.drawsOf(src) : L.answerOf(m[1].split(" → ")[0]);
    if (logs.length || got !== (draws !== undefined ? draws : stated).trim()) { right = false; console.log("   kit example", src, "gives", got, logs); }
  }
  ok("122 every kit example draws what it says, quietly (" + drawn + " of them)", right && drawn >= 10);
  const g = L.makeGame("start : 0\nupdate : [g | g]\ndraw : [g | ui panel [1x2, 8x8, #ffffff, #000000]]", { W: 64, H: 48 });
  const drew = g.draw().map(([name, args]) => name + " " + S.format(S.valueCellOf(args, new Map()))).join(", ");
  ok("122 a game that names a kit draws with it, on its own screen", drew === "rect [1, 2, 8, 8, #ffffff], rect [3, 4, 4, 4, #000000]", drew);
  const plain = L.makeGame("start : 0\nupdate : [g | g]\ndraw : [g | rect [0, 0, 1, 1, #ffffff]]");
  ok("122 a kit comes along only when a game names it", !("ui" in plain.file.fieldNames()) && L.drawsOf("ui banner [\"A\", 9, 8, #ffffff]", { W: 100 }) === "text [A, 51, 10, 8, #000000], text [A, 50, 9, 8, #ffffff]");
  logs.length = 0; L.makeGame("ui : [banner : [a | \"mine\"]]\nstart : 0\nupdate : [g | g]\nresult : ui banner 1");
  ok("122 a game's own name wins over a kit's", logs.length === 0, logs);
}

// ---------------- wrapped libraries (decision 106)
{
  S.setLog(m => logs.push(m));
  const fake = new Proxy(function () {}, { get: () => () => {}, apply: () => ({}) });
  let examples = 0, quiet = true;
  for (const name of S.libraries.names) {
    const L = S.libraries.LIBRARIES[name]; if (L.browserOnly) continue;
    for (const [w, [about, ex]] of Object.entries(L.words(fake))) { if (!ex) continue; logs.length = 0; S.load("result : " + ex).field("result"); examples++; if (logs.length) { quiet = false; console.log("   library example logs:", ex, logs); } }
  }
  ok("106 every library example runs without a message (" + examples + " of them)", quiet && examples >= 50);
  const W = [
    ["chroma brewer [\"Viridis\", 3]", "[#440154, #26838f, #fee825]"], ["chroma named \"tomato\"", "#ff6347"], ["chroma contrast [#000000, #ffffff]", "21"],
    ["simplex noise [0.5, 1.25] = (simplex noise [0.5, 1.25])", "true"], ["mathjs fraction \"1/3 + 1/6\"", "1/2"], ["mathjs determinant [[4, 7], [2, 6]]", "10"],
    ["date-fns format [2026-11-20, \"EEEE\"]", "Friday"], ["date-fns parse [\"20/11/2026\", \"dd/MM/yyyy\"] = 2026-11-20", "true"],
    ["fuse best [[\"apple\", \"banana\"], \"bananna\"]", "banana"], ["nlp plural \"goose\"", "geese"], ["turf distance [[0, 0], [0, 1]] round", "111"],
  ];
  for (const [src, want] of W) { const got = val(src); ok("106 " + src + " gives " + want, got === want); if (got !== want) console.log("   got", got); }
  ok("106 a program's libraries are found, and comments don't count", JSON.stringify(S.libraries.mentions("x : chroma named \"red\"\n-- mathjs\ny : date-fns week d")) === '["chroma","date-fns"]');
  logs.length = 0; val("[format : 1] format");
  ok("106 a field named like a global reads without a lint", !logs.some(m => /both a field/.test(m)));
  logs.length = 0; S.load("format : 2\nresult : [format : 1] format").field("result");
  ok("73 a field named like the program's own name still lints", logs.some(m => /both a field/.test(m)));
}

{ const known = S.knownWords(); ok("knownWords has globals and methods", ["print", "collect", "clock", "pad-left", "atan2", "cond"].every(w => known.has(w))); }
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
