// Sprout 3 kernels: the library that makes Sprout fast (decision 96). The core (sprout3.js) runs every program
// on its own; this only finds faster ways to get the same answers.
//   - the work-ahead pass (Spk): a cell worked out as far as it can be without its input, down to number maths
//   - loop fusion: a run of collect, keep, fold, each and length in a chain, as one loop (decision 95)
//   - spork kernels: a pure cell run for every input at once, on WebAssembly SIMD or in JavaScript (decision 91)
//   - a radix sort for numbers (decision 92)
(function (root) {
"use strict";
const S = typeof module !== "undefined" ? require("./sprout3.js") : root.Sprout3;
const I = S.internals;
const { FUSED, LAZYOPS, ALL, G, Native, NOISE, fmt, fieldsOnly, mentions, NOTE_KEYS, RCell, NCell, ColCell, VCell, VP, ROOT, shapeFor, toCols, Cell, EMPTY, isCell } = I;

// ===================================================================== spork kernels (decision 47, step 3 of decision 79)
// A cell given to spork is worked out once, when the program loads, as far as it can be without its input:
// calls are inlined; lists, records, words and loops over them are unrolled; a test that changes from run to run
// becomes a choice made in each run. What is left is number maths on the input, a flat list of steps (the IR),
// which runs as one tight loop: in JavaScript, in WebAssembly SIMD, or on the GPU.
// If anything can't be worked out this way (a host word, a random read, keep with a test that changes from run
// to run), there is no kernel and spork is collect, so a program can't tell which way it ran.
const SPKFAIL = { spork: "no" };
const SPK_PENDING = {};
const SPK_N2 = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b, mod: (a, b) => ((a % b) + b) % b,
  min: (a, b) => Math.min(a, b), max: (a, b) => Math.max(a, b), noise: (a, b) => NOISE(a, b) };
const SPK_N1 = { neg: a => -a, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log };
const SPK_C2 = { lt: (a, b) => a < b, gt: (a, b) => a > b, le: (a, b) => a <= b, ge: (a, b) => a >= b, eq: (a, b) => a === b, ne: (a, b) => a !== b };
const SPK_B2 = { and: (a, b) => a && b, or: (a, b) => a || b, beq: (a, b) => a === b };
// these give the same answer in JavaScript and WebAssembly only if done by JavaScript itself
const SPK_JSONLY = new Set(["mod", "sin", "cos", "tan", "log"]);
const SPK_OPS = { "+": "add", "-": "sub", "*": "mul", "/": "div", "%": "mod", "<": "lt", ">": "gt", "<=": "le", ">=": "ge" };
const SPK_NATIVES = new Set(["range", "noise"]);
const SPK_CELLM = { "@": 1, length: 0, first: 0, last: 0, collect: 1, keep: 1, each: 1, fold: 1, spork: 1 };
const spkNum = v => Object.is(v, -0) ? "-0" : String(v);
// the prelude's bindings by name, so its cells (clamp, cond, match...) can be inlined like any other
let PRE = null;
const prelude = () => PRE || (PRE = new Map(S.parse(S.PRELUDE).filter(it => it.k === "bind").map(it => [it.name, it])));

class Spk {
  constructor(g) {
    this.g = g; this.nodes = []; this.memo = new Map(); this.caps = []; this.capIdx = new Map();
    this.effects = null;
    // names from outside are worked out on a budget: the ones worth it are small tables, a few hundred steps each
    this.outside = new Map(); this.steps = 0; this.stepCap = 400000; this.depth = 0; this.outsideLeft = 10000; this.why = null; this.guards = []; this.jsOnly = false;
    this.pc = null; this.TRUE = this.cb(true); this.FALSE = this.cb(false); this.pc = this.TRUE;
  }
  no(why) { if (!this.why) this.why = why; throw SPKFAIL; }
  tick() { if (++this.steps > this.stepCap) this.no("it takes too many steps to work out"); }

  // ---- IR nodes: [op, a, b, c, v]. Equal nodes are shared, and steps on constants are worked out now.
  node(op, a, b, c, v) {
    const N = this.nodes, isK = i => N[i][0] === "c" || N[i][0] === "cb", kv = i => N[i][4];
    if (SPK_N2[op] && isK(a) && isK(b)) return this.node("c", -1, -1, -1, SPK_N2[op](kv(a), kv(b)));
    if (SPK_N1[op] && isK(a)) return this.node("c", -1, -1, -1, SPK_N1[op](kv(a)));
    if ((SPK_C2[op] || SPK_B2[op]) && isK(a) && isK(b)) return this.node("cb", -1, -1, -1, (SPK_C2[op] || SPK_B2[op])(kv(a), kv(b)));
    if (op === "not" && isK(a)) return this.node("cb", -1, -1, -1, !kv(a));
    if (op === "beq" && isK(b)) return kv(b) ? a : this.node("not", a);
    if (op === "beq" && isK(a)) return kv(a) ? b : this.node("not", b);
    if ((SPK_N2[op] || SPK_C2[op] || SPK_N1[op]) && op !== "noise") {
      const ta = this.ktree(a), tb = SPK_N1[op] ? 0 : this.ktree(b);
      if (ta && (SPK_N1[op] || tb) && (N[a][0] === "sel" || (!SPK_N1[op] && N[b][0] === "sel")) && ta * (tb || 1) <= 16) {
        const [x, y] = N[a][0] === "sel" ? [a, b] : [b, a], [, cc, l, r] = N[x];
        const on = (u) => SPK_N1[op] ? this.node(op, u) : x === a ? this.node(op, u, y) : this.node(op, y, u);
        return this.node("sel", cc, on(l), on(r));
      }
    }
    if (op === "sel") { if (isK(a)) return kv(a) ? b : c; if (b === c) return b; }
    if (op === "and") { if (isK(a)) return kv(a) ? b : a; if (isK(b)) return kv(b) ? a : b; if (a === b) return a; }
    if (op === "or") { if (isK(a)) return kv(a) ? a : b; if (isK(b)) return kv(b) ? b : a; if (a === b) return a; }
    const key = op + "," + a + "," + b + "," + c + "," + (v === undefined ? "" : typeof v === "number" ? spkNum(v) : v);
    let id = this.memo.get(key);
    if (id !== undefined) return id;
    id = N.length; N.push([op, a, b, c, v]); this.memo.set(key, id);
    if (SPK_JSONLY.has(op)) this.jsOnly = true;
    if (N.length > 60000) this.no("it is too big to run as one kernel");
    return id;
  }
  // how many constants a step is a choice between (a constant is 1), or 0 if it isn't a choice between constants
  ktree(i) {
    const n = this.nodes[i];
    if (n[0] === "c" || n[0] === "cb") return 1;
    if (n[0] !== "sel") return 0;
    const l = this.ktree(n[2]), r = l && this.ktree(n[3]);
    return l && r ? l + r : 0;
  }
  num(id) { return { k: "n", id }; }
  boo(id) { return { k: "b", id }; }
  cn(v) { return this.num(this.node("c", -1, -1, -1, v)); }
  cb(v) { return this.boo(this.node("cb", -1, -1, -1, !!v)); }
  isC(p) { return p.k === "n" && this.nodes[p.id][0] === "c"; }
  isCB(p) { return p.k === "b" && this.nodes[p.id][0] === "cb"; }
  val(p) { return this.nodes[p.id][4]; }
  isFalse(p) { return this.isCB(p) && this.val(p) === false; }
  cv(parts, keys, vals) { return { k: "cv", parts, keys: keys || [], vals: vals || [] }; }
  not(p) { return this.boo(this.node("not", p.id)); }
  and(a, b) { return this.boo(this.node("and", a.id, b.id)); }
  or(a, b) { return this.boo(this.node("or", a.id, b.id)); }
  // a check that must hold in every run, or the whole spork runs the ordinary way; it only counts where the program gets to it
  guard(ok) { const g = this.or(this.not(this.pc), ok); if (!this.isCB(g) || !this.val(g)) this.guards.push(g.id); }
  under(c, f) { const s = this.pc; this.pc = this.and(s, c); try { return f(); } finally { this.pc = s; } }

  // ---- names: the kernel's own, then the frames the compiler knows, then the built-ins
  isName(n, env) {
    for (let e = env; e; e = e.parent) {
      if (e.vars) { if (e.vars.has(n)) return true; continue; }
      if (e.prelude) return prelude().has(n) || this.g.globals.has(n);
      return !!this.frameRef(n, e.f, e.lim) || this.g.globals.has(n);
    }
    return false;
  }
  look(n, env) {
    for (let e = env; e; e = e.parent) {
      if (e.vars) { if (e.vars.has(n)) return e.vars.get(n); continue; }
      return e.prelude ? this.fromFrames(n, -1, Infinity) : this.fromFrames(n, e.f, e.lim);
    }
    this.no("it uses " + n);
  }
  // a prelude cell: a cell that takes input is inlined where it is called; anything else is worked out now
  fromPrelude(n) {
    const key = "\u0001" + n;
    if (this.outside.has(key)) { const v = this.outside.get(key); if (v === SPK_PENDING) this.no("it uses " + n + " inside its own definition"); return v; }
    const it = prelude().get(n), T = it.val.terms, env = { prelude: true };
    this.outside.set(key, SPK_PENDING);
    const v = T.length === 1 && T[0].k === "cell" ? this.cellValue(T[0], env) : this.chain(it.val, env);
    this.outside.set(key, v);
    return v;
  }
  frameRef(n, fIdx, lim) {
    for (let f = fIdx; f >= 0; f--) {
      const names = this.g.frames[f].names, r = names.get(n);
      if (!r) continue;
      if (f === fIdx && lim !== Infinity && spkPos(names, n) >= lim) continue;
      return { r, f };
    }
    return null;
  }
  fromFrames(n, fIdx, lim) {
    const fr = this.frameRef(n, fIdx, lim);
    if (fr) {
      const key = fr.f + "\u0000" + n;
      if (this.outside.has(key)) { const v = this.outside.get(key); if (v === SPK_PENDING) this.no("it uses " + n + " inside its own definition"); return v; }
      const pos = spkPos(this.g.frames[fr.f].names, n), r = fr.r;
      let v = null;
      if (r.ast && r.ast.names.length) v = { k: "fn", ast: r.ast, env: { f: fr.f, lim: pos + 1 } };
      else if ((r.ast || r.val) && !spkTooBig(this.g, fr.f, n) && this.outsideLeft > 0) {
        // a name bound outside: worked out again here (it is pure, so the value is the same), or else read as a number when spork runs
        this.outside.set(key, SPK_PENDING);
        const why = this.why, pc = this.pc, caps = this.caps.length, seen = new Set(this.outside.keys()), cap0 = this.stepCap;
        this.pc = this.TRUE;
        // a name from outside gets a small budget of its own: past it, it is read as a number when the loop runs
        const s0 = this.steps;
        this.stepCap = Math.min(cap0, this.steps + Math.min(2500, this.outsideLeft));
        try { v = r.ast ? this.cellValue(r.ast, { f: fr.f, lim: pos + 1 }) : this.chain(r.val, { f: fr.f, lim: pos }); }
        catch (e) {
          if (e !== SPKFAIL) throw e;
          // a failed try leaves nothing behind: no outside reads it made, no names it worked out
          this.why = why; v = null; spkTooBig(this.g, fr.f, n, true);
          for (const c of this.caps.splice(caps)) this.capIdx.delete(c);
          for (const k of [...this.outside.keys()]) if (!seen.has(k)) this.outside.delete(k);
          this.outside.set(key, SPK_PENDING);
        }
        this.stepCap = cap0; this.pc = pc; this.outsideLeft -= this.steps - s0;
      }
      if (!v) v = this.capture(this.g.refJS(r));
      this.outside.set(key, v);
      return v;
    }
    if (prelude().has(n) && (!this.g.globals.has(n) || (Object.getOwnPropertyDescriptor(G, n) || {}).get)) return this.fromPrelude(n);
    if (n === "any") return { k: "any" };
    if (this.g.globals.has(n)) {
      const d = Object.getOwnPropertyDescriptor(G, n);
      if (!d || d.get) this.no(n === "random" ? "it reads random, which changes from run to run" : "it uses " + n + ", a library cell spork can't work out yet");
      if (d.value instanceof Native) return SPK_NATIVES.has(n) ? { k: "nat", n } : d.value.effect ? { k: "host", n } : this.no(n === "rand" ? "it uses rand, which reads random, which changes from run to run" : "it uses " + n);
      if (typeof d.value === "number") return this.capture(this.g.globalRef(n));
      this.no("it uses " + n);
    }
    this.no("it uses " + n + ", which isn't a name it can see");
  }
  capture(ref) {
    let i = this.capIdx.get(ref);
    if (i === undefined) { i = this.caps.length; this.caps.push(ref); this.capIdx.set(ref, i); }
    return this.num(this.node("k", -1, -1, -1, i));
  }

  // ---- terms, chains and bodies, mirroring Gen.genChain step for step
  term(t, env) {
    this.tick();
    switch (t.k) {
      case "num": return this.cn(t.v);
      case "str": return { k: "s", v: t.v };
      case "tmpl": { let s = ""; for (const p of t.parts) s += typeof p === "string" ? p : this.text(this.chain(p.ast, env)); return { k: "s", v: s }; }
      case "word":
        if (t.v === "true") return this.TRUE;
        if (t.v === "false") return this.FALSE;
        if (["!", "_", "left", "right"].includes(t.v)) this.no("it uses " + t.v);
        return this.look(t.v, env);
      case "group": return this.group(t.items, env);
      case "cell": return this.cellValue(t, env);
      case "chain": return this.chain(t, env);
    }
    this.no("it uses something spork can't work out");
  }
  // text made now: only from values that are the same in every run
  text(p) {
    if (p.k === "s") return p.v;
    if (this.isC(p) || this.isCB(p)) return fmt(this.val(p));
    this.no("it puts a value that changes from run to run into text");
  }
  group(items, env) {
    if (items.length === 1 && items[0].k === "chain") return this.chain(items[0], env);
    const sc = { vars: new Map(), parent: env }; let r = this.FALSE;
    for (const it of items) { if (it.k === "bind") { r = this.chain(it.val, sc); sc.vars.set(it.name, r); } else r = this.chain(it, sc); }
    return r;
  }
  cellValue(c, env) {
    if (c.names.length) return { k: "fn", ast: c, env };
    if (spkUses(c)) this.no("it uses _ or left");
    const sc = { vars: new Map(), parent: env }, parts = [], keys = [], vals = [];
    for (const it of c.items) {
      if (it.k === "bind") { const v = this.bindVal(it, sc); sc.vars.set(it.name, v); keys.push(it.name); vals.push(v); }
      else parts.push(this.chain(it, sc));
    }
    return this.cv(parts, keys, vals);
  }
  bindVal(it, sc) { const T = it.val.terms; return T.length === 1 && T[0].k === "cell" ? this.cellValue(T[0], sc) : this.chain(it.val, sc); }
  // a cell's body run in order: the last part is what it gives (genRunBody)
  runBody(items, env) {
    let last = this.FALSE;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.k === "bind") { env.vars.set(it.name, this.bindVal(it, env)); if (i === items.length - 1) return last; }
      else { const v = this.chain(it, env); if (i === items.length - 1) return v; last = v; }
    }
    return this.FALSE;
  }
  block(c, env) { if (c.names.length || spkUses(c)) this.no("a branch takes input"); return this.runBody(c.items, { vars: new Map(), parent: env }); }
  arg(t, env) { return t.k === "cell" && !t.names.length ? this.block(t, env) : this.term(t, env); }

  chain(ch, env) {
    const T = ch.terms; if (!T.length) return this.FALSE;
    let v = this.term(T[0], env);
    for (let i = 1; i < T.length; i++) {
      this.tick();
      const t = T[i];
      if (t.k === "word" && (t.v === "!" || t.v === "true" || t.v === "false")) this.no("it sends " + t.v);
      if (t.k === "word") {
        const w = t.v;
        if (FUSED.has(w) && i + 1 < T.length && !this.isName(w, env)) {
          const nt = T[++i];
          if ((w === "with" || w === "..") && nt.k === "cell" && fieldsOnly(nt)) { v = this.withf(v, nt, env); continue; }
          v = this.op(w, v, this.term(nt, env)); continue;
        }
        if (LAZYOPS.has(w) && i + 1 < T.length && !this.isName(w, env)) { const bt = T[++i]; v = this.lazy(w, v, () => this.arg(bt, env)); continue; }
        const quiet = T[i + 1] && T[i + 1].k === "word" && T[i + 1].v === "else" && T[i + 2] && !this.isName("else", env);
        v = this.word(v, w, env, quiet); continue;
      }
      if (t.k === "cell" && !t.names.length) {
        const elsePat = T[i + 1] && T[i + 1].k === "word" && T[i + 1].v === "else" && T[i + 2] && !this.isName("else", env);
        if (v.k === "b") {
          // a boolean runs the block (decision 62); else runs when the test is false or the block gives false
          if (elsePat) { const bt = T[i + 2]; i += 2; v = this.branch(v, () => this.block(t, env), () => this.arg(bt, env)); }
          else v = this.branch(v, () => this.block(t, env), null);
          continue;
        }
        // any other value is sent the cell; with else, the else sees what it gave
        const r = this.send(v, this.cellValue(t, env));
        if (elsePat) { const bt = T[i + 2]; i += 2; v = this.lazy("else", r, () => this.arg(bt, env)); } else v = r;
        continue;
      }
      v = this.send(v, this.term(t, env));
    }
    return v;
  }

  branch(c, runA, runB) {
    if (this.isCB(c)) {
      if (!this.val(c)) return runB ? runB() : this.FALSE;
      const a = runA();
      if (!runB || a.k !== "b") return a;
      if (this.isCB(a)) return this.val(a) ? a : runB();
      return this.sel(a, this.TRUE, this.under(this.not(a), runB));
    }
    // a test that changes from run to run: both sides are worked out, and each run picks one
    const a = this.under(c, runA);
    if (!runB) { if (a.k === "b") return this.and(c, a); this.no("a test without else gives false in some runs and a value in others"); }
    const pick = a.k === "b" ? this.and(c, a) : c;
    const b = this.under(this.not(pick), runB);
    return this.sel(pick, a.k === "b" ? this.TRUE : a, b);
  }
  sel(c, x, y) {
    if (this.isCB(c)) return this.val(c) ? x : y;
    if (this.same(x, y)) return x;
    if (x.k === "n" && y.k === "n") return this.num(this.node("sel", c.id, x.id, y.id));
    if (x.k === "b" && y.k === "b") return this.boo(this.node("sel", c.id, x.id, y.id));
    if (x.k === "row" && y.k === "row" && [...x.over.keys()].join("\u0000") === [...y.over.keys()].join("\u0000"))
      return { k: "row", over: new Map([...x.over].map(([k, p]) => [k, this.sel(c, p, y.over.get(k))])) };
    if (x.k === "cv" && y.k === "cv" && x.parts.length === y.parts.length && x.keys.join("\u0000") === y.keys.join("\u0000"))
      return this.cv(x.parts.map((p, j) => this.sel(c, p, y.parts[j])), x.keys, x.vals.map((p, j) => this.sel(c, p, y.vals[j])));
    this.no("a test picks between different kinds of value from run to run");
  }
  same(x, y) {
    if (x === y) return true;
    if (x.k !== y.k) return false;
    if (x.k === "n" || x.k === "b") return x.id === y.id;
    if (x.k === "s") return x.v === y.v;
    if (x.k === "fn") return x.ast === y.ast && x.env === y.env;
    if (x.k === "nat") return x.n === y.n;
    if (x.k === "any") return true;
    if (x.k === "row") return x.over.size === y.over.size && [...x.over].every(([k, p]) => y.over.has(k) && this.same(p, y.over.get(k)));
    if (x.k === "cv") return x.parts.length === y.parts.length && x.keys.join("\u0000") === y.keys.join("\u0000") &&
      x.parts.every((p, j) => this.same(p, y.parts[j])) && x.vals.every((p, j) => this.same(p, y.vals[j]));
    return false;
  }
  lazy(w, v, getB) {
    if (w === "else") {
      if (this.isFalse(v)) return getB();
      if (v.k !== "b" || this.isCB(v)) return v;
      return this.sel(v, this.TRUE, this.under(this.not(v), getB));
    }
    if (v.k !== "b") this.no("its " + w + " isn't after a test");
    const goOn = w === "and" ? v : this.not(v);
    if (this.isCB(goOn) && !this.val(goOn)) return v;
    const b = this.under(goOn, getB);
    if (b.k !== "b") this.no("its " + w + " isn't between two tests");
    return this.isCB(v) ? b : this.boo(this.node(w, v.id, b.id));
  }

  op(w, a, b) {
    if (SPK_OPS[w]) {
      if (a.k === "n" && b.k === "n") { const o = SPK_OPS[w]; return SPK_C2[o] ? this.boo(this.node(o, a.id, b.id)) : this.num(this.node(o, a.id, b.id)); }
      if (a.k === "s" && b.k === "s" && (w === "<" || w === ">")) return this.cb(w === "<" ? a.v < b.v : a.v > b.v);
      this.no("it does " + w + " on something that isn't a number");
    }
    if (w === "=" || w === "!=") { const e = this.equal(a, b); return w === "=" ? e : this.not(e); }
    if (w === "@") return this.at(a, b);
    // .. and with
    if (a.k === "s" && w === "..") return { k: "s", v: a.v + this.text(b) };
    if (a.k === "cv" && b.k === "cv" && !a.keys.includes(w)) return this.merge(a, b);
    if ((a.k === "s" || this.isC(a)) && w === "with") return { k: "s", v: this.text(a) + this.text(b) };
    if (this.isC(a) && w === "..") return { k: "s", v: this.text(a) + this.text(b) };
    this.no("it uses " + w + " on values spork can't join");
  }
  merge(a, b) {
    const keys = a.keys.slice(), vals = a.vals.slice();
    b.keys.forEach((k, j) => { const i = keys.indexOf(k); if (i < 0) { keys.push(k); vals.push(b.vals[j]); } else vals[i] = b.vals[j]; });
    return this.cv(b.parts.length ? a.parts.concat(b.parts) : a.parts, keys, vals);
  }
  withf(v, nt, env) {
    const vals = nt.items.map(x => this.chain(x.val, env));
    if (v.k === "row") { const over = new Map(v.over); nt.items.forEach((x, j) => over.set(x.name, vals[j])); return { k: "row", over }; }
    if (v.k !== "cv" || v.keys.includes("with")) this.no("it uses with on something that isn't a record");
    return this.merge(v, this.cv([], nt.items.map(x => x.name), vals));
  }
  equal(a, b) {
    // any is equal only to itself (it is how match and cond write their last case)
    if (a.k === "any" || b.k === "any") return this.cb(a.k === b.k);
    if (a.k === "n" && b.k === "n") return this.boo(this.node("eq", a.id, b.id));
    if (a.k === "b" && b.k === "b") return this.boo(this.node("beq", a.id, b.id));
    if (a.k === "s" && b.k === "s") return this.cb(a.v === b.v);
    const plain = p => p.k === "n" || p.k === "b" || p.k === "s";
    if (plain(a) && plain(b)) return this.FALSE;
    if (a.k === "cv" && b.k === "cv") {
      if (a.keys.includes("=")) this.no("it compares with a cell's own =");
      if (a.parts.length !== b.parts.length || a.keys.length !== b.keys.length) return this.FALSE;
      let r = this.TRUE;
      a.parts.forEach((p, j) => { r = this.and(r, this.equal(p, b.parts[j])); });
      for (let j = 0; j < a.keys.length; j++) { const i = b.keys.indexOf(a.keys[j]); if (i < 0) return this.FALSE; r = this.and(r, this.equal(a.vals[j], b.vals[i])); }
      return r;
    }
    if ((plain(a) && b.k === "cv") || (a.k === "cv" && plain(b))) return this.FALSE;
    this.no("it compares cells that take input");
  }
  at(a, k) {
    if (a.k === "cv") {
      const P = a.parts;
      if (this.isC(k)) { const v = P[this.val(k) - 1]; return v === undefined ? this.FALSE : v; }
      // a choice between constant positions: a choice between those parts
      if (k.k === "n" && this.nodes[k.id][0] === "sel" && this.ktree(k.id)) { const [, c, l, r] = this.nodes[k.id]; return this.sel(this.boo(c), this.at(a, this.num(l)), this.at(a, this.num(r))); }
      if (k.k !== "n" || !P.length || P.length > 256) this.no("it picks from a list with a position that isn't a number");
      // a position that changes from run to run: it must be a whole number inside the list, or spork runs the ordinary way
      const len = this.cn(P.length), one = this.cn(1);
      this.guard(this.and(this.and(this.boo(this.node("ge", k.id, one.id)), this.boo(this.node("le", k.id, len.id))), this.boo(this.node("eq", this.node("floor", k.id), k.id))));
      let r = P[P.length - 1];
      for (let j = P.length - 2; j >= 0; j--) r = this.sel(this.boo(this.node("eq", k.id, this.cn(j + 1).id)), P[j], r);
      return r;
    }
    if (a.k === "s" && this.isC(k)) { const n = this.val(k), s = a.v; return n >= 1 && n <= s.length ? { k: "s", v: s[n - 1] } : this.FALSE; }
    this.no("it uses @ on something that isn't a list");
  }

  // a word after a value: a field, then a built-in method, then a name in scope sent as the argument (SW)
  word(v, w, env, quiet) {
    if (v.k === "row") {
      // a field of an item from a list in columns: the column, unless with laid a new value over it
      if (w in SPK_CELLM || w in ALL) this.no("it uses " + w + " on a record from the list");
      if (this.isName(w, env)) this.no("it reads " + w + ", which is both a field and a name in scope");
      return v.over.has(w) ? v.over.get(w) : this.num(this.node("col", -1, -1, -1, w));
    }
    if (v.k === "cv") {
      const j = v.keys.indexOf(w);
      if (j >= 0) {
        if (this.isName(w, env)) this.no("it reads " + w + ", which is both a field and a name in scope");
        const f = v.vals[j]; if (f.k === "fn" && spkUses(f.ast)) this.no("a field uses left"); return f;
      }
      if (w in SPK_CELLM) {
        if (SPK_CELLM[w]) return { k: "wait", m: w, left: v };
        const P = v.parts;
        if (w === "length") return this.cn(P.length);
        if (w === "first") return P.length ? P[0] : this.FALSE;
        return P.length ? P[P.length - 1] : this.FALSE;
      }
    } else if (v.k === "n") {
      if (SPK_N1[w]) return this.num(this.node(w, v.id));
      if (w === "min" || w === "max") return { k: "wait", m: w, left: v };
      if (w === "times") this.no("it uses times");
    } else if (v.k === "b") {
      if (w === "not") return this.not(v);
    } else if (v.k === "s") {
      if (w === "length") return this.cn(v.v.length);
      if (w === "upper") return { k: "s", v: v.v.toUpperCase() };
      if (w === "lower") return { k: "s", v: v.v.toLowerCase() };
    } else if (v.k === "fn" || v.k === "nat") {
      if (v.k === "fn" && v.ast.items.some(x => x.k === "bind" && x.name === w)) this.no("it reads a field of a cell that takes input");
      if (w in SPK_CELLM) this.no("it uses " + w + " on a cell that takes input");
    }
    if (w === "str") return { k: "s", v: this.text(v) };
    if (w in ALL) this.no("it uses " + w + " there");
    if (this.isName(w, env)) return this.send(v, this.look(w, env));
    if (quiet) return this.FALSE;
    this.no("it reads " + w + ", which isn't there");
  }
  // a host word (circle, beep...) inside a fused each: done in each item's turn, when the tests leading to it hold
  hostCall(n, a) {
    const args = a.k === "cv" && !a.keys.length ? a.parts : [a];
    for (const x of args) if (x.k !== "n" && x.k !== "b" && x.k !== "s") this.no("the host word " + n + " is given something that isn't a number or a word");
    this.effects.push({ host: n, single: a.k !== "cv", args, cond: this.pc });
    // what the host word gives back, as when it runs: print gives its value, the others false (so an else after one runs too, decision 74)
    return n === "print" ? a : this.FALSE;
  }
  send(v, a) {
    if (v.k === "fn") {
      if (a.k === "s" && v.ast.items.some(x => x.k === "bind" && x.name === a.v)) this.no("it reads a field by name");
      return this.call(v, a);
    }
    if (v.k === "nat") return this.native(v.n, a);
    if (v.k === "host") { if (!this.effects) this.no("it uses the host word " + v.n); return this.hostCall(v.n, a); }
    if (v.k === "wait") return this.method(v.m, v.left, a);
    this.no(v.k === "n" ? "it sends a value to a number" : "it sends a value to something that isn't a cell");
  }
  call(f, a) {
    const c = f.ast, nn = c.names.length;
    if (spkUses(c)) this.no("it calls a cell that uses _ or left");
    if (++this.depth > 300) this.no("it calls itself too deeply to work out");
    const vars = new Map();
    if (nn === 1) vars.set(c.names[0].n, a);
    else {
      // several names: by position, then by name (decision 15); a missing one with no default would be false, with a lint
      if (a.k !== "cv" || a.parts.length > nn) this.no("it gives a cell the wrong number of values");
      c.names.forEach((x, j) => {
        let v = j < a.parts.length ? a.parts[j] : undefined;
        const fi = a.keys.indexOf(x.n); if (fi >= 0) v = a.vals[fi];
        if (v === undefined) { if (!x.def) this.no("it leaves out " + x.n); v = this.term(x.def, f.env); }
        vars.set(x.n, v);
      });
    }
    const r = this.runBody(c.items, { vars, parent: f.env });
    this.depth--;
    return r;
  }
  apply(f, x) { if (f.k === "fn") { if (!f.ast.names.length) this.no("it collects with a cell that has no inputs"); return this.call(f, x); } return this.send(f, x); }
  method(m, left, a) {
    if (m === "min" || m === "max") { if (a.k !== "n") this.no("its " + m + " isn't given a number"); return this.num(this.node(m, left.id, a.id)); }
    const P = left.parts;
    if (m === "@") return this.at(left, a);
    if (m === "collect" || m === "spork") return this.cv(P.map(p => this.apply(a, p)));
    if (m === "keep") {
      const o = [];
      for (const p of P) {
        const t = this.apply(a, p);
        if (!this.isCB(t)) this.no(t.k === "b" ? "keep's test changes from run to run" : "keep's test doesn't give true or false");
        if (this.val(t)) o.push(p);
      }
      return this.cv(o);
    }
    if (m === "fold") {
      if (a.k !== "cv") this.no("fold isn't given [start, cell]");
      let acc = a.parts[0] || this.FALSE; const g = a.parts[1] || this.FALSE;
      for (const p of P) acc = g.k === "fn" && g.ast.names.length === 2 ? this.call(g, this.cv([acc, p])) : this.apply(g, this.cv([acc, p]));
      return acc;
    }
    this.no("it uses " + m + " inside spork");
  }
  native(n, a) {
    const A = k => a.k === "cv" ? (a.parts[k] || this.FALSE) : k === 0 ? a : this.FALSE;
    const nums = k => { const o = []; for (let j = 0; j < k; j++) { const x = A(j); if (x.k !== "n") this.no(n + " isn't given numbers"); o.push(x); } return o; };
    if (n === "range") {
      if (!this.isC(a)) this.no("range is given a count that changes from run to run");
      const m = Math.max(0, Math.floor(this.val(a)));
      if (m > 100000) this.no("it unrolls a range that is too long");
      const P = new Array(m); for (let j = 0; j < m; j++) P[j] = this.cn(j + 1);
      return this.cv(P);
    }
    const [x, y] = nums(2);   // noise
    return this.num(this.node("noise", x.id, y.id));
  }

  // ---- the whole cell: [x | ...] whose runs each give a number, true or false, or a record of numbers
  build(c) {
    if (c.names.length !== 1 || c.names[0].def) this.no("spork runs as a kernel only for a cell with one named input");
    if (spkUses(c)) this.no("it uses _ or left");
    const x = this.num(this.node("x", -1, -1, -1));
    const r = this.runBody(c.items, { vars: new Map([[c.names[0].n, x]]), parent: { f: this.g.frames.length - 1, lim: Infinity } });
    let kind, outs, keys = null;
    if (r.k === "n") { kind = "n"; outs = [r.id]; }
    else if (r.k === "b") { kind = "b"; outs = [r.id]; }
    else if (r.k === "cv" && !r.parts.length && r.keys.length && r.vals.every(p => p.k === "n")) { kind = "rec"; keys = r.keys; outs = r.vals.map(p => p.id); }
    else this.no("each run gives something other than a number, true or false, or a record of numbers");
    return this.emit(kind, outs, keys);
  }
  // ---- loop fusion (decision 95): xs collect f keep g ... fold [start, h] (or length), as one loop over the items.
  // item is "num" (range, a list of numbers) or "row" (a list of records of numbers, in columns).
  buildPipe(stages, item) {
    // one item's work: a body that takes more than this to work out isn't worth a fused loop (spork's cells get more)
    this.why = null; this.steps = 0; this.depth = 0; this.stepCap = 20000;
    const env = { f: this.g.frames.length - 1, lim: Infinity };
    let cur = item === "num" ? this.num(this.node("x", -1, -1, -1)) : { k: "row", over: new Map() }, pass = this.TRUE;
    const fn = st => { const f = this.term(st.arg, env); if (f.k !== "fn" && f.k !== "nat") this.no(st.w + " isn't given a cell"); return f; };
    for (const st of stages) {
      if (st.w === "collect") { const f = fn(st); this.pc = pass; cur = this.apply(f, cur); }
      else if (st.w === "each") {
        // host words called for each item that passed, in order, each under the tests that lead to it
        const f = fn(st); this.pc = pass; this.effects = [];
        try { this.apply(f, cur); } finally { this.pc = this.TRUE; }
        const fx = this.effects; this.effects = null;
        if (!fx.length) this.no("each does nothing here a host word doesn't do");
        return this.emit("each", [pass.id], null, fx);
      }
      else if (st.w === "keep") {
        const f = fn(st); this.pc = pass;
        const t = this.apply(f, cur); if (t.k !== "b") this.no("keep's test doesn't give true or false");
        pass = this.and(pass, t);
      } else {
        // fold [start, h], or length: one number carried from item to item, through the items that pass
        let start, next;
        const acc = this.num(this.node("a", -1, -1, -1));
        this.pc = pass;
        if (st.w === "length") { start = this.cn(0); next = this.num(this.node("add", acc.id, this.cn(1).id)); }
        else {
          this.pc = this.TRUE; const arg = this.term(st.arg, env); this.pc = pass;
          if (arg.k !== "cv" || arg.parts.length < 2) this.no("fold isn't given [start, cell]");
          start = arg.parts[0]; const h = arg.parts[1];
          if (start.k !== "n") this.no("fold starts from something that isn't a number");
          next = h.k === "fn" && h.ast.names.length === 2 ? this.call(h, this.cv([acc, cur])) : this.apply(h, this.cv([acc, cur]));
          if (next.k !== "n") this.no("fold's cell doesn't give a number");
        }
        this.pc = this.TRUE;
        return this.emit("fold", [start.id, this.sel(pass, next, acc).id], null);
      }
    }
    this.pc = this.TRUE;
    if (cur.k === "n") return this.emit("n", [pass.id, cur.id], null);
    if (cur.k === "b") return this.emit("b", [pass.id, cur.id], null);
    if (cur.k === "cv" && !cur.parts.length && cur.keys.length && cur.vals.every(p => p.k === "n")) return this.emit("rec", [pass.id, ...cur.vals.map(p => p.id)], cur.keys);
    if (cur.k === "row" && [...cur.over.values()].every(p => p.k === "n")) return this.emit("row", [pass.id, ...[...cur.over.values()].map(p => p.id)], [...cur.over.keys()]);
    this.no("each item gives something other than a number, true or false, or a record of numbers");
  }
  // keep only the steps the answer needs, numbered afresh, as a JavaScript literal
  emit(kind, outs, keys, fx) {
    const N = this.nodes, live = new Uint8Array(N.length);
    for (const i of outs.concat(this.guards)) live[i] = 1;
    if (fx) for (const e of fx) { live[e.cond.id] = 1; for (const a of e.args) if (a.k !== "s") live[a.id] = 1; }
    for (let i = N.length - 1; i >= 0; i--) if (live[i]) { const [, a, b, c] = N[i]; if (a >= 0) live[a] = 1; if (b >= 0) live[b] = 1; if (c >= 0) live[c] = 1; }
    const map = new Int32Array(N.length).fill(-1), out = []; let jsOnly = false;
    for (let i = 0; i < N.length; i++) if (live[i]) {
      const [op, a, b, c, v] = N[i]; map[i] = out.length;
      if (SPK_JSONLY.has(op)) jsOnly = true;
      const lit = v === undefined ? "" : "," + (typeof v === "number" ? spkNum(v) : typeof v === "string" ? JSON.stringify(v) : String(v));
      out.push("[\"" + op + "\"," + (a >= 0 ? map[a] : -1) + "," + (b >= 0 ? map[b] : -1) + "," + (c >= 0 ? map[c] : -1) + lit + "]");
    }
    const g = [...new Set(this.guards)].map(i => map[i]);
    const fxs = fx ? ",fx:[" + fx.map(e => "{host:" + JSON.stringify(e.host) + ",single:" + e.single + ",cond:" + map[e.cond.id] + ",args:[" +
      e.args.map(a => a.k === "s" ? JSON.stringify(a.v) : String(map[a.id])).join(",") + "]}").join(",") + "]" : "";
    return "{nodes:[" + out.join(",") + "],outs:[" + outs.map(i => map[i]).join(",") + "],guards:[" + g.join(",") + "],kind:\"" + kind + "\"" +
      (keys ? ",keys:" + JSON.stringify(keys) : "") + fxs + ",jsOnly:" + jsOnly + "}";
  }
}
// a run of collect, keep and fold steps (each given a cell, or a name), and length at the end, starting at T[i]
const FUSE_STEPS = new Set(["collect", "keep", "fold", "each"]);
function fuseSegment(T, i) {
  let j = i; const stages = [];
  while (j + 1 < T.length && T[j].k === "word" && FUSE_STEPS.has(T[j].v) &&
    (T[j + 1].k === "cell" || (T[j + 1].k === "word" && !FUSED.has(T[j + 1].v) && !LAZYOPS.has(T[j + 1].v) && !(T[j + 1].v in ALL) && !["!", "true", "false", "_", "left", "right"].includes(T[j + 1].v)))) {
    stages.push({ w: T[j].v, arg: T[j + 1], line: T[j].line }); j += 2;
    if (T[j - 2].v === "fold" || T[j - 2].v === "each") break;
  }
  if (stages.length && stages[stages.length - 1].w !== "fold" && stages[stages.length - 1].w !== "each" && j < T.length && T[j].k === "word" && T[j].v === "length") { stages.push({ w: "length", line: T[j].line }); j++; }
  if (!stages.length) return null;
  return { stages, start: i, end: j };
}
// the first and last line a piece of the tree is on
function lineSpan(n) {
  let lo = Infinity, hi = -Infinity;
  (function walk(x) { if (!x || typeof x !== "object") return; if (typeof x.line === "number" && x.line > 0) { lo = Math.min(lo, x.line); hi = Math.max(hi, x.line); } for (const k in x) if (!NOTE_KEYS.has(k) || k === "line") { const v = x[k]; if (v && typeof v === "object") walk(v); } })(n);
  return [lo, hi];
}
// names from outside that couldn't be worked out ahead, remembered for the rest of the compile (each frame is one object)
function spkTooBig(gen, f, n, mark) {
  const fr = gen.frames[f], m = (gen.spkNo || (gen.spkNo = new WeakMap())).get(fr) || new Set();
  if (mark) { m.add(n); gen.spkNo.set(fr, m); }
  return m.has(n);
}
// where a name sits among a frame's names, in the order they were bound
function spkPos(names, n) { let i = 0; for (const k of names.keys()) { if (k === n) return i; i++; } return -1; }
// does a cell (or anything in it) use _ or left?
const SPK_IT = new Set(["_", "left", "right"]);
function spkUses(c) { if (c.spkUses === undefined) c.spkUses = mentions(c, SPK_IT); return c.spkUses; }


