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
    if (t === "[") return this.cell();
    if (t === "(") { const items = this.items(")"); if (this.nx() !== ")") throw new SproutError("a ( needs a ) to close it", this.line()); return { k: "group", items }; }
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "str") return { k: "str", v: t.v };
    if (t.t === "tmpl") return { k: "tmpl", parts: t.parts.map(p => typeof p === "string" ? p : { ast: parseInner(p.src, t.line) }) };
    if (t.t === "word") return { k: "word", v: t.v, line: t.line };
    throw new SproutError("this doesn't make sense here: " + t, this.line());
  }
  cell() {
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
    if (this.nx() !== "]") throw new SproutError("a [ needs a ] to close it", this.line());
    return { k: "cell", names, items }; // [[x]] is a cell holding a cell (decision 71: no collapse)
  }
}
function parseInner(src, line) {
  const p = new Parser(tokenize(src), src);
  const items = p.program();
  if (items.length !== 1 || items[0].k !== "chain") throw new SproutError("put one value inside a string's brackets", line);
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
  constructor(globals) { this.globals = globals; this.shapes = []; this.frames = []; this.temps = []; this.consts = []; }
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
    return "UNKNOWN(" + JSON.stringify(n) + "," + (line || 0) + ")";
  }

  genChain(ch, tail) {
    const T = ch.terms;
    if (!T.length) return "false";
    if (T.length === 1 && tail && T[0].k === "group" && T[0].items.length === 1 && T[0].items[0].k === "chain") return this.genChain(T[0].items[0], true);
    let v = this.genTerm(T[0], true);
    for (let i = 1; i < T.length; i++) {
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
          const lastIt = t.items[t.items.length - 1];
          if (lastIt && lastIt.k === "chain" && lastIt.terms.length === 1 && lastIt.terms[0].k === "word" && lastIt.terms[0].v === "false")
            lint("a branch that gives false before else: the else runs too (line " + (nx.line || 0) + ")");
          const B = this.genArg(nx2, tail && i + 1 >= T.length);
          v = "(((" + ta + "=" + v + ")===true?(" + tb + "=" + A + "):" + ta + "===false?(" + tb + "=false):(" + tb + "=SEND(" + ta + "," + mk + ")))!==false?" + tb + ":" + B + ")";
        } else v = "((" + ta + "=" + v + ")===true?" + A + ":" + ta + "===false?false:" + SND + ta + "," + mk + "))";
      } else v = (tail && isLast ? "TAIL(" : "SEND(") + v + "," + this.genTerm(t, false) + ")";
    }
    return v;
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
      if (it.k === "bind") { const js = jsName(it.name); const e = this.genChain(it.val); fr.names.set(it.name, { k: "js", js }); parts.push("const " + js + "=" + e + ";"); if (last) parts.push("return " + js + ";"); }
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
        if (isCell) fr.names.set(it.name, { k: "js", js, cell: true }); // a cell can use its own name (decision 25)
        const e = isCell ? this.genCell(it.val.terms[0], true) : this.genChain(it.val);
        fr.names.set(it.name, { k: "js", js, cell: isCell });
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
    if (fieldsOnly(c) && c.items.every(x => simpleVal(x.val)))
      return "VC(" + this.shapeRef(c.items.map(x => x.name)) + ",[" + c.items.map(x => this.genChain(x.val)).join(",") + "])";
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
          if (isCell) fr.names.set(it.name, { k: "slot", act, i, cell: true });
          const e = this.arrow("", () => isCell ? this.genCell(it.val.terms[0], true) : this.genChain(it.val));
          fr.names.set(it.name, { k: "slot", act, i, cell: isCell });
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
    const kern = c.names.length === 1 && !c.names[0].def && !sh.usesIt && !sh.usesLeft && c.items.length === 1 && c.items[0].k === "chain" ? this.genKernels(c) : null;
    return "MK(S[" + k + "]," + slotsJS + "," + runJS + ",[" + defs.join(",") + "],()=>[" + caps.join(",") + "]" + (kern ? "," + kern : "") + ")";
  }

  // ---- column kernels (decision 82). A cell [s | ...] over records gets up to three:
  //   m: [s | s with [a : ..., b : ...]] where every new value is number maths on s's fields  (used by collect)
  //   t: [s | test] where the test is number maths and comparisons                           (used by keep)
  //   e: [s | word [..., ...]] where word is a host word, like circle                         (used by each)
  // Each is (self, rs, cols, n) => result, or null to fall back to the ordinary way, so they never change what a program does.
  genKernels(c) {
    const p = c.names[0].n, T = c.items[0].terms, out = [];
    const fresh = () => ({ p, cols: new Map(), caps: new Map() });
    // m: s with [fields]
    if (T.length === 3 && T[0].k === "word" && T[0].v === p && T[1].k === "word" && (T[1].v === "with" || T[1].v === "..") && !this.lookup(T[1].v) && T[2].k === "cell" && fieldsOnly(T[2])) {
      const K = fresh(), keys = T[2].items.map(x => x.name), vals = T[2].items.map(x => this.kChain(x.val, K));
      if (vals.every(v => v && v.ty === "n")) {
        const q = JSON.stringify;
        out.push("m:(self,rs,cols,n)=>{" + kPro(K) + "if(rs.index(\"with\")>=0||rs.index(\"..\")>=0)return null;let out=rs;const oc=cols.slice();" +
          keys.map((k, j) => "let $j" + j + "=out.index(" + q(k) + ");if($j" + j + "<0){out=out.add(" + q(k) + ");$j" + j + "=out.keys.length-1}const $o" + j + "=new Float64Array(n);").join("") +
          "for(let $i=0;$i<n;$i++){" + vals.map((v, j) => "const $v" + j + "=" + v.js + ";").join("") + vals.map((v, j) => "$o" + j + "[$i]=$v" + j + ";").join("") + "}" +
          keys.map((k, j) => "oc[$j" + j + "]=$o" + j + ";").join("") + "return COLC(out,oc,n)}");
      }
    }
    // t: a test
    { const K = fresh(), v = this.kChain(c.items[0], K);
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
      if (args && args.every(a => a))
        out.push("e:(self,rs,cols,n)=>{" + kPro(K) + "if(!(" + F + " instanceof NATIVE))return null;const $f=" + F + ".fn;for(let $i=0;$i<n;$i++)$f(VP([" + args.join(",") + "]));return true}");
    }
    return out.length ? "{" + out.join(",") + "}" : null;
  }
  // a chain as number maths on the item's fields: {js, ty} with ty "n" (number) or "b" (true/false), or null if it can't be
  kChain(ch, K) {
    const T = ch.terms; if (!T.length) return null;
    let v, i;
    if (T[0].k === "word" && T[0].v === K.p) {
      const f = T[1];
      if (!f || f.k !== "word" || f.v === K.p || ["!", "true", "false", "_", "left", "right"].includes(f.v)) return null;
      if ((FUSED.has(f.v) || LAZYOPS.has(f.v)) && T.length > 2 && !this.lookup(f.v)) return null;
      v = { js: kCol(f.v, K), ty: "n" }; i = 2;
    } else { v = this.kTerm(T[0], K); i = 1; }
    for (; v && i < T.length; i++) {
      const t = T[i]; if (t.k !== "word") return null;
      const w = t.v;
      if (FUSED.has(w) && i + 1 < T.length && !this.lookup(w)) {
        const op = KOPS[w]; if (!op || v.ty !== "n") return null;
        const b = this.kTerm(T[++i], K); if (!b || b.ty !== "n") return null;
        v = w === "%" ? { js: "(((" + v.js + "%" + b.js + ")+" + b.js + ")%" + b.js + ")", ty: "n" } : { js: "(" + v.js + op[0] + b.js + ")", ty: op[1] };
      } else if ((w === "and" || w === "or") && i + 1 < T.length && !this.lookup(w)) {
        if (v.ty !== "b" || T[i + 1].k === "cell") return null;
        const b = this.kTerm(T[++i], K); if (!b || b.ty !== "b") return null;
        v = { js: "(" + v.js + (w === "and" ? "&&" : "||") + b.js + ")", ty: "b" };
      } else if (v.ty === "n" && KPOST[w]) v = { js: KPOST[w] + "(" + v.js + ")", ty: "n" };
      else if (v.ty === "n" && (w === "min" || w === "max") && i + 1 < T.length) {
        const b = this.kTerm(T[++i], K); if (!b || b.ty !== "n") return null;
        v = { js: "Math." + w + "(" + v.js + "," + b.js + ")", ty: "n" };
      } else if (v.ty === "b" && w === "not") v = { js: "(!" + v.js + ")", ty: "b" };
      else return null;
    }
    return v;
  }
  kTerm(t, K) {
    if (t.k === "num") return { js: "(" + t.v + ")", ty: "n" };
    if (t.k === "group") { if (t.items.length !== 1 || t.items[0].k !== "chain") return null; const v = this.kChain(t.items[0], K); return v && { js: "(" + v.js + ")", ty: v.ty }; }
    if (t.k !== "word") return null;
    if (t.v === "true" || t.v === "false") return { js: t.v, ty: "b" };
    if (t.v === K.p || ["_", "left", "right", "!"].includes(t.v) || t.v in ALL) return null;
    const r = this.kCap(t.v, K, true); return r && { js: r, ty: "n" };
  }
  // a name from outside the cell, read once before the loop. A number is checked for; random and other getters are never captured.
  kCap(n, K, numeric) {
    let ref;
    const r = this.lookup(n);
    if (r) ref = this.refJS(r);
    else if (this.globals.has(n)) { const d = Object.getOwnPropertyDescriptor(G, n); if (!d || d.get) return null; ref = this.globalRef(n); }
    else return null;
    let e = K.caps.get(n);
    if (!e) { e = { v: "$k" + K.caps.size, ref, num: false }; K.caps.set(n, e); }
    if (numeric) e.num = true;
    return e.v;
  }
}
const KOPS = { "+": ["+", "n"], "-": ["-", "n"], "*": ["*", "n"], "/": ["/", "n"], "%": ["%", "n"], "<": ["<", "b"], ">": [">", "b"], "<=": ["<=", "b"], ">=": [">=", "b"], "=": ["===", "b"], "!=": ["!==", "b"] };
const KPOST = { abs: "Math.abs", floor: "Math.floor", round: "Math.round", ceil: "Math.ceil", sqrt: "Math.sqrt", sin: "Math.sin", cos: "Math.cos", tan: "Math.tan", log: "Math.log", neg: "-" };
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
function srcOf(c) { return JSON.stringify(c, (k, v) => k === "line" ? undefined : v); }

