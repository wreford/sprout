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

// ===================================================================== Rebol's literals (decision 100)
// Each kind is a small value with its own methods: maths that makes sense for it, and fields to read.
const pad2 = n => String(n).padStart(2, "0");
const sameKind = (a, b) => b !== null && typeof b === "object" && b.kind === a.kind;
const compareBy = key => ({
  "<": one((a, b) => sameKind(a, b) ? key(a) < key(b) : notUnderstood(b, "<")), ">": one((a, b) => sameKind(a, b) ? key(a) > key(b) : notUnderstood(b, ">")),
  "<=": one((a, b) => sameKind(a, b) ? key(a) <= key(b) : notUnderstood(b, "<=")), ">=": one((a, b) => sameKind(a, b) ? key(a) >= key(b) : notUnderstood(b, ">=")),
});
const kindMethods = (key, extra) => Object.assign(Object.create(I.PROTOTYPES.every), compareBy(key), extra);
class Kind {
  sameAs(b) { return sameKind(this, b) && this.key() === b.key(); }
  toString() { return this.sproutText(); }
  toJSON() { return this.sproutText(); }
}

// a date: days since 1970-01-01 (UTC, so it never shifts with a time zone)
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
class SproutDate extends Kind {
  unpackParts() { return this.parts().slice(0, 3); }
  constructor(days) { super(); this.days = days; }
  key() { return this.days; }
  parts() { const d = new Date(this.days * 86400000); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCDay()]; }
  sproutText() { const [y, m, d] = this.parts(); return String(y).padStart(4, "0") + "-" + pad2(m) + "-" + pad2(d); }
}
const dateOf = (y, m, d) => new SproutDate(Math.round(Date.UTC(y, m - 1, d) / 86400000));
const DATE_METHODS = kindMethods(d => d.days, {
  "+": one((a, n) => typeof n === "number" ? new SproutDate(a.days + Math.round(n)) : notUnderstood(n, "+")),
  "-": one((a, b) => typeof b === "number" ? new SproutDate(a.days - Math.round(b)) : b instanceof SproutDate ? a.days - b.days : notUnderstood(b, "-")),
  year: none(a => a.parts()[0]), month: none(a => a.parts()[1]), day: none(a => a.parts()[2]),
  weekday: none(a => DAY_NAMES[a.parts()[3]]), "weekday-number": none(a => (a.parts()[3] + 6) % 7 + 1),
  // months added keep the day, or the month's last day if it has fewer
  "add-months": one((a, n) => { const [y, m, d] = a.parts(), total = y * 12 + (m - 1) + Math.round(n), ny = Math.floor(total / 12), nm = total % 12 + 1; const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate(); return dateOf(ny, nm, Math.min(d, last)); }),
  "is-weekend": none(a => a.parts()[3] === 0 || a.parts()[3] === 6),
  // working days later, skipping Saturdays and Sundays
  "add-workdays": one((a, n) => { let d = a.days, left = Math.round(n); const stepBy = left < 0 ? -1 : 1; while (left !== 0) { d += stepBy; const w = new Date(d * 86400000).getUTCDay(); if (w !== 0 && w !== 6) left -= stepBy; } return new SproutDate(d); }),
});

// a time of day, or a length of time: seconds
class SproutTime extends Kind {
  unpackParts() { return [Math.floor(this.seconds / 3600), Math.floor(this.seconds % 3600 / 60), this.seconds % 60]; }
  constructor(seconds) { super(); this.seconds = seconds; }
  key() { return this.seconds; }
  sproutText() { const neg = this.seconds < 0, t = Math.abs(this.seconds), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = +(t % 60).toFixed(6); return (neg ? "-" : "") + h + ":" + pad2(m) + (sec ? ":" + (sec < 10 ? "0" : "") + sec : ""); }
}
const secondsOf = (b, word) => b instanceof SproutTime ? b.seconds : typeof b === "number" ? b : (notUnderstood(b, word), 0);
const TIME_METHODS = kindMethods(t => t.seconds, {
  "+": one((a, b) => new SproutTime(a.seconds + secondsOf(b, "+"))), "-": one((a, b) => new SproutTime(a.seconds - secondsOf(b, "-"))),
  "*": one((a, n) => new SproutTime(a.seconds * I.requireNumber(n))), "/": one((a, b) => b instanceof SproutTime ? a.seconds / b.seconds : new SproutTime(a.seconds / I.requireNumber(b))),
  hour: none(a => Math.floor(a.seconds / 3600)), minute: none(a => Math.floor(a.seconds % 3600 / 60)), second: none(a => a.seconds % 60),
  "in-seconds": none(a => a.seconds), "in-minutes": none(a => a.seconds / 60), "in-hours": none(a => a.seconds / 3600),
});