// the cells spork is given: by name (spork one-run), or written in place (spork [n | ...]); and each cell bound to a name
function sporkTargets(ast) {
  const names = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if (n.k === "chain") {
      const T = n.terms;
      for (let i = 0; i + 1 < T.length; i++) if (T[i].k === "word" && T[i].v === "spork") { const t = T[i + 1]; if (t.k === "word") names.add(t.v); else if (t.k === "cell") t.sporkArg = true; }
    }
    if (n.k === "bind" && n.val && n.val.terms && n.val.terms.length === 1 && n.val.terms[0].k === "cell") n.val.terms[0].bindName = n.name;
    for (const key in n) if (!NOTE_KEYS.has(key)) walk(n[key]);
  })(ast);
  return names;
}


// ---- spork (decision 47): a parallel collect. A pure cell worked out ahead (decision 91) runs as one numeric kernel,
// on the fastest way this machine has; anything else is collect.
let SPORK = { info: null, wasm: undefined, gpu: null, tally: [] };
const sporkRan = info => { SPORK.info = info; if (SPORK.tally.length < 50) SPORK.tally.push(info); };
function spork(xs, f) {
  if (f instanceof Cell && f.kn && f.kn.s) { const r = runSpork(f.kn.s, xs); if (r) return r; }
  const t0 = nowMs(), r = I.collect(xs, f);
  sporkRan({ n: isCell(xs) ? xs.count() : 0, how: "collect", ms: nowMs() - t0, steps: 0 });
  return r;
}
const nowMs = () => typeof performance !== "undefined" ? performance.now() : Date.now();
function runSpork(s, xs) {
  const K = s.k;
  let n, X = null;
  if (xs instanceof RCell) n = xs.n;
  else if (xs instanceof NCell) { X = xs.a; n = X.length; }
  else if (xs instanceof VCell && !(xs instanceof ColCell) && xs.fs === ROOT) {
    const p = xs.parts; n = p.length; X = new Float64Array(n);
    for (let i = 0; i < n; i++) { const v = p[i]; if (typeof v !== "number") return null; X[i] = v; }
  } else return null;
  if (n === 0) return VP([]);
  const C = s.caps();
  for (let i = 0; i < C.length; i++) if (typeof C[i] !== "number") return null;
  const t0 = nowMs(); let O = null, how = "";
  // the GPU (32-bit maths) only when the host allows it; else WebAssembly SIMD; else JavaScript. The last two give the same answer.
  if (SPORK.gpu && !K.jsOnly) { O = SPORK.gpu(K, n, X, C) || null; if (O) how = "gpu"; }
  if (SPORK.wasm === undefined) SPORK.wasm = wasmSpork();
  if (!O && SPORK.wasm && !K.jsOnly && n >= 16) { O = SPORK.wasm(K, n, X, C); how = "simd"; if (!O) return null; }
  if (!O) { O = K.outs.map(() => new Float64Array(n)); how = "js"; if (!spkJS(K)(n, X, C, O)) return null; }
  sporkRan({ n, how, ms: how === "gpu" && O.ms !== undefined ? O.ms : nowMs() - t0, steps: K.nodes.length });
  if (K.kind === "n") return new NCell(O[0]);
  if (K.kind === "b") { const o = new Array(n), a = O[0]; for (let i = 0; i < n; i++) o[i] = a[i] !== 0; return VP(o); }
  return new ColCell(shapeFor(K.keys), O, n);
}
// ---- loop fusion (decision 95): a run of collect, keep, fold and length over range, a list of numbers or a list of
// records of numbers, as one loop with no lists in between. NOFUSE means the steps run as written.
const NOFUSE = { fuse: "no" };
function FUSE(xs, F, caps) {
  if (!I.fast()) return NOFUSE;
  let K, n, X = null, cols = null, rs = null;
  if (xs instanceof RCell) { K = F.num; n = xs.n; }
  else if (xs instanceof NCell) { K = F.num; X = xs.a; n = X.length; }
  else if (xs instanceof ColCell) { K = F.row; cols = xs.cols; rs = xs.rs; n = xs.n; }
  else if (xs instanceof VCell && xs.fs === ROOT) {
    const p = xs.parts; n = p.length;
    if (!n) return NOFUSE;
    if (typeof p[0] === "number") { K = F.num; X = new Float64Array(n); for (let i = 0; i < n; i++) { const v = p[i]; if (typeof v !== "number") return NOFUSE; X[i] = v; } }
    else { const c = toCols(xs); if (!c) return NOFUSE; K = F.row; cols = c.cols; rs = c.rs; n = c.n; }
  } else return NOFUSE;
  // a short list is quicker as written
  if (!K || n < 16) return NOFUSE;
  if (rs && K.keys && K.keys.length && rs.index("with") >= 0) return NOFUSE;
  const C = caps ? caps() : EMPTY;
  for (let i = 0; i < C.length; i++) if (typeof C[i] !== "number") return NOFUSE;
  const f = fuseJS(K);
  if (K.kind === "fold") return f(n, X, cols, rs, C, null, null);
  if (K.kind === "each") {
    const H = [];
    for (const e of K.fx) {
      const h = G[e.host], k = e.args.length;
      if (!(h instanceof Native)) return NOFUSE;
      H.push(e.single ? h.fn : h.direct && h.direct.length === k ? h.direct : (...xs) => h.fn(VP(xs)));
    }
    return f(n, X, cols, rs, C, H, null) === NOFUSE ? NOFUSE : false;
  }
  const O = K.outs.slice(1).map(() => new Float64Array(n)), kept = K.kind === "row" ? new Uint32Array(n) : null;
  const m = f(n, X, cols, rs, C, O, kept);
  if (m === NOFUSE) return NOFUSE;
  // when every item passed, the arrays are already the right length, and unchanged columns can be shared (columns never change)
  const cut = o => m === n ? o : o.slice(0, m);
  if (K.kind === "n") return new NCell(cut(O[0]));
  if (K.kind === "b") { const o = new Array(m); for (let i = 0; i < m; i++) o[i] = O[0][i] !== 0; return VP(o); }
  if (K.kind === "rec") return new ColCell(shapeFor(K.keys), O.map(cut), m);
  // records from the list, with any fields laid over by with: unchanged columns are gathered for the items that passed
  let out = rs; for (const k of K.keys) if (out.index(k) < 0) out = out.add(k);
  const oc = out.keys.map((k, j) => {
    const o = K.keys.indexOf(k); if (o >= 0) return cut(O[o]);
    const src = cols[j]; if (m === n) return src;
    const g = new Float64Array(m); for (let q = 0; q < m; q++) g[q] = src[kept[q]]; return g;
  });
  return new ColCell(out, oc, m);
}
function fuseJS(K) {
  if (K.jsF) return K.jsF;
  const N = K.nodes, inv = new Uint8Array(N.length), r = i => "v" + i;
  let pre = "", body = "";
  for (let i = 0; i < N.length; i++) {
    const [op, a, b, c, v] = N[i];
    let e;
    if (op === "a") e = "acc";
    else if (op === "col") { pre += "const c" + i + "=cols[rs.index(" + JSON.stringify(v) + ")];if(c" + i + "===undefined)return NOFUSE;"; e = "c" + i + "[i]"; }
    else e = spkExpr(N[i], r);
    inv[i] = op !== "x" && op !== "a" && op !== "col" && (a < 0 || inv[a]) && (b < 0 || inv[b]) && (c < 0 || inv[c]) ? 1 : 0;
    if (inv[i]) pre += "const v" + i + "=" + e + ";"; else body += "const v" + i + "=" + e + ";";
  }
  const g = K.guards.length ? "if(!(" + K.guards.map(r).join("&&") + "))return NOFUSE;" : "";
  let src;
  if (K.kind === "fold") src = pre + "let acc=" + r(K.outs[0]) + ";" + spkLoop(body + g + "acc=" + r(K.outs[1]) + ";") + "return acc";
  else if (K.kind === "each") src = pre + "const " + K.fx.map((e, j) => "h" + j + "=O[" + j + "]").join(",") + ";" + spkLoop(body + g +
    "if(" + r(K.outs[0]) + "){" + K.fx.map((e, j) => "if(" + r(e.cond) + ")h" + j + "(" + e.args.map(a => typeof a === "string" ? JSON.stringify(a) : r(a)).join(",") + ");").join("") + "}") + "return false";
  else src = pre + "let m=0;" + (K.outs.length > 1 ? "const " + K.outs.slice(1).map((o, j) => "O" + j + "=O[" + j + "]").join(",") + ";" : "") + spkLoop(body + g + "if(" + r(K.outs[0]) + "){" +
    K.outs.slice(1).map((o, j) => "O" + j + "[m]=" + (K.kind === "b" ? r(o) + "?1:0" : r(o)) + ";").join("") + (K.kind === "row" ? "kept[m]=i;" : "") + "m++}") + "return m";
  const f = new Function("NOISE", "NOFUSE", "n", "X", "cols", "rs", "C", "O", "kept", src);
  return (K.jsF = (n, X, cols, rs, C, O, kept) => f(NOISE, NOFUSE, n, X, cols, rs, C, O, kept));
}
// the loop over the items, written twice: over a list of numbers (X), or over range's own numbers.
// (One loop asking X ? X[i] : i + 1 each time runs about ten times slower when X is null.)
const spkLoop = body => "if(X){for(let i=0;i<n;i++){const x=X[i];" + body + "}}else{for(let i=0;i<n;i++){const x=i+1;" + body + "}}";
// one step of a kernel as a JavaScript expression
function spkExpr(node, r) {
  const [op, a, b, c, v] = node;
  switch (op) {
    case "c": return spkNum(v); case "cb": return String(v);
    case "x": return "x"; case "k": return "C[" + v + "]";
    case "add": return r(a) + "+" + r(b); case "sub": return r(a) + "-" + r(b);
    case "mul": return r(a) + "*" + r(b); case "div": return r(a) + "/" + r(b);
    case "mod": return "((" + r(a) + "%" + r(b) + ")+" + r(b) + ")%" + r(b);
    case "min": case "max": return "Math." + op + "(" + r(a) + "," + r(b) + ")";
    case "noise": return "NOISE(" + r(a) + "," + r(b) + ")";
    case "neg": return "-" + r(a);
    case "abs": case "floor": case "ceil": case "round": case "sqrt": case "sin": case "cos": case "tan": case "log": return "Math." + op + "(" + r(a) + ")";
    case "lt": return r(a) + "<" + r(b); case "gt": return r(a) + ">" + r(b);
    case "le": return r(a) + "<=" + r(b); case "ge": return r(a) + ">=" + r(b);
    case "eq": case "beq": return r(a) + "===" + r(b); case "ne": return r(a) + "!==" + r(b);
    case "and": return r(a) + "&&" + r(b); case "or": return r(a) + "||" + r(b); case "not": return "!" + r(a);
    case "sel": return r(a) + "?" + r(b) + ":" + r(c);
  }
  throw new Error("kernel step " + op);
}
// the kernel as JavaScript: one loop; steps that don't depend on the input are worked out before it
function spkJS(K) {
  if (K.jsF) return K.jsF;
  const N = K.nodes, inv = new Uint8Array(N.length), r = i => "v" + i;
  let pre = "", body = "";
  for (let i = 0; i < N.length; i++) {
    const [op, a, b, c, v] = N[i]; let e;
    switch (op) {
      case "c": e = spkNum(v); break; case "cb": e = String(v); break;
      case "x": e = "x"; break; case "k": e = "C[" + v + "]"; break;
      case "add": e = r(a) + "+" + r(b); break; case "sub": e = r(a) + "-" + r(b); break;
      case "mul": e = r(a) + "*" + r(b); break; case "div": e = r(a) + "/" + r(b); break;
      case "mod": e = "((" + r(a) + "%" + r(b) + ")+" + r(b) + ")%" + r(b); break;
      case "min": case "max": e = "Math." + op + "(" + r(a) + "," + r(b) + ")"; break;
      case "noise": e = "NOISE(" + r(a) + "," + r(b) + ")"; break;
      case "neg": e = "-" + r(a); break;
      case "abs": case "floor": case "ceil": case "round": case "sqrt": case "sin": case "cos": case "tan": case "log": e = "Math." + op + "(" + r(a) + ")"; break;
      case "lt": e = r(a) + "<" + r(b); break; case "gt": e = r(a) + ">" + r(b); break;
      case "le": e = r(a) + "<=" + r(b); break; case "ge": e = r(a) + ">=" + r(b); break;
      case "eq": case "beq": e = r(a) + "===" + r(b); break; case "ne": e = r(a) + "!==" + r(b); break;
      case "and": e = r(a) + "&&" + r(b); break; case "or": e = r(a) + "||" + r(b); break; case "not": e = "!" + r(a); break;
      case "sel": e = r(a) + "?" + r(b) + ":" + r(c); break;
      default: throw new Error("spork step " + op);
    }
    inv[i] = op !== "x" && (a < 0 || inv[a]) && (b < 0 || inv[b]) && (c < 0 || inv[c]) ? 1 : 0;
    if (inv[i]) pre += "const v" + i + "=" + e + ";"; else body += "const v" + i + "=" + e + ";";
  }
  const g = K.guards.length ? "if(!(" + K.guards.map(r).join("&&") + "))return false;" : "";
  const st = K.outs.map((o, j) => "O" + j + "[i]=" + (K.kind === "b" ? r(o) + "?1:0" : r(o)) + ";").join("");
  const f = new Function("NOISE", "n", "X", "C", "O", "const " + K.outs.map((o, j) => "O" + j + "=O[" + j + "]").join(",") + ";" + pre +
    spkLoop(body + g + st) + "return true");
  return (K.jsF = (n, X, C, O) => f(NOISE, n, X, C, O));
}
// ---- the kernel as WebAssembly SIMD: two runs per instruction, in f64x2, so every step is the same IEEE double step
// JavaScript takes and the answers match bit for bit. noise is the same 32-bit hash, done in i32x4 lanes.
// run(n, xp, cp, op, stride): inputs at xp (0 for range), outside numbers at cp, each output at op + j * stride.
const WB = {
  u: n => { const o = []; do { let b = n & 127; n >>>= 7; if (n) b |= 128; o.push(b); } while (n); return o; },
  s: n => { const o = []; for (;;) { const b = n & 127; n >>= 7; if ((n === 0 && !(b & 64)) || (n === -1 && (b & 64))) { o.push(b); return o; } o.push(b | 128); } },
  f64: v => Array.from(new Uint8Array(new Float64Array([v]).buffer)),
  str: s => [...WB.u(s.length), ...Array.from(s, ch => ch.charCodeAt(0))],
  sec: (id, body) => [id, ...WB.u(body.length), ...body],
};
const V = op => [0xfd, ...WB.u(op)];   // a SIMD instruction
const VOP = { add: 0xf0, sub: 0xf1, mul: 0xf2, div: 0xf3, min: 0xf4, max: 0xf5, abs: 0xec, neg: 0xed, sqrt: 0xef, floor: 0x75, ceil: 0x74,
  eq: 0x47, ne: 0x48, lt: 0x49, gt: 0x4a, le: 0x4b, ge: 0x4c, not: 0x4d, and: 0x4e, or: 0x50, xor: 0x51, sel: 0x52, any: 0x53,
  ishru: 0xad, imul: 0xb5, splat: 0x14, isplat: 0x11, toU: 0xfd, fromU: 0xff, load: 0x00, store: 0x0b, konst: 0x0c };
