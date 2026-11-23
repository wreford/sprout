// parse (decision 103): Rebol's parse dialect, with rules that are ordinary Sprout values.
// A rule is text (matched as it is), a list of rules (one after another), a cell with one input (a test for one
// character or item), a word or any other value (an item equal to it), or one of the rules below.
// Matching is PEG: choices are tried in order, repeats take all they can, and nothing is tried again.
// It works on text, one character at a time, and on lists, one item at a time, so a block of code is parsed like text.
(function (root) {
"use strict";
const S = root.Sprout3 || (typeof module !== "undefined" ? require("./sprout3.js") : null);
const I = S.internals, W = S.words;
const { methodTakingNothing: none, methodTakingOne: one, partsOf, callCell, valuesEqual, logMiss, notUnderstood, isCell, Cell, UNSET } = I;
const { list, record, argumentsOf } = W;
const FAIL = -1;

// the input being parsed: text, or the items of a list
class Input {
  constructor(value) { this.isText = typeof value === "string"; this.text = this.isText ? value : null; this.items = this.isText ? null : partsOf(value); this.length = this.isText ? value.length : this.items.length; this.captures = []; }
  at(k) { return this.isText ? this.text[k] : this.items[k]; }
  piece(from, to) { return this.isText ? this.text.slice(from, to) : to - from === 1 ? this.items[from] : list(this.items.slice(from, to)); }
}

class Rule {
  constructor(name, match) { this.name = name; this.match = match; }
  sproutText() { return "[rule " + this.name + "]"; }
  sameAs(b) { return this === b; }
}
Rule.prototype.kind = "rule";

// any value as a rule; a cell's parts are read when it is first matched, so a rule can hold itself
const converted = new WeakMap();
function toRule(v) {
  if (v instanceof Rule) return v;
  if (typeof v === "string") return textRule(v);
  if (v instanceof Cell && v.takesInput()) return new Rule("test", (input, k) => k < input.length && W.truthy(callCell(v, input.at(k)), "parse") ? k + 1 : FAIL);
  if (isCell(v) && !(v.methods && v.kind && v.kind !== "block")) {
    let rule = converted.get(v);
    if (!rule) { let steps = null; rule = new Rule("sequence", (input, k) => sequence(steps || (steps = partsOf(v).map(toRule)), input, k)); converted.set(v, rule); }
    return rule;
  }
  if (v === false) return new Rule("nothing", () => FAIL);
  // a word, number, date or any other value: one item equal to it
  return new Rule("item", (input, k) => !input.isText && k < input.length && valuesEqual(input.at(k), v) ? k + 1 : FAIL);
}
function textRule(t) {
  return new Rule(JSON.stringify(t), (input, k) => input.isText ? (input.text.startsWith(t, k) ? k + t.length : FAIL) : (k < input.length && input.at(k) === t ? k + 1 : FAIL));
}
function sequence(steps, input, k) { for (const step of steps) { k = step.match(input, k); if (k === FAIL) return FAIL; } return k; }
// try a rule; if it fails, leave no captures behind
function attempt(rule, input, k) { const mark = input.captures.length, end = rule.match(input, k); if (end === FAIL) input.captures.length = mark; return end; }
function repeat(rule, input, k, min, max) {
  let count = 0;
  while (count < max) { const end = attempt(rule, input, k); if (end === FAIL || end === k) break; k = end; count++; }
  return count >= min ? k : FAIL;
}

// ---- rules
const charRule = (name, test) => new Rule(name, (input, k) => k < input.length && (input.isText ? test(input.text[k]) : typeof input.at(k) === "string" && input.at(k).length === 1 && test(input.at(k))) ? k + 1 : FAIL);
const RULES = {
  digit: charRule("digit", c => c >= "0" && c <= "9"),
  letter: charRule("letter", c => /\p{L}/u.test(c)),
  "upper-letter": charRule("upper-letter", c => /\p{Lu}/u.test(c)),
  "lower-letter": charRule("lower-letter", c => /\p{Ll}/u.test(c)),
  "letter-or-digit": charRule("letter-or-digit", c => /[\p{L}\p{N}]/u.test(c)),
  space: charRule("space", c => /\s/.test(c)),
  "any-char": new Rule("any-char", (input, k) => k < input.length ? k + 1 : FAIL),
  end: new Rule("end", (input, k) => k === input.length ? k : FAIL),
  "a-number": new Rule("a-number", (input, k) => !input.isText && typeof input.at(k) === "number" ? k + 1 : FAIL),
  "a-text": new Rule("a-text", (input, k) => !input.isText && typeof input.at(k) === "string" ? k + 1 : FAIL),
  "a-word": new Rule("a-word", (input, k) => !input.isText && input.at(k) instanceof W.Word ? k + 1 : FAIL),
};
const MAKERS = {
  some: r => { const rule = toRule(r); return new Rule("some", (input, k) => repeat(rule, input, k, 1, Infinity)); },
  maybe: r => { const rule = toRule(r); return new Rule("maybe", (input, k) => { const end = attempt(rule, input, k); return end === FAIL ? k : end; }); },
  "maybe-some": r => { const rule = toRule(r); return new Rule("maybe-some", (input, k) => repeat(rule, input, k, 0, Infinity)); },
  // repeat [n, rule] or repeat [least, most, rule]
  repeat: a => { const parts = isCell(a) ? partsOf(a) : []; if (parts.length < 2) return notUnderstood(a, "repeat"); const rule = toRule(parts[parts.length - 1]), min = parts[0], max = parts.length > 2 ? parts[1] : parts[0]; return new Rule("repeat", (input, k) => repeat(rule, input, k, min, max)); },
  // one-of [rule, rule, ...] tries each in order; one-of "abc" is any one of those characters
  "one-of": a => {
    if (typeof a === "string") return charRule("one-of", c => a.includes(c));
    const choices = isCell(a) ? partsOf(a).map(toRule) : [toRule(a)];
    return new Rule("one-of", (input, k) => { for (const c of choices) { const end = attempt(c, input, k); if (end !== FAIL) return end; } return FAIL; });
  },
  "none-of": a => typeof a === "string" ? charRule("none-of", c => !a.includes(c)) : (parts => new Rule("none-of", (input, k) => k < input.length && !parts.some(p => valuesEqual(p, input.at(k))) ? k + 1 : FAIL))(isCell(a) ? partsOf(a) : [a]),
  // to rule: up to where it matches; thru rule: just past it
  to: r => { const rule = toRule(r); return new Rule("to", (input, k) => { for (let at = k; at <= input.length; at++) if (attempt(rule, input, at) !== FAIL) { return at; } return FAIL; }); },
  thru: r => { const rule = toRule(r); return new Rule("thru", (input, k) => { for (let at = k; at <= input.length; at++) { const end = attempt(rule, input, at); if (end !== FAIL) return end; } return FAIL; }); },
  ahead: r => { const rule = toRule(r); return new Rule("ahead", (input, k) => { const mark = input.captures.length, end = rule.match(input, k); input.captures.length = mark; return end === FAIL ? FAIL : k; }); },
  "not-ahead": r => { const rule = toRule(r); return new Rule("not-ahead", (input, k) => { const mark = input.captures.length, end = rule.match(input, k); input.captures.length = mark; return end === FAIL ? k : FAIL; }); },
  // into rule: one item that is a list (or a phrase of code), parsed all through by the rule
  into: r => { const rule = toRule(r); return new Rule("into", (input, k) => { if (input.isText || k >= input.length || !isCell(input.at(k))) return FAIL; const inner = new Input(input.at(k)), end = rule.match(inner, 0); if (end !== inner.length) return FAIL; input.captures.push(...inner.captures); return k + 1; }); },
  "of-kind": kind => new Rule("of-kind", (input, k) => !input.isText && k < input.length && W.kindOf(input.at(k)) === kind ? k + 1 : FAIL),
  rule: toRule,
};
// rule as "name" keeps what it matched, under that name; rule as ["name", cell] keeps what the cell makes of it;
// rule all-as "name" keeps every match, in a list
function capture(all) {
  return (r, nameAndCell) => {
    const rule = toRule(r), [name, f] = typeof nameAndCell === "string" ? [nameAndCell, null] : argumentsOf(nameAndCell, 2);
    if (typeof name !== "string") return notUnderstood(nameAndCell, all ? "all-as" : "as");
    return new Rule("as", (input, k) => { const end = rule.match(input, k); if (end === FAIL) return FAIL; const piece = input.piece(k, end); input.captures.push([name, f ? callCell(f, piece) : piece, all]); return end; });
  };
}
const RULE_METHODS = Object.assign(Object.create(I.PROTOTYPES.every), { as: one(capture(false)), "all-as": one(capture(true)) });
Rule.prototype.methods = RULE_METHODS;

// ---- what the captures give: a record, with a list for each all-as name
function captureRecord(captures) {
  const keys = [], values = new Map();
  for (const [name, value, all] of captures) {
    if (!values.has(name)) keys.push(name);
    if (all) values.set(name, (values.get(name) || []).concat([value])); else values.set(name, value);
  }
  return record(keys, keys.map(k => Array.isArray(values.get(k)) ? list(values.get(k)) : values.get(k)));
}
// text parse rule: true, or a record of what was kept, when the rule matches all of it; false when it doesn't
function parse(value, r) {
  const input = new Input(value), end = toRule(r).match(input, 0);
  if (end !== input.length) return false;
  return input.captures.length ? captureRecord(input.captures) : true;
}
// every match, left to right: what it matched, or a record when it keeps things
function findAll(value, r) {
  const input = new Input(value), rule = toRule(r), out = [];
  for (let k = 0; k < input.length;) { input.captures = []; const end = rule.match(input, k); if (end === FAIL || end === k) { k++; continue; } out.push(input.captures.length ? captureRecord(input.captures) : input.piece(k, end)); k = end; }
  return list(out);
}
// text replace-all [rule, new]: new is text, or a cell given what was matched (or the record it kept)
function replaceAll(value, ruleAndNew) {
  if (typeof value !== "string") return notUnderstood(value, "replace-all");
  const [r, replacement] = argumentsOf(ruleAndNew, 2), input = new Input(value), rule = toRule(r);
  let out = "", k = 0;
  while (k <= value.length) {
    input.captures = []; const end = k < value.length || value.length === 0 ? rule.match(input, k) : FAIL;
    if (end === FAIL || end === k) { if (k < value.length) out += value[k]; k++; continue; }
    const matched = input.captures.length ? captureRecord(input.captures) : value.slice(k, end);
    out += typeof replacement === "string" ? replacement : S.format(callCell(replacement, matched));
    k = end;
  }
  return out;
}
// some one-of [...] reads left to right as (some one-of) [...]: a maker given a maker waits for the rule, then gives both.
// So does text parse some [...]: parse given a maker waits for the rule too.
const makerNatives = new Set();
const waitingForRule = (finish, maker) => { const waiting = new I.Native(maker.name, x => x instanceof I.Native && makerNatives.has(x) ? waitingForRule(finish, maker.fn(x)) : finish(maker.fn(x))); return waiting; };
const takingRule = finish => one((value, r) => r instanceof I.Native && makerNatives.has(r) ? waitingForRule(rule => finish(value, rule), r) : finish(value, r));
const PARSE_WORDS = { parse: takingRule(parse), "find-all": takingRule(findAll), "replace-all": one(replaceAll) };
S.install({ methods: { text: PARSE_WORDS, cell: PARSE_WORDS } });
for (const name in RULES) S.globals[name] = RULES[name];
function defineMaker(name, make) {
  S.defNative(name, a => {
    if (a instanceof I.Native && makerNatives.has(a)) { const inner = a; const composed = new I.Native(name + " " + inner.name, x => make(inner.fn(x))); makerNatives.add(composed); return composed; }
    return make(a);
  });
  makerNatives.add(S.globals[name]);
}
for (const name in MAKERS) defineMaker(name, MAKERS[name]);
S.rules = { Rule, toRule, parse, findAll, replaceAll };
})(typeof window !== "undefined" ? window : globalThis);