// money: whole cents, so sums are exact; * and / round to the nearest cent, halves to even (banker's rounding)
const roundHalfEven = x => { const r = Math.round(x); return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r; };
class Money extends Kind {
  unpackParts() { return [Math.trunc(this.cents / 100), this.cents % 100]; }
  constructor(cents) { super(); this.cents = cents; }
  key() { return this.cents; }
  sproutText() { const neg = this.cents < 0, c = Math.abs(this.cents), whole = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); return (neg ? "-" : "") + "$" + whole + "." + pad2(c % 100); }
}
const MONEY_METHODS = kindMethods(m => m.cents, {
  "+": one((a, b) => b instanceof Money ? new Money(a.cents + b.cents) : notUnderstood(b, "+ (add money to money)")),
  "-": one((a, b) => b instanceof Money ? new Money(a.cents - b.cents) : notUnderstood(b, "- (take money from money)")),
  "*": one((a, n) => typeof n === "number" ? new Money(roundHalfEven(a.cents * n)) : notUnderstood(n, "*")),
  "/": one((a, b) => b instanceof Money ? a.cents / b.cents : typeof b === "number" ? new Money(roundHalfEven(a.cents / b)) : notUnderstood(b, "/")),
  // split into n shares that add up to the whole, the odd cents going to the first shares
  split: one((a, n) => { const k = wholeNumber(n, "split") || 1, base = Math.trunc(a.cents / k), extra = a.cents - base * k; return list(Array.from({ length: k }, (_, j) => new Money(base + (j < Math.abs(extra) ? Math.sign(extra) : 0)))); }),
  cents: none(a => a.cents), amount: none(a => a.cents / 100),
});

// a pair: x and y, for positions and sizes
class Pair extends Kind {
  unpackParts() { return [this.x, this.y]; }
  constructor(x, y) { super(); this.x = x; this.y = y; }
  key() { return this.x + "x" + this.y; }
  sproutText() { return formatValue(this.x) + "x" + formatValue(this.y); }
}
const pairWise = (op, word) => one((a, b) => b instanceof Pair ? new Pair(op(a.x, b.x), op(a.y, b.y)) : typeof b === "number" ? new Pair(op(a.x, b), op(a.y, b)) : notUnderstood(b, word));
const PAIR_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), {
  "+": pairWise((p, q) => p + q, "+"), "-": pairWise((p, q) => p - q, "-"), "*": pairWise((p, q) => p * q, "*"), "/": pairWise((p, q) => p / q, "/"),
  x: none(a => a.x), y: none(a => a.y), length: none(a => Math.sqrt(a.x * a.x + a.y * a.y)), area: none(a => a.x * a.y),
  "<": one((a, b) => b instanceof Pair ? a.x < b.x && a.y < b.y : notUnderstood(b, "<")), ">": one((a, b) => b instanceof Pair ? a.x > b.x && a.y > b.y : notUnderstood(b, ">")),
  within: one((a, b) => b instanceof Pair ? a.x >= 0 && a.y >= 0 && a.x <= b.x && a.y <= b.y : notUnderstood(b, "within")),
});

// a url and an email: text with parts to read
class Url extends Kind {
  constructor(text) { super(); this.text = text; }
  key() { return this.text; }
  sproutText() { return this.text; }
}
const urlParts = u => { const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(u.text) || []; return { scheme: m[1] || "", host: m[2] || "", path: m[3] || "", query: (m[4] || "").slice(1), fragment: (m[5] || "").slice(1) }; };
const URL_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), {
  scheme: none(u => urlParts(u).scheme), host: none(u => urlParts(u).host), path: none(u => urlParts(u).path), query: none(u => urlParts(u).query),
  // url / "page" adds a step to the path
  "/": one((u, step) => new Url(u.text.replace(/\/+$/, "") + "/" + formatValue(step).replace(/^\/+/, ""))),
  "..": one((u, more) => new Url(u.text + formatValue(more))),
});
class Email extends Kind {
  constructor(text) { super(); this.text = text; }
  key() { return this.text.toLowerCase(); }
  sproutText() { return this.text; }
}
const EMAIL_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), { user: none(e => e.text.split("@")[0]), host: none(e => e.text.split("@")[1]) });