const vconst = bytes => [...V(VOP.konst), ...bytes];
const f2 = (a, b) => vconst([...WB.f64(a), ...WB.f64(b === undefined ? a : b)]);
const i4 = c => { const b = new Uint8Array(16), d = new DataView(b.buffer); for (let j = 0; j < 4; j++) d.setInt32(j * 4, c | 0, true); return vconst(Array.from(b)); };
const SIGN = vconst([0, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, 0, 0, 0, 0, 0, 0x80]);
const ALL1 = vconst(new Array(16).fill(255));
const ALL0 = vconst(new Array(16).fill(0));

function spkWasmBytes(K) {
  const N = K.nodes;
  // locals: 0 n, 1 xp, 2 cp, 3 op, 4 stride (params); 5 i; then one per output base; then v128s
  const P_N = 0, P_X = 1, P_C = 2, P_O = 3, P_S = 4, L_I = 5, L_OB = 6, nOut = K.outs.length;
  let nv = L_OB + nOut; const v128 = () => nv++;
  const IV = v128(), XV = v128(), BAD = v128(), NV = v128(), T0 = v128(), T1 = v128(), T2 = v128(), T3 = v128(), T4 = v128();
  const loc = new Int32Array(N.length).fill(-1), inv = new Uint8Array(N.length);
  const get = l => [0x20, ...WB.u(l)], set = l => [0x21, ...WB.u(l)], tee = l => [0x22, ...WB.u(l)];
  const push = i => { const [op, , , , v] = N[i]; if (op === "c") return f2(v); if (op === "cb") return v ? ALL1 : ALL0; if (op === "x") return get(XV); return get(loc[i]); };
  // floor(v) mod 2^32, as the bits of a 32-bit integer (JavaScript's ToInt32), in i32 lanes 0 and 1
  const u32 = code => [...code, ...tee(T4), ...get(T4), ...f2(1 / 4294967296), ...V(VOP.mul), ...V(VOP.floor), ...f2(4294967296), ...V(VOP.mul), ...V(VOP.sub), ...V(VOP.toU)];
  const xs16 = s => [...tee(T4), ...get(T4), 0x41, ...WB.s(s), ...V(VOP.ishru), ...V(VOP.xor)];   // h ^= h >>> s
  const step = i => {
    const [op, a, b, c, v] = N[i];
    switch (op) {
      case "c": case "cb": case "x": return [];
      case "k": return [0x20, ...WB.u(P_C), 0x2b, 3, ...WB.u(v * 8), ...V(VOP.splat)];
      case "add": case "sub": case "mul": case "div": case "min": case "max": case "lt": case "gt": case "le": case "ge": case "eq": case "ne": case "and": case "or":
        return [...push(a), ...push(b), ...V(VOP[op])];
      case "neg": case "abs": case "sqrt": case "floor": case "ceil": case "not": return [...push(a), ...V(VOP[op])];
      case "beq": return [...push(a), ...push(b), ...V(VOP.xor), ...V(VOP.not)];
      case "sel": return [...push(b), ...push(c), ...push(a), ...V(VOP.sel)];
      case "round":
        // Math.round: floor, plus one when the rest is at least a half; a zero keeps the sign of its input
        return [...push(a), ...V(VOP.floor), ...set(T0),
          ...get(T0), ...f2(1), ...V(VOP.add), ...get(T0), ...push(a), ...get(T0), ...V(VOP.sub), ...f2(0.5), ...V(VOP.ge), ...V(VOP.sel), ...set(T1),
          ...push(a), ...SIGN, ...V(VOP.and), ...get(T1), ...get(T1), ...f2(0), ...V(VOP.eq), ...V(VOP.sel)];
      case "noise":
        return [...push(a), ...set(T0), ...push(b), ...set(T1), ...get(T0), ...V(VOP.floor), ...set(T2), ...get(T1), ...V(VOP.floor), ...set(T3),
          ...u32(get(T2)), ...i4(0x9e3779b9), ...V(VOP.xor), ...i4(0x85ebca6b), ...V(VOP.imul),
          ...u32([...get(T3), ...f2(0x632be5ab), ...V(VOP.add)]), ...i4(0xc2b2ae35), ...V(VOP.imul), ...V(VOP.xor),
          // the fraction times 2^32 can round up to 2^32 itself (x = -1e-300), which JavaScript wraps to 0, so it is wrapped here too
          ...u32([...get(T0), ...get(T2), ...V(VOP.sub), ...f2(4294967296), ...V(VOP.mul)]), ...i4(0x27d4eb2f), ...V(VOP.imul), ...V(VOP.xor),
          ...u32([...get(T1), ...get(T3), ...V(VOP.sub), ...f2(4294967296), ...V(VOP.mul)]), ...i4(0x165667b1), ...V(VOP.imul), ...V(VOP.xor),
          ...xs16(16), ...i4(0x7feb352d), ...V(VOP.imul), ...xs16(15), ...i4(0x846ca68b), ...V(VOP.imul), ...xs16(16),
          ...V(VOP.fromU), ...f2(1 / 4294967296), ...V(VOP.mul)];
    }
    throw new Error("no SIMD step for " + op);
  };
  for (let i = 0; i < N.length; i++) {
    const [op, a, b, c] = N[i];
    inv[i] = op !== "x" && (a < 0 || inv[a]) && (b < 0 || inv[b]) && (c < 0 || inv[c]) ? 1 : 0;
    if (op !== "c" && op !== "cb" && op !== "x") loc[i] = v128();
  }
  const code = [];
  // before the loop: output bases, the lane numbers [0, 1], n in both lanes, and every step that doesn't depend on the input
  K.outs.forEach((o, j) => code.push(...get(P_O), ...get(P_S), 0x41, ...WB.s(j), 0x6c, 0x6a, ...set(L_OB + j)));
  code.push(...f2(0, 1), ...set(IV), ...get(P_N), 0xb7, ...V(VOP.splat), ...set(NV), ...ALL0, ...set(BAD));
  for (let i = 0; i < N.length; i++) if (inv[i] && loc[i] >= 0) code.push(...step(i), ...set(loc[i]));
  code.push(0x02, 0x40, 0x03, 0x40, ...get(L_I), ...get(P_N), 0x4e, 0x0d, 1);
  // this pair's input: from memory, or the range's own numbers
  code.push(...get(P_X), 0x04, 0x40, ...get(P_X), ...get(L_I), 0x41, 3, 0x74, 0x6a, ...V(VOP.load), 4, 0, ...set(XV),
    0x05, ...get(IV), ...f2(1), ...V(VOP.add), ...set(XV), 0x0b);
  for (let i = 0; i < N.length; i++) if (!inv[i] && loc[i] >= 0) code.push(...step(i), ...set(loc[i]));
  // a check that fails in a real lane (not the spare one past n) means the ordinary way
  for (const g of K.guards) code.push(...get(BAD), ...push(g), ...V(VOP.not), ...get(IV), ...get(NV), ...V(VOP.lt), ...V(VOP.and), ...V(VOP.or), ...set(BAD));
  K.outs.forEach((o, j) => {
    code.push(...get(L_OB + j), ...get(L_I), 0x41, 3, 0x74, 0x6a);
    if (K.kind === "b") code.push(...f2(1), ...f2(0), ...push(o), ...V(VOP.sel)); else code.push(...push(o));
    code.push(...V(VOP.store), 4, 0);
  });
  code.push(...get(IV), ...f2(2), ...V(VOP.add), ...set(IV), ...get(L_I), 0x41, 2, 0x6a, ...set(L_I), 0x0c, 0, 0x0b, 0x0b);
  code.push(...get(BAD), ...V(VOP.any), 0x45, 0x0b);
  const locals = [...WB.u(2), ...WB.u(1 + nOut), 0x7f, ...WB.u(nv - L_I - 1 - nOut), 0x7b];
  const body = [...locals, ...code];
  return new Uint8Array([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    ...WB.sec(1, [1, 0x60, 5, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 1, 0x7f]),
    ...WB.sec(2, [1, ...WB.str("m"), ...WB.str("mem"), 0x02, 0x00, 1]),
    ...WB.sec(3, [1, 0]),
    ...WB.sec(7, [1, ...WB.str("run"), 0x00, 0]),
    ...WB.sec(10, [1, ...WB.u(body.length), ...body])]);
}
// the WebAssembly way, if this machine has SIMD: one memory, grown as needed; each kernel is made once
function wasmSpork() {
  if (typeof WebAssembly === "undefined") return null;
  try { if (!WebAssembly.validate(spkWasmBytes({ nodes: [["x", -1, -1, -1], ["sqrt", 0, -1, -1]], outs: [1], guards: [], kind: "n" }))) return null; } catch (e) { return null; }
  const mem = new WebAssembly.Memory({ initial: 1 }), made = new WeakMap();
  return (K, n, X, C) => {
    let inst = made.get(K);
    if (inst === undefined) {
      try { inst = new WebAssembly.Instance(new WebAssembly.Module(spkWasmBytes(K)), { m: { mem } }); } catch (e) { inst = null; }
      made.set(K, inst);
    }
    if (!inst) return null;
    const n2 = n + (n & 1), stride = n2 * 8, cp = 16, xp = cp + ((C.length * 8 + 15) & ~15), op = xp + (X ? stride + 16 : 0);
    const need = op + K.outs.length * stride + 64, have = mem.buffer.byteLength;
    if (need > have) mem.grow(Math.ceil((need - have) / 65536));
    new Float64Array(mem.buffer, cp, C.length).set(C);
    if (X) { const xv = new Float64Array(mem.buffer, xp, n2); xv.set(X); if (n2 > n) xv[n] = 0; }
    if (!inst.exports.run(n, X ? xp : 0, cp, op, stride)) return null;
    return K.outs.map((o, j) => new Float64Array(mem.buffer, op + j * stride, n).slice());
  };
}
// numbers in the same order as a typed array's own sort (-0 before 0, NaN last), by radix: four passes of 16 bits
function sortF64(src) {
  const n = src.length;
  if (n < 512) return Float64Array.from(src).sort();
  let m = 0, nan = 0; const a = new Float64Array(n);
  for (let i = 0; i < n; i++) { const v = src[i]; if (v !== v) nan++; else a[m++] = v; }
  let A = new Uint32Array(a.buffer, 0, m * 2), B = new Uint32Array(m * 2);
  // the bits of a double, turned so that unsigned order is number order
  for (let i = 0; i < m; i++) { const hi = A[2 * i + 1]; if (hi & 0x80000000) { A[2 * i + 1] = ~hi; A[2 * i] = ~A[2 * i]; } else A[2 * i + 1] = hi | 0x80000000; }
  const count = new Uint32Array(65536);
  for (let d = 0; d < 4; d++) {
    const w = d >> 1, sh = (d & 1) * 16;
    count.fill(0);
    for (let i = 0; i < m; i++) count[(A[2 * i + w] >>> sh) & 0xffff]++;
    let sum = 0; for (let k = 0; k < 65536; k++) { const c = count[k]; count[k] = sum; sum += c; }
    for (let i = 0; i < m; i++) { const j = count[(A[2 * i + w] >>> sh) & 0xffff]++; B[2 * j] = A[2 * i]; B[2 * j + 1] = A[2 * i + 1]; }
    const t = A; A = B; B = t;
  }
  for (let i = 0; i < m; i++) { const hi = A[2 * i + 1]; if (hi & 0x80000000) A[2 * i + 1] = hi & 0x7fffffff; else { A[2 * i + 1] = ~hi; A[2 * i] = ~A[2 * i]; } }
  const out = new Float64Array(n); out.set(new Float64Array(A.buffer, A.byteOffset, m)); out.fill(NaN, m);
  return out;
}