function compile(src, globals) {
  const ast = parse(src);
  const g = new Gen(globals);
  g.temps.push([]);
  const js = g.genCell({ k: "cell", names: [], items: ast });
  const top = g.temps.pop();
  return { js, shapes: g.shapes, prologue: (top.length ? "let " + top.join(",") + ";\n" : "") + g.consts.join("\n") };
}

// ===================================================================== runtime
const BANG = { toString: () => "!" };   // "no input" (decisions 58, 69)
const ANY = { toString: () => "any" };
const UNSET = {};
let LOG = (msg) => { if (typeof console !== "undefined") console.log("sprout: " + msg); };
const warned = new Set();
const seen = new Map();
function LOG_MISS(msg, line) { const m = msg + (line ? " (line " + line + ")" : ""); const c = (seen.get(m) || 0) + 1; seen.set(m, c); if (c <= 3) LOG(m + (c === 3 ? " (and more; not shown again)" : "")); return false; }
function UNKNOWN(n, line) { return LOG_MISS("\"" + n + "\" isn't a word Sprout knows yet", line); }

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
  return quiet ? false : MISSING(r, w, line);
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
  collect: m1(collect), keep: m1(keep), each: m1(each), fold: m1(fold),
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
Object.defineProperty(G, "random", { get: () => RNG(), enumerable: true });
let RNG = Math.random, OUT = s => { if (typeof console !== "undefined") console.log(s); };

