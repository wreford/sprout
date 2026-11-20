// Sprout 3: compiler (Sprout -> JavaScript) and runtime, built from the design decisions in spec.md (1-69).
// One file, no dependencies. Works in the browser and in node.
(function (root) {
"use strict";

// ===================================================================== tokens
// Tokens: {t:"num",v} {t:"str",v} {t:"tmpl",parts:[string|{eager,src}]} {t:"word",v}
// and the punctuation strings "[" "]" "(" ")" "," "|" ":" "\n".
// A new line plus a deeper indent opens "[" (decision 59); a shallower one closes it.
const WORDSTOP = " \t[](),|:\"";

function lexLine(s, lineNo, out) {
  let i = 0; const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === " " || c === "\t") { i++; continue; }
    if (c === "-" && s[i + 1] === "-") break; // comment to the end of the line
    if ("[](),|".includes(c)) { out.push(c); i++; continue; }
    if (c === ":") { out.push(":"); i++; continue; }
    if (c === '"') { i = lexString(s, i, lineNo, out); continue; }
    let j = i;
    while (j < n && !WORDSTOP.includes(s[j]) && !(s[j] === "-" && s[j + 1] === "-" && j > i)) j++;
    let w = s.slice(i, j); i = j;
    if (/^-?\d+(\.\d+)?$/.test(w)) { out.push({ t: "num", v: parseFloat(w), line: lineNo }); continue; }
    // a trailing ! is its own word: hello! is hello ! (decision 67)
    if (w.length > 1 && w.endsWith("!")) { out.push({ t: "word", v: w.slice(0, -1), line: lineNo }); w = "!"; }
    out.push({ t: "word", v: w, line: lineNo });
  }
}

// "a [x] b": [ ] puts a value into a string (decision 81). ( ) is plain text, so SQL and CSS need no escapes. \[ is a plain bracket.
function lexString(s, i, lineNo, out) {
  const ESC = { n: "\n", t: "\t", "\\": "\\", '"': '"', "[": "[" };
  let j = i + 1, buf = ""; const parts = [];
  while (j < s.length && s[j] !== '"') {
    const c = s[j];
    if (c === "\\" && j + 1 < s.length) { const x = s[j + 1]; buf += ESC[x] !== undefined ? ESC[x] : x; j += 2; continue; }
    if (c === "[") {
      let d = 1, k = j + 1;
      while (k < s.length && d) { if (s[k] === '"') break; if (s[k] === "[") d++; else if (s[k] === "]") d--; if (d) k++; }
      if (d) throw new SproutError("a [ in a string needs a ] to close it", lineNo);
      parts.push(buf); buf = ""; parts.push({ src: s.slice(j + 1, k) }); j = k + 1; continue;
    }
    buf += c; j++;
  }
  if (j >= s.length) throw new SproutError("a string needs a closing \"", lineNo);
  if (parts.length) { parts.push(buf); out.push({ t: "tmpl", parts, line: lineNo }); }
  else out.push({ t: "str", v: buf, line: lineNo });
  return j + 1;
}

function tokenize(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  const out = [], stack = [{ ind: 0, opened: false }]; let first = true;
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li]; const toks = [];
    lexLine(raw, li + 1, toks);
    if (!toks.length) continue;
    let ind = 0; for (const ch of raw) { if (ch === " ") ind++; else if (ch === "\t") ind += 2; else break; }
    if (first) { stack[0].ind = ind; first = false; }
    else if (ind > stack[stack.length - 1].ind) {
      // an indent opens a cell, unless the line above ends with [ ( or | : that bracket is already open (decision 70)
      const last = out[out.length - 1], open = last === "[" || last === "(" || last === "|";
      stack.push({ ind, opened: !open }); out.push(open ? "\n" : "[");
    } else {
      while (ind < stack[stack.length - 1].ind) { if (stack.pop().opened) out.push("]"); }
      if (ind !== stack[stack.length - 1].ind) throw new SproutError("this line's indent doesn't line up with any line above", li + 1);
      out.push("\n");
    }
    for (const t of toks) out.push(t);
  }
  while (stack.length > 1) { if (stack.pop().opened) out.push("]"); }
  return out;
}

// ===================================================================== parser
// AST: {k:"num",v} {k:"str",v} {k:"tmpl",parts} {k:"word",v,line} {k:"group",items}
//      {k:"cell",names:[{n,def}],items,src} {k:"chain",terms} {k:"bind",name,val,line}
class SproutError extends Error { constructor(msg, line) { super(msg); this.line = line || 0; } }

class Parser {
  constructor(toks, src) { this.t = toks; this.i = 0; this.src = src; }
  pk() { return this.i < this.t.length ? this.t[this.i] : null; }
  nx() { return this.t[this.i++]; }
  line() { for (let j = Math.min(this.i, this.t.length - 1); j >= 0; j--) if (this.t[j] && this.t[j].line) return this.t[j].line; return 0; }
  program() { const items = this.items(null); if (this.pk() !== null) throw new SproutError("this " + this.pk() + " doesn't close anything", this.line()); return items; }
  items(end) {
    const out = [];
    for (;;) {
      const t = this.pk();
      if (t === null || t === end) break;
      if (t === "," || t === "\n") { this.nx(); continue; }
      if (t === "]" || t === ")") throw new SproutError("this " + t + " doesn't match", this.line());
      out.push(this.item());
    }
    return out;
  }
  item() {
    const line = this.line();
    const c = this.chain();
    if (this.pk() === ":") {
      this.nx();
      if (c.terms.length !== 1 || c.terms[0].k !== "word") throw new SproutError("only a name can go before :", line);
      const val = this.chain();
      if (!val.terms.length) throw new SproutError("a value has to follow :", line);
      return { k: "bind", name: c.terms[0].v, val, line };
    }
    return c;
  }
  chain() {
    const terms = [];
    for (;;) {
      const t = this.pk();
      if (t === null || t === "," || t === "\n" || t === ":" || t === "|" || t === "]" || t === ")") break;
      terms.push(this.term());
    }
    return { k: "chain", terms };
  }
  term() {
    const t = this.nx();
    // an unclosed bracket is reported where it opened, not where the file ran out
    if (t === "[") return this.cell(this.line());
    if (t === "(") { const at = this.line(); const items = this.items(")"); if (this.nx() !== ")") throw new SproutError("a ( needs a ) to close it", at); return { k: "group", items }; }
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "str") return { k: "str", v: t.v };
    if (t.t === "tmpl") return { k: "tmpl", parts: t.parts.map(p => typeof p === "string" ? p : { ast: parseInner(p.src, t.line) }) };
    if (t.t === "word") return { k: "word", v: t.v, line: t.line };
    throw new SproutError("this doesn't make sense here: " + t, this.line());
  }
  cell(openLine) {
    // input names before a | at this depth: [x y : 0 | ...]
    let depth = 0, bar = -1;
    for (let j = this.i; j < this.t.length; j++) {
      const x = this.t[j];
      if (x === "[" || x === "(") depth++;
      else if (x === "]" || x === ")") { if (depth === 0) break; depth--; }
      else if (x === "|" && depth === 0) { bar = j; break; }
    }
    const names = [];
    if (bar >= 0) {
      while (this.i < bar) {
        const x = this.nx();
        if (x === "," || x === "\n") continue;
        if (!x || x.t !== "word") throw new SproutError("only names go before |", this.line());
        const nm = { n: x.v, def: null };
        if (this.pk() === ":") { this.nx(); nm.def = this.term(); }
        names.push(nm);
      }
      this.nx(); // |
    }
    const items = this.items("]");
    if (this.nx() !== "]") throw new SproutError("a [ needs a ] to close it", openLine || this.line());
    return { k: "cell", names, items }; // [[x]] is a cell holding a cell (decision 71: no collapse)
  }
}
function parseInner(src, line) {
  const p = new Parser(tokenize(src), src);
  const items = p.program();
  if (items.length !== 1 || items[0].k !== "chain") throw new SproutError("put one value inside a string's brackets", line);
  // it counts its own lines from 1; what's inside a string is on the string's line
  (function at(n) { if (!n || typeof n !== "object") return; if (typeof n.line === "number") n.line = line; for (const k in n) at(n[k]); })(items[0]);
  return items[0];
}
function parse(src) { return new Parser(tokenize(src), src).program(); }

// ===================================================================== code generator
// Each cell literal compiles to two JS functions:
//   run(a)   : straight-line code that works out every item in order (used when the cell is run)
//   slots(a) : one thunk per item, worked out on first read and kept (used when fields or parts are read; decision 51)
// Names are JS consts captured by closures; since nothing is rebound, that is the same as filling names in (decision 24).
const FUSED = new Set(["+", "-", "*", "/", "%", "<", ">", "<=", ">=", "=", "!=", "..", "with", "@"]);
const LAZYOPS = new Set(["and", "or", "else"]);

let uid = 0;
function jsName(n) { let s = ""; for (const ch of n) s += /[A-Za-z0-9]/.test(ch) ? ch : "_" + ch.charCodeAt(0).toString(16); return "v_" + s + "_" + (uid++); }

class Gen {
  constructor(globals) { this.globals = globals; this.shapes = []; this.frames = []; this.temps = []; this.consts = []; this.speed = []; this.sporkNames = null; this.sporkWhy = new Map(); }
  // local temporaries, declared at the top of the JS function being generated (safe under recursion)
  // field shapes and inline caches are made once, when the program loads
  shapeRef(keys) { const k = "SH" + this.consts.length; this.consts.push("const " + k + "=shapeFor(" + JSON.stringify(keys) + ");"); return k; }
  ic() { const k = "IC" + this.consts.length; this.consts.push("const " + k + "={s:null,i:-1,o:null,x:null};"); return k; }
  // a head term that is certainly not true or false: a host value, or a name bound to a cell literal
  notBool(t) {
    if (t.k === "cell" || t.k === "num" || t.k === "str" || t.k === "tmpl") return true;
    if (t.k !== "word") return false;
    const r = this.lookup(t.v);
    if (r) return !!r.cell;
    const d = Object.getOwnPropertyDescriptor(G, t.v);
    return !!d && !d.get && typeof d.value !== "boolean";
  }
  // a global that is a plain value (host words, W, H, range) is read once at load; getters (random, prelude) each time
  globalRef(n) {
    const d = Object.getOwnPropertyDescriptor(G, n);
    if (!d || d.get) return "G[" + JSON.stringify(n) + "]";
    if (!this.gconst) this.gconst = new Map();
    let k = this.gconst.get(n); if (!k) { k = "G" + this.consts.length; this.gconst.set(n, k); this.consts.push("const " + k + "=G[" + JSON.stringify(n) + "];"); }
    return k;
  }
  tmp() { const sc = this.temps[this.temps.length - 1]; const n = "t" + (uid++); sc.push(n); return n; }
  withFn(gen) { this.temps.push([]); const body = gen(); const t = this.temps.pop(); return { body, decl: t.length ? "let " + t.join(",") + ";" : "" }; }
  arrow(params, genExpr) { const r = this.withFn(genExpr); return "(" + params + ")=>" + (r.decl ? "{" + r.decl + "return " + r.body + "}" : r.body); }
  // look a name up through the frames, innermost first
  lookup(n) {
    for (let f = this.frames.length - 1; f >= 0; f--) {
      const r = this.frames[f].names.get(n);
      if (r) { if (f < this.frames.length - 1) this.noteCapture(f, n, r); return r; }
    }
    return null;
  }
  noteCapture(fIdx, n, r) { for (let f = fIdx + 1; f < this.frames.length; f++) { const fr = this.frames[f]; if (!fr.caps.has(n)) fr.caps.set(n, r); } }
  refJS(r) { return r.k === "js" ? r.js : r.act + ".get(" + r.i + ")"; }

