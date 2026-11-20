// Sprout 3: compiler (Sprout -> JavaScript) and runtime, built from the design decisions in spec.md (1-69).
// One file, no dependencies. Works in the browser and in node.
(function (root) {
"use strict";

// ===================================================================== tokens
// Tokens: {t:"num",v} {t:"str",v} {t:"tmpl",parts:[string|{eager,src}]} {t:"word",v}
// and the punctuation strings "[" "]" "(" ")" "," "|" ":" "\n".
// A new line plus a deeper indent opens "[" (decision 59); a shallower one closes it.
const WORD_STOP_CHARS = " \t[](),|:\"";

function lexLine(line, lineNo, out) {
  let i = 0; const length = line.length;
  while (i < length) {
    const char = line[i];
    if (char === " " || char === "\t") { i++; continue; }
    if (char === "-" && line[i + 1] === "-") break; // comment to the end of the line
    if ("[](),|".includes(char)) { out.push(char); i++; continue; }
    if (char === ":") { out.push(":"); i++; continue; }
    if (char === '"') { i = lexString(line, i, lineNo, out); continue; }
    let j = i;
    while (j < length && !WORD_STOP_CHARS.includes(line[j]) && !(line[j] === "-" && line[j + 1] === "-" && j > i)) j++;
    let word = line.slice(i, j); i = j;
    if (/^-?\d+(\.\d+)?$/.test(word)) { out.push({ kind: "num", value: parseFloat(word), line: lineNo }); continue; }
    // a trailing ! is its own word: hello! is hello ! (decision 67)
    if (word.length > 1 && word.endsWith("!")) { out.push({ kind: "word", value: word.slice(0, -1), line: lineNo }); word = "!"; }
    out.push({ kind: "word", value: word, line: lineNo });
  }
}

// "a [x] b": [ ] puts a value into a string (decision 81). ( ) is plain text, so SQL and CSS need no escapes. \[ is a plain bracket.
function lexString(line, start, lineNo, out) {
  const ESC = { n: "\n", t: "\t", "\\": "\\", '"': '"', "[": "[" };
  let at = start + 1, text = ""; const parts = [];
  while (at < line.length && line[at] !== '"') {
    const char = line[at];
    if (char === "\\" && at + 1 < line.length) { const escaped = line[at + 1]; text += ESC[escaped] !== undefined ? ESC[escaped] : escaped; at += 2; continue; }
    if (char === "[") {
      let depth = 1, end = at + 1;
      while (end < line.length && depth) { if (line[end] === '"') break; if (line[end] === "[") depth++; else if (line[end] === "]") depth--; if (depth) end++; }
      if (depth) throw new SproutError("a [ in a string needs a ] to close it", lineNo);
      parts.push(text); text = ""; parts.push({ src: line.slice(at + 1, end) }); at = end + 1; continue;
    }
    text += char; at++;
  }
  if (at >= line.length) throw new SproutError("a string needs a closing \"", lineNo);
  if (parts.length) { parts.push(text); out.push({ kind: "tmpl", parts, line: lineNo }); }
  else out.push({ kind: "str", value: text, line: lineNo });
  return at + 1;
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
// the tree: {type:"num",value} {type:"str",value} {type:"tmpl",parts} {type:"word",value,line} {type:"group",items}
//      {type:"cell",names:[{name,defaultValue}],items} {type:"chain",terms} {type:"bind",name,value,line}
class SproutError extends Error { constructor(msg, line) { super(msg); this.line = line || 0; } }

class Parser {
  constructor(tokens, src) { this.tokens = tokens; this.i = 0; this.src = src; }
  peek() { return this.i < this.tokens.length ? this.tokens[this.i] : null; }
  next() { return this.tokens[this.i++]; }
  line() { for (let j = Math.min(this.i, this.tokens.length - 1); j >= 0; j--) if (this.tokens[j] && this.tokens[j].line) return this.tokens[j].line; return 0; }
  program() { const items = this.items(null); if (this.peek() !== null) throw new SproutError("this " + this.peek() + " doesn't close anything", this.line()); return items; }
  items(end) {
    const out = [];
    for (;;) {
      const t = this.peek();
      if (t === null || t === end) break;
      if (t === "," || t === "\n") { this.next(); continue; }
      if (t === "]" || t === ")") throw new SproutError("this " + t + " doesn't match", this.line());
      out.push(this.item());
    }
    return out;
  }
  item() {
    const line = this.line();
    const c = this.chain();
    if (this.peek() === ":") {
      this.next();
      if (c.terms.length !== 1 || c.terms[0].type !== "word") throw new SproutError("only a name can go before :", line);
      const val = this.chain();
      if (!val.terms.length) throw new SproutError("a value has to follow :", line);
      return { type: "bind", name: c.terms[0].value, value: val, line };
    }
    return c;
  }
  chain() {
    const terms = [];
    for (;;) {
      const t = this.peek();
      if (t === null || t === "," || t === "\n" || t === ":" || t === "|" || t === "]" || t === ")") break;
      terms.push(this.term());
    }
    return { type: "chain", terms };
  }
  term() {
    const t = this.next();
    // an unclosed bracket is reported where it opened, not where the file ran out
    if (t === "[") return this.cell(this.line());
    if (t === "(") { const at = this.line(); const items = this.items(")"); if (this.next() !== ")") throw new SproutError("a ( needs a ) to close it", at); return { type: "group", items }; }
    if (t.kind === "num") return { type: "num", value: t.value };
    if (t.kind === "str") return { type: "str", value: t.value };
    if (t.kind === "tmpl") return { type: "tmpl", parts: t.parts.map(p => typeof p === "string" ? p : { ast: parseInner(p.src, t.line) }) };
    if (t.kind === "word") return { type: "word", value: t.value, line: t.line };
    throw new SproutError("this doesn't make sense here: " + t, this.line());
  }
  cell(openLine) {
    // input names before a | at this depth: [x y : 0 | ...]
    let depth = 0, bar = -1;
    for (let j = this.i; j < this.tokens.length; j++) {
      const x = this.tokens[j];
      if (x === "[" || x === "(") depth++;
      else if (x === "]" || x === ")") { if (depth === 0) break; depth--; }
      else if (x === "|" && depth === 0) { bar = j; break; }
    }
    const names = [];
    if (bar >= 0) {
      while (this.i < bar) {
        const x = this.next();
        if (x === "," || x === "\n") continue;
        if (!x || x.kind !== "word") throw new SproutError("only names go before |", this.line());
        const nm = { name: x.value, defaultValue: null };
        if (this.peek() === ":") { this.next(); nm.defaultValue = this.term(); }
        names.push(nm);
      }
      this.next(); // |
    }
    const items = this.items("]");
    if (this.next() !== "]") throw new SproutError("a [ needs a ] to close it", openLine || this.line());
    return { type: "cell", names, items }; // [[x]] is a cell holding a cell (decision 71: no collapse)
  }
}
function parseInner(src, line) {
  const p = new Parser(tokenize(src), src);
  const items = p.program();
  if (items.length !== 1 || items[0].type !== "chain") throw new SproutError("put one value inside a string's brackets", line);
  // it counts its own lines from 1; what's inside a string is on the string's line
  (function at(n) { if (!n || typeof n !== "object") return; if (typeof n.line === "number") n.line = line; for (const k in n) at(n[k]); })(items[0]);
  return items[0];
}
function parse(src) { return new Parser(tokenize(src), src).program(); }

// ===================================================================== code generator
// Each cell literal compiles to two JS functions:
//   run(a)   : straight-line code that works out every item in order (used when the cell is run)
//   slots(a) : one thunk per item, worked out on first read and kept (used when fields or parts are read; decision 51)
// Names are JS constants captured by closures; since nothing is rebound, that is the same as filling names in (decision 24).
const FUSED_OPERATORS = new Set(["+", "-", "*", "/", "%", "<", ">", "<=", ">=", "=", "!=", "..", "with", "@"]);
const LAZY_OPERATORS = new Set(["and", "or", "else"]);

let uniqueNumber = 0;
function jsName(n) { let s = ""; for (const ch of n) s += /[A-Za-z0-9]/.test(ch) ? ch : "_" + ch.charCodeAt(0).toString(16); return "v_" + s + "_" + (uniqueNumber++); }

class CodeGen {
  constructor(globals) { this.globals = globals; this.shapes = []; this.frames = []; this.tempScopes = []; this.constants = []; this.speedNotes = []; }
  // local temporaries, declared at the top of the JS function being generated (safe under recursion)
  // field shapes and inline caches are made once, when the program loads
  shapeConstant(keys) { const k = "SH" + this.constants.length; this.constants.push("const " + k + "=shapeFor(" + JSON.stringify(keys) + ");"); return k; }
  inlineCache() { const k = "IC" + this.constants.length; this.constants.push("const " + k + "={shape:null,index:-1,outShape:null,positions:null};"); return k; }
  // a head term that is certainly not true or false: a host value, or a name bound to a cell literal
  certainlyNotBool(term) {
    if (term.type === "cell" || term.type === "num" || term.type === "str" || term.type === "tmpl") return true;
    if (term.type !== "word") return false;
    const entry = this.lookup(term.value);
    if (entry) return !!entry.cell;
    const descriptor = Object.getOwnPropertyDescriptor(GLOBALS, term.value);
    return !!descriptor && !descriptor.get && typeof descriptor.value !== "boolean";
  }
  // a global that is a plain value (host words, W, H, range) is read once at load; getters (random, prelude) each time
  globalCode(name) {
    const descriptor = Object.getOwnPropertyDescriptor(GLOBALS, name);
    if (!descriptor || descriptor.get) return "GLOBALS[" + JSON.stringify(name) + "]";
    if (!this.globalConstants) this.globalConstants = new Map();
    let constant = this.globalConstants.get(name); if (!constant) { constant = "GLOBAL_" + this.constants.length; this.globalConstants.set(name, constant); this.constants.push("const " + constant + "=GLOBALS[" + JSON.stringify(name) + "];"); }
    return constant;
  }
  newTemp() { const scope = this.tempScopes[this.tempScopes.length - 1]; const name = "t" + (uniqueNumber++); scope.push(name); return name; }
  withTemps(generate) { this.tempScopes.push([]); const body = generate(); const temps = this.tempScopes.pop(); return { body, decl: temps.length ? "let " + temps.join(",") + ";" : "" }; }
  arrowCode(params, generateBody) { const made = this.withTemps(generateBody); return "(" + params + ")=>" + (made.decl ? "{" + made.decl + "return " + made.body + "}" : made.body); }
  // look a name up through the frames, innermost first
  lookup(name) {
    for (let frameIndex = this.frames.length - 1; frameIndex >= 0; frameIndex--) {
      const entry = this.frames[frameIndex].names.get(name);
      if (entry) { if (frameIndex < this.frames.length - 1) this.noteCapture(frameIndex, name, entry); return entry; }
    }
    return null;
  }
  noteCapture(frameIndex, name, entry) { for (let inner = frameIndex + 1; inner < this.frames.length; inner++) { const frame = this.frames[inner]; if (!frame.captured.has(name)) frame.captured.set(name, entry); } }
  referenceCode(entry) { return entry.type === "js" ? entry.js : entry.activation + ".get(" + entry.i + ")"; }

  nameCode(name, line) {
    if (name === "right") { const entry = this.lookup("right"); if (entry) return this.referenceCode(entry); name = "_"; }
    if (name === "_") {
      // _ belongs to the nearest cell around it (decision 56)
      const frame = this.frames[this.frames.length - 1];
      frame.shape.usesIt = true;
      if (frame.shape.names.length) { lint("_ is used in a cell that names its inputs; it is false there"); return "false"; }
      return frame.itJS;
    }
    if (name === "left") {
      for (let frameIndex = this.frames.length - 1; frameIndex >= 0; frameIndex--) if (this.frames[frameIndex].owner) { this.frames[frameIndex].shape.usesLeft = true; return this.frames[frameIndex].leftJS; }
      return "logMiss('left is only used inside a field of a cell', " + (line || 0) + ")";
    }
    const entry = this.lookup(name);
    if (entry) return this.referenceCode(entry);
    if (this.globals.has(name)) return this.globalCode(name);
    // suggest the nearest name in scope, or a built-in, for a likely typo
    const seen = new Set(this.globals); for (const frameIndex of this.frames) for (const k of frameIndex.names.keys()) seen.add(k);
    for (const list of this.hintNames || []) for (const k of list) seen.add(k);
    const hint = nearest(name, seen);
    return "unknownWord(" + JSON.stringify(name) + "," + (line || 0) + (hint ? "," + JSON.stringify(hint) : "") + ")";
  }

  genChain(chain, tail) {
    const terms = chain.terms;
    if (!terms.length) return "false";
    if (terms.length === 1 && tail && terms[0].type === "group" && terms[0].items.length === 1 && terms[0].items[0].type === "chain") return this.genChain(terms[0].items[0], true);
    let code = this.genTerm(terms[0], true), run = null;
    for (let i = 1; i < terms.length; i++) {
      // a library may make a run of steps (collect, keep, fold...) into one loop, tried first (loop fusion, decision 95):
      // the steps are written as usual on a temporary, and the library wraps them when the run ends
      if (run && i === run.end) { code = LIBRARIES.fuse.wrap(this, run, code); run = null; }
      if (!run && LIBRARIES.fuse && (run = LIBRARIES.fuse.find(terms, i))) { run.source = code; run.temp = this.newTemp(); code = run.temp; }
      if (LIBRARIES.note) LIBRARIES.note(this, terms, i);
      const term = terms[i], isLast = i === terms.length - 1;
      if (term.type === "word" && (term.value === "!" || term.value === "true" || term.value === "false")) { code = "send(" + code + "," + (term.value === "!" ? "BANG" : term.value) + ")"; continue; }
      if (term.type === "word") {
        const word = term.value;
        if (FUSED_OPERATORS.has(word) && i + 1 < terms.length && !this.lookup(word)) {
          const nextTerm = terms[++i];
          // x with [a : ..., b : ...]: fields worked out now and laid over x, with no cell built (merge forces them anyway)
          if ((word === "with" || word === "..") && nextTerm.type === "cell" && isFieldsOnly(nextTerm)) {
            code = "withFields(" + code + ",[" + nextTerm.items.map(x => JSON.stringify(x.name)).join(",") + "],[" + nextTerm.items.map(x => this.genChain(x.value)).join(",") + "]," + this.inlineCache() + ")";
            continue;
          }
          code = OPERATOR_FUNCTION[word] + "(" + code + "," + this.genTerm(nextTerm, false) + ")"; continue;
        }
        if (LAZY_OPERATORS.has(word) && i + 1 < terms.length && !this.lookup(word)) {
          // only else gives its right side back as it is; and/or check theirs is true or false, so it can't be a tail call
          const rightCode = this.genArg(terms[++i], word === "else" && tail && i + 1 >= terms.length), leftTemp = this.newTemp();
          if (word === "else") code = "((" + leftTemp + "=" + code + ")!==false?" + leftTemp + ":" + rightCode + ")";
          else if (word === "and") code = "((" + leftTemp + "=" + code + ")===true?requireBool(" + rightCode + ",'and'):" + leftTemp + "===false?false:notUnderstood(" + leftTemp + ",'and'))";
          else code = "((" + leftTemp + "=" + code + ")===false?requireBool(" + rightCode + ",'or'):" + leftTemp + "===true?true:notUnderstood(" + leftTemp + ",'or'))";
          continue;
        }
        const found = this.lookup(word);
        const lexical = found ? "()=>" + this.referenceCode(found) : (this.globals.has(word) ? "()=>" + this.globalCode(word) : "null");
        // a field read right before else is allowed to miss: else is the program saying so, so the miss isn't logged (decision 83)
        const quiet = terms[i + 1] && terms[i + 1].type === "word" && terms[i + 1].value === "else" && terms[i + 2] && !this.lookup("else");
        code = "sendWordCached(" + code + "," + JSON.stringify(word) + "," + lexical + "," + (term.line || 0) + "," + this.inlineCache() + (quiet ? ",1" : "") + ")";
      } else if (term.type === "cell" && !term.names.length && i === 1 && this.certainlyNotBool(terms[0])) {
        code = (tail && isLast ? "tailSend(" : "send(") + code + "," + this.genCell(term) + ")";
      } else if (term.type === "cell" && !term.names.length) {
        // a boolean given a cell runs it (decision 62): the body is inlined; any other value is sent the cell
        const elseFollows = terms[i + 1] && terms[i + 1].type === "word" && terms[i + 1].value === "else" && terms[i + 2] && !this.lookup("else");
        const thenCode = this.genInlineExpr(term, tail && isLast && !elseFollows);
        const sendCall = tail && isLast && !elseFollows ? "tailSend(" : "send(";
        if (!thenCode) { code = sendCall + code + "," + this.genCell(term) + ")"; continue; }
        const leftTemp = this.newTemp(), resultTemp = this.newTemp(), cellCode = this.genCell(term);
        const following = terms[i + 1], afterElse = terms[i + 2];
        if (following && following.type === "word" && following.value === "else" && afterElse && !this.lookup("else")) {
          // test [a] else b: b runs when the test is false, or when a gives false (decision 62)
          i += 2;
          // decision 74: else is a library cell, so it can't tell "the test was false" from "the branch gave false".
          // A branch whose answer is true or false is named, unless the else gives false too, when it makes no difference.
          const lastItem = term.items[term.items.length - 1];
          const elseFalse = (afterElse.type === "word" && afterElse.value === "false") || (afterElse.type === "cell" && afterElse.items.length === 1 && givesBool(afterElse.items[0]) === "false");
          const branchGives = lastItem && lastItem.type === "chain" ? givesBool(lastItem) : null;
          // a host word (circle, beep...) gives false too, so a branch that ends with one also runs the else
          const hostWord = lastItem && lastItem.type === "chain" && lastItem.terms[0] && lastItem.terms[0].type === "word" && !this.lookup(lastItem.terms[0].value) ? GLOBALS[lastItem.terms[0].value] : null;
          if (hostWord instanceof Native && hostWord.effect && hostWord.name !== "print" && !elseFalse) lint("line " + (following.line || 0) + ": this branch ends with " + hostWord.name + ", which gives false, so the else runs too (decision 74). To draw one or the other, use cond, or put the else first");
          if (branchGives === "false") lint("a branch that gives false before else: the else runs too (line " + (following.line || 0) + ")");
          else if (branchGives && !elseFalse) lint("line " + (following.line || 0) + ": this branch gives true or false, and when it gives false the else runs too (decision 74). To keep a false answer, use cond [test, answer, any, other]");
          const rightCode = this.genArg(afterElse, tail && i + 1 >= terms.length);
          code = "(((" + leftTemp + "=" + code + ")===true?(" + resultTemp + "=" + thenCode + "):" + leftTemp + "===false?(" + resultTemp + "=false):(" + resultTemp + "=send(" + leftTemp + "," + cellCode + ")))!==false?" + resultTemp + ":" + rightCode + ")";
        } else code = "((" + leftTemp + "=" + code + ")===true?" + thenCode + ":" + leftTemp + "===false?false:" + sendCall + leftTemp + "," + cellCode + "))";
      } else code = (tail && isLast ? "tailSend(" : "send(") + code + "," + this.genTerm(term, false) + ")";
    }
    if (run) code = LIBRARIES.fuse.wrap(this, run, code);
    return code;
  }
  // the right side of else/and/or: a cell literal there is run (inlined), anything else is its value
  genArg(term, tail) {
    if (term.type === "cell" && !term.names.length) { const inlined = this.genInlineExpr(term, tail); return inlined || "runCell(" + this.genCell(term) + ")"; }
    if (tail && term.type === "group" && term.items.length === 1 && term.items[0].type === "chain") return this.genChain(term.items[0], true);
    return this.genTerm(term, false);
  }
  genTerm(term) {
    switch (term.type) {
      case "num": return String(term.value);
      case "str": return JSON.stringify(term.value);
      case "tmpl": return "joinText(" + term.parts.map(part => typeof part === "string" ? JSON.stringify(part) : this.genChain(part.ast)).join(",") + ")";
      case "word": return term.value === "!" ? "BANG" : term.value === "true" ? "true" : term.value === "false" ? "false" : this.nameCode(term.value, term.line);
      case "group": return this.genGroup(term.items);
      case "cell": return this.genCell(term);
      case "chain": return this.genChain(term);
    }
    throw new Error("term " + term.type);
  }
  genGroup(items) {
    if (items.length === 1 && items[0].type === "chain") return "(" + this.genChain(items[0]) + ")";
    // a group of several steps: worked out now, in order; its names are local to it (decision 8)
    const frame = this.frames[this.frames.length - 1];
    const saved = new Map(frame.names), parts = [];
    this.tempScopes.push([]);
    items.forEach((item, index) => {
      const last = index === items.length - 1;
      if (item.type === "bind") { const js = jsName(item.name); const valueCode = this.genChain(item.value); frame.names.set(item.name, { type: "js", js, value: item.value }); parts.push("const " + js + "=" + valueCode + ";"); if (last) parts.push("return " + js + ";"); }
      else parts.push((last ? "return " : "") + this.genChain(item) + ";");
    });
    frame.names = saved;
    const temps = this.tempScopes.pop(); if (temps.length) parts.unshift("let " + temps.join(",") + ";");
    return "(()=>{" + parts.join("") + "})()";
  }
  // straight-line code for running a cell: every item in order, giving the last part (or false)
  genRunBody(cell, frame, shapeNumber, tail) {
    const out = []; let lastPartCode = null;
    cell.items.forEach((item, i) => {
      const last = i === cell.items.length - 1;
      if (item.type === "bind") {
        const js = jsName(item.name), isCell = item.value.terms.length === 1 && item.value.terms[0].type === "cell";
        const ast = isCell ? item.value.terms[0] : null;
        if (isCell) frame.names.set(item.name, { type: "js", js, cell: true, ast, value: item.value }); // a cell can use its own name (decision 25)
        const valueCode = isCell ? this.genCell(item.value.terms[0], true) : this.genChain(item.value);
        frame.names.set(item.name, { type: "js", js, cell: isCell, ast, value: item.value });
        out.push("const " + js + "=" + valueCode + ";");
        if (last) out.push("return " + (lastPartCode || "false") + ";");
      } else {
        const valueCode = this.genChain(item, last && tail);
        if (last) out.push("return " + valueCode + ";");
        else { const js = "p" + shapeNumber + "_" + i; out.push("const " + js + "=" + valueCode + ";"); lastPartCode = js; }
      }
    });
    if (!cell.items.length) out.push("return false;");
    return out.join("");
  }
  // a branch body inlined where it is run, as an expression: possible when it takes no input
  genInlineExpr(cell, tail) {
    const activationName = "i" + (uniqueNumber++);
    const shape = { names: [], usesIt: false, usesLeft: false };
    const frame = { names: new Map(), activation: activationName, itJS: "false", leftJS: "undefined", shape: shape, owner: false, captured: new Map() };
    this.frames.push(frame);
    const made = this.withTemps(() => this.genRunBody(cell, frame, activationName, tail));
    this.frames.pop();
    if (shape.usesIt) return null;
    const single = /^return ([^;]*);$/.exec(made.body);
    if (single && !made.decl && !/[{}]/.test(single[1])) return "(" + single[1] + ")";
    return "(()=>{" + made.decl + made.body + "})()";
  }

  genCell(cell, ownerOfLeft) {
    if (isFieldsOnly(cell) && cell.items.every(input => isSimpleValue(input.value))) {
      // the fields can't use each other here, but they are still the likeliest names a typo meant
      this.hintNames = (this.hintNames || []).concat([cell.items.map(input => input.name)]);
      const vals = cell.items.map(input => this.genChain(input.value));
      this.hintNames.pop();
      return "makeRecord(" + this.shapeConstant(cell.items.map(input => input.name)) + ",[" + vals.join(",") + "])";
    }
    if (isSimpleList(cell) && cell.items.length > 1)
      return "makeList([" + cell.items.map(input => this.genChain(input)).join(",") + "])";
    const shapeNumber = this.shapes.length;
    const shape = { id: shapeNumber, names: cell.names.map(input => input.name), fieldIndex: Object.create(null), partIndex: [], usesIt: false, usesLeft: false, itemCount: cell.items.length, src: sourceKey(cell) };
    this.shapes.push(shape);
    const seenNames = new Set();
    cell.items.forEach((item, i) => { if (item.type === "bind") { if (seenNames.has(item.name)) throw new SproutError("\"" + item.name + "\" is bound twice in one cell (decision 13)", item.line); seenNames.add(item.name); shape.fieldIndex[item.name] = i; } else shape.partIndex.push(i); });
    const defaultMakers = cell.names.map(input => input.defaultValue ? this.arrowCode("", () => this.genTerm(input.defaultValue, false)) : "null");
    const activation = "a" + shapeNumber;
    // run: inputs arrive as plain arguments (left, it, then each name)
    const paramNames = cell.names.map((input, position) => activation + "_" + position);
    const runFrame = { names: new Map(), activation, itJS: activation + "_it", leftJS: activation + "_L", shape: shape, owner: !!ownerOfLeft, captured: new Map() };
    cell.names.forEach((input, position) => runFrame.names.set(input.name, { type: "js", js: paramNames[position] }));
    this.frames.push(runFrame);
    const runBodyCode = this.withTemps(() => this.genRunBody(cell, runFrame, shapeNumber, true)), runBody = runBodyCode.decl + runBodyCode.body;
    this.frames.pop();
    // slots: one lazy thunk per readable item. Every cell follows one rule (decision 75): its fields can be read.
    // In a cell that takes input, the body (its parts) runs on a send, and a binding that uses the input is a local of that run.
    let slotsJS = "null", captured;
    const takes = shape.names.length > 0 || shape.usesIt;
    let readable = cell.items.map(() => true);
    if (takes) {
      const dependsOnInput = new Set(cell.names.map(input => input.name).concat(["_", "right"]));
      readable = cell.items.map(item => { if (item.type !== "bind") return false; if (mentions(item.value, dependsOnInput)) { dependsOnInput.add(item.name); return false; } return true; });
      shape.partIndex = [];
      for (const n in shape.fieldIndex) if (!readable[shape.fieldIndex[n]]) delete shape.fieldIndex[n];
    }
    if (readable.some(input => input)) {
      const frame = { names: new Map(), activation, itJS: activation + ".it", leftJS: activation + ".left", shape: shape, owner: !!ownerOfLeft, captured: new Map() };
      cell.names.forEach((input, position) => frame.names.set(input.name, { type: "js", js: activation + ".inputs[" + position + "]" }));
      this.frames.push(frame);
      const slotCodes = [];
      cell.items.forEach((item, i) => {
        if (!readable[i]) { slotCodes.push("()=>false"); return; }
        if (item.type === "bind") {
          const isCell = item.value.terms.length === 1 && item.value.terms[0].type === "cell";
          const ast = isCell ? item.value.terms[0] : null;
          if (isCell) frame.names.set(item.name, { type: "slot", activation, i, cell: true, ast, value: item.value });
          const slotCode = this.arrowCode("", () => isCell ? this.genCell(item.value.terms[0], true) : this.genChain(item.value));
          frame.names.set(item.name, { type: "slot", activation, i, cell: isCell, ast, value: item.value });
          slotCodes.push(slotCode);
        } else slotCodes.push(this.arrowCode("", () => this.genChain(item)));
      });
      captured = [...frame.captured.values()].map(r => this.referenceCode(r));
      this.frames.pop();
      slotsJS = "(" + activation + ")=>[" + slotCodes.join(",") + "]";
    }
    if (takes || !captured) { const runCaptures = [...runFrame.captured.values()].map(r => this.referenceCode(r)); captured = captured ? [...new Set(captured.concat(runCaptures))] : runCaptures; }
    const runJS = "(" + [activation + "_L", activation + "_it"].concat(paramNames).join(",") + ")=>{" + runBody + "}";
    // a library may add a faster way to run this cell, worked out ahead (spork's kernel, decision 91)
    const fasterForm = LIBRARIES.cell ? LIBRARIES.cell(this, cell) : null;
    return "makeCell(SHAPES[" + shapeNumber + "]," + slotsJS + "," + runJS + ",[" + defaultMakers.join(",") + "],()=>[" + captured.join(",") + "]" + (fasterForm ? "," + fasterForm : "") + ")";
  }
}
// does this expression use any of these names?
function mentions(node, names) {
  if (!node || typeof node !== "object") return false;
  if (node.type === "word") return names.has(node.value);
  for (const key in node) { const value = node[key]; if (Array.isArray(value) ? value.some(x => mentions(x, names)) : (value && typeof value === "object" && mentions(value, names))) return true; }
  return false;
}
const OPERATOR_FUNCTION = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV", "%": "MOD", "<": "LT", ">": "GT", "<=": "LE", ">=": "GE", "=": "EQ", "!=": "NE", "..": "concat", "with": "withCell", "@": "partAt" };
// a cell literal of fields only, none using a sibling field, _, left or right
function isFieldsOnly(cell) {
  if (cell.names.length || !cell.items.length || !cell.items.every(x => x.type === "bind")) return false;
  const names = new Set(cell.items.map(x => x.name)); let ok = names.size === cell.items.length;
  const bad = w => names.has(w) || w === "_" || w === "left" || w === "right";
  const walk = n => {
    if (!ok || !n || typeof n !== "object") return;
    if (n.type === "chain") { n.terms.forEach((t, i) => { if (t.type === "word") { if (i === 0 && bad(t.value)) ok = false; else if (i > 0 && (t.value === "_" || t.value === "left" || t.value === "right")) ok = false; } else walk(t); }); return; }
    if (n.type === "word") { if (bad(n.value)) ok = false; return; }
    for (const key in n) { const v = n[key]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") walk(v); }
  };
  cell.items.forEach(x => walk(x.value));
  return ok;
}
// is a chain's answer certainly true or false? "false" when it is the word false itself, "bool" for a test, else null.
// Strictly left to right, so the last step decides: a comparison, and, or, not, or the words true and false.
const TEST_OPERATORS = new Set(["<", ">", "<=", ">=", "=", "!="]);
function givesBool(chain) {
  const terms = chain.terms; if (!terms.length) return null;
  if (terms.length === 1 && terms[0].type === "word" && terms[0].value === "false") return "false";
  let gives = terms[0].type === "word" && terms[0].value === "true" ? "bool" : terms[0].type === "group" && terms[0].items.length === 1 && terms[0].items[0].type === "chain" && givesBool(terms[0].items[0]) ? "bool" : null;
  for (let i = 1; i < terms.length; i++) {
    const term = terms[i];
    if (term.type === "word" && (FUSED_OPERATORS.has(term.value) || term.value === "and" || term.value === "or") && i + 1 < terms.length) { gives = TEST_OPERATORS.has(term.value) || term.value === "and" || term.value === "or" ? "bool" : null; i++; }
    else if (term.type === "word" && term.value === "not") gives = gives ? "bool" : null;
    else gives = null;
  }
  return gives;
}
// a field value simple enough to work out when the cell is made: literals, names, field reads and arithmetic on them
function isSimpleValue(chain) {
  if (chain.type !== "chain" || !chain.terms.length) return false;
  const terms = chain.terms;
  const isSimpleTerm = term => term.type === "num" || term.type === "str" || (term.type === "word" && !["_", "left", "right", "!"].includes(term.value)) ||
    (term.type === "group" && term.items.length === 1 && isSimpleValue(term.items[0])) || (term.type === "cell" && isSimpleList(term));
  if (!isSimpleTerm(terms[0])) return false;
  for (let i = 1; i < terms.length; i++) {
    const term = terms[i];
    if (term.type === "word" && ["print", "each", "times", "else", "and", "or"].includes(term.value)) return false;
    if (!isSimpleTerm(term)) return false;
  }
  return true;
}
// [a, b, c] whose parts are all simple: built straight away as a cell of values
function isSimpleList(cell) { return !cell.names.length && cell.items.length > 0 && cell.items.every(item => item.type === "chain" && isSimpleValue(item)); }
const COMPILER_NOTE_KEYS = new Set(["line", "kern", "bindName", "sporkArg", "spkUses"]);
function sourceKey(cell) { return JSON.stringify(cell, (key, value) => COMPILER_NOTE_KEYS.has(key) ? undefined : value); }

function compile(src, globals) {
  const ast = parse(src);
  const gen = new CodeGen(globals);
  if (LIBRARIES.prescan) LIBRARIES.prescan(gen, ast);
  gen.tempScopes.push([]);
  const code = gen.genCell({ type: "cell", names: [], items: ast });
  const topTemps = gen.tempScopes.pop();
  // each body is compiled more than once (to run, and to read fields), so its speedNotes note is kept once
  const seenNotes = new Set(), speedNotes = gen.speedNotes.filter(note => { const key = note.line + " " + note.word + " " + note.fast; if (seenNotes.has(key)) return false; seenNotes.add(key); return true; });
  return { code, shapes: gen.shapes, prologue: (topTemps.length ? "let " + topTemps.join(",") + ";\n" : "") + gen.constants.join("\n"), speedNotes };
}

// ===================================================================== libraries (decision 96)
// The core runs every program on its own. A library can only make it faster or add built-inputs, never change an answer:
//   cell(gen, c)      more ways to run a cell literal, as JS for makeCell's last argument (spork's kernel)
//   fuse.find/wrap    a run of steps in a chain made into one loop, tried before the steps as written
//   note(gen, T, i)   speedNotes notes; prescan(gen, ast) a look over the whole program first
//   spork(xs, f)      run a spork faster, or null; sortNumbers(a) sort a Float64Array
//   runtime           names the generated code may call
const LIBRARIES = { cell: null, fuse: null, note: null, prescan: null, spork: null, sortNumbers: null };
function install(library) { for (const key in library) { if (key === "runtime") Object.assign(RUNTIME, library.runtime); else if (key in LIBRARIES) LIBRARIES[key] = library[key]; } }

// ===================================================================== runtime
const BANG = { toString: () => "!" };   // "no input" (decisions 58, 69)
const ANY = { toString: () => "any" };
const UNSET = {};
let logMessage = (msg) => { if (typeof console !== "undefined") console.log("sprout: " + msg); };
const lintsShown = new Set();
const missCounts = new Map();
function logMiss(message, line) { const full = message + (line ? " (line " + line + ")" : ""); const times = (missCounts.get(full) || 0) + 1; missCounts.set(full, times); if (times <= 3) logMessage(full + (times === 3 ? " (and more; not shown again)" : "")); return false; }
function unknownWord(name, line, hint) { return logMiss("\"" + name + "\" isn't a word Sprout knows yet" + (hint ? " (did you mean \"" + hint + "\"?)" : ""), line); }
// the closest name to a likely typo: at most 1 edit for short names, 2 for longer ones; none if it's a tie between several
function nearest(name, names) {
  const limit = name.length <= 4 ? 1 : 2; let best = null, bestD = limit + 1, tie = false;
  for (const candidate of names) {
    if (candidate === name || Math.abs(candidate.length - name.length) > limit) continue;
    const distance = editDistance(name, candidate, limit);
    if (distance < bestD) { best = candidate; bestD = distance; tie = false; } else if (distance === bestD) tie = true;
  }
  return best && !tie ? best : null;
}
function editDistance(a, b, cap) {
  // optimal string alignment: insert, delete, change, or swap two neighbouring letters, each one edit
  const table = [];
  for (let x = 0; x <= a.length; x++) { table.push(new Array(b.length + 1).fill(0)); table[x][0] = x; }
  for (let y = 0; y <= b.length; y++) table[0][y] = y;
  for (let x = 1; x <= a.length; x++) {
    let low = Infinity;
    for (let y = 1; y <= b.length; y++) {
      let cost = Math.min(table[x - 1][y] + 1, table[x][y - 1] + 1, table[x - 1][y - 1] + (a[x - 1] === b[y - 1] ? 0 : 1));
      if (x > 1 && y > 1 && a[x - 1] === b[y - 2] && a[x - 2] === b[y - 1]) cost = Math.min(cost, table[x - 2][y - 2] + 1);
      table[x][y] = cost; if (cost < low) low = cost;
    }
    if (low > cap) return cap + 1;
  }
  return table[a.length][b.length];
}

// Activation: one activation of a cell, holding its inputs and (for reads) its worked-out slots
class Activation {
  constructor(cell, inputs, it, left) { this.cell = cell; this.inputs = inputs; this.it = it; this.left = left; this.cache = null; this.slotMakers = null; }
  get(i) {
    if (this.cache === null) {
      if (!this.cell.slots) return false;
      this.cache = new Array(this.cell.shape.itemCount).fill(UNSET); this.slotMakers = this.cell.slots(this);
    }
    let value = this.cache[i];
    if (value === UNSET) { value = this.slotMakers[i](); this.cache[i] = value; }
    return value;
  }
}

// Cell: from a literal. Fields and parts are read lazily; running is always fresh.
class Cell {
  constructor(shape, slots, run, defaultMakers, captured, fastForms) { this.shape = shape; this.slots = slots; this.runCode = run; this.defaultMakers = defaultMakers; this.captured = captured; this.left = undefined; this._activation = null; this.fastForms = fastForms || null; }
  activation() { return this._activation || (this._activation = new Activation(this, this.defaults(), false, this.left)); }
  defaults() { const makers = this.defaultMakers; if (!makers.length) return EMPTY; const values = new Array(makers.length); for (let j = 0; j < makers.length; j++) values[j] = makers[j] ? makers[j]() : false; return values; }
  field(name) { const i = this.shape.fieldIndex[name]; return i === undefined ? UNSET : this.activation().get(i); }
  fieldNames() { return Object.keys(this.shape.fieldIndex); }
  count() { return this.shape.partIndex.length; }
  part(n) { const i = this.shape.partIndex[n - 1]; return i === undefined ? false : this.activation().get(i); }
  takesInput() { return this.shape.names.length > 0 || this.shape.usesIt; }
  run(arg) { let r = this.runOneStep(arg); while (r instanceof TailCall) r = r.cell.runOneStep(r.argument); return r; }
  // runOneStep: one step; a call in tail position comes back as a TailCall for the loop above (stack stays flat)
  runOneStep(arg) {
    const shape = this.shape, nameCount = shape.names.length, left = this.left;
    if (arg === BANG || arg === undefined) return nameCount ? this.call(this.defaults()) : this.runCode(left, false);
    if (nameCount === 0) return this.runCode(left, arg);
    if (nameCount === 1) return this.runCode(left, false, arg); // one name takes the whole value (decision 19)
    // several names: unpack the argument cell by position, then by name (decision 15)
    const inputs = this.defaults();
    if (isCell(arg)) {
      const partCount = arg.count();
      if (partCount > nameCount) lint("more values than names: " + partCount + " given, " + nameCount + " taken");
      for (let j = 0; j < nameCount && j < partCount; j++) inputs[j] = arg.part(j + 1);
      if (arg.fieldNames().length) for (let j = 0; j < nameCount; j++) { const value = arg.field(shape.names[j]); if (value !== UNSET) inputs[j] = value; }
      for (let j = partCount; j < nameCount; j++) if (!this.defaultMakers[j] && arg.field(shape.names[j]) === UNSET) lint("\"" + shape.names[j] + "\" was not given, so it is false");
    } else inputs[0] = arg;
    return this.call(inputs);
  }
  call(inputs) {
    const left = this.left;
    switch (inputs.length) {
      case 1: return this.runCode(left, false, inputs[0]);
      case 2: return this.runCode(left, false, inputs[0], inputs[1]);
      case 3: return this.runCode(left, false, inputs[0], inputs[1], inputs[2]);
      case 4: return this.runCode(left, false, inputs[0], inputs[1], inputs[2], inputs[3]);
      default: return this.runCode(left, false, ...inputs);
    }
  }
  bindLeft(receiver) { const bound = new Cell(this.shape, this.slots, this.runCode, this.defaultMakers, this.captured, this.fastForms); bound.left = receiver; return bound; }
}
const EMPTY = [];
function lint(msg) { if (!lintsShown.has(msg)) { lintsShown.add(msg); logMessage("lint: " + msg); } }

// FieldShape: the field names of a kind of record, shared by every record with the same names (like a JS hidden class)
class FieldShape {
  constructor(keys) { this.keys = keys; this.extensions = new Map(); }
  index(key) { const keys = this.keys; for (let i = 0; i < keys.length; i++) if (keys[i] === key) return i; return -1; }
  add(key) { let extended = this.extensions.get(key); if (!extended) { extended = new FieldShape(this.keys.concat([key])); this.extensions.set(key, extended); } return extended; }
}
const NO_FIELDS = new FieldShape([]);
const shapeCache = new Map();
function shapeFor(keys) { const cacheKey = keys.join("\u0000"); let shape = shapeCache.get(cacheKey); if (!shape) { shape = NO_FIELDS; for (const key of keys) shape = shape.index(key) >= 0 ? shape : shape.add(key); shapeCache.set(cacheKey, shape); } return shape; }

// ValueCell: a cell of worked-out values, made by with, .., collect, keep and range
class ValueCell {
  // parts: JS array (0-based); fieldShape: field shape; fieldValues: field values in shape order
  constructor(parts, fieldShape, fieldValues) { this.parts = parts; this.fieldShape = fieldShape || NO_FIELDS; this.fieldValues = fieldValues || EMPTY; }
  field(name) { const i = this.fieldShape.index(name); return i < 0 ? UNSET : this.fieldValues[i]; }
  fieldNames() { return this.fieldShape.keys; }
  get fields() { if (!this.fieldShape.keys.length) return null; const m = new Map(); this.fieldShape.keys.forEach((k, i) => m.set(k, this.fieldValues[i])); return m; }
  count() { return this.parts.length; }
  part(n) { const v = this.parts[n - 1]; return v === undefined ? false : v; }
  takesInput() { return false; }
  run() { return this.parts.length ? this.parts[this.parts.length - 1] : false; }
}
// a cell of values from a JS array of parts and a Map of fields
function valueCellOf(parts, fields) { return fields && fields.size ? new ValueCell(parts, shapeFor([...fields.keys()]), [...fields.values()]) : new ValueCell(parts, NO_FIELDS, EMPTY); }
// RangeCell: range n, the cell [1, 2, ..., n]. Part i is i, so loops never need to build the list.
class RangeCell extends ValueCell {
  constructor(size) { super(null, NO_FIELDS, EMPTY); this.size = size; this._parts = null; }
  get parts() { if (!this._parts) { const o = new Array(this.size); for (let i = 0; i < this.size; i++) o[i] = i + 1; this._parts = o; } return this._parts; }
  set parts(v) {}
  count() { return this.size; }
  part(i) { return i >= 1 && i <= this.size ? i : false; }
  run() { return this.size ? this.size : false; }
}
function makeRecord(fieldShape, vals) { return new ValueCell(EMPTY, fieldShape, vals); }
function makeList(parts) { return new ValueCell(parts, NO_FIELDS, EMPTY); }
function makeCell(shape, slots, run, defaultMakers, captured, fastForms) { return new Cell(shape, slots, run, defaultMakers, captured, fastForms); }

// ColumnCell: a list of records that share one shape and hold only numbers, stored as one number array per field (decision 82).
// To a program it is the same list: parts, @, length, = and str all see ordinary records, made when first asked for.
class ColumnCell extends ValueCell {
  constructor(recordShape, columns, size) { super(null, NO_FIELDS, EMPTY); this.recordShape = recordShape; this.columns = columns; this.size = size; this._parts = null; }
  get parts() { if (!this._parts) { const o = new Array(this.size); for (let i = 0; i < this.size; i++) o[i] = this.row(i); this._parts = o; } return this._parts; }
  set parts(v) {}
  row(i) { const columns = this.columns, fieldCount = columns.length, fieldValues = new Array(fieldCount); for (let j = 0; j < fieldCount; j++) fieldValues[j] = columns[j][i]; return new ValueCell(EMPTY, this.recordShape, fieldValues); }
  count() { return this.size; }
  part(k) { if (!Number.isInteger(k) || k < 1 || k > this.size) return false; return this._parts ? this._parts[k - 1] : this.row(k - 1); }
  run() { return this.size ? this.part(this.size) : false; }
}
// NumberList: a list of numbers kept in one Float64Array, made by spork and sort. To a program it is the same list.
class NumberList extends ValueCell {
  constructor(numbers) { super(null, NO_FIELDS, EMPTY); this.numbers = numbers; this._parts = null; }
  get parts() { if (!this._parts) this._parts = Array.from(this.numbers); return this._parts; }
  set parts(v) {}
  count() { return this.numbers.length; }
  part(k) { return Number.isInteger(k) && k >= 1 && k <= this.numbers.length ? this.numbers[k - 1] : false; }
  run() { return this.numbers.length ? this.numbers[this.numbers.length - 1] : false; }
}
let COLUMN_MIN_LENGTH = 32, fastPathsOn = true;
const COLUMNS_CACHE = new WeakMap();
// the columns for a list, if it is one: a list already in columns, or 32 or more records of one shape holding only numbers
function asColumns(list) {
  if (list instanceof ColumnCell) return list;
  if (!(list instanceof ValueCell) || list instanceof RangeCell || list.fieldShape !== NO_FIELDS) return null;
  const items = list.parts; if (items.length < COLUMN_MIN_LENGTH) return null;
  let columns = COLUMNS_CACHE.get(list); if (columns !== undefined) return columns;
  columns = rowsToColumns(items, null); COLUMNS_CACHE.set(list, columns); return columns;
}
function rowsToColumns(rows, recordShape) {
  const count = rows.length; if (!count) return null;
  const firstRow = rows[0]; if (!(firstRow instanceof ValueCell)) return null;
  recordShape = recordShape || firstRow.fieldShape; const fieldCount = recordShape.keys.length; if (!fieldCount) return null;
  const columns = new Array(fieldCount); for (let j = 0; j < fieldCount; j++) columns[j] = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const row = rows[i]; if (!(row instanceof ValueCell) || row.fieldShape !== recordShape || row.parts.length) return null;
    const fieldValues = row.fieldValues; for (let j = 0; j < fieldCount; j++) { const value = fieldValues[j]; if (typeof value !== "number") return null; columns[j][i] = value; }
  }
  return new ColumnCell(recordShape, columns, count);
}
// a .. b where either side is in columns: the result stays in columns when both sides hold records of the same shape
function mergeColumns(left, right) {
  const asColumnsOf = (list, recordShape) => {
    if (list instanceof ColumnCell) return list.recordShape === recordShape ? list : null;
    if (!isCell(list) || list instanceof RangeCell || list.fieldNames().length) return null;
    if (list.count() === 0) return NO_COLUMNS;
    return rowsToColumns(partsOf(list), recordShape);
  };
  const recordShape = (left instanceof ColumnCell ? left : right).recordShape;
  const leftColumns = asColumnsOf(left, recordShape); if (!leftColumns) return null;
  const rightColumns = asColumnsOf(right, recordShape); if (!rightColumns) return null;
  if (rightColumns === NO_COLUMNS) return leftColumns === NO_COLUMNS ? null : leftColumns;
  if (leftColumns === NO_COLUMNS) return rightColumns;
  const leftCount = leftColumns.size, rightCount = rightColumns.size, fieldCount = leftColumns.columns.length, columns = new Array(fieldCount);
  for (let j = 0; j < fieldCount; j++) { const merged = new Float64Array(leftCount + rightCount); merged.set(leftColumns.columns[j], 0); merged.set(rightColumns.columns[j], leftCount); columns[j] = merged; }
  return new ColumnCell(recordShape, columns, leftCount + rightCount);
}
const NO_COLUMNS = {};
const isCell = v => v instanceof Cell || v instanceof ValueCell;
function partsOf(cell) { if (cell instanceof ValueCell) return cell.parts; const count = cell.count(), parts = new Array(count); for (let i = 0; i < count; i++) parts[i] = cell.part(i + 1); return parts; }
function fieldsOf(cell) { if (cell instanceof ValueCell) return cell.fields || new Map(); const fields = new Map(); for (const key of cell.fieldNames()) fields.set(key, cell.field(key)); return fields; }

// Native: a cell written in JavaScript (host words, range, rand...). fn takes the one argument.
class Native { constructor(name, fn, effect) { this.name = name; this.fn = fn; this.effect = !!effect; } }
// WaitingMethod: a prototype method that has its left side and waits for its right side
class WaitingMethod { constructor(fn, left) { this.fn = fn; this.left = left; } }
class TailCall { constructor(cell, argument) { this.cell = cell; this.argument = argument; } }
function finishTailCalls(result) { while (result instanceof TailCall) result = result.cell.runOneStep(result.argument); return result; }
// tailSend: a send in tail position. A cell is not called here; its caller's loop calls it.
function tailSend(receiver, argument) { if (receiver instanceof Cell && !(typeof argument === "string" && receiver.shape.fieldIndex[argument] !== undefined)) return new TailCall(receiver, argument); return send(receiver, argument); }

// ---- reading a field (decisions 2, 38, 52)
function readField(receiver, value) {
  if (value instanceof Cell && value.shape.usesLeft) { const bound = value.bindLeft(receiver); return bound.takesInput() ? bound : bound.run(BANG); }
  return value;
}
// sendWord: send a word. Fields first (with prototype methods), then a name in scope as the argument.
// sendWordCached: sendWord with an inline cache. A record read at this spot usually has the same shape every time.
function sendWordCached(receiver, word, lexical, line, cache, quiet) {
  if (receiver instanceof ValueCell) {
    const fieldShape = receiver.fieldShape;
    if (fieldShape === cache.shape) { const value = receiver.fieldValues[cache.index]; return value instanceof Cell && value.shape.usesLeft ? readField(receiver, value) : value; }
    const index = fieldShape.index(word);
    if (index >= 0) {
      if (lexical) lintFieldNameClash(word, line);
      cache.shape = fieldShape; cache.index = index;
      const value = receiver.fieldValues[index]; return value instanceof Cell && value.shape.usesLeft ? readField(receiver, value) : value;
    }
  }
  return sendWord(receiver, word, lexical, line, quiet);
}
// decision 73: a word that is both a field of the receiver and a name in scope reads the field, loudly
function lintFieldNameClash(word, line) { lint("\"" + word + "\" is both a field here and a name in scope; the field wins" + (line ? " (line " + line + ")" : "")); }
function sendWord(receiver, word, lexical, line, quiet) {
  if (receiver instanceof Cell || receiver instanceof ValueCell) {
    const value = receiver.field(word);
    if (value !== UNSET) { if (lexical) lintFieldNameClash(word, line); return readField(receiver, value); }
  }
  const method = methodsOf(receiver)[word];
  if (method !== undefined) return method.takesArgument ? new WaitingMethod(method.run, receiver) : method.run(receiver);
  if (lexical) return send(receiver, lexical());
  if (quiet) return false;
  // a field that isn't there: suggest the nearest field this cell does have
  const hint = (receiver instanceof Cell || receiver instanceof ValueCell) ? nearest(word, receiver.fieldNames()) : null;
  return logMiss(describe(receiver) + " doesn't know " + word + (hint ? " (did you mean " + hint + "?)" : ""), line);
}
// send: send a value
function send(receiver, argument) {
  if (receiver instanceof Cell) {
    if (typeof argument !== "string" && argument !== BANG && receiver.shape.names.length === 1) {
      let result = receiver.runCode(receiver.left, false, argument);
      while (result instanceof TailCall) result = result.cell.runOneStep(result.argument);
      return result;
    }
    if (typeof argument === "string") { const value = receiver.field(argument); if (value !== UNSET) return readField(receiver, value); }
    return receiver.run(argument);
  }
  if (receiver instanceof WaitingMethod) return receiver.fn(receiver.left, argument);
  if (receiver instanceof Native) return receiver.fn(argument === BANG ? false : argument);
  if (receiver instanceof ValueCell) { if (typeof argument === "string") { const value = receiver.field(argument); if (value !== UNSET) return readField(receiver, value); } return receiver.run(argument); }
  if (receiver === true || receiver === false) { if (isCell(argument)) return receiver ? argument.run(BANG) : false; return notUnderstood(receiver, argument); }
  return notUnderstood(receiver, argument);
}
// decision 28: an unhandled send logs and gives false
function notUnderstood(receiver, message, line) { return logMiss(describe(receiver) + " doesn't know " + describe(message), line); }
function describe(value) { const text = formatValue(value); return text.length > 30 ? text.slice(0, 30) + "..." : text; }
function runCell(cell) { return cell.run(BANG); }
function requireBool(value, operator) { return typeof value === "boolean" ? value : notUnderstood(value, operator); }

// ---- effects: queued while the loop is running update, carried out after (decision 33)
let effectQueue = null;
function effect(work) { if (effectQueue) effectQueue.push(work); else work(); return false; }
function queueEffects() { effectQueue = []; }
function runEffects() { const queued = effectQueue || []; effectQueue = null; for (const work of queued) work(); return queued.length; }
function dropEffects() { const dropped = effectQueue ? effectQueue.length : 0; effectQueue = null; return dropped; }

// noise: a 32-bit integer hash of both inputs (whole and fractional parts), mapped to [0, 1)
function noiseHash(x, y) {
  const wholeX = Math.floor(x), wholeY = Math.floor(y);
  let hash = Math.imul(wholeX ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((wholeY + 0x632be5ab) | 0, 0xc2b2ae35) ^ Math.imul(Math.floor((x - wholeX) * 4294967296) | 0, 0x27d4eb2f) ^ Math.imul(Math.floor((y - wholeY) * 4294967296) | 0, 0x165667b1);
  hash ^= hash >>> 16; hash = Math.imul(hash, 0x7feb352d); hash ^= hash >>> 15; hash = Math.imul(hash, 0x846ca68b); hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

// ---- text
function formatValue(value) {
  if (value === true) return "true"; if (value === false) return "false"; if (value === BANG) return "!"; if (value === ANY) return "any";
  if (typeof value === "number") return String(+value.toFixed(10));
  if (typeof value === "string") return value;
  if (value instanceof Native) return "[" + value.name + "]";
  if (value instanceof WaitingMethod) return "[waiting]";
  if (value instanceof Cell && value.takesInput()) return "[cell]";
  if (isCell(value)) {
    const pieces = [];
    for (const key of value.fieldNames()) { const fieldValue = value.field(key); pieces.push(key + " : " + (fieldValue instanceof Cell && (fieldValue.takesInput() || fieldValue.shape.usesLeft) ? "[cell]" : formatValue(fieldValue))); }
    for (const part of partsOf(value)) pieces.push(part instanceof Cell && part.takesInput() ? "[cell]" : formatValue(part));
    return "[" + pieces.join(", ") + "]";
  }
  return String(value);
}
function joinText() { let text = ""; for (let i = 0; i < arguments.length; i++) text += formatValue(arguments[i]); return text; }

// ---- equality: same contents, never runs anything (decisions 22, 23)
function valuesEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (!isCell(a) || !isCell(b)) return false;
  // a cell that takes input compares by its code and the values it captured (decision 23)
  const aTakesInput = a instanceof Cell && a.takesInput(), bTakesInput = b instanceof Cell && b.takesInput();
  if (aTakesInput || bTakesInput) {
    if (!(aTakesInput && bTakesInput) || a.shape.src !== b.shape.src) return false;
    const aCaptured = a.captured(), bCaptured = b.captured();
    for (let i = 0; i < aCaptured.length; i++) if (!valuesEqual(aCaptured[i], bCaptured[i])) return false;
    return true;
  }
  // any other cell compares by its worked-out parts and fields (decision 72)
  const count = a.count(); if (count !== b.count()) return false;
  for (let i = 1; i <= count; i++) if (!valuesEqual(a.part(i), b.part(i))) return false;
  const aFields = a.fieldNames(), bFields = b.fieldNames(); if (aFields.length !== bFields.length) return false;
  for (const key of aFields) { const value = b.field(key); if (value === UNSET || !valuesEqual(a.field(key), value)) return false; }
  return true;
}

// ---- with and .. : one operation (decision 45)
function merge(left, right) {
  if (typeof left === "string" || typeof left === "number") return formatValue(left) + formatValue(right);
  if (!isCell(left)) return notUnderstood(left, "with");
  if (!isCell(right)) return notUnderstood(right, "with");
  if (left instanceof ColumnCell || right instanceof ColumnCell) { const r = mergeColumns(left, right); if (r) return r; }
  const leftParts = partsOf(left), rightParts = partsOf(right);
  const parts = rightParts.length ? (leftParts.length ? leftParts.concat(rightParts) : rightParts) : leftParts;
  let fieldShape, fieldValues;
  if (left instanceof ValueCell) { fieldShape = left.fieldShape; fieldValues = left.fieldValues; } else { const keys = left.fieldNames(); fieldShape = shapeFor(keys); fieldValues = keys.map(key => left.field(key)); }
  const rightKeys = right.fieldNames();
  if (rightKeys.length) {
    fieldValues = fieldValues.slice();
    for (const key of rightKeys) { const value = right.field(key); const position = fieldShape.index(key); if (position < 0) { fieldShape = fieldShape.add(key); fieldValues.push(value); } else fieldValues[position] = value; }
  }
  return new ValueCell(parts, fieldShape, fieldValues);
}

// ---- operators: fused fast paths, falling back to prototype fields (decisions 36, 37)
function operatorBySending(name, left, right) { return send(sendWord(left, name, null, 0), right); }
function ADD(a, b) { return typeof a === "number" && typeof b === "number" ? a + b : operatorBySending("+", a, b); }
function SUB(a, b) { return typeof a === "number" && typeof b === "number" ? a - b : operatorBySending("-", a, b); }
function MUL(a, b) { return typeof a === "number" && typeof b === "number" ? a * b : operatorBySending("*", a, b); }
function DIV(a, b) { return typeof a === "number" && typeof b === "number" ? a / b : operatorBySending("/", a, b); }
function MOD(a, b) { return typeof a === "number" && typeof b === "number" ? ((a % b) + b) % b : operatorBySending("%", a, b); }
function LT(a, b) { return typeof a === "number" && typeof b === "number" ? a < b : operatorBySending("<", a, b); }
function GT(a, b) { return typeof a === "number" && typeof b === "number" ? a > b : operatorBySending(">", a, b); }
function LE(a, b) { return typeof a === "number" && typeof b === "number" ? a <= b : operatorBySending("<=", a, b); }
function GE(a, b) { return typeof a === "number" && typeof b === "number" ? a >= b : operatorBySending(">=", a, b); }
function hasOwnOperator(value, word) { return (value instanceof Cell || value instanceof ValueCell) && value.field(word) !== UNSET; }
function EQ(a, b) { if (a === b) return true; if (typeof a !== "object") return false; return hasOwnOperator(a, "=") ? operatorBySending("=", a, b) : valuesEqual(a, b); }
function NE(a, b) { return !EQ(a, b); }
function concat(left, right) { if (typeof left === "string") return left + (typeof right === "string" ? right : formatValue(right)); return hasOwnOperator(left, "..") ? operatorBySending("..", left, right) : merge(left, right); }
function withCell(left, right) { return hasOwnOperator(left, "with") ? operatorBySending("with", left, right) : merge(left, right); }
function partAt(list, position) { return partOf(list, position); }
// x with [a : ..., b : ...] compiled straight to a field update
// record with [a : ..., b : ...]: the new fields laid straight over the record (the cache remembers where they go for its shape)
function withFields(record, keys, values, cache) {
  if (record instanceof ValueCell) {
    const fieldShape = record.fieldShape;
    if (fieldShape === cache.shape) {
      const fieldValues = record.fieldValues.slice(), positions = cache.positions;
      for (let i = 0; i < positions.length; i++) fieldValues[positions[i]] = values[i];
      return new ValueCell(record.parts, cache.outShape, fieldValues);
    }
    if (fieldShape.index("with") < 0) {
      let outShape = fieldShape; const fieldValues = record.fieldValues.slice(), positions = new Array(keys.length);
      for (let i = 0; i < keys.length; i++) {
        let at = outShape.index(keys[i]);
        if (at < 0) { outShape = outShape.add(keys[i]); at = outShape.keys.length - 1; }
        fieldValues[at] = values[i]; positions[i] = at;
      }
      cache.shape = fieldShape; cache.outShape = outShape; cache.positions = positions;
      return new ValueCell(record.parts, outShape, fieldValues);
    }
  }
  return withCell(record, new ValueCell(EMPTY, shapeFor(keys), values));
}
function partOf(list, position) {
  if (isCell(list)) return list.part(position);
  if (typeof list === "string") return position >= 1 && position <= list.length ? list[position - 1] : false;
  return notUnderstood(list, "@");
}
function lengthOf(value) { if (isCell(value)) return value.count(); if (typeof value === "string") return value.length; return notUnderstood(value, "length"); }

// ---- calling a cell with each item (collections are methods, decision 55)
function callCell(cell, item) {
  if (cell instanceof Cell) return cell.run(item);
  return send(cell, item);
}
// a cell with one named input is run straight through its code (the commonest case, and the quickest)
const runsDirectly = cell => cell instanceof Cell && cell.shape.names.length === 1;
function each(list, cell) {
  const direct = runsDirectly(cell), code = direct ? cell.runCode : null, left = direct ? cell.left : undefined;
  if (list instanceof RangeCell) { for (let i = 1; i <= list.size; i++) direct ? finishTailCalls(code(left, false, i)) : callCell(cell, i); return false; }
  const items = partsOf(list);
  for (let i = 0; i < items.length; i++) direct ? finishTailCalls(code(left, false, items[i])) : callCell(cell, items[i]);
  return false;
}
function collect(list, cell) {
  const items = partsOf(list), count = items.length, results = new Array(count);
  if (runsDirectly(cell)) { const code = cell.runCode, left = cell.left; for (let i = 0; i < count; i++) results[i] = finishTailCalls(code(left, false, items[i])); }
  else for (let i = 0; i < count; i++) results[i] = callCell(cell, items[i]);
  return new ValueCell(results, NO_FIELDS, EMPTY);
}
function keep(list, test) {
  const items = partsOf(list), kept = [];
  const direct = runsDirectly(test), code = direct ? test.runCode : null, left = direct ? test.left : undefined;
  for (let i = 0; i < items.length; i++) {
    const answer = direct ? finishTailCalls(code(left, false, items[i])) : callCell(test, items[i]);
    if (answer === true) kept.push(items[i]); else if (answer !== false) notUnderstood(answer, "keep");
  }
  return new ValueCell(kept, NO_FIELDS, EMPTY);
}
// list fold [start, [total item | ...]]
function fold(list, startAndCell) {
  if (!isCell(startAndCell)) return notUnderstood(startAndCell, "fold");
  let total = startAndCell.part(1); const cell = startAndCell.part(2);
  if (cell instanceof Cell && cell.shape.names.length === 2) {
    const code = cell.runCode, left = cell.left;
    if (list instanceof RangeCell) { for (let i = 1; i <= list.size; i++) total = finishTailCalls(code(left, false, total, i)); return total; }
    const items = partsOf(list); for (let i = 0; i < items.length; i++) total = finishTailCalls(code(left, false, total, items[i])); return total;
  }
  const items = partsOf(list);
  for (let i = 0; i < items.length; i++) total = callCell(cell, new ValueCell([total, items[i]], NO_FIELDS, EMPTY));
  return total;
}
function times(count, cell) { for (let i = 1; i <= count; i++) callCell(cell, i); return false; }
// spork (decision 47) is a parallel collect: the same list. A library runs it faster when it can (decision 91).
function spork(list, cell) { const result = LIBRARIES.spork && fastPathsOn ? LIBRARIES.spork(list, cell) : null; return result || collect(list, cell); }

// sort: numbers from least to most, or words in order (a library choice, decision 80)
const sortNumbers = a => (LIBRARIES.sortNumbers || (x => Float64Array.from(x).sort()))(a);
function sortList(list) {
  if (list instanceof NumberList) return new NumberList(sortNumbers(list.numbers));
  if (list instanceof RangeCell) return list;
  const items = partsOf(list);
  if (items.every(value => typeof value === "number")) return new NumberList(sortNumbers(Float64Array.from(items)));
  if (items.every(value => typeof value === "string")) return makeList(items.slice().sort());
  return logMiss("sort sorts a list of numbers or a list of words");
}

// ---- prototypes: built-in fields of each kind of value. ar:1 waits for a right side.
const methodTakingNothing = run => ({ takesArgument: false, run }), methodTakingOne = run => ({ takesArgument: true, run });
const EVERY_VALUE_METHODS = {
  "=": methodTakingOne(valuesEqual), "!=": methodTakingOne((a, b) => !valuesEqual(a, b)), else: methodTakingOne((a, b) => a === false ? (isCell(b) ? b.run(BANG) : b) : a),
  print: methodTakingNothing(a => { GLOBALS.print.fn(a); return a; }), str: methodTakingNothing(a => formatValue(a)), with: methodTakingOne(merge), "..": methodTakingOne(merge),
};
const NUMBER_METHODS = Object.assign(Object.create(EVERY_VALUE_METHODS), {
  "+": methodTakingOne((a, b) => a + requireNumber(b)), "-": methodTakingOne((a, b) => a - requireNumber(b)), "*": methodTakingOne((a, b) => a * requireNumber(b)), "/": methodTakingOne((a, b) => a / requireNumber(b)),
  "%": methodTakingOne((a, b) => ((a % b) + b) % b), "<": methodTakingOne((a, b) => a < requireNumber(b)), ">": methodTakingOne((a, b) => a > requireNumber(b)),
  "<=": methodTakingOne((a, b) => a <= requireNumber(b)), ">=": methodTakingOne((a, b) => a >= requireNumber(b)),
  abs: methodTakingNothing(Math.abs), floor: methodTakingNothing(Math.floor), round: methodTakingNothing(Math.round), ceil: methodTakingNothing(Math.ceil), sqrt: methodTakingNothing(Math.sqrt),
  sin: methodTakingNothing(Math.sin), cos: methodTakingNothing(Math.cos), tan: methodTakingNothing(Math.tan), log: methodTakingNothing(Math.log), neg: methodTakingNothing(a => -a),
  times: methodTakingOne(times), min: methodTakingOne((a, b) => Math.min(a, b)), max: methodTakingOne((a, b) => Math.max(a, b)),
});
function requireNumber(value) { if (typeof value !== "number") { logMiss(describe(value) + " isn't a number"); return NaN; } return value; }
const TEXT_METHODS = Object.assign(Object.create(EVERY_VALUE_METHODS), {
  length: methodTakingNothing(lengthOf), "@": methodTakingOne(partOf), "<": methodTakingOne((a, b) => a < b), ">": methodTakingOne((a, b) => a > b),
  upper: methodTakingNothing(a => a.toUpperCase()), lower: methodTakingNothing(a => a.toLowerCase()),
});
const BOOL_METHODS = Object.assign(Object.create(EVERY_VALUE_METHODS), {
  not: methodTakingNothing(a => !a), and: methodTakingOne((a, b) => a && b === true), or: methodTakingOne((a, b) => a || b === true),
});
const CELL_METHODS = Object.assign(Object.create(EVERY_VALUE_METHODS), {
  "@": methodTakingOne(partOf), length: methodTakingNothing(lengthOf), first: methodTakingNothing(a => a.part(1)), last: methodTakingNothing(a => a.part(a.count())),
  collect: methodTakingOne(collect), keep: methodTakingOne(keep), each: methodTakingOne(each), fold: methodTakingOne(fold), spork: methodTakingOne(spork), sort: methodTakingNothing(sortList),
});
const OTHER_METHODS = EVERY_VALUE_METHODS;
function methodsOf(value) {
  switch (typeof value) {
    case "number": return NUMBER_METHODS; case "string": return TEXT_METHODS; case "boolean": return BOOL_METHODS;
  }
  if (value instanceof Cell || value instanceof ValueCell) return CELL_METHODS;
  return OTHER_METHODS;
}

// ---- globals: names every file can use. Host words are added by the host.
function argumentsOf(argument, count) { if (isCell(argument)) { const values = new Array(count); for (let i = 0; i < count; i++) values[i] = argument.part(i + 1); return values; } return [argument]; }
const GLOBALS = Object.create(null);
function defNative(name, fn, effect) { GLOBALS[name] = new Native(name, fn, effect); }
GLOBALS.any = ANY;
defNative("range", n => new RangeCell(Math.max(0, Math.floor(requireNumber(n)))));
// rand reads the recorded random source, like random, so it stays here; plain maths lives in the prelude (decision 97)
defNative("rand", a => { const [lo, hi] = argumentsOf(a, 2); return lo + randomSource() * (hi - lo); });
defNative("print", a => { effect(() => printOutput(formatValue(a))); return a; }, true);
// noise [sample, id]: a number from 0 up to 1 that is always the same for the same two inputs (decision 87)
defNative("noise", a => { const [x, y] = argumentsOf(a, 2); return noiseHash(requireNumber(x), requireNumber(y)); });
Object.defineProperty(GLOBALS, "random", { get: () => randomSource(), enumerable: true });
let randomSource = Math.random, printOutput = s => { if (typeof console !== "undefined") console.log(s); };

// ===================================================================== prelude, written in Sprout (decisions 30, 34, 35, 50)
const PRELUDE = `
-- maths that used to be written in JavaScript (decision 97)
clamp : [value low high | value < low [low] else [value > high [high] else [value]]]
toward : [from to amount | to - from * amount + from]
dist : [x1 y1 x2 y2 |
  across : x2 - x1, down : y2 - y1
  (across * across + (down * down)) sqrt
]
-- match [value, [case, answer, case, answer, ..., any, answer]]: the answer of the first case equal to value
match : [value cases |
  find : [position | position > (cases length) [0] else [(cases @ position) = any or ((cases @ position) = value) [position] else [find (position + 2)]]]
  found : find 1
  found > 0 [cases @ (found + 1)] else [false]
]
-- cond [test, answer, test, answer, ..., any, answer]: the answer of the first test that is true
cond : [cases |
  find : [position | position > (cases length) [0] else [(cases @ position) = any or ((cases @ position) = true) [position] else [find (position + 2)]]]
  found : find 1
  found > 0 [cases @ (found + 1)] else [false]
]
take : [items count | range (count min (items length)) collect [position | items @ position]]
rgb : [red green blue | "rgb(" .. red .. "," .. green .. "," .. blue .. ")"]
rgba : [red green blue alpha | "rgba(" .. red .. "," .. green .. "," .. blue .. "," .. alpha .. ")"]
every : [seconds now step | now / seconds floor > (now - step / seconds floor)]
wave : [seconds now | now / seconds * 6.283185307179586 sin]
fresh-input : [touching : false, tapped : false, touch-x : 0, touch-y : 0, held : []]
-- frame update: events in, one update per tick (decision 34)
frame : [update |
  [state event |
    current-input : state input else fresh-input
    match [event kind, [
      "down", state with [input : current-input with [touching : true, tapped : true, touch-x : event x, touch-y : event y]]
      "move", state with [input : current-input with [touch-x : event x, touch-y : event y]]
      "up", state with [input : current-input with [touching : false]]
      "tick", update (state with [dt : event dt, clock : event clock, input : current-input with [held : event held]]) with [input : current-input with [tapped : false, held : event held]]
      any, state
    ]]
  ]
]
`;

// ===================================================================== build
const RUNTIME = { BANG, ANY, GLOBALS, makeCell, sendWord, send, runCell, joinText, unknownWord, logMiss, withFields,
  ADD, SUB, MUL, DIV, MOD, LT, GT, LE, GE, EQ, NE, concat, withCell, partAt, makeRecord, makeList, requireBool, notUnderstood, tailSend, sendWordCached, shapeFor };
let preludeCell = null;
function globalNames(extra) { const names = new Set(Object.keys(GLOBALS)); if (extra) for (const name of extra) names.add(name); return names; }

function load(src, options) {
  options = options || {};
  const host = options.host || {};
  for (const name in host) GLOBALS[name] = host[name];
  if (!preludeCell && !options.noPrelude) {
    preludeCell = load(PRELUDE, { noPrelude: true });
    for (const name of preludeCell.fieldNames()) { const fieldName = name; Object.defineProperty(GLOBALS, fieldName, { get: () => preludeCell.field(fieldName), enumerable: true, configurable: true }); }
  }
  const { code, shapes, prologue, speedNotes } = compile(src, globalNames());
  const names = Object.keys(RUNTIME);
  const build = new Function(...names, "SHAPES", prologue + "\nreturn " + code + "\n//# sourceURL=sprout.js");
  const cell = build(...names.map(name => RUNTIME[name]), shapes);
  cell.js = code; cell.speedNotes = speedNotes;
  return cell;
}

const api = { tokenize, parse, compile, load, format: formatValue, equal: valuesEqual, merge, isCell, Cell, ValueCell, Native, globals: GLOBALS, BANG, ANY, SproutError, PRELUDE,
  // fast paths on or off: columns (decision 82) and whatever libraries add; the answers are the same either way
  ColumnCell, NumberList, fastPaths: on => { COLUMN_MIN_LENGTH = on ? 32 : Infinity; fastPathsOn = !!on; },
  // libraries: what they can see of the core, and how they plug in (decision 96)
  install, internals: null,
  setLog: f => { logMessage = f; }, setOut: f => { printOutput = f; }, setRandom: f => { randomSource = f; }, defNative, partsOf, fieldsOf, UNSET, valueCellOf, effect, queueEffects, runEffects, dropEffects };
// what a library sees of the core: the pieces a faster way needs, nothing it could change answers with
api.internals = { FUSED_OPERATORS, LAZY_OPERATORS, EVERY_VALUE_METHODS, GLOBALS, Native, noiseHash, formatValue, isFieldsOnly, mentions, COMPILER_NOTE_KEYS, RangeCell, NumberList, ColumnCell, ValueCell, makeList, NO_FIELDS, shapeFor, asColumns, Cell, EMPTY, collect, isCell,
  fast: () => fastPathsOn };
if (typeof module !== "undefined") {
  module.exports = api;
  // in Node the kernels library comes along; a page loads kernels.js after this file
  // (SPROUT3_CORE_ONLY=1 runs without it, to check the core alone gives the same answers)
  if (!process.env.SPROUT3_CORE_ONLY) try { require("./kernels.js"); } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }
} else root.Sprout3 = api;
})(typeof window !== "undefined" ? window : globalThis);