// ===================================================================== prelude, written in Sprout (decisions 30, 34, 35, 50)
const PRELUDE = `
match : [v cases |
  try : [n |
    n <= (cases length) [(cases @ n) = any or ((cases @ n) = v) [cases @ (n + 1)] else [try (n + 2)]] else [false]
  ]
  try 1
]
cond : [cases |
  try : [n |
    n <= (cases length) [(cases @ n) = any or ((cases @ n) = true) [cases @ (n + 1)] else [try (n + 2)]] else [false]
  ]
  try 1
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
  ADD, SUB, MUL, DIV, MOD, LT, GT, LE, GE, EQ, NE, CAT, WITH, AT, VC, VP, ISBOOL, MISSING, TAIL, SWI, shapeFor, COLC, NATIVE: Native };
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
  const { js, shapes, prologue } = compile(src, globalNames());
  const names = Object.keys(RT).filter(k => k !== "S");
  const f = new Function(...names, "S", prologue + "\nreturn " + js + "\n//# sourceURL=sprout.js");
  const cell = f(...names.map(k => RT[k]), shapes);
  cell.js = js;
  return cell;
}

const api = { tokenize, parse, compile, load, fmt, eq, merge, isCell, Cell, VCell, Native, G, BANG, ANY, SproutError, PRELUDE,
  ColCell, columns: on => { COLMIN = on ? 32 : Infinity; },
  setLog: f => { LOG = f; }, setOut: f => { OUT = f; }, setRandom: f => { RNG = f; }, defNative, partsOf, fieldsOf, UNSET, VFM, effect, queueEffects, runEffects, dropEffects };
if (typeof module !== "undefined") module.exports = api; else root.Sprout3 = api;
})(typeof window !== "undefined" ? window : globalThis);