// ===================================================================== plugging into the compiler
// a cell that spork is given, by name or written in place: worked out now into one kernel (decision 91)
function sporkCell(gen, c) {
  if (!(c.sporkArg || (c.bindName && gen.sporkNames && gen.sporkNames.has(c.bindName)))) return null;
  const P = new Spk(gen);
  let code = null;
  try { code = P.build(c); } catch (e) { if (e !== SPKFAIL) throw e; }
  const ok = code ? true : P.why || "it can't be worked out ahead";
  c.sporkWhy = ok;
  if (c.bindName) (gen.sporkWhy || (gen.sporkWhy = new Map())).set(c.bindName, ok);
  if (!code) return null;
  // the loops inside it were unrolled when it was worked out, so their speed notes don't apply
  const span = lineSpan(c); gen.speed = gen.speed.filter(x => x.line < span[0] || x.line > span[1]);
  const name = "SK" + gen.consts.length;
  gen.consts.push("const " + name + "=" + code + ";");
  return "{s:{k:" + name + ",caps:()=>[" + P.caps.join(",") + "]}}";
}
// spork's speed note: given a name or a cell written in place
function sporkNote(gen, T, i) {
  const pw = T[i - 1], t = T[i];
  if (!pw || pw.k !== "word" || pw.v !== "spork") return;
  const r = t.k === "word" && gen.sporkWhy ? gen.sporkWhy.get(t.v) : t.k === "cell" ? t.sporkWhy : undefined;
  if (r !== undefined) gen.speed.push({ line: pw.line || 0, word: "spork", fast: r === true, why: r === true ? "" : r });
}
function prescan(gen, ast) { gen.sporkNames = sporkTargets(ast); }
// the fused loop, tried first; the steps as written are the way back when it can't run (NOFUSE)
function fuseWrap(gen, seg, ordinary) {
  const P = new Spk(gen), K = {}, why = {};
  for (const item of ["num", "row"]) {
    try { K[item] = P.buildPipe(seg.stages, item); } catch (e) { if (e !== SPKFAIL) throw e; K[item] = null; why[item] = P.why; }
  }
  const words = seg.stages.map(st => st.w), line = seg.stages[0].line || 0;
  if (!K.num && !K.row) {
    gen.speed.push({ line, word: words.join(" "), fast: false, why: why.row || why.num || "it can't be worked out ahead" });
    return "(" + seg.ta + "=" + seg.src + "," + ordinary + ")";
  }
  const name = "FK" + gen.consts.length, tf = gen.tmp();
  gen.consts.push("const " + name + "={num:" + (K.num || "null") + ",row:" + (K.row || "null") + "};");
  gen.speed.push({ line, word: words.join(" "), fast: true, why: "" });
  return "((" + tf + "=FUSE((" + seg.ta + "=" + seg.src + ")," + name + "," + (P.caps.length ? "()=>[" + P.caps.join(",") + "]" : "null") + "))!==NOFUSE?" + tf + ":" + ordinary + ")";
}

S.install({
  cell: sporkCell, note: sporkNote, prescan, fuse: { find: fuseSegment, wrap: fuseWrap },
  spork, sortNumbers: sortF64, runtime: { FUSE, NOFUSE },
});
// spork's API: how the last one ran, and the ways it can run (decision 91); the GPU plugs in here (decision 93)
Object.defineProperty(S, "sporkInfo", { get: () => SPORK.info, configurable: true });
S.sporkTally = reset => { const t = SPORK.tally; if (reset) SPORK.tally = []; return t; };
S.sporkWays = w => { if (SPORK.wasm === undefined) SPORK.wasm = wasmSpork(); Object.assign(SPORK, w); return SPORK; };
S.kernels = { Spk, spkJS, spkWasmBytes, fuseJS };
if (typeof module !== "undefined") module.exports = S.kernels;
})(typeof window !== "undefined" ? window : globalThis);