  nameRef(n, line) {
    if (n === "right") { const r = this.lookup("right"); if (r) return this.refJS(r); n = "_"; }
    if (n === "_") {
      // _ belongs to the nearest cell around it (decision 56)
      const fr = this.frames[this.frames.length - 1];
      fr.shape.usesIt = true;
      if (fr.shape.names.length) { lint("_ is used in a cell that names its inputs; it is false there"); return "false"; }
      return fr.itJS;
    }
    if (n === "left") {
      for (let f = this.frames.length - 1; f >= 0; f--) if (this.frames[f].owner) { this.frames[f].shape.usesLeft = true; return this.frames[f].leftJS; }
      return "LOG_MISS('left is only used inside a field of a cell', " + (line || 0) + ")";
    }
    const r = this.lookup(n);
    if (r) return this.refJS(r);
    if (this.globals.has(n)) return this.globalRef(n);
    // suggest the nearest name in scope, or a built-in, for a likely typo
    const seen = new Set(this.globals); for (const f of this.frames) for (const k of f.names.keys()) seen.add(k);
    for (const list of this.hintNames || []) for (const k of list) seen.add(k);
    const hint = nearest(n, seen);
    return "UNKNOWN(" + JSON.stringify(n) + "," + (line || 0) + (hint ? "," + JSON.stringify(hint) : "") + ")";
  }

  genChain(ch, tail) {
    const T = ch.terms;
    if (!T.length) return "false";
    if (T.length === 1 && tail && T[0].k === "group" && T[0].items.length === 1 && T[0].items[0].k === "chain") return this.genChain(T[0].items[0], true);
    let v = this.genTerm(T[0], true), seg = null;
    for (let i = 1; i < T.length; i++) {
      // loop fusion (decision 95): a run of collect, keep, fold and length is also made into one loop, tried first
      if (seg && i === seg.end) { v = this.fuseWrap(seg, v); seg = null; }
      if (!seg && (seg = fuseSegment(T, i))) { seg.src = v; seg.ta = this.tmp(); seg.notes = this.speed.length; v = seg.ta; }
      const t = T[i], isLast = i === T.length - 1;
      if (t.k === "word" && (t.v === "!" || t.v === "true" || t.v === "false")) { v = "SEND(" + v + "," + (t.v === "!" ? "BANG" : t.v) + ")"; continue; }
      if (t.k === "word") {
        const w = t.v;
        if (FUSED.has(w) && i + 1 < T.length && !this.lookup(w)) {
          const nt = T[++i];
          // x with [a : ..., b : ...]: fields worked out now and laid over x, with no cell built (merge forces them anyway)
          if ((w === "with" || w === "..") && nt.k === "cell" && fieldsOnly(nt)) {
            v = "WITHF(" + v + ",[" + nt.items.map(x => JSON.stringify(x.name)).join(",") + "],[" + nt.items.map(x => this.genChain(x.val)).join(",") + "]," + this.ic() + ")";
            continue;
          }
          v = OPNAME[w] + "(" + v + "," + this.genTerm(nt, false) + ")"; continue;
        }
        if (LAZYOPS.has(w) && i + 1 < T.length && !this.lookup(w)) {
          // only else gives its right side back as it is; and/or check theirs is true or false, so it can't be a tail call
          const B = this.genArg(T[++i], w === "else" && tail && i + 1 >= T.length), ta = this.tmp();
          if (w === "else") v = "((" + ta + "=" + v + ")!==false?" + ta + ":" + B + ")";
          else if (w === "and") v = "((" + ta + "=" + v + ")===true?ISBOOL(" + B + ",'and'):" + ta + "===false?false:MISSING(" + ta + ",'and'))";
          else v = "((" + ta + "=" + v + ")===false?ISBOOL(" + B + ",'or'):" + ta + "===true?true:MISSING(" + ta + ",'or'))";
          continue;
        }
        const r = this.lookup(w);
        const lex = r ? "()=>" + this.refJS(r) : (this.globals.has(w) ? "()=>" + this.globalRef(w) : "null");
        // a field read right before else is allowed to miss: else is the program saying so, so the miss isn't logged (decision 83)
        const quiet = T[i + 1] && T[i + 1].k === "word" && T[i + 1].v === "else" && T[i + 2] && !this.lookup("else");
        v = "SWI(" + v + "," + JSON.stringify(w) + "," + lex + "," + (t.line || 0) + "," + this.ic() + (quiet ? ",1" : "") + ")";
      } else if (t.k === "cell" && !t.names.length && i === 1 && this.notBool(T[0])) {
        v = (tail && isLast ? "TAIL(" : "SEND(") + v + "," + this.genCell(t) + ")";
      } else if (t.k === "cell" && !t.names.length) {
        // a boolean given a cell runs it (decision 62): the body is inlined; any other value is sent the cell
        const elsePat = T[i + 1] && T[i + 1].k === "word" && T[i + 1].v === "else" && T[i + 2] && !this.lookup("else");
        const A = this.genInlineExpr(t, tail && isLast && !elsePat);
        const SND = tail && isLast && !elsePat ? "TAIL(" : "SEND(";
        if (!A) { v = SND + v + "," + this.genCell(t) + ")"; continue; }
        const ta = this.tmp(), tb = this.tmp(), mk = this.genCell(t);
        const nx = T[i + 1], nx2 = T[i + 2];
        if (nx && nx.k === "word" && nx.v === "else" && nx2 && !this.lookup("else")) {
          // test [a] else b: b runs when the test is false, or when a gives false (decision 62)
          i += 2;
          // decision 74: else is a library cell, so it can't tell "the test was false" from "the branch gave false".
          // A branch whose answer is true or false is named, unless the else gives false too, when it makes no difference.
          const lastIt = t.items[t.items.length - 1];
          const elseFalse = (nx2.k === "word" && nx2.v === "false") || (nx2.k === "cell" && nx2.items.length === 1 && givesBool(nx2.items[0]) === "false");
          const branchTy = lastIt && lastIt.k === "chain" ? givesBool(lastIt) : null;
          if (branchTy === "false") lint("a branch that gives false before else: the else runs too (line " + (nx.line || 0) + ")");
          else if (branchTy && !elseFalse) lint("line " + (nx.line || 0) + ": this branch gives true or false, and when it gives false the else runs too (decision 74). To keep a false answer, use cond [test, answer, any, other]");
          const B = this.genArg(nx2, tail && i + 1 >= T.length);
          v = "(((" + ta + "=" + v + ")===true?(" + tb + "=" + A + "):" + ta + "===false?(" + tb + "=false):(" + tb + "=SEND(" + ta + "," + mk + ")))!==false?" + tb + ":" + B + ")";
        } else v = "((" + ta + "=" + v + ")===true?" + A + ":" + ta + "===false?false:" + SND + ta + "," + mk + "))";
      } else v = (tail && isLast ? "TAIL(" : "SEND(") + v + "," + this.genTerm(t, false) + ")";
      // speed notes: can this collect, keep or each run over columns? (decision 86)
      const pw = T[i - 1];
      const inner = pw && pw.k === "word" && pw.v === "fold" && t.k === "cell" && t.items[1] && t.items[1].k === "chain" && t.items[1].terms.length === 1 && t.items[1].terms[0].k === "cell" ? t.items[1].terms[0] : null;
      const tgt = inner || t;
      if (t.k === "word" && pw && pw.k === "word" && pw.v === "spork" && this.sporkWhy.has(t.v)) {
        const r = this.sporkWhy.get(t.v);
        this.speed.push({ line: pw.line || 0, word: "spork", fast: r === true, why: r === true ? "" : r });
      }
      if (tgt.k === "cell" && tgt.names.length && pw && pw.k === "word" && SPEEDW[pw.v] && tgt.kern) {
        const r = tgt.kern[SPEEDW[pw.v]];
        this.speed.push({ line: pw.line || 0, word: pw.v, fast: r === true, why: r === true ? "" : r });
      }
    }
    if (seg) v = this.fuseWrap(seg, v);
    return v;
  }
  // the fused loop, tried first; the steps as written are the way back when it can't run (NOFUSE)
  fuseWrap(seg, ordinary) {
    const P = new Spk(this), K = {};
    for (const item of ["num", "row"]) {
      try { K[item] = P.buildPipe(seg.stages, item); } catch (e) { if (e !== SPKFAIL) throw e; K[item] = null; }
    }
    if (!K.num && !K.row) return "(" + seg.ta + "=" + seg.src + "," + ordinary + ")";
    const name = "FK" + this.consts.length, tf = this.tmp();
    this.consts.push("const " + name + "={num:" + (K.num || "null") + ",row:" + (K.row || "null") + "};");
    // one note for the run, in place of a note for each step
    const words = seg.stages.map(st => st.w), lines = new Set(seg.stages.map(st => st.line || 0));
    this.speed = this.speed.slice(0, seg.notes).concat(this.speed.slice(seg.notes).filter(x => !(lines.has(x.line) && words.includes(x.word))));
    this.speed.push({ line: seg.stages[0].line || 0, word: words.join(" "), fast: true, why: "" });
    return "((" + tf + "=FUSE((" + seg.ta + "=" + seg.src + ")," + name + "," + (P.caps.length ? "()=>[" + P.caps.join(",") + "]" : "null") + "))!==NOFUSE?" + tf + ":" + ordinary + ")";
  }
  // the right side of else/and/or: a cell literal there is run (inlined), anything else is its value
  genArg(t, tail) {
    if (t.k === "cell" && !t.names.length) { const A = this.genInlineExpr(t, tail); return A || "RUNC(" + this.genCell(t) + ")"; }
    if (tail && t.k === "group" && t.items.length === 1 && t.items[0].k === "chain") return this.genChain(t.items[0], true);
    return this.genTerm(t, false);
  }
  genTerm(t) {
    switch (t.k) {
      case "num": return String(t.v);
      case "str": return JSON.stringify(t.v);
      case "tmpl": return "STR(" + t.parts.map(p => typeof p === "string" ? JSON.stringify(p) : this.genChain(p.ast)).join(",") + ")";
      case "word": return t.v === "!" ? "BANG" : t.v === "true" ? "true" : t.v === "false" ? "false" : this.nameRef(t.v, t.line);
      case "group": return this.genGroup(t.items);
      case "cell": return this.genCell(t);
      case "chain": return this.genChain(t);
    }
    throw new Error("term " + t.k);
  }
  genGroup(items) {
    if (items.length === 1 && items[0].k === "chain") return "(" + this.genChain(items[0]) + ")";
    // a group of several steps: worked out now, in order; its names are local to it (decision 8)
    const fr = this.frames[this.frames.length - 1];
    const saved = new Map(fr.names), parts = [];
    this.temps.push([]);
    items.forEach((it, idx) => {
      const last = idx === items.length - 1;
      if (it.k === "bind") { const js = jsName(it.name); const e = this.genChain(it.val); fr.names.set(it.name, { k: "js", js, val: it.val }); parts.push("const " + js + "=" + e + ";"); if (last) parts.push("return " + js + ";"); }
      else parts.push((last ? "return " : "") + this.genChain(it) + ";");
    });
    fr.names = saved;
    const tt = this.temps.pop(); if (tt.length) parts.unshift("let " + tt.join(",") + ";");
    return "(()=>{" + parts.join("") + "})()";
  }
  // straight-line code for running a cell: every item in order, giving the last part (or false)
  genRunBody(c, fr, k, tail) {
    const out = []; let lastPart = null;
    c.items.forEach((it, i) => {
      const last = i === c.items.length - 1;
      if (it.k === "bind") {
        const js = jsName(it.name), isCell = it.val.terms.length === 1 && it.val.terms[0].k === "cell";
        const ast = isCell ? it.val.terms[0] : null;
        if (isCell) fr.names.set(it.name, { k: "js", js, cell: true, ast, val: it.val }); // a cell can use its own name (decision 25)
        const e = isCell ? this.genCell(it.val.terms[0], true) : this.genChain(it.val);
        fr.names.set(it.name, { k: "js", js, cell: isCell, ast, val: it.val });
        out.push("const " + js + "=" + e + ";");
        if (last) out.push("return " + (lastPart || "false") + ";");
      } else {
        const e = this.genChain(it, last && tail);
        if (last) out.push("return " + e + ";");
        else { const js = "p" + k + "_" + i; out.push("const " + js + "=" + e + ";"); lastPart = js; }
      }
    });
    if (!c.items.length) out.push("return false;");
    return out.join("");
  }
  // a branch body inlined where it is run, as an expression: possible when it takes no input
  genInlineExpr(c, tail) {
    const k = "i" + (uid++);
    const sh = { names: [], usesIt: false, usesLeft: false };
    const fr = { names: new Map(), act: k, itJS: "false", leftJS: "undefined", shape: sh, owner: false, caps: new Map() };
    this.frames.push(fr);
    const r = this.withFn(() => this.genRunBody(c, fr, k, tail));
    this.frames.pop();
    if (sh.usesIt) return null;
    const m = /^return ([^;]*);$/.exec(r.body);
    if (m && !r.decl && !/[{}]/.test(m[1])) return "(" + m[1] + ")";
    return "(()=>{" + r.decl + r.body + "})()";
  }