// a colour: red, green, blue from 0 to 255 and alpha from 0 to 1; draws as #rrggbb
class Colour extends Kind {
  unpackParts() { return [this.r, this.g, this.b, this.a]; }
  constructor(r, g, b, a) { super(); this.r = r; this.g = g; this.b = b; this.a = a === undefined ? 1 : a; }
  key() { return this.sproutText(); }
  sproutText() { const h = v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"); return "#" + h(this.r) + h(this.g) + h(this.b) + (this.a < 1 ? h(this.a * 255) : ""); }
}
const colourOf = text => { let h = text.slice(1); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = i => parseInt(h.slice(i, i + 2), 16); return new Colour(n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1); };
const mixColours = (a, b, t) => new Colour(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t, a.a + (b.a - a.a) * t);
const WHITE = { r: 255, g: 255, b: 255, a: 1 }, BLACK = { r: 0, g: 0, b: 0, a: 1 };
const COLOUR_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), {
  red: none(c => c.r), green: none(c => c.g), blue: none(c => c.b), alpha: none(c => c.a),
  mix: one((c, otherAndAmount) => { const [other, t] = argumentsOf(otherAndAmount, 2); return other instanceof Colour ? mixColours(c, other, typeof t === "number" ? t : 0.5) : notUnderstood(other, "mix"); }),
  lighter: one((c, t) => mixColours(c, WHITE, I.requireNumber(t))), darker: one((c, t) => mixColours(c, BLACK, I.requireNumber(t))),
  fade: one((c, alpha) => new Colour(c.r, c.g, c.b, I.requireNumber(alpha))),
});

// a word as a value ('move): what dialects and code as data are made of
class Word extends Kind {
  constructor(name) { super(); this.name = name; }
  key() { return this.name; }
  sproutText() { return this.name; }
}
const WORD_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), { name: none(w => w.name) });
const words = new Map();
const wordOf = name => { let w = words.get(name); if (!w) { w = new Word(name); words.set(name, w); } return w; };

function literal(form, text, line) {
  switch (form) {
    case "date": { const [y, m, d] = text.split("-").map(Number); const v = dateOf(y, m, d); if (v.sproutText() !== text) logMiss(text + " isn't a real date", line); return v; }
    case "time": { const [h, m, sec] = text.split(":").map(Number); return new SproutTime(h * 3600 + m * 60 + (sec || 0)); }
    case "money": { const neg = text[0] === "-", [whole, frac] = text.replace(/^-?\$/, "").split("."); const cents = Number(whole) * 100 + Number((frac || "0").padEnd(2, "0")); return new Money(neg ? -cents : cents); }
    case "pair": { const m = /^(-?\d+(?:\.\d+)?)x(-?\d+(?:\.\d+)?)$/.exec(text); return new Pair(Number(m[1]), Number(m[2])); }
    case "url": return new Url(text);
    case "email": return new Email(text);
    case "colour": return colourOf(text);
    case "word": return wordOf(text);
  }
  return logMiss("no literal of the form " + form, line);
}
// the same values made from parts, for when they are worked out: date [2026, 11, 20], money 12.5, pair [3, 4], colour [255, 136, 0]
const makers = {
  date: a => { if (typeof a === "string") return /^\d{4}-\d{2}-\d{2}$/.test(a) ? literal("date", a) : notUnderstood(a, "date"); const [y, m, d] = argumentsOf(a, 3); const v = dateOf(y, m, d); if (v.parts()[2] !== d) logMiss(y + "-" + pad2(m) + "-" + pad2(d) + " isn't a real date"); return v; },
  time: a => { if (typeof a === "number") return new SproutTime(a); const [h, m, sec] = argumentsOf(a, 3); return new SproutTime(h * 3600 + (m || 0) * 60 + (sec || 0)); },
  money: a => typeof a === "number" ? new Money(roundHalfEven(a * 100)) : notUnderstood(a, "money"),
  pair: a => { const [x, y] = argumentsOf(a, 2); return new Pair(x, y); },
  url: a => new Url(formatValue(a)), email: a => new Email(formatValue(a)),
  colour: a => typeof a === "string" ? colourOf(a) : (([r, g, b, al]) => new Colour(r, g, b, al === false ? 1 : al))(argumentsOf(a, 4)),
  word: a => wordOf(formatValue(a)),
};
for (const [kindClass, kind, methods] of [[SproutDate, "date", DATE_METHODS], [SproutTime, "time", TIME_METHODS], [Money, "money", MONEY_METHODS], [Pair, "pair", PAIR_METHODS], [Url, "url", URL_METHODS], [Email, "email", EMAIL_METHODS], [Colour, "colour", COLOUR_METHODS], [Word, "word", WORD_METHODS]])
  Object.assign(kindClass.prototype, { kind, methods });
