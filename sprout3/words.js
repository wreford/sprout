// The standard words (decision 99): what Clojure's sequence library and Lua's string library do, as Sprout methods.
// It plugs into the core's prototypes (decision 96) and is always loaded, in Node and on the page, after sprout3.js.
// Nothing here changes in place: every method gives a new value.
(function (root) {
"use strict";
const S = root.Sprout3 || (typeof module !== "undefined" ? require("./sprout3.js") : null);
const I = S.internals;
const { methodTakingNothing: none, methodTakingOne: one, partsOf, fieldsOf, callCell, valuesEqual, logMiss, notUnderstood, UNSET, BANG, isCell, ValueCell, NO_FIELDS, EMPTY, makeList, shapeFor } = I;
const formatValue = S.format;
const list = parts => makeList(parts);
const record = (keys, values) => new ValueCell(EMPTY, shapeFor(keys), values);
const truthy = (answer, word) => answer === true ? true : answer === false ? false : (notUnderstood(answer, word), false);
const argumentsOf = (value, count) => isCell(value) ? Array.from({ length: count }, (_, i) => value.part(i + 1)) : [value];
const isRecord = v => isCell(v) && v.fieldNames().length > 0 && v.count() === 0;
const keyText = v => typeof v === "string" ? v : formatValue(v);
const wholeNumber = (n, word) => { if (typeof n !== "number" || !Number.isFinite(n)) { notUnderstood(n, word); return 0; } return Math.max(0, Math.floor(n)); };

// ===================================================================== endless lists (Clojure's lazy sequences)
// An endless list works out its items only when they are read, and keeps them. collect, keep and drop give endless lists;
// take, take-while, find and @ read as far as they need. length, fold, each and sort would never finish, so they say so.
class Endless extends ValueCell {
  constructor(pull) { super(null, NO_FIELDS, EMPTY); this.pull = pull; this.items = []; }
  get parts() { logMiss("an endless list has no end; take some first, as in xs take 10"); return []; }
  set parts(v) {}
  fill(n) { while (this.items.length < n) this.items.push(this.pull()); }
  part(k) { if (!Number.isInteger(k) || k < 1) return false; this.fill(k); return this.items[k - 1]; }
  count() { return Infinity; }
  run() { return this.part(1); }
  sproutText() { this.fill(3); return "[" + this.items.slice(0, 3).map(formatValue).join(", ") + ", ...]"; }
  sameAs(other) { return this === other; }
  // a cursor over the items, from the first
  cursor() { let at = 0; return () => this.part(++at); }
}
const endlessFrom = pull => { const e = new Endless(pull); e.methods = ENDLESS_METHODS; return e; };
const noEnd = word => () => logMiss("an endless list has no end, so " + word + " would never finish; take some first");
const ENDLESS_METHODS = Object.assign(Object.create(I.PROTOTYPES.cell), {
  length: none(noEnd("length")), last: none(noEnd("last")), sort: none(noEnd("sort")), reverse: none(noEnd("reverse")), sum: none(noEnd("sum")),
  each: one(noEnd("each")), fold: one(noEnd("fold")), spork: one(noEnd("spork")), with: one(noEnd("with")), "..": one(noEnd("..")),
  collect: one((xs, f) => { const next = xs.cursor(); return endlessFrom(() => callCell(f, next())); }),
  keep: one((xs, test) => { const next = xs.cursor(); return endlessFrom(() => { for (;;) { const item = next(); if (truthy(callCell(test, item), "keep")) return item; } }); }),
  drop: one((xs, n) => { const next = xs.cursor(); let skip = wholeNumber(n, "drop"); return endlessFrom(() => { while (skip > 0) { next(); skip--; } return next(); }); }),
  "drop-while": one((xs, test) => { const next = xs.cursor(); let dropping = true; return endlessFrom(() => { for (;;) { const item = next(); if (dropping && truthy(callCell(test, item), "drop-while")) continue; dropping = false; return item; } }); }),
  zip: one((xs, other) => { const next = xs.cursor(); if (other instanceof Endless) { const nextOther = other.cursor(); return endlessFrom(() => list([next(), nextOther()])); } return list(partsOf(other).map(item => list([next(), item]))); }),
  numbered: none(xs => { const next = xs.cursor(); let n = 0; return endlessFrom(() => list([++n, next()])); }),
  "collect-flat": one((xs, f) => { const next = xs.cursor(); let pending = []; return endlessFrom(() => { while (!pending.length) { const r = callCell(f, next()); pending = isCell(r) ? partsOf(r).slice() : [r]; } return pending.shift(); }); }),
  interpose: one((xs, sep) => { const next = xs.cursor(); let n = 0; return endlessFrom(() => (n++ % 2) ? sep : next()); }),
  take: one((xs, n) => { const count = wholeNumber(n, "take"); xs.fill(count); return list(xs.items.slice(0, count)); }),
  "take-while": one((xs, test) => { const out = []; for (let k = 1; ; k++) { const item = xs.part(k); if (!truthy(callCell(test, item), "take-while")) return list(out); out.push(item); } }),
  find: one((xs, test) => { for (let k = 1; ; k++) { const item = xs.part(k); if (truthy(callCell(test, item), "find")) return item; } }),
  "index-of": one((xs, v) => { for (let k = 1; ; k++) if (valuesEqual(xs.part(k), v)) return k; }),
  partition: one((xs, n) => { const size = wholeNumber(n, "partition") || 1, next = xs.cursor(); return endlessFrom(() => list(Array.from({ length: size }, next))); }),
});

// ===================================================================== lists and records (Clojure's sequence library)
const items = xs => partsOf(xs);
const numbersOf = (xs, word) => { const parts = items(xs); for (const v of parts) if (typeof v !== "number") { notUnderstood(v, word); return null; } return parts; };
const byKey = (xs, f, word) => items(xs).map(item => [callCell(f, item), item]);
const less = (a, b) => typeof a === "number" && typeof b === "number" ? a < b : typeof a === "string" && typeof b === "string" ? a < b : formatValue(a) < formatValue(b);
const groupInto = (xs, keyOf, add) => { const keys = [], groups = new Map(); for (const item of items(xs)) { const key = keyText(keyOf(item)); if (!groups.has(key)) { groups.set(key, add(undefined, item)); keys.push(key); } else groups.set(key, add(groups.get(key), item)); } return [keys, groups]; };
// a path into nested records and lists: [name, name, 2]
const step = (value, key) => { if (!isCell(value)) return false; if (typeof key === "number") return value.part(key); const field = value.field(keyText(key)); return field === UNSET ? false : field; };
const putAt = (value, key, newValue) => {
  if (typeof key === "number") { const parts = isCell(value) ? partsOf(value).slice() : []; while (parts.length < key - 1) parts.push(false); parts[key - 1] = newValue; return isCell(value) ? I.merge(new ValueCell(EMPTY, value instanceof ValueCell ? value.fieldShape : shapeFor(value.fieldNames()), value instanceof ValueCell ? value.fieldValues : value.fieldNames().map(k => value.field(k))), list(parts)) : list(parts); }
  return I.merge(isCell(value) ? value : record([], []), record([keyText(key)], [newValue]));
};
const pathOf = p => isCell(p) ? partsOf(p) : [p];
const updateIn = (value, path, change) => { if (!path.length) return change(value); const [key, ...rest] = path; return putAt(value, key, updateIn(step(value, key), rest, change)); };

const LIST_WORDS = {
  second: none(xs => xs.part(2)),
  rest: none(xs => list(items(xs).slice(1))),
  "all-but-last": none(xs => list(items(xs).slice(0, -1))),
  reverse: none(xs => list(items(xs).slice().reverse())),
  distinct: none(xs => { const out = []; for (const v of items(xs)) if (!out.some(o => valuesEqual(o, v))) out.push(v); return list(out); }),
  sum: none(xs => { const ns = numbersOf(xs, "sum"); return ns ? ns.reduce((a, b) => a + b, 0) : false; }),
  product: none(xs => { const ns = numbersOf(xs, "product"); return ns ? ns.reduce((a, b) => a * b, 1) : false; }),
  mean: none(xs => { const ns = numbersOf(xs, "mean"); return ns && ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : false; }),
  largest: none(xs => { const ns = numbersOf(xs, "largest"); return ns && ns.length ? ns.reduce((a, b) => b > a ? b : a) : false; }),
  smallest: none(xs => { const ns = numbersOf(xs, "smallest"); return ns && ns.length ? ns.reduce((a, b) => b < a ? b : a) : false; }),
  flatten: none(xs => { const out = []; const walk = v => { if (isCell(v) && !isRecord(v) && !(v instanceof Endless)) partsOf(v).forEach(walk); else out.push(v); }; items(xs).forEach(walk); return list(out); }),
  take: one((xs, n) => list(items(xs).slice(0, wholeNumber(n, "take")))),
  drop: one((xs, n) => list(items(xs).slice(wholeNumber(n, "drop")))),
  "take-while": one((xs, test) => { const out = []; for (const v of items(xs)) { if (!truthy(callCell(test, v), "take-while")) break; out.push(v); } return list(out); }),
  "drop-while": one((xs, test) => { const parts = items(xs); let k = 0; while (k < parts.length && truthy(callCell(test, parts[k]), "drop-while")) k++; return list(parts.slice(k)); }),
  find: one((xs, test) => { for (const v of items(xs)) if (truthy(callCell(test, v), "find")) return v; return false; }),
  "index-of": one((xs, v) => { const k = items(xs).findIndex(o => valuesEqual(o, v)); return k < 0 ? false : k + 1; }),
  has: one((xs, v) => items(xs).some(o => valuesEqual(o, v))),
  any: one((xs, test) => items(xs).some(v => truthy(callCell(test, v), "any"))),
  all: one((xs, test) => items(xs).every(v => truthy(callCell(test, v), "all"))),
  count: one((xs, test) => items(xs).filter(v => truthy(callCell(test, v), "count")).length),
  "sort-by": one((xs, f) => list(byKey(xs, f).map((pair, k) => [pair, k]).sort((a, b) => less(a[0][0], b[0][0]) ? -1 : less(b[0][0], a[0][0]) ? 1 : a[1] - b[1]).map(x => x[0][1]))),
  "largest-by": one((xs, f) => { let best = false, bestKey; for (const [key, v] of byKey(xs, f)) if (best === false || less(bestKey, key)) { best = v; bestKey = key; } return best; }),
  "smallest-by": one((xs, f) => { let best = false, bestKey; for (const [key, v] of byKey(xs, f)) if (best === false || less(key, bestKey)) { best = v; bestKey = key; } return best; }),
  "group-by": one((xs, f) => { const [keys, groups] = groupInto(xs, item => callCell(f, item), (group, item) => (group || []).concat([item])); return record(keys, keys.map(k => list(groups.get(k)))); }),
  frequencies: none(xs => { const [keys, groups] = groupInto(xs, item => item, (n, item) => (n || 0) + 1); return record(keys, keys.map(k => groups.get(k))); }),
  partition: one((xs, n) => { const size = wholeNumber(n, "partition") || 1, parts = items(xs), out = []; for (let k = 0; k + size <= parts.length; k += size) out.push(list(parts.slice(k, k + size))); return list(out); }),
  chunks: one((xs, n) => { const size = wholeNumber(n, "chunks") || 1, parts = items(xs), out = []; for (let k = 0; k < parts.length; k += size) out.push(list(parts.slice(k, k + size))); return list(out); }),
  windows: one((xs, n) => { const size = wholeNumber(n, "windows") || 1, parts = items(xs), out = []; for (let k = 0; k + size <= parts.length; k++) out.push(list(parts.slice(k, k + size))); return list(out); }),
  zip: one((xs, other) => { const a = items(xs); if (other instanceof Endless) return list(a.map((v, k) => list([v, other.part(k + 1)]))); const b = items(other), n = Math.min(a.length, b.length); return list(Array.from({ length: n }, (_, k) => list([a[k], b[k]]))); }),
  numbered: none(xs => list(items(xs).map((v, k) => list([k + 1, v])))),
  interpose: one((xs, sep) => { const out = []; items(xs).forEach((v, k) => { if (k) out.push(sep); out.push(v); }); return list(out); }),
  "collect-flat": one((xs, f) => { const out = []; for (const v of items(xs)) { const r = callCell(f, v); if (isCell(r)) out.push(...partsOf(r)); else out.push(r); } return list(out); }),
  scan: one((xs, startAndCell) => { if (!isCell(startAndCell)) return notUnderstood(startAndCell, "scan"); let total = startAndCell.part(1); const f = startAndCell.part(2), out = [total]; for (const v of items(xs)) { total = callCell(f, list([total, v])); out.push(total); } return list(out); }),
  join: one((xs, sep) => items(xs).map(formatValue).join(formatValue(sep))),
  // records: Clojure's keys, vals, select-keys, dissoc, update, get-in, assoc-in and update-in
  keys: none(r => list(r.fieldNames().slice())),
  values: none(r => list(r.fieldNames().map(k => r.field(k)))),
  pairs: none(r => list(r.fieldNames().map(k => list([k, r.field(k)])))),
  select: one((r, names) => { const keys = pathOf(names).map(keyText).filter(k => r.field(k) !== UNSET); return record(keys, keys.map(k => r.field(k))); }),
  without: one((r, names) => { const drop = new Set(pathOf(names).map(keyText)), keys = r.fieldNames().filter(k => !drop.has(k)); return new ValueCell(partsOf(r), shapeFor(keys), keys.map(k => r.field(k))); }),
  update: one((r, nameAndCell) => { const [name, f] = argumentsOf(nameAndCell, 2); return updateIn(r, [name], v => callCell(f, v)); }),
  "get-in": one((r, path) => pathOf(path).reduce(step, r)),
  "set-in": one((r, pathAndValue) => { const [path, v] = argumentsOf(pathAndValue, 2); return updateIn(r, pathOf(path), () => v); }),
  "update-in": one((r, pathAndCell) => { const [path, f] = argumentsOf(pathAndCell, 2); return updateIn(r, pathOf(path), v => callCell(f, v)); }),
};

// ===================================================================== text (Lua's string library, and more)
const textArgument = (v, word) => typeof v === "string" ? v : (notUnderstood(v, word), "");
// Lua's sub: positions from 1, negative ones from the end, both ends included
const position = (n, length) => n < 0 ? length + n + 1 : n;
const TEXT_WORDS = {
  split: one((t, sep) => list(t.split(textArgument(sep, "split")))),
  lines: none(t => list(t.split(/\r?\n/))),
  words: none(t => list(t.split(/\s+/).filter(w => w))),
  chars: none(t => list(Array.from(t))),
  trim: none(t => t.trim()),
  "starts-with": one((t, s) => t.startsWith(textArgument(s, "starts-with"))),
  "ends-with": one((t, s) => t.endsWith(textArgument(s, "ends-with"))),
  has: one((t, s) => t.includes(textArgument(s, "has"))),
  "index-of": one((t, s) => { const k = t.indexOf(textArgument(s, "index-of")); return k < 0 ? false : k + 1; }),
  slice: one((t, fromTo) => { const [from, to] = argumentsOf(fromTo, 2); const a = position(from, t.length), b = to === false || to === undefined ? t.length : position(to, t.length); return t.slice(Math.max(0, a - 1), Math.max(0, b)); }),
  repeat: one((t, n) => t.repeat(wholeNumber(n, "repeat"))),
  reverse: none(t => Array.from(t).reverse().join("")),
  number: none(t => { const n = Number(t.trim()); return t.trim() !== "" && Number.isFinite(n) ? n : false; }),
  code: none(t => t.length ? t.codePointAt(0) : false),
  "pad-left": one((t, widthAndChar) => { const [width, char] = argumentsOf(widthAndChar, 2); return t.padStart(wholeNumber(width, "pad-left"), typeof char === "string" ? char : " "); }),
  "pad-right": one((t, widthAndChar) => { const [width, char] = argumentsOf(widthAndChar, 2); return t.padEnd(wholeNumber(width, "pad-right"), typeof char === "string" ? char : " "); }),
  capitalize: none(t => t.charAt(0).toUpperCase() + t.slice(1)),
};

// ===================================================================== numbers
const NUMBER_WORDS = {
  pow: one((a, b) => Math.pow(a, I.requireNumber(b))), exp: none(Math.exp), atan: none(Math.atan), sign: none(Math.sign),
  even: none(a => a % 2 === 0), odd: none(a => Math.abs(a % 2) === 1),
  between: one((a, lowHigh) => { const [low, high] = argumentsOf(lowHigh, 2); return a >= low && a <= high; }),
  // 1 to 5 is [1, 2, 3, 4, 5]; 5 to 1 counts down
  to: one((a, b) => { if (typeof b !== "number") return notUnderstood(b, "to"); const out = [], stepBy = b >= a ? 1 : -1; for (let n = a; stepBy > 0 ? n <= b : n >= b; n += stepBy) out.push(n); return list(out); }),
};

// ===================================================================== every value
const kindOf = v => typeof v === "number" ? "number" : typeof v === "string" ? "text" : typeof v === "boolean" ? "true or false" :
  v instanceof Endless ? "endless list" : v && v.kind ? v.kind : v instanceof I.Native ? "host word" : isCell(v) ? (v instanceof I.Cell && v.takesInput() ? "cell" : isRecord(v) ? "record" : "list") : "value";
const EVERY_WORDS = { kind: none(kindOf) };

S.install({ methods: { cell: LIST_WORDS, text: TEXT_WORDS, number: NUMBER_WORDS, every: EVERY_WORDS } });

// ===================================================================== globals
const define = (name, fn) => S.defNative(name, fn);
// iterate [start, step]: start, then step of it, then step of that, without end
define("iterate", a => { const [start, f] = argumentsOf(a, 2); let current, begun = false; return endlessFrom(() => { current = begun ? callCell(f, current) : start; begun = true; return current; }); });
// forever v: v, v, v, ... ; cycle xs: xs over and over
define("forever", v => endlessFrom(() => v));
define("cycle", xs => { const parts = isCell(xs) ? partsOf(xs) : [xs]; let k = 0; return parts.length ? endlessFrom(() => parts[k++ % parts.length]) : list([]); });
define("char", n => typeof n === "number" ? String.fromCodePoint(n) : notUnderstood(n, "char"));
S.globals.pi = Math.PI;

S.words = { Endless, endlessFrom, kindOf, argumentsOf, list, record, truthy };
})(typeof window !== "undefined" ? window : globalThis);