  genCell(c, ownerOfLeft) {
    if (fieldsOnly(c) && c.items.every(x => simpleVal(x.val))) {
      // the fields can't use each other here, but they are still the likeliest names a typo meant
      this.hintNames = (this.hintNames || []).concat([c.items.map(x => x.name)]);
      const vals = c.items.map(x => this.genChain(x.val));
      this.hintNames.pop();
      return "VC(" + this.shapeRef(c.items.map(x => x.name)) + ",[" + vals.join(",") + "])";
    }
    if (simpleParts(c) && c.items.length > 1)
      return "VP([" + c.items.map(x => this.genChain(x)).join(",") + "])";
    const k = this.shapes.length;
    const sh = { id: k, names: c.names.map(x => x.n), fidx: Object.create(null), pidx: [], usesIt: false, usesLeft: false, n: c.items.length, src: srcOf(c) };
    this.shapes.push(sh);
    const seenNames = new Set();
    c.items.forEach((it, i) => { if (it.k === "bind") { if (seenNames.has(it.name)) throw new SproutError("\"" + it.name + "\" is bound twice in one cell (decision 13)", it.line); seenNames.add(it.name); sh.fidx[it.name] = i; } else sh.pidx.push(i); });
    const defs = c.names.map(x => x.def ? this.arrow("", () => this.genTerm(x.def, false)) : "null");
    const act = "a" + k;
    // run: inputs arrive as plain arguments (left, it, then each name)
    const nparams = c.names.map((x, j) => act + "_" + j);
    const runFr = { names: new Map(), act, itJS: act + "_it", leftJS: act + "_L", shape: sh, owner: !!ownerOfLeft, caps: new Map() };
    c.names.forEach((x, j) => runFr.names.set(x.n, { k: "js", js: nparams[j] }));
    this.frames.push(runFr);
    const rb = this.withFn(() => this.genRunBody(c, runFr, k, true)), runBody = rb.decl + rb.body;
    this.frames.pop();
    // slots: one lazy thunk per readable item. Every cell follows one rule (decision 75): its fields can be read.
    // In a cell that takes input, the body (its parts) runs on a send, and a binding that uses the input is a local of that run.
    let slotsJS = "null", caps;
    const takes = sh.names.length > 0 || sh.usesIt;
    let readable = c.items.map(() => true);
    if (takes) {
      const dep = new Set(c.names.map(x => x.n).concat(["_", "right"]));
      readable = c.items.map(it => { if (it.k !== "bind") return false; if (mentions(it.val, dep)) { dep.add(it.name); return false; } return true; });
      sh.pidx = [];
      for (const n in sh.fidx) if (!readable[sh.fidx[n]]) delete sh.fidx[n];
    }
    if (readable.some(x => x)) {
      const fr = { names: new Map(), act, itJS: act + ".it", leftJS: act + ".left", shape: sh, owner: !!ownerOfLeft, caps: new Map() };
      c.names.forEach((x, j) => fr.names.set(x.n, { k: "js", js: act + ".ins[" + j + "]" }));
      this.frames.push(fr);
      const sparts = [];
      c.items.forEach((it, i) => {
        if (!readable[i]) { sparts.push("()=>false"); return; }
        if (it.k === "bind") {
          const isCell = it.val.terms.length === 1 && it.val.terms[0].k === "cell";
          const ast = isCell ? it.val.terms[0] : null;
          if (isCell) fr.names.set(it.name, { k: "slot", act, i, cell: true, ast, val: it.val });
          const e = this.arrow("", () => isCell ? this.genCell(it.val.terms[0], true) : this.genChain(it.val));
          fr.names.set(it.name, { k: "slot", act, i, cell: isCell, ast, val: it.val });
          sparts.push(e);
        } else sparts.push(this.arrow("", () => this.genChain(it)));
      });
      caps = [...fr.caps.values()].map(r => this.refJS(r));
      this.frames.pop();
      slotsJS = "(" + act + ")=>[" + sparts.join(",") + "]";
    }
    if (takes || !caps) { const rc = [...runFr.caps.values()].map(r => this.refJS(r)); caps = caps ? [...new Set(caps.concat(rc))] : rc; }
    const runJS = "(" + [act + "_L", act + "_it"].concat(nparams).join(",") + ")=>{" + runBody + "}";
    // column versions of this cell's body, used when it is given a list stored as columns (decision 82)
    const simpleBody = !sh.usesIt && !sh.usesLeft && c.items.length === 1 && c.items[0].k === "chain" && c.names.every(x => !x.def);
    const kern = simpleBody && c.names.length === 1 ? this.genKernels(c) : simpleBody && c.names.length === 2 ? this.genFoldKernel(c) : null;
    if (!c.kern) { const why = c.items.length !== 1 || c.items[0].k !== "chain" ? "the body has more than one step" : c.names.length !== 1 ? "it doesn't take exactly one named input" : "it uses _ or left"; c.kern = { m: why, t: why, e: why, f: c.names.length === 2 ? why : "fold runs as a tight loop only with two inputs, as in [total x | ...]" }; }
    // a cell that spork is given, by name or written in place: worked out now into one numeric kernel (decision 91)
    let all = kern;
    if (c.sporkArg || (c.bindName && this.sporkNames && this.sporkNames.has(c.bindName))) {
      const sk = this.genSpork(c);
      c.kern.s = sk.js ? true : sk.why;
      if (c.bindName) this.sporkWhy.set(c.bindName, c.kern.s);
      if (sk.js) {
        all = kern ? kern.slice(0, -1) + "," + sk.js + "}" : "{" + sk.js + "}";
        // the loops inside it were unrolled when it was worked out, so their speed notes don't apply
        const span = lineSpan(c); this.speed = this.speed.filter(x => x.line < span[0] || x.line > span[1]);
      }
    } else c.kern.s = "spork works a cell out ahead only when it is written after spork or bound to a name that spork is given";
    return "MK(S[" + k + "]," + slotsJS + "," + runJS + ",[" + defs.join(",") + "],()=>[" + caps.join(",") + "]" + (all ? "," + all : "") + ")";
  }
  genSpork(c) {
    const P = new Spk(this);
    let code = null;
    try { code = P.build(c); } catch (e) { if (e !== SPKFAIL) throw e; }
    if (!code) return { why: P.why || "it can't be worked out ahead" };
    const name = "SK" + this.consts.length;
    this.consts.push("const " + name + "=" + code + ";");
    return { js: "s:{k:" + name + ",caps:()=>[" + P.caps.join(",") + "]}" };
  }