S.install({ runtime: { literal } });
for (const name in makers) S.defNative(name, makers[name]);

// ===================================================================== code as data (decision 102)
// quote [move 10, turn 90] is the list [move 10, turn 90]: its items are words, numbers, phrases (a chain of terms),
// bindings, groups and lists. It prints as the code it came from, and eval runs it. Every cell can give its own code.
class CodeList extends ValueCell {
  sameAs(b) { return b instanceof CodeList && b.kind === this.kind && sameParts(this, b) && valuesEqual(this.extra, b.extra); }
  toJSON() { return this.sproutText(); }
}
const sameParts = (a, b) => { const pa = partsOf(a), pb = partsOf(b); return pa.length === pb.length && pa.every((v, k) => valuesEqual(v, pb[k])); };
class Phrase extends CodeList { constructor(parts) { super(parts, NO_FIELDS, EMPTY); this.extra = false; } sproutText() { return this.parts.map(sourceOf).join(" "); } }
class Group extends CodeList { constructor(parts) { super(parts, NO_FIELDS, EMPTY); this.extra = false; } sproutText() { return "(" + this.parts.map(sourceOf).join(", ") + ")"; } }
// a block is quoted [ ]: its items, and the names of its inputs (false when it takes none)
class Block extends CodeList { constructor(parts, inputs) { super(parts, NO_FIELDS, EMPTY); this.extra = inputs; } sproutText() { return "[" + (this.extra ? partsOf(this.extra).map(sourceOf).join(" ") + " | " : "") + this.parts.map(sourceOf).join(", ") + "]"; } }
class Template extends CodeList { constructor(parts) { super(parts, NO_FIELDS, EMPTY); this.extra = false; } sproutText() { return '"' + this.parts.map(p => typeof p === "string" ? escapeText(p) : "[" + sourceOf(p) + "]").join("") + '"'; } }
class Binding extends CodeList {
  constructor(name, value) { super([name, value], NO_FIELDS, EMPTY); this.extra = false; }
  sproutText() { return sourceOf(this.parts[0]) + " : " + sourceOf(this.parts[1]); }
}
const codeMethods = (kind, extra) => Object.assign(Object.create(I.PROTOTYPES.cell), { kind: none(() => kind) }, extra);
Object.assign(Phrase.prototype, { kind: "phrase", methods: codeMethods("phrase") });
Object.assign(Group.prototype, { kind: "group", methods: codeMethods("group") });
Object.assign(Block.prototype, { kind: "block", methods: codeMethods("block", { inputs: none(b => b.extra) }) });
Object.assign(Template.prototype, { kind: "template", methods: codeMethods("template") });
Object.assign(Binding.prototype, { kind: "binding", methods: codeMethods("binding", { name: none(b => b.parts[0]), value: none(b => b.parts[1]) }) });

// from the syntax tree to values
const fromItem = item => item.type === "bind" ? new Binding(item.pattern ? list(item.pattern.map(fromInput)) : wordOf(item.name), fromChain(item.value)) : fromChain(item);
const fromChain = chain => chain.terms.length === 1 ? fromTerm(chain.terms[0]) : new Phrase(chain.terms.map(fromTerm));
const fromInput = input => input.pattern ? list(input.pattern.map(fromInput)) : input.rest ? wordOf(".." + input.name) : input.defaultValue ? new Binding(wordOf(input.name), fromTerm(input.defaultValue)) : wordOf(input.name);
function fromTerm(term) {
  switch (term.type) {
    case "num": return term.value;
    case "str": return term.value;
    case "word": return term.value === "true" ? true : term.value === "false" ? false : wordOf(term.value);
    case "literal": return literal(term.form, term.text, term.line);
    case "group": return new Group(term.items.map(fromItem));
    case "cell": return new Block(term.items.map(fromItem), term.names.length ? list(term.names.map(fromInput)) : false);
    case "chain": return fromChain(term);
    case "tmpl": return new Template(term.parts.map(p => typeof p === "string" ? p : fromChain(p.ast)));
  }
  return logMiss("quote can't hold a " + term.type);
}
const quoted = json => fromTerm(JSON.parse(json));