  // ---- column kernels (decision 82). A cell [s | ...] over records gets up to three:
  //   m: [s | s with [a : ..., b : ...]] where every new value is number maths on s's fields  (used by collect)
  //   t: [s | test] where the test is number maths and comparisons                           (used by keep)
  //   e: [s | word [..., ...]] where word is a host word, like circle                         (used by each)
  // Each is (self, rs, cols, n) => result, or null to fall back to the ordinary way, so they never change what a program does.
  genKernels(c) {
    const p = c.names[0].n, T = c.items[0].terms, out = [];
    const fresh = () => ({ p, cols: new Map(), caps: new Map(), why: null });
    const kern = c.kern = { f: "fold runs as a tight loop only with two inputs, as in [total x | ...]", m: "collect runs over columns only as " + p + " with [new fields]", t: "the body doesn't give true or false", e: "the body isn't one host word given a list of values" };
    // m: s with [fields]
    if (T.length === 3 && T[0].k === "word" && T[0].v === p && T[1].k === "word" && (T[1].v === "with" || T[1].v === "..") && !this.lookup(T[1].v) && T[2].k === "cell" && fieldsOnly(T[2])) {
      const K = fresh(), keys = T[2].items.map(x => x.name), vals = T[2].items.map(x => this.kChain(x.val, K));
      kern.m = vals.every(v => v && v.ty === "n") ? true : K.why || "a new value isn't number maths";
      if (kern.m === true) {
        const q = JSON.stringify;
        out.push("m:(self,rs,cols,n)=>{" + kPro(K) + "if(rs.index(\"with\")>=0||rs.index(\"..\")>=0)return null;let out=rs;const oc=cols.slice();" +
          keys.map((k, j) => "let $j" + j + "=out.index(" + q(k) + ");if($j" + j + "<0){out=out.add(" + q(k) + ");$j" + j + "=out.keys.length-1}const $o" + j + "=new Float64Array(n);").join("") +
          "for(let $i=0;$i<n;$i++){" + vals.map((v, j) => "const $v" + j + "=" + v.js + ";").join("") + vals.map((v, j) => "$o" + j + "[$i]=$v" + j + ";").join("") + "}" +
          keys.map((k, j) => "oc[$j" + j + "]=$o" + j + ";").join("") + "return COLC(out,oc,n)}");
      }
    }
    // m: [r | r f], one field of each record: over columns, that column as a list of numbers
    if (T.length === 2 && T[0].k === "word" && T[0].v === p && T[1].k === "word" && T[1].v !== p && !FUSED.has(T[1].v) && !LAZYOPS.has(T[1].v) &&
        !["!", "true", "false", "_", "left", "right"].includes(T[1].v) && !(T[1].v in CELLP) && !this.lookup(T[1].v) && !this.globals.has(T[1].v)) {
      kern.m = true;
      out.push("m:(self,rs,cols,n)=>{const $j=rs.index(" + JSON.stringify(T[1].v) + ");return $j<0?null:NCOL(cols[$j],n)}");
    }
    // t: a test
    { const K = fresh(), v = this.kChain(c.items[0], K);
      kern.t = v && v.ty === "b" ? true : v ? kern.t : K.why || kern.t;
      if (v && v.ty === "b")
        out.push("t:(self,rs,cols,n)=>{" + kPro(K) + "const $k=new Uint32Array(n);let $m=0;for(let $i=0;$i<n;$i++){if(" + v.js + ")$k[$m++]=$i}" +
          "if($m===n)return self;const oc=new Array(cols.length);for(let $j=0;$j<cols.length;$j++){const $c=cols[$j],$o=new Float64Array($m);for(let $q=0;$q<$m;$q++)$o[$q]=$c[$k[$q]];oc[$j]=$o}return COLC(rs,oc,$m)}");
    }
    // e: word [args], a host word given a cell of values
    if (T.length === 2 && T[0].k === "word" && T[0].v !== p && T[1].k === "cell" && simpleParts(T[1]) && T[1].items.length > 1) {
      const K = fresh(), F = this.kCap(T[0].v, K, false);
      const args = F && T[1].items.map(it => {
        const t0 = it.terms[0];
        if (it.terms.length === 1 && t0.k === "str") return JSON.stringify(t0.v);
        if (it.terms.length === 1 && t0.k === "word" && t0.v !== p && !["_", "left", "right", "!", "true", "false"].includes(t0.v)) return this.kCap(t0.v, K, false);
        const v = this.kChain(it, K); return v && v.js;
      });
      kern.e = args && args.every(a => a) ? true : K.why || "an argument isn't a number, a word in quotes or a name from outside";
      if (args && args.every(a => a))
        out.push("e:(self,rs,cols,n)=>{" + kPro(K) + "if(!(" + F + " instanceof NATIVE))return null;const $f=" + F + ".fn,$d=" + F + ".direct;" +
          "if($d&&$d.length===" + args.length + "){for(let $i=0;$i<n;$i++)$d(" + args.join(",") + ")}else{for(let $i=0;$i<n;$i++)$f(VP([" + args.join(",") + "]))}return true}");
    }
    return out.length ? "{" + out.join(",") + "}" : null;
  }
  // f: [total x | number maths on total and x], used by fold over range or a list of numbers: one tight loop, no calls
  genFoldKernel(c) {
    const K = { p: null, cols: new Map(), caps: new Map(), why: null, vars: new Map([[c.names[0].n, "$a"], [c.names[1].n, "$x"]]) };
    const v = this.kChain(c.items[0], K);
    c.kern = { f: v && v.ty === "n" ? true : K.why || "the body isn't number maths", m: "it takes two inputs", t: "it takes two inputs", e: "it takes two inputs" };
    if (c.kern.f !== true) return null;
    return "{f:(acc,xs,rng)=>{" + kPro(K) + "if(typeof acc!==\"number\")return null;let $a=acc;" +
      "if(rng){const $n=xs.n;for(let $i=1;$i<=$n;$i++){const $x=$i;$a=" + v.js + "}return $a}" +
      "const $p=xs.a||xs.parts;for(let $i=0;$i<$p.length;$i++){const $x=$p[$i];if(typeof $x!==\"number\")return null;$a=" + v.js + "}return $a}}";
  }
  // a chain as number maths on the item's fields: {js, ty} with ty "n" (number) or "b" (true/false), or null if it can't be
  kChain(ch, K) {
    const T = ch.terms; if (!T.length) return null;
    let v, i;
    if (T[0].k === "word" && T[0].v === K.p) {
      const f = T[1];
      if (!f || f.k !== "word" || f.v === K.p || ["!", "true", "false", "_", "left", "right"].includes(f.v)) return kNo(K, "it uses " + K.p + " itself, not one of its fields");
      if ((FUSED.has(f.v) || LAZYOPS.has(f.v)) && T.length > 2 && !this.lookup(f.v)) return kNo(K, "it uses " + K.p + " itself, not one of its fields");
      v = { js: kCol(f.v, K), ty: "n" }; i = 2;
    } else if (T[0].k === "word" && T[0].v === "noise" && !this.lookup("noise") && T[1] && T[1].k === "cell" && !T[1].names.length && T[1].items.length === 2 && T[1].items.every(x => x.k === "chain")) {
      // noise [a, b] is pure, so it can run inside a column loop (decision 87)
      const a = this.kChain(T[1].items[0], K), b = a && this.kChain(T[1].items[1], K);
      v = a && b && a.ty === "n" && b.ty === "n" ? { js: "NOISE(" + a.js + "," + b.js + ")", ty: "n" } : kNo(K, "its noise isn't given two numbers"); i = 2;
    } else { v = this.kTerm(T[0], K); i = 1; }
    for (; v && i < T.length; i++) {
      const t = T[i]; if (t.k !== "word") return kNo(K, t.k === "cell" ? "it calls something for each item" : "it sends a value to a value");
      const w = t.v;
      if (FUSED.has(w) && i + 1 < T.length && !this.lookup(w)) {
        const op = KOPS[w]; if (!op) return kNo(K, "it uses " + w); if (v.ty !== "n") return kNo(K, "it does maths on true or false");
        const b = this.kTerm(T[++i], K); if (!b) return null; if (b.ty !== "n") return kNo(K, "it does maths on true or false");
        v = w === "%" ? { js: "(((" + v.js + "%" + b.js + ")+" + b.js + ")%" + b.js + ")", ty: "n" } : { js: "(" + v.js + op[0] + b.js + ")", ty: op[1] };
      } else if ((w === "and" || w === "or") && i + 1 < T.length && !this.lookup(w)) {
        if (v.ty !== "b" || T[i + 1].k === "cell") return kNo(K, "its " + w + " isn't between two tests");
        const b = this.kTerm(T[++i], K); if (!b) return null; if (b.ty !== "b") return kNo(K, "its " + w + " isn't between two tests");
        v = { js: "(" + v.js + (w === "and" ? "&&" : "||") + b.js + ")", ty: "b" };
      } else if (v.ty === "n" && KPOST[w]) v = { js: KPOST[w] + "(" + v.js + ")", ty: "n" };
      else if (v.ty === "n" && (w === "min" || w === "max") && i + 1 < T.length) {
        const b = this.kTerm(T[++i], K); if (!b) return null; if (b.ty !== "n") return kNo(K, "it does maths on true or false");
        v = { js: "Math." + w + "(" + v.js + "," + b.js + ")", ty: "n" };
      } else if (v.ty === "b" && w === "not") v = { js: "(!" + v.js + ")", ty: "b" };
      else return kNo(K, "it uses " + w);
    }
    return v;
  }
  kTerm(t, K) {
    if (t.k === "num") return { js: "(" + t.v + ")", ty: "n" };
    if (t.k === "word" && K.vars && K.vars.has(t.v)) return { js: K.vars.get(t.v), ty: "n" };
    if (t.k === "group") { if (t.items.length !== 1 || t.items[0].k !== "chain") return kNo(K, "it has a group of several steps"); const v = this.kChain(t.items[0], K); return v && { js: "(" + v.js + ")", ty: v.ty }; }
    if (t.k !== "word") return kNo(K, t.k === "str" || t.k === "tmpl" ? "it works with words, not numbers" : "it calls something for each item");
    if (t.v === "true" || t.v === "false") return { js: t.v, ty: "b" };
    if (t.v === K.p) return kNo(K, "it uses " + K.p + " itself, not one of its fields");
    if (["_", "left", "right", "!"].includes(t.v) || t.v in ALL) return kNo(K, "it uses " + t.v);
    const rc = this.lookup(t.v); if (rc && rc.cell) return kNo(K, "it calls " + t.v + " for each item");
    const r = this.kCap(t.v, K, true); return r ? { js: r, ty: "n" } : kNo(K, "it uses " + t.v + ", which isn't a number from outside the loop");
  }
  // a name from outside the cell, read once before the loop. A number is checked for; random and other getters are never captured.
  kCap(n, K, numeric) {
    let ref;
    const r = this.lookup(n);
    if (r) ref = this.refJS(r);
    else if (this.globals.has(n)) { const d = Object.getOwnPropertyDescriptor(G, n); if (!d || d.get) return kNo(K, "it reads " + n + ", which changes from item to item"); ref = this.globalRef(n); }
    else return kNo(K, "it uses " + n + ", which isn't a name the loop can see");
    let e = K.caps.get(n);
    if (!e) { e = { v: "$k" + K.caps.size, ref, num: false }; K.caps.set(n, e); }
    if (numeric) e.num = true;
    return e.v;
  }
}
const SPEEDW = { collect: "m", keep: "t", each: "e", fold: "f", spork: "s" };
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
const SPK_NATIVES = new Set(["range", "noise", "clamp", "toward"]);
const SPK_CELLM = { "@": 1, length: 0, first: 0, last: 0, collect: 1, keep: 1, each: 1, fold: 1, spork: 1 };
const spkNum = v => Object.is(v, -0) ? "-0" : String(v);

class Spk {
  constructor(g) {
    this.g = g; this.nodes = []; this.memo = new Map(); this.caps = []; this.capIdx = new Map();
    this.outside = new Map(); this.steps = 0; this.depth = 0; this.why = null; this.guards = []; this.jsOnly = false;
    this.pc = null; this.TRUE = this.cb(true); this.FALSE = this.cb(false); this.pc = this.TRUE;
  }
  no(why) { if (!this.why) this.why = why; throw SPKFAIL; }
  tick() { if (++this.steps > 400000) this.no("it takes too many steps to work out"); }