// from values back to code
const escapeText = t => t.replace(/[\\"\[]/g, c => "\\" + c).replace(/\n/g, "\\n").replace(/\t/g, "\\t");
function sourceOf(v) {
  if (v === true || v === false) return String(v);
  if (typeof v === "number") return Number.isFinite(v) ? formatValue(v) : "(0 / 0)";
  if (typeof v === "string") return '"' + escapeText(v) + '"';
  if (v instanceof Money) return (v.cents < 0 ? "-" : "") + "$" + Math.floor(Math.abs(v.cents) / 100) + "." + pad2(Math.abs(v.cents) % 100);
  if (v instanceof Kind || v instanceof CodeList) return v.sproutText();
  if (v instanceof Endless) return logMiss("an endless list has no code") || "false";
  if (v instanceof I.Native) return v.name;
  if (v instanceof I.Cell && v.takesInput()) return sourceOf(codeOf(v));
  if (isCell(v)) { const pieces = v.fieldNames().map(k => k + " : " + sourceOf(v.field(k))).concat(partsOf(v).map(sourceOf)); return "[" + pieces.join(", ") + "]"; }
  return formatValue(v);
}
// a cell's own code, as quote would give it
const codeOf = cell => cell instanceof I.Cell && cell.shape && cell.shape.src ? fromTerm(JSON.parse(cell.shape.src)) : cell;
// eval: a list of items runs as a program and gives its last value; anything else is one item
const compiled = new Map();
// (a block that takes no input, or a plain list, is a program; a block with inputs gives back a cell)
const programSource = v => typeof v === "string" ? v : (v instanceof Block && !v.extra) || (isCell(v) && !(v instanceof CodeList) && !v.fieldNames().length) ? partsOf(v).map(sourceOf).join("\n") : sourceOf(v);
const short = src => src.length > 60 ? src.slice(0, 60) + "..." : src;
function evaluate(v) {
  const src = programSource(v);
  let program = compiled.get(src);
  if (!program) { try { program = S.load(src); } catch (e) { return logMiss("eval: " + e.message + " in " + short(src)); } compiled.set(src, program); if (compiled.size > 200) compiled.delete(compiled.keys().next().value); }
  return program.run(BANG);
}
// eval-with [names, code]: the fields of names can be used in the code, as if they were written above it
function evaluateWith(argument) {
  const [names, v] = argumentsOf(argument, 2), src = programSource(v), globals = S.globals, saved = new Map();
  if (!isCell(names)) return notUnderstood(names, "eval-with");
  // the names are there while the code loads: it reads them then, as it reads any host word
  for (const key of names.fieldNames()) { saved.set(key, Object.getOwnPropertyDescriptor(globals, key)); Object.defineProperty(globals, key, { value: names.field(key), enumerable: true, configurable: true, writable: true }); }
  let program;
  try { program = S.load(src); } catch (e) { program = null; logMiss("eval-with: " + e.message + " in " + short(src)); }
  finally { for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globals, key, descriptor); else delete globals[key]; } }
  return program ? program.run(BANG) : false;
}
S.install({ runtime: { quoted }, methods: { cell: { code: none(codeOf) }, every: { source: none(sourceOf) } } });
S.defNative("eval", evaluate);
S.defNative("eval-with", evaluateWith);
// phrase [items]: a chain of terms, to build code with
S.defNative("phrase", xs => new Phrase(isCell(xs) ? partsOf(xs) : [xs]));