  // ---- IR nodes: [op, a, b, c, v]. Equal nodes are shared, and steps on constants are worked out now.
  node(op, a, b, c, v) {
    const N = this.nodes, isK = i => N[i][0] === "c" || N[i][0] === "cb", kv = i => N[i][4];
    if (SPK_N2[op] && isK(a) && isK(b)) return this.node("c", -1, -1, -1, SPK_N2[op](kv(a), kv(b)));
    if (SPK_N1[op] && isK(a)) return this.node("c", -1, -1, -1, SPK_N1[op](kv(a)));
    if ((SPK_C2[op] || SPK_B2[op]) && isK(a) && isK(b)) return this.node("cb", -1, -1, -1, (SPK_C2[op] || SPK_B2[op])(kv(a), kv(b)));
    if (op === "not" && isK(a)) return this.node("cb", -1, -1, -1, !kv(a));
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
    for (let e = env; e; e = e.parent) { if (e.vars) { if (e.vars.has(n)) return true; continue; } return !!this.frameRef(n, e.f, e.lim) || this.g.globals.has(n); }
    return false;
  }
  look(n, env) {
    for (let e = env; e; e = e.parent) { if (e.vars) { if (e.vars.has(n)) return e.vars.get(n); continue; } return this.fromFrames(n, e.f, e.lim); }
    this.no("it uses " + n);
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
      else if (r.ast || r.val) {
        // a name bound outside: worked out again here (it is pure, so the value is the same), or else read as a number when spork runs
        this.outside.set(key, SPK_PENDING);
        const why = this.why, pc = this.pc; this.pc = this.TRUE;
        try { v = r.ast ? this.cellValue(r.ast, { f: fr.f, lim: pos + 1 }) : this.chain(r.val, { f: fr.f, lim: pos }); }
        catch (e) { if (e !== SPKFAIL) throw e; this.why = why; v = null; }
        this.pc = pc;
      }
      if (!v) v = this.capture(this.g.refJS(r));
      this.outside.set(key, v);
      return v;
    }
    if (this.g.globals.has(n)) {
      const d = Object.getOwnPropertyDescriptor(G, n);
      if (!d || d.get) this.no(n === "random" ? "it reads random, which changes from run to run" : "it uses " + n + ", a library cell spork can't work out yet");
      if (d.value instanceof Native) { if (SPK_NATIVES.has(n)) return { k: "nat", n }; this.no("it uses the host word " + n); }
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
  send(v, a) {
    if (v.k === "fn") {
      if (a.k === "s" && v.ast.items.some(x => x.k === "bind" && x.name === a.v)) this.no("it reads a field by name");
      return this.call(v, a);
    }
    if (v.k === "nat") return this.native(v.n, a);
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
    if (n === "noise") { const [x, y] = nums(2); return this.num(this.node("noise", x.id, y.id)); }
    if (n === "clamp") {
      const [x, lo, hi] = nums(3);
      return this.sel(this.boo(this.node("lt", x.id, lo.id)), lo, this.sel(this.boo(this.node("gt", x.id, hi.id)), hi, x));
    }
    const [x, y, t] = nums(3);   // toward
    return this.num(this.node("add", x.id, this.node("mul", this.node("sub", y.id, x.id), t.id)));
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
    this.why = null;
    const env = { f: this.g.frames.length - 1, lim: Infinity };
    let cur = item === "num" ? this.num(this.node("x", -1, -1, -1)) : { k: "row", over: new Map() }, pass = this.TRUE;
    const fn = st => { const f = this.term(st.arg, env); if (f.k !== "fn" && f.k !== "nat") this.no(st.w + " isn't given a cell"); return f; };
    for (const st of stages) {
      if (st.w === "collect") { const f = fn(st); this.pc = pass; cur = this.apply(f, cur); }
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
  emit(kind, outs, keys) {
    const N = this.nodes, live = new Uint8Array(N.length);
    for (const i of outs.concat(this.guards)) live[i] = 1;
    for (let i = N.length - 1; i >= 0; i--) if (live[i]) { const [, a, b, c] = N[i]; if (a >= 0) live[a] = 1; if (b >= 0) live[b] = 1; if (c >= 0) live[c] = 1; }
    const map = new Int32Array(N.length).fill(-1), out = []; let jsOnly = false;
    for (let i = 0; i < N.length; i++) if (live[i]) {
      const [op, a, b, c, v] = N[i]; map[i] = out.length;
      if (SPK_JSONLY.has(op)) jsOnly = true;
      const lit = v === undefined ? "" : "," + (typeof v === "number" ? spkNum(v) : typeof v === "string" ? JSON.stringify(v) : String(v));
      out.push("[\"" + op + "\"," + (a >= 0 ? map[a] : -1) + "," + (b >= 0 ? map[b] : -1) + "," + (c >= 0 ? map[c] : -1) + lit + "]");
    }
    const g = [...new Set(this.guards)].map(i => map[i]);
    return "{nodes:[" + out.join(",") + "],outs:[" + outs.map(i => map[i]).join(",") + "],guards:[" + g.join(",") + "],kind:\"" + kind + "\"" +
      (keys ? ",keys:" + JSON.stringify(keys) : "") + ",jsOnly:" + jsOnly + "}";
  }
}
// a run of collect, keep and fold steps (each given a cell, or a name), and length at the end, starting at T[i]
const FUSE_STEPS = new Set(["collect", "keep", "fold"]);
function fuseSegment(T, i) {
  let j = i; const stages = [];
  while (j + 1 < T.length && T[j].k === "word" && FUSE_STEPS.has(T[j].v) &&
    (T[j + 1].k === "cell" || (T[j + 1].k === "word" && !FUSED.has(T[j + 1].v) && !LAZYOPS.has(T[j + 1].v) && !(T[j + 1].v in ALL) && !["!", "true", "false", "_", "left", "right"].includes(T[j + 1].v)))) {
    stages.push({ w: T[j].v, arg: T[j + 1], line: T[j].line }); j += 2;
    if (T[j - 2].v === "fold") break;
  }
  if (stages.length && stages[stages.length - 1].w !== "fold" && j < T.length && T[j].k === "word" && T[j].v === "length") { stages.push({ w: "length", line: T[j].line }); j++; }
  // worth it for two steps or more, or one collect or keep (fold alone has its own loop, decision 88)
  if (!stages.length || (stages.length === 1 && stages[0].w === "fold")) return null;
  return { stages, start: i, end: j };
}
// the first and last line a piece of the tree is on
function lineSpan(n) {
  let lo = Infinity, hi = -Infinity;
  (function walk(x) { if (!x || typeof x !== "object") return; if (typeof x.line === "number" && x.line > 0) { lo = Math.min(lo, x.line); hi = Math.max(hi, x.line); } for (const k in x) if (!NOTE_KEYS.has(k) || k === "line") { const v = x[k]; if (v && typeof v === "object") walk(v); } })(n);
  return [lo, hi];
}
// where a name sits among a frame's names, in the order they were bound
function spkPos(names, n) { let i = 0; for (const k of names.keys()) { if (k === n) return i; i++; } return -1; }
// does a cell (or anything in it) use _ or left?
const SPK_IT = new Set(["_", "left", "right"]);
function spkUses(c) { if (c.spkUses === undefined) c.spkUses = mentions(c, SPK_IT); return c.spkUses; }
const KOPS = { "+": ["+", "n"], "-": ["-", "n"], "*": ["*", "n"], "/": ["/", "n"], "%": ["%", "n"], "<": ["<", "b"], ">": [">", "b"], "<=": ["<=", "b"], ">=": [">=", "b"], "=": ["===", "b"], "!=": ["!==", "b"] };
const KPOST = { abs: "Math.abs", floor: "Math.floor", round: "Math.round", ceil: "Math.ceil", sqrt: "Math.sqrt", sin: "Math.sin", cos: "Math.cos", tan: "Math.tan", log: "Math.log", neg: "-" };
// a kernel can't be made: remember the first reason, for the speed notes (decision 86)
function kNo(K, why) { if (!K.why) K.why = why; return null; }
function kCol(f, K) { let v = K.cols.get(f); if (!v) { v = "$c" + K.cols.size; K.cols.set(f, v); } return v + "[$i]"; }
// the start of a kernel: find each field's column, and read each outside name once
function kPro(K) {
  let s = "";
  for (const [f, v] of K.cols) s += "const " + v + "=cols[rs.index(" + JSON.stringify(f) + ")];if(" + v + "===undefined)return null;";
  for (const e of K.caps.values()) s += "const " + e.v + "=" + e.ref + ";" + (e.num ? "if(typeof " + e.v + "!==\"number\")return null;" : "");
  return s;
}
// does this expression use any of these names?
function mentions(n, names) {
  if (!n || typeof n !== "object") return false;
  if (n.k === "word") return names.has(n.v);
  for (const key in n) { const v = n[key]; if (Array.isArray(v) ? v.some(x => mentions(x, names)) : (v && typeof v === "object" && mentions(v, names))) return true; }
  return false;
}
const OPNAME = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "<": "LT", ">": "GT", "<=": "LE", ">=": "GE", "=": "EQ", "!=": "NE", "..": "CAT", "with": "WITH", "@": "AT" };
// a cell literal of fields only, none using a sibling field, _, left or right
function fieldsOnly(c) {
  if (c.names.length || !c.items.length || !c.items.every(x => x.k === "bind")) return false;
  const names = new Set(c.items.map(x => x.name)); let ok = names.size === c.items.length;
  const bad = w => names.has(w) || w === "_" || w === "left" || w === "right";
  const walk = n => {
    if (!ok || !n || typeof n !== "object") return;
    if (n.k === "chain") { n.terms.forEach((t, i) => { if (t.k === "word") { if (i === 0 && bad(t.v)) ok = false; else if (i > 0 && (t.v === "_" || t.v === "left" || t.v === "right")) ok = false; } else walk(t); }); return; }
    if (n.k === "word") { if (bad(n.v)) ok = false; return; }
    for (const key in n) { const v = n[key]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") walk(v); }
  };
  c.items.forEach(x => walk(x.val));
  return ok;
}
// is a chain's answer certainly true or false? "false" when it is the word false itself, "bool" for a test, else null.
// Strictly left to right, so the last step decides: a comparison, and, or, not, or the words true and false.
const TESTOPS = new Set(["<", ">", "<=", ">=", "=", "!="]);
function givesBool(ch) {
  const T = ch.terms; if (!T.length) return null;
  if (T.length === 1 && T[0].k === "word" && T[0].v === "false") return "false";
  let ty = T[0].k === "word" && T[0].v === "true" ? "bool" : T[0].k === "group" && T[0].items.length === 1 && T[0].items[0].k === "chain" && givesBool(T[0].items[0]) ? "bool" : null;
  for (let i = 1; i < T.length; i++) {
    const t = T[i];
    if (t.k === "word" && (FUSED.has(t.v) || t.v === "and" || t.v === "or") && i + 1 < T.length) { ty = TESTOPS.has(t.v) || t.v === "and" || t.v === "or" ? "bool" : null; i++; }
    else if (t.k === "word" && t.v === "not") ty = ty ? "bool" : null;
    else ty = null;
  }
  return ty;
}
// a field value simple enough to work out when the cell is made: literals, names, field reads and arithmetic on them
function simpleVal(ch) {
  if (ch.k !== "chain" || !ch.terms.length) return false;
  const T = ch.terms;
  const term = t => t.k === "num" || t.k === "str" || (t.k === "word" && !["_", "left", "right", "!"].includes(t.v)) ||
    (t.k === "group" && t.items.length === 1 && simpleVal(t.items[0])) || (t.k === "cell" && simpleParts(t));
  if (!term(T[0])) return false;
  for (let i = 1; i < T.length; i++) {
    const t = T[i];
    if (t.k === "word" && ["print", "each", "times", "else", "and", "or"].includes(t.v)) return false;
    if (!term(t)) return false;
  }
  return true;
}
// [a, b, c] whose parts are all simple: built straight away as a cell of values
function simpleParts(c) { return !c.names.length && c.items.length > 0 && c.items.every(x => x.k === "chain" && simpleVal(x)); }
const NOTE_KEYS = new Set(["line", "kern", "bindName", "sporkArg", "spkUses"]);
function srcOf(c) { return JSON.stringify(c, (k, v) => NOTE_KEYS.has(k) ? undefined : v); }

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
function compile(src, globals) {
  const ast = parse(src);
  const g = new Gen(globals);
  g.sporkNames = sporkTargets(ast);
  g.temps.push([]);
  const js = g.genCell({ k: "cell", names: [], items: ast });
  const top = g.temps.pop();
  // each body is compiled more than once (to run, and to read fields), so its speed note is kept once
  const seenSpeed = new Set(), speed = g.speed.filter(x => { const k = x.line + " " + x.word + " " + x.fast; if (seenSpeed.has(k)) return false; seenSpeed.add(k); return true; });
  return { js, shapes: g.shapes, prologue: (top.length ? "let " + top.join(",") + ";\n" : "") + g.consts.join("\n"), speed };
}

// ===================================================================== runtime
const BANG = { toString: () => "!" };   // "no input" (decisions 58, 69)
const ANY = { toString: () => "any" };
const UNSET = {};
let LOG = (msg) => { if (typeof console !== "undefined") console.log("sprout: " + msg); };
const warned = new Set();
const seen = new Map();
function LOG_MISS(msg, line) { const m = msg + (line ? " (line " + line + ")" : ""); const c = (seen.get(m) || 0) + 1; seen.set(m, c); if (c <= 3) LOG(m + (c === 3 ? " (and more; not shown again)" : "")); return false; }
function UNKNOWN(n, line, hint) { return LOG_MISS("\"" + n + "\" isn't a word Sprout knows yet" + (hint ? " (did you mean \"" + hint + "\"?)" : ""), line); }
// the closest name to a likely typo: at most 1 edit for short names, 2 for longer ones; none if it's a tie between several
function nearest(n, names) {
  const limit = n.length <= 4 ? 1 : 2; let best = null, bestD = limit + 1, tie = false;
  for (const m of names) {
    if (m === n || Math.abs(m.length - n.length) > limit) continue;
    const d = editDistance(n, m, limit);
    if (d < bestD) { best = m; bestD = d; tie = false; } else if (d === bestD) tie = true;
  }
  return best && !tie ? best : null;
}
function editDistance(a, b, cap) {
  // optimal string alignment: insert, delete, change, or swap two neighbouring letters, each one edit
  const d = [];
  for (let x = 0; x <= a.length; x++) { d.push(new Array(b.length + 1).fill(0)); d[x][0] = x; }
  for (let y = 0; y <= b.length; y++) d[0][y] = y;
  for (let x = 1; x <= a.length; x++) {
    let low = Infinity;
    for (let y = 1; y <= b.length; y++) {
      let v = Math.min(d[x - 1][y] + 1, d[x][y - 1] + 1, d[x - 1][y - 1] + (a[x - 1] === b[y - 1] ? 0 : 1));
      if (x > 1 && y > 1 && a[x - 1] === b[y - 2] && a[x - 2] === b[y - 1]) v = Math.min(v, d[x - 2][y - 2] + 1);
      d[x][y] = v; if (v < low) low = v;
    }
    if (low > cap) return cap + 1;
  }
  return d[a.length][b.length];
}

// Act: one activation of a cell, holding its inputs and (for reads) its worked-out slots
class Act {
  constructor(c, ins, it, left) { this.c = c; this.ins = ins; this.it = it; this.left = left; this.cache = null; this.fns = null; }
  get(i) {
    if (this.cache === null) {
      if (!this.c.slots) return false;
      this.cache = new Array(this.c.sh.n).fill(UNSET); this.fns = this.c.slots(this);
    }
    let v = this.cache[i];
    if (v === UNSET) { v = this.fns[i](); this.cache[i] = v; }
    return v;
  }
}

// Cell: from a literal. Fields and parts are read lazily; running is always fresh.
class Cell {
  constructor(sh, slots, run, defs, caps, kn) { this.sh = sh; this.slots = slots; this.runF = run; this.defs = defs; this.caps = caps; this.left = undefined; this._a = null; this.kn = kn || null; }
  act() { return this._a || (this._a = new Act(this, this.defaults(), false, this.left)); }
  defaults() { const d = this.defs; if (!d.length) return EMPTY; const o = new Array(d.length); for (let j = 0; j < d.length; j++) o[j] = d[j] ? d[j]() : false; return o; }
  field(name) { const i = this.sh.fidx[name]; return i === undefined ? UNSET : this.act().get(i); }
  fieldNames() { return Object.keys(this.sh.fidx); }
  count() { return this.sh.pidx.length; }
  part(n) { const i = this.sh.pidx[n - 1]; return i === undefined ? false : this.act().get(i); }
  takesInput() { return this.sh.names.length > 0 || this.sh.usesIt; }
  run(arg) { let r = this.run1(arg); while (r instanceof Bounce) r = r.c.run1(r.a); return r; }
  // run1: one step; a call in tail position comes back as a Bounce for the loop above (stack stays flat)
  run1(arg) {
    const sh = this.sh, nn = sh.names.length, L = this.left;
    if (arg === BANG || arg === undefined) return nn ? this.call(this.defaults()) : this.runF(L, false);
    if (nn === 0) return this.runF(L, arg);
    if (nn === 1) return this.runF(L, false, arg); // one name takes the whole value (decision 19)
    // several names: unpack the argument cell by position, then by name (decision 15)
    const ins = this.defaults();
    if (isCell(arg)) {
      const pc = arg.count();
      if (pc > nn) lint("more values than names: " + pc + " given, " + nn + " taken");
      for (let j = 0; j < nn && j < pc; j++) ins[j] = arg.part(j + 1);
      if (arg.fieldNames().length) for (let j = 0; j < nn; j++) { const v = arg.field(sh.names[j]); if (v !== UNSET) ins[j] = v; }
      for (let j = pc; j < nn; j++) if (!this.defs[j] && arg.field(sh.names[j]) === UNSET) lint("\"" + sh.names[j] + "\" was not given, so it is false");
    } else ins[0] = arg;
    return this.call(ins);
  }
  call(ins) {
    const L = this.left;
    switch (ins.length) {
      case 1: return this.runF(L, false, ins[0]);
      case 2: return this.runF(L, false, ins[0], ins[1]);
      case 3: return this.runF(L, false, ins[0], ins[1], ins[2]);
      case 4: return this.runF(L, false, ins[0], ins[1], ins[2], ins[3]);
      default: return this.runF(L, false, ...ins);
    }
  }
  bindLeft(r) { const b = new Cell(this.sh, this.slots, this.runF, this.defs, this.caps, this.kn); b.left = r; return b; }
}
const EMPTY = [];
function lint(msg) { if (!warned.has(msg)) { warned.add(msg); LOG("lint: " + msg); } }

// FShape: the field names of a kind of record, shared by every record with the same names (like a JS hidden class)
class FShape {
  constructor(keys) { this.keys = keys; this.next = new Map(); }
  index(k) { const ks = this.keys; for (let i = 0; i < ks.length; i++) if (ks[i] === k) return i; return -1; }
  add(k) { let s = this.next.get(k); if (!s) { s = new FShape(this.keys.concat([k])); this.next.set(k, s); } return s; }
}
const ROOT = new FShape([]);
const shapeCache = new Map();
function shapeFor(keys) { const id = keys.join("\u0000"); let s = shapeCache.get(id); if (!s) { s = ROOT; for (const k of keys) s = s.index(k) >= 0 ? s : s.add(k); shapeCache.set(id, s); } return s; }

// VCell: a cell of worked-out values, made by with, .., collect, keep and range
class VCell {
  // parts: JS array (0-based); fs: field shape; fv: field values in shape order
  constructor(parts, fs, fv) { this.parts = parts; this.fs = fs || ROOT; this.fv = fv || EMPTY; }
  field(name) { const i = this.fs.index(name); return i < 0 ? UNSET : this.fv[i]; }
  fieldNames() { return this.fs.keys; }
  get fields() { if (!this.fs.keys.length) return null; const m = new Map(); this.fs.keys.forEach((k, i) => m.set(k, this.fv[i])); return m; }
  count() { return this.parts.length; }
  part(n) { const v = this.parts[n - 1]; return v === undefined ? false : v; }
  takesInput() { return false; }
  run() { return this.parts.length ? this.parts[this.parts.length - 1] : false; }
}
// a cell of values from a JS array of parts and a Map of fields
function VFM(parts, fields) { return fields && fields.size ? new VCell(parts, shapeFor([...fields.keys()]), [...fields.values()]) : new VCell(parts, ROOT, EMPTY); }
// RCell: range n, the cell [1, 2, ..., n]. Part i is i, so loops never need to build the list.
class RCell extends VCell {
  constructor(n) { super(null, ROOT, EMPTY); this.n = n; this._p = null; }
  get parts() { if (!this._p) { const o = new Array(this.n); for (let i = 0; i < this.n; i++) o[i] = i + 1; this._p = o; } return this._p; }
  set parts(v) {}
  count() { return this.n; }
  part(i) { return i >= 1 && i <= this.n ? i : false; }
  run() { return this.n ? this.n : false; }
}
function VC(fs, vals) { return new VCell(EMPTY, fs, vals); }
function VP(parts) { return new VCell(parts, ROOT, EMPTY); }
function MK(sh, slots, run, defs, caps, kn) { return new Cell(sh, slots, run, defs, caps, kn); }

// ColCell: a list of records that share one shape and hold only numbers, stored as one number array per field (decision 82).
// To a program it is the same list: parts, @, length, = and str all see ordinary records, made when first asked for.
class ColCell extends VCell {
  constructor(rs, cols, n) { super(null, ROOT, EMPTY); this.rs = rs; this.cols = cols; this.n = n; this._p = null; }
  get parts() { if (!this._p) { const o = new Array(this.n); for (let i = 0; i < this.n; i++) o[i] = this.row(i); this._p = o; } return this._p; }
  set parts(v) {}
  row(i) { const c = this.cols, k = c.length, fv = new Array(k); for (let j = 0; j < k; j++) fv[j] = c[j][i]; return new VCell(EMPTY, this.rs, fv); }
  count() { return this.n; }
  part(k) { if (!Number.isInteger(k) || k < 1 || k > this.n) return false; return this._p ? this._p[k - 1] : this.row(k - 1); }
  run() { return this.n ? this.part(this.n) : false; }
}
function COLC(rs, cols, n) { return new ColCell(rs, cols, n); }
function NCOL(col, n) { return new NCell(col.slice(0, n)); }
// NCell: a list of numbers kept in one Float64Array, made by spork and sort. To a program it is the same list.
class NCell extends VCell {
  constructor(a) { super(null, ROOT, EMPTY); this.a = a; this._p = null; }
  get parts() { if (!this._p) this._p = Array.from(this.a); return this._p; }
  set parts(v) {}
  count() { return this.a.length; }
  part(k) { return Number.isInteger(k) && k >= 1 && k <= this.a.length ? this.a[k - 1] : false; }
  run() { return this.a.length ? this.a[this.a.length - 1] : false; }
}
let COLMIN = 32;
const COLS = new WeakMap();
// the columns for a list, if it is one: a list already in columns, or 32 or more records of one shape holding only numbers
function toCols(xs) {
  if (xs instanceof ColCell) return xs;
  if (!(xs instanceof VCell) || xs instanceof RCell || xs.fs !== ROOT) return null;
  const p = xs.parts; if (p.length < COLMIN) return null;
  let c = COLS.get(xs); if (c !== undefined) return c;
  c = rowsToCols(p, null); COLS.set(xs, c); return c;
}
function rowsToCols(p, rs) {
  const n = p.length; if (!n) return null;
  const r0 = p[0]; if (!(r0 instanceof VCell)) return null;
  rs = rs || r0.fs; const k = rs.keys.length; if (!k) return null;
  const cols = new Array(k); for (let j = 0; j < k; j++) cols[j] = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const r = p[i]; if (!(r instanceof VCell) || r.fs !== rs || r.parts.length) return null;
    const fv = r.fv; for (let j = 0; j < k; j++) { const v = fv[j]; if (typeof v !== "number") return null; cols[j][i] = v; }
  }
  return new ColCell(rs, cols, n);
}
// a .. b where either side is in columns: the result stays in columns when both sides hold records of the same shape
function colMerge(a, b) {
  const side = (x, rs) => {
    if (x instanceof ColCell) return x.rs === rs ? x : null;
    if (!isCell(x) || x instanceof RCell || x.fieldNames().length) return null;
    if (x.count() === 0) return EMPTYCOL;
    return rowsToCols(partsOf(x), rs);
  };
  const rs = (a instanceof ColCell ? a : b).rs;
  const ca = side(a, rs); if (!ca) return null;
  const cb = side(b, rs); if (!cb) return null;
  if (cb === EMPTYCOL) return ca === EMPTYCOL ? null : ca;
  if (ca === EMPTYCOL) return cb;
  const na = ca.n, nb = cb.n, k = ca.cols.length, cols = new Array(k);
  for (let j = 0; j < k; j++) { const o = new Float64Array(na + nb); o.set(ca.cols[j], 0); o.set(cb.cols[j], na); cols[j] = o; }
  return new ColCell(rs, cols, na + nb);
}
const EMPTYCOL = {};
const isCell = v => v instanceof Cell || v instanceof VCell;
function partsOf(c) { if (c instanceof VCell) return c.parts; const n = c.count(), o = new Array(n); for (let i = 0; i < n; i++) o[i] = c.part(i + 1); return o; }
function fieldsOf(c) { if (c instanceof VCell) return c.fields || new Map(); const m = new Map(); for (const k of c.fieldNames()) m.set(k, c.field(k)); return m; }

// Native: a cell written in JavaScript (host words, range, rand...). fn takes the one argument.
class Native { constructor(name, fn, effect) { this.name = name; this.fn = fn; this.effect = !!effect; } }
// Waiting: a prototype method that has its left side and waits for its right side
class Waiting { constructor(fn, left) { this.fn = fn; this.left = left; } }
class Bounce { constructor(c, a) { this.c = c; this.a = a; } }
function UNB(r) { while (r instanceof Bounce) r = r.c.run1(r.a); return r; }
// TAIL: a send in tail position. A cell is not called here; its caller's loop calls it.
function TAIL(r, a) { if (r instanceof Cell && !(typeof a === "string" && r.sh.fidx[a] !== undefined)) return new Bounce(r, a); return SEND(r, a); }

// ---- reading a field (decisions 2, 38, 52)
function readField(r, v) {
  if (v instanceof Cell && v.sh.usesLeft) { const b = v.bindLeft(r); return b.takesInput() ? b : b.run(BANG); }
  return v;
}
// SW: send a word. Fields first (with prototype methods), then a name in scope as the argument.
// SWI: SW with an inline cache. A record read at this spot usually has the same shape every time.
function SWI(r, w, lex, line, ic, quiet) {
  if (r instanceof VCell) {
    const fs = r.fs;
    if (fs === ic.s) { const v = r.fv[ic.i]; return v instanceof Cell && v.sh.usesLeft ? readField(r, v) : v; }
    const i = fs.index(w);
    if (i >= 0) { if (lex) clash(w, line); ic.s = fs; ic.i = i; const v = r.fv[i]; return v instanceof Cell && v.sh.usesLeft ? readField(r, v) : v; }
  }
  return SW(r, w, lex, line, quiet);
}
// decision 73: a word that is both a field of the receiver and a name in scope reads the field, loudly
function clash(w, line) { lint("\"" + w + "\" is both a field here and a name in scope; the field wins" + (line ? " (line " + line + ")" : "")); }
function SW(r, w, lex, line, quiet) {
  if (r instanceof Cell || r instanceof VCell) { const v = r.field(w); if (v !== UNSET) { if (lex) clash(w, line); return readField(r, v); } }
  const m = protoOf(r)[w];
  if (m !== undefined) return m.ar ? new Waiting(m.fn, r) : m.fn(r);
  if (lex) return SEND(r, lex());
  if (quiet) return false;
  // a field that isn't there: suggest the nearest field this cell does have
  const hint = (r instanceof Cell || r instanceof VCell) ? nearest(w, r.fieldNames()) : null;
  return LOG_MISS(describe(r) + " doesn't know " + w + (hint ? " (did you mean " + hint + "?)" : ""), line);
}
// SEND: send a value
function SEND(r, a) {
  if (r instanceof Cell) {
    if (typeof a !== "string" && a !== BANG && r.sh.names.length === 1) { let v = r.runF(r.left, false, a); while (v instanceof Bounce) v = v.c.run1(v.a); return v; }
    if (typeof a === "string") { const v = r.field(a); if (v !== UNSET) return readField(r, v); }
    return r.run(a);
  }
  if (r instanceof Waiting) return r.fn(r.left, a);
  if (r instanceof Native) return r.fn(a === BANG ? false : a);
  if (r instanceof VCell) { if (typeof a === "string") { const v = r.field(a); if (v !== UNSET) return readField(r, v); } return r.run(a); }
  if (r === true || r === false) { if (isCell(a)) return r ? a.run(BANG) : false; return MISSING(r, a); }
  return MISSING(r, a);
}
// decision 28: an unhandled send logs and gives false
function MISSING(r, m, line) { return LOG_MISS(describe(r) + " doesn't know " + describe(m), line); }
function describe(v) { const s = fmt(v); return s.length > 30 ? s.slice(0, 30) + "..." : s; }
function RUNC(c) { return c.run(BANG); }
function ISBOOL(v, op) { return typeof v === "boolean" ? v : MISSING(v, op); }

// ---- effects: queued while the loop is running update, carried out after (decision 33)
let EFFQ = null;
function effect(f) { if (EFFQ) EFFQ.push(f); else f(); return false; }
function queueEffects() { EFFQ = []; }
function runEffects() { const q = EFFQ || []; EFFQ = null; for (const f of q) f(); return q.length; }
function dropEffects() { const n = EFFQ ? EFFQ.length : 0; EFFQ = null; return n; }

// noise: a 32-bit integer hash of both inputs (whole and fractional parts), mapped to [0, 1)
function NOISE(x, y) {
  const fx = Math.floor(x), fy = Math.floor(y);
  let h = Math.imul(fx ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((fy + 0x632be5ab) | 0, 0xc2b2ae35) ^ Math.imul(Math.floor((x - fx) * 4294967296) | 0, 0x27d4eb2f) ^ Math.imul(Math.floor((y - fy) * 4294967296) | 0, 0x165667b1);
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d); h ^= h >>> 15; h = Math.imul(h, 0x846ca68b); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---- text
function fmt(x) {
  if (x === true) return "true"; if (x === false) return "false"; if (x === BANG) return "!"; if (x === ANY) return "any";
  if (typeof x === "number") return String(+x.toFixed(10));
  if (typeof x === "string") return x;
  if (x instanceof Native) return "[" + x.name + "]";
  if (x instanceof Waiting) return "[waiting]";
  if (x instanceof Cell && x.takesInput()) return "[cell]";
  if (isCell(x)) {
    const out = [];
    for (const k of x.fieldNames()) { const v = x.field(k); out.push(k + " : " + (v instanceof Cell && (v.takesInput() || v.sh.usesLeft) ? "[cell]" : fmt(v))); }
    for (const p of partsOf(x)) out.push(p instanceof Cell && p.takesInput() ? "[cell]" : fmt(p));
    return "[" + out.join(", ") + "]";
  }
  return String(x);
}
function STR() { let s = ""; for (let i = 0; i < arguments.length; i++) s += fmt(arguments[i]); return s; }

// ---- equality: same contents, never runs anything (decisions 22, 23)
function eq(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (!isCell(a) || !isCell(b)) return false;
  // a cell that takes input compares by its code and the values it captured (decision 23)
  const ia = a instanceof Cell && a.takesInput(), ib = b instanceof Cell && b.takesInput();
  if (ia || ib) {
    if (!(ia && ib) || a.sh.src !== b.sh.src) return false;
    const ca = a.caps(), cb = b.caps();
    for (let i = 0; i < ca.length; i++) if (!eq(ca[i], cb[i])) return false;
    return true;
  }
  // any other cell compares by its worked-out parts and fields (decision 72)
  const n = a.count(); if (n !== b.count()) return false;
  for (let i = 1; i <= n; i++) if (!eq(a.part(i), b.part(i))) return false;
  const fa = a.fieldNames(), fb = b.fieldNames(); if (fa.length !== fb.length) return false;
  for (const k of fa) { const v = b.field(k); if (v === UNSET || !eq(a.field(k), v)) return false; }
  return true;
}

// ---- with and .. : one operation (decision 45)
function merge(a, b) {
  if (typeof a === "string" || typeof a === "number") return fmt(a) + fmt(b);
  if (!isCell(a)) return MISSING(a, "with");
  if (!isCell(b)) return MISSING(b, "with");
  if (a instanceof ColCell || b instanceof ColCell) { const r = colMerge(a, b); if (r) return r; }
  const pa = partsOf(a), pb = partsOf(b);
  const parts = pb.length ? (pa.length ? pa.concat(pb) : pb) : pa;
  let fs, fv;
  if (a instanceof VCell) { fs = a.fs; fv = a.fv; } else { const ks = a.fieldNames(); fs = shapeFor(ks); fv = ks.map(k => a.field(k)); }
  const kb = b.fieldNames();
  if (kb.length) {
    fv = fv.slice();
    for (const k of kb) { const v = b.field(k); const i = fs.index(k); if (i < 0) { fs = fs.add(k); fv.push(v); } else fv[i] = v; }
  }
  return new VCell(parts, fs, fv);
}

// ---- operators: fused fast paths, falling back to prototype fields (decisions 36, 37)
function opSlow(name, a, b) { return SEND(SW(a, name, null, 0), b); }
function ADD(a, b) { return typeof a === "number" && typeof b === "number" ? a + b : opSlow("+", a, b); }
function SUB(a, b) { return typeof a === "number" && typeof b === "number" ? a - b : opSlow("-", a, b); }
function MUL(a, b) { return typeof a === "number" && typeof b === "number" ? a * b : opSlow("*", a, b); }
function DIV(a, b) { return typeof a === "number" && typeof b === "number" ? a / b : opSlow("/", a, b); }
function MOD(a, b) { return typeof a === "number" && typeof b === "number" ? ((a % b) + b) % b : opSlow("%", a, b); }
function LT(a, b) { return typeof a === "number" && typeof b === "number" ? a < b : opSlow("<", a, b); }
function GT(a, b) { return typeof a === "number" && typeof b === "number" ? a > b : opSlow(">", a, b); }
function LE(a, b) { return typeof a === "number" && typeof b === "number" ? a <= b : opSlow("<=", a, b); }
function GE(a, b) { return typeof a === "number" && typeof b === "number" ? a >= b : opSlow(">=", a, b); }
function userOp(a, w) { return (a instanceof Cell || a instanceof VCell) && a.field(w) !== UNSET; }
function EQ(a, b) { if (a === b) return true; if (typeof a !== "object") return false; return userOp(a, "=") ? opSlow("=", a, b) : eq(a, b); }
function NE(a, b) { return !EQ(a, b); }
function CAT(a, b) { if (typeof a === "string") return a + (typeof b === "string" ? b : fmt(b)); return userOp(a, "..") ? opSlow("..", a, b) : merge(a, b); }
function WITH(a, b) { return userOp(a, "with") ? opSlow("with", a, b) : merge(a, b); }
function AT(a, n) { return PART(a, n); }
// x with [a : ..., b : ...] compiled straight to a field update
function WITHF(a, keys, vals, ic) {
  if (a instanceof VCell) {
    const fs = a.fs;
    if (fs === ic.s) { const fv = a.fv.slice(), x = ic.x; for (let i = 0; i < x.length; i++) fv[x[i]] = vals[i]; return new VCell(a.parts, ic.o, fv); }
    if (fs.index("with") < 0) {
      let out = fs; const fv = a.fv.slice(), x = new Array(keys.length);
      for (let i = 0; i < keys.length; i++) { let j = out.index(keys[i]); if (j < 0) { out = out.add(keys[i]); j = out.keys.length - 1; } fv[j] = vals[i]; x[i] = j; }
      ic.s = fs; ic.o = out; ic.x = x;
      return new VCell(a.parts, out, fv);
    }
  }
  return WITH(a, new VCell(EMPTY, shapeFor(keys), vals));
}
function PART(a, n) {
  if (isCell(a)) return a.part(n);
  if (typeof a === "string") return n >= 1 && n <= a.length ? a[n - 1] : false;
  return MISSING(a, "@");
}
function LEN(a) { if (isCell(a)) return a.count(); if (typeof a === "string") return a.length; return MISSING(a, "length"); }

// ---- calling a cell with each item (collections are methods, decision 55)
function CALL(f, x) {
  if (f instanceof Cell) return f.run(x);
  return SEND(f, x);
}
function each(xs, f) {
  if (f instanceof Cell && f.kn && f.kn.e) { const c = toCols(xs); if (c && f.kn.e(c, c.rs, c.cols, c.n)) return false; }
  const one = f instanceof Cell && f.sh.names.length === 1, run = one ? f.runF : null, L = one ? f.left : undefined;
  if (xs instanceof RCell) { for (let i = 1; i <= xs.n; i++) one ? UNB(run(L, false, i)) : CALL(f, i); return false; }
  const p = partsOf(xs); for (let i = 0; i < p.length; i++) one ? UNB(run(L, false, p[i])) : CALL(f, p[i]);
  return false;
}
function collect(xs, f) {
  if (f instanceof Cell && f.kn && f.kn.m) { const c = toCols(xs); if (c) { const r = f.kn.m(c, c.rs, c.cols, c.n); if (r) return r; } }
  const p = partsOf(xs);
  const n = p.length, out = new Array(n);
  if (f instanceof Cell && f.sh.names.length === 1) { const run = f.runF, L = f.left; for (let i = 0; i < n; i++) out[i] = UNB(run(L, false, p[i])); }
  else for (let i = 0; i < n; i++) out[i] = CALL(f, p[i]);
  return new VCell(out, ROOT, EMPTY);
}
function keep(xs, f) {
  if (f instanceof Cell && f.kn && f.kn.t) { const c = toCols(xs); if (c) { const r = f.kn.t(c, c.rs, c.cols, c.n); if (r) return r; } }
  const p = partsOf(xs), o = [];
  const one = f instanceof Cell && f.sh.names.length === 1, run = one ? f.runF : null, L = one ? f.left : undefined;
  for (let i = 0; i < p.length; i++) { const t = one ? UNB(run(L, false, p[i])) : CALL(f, p[i]); if (t === true) o.push(p[i]); else if (t !== false) MISSING(t, "keep"); }
  return new VCell(o, ROOT, EMPTY);
}
function fold(xs, arg) {
  if (!isCell(arg)) return MISSING(arg, "fold");
  let acc = arg.part(1); const f = arg.part(2);
  if (COLMIN !== Infinity && f instanceof Cell && f.kn && f.kn.f && (xs instanceof RCell || (xs instanceof VCell && !(xs instanceof ColCell) && xs.fs === ROOT))) {
    const r = f.kn.f(acc, xs, xs instanceof RCell); if (r !== null) return r;
  }
  if (f instanceof Cell && f.sh.names.length === 2) {
    const run = f.runF, L = f.left;
    if (xs instanceof RCell) { for (let i = 1; i <= xs.n; i++) acc = UNB(run(L, false, acc, i)); return acc; }
    const p = partsOf(xs); for (let i = 0; i < p.length; i++) acc = UNB(run(L, false, acc, p[i])); return acc;
  }
  const p = partsOf(xs);
  for (let i = 0; i < p.length; i++) acc = CALL(f, new VCell([acc, p[i]], ROOT, EMPTY));
  return acc;
}
function times(n, f) { for (let i = 1; i <= n; i++) CALL(f, i); return false; }

// ---- spork (decision 47): a parallel collect. A pure cell worked out ahead (decision 91) runs as one numeric kernel,
// on the fastest way this machine has; anything else is collect.
let SPORK = { info: null, wasm: undefined, gpu: null, tally: [] };
const sporkRan = info => { SPORK.info = info; if (SPORK.tally.length < 50) SPORK.tally.push(info); };
function spork(xs, f) {
  if (COLMIN !== Infinity && f instanceof Cell && f.kn && f.kn.s) { const r = runSpork(f.kn.s, xs); if (r) return r; }
  const t0 = nowMs(), r = collect(xs, f);
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
  if (COLMIN === Infinity) return NOFUSE;
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
  if (K.kind === "fold") src = pre + "let acc=" + r(K.outs[0]) + ";for(let i=0;i<n;i++){const x=X?X[i]:i+1;" + body + g + "acc=" + r(K.outs[1]) + "}return acc";
  else src = pre + "let m=0;for(let i=0;i<n;i++){const x=X?X[i]:i+1;" + body + g + "if(" + r(K.outs[0]) + "){" +
    K.outs.slice(1).map((o, j) => "O[" + j + "][m]=" + (K.kind === "b" ? r(o) + "?1:0" : r(o)) + ";").join("") + (K.kind === "row" ? "kept[m]=i;" : "") + "m++}}return m";
  const f = new Function("NOISE", "NOFUSE", "n", "X", "cols", "rs", "C", "O", "kept", src);
  return (K.jsF = (n, X, cols, rs, C, O, kept) => f(NOISE, NOFUSE, n, X, cols, rs, C, O, kept));
}
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
    "for(let i=0;i<n;i++){const x=X?X[i]:i+1;" + body + g + st + "}return true");
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
// sort: numbers from least to most, or words in order (a library choice, decision 80)
function sortList(xs) {
  if (xs instanceof NCell) return new NCell(sortF64(xs.a));
  if (xs instanceof RCell) return xs;
  const p = partsOf(xs);
  if (p.every(v => typeof v === "number")) return new NCell(sortF64(Float64Array.from(p)));
  if (p.every(v => typeof v === "string")) return VP(p.slice().sort());
  return LOG_MISS("sort sorts a list of numbers or a list of words");
}

// ---- prototypes: built-in fields of each kind of value. ar:1 waits for a right side.
const m0 = fn => ({ ar: 0, fn }), m1 = fn => ({ ar: 1, fn });
const ALL = {
  "=": m1(eq), "!=": m1((a, b) => !eq(a, b)), else: m1((a, b) => a === false ? (isCell(b) ? b.run(BANG) : b) : a),
  print: m0(a => { G.print.fn(a); return a; }), str: m0(a => fmt(a)), with: m1(merge), "..": m1(merge),
};
const NUM = Object.assign(Object.create(ALL), {
  "+": m1((a, b) => a + num(b)), "-": m1((a, b) => a - num(b)), "*": m1((a, b) => a * num(b)), "/": m1((a, b) => a / num(b)),
  "%": m1((a, b) => ((a % b) + b) % b), "<": m1((a, b) => a < num(b)), ">": m1((a, b) => a > num(b)),
  "<=": m1((a, b) => a <= num(b)), ">=": m1((a, b) => a >= num(b)),
  abs: m0(Math.abs), floor: m0(Math.floor), round: m0(Math.round), ceil: m0(Math.ceil), sqrt: m0(Math.sqrt),
  sin: m0(Math.sin), cos: m0(Math.cos), tan: m0(Math.tan), log: m0(Math.log), neg: m0(a => -a),
  times: m1(times), min: m1((a, b) => Math.min(a, b)), max: m1((a, b) => Math.max(a, b)),
});
function num(b) { if (typeof b !== "number") { LOG_MISS(describe(b) + " isn't a number"); return NaN; } return b; }
const STRP = Object.assign(Object.create(ALL), {
  length: m0(LEN), "@": m1(PART), "<": m1((a, b) => a < b), ">": m1((a, b) => a > b),
  upper: m0(a => a.toUpperCase()), lower: m0(a => a.toLowerCase()),
});
const BOOL = Object.assign(Object.create(ALL), {
  not: m0(a => !a), and: m1((a, b) => a && b === true), or: m1((a, b) => a || b === true),
});
const CELLP = Object.assign(Object.create(ALL), {
  "@": m1(PART), length: m0(LEN), first: m0(a => a.part(1)), last: m0(a => a.part(a.count())),
  collect: m1(collect), keep: m1(keep), each: m1(each), fold: m1(fold), spork: m1(spork), sort: m0(sortList),
});
const NONE_P = ALL;
function protoOf(r) {
  switch (typeof r) {
    case "number": return NUM; case "string": return STRP; case "boolean": return BOOL;
  }
  if (r instanceof Cell || r instanceof VCell) return CELLP;
  return NONE_P;
}

// ---- globals: names every file can use. Host words are added by the host.
function args(a, n) { if (isCell(a)) { const o = new Array(n); for (let i = 0; i < n; i++) o[i] = a.part(i + 1); return o; } return [a]; }
const G = Object.create(null);
function defNative(name, fn, effect) { G[name] = new Native(name, fn, effect); }
G.any = ANY;
defNative("range", n => new RCell(Math.max(0, Math.floor(num(n)))));
defNative("rand", a => { const [lo, hi] = args(a, 2); return lo + RNG() * (hi - lo); });
defNative("dist", a => { const [x1, y1, x2, y2] = args(a, 4); return Math.hypot(x2 - x1, y2 - y1); });
defNative("clamp", a => { const [v, lo, hi] = args(a, 3); return v < lo ? lo : v > hi ? hi : v; });
defNative("toward", a => { const [x, y, t] = args(a, 3); return x + (y - x) * t; });
defNative("print", a => { effect(() => OUT(fmt(a))); return a; }, true);
// noise [sample, id]: a number from 0 up to 1 that is always the same for the same two inputs (decision 87)
defNative("noise", a => { const [x, y] = args(a, 2); return NOISE(num(x), num(y)); });
Object.defineProperty(G, "random", { get: () => RNG(), enumerable: true });
let RNG = Math.random, OUT = s => { if (typeof console !== "undefined") console.log(s); };

// ===================================================================== prelude, written in Sprout (decisions 30, 34, 35, 50)
const PRELUDE = `
match : [v cases |
  find : [n | n > (cases length) [0] else [(cases @ n) = any or ((cases @ n) = v) [n] else [find (n + 2)]]]
  k : find 1
  k > 0 [cases @ (k + 1)] else [false]
]
cond : [cases |
  find : [n | n > (cases length) [0] else [(cases @ n) = any or ((cases @ n) = true) [n] else [find (n + 2)]]]
  k : find 1
  k > 0 [cases @ (k + 1)] else [false]
]
take : [xs n | range (n min (xs length)) collect [k | xs @ k]]
rgb : [r g b | "rgb(" .. r .. "," .. g .. "," .. b .. ")"]
rgba : [r g b a | "rgba(" .. r .. "," .. g .. "," .. b .. "," .. a .. ")"]
every : [secs now dt | now / secs floor > (now - dt / secs floor)]
wave : [secs now | now / secs * 6.283185307179586 sin]
fresh-input : [touching : false, tapped : false, touch-x : 0, touch-y : 0, held : []]
frame : [update |
  [s e |
    i : s input else fresh-input
    match [e kind, [
      "down", s with [input : i with [touching : true, tapped : true, touch-x : e x, touch-y : e y]]
      "move", s with [input : i with [touch-x : e x, touch-y : e y]]
      "up", s with [input : i with [touching : false]]
      "tick", update (s with [dt : e dt, clock : e clock, input : i with [held : e held]]) with [input : i with [tapped : false, held : e held]]
      any, s
    ]]
  ]
]
`;

// ===================================================================== build
const RT = { BANG, ANY, G, S: null, MK, SW, SEND, RUNC, STR, UNKNOWN, LOG_MISS, WITHF,
  ADD, SUB, MUL, DIV, MOD, LT, GT, LE, GE, EQ, NE, CAT, WITH, AT, VC, VP, ISBOOL, MISSING, TAIL, SWI, shapeFor, COLC, NCOL, NATIVE: Native, NOISE, FUSE, NOFUSE };
let preludeCell = null;
function globalNames(extra) { const s = new Set(Object.keys(G)); if (extra) for (const k of extra) s.add(k); return s; }

function load(src, opts) {
  opts = opts || {};
  const host = opts.host || {};
  for (const k in host) G[k] = host[k];
  if (!preludeCell && !opts.noPrelude) {
    preludeCell = load(PRELUDE, { noPrelude: true });
    for (const k of preludeCell.fieldNames()) { const kk = k; Object.defineProperty(G, kk, { get: () => preludeCell.field(kk), enumerable: true, configurable: true }); }
  }
  const { js, shapes, prologue, speed } = compile(src, globalNames());
  const names = Object.keys(RT).filter(k => k !== "S");
  const f = new Function(...names, "S", prologue + "\nreturn " + js + "\n//# sourceURL=sprout.js");
  const cell = f(...names.map(k => RT[k]), shapes);
  cell.js = js; cell.speed = speed;
  return cell;
}

const api = { tokenize, parse, compile, load, fmt, eq, merge, isCell, Cell, VCell, Native, G, BANG, ANY, SproutError, PRELUDE,
  ColCell, NCell, columns: on => { COLMIN = on ? 32 : Infinity; },
  // spork: how the last one ran, and the ways it can run (decision 91)
  get sporkInfo() { return SPORK.info; }, sporkTally: reset => { const t = SPORK.tally; if (reset) SPORK.tally = []; return t; }, sporkWays: w => { if (SPORK.wasm === undefined) SPORK.wasm = wasmSpork(); Object.assign(SPORK, w); return SPORK; },
  setLog: f => { LOG = f; }, setOut: f => { OUT = f; }, setRandom: f => { RNG = f; }, defNative, partsOf, fieldsOf, UNSET, VFM, effect, queueEffects, runEffects, dropEffects };
if (typeof module !== "undefined") module.exports = api; else root.Sprout3 = api;
})(typeof window !== "undefined" ? window : globalThis);