// ===================================================================== scripts: coroutines that stay values (decision 104)
// script [| ... yield 1 ... x : yield 2 ...] is a script. s resume v runs it on to its next yield and gives a NEW script
// holding what was yielded; s itself is unchanged, so a game can keep, save, compare and rewind it like any value.
// A resume runs the cell again from the start with every value sent so far, so each yield hands back what was sent to it.
// The earlier steps' effects are not had again, and random gives them the same numbers, so the run is the same run.
class Suspend { constructor(context, value) { this.context = context; this.value = value; } }
const scriptRuns = [];
class Script {
  constructor(cell, sent, draws, value, done) { this.cell = cell; this.sent = sent; this.draws = draws; this.value = value; this.done = done; }
  sproutText() { return "[script, " + this.sent.length + (this.sent.length === 1 ? " step" : " steps") + (this.done ? ", done" : "") + ", value : " + formatValue(this.value) + "]"; }
  sameAs(b) { return b instanceof Script && b.cell === this.cell && this.sent.length === b.sent.length && this.sent.every((v, k) => valuesEqual(v, b.sent[k])); }
  toJSON() { return this.sproutText(); }
}
function resumeScript(script, sending) {
  if (script.done) return script;
  const sent = script.sent.concat([sending]), context = { count: 0, target: sent.length, sent, draws: script.draws.slice(), drawn: 0, muted: sent.length > 1 };
  const previousRandom = I.randomSource();
  S.setRandom(() => { if (context.drawn < context.draws.length) return context.draws[context.drawn++]; const v = previousRandom(); context.draws.push(v); context.drawn++; return v; });
  if (context.muted) I.muteEffects(true);
  scriptRuns.push(context);
  let value, done;
  try { value = script.cell.takesInput() ? script.cell.run(sent[0]) : script.cell.run(BANG); done = true; }
  catch (e) { if (!(e instanceof Suspend) || e.context !== context) throw e; value = e.value; done = false; }
  finally { scriptRuns.pop(); S.setRandom(previousRandom); if (context.muted) I.muteEffects(false); }
  return new Script(script.cell, sent, context.draws, value, done);
}
// yield v: inside a script, stop here and hand v out; the next resume's value is what yield gives back
S.defNative("yield", v => {
  const context = scriptRuns[scriptRuns.length - 1];
  if (!context) return logMiss("yield is only used inside a script");
  context.count++;
  if (context.count < context.target) {
    // past the last step taken before: from here on the effects are new
    if (context.count === context.target - 1 && context.muted) { I.muteEffects(false); context.muted = false; }
    return context.sent[context.count];
  }
  throw new Suspend(context, v);
});
S.defNative("script", cell => cell instanceof I.Cell ? new Script(cell, [], [], false, false) : notUnderstood(cell, "script"));
const yieldsOf = (script, most) => { const out = []; let s = script; while (out.length < most) { s = resumeScript(s, false); if (s.done) break; out.push(s.value); } return out; };
const SCRIPT_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), {
  resume: one(resumeScript), next: none(s => resumeScript(s, false)),
  value: none(s => s.value), done: none(s => s.done), steps: none(s => s.sent.length),
  // the values it yields, from where it is: the first n, or all of them up to when it finishes
  take: one((s, n) => list(yieldsOf(s, wholeNumber(n, "take")))),
  yields: none(s => { const out = yieldsOf(s, 100000); if (out.length === 100000) logMiss("a script yielded 100000 values and was stopped; use take"); return list(out); }),
});
Object.assign(Script.prototype, { kind: "script", methods: SCRIPT_METHODS });

// scripts for games, written in Sprout: wait for some seconds, given each frame's dt by resume
const SCRIPT_WORDS = S.load(`
wait : [seconds |
  go : [remaining | remaining > 0 [go (remaining - (yield "waiting"))] else [true]]
  go seconds
]
`);
for (const name of SCRIPT_WORDS.fieldNames()) S.globals[name] = SCRIPT_WORDS.field(name);

// ===================================================================== globals
const define = (name, fn) => S.defNative(name, fn);
// iterate [start, step]: start, then step of it, then step of that, without end
define("iterate", a => { const [start, f] = argumentsOf(a, 2); let current, begun = false; return endlessFrom(() => { current = begun ? callCell(f, current) : start; begun = true; return current; }); });
// forever v: v, v, v, ... ; cycle xs: xs over and over
define("forever", v => endlessFrom(() => v));
define("cycle", xs => { const parts = isCell(xs) ? partsOf(xs) : [xs]; let k = 0; return parts.length ? endlessFrom(() => parts[k++ % parts.length]) : list([]); });
define("char", n => typeof n === "number" ? String.fromCodePoint(n) : notUnderstood(n, "char"));
S.globals.pi = Math.PI;

S.words = { Script, resumeScript, Phrase, Group, Block, Template, Binding, sourceOf, codeOf, evaluate, Endless, endlessFrom, kindOf, literal, wordOf, Word, SproutDate, SproutTime, Money, Pair, Url, Email, Colour, argumentsOf, list, record, truthy };
})(typeof window !== "undefined" ? window : globalThis);
