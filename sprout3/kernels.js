// Sprout 3 kernels: the library that makes Sprout fast (decision 96). The core (sprout3.js) runs every program
// on its own; this only finds faster ways to get the same answers.
//   - the work-ahead pass (WorkAhead): a cell worked out as far as it can be without its input, down to number maths
//   - loop fusion: a run of collect, keep, fold, each and length in a chain, as one loop (decision 95)
//   - spork kernels: a pure cell run for every input at once, on WebAssembly SIMD or in JavaScript (decision 91)
//   - a radix sort for numbers (decision 92)
(function (root) {
"use strict";
const core = typeof module !== "undefined" ? require("./sprout3.js") : root.Sprout3;
const internals = core.internals;
const { FUSED_OPERATORS, LAZY_OPERATORS, EVERY_VALUE_METHODS, GLOBALS, Native, noiseHash, formatValue, isFieldsOnly, mentions, COMPILER_NOTE_KEYS, RangeCell, NumberList, ColumnCell, ValueCell, makeList, NO_FIELDS, shapeFor, asColumns, Cell, EMPTY, isCell } = internals;

// ===================================================================== spork kernels (decision 47, step 3 of decision 79)
// A cell given to spork is worked out once, when the program loads, as far as it can be without its input:
// calls are inlined; lists, records, words and loops laidOver them are unrolled; a test that changes from run to run
// becomes a choice made in each run. What is left is number maths on the input, a flat list of steps (the IR),
// which runs as one tight loop: in JavaScript, in WebAssembly SIMD, or on the GPU.
// If anything can't be worked out this way (a host word, a random read, keep with a test that changes from run
// to run), there is no kernel and spork is collect, so a program can't tell which way it ran.
const GIVE_UP = { spork: "no" };
const STILL_WORKING_OUT = {};
const NUMBER_STEPS_OF_TWO = { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b, mod: (a, b) => ((a % b) + b) % b,
  min: (a, b) => Math.min(a, b), max: (a, b) => Math.max(a, b), noise: (a, b) => noiseHash(a, b) };
const NUMBER_STEPS_OF_ONE = { neg: a => -a, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log };
const COMPARISON_STEPS = { lt: (a, b) => a < b, gt: (a, b) => a > b, le: (a, b) => a <= b, ge: (a, b) => a >= b, eq: (a, b) => a === b, ne: (a, b) => a !== b };
const TRUTH_STEPS = { and: (a, b) => a && b, or: (a, b) => a || b, boolEquals: (a, b) => a === b };
// these give the same answer in JavaScript and WebAssembly only if done by JavaScript itself
const JAVASCRIPT_ONLY_STEPS = new Set(["mod", "sin", "cos", "tan", "log"]);
const OPERATOR_STEPS = { "+": "add", "-": "sub", "*": "mul", "/": "div", "%": "mod", "<": "lt", ">": "gt", "<=": "le", ">=": "ge" };
const INLINED_BUILTINS = new Set(["range", "noise"]);
const LIST_METHOD_TAKES_ARGUMENT = { "@": 1, length: 0, first: 0, last: 0, collect: 1, keep: 1, each: 1, fold: 1, spork: 1 };
const numberLiteral = v => Object.is(v, -0) ? "-0" : String(v);
// the prelude's bindings by name, so its cells (clamp, cond, match...) can be inlined like any other
let preludeBindings = null;
const prelude = () => preludeBindings || (preludeBindings = new Map(core.parse(core.PRELUDE).filter(it => it.type === "bind").map(it => [it.name, it])));

class WorkAhead {
  constructor(g) {
    this.gen = g; this.nodes = []; this.nodeIndex = new Map(); this.outsideReads = []; this.outsideReadIndex = new Map();
    this.hostCalls = null; this.hostWordsUsed = new Set();
    // names from outside are worked out on a budget: the ones worth it are small tables, a few hundred steps each
    this.outsideValues = new Map(); this.stepsTaken = 0; this.stepLimit = 400000; this.callDepth = 0; this.outsideBudget = 10000; this.reason = null; this.checks = []; this.javascriptOnly = false;
    this.pathCondition = null; this.TRUE = this.constantBool(true); this.FALSE = this.constantBool(false); this.pathCondition = this.TRUE;
  }
  giveUp(why) { if (!this.reason) this.reason = why; throw GIVE_UP; }
  countStep() { if (++this.stepsTaken > this.stepLimit) this.giveUp("it takes too many steps to work out"); }

  // ---- IR nodes: [op, first, second, third, literal], the inputs being earlier nodes (or -1). Equal nodes are shared, and steps on constants are worked out now.
  addNode(op, first, second, third, literal) {
    const nodes = this.nodes, isConstant = i => nodes[i][0] === "constant" || nodes[i][0] === "constantBool", constantAt = i => nodes[i][4];
    if (NUMBER_STEPS_OF_TWO[op] && isConstant(first) && isConstant(second)) return this.addNode("constant", -1, -1, -1, NUMBER_STEPS_OF_TWO[op](constantAt(first), constantAt(second)));
    if (NUMBER_STEPS_OF_ONE[op] && isConstant(first)) return this.addNode("constant", -1, -1, -1, NUMBER_STEPS_OF_ONE[op](constantAt(first)));
    if ((COMPARISON_STEPS[op] || TRUTH_STEPS[op]) && isConstant(first) && isConstant(second)) return this.addNode("constantBool", -1, -1, -1, (COMPARISON_STEPS[op] || TRUTH_STEPS[op])(constantAt(first), constantAt(second)));
    if (op === "not" && isConstant(first)) return this.addNode("constantBool", -1, -1, -1, !constantAt(first));
    if (op === "boolEquals" && isConstant(second)) return constantAt(second) ? first : this.addNode("not", first);
    if (op === "boolEquals" && isConstant(first)) return constantAt(first) ? second : this.addNode("not", second);
    if ((NUMBER_STEPS_OF_TWO[op] || COMPARISON_STEPS[op] || NUMBER_STEPS_OF_ONE[op]) && op !== "noise") {
      const firstChoices = this.constantChoiceSize(first), secondChoices = NUMBER_STEPS_OF_ONE[op] ? 0 : this.constantChoiceSize(second);
      if (firstChoices && (NUMBER_STEPS_OF_ONE[op] || secondChoices) && (nodes[first][0] === "choose" || (!NUMBER_STEPS_OF_ONE[op] && nodes[second][0] === "choose")) && firstChoices * (secondChoices || 1) <= 16) {
        const [choice, other] = nodes[first][0] === "choose" ? [first, second] : [second, first], [, test, ifTrue, ifFalse] = nodes[choice];
        const on = (each) => NUMBER_STEPS_OF_ONE[op] ? this.addNode(op, each) : choice === first ? this.addNode(op, each, other) : this.addNode(op, other, each);
        return this.addNode("choose", test, on(ifTrue), on(ifFalse));
      }
    }
    if (op === "choose") { if (isConstant(first)) return constantAt(first) ? second : third; if (second === third) return second; }
    if (op === "and") { if (isConstant(first)) return constantAt(first) ? second : first; if (isConstant(second)) return constantAt(second) ? first : second; if (first === second) return first; }
    if (op === "or") { if (isConstant(first)) return constantAt(first) ? first : second; if (isConstant(second)) return constantAt(second) ? second : first; if (first === second) return first; }
    const key = op + "," + first + "," + second + "," + third + "," + (literal === undefined ? "" : typeof literal === "number" ? numberLiteral(literal) : literal);
    let id = this.nodeIndex.get(key);
    if (id !== undefined) return id;
    id = nodes.length; nodes.push([op, first, second, third, literal]); this.nodeIndex.set(key, id);
    if (JAVASCRIPT_ONLY_STEPS.has(op)) this.javascriptOnly = true;
    if (nodes.length > 60000) this.giveUp("it is too big to run as one kernel");
    return id;
  }
  // how many constants a step is a choice between (a constant is 1), or 0 if it isn't a choice between constants
  constantChoiceSize(i) {
    const n = this.nodes[i];
    if (n[0] === "constant" || n[0] === "constantBool") return 1;
    if (n[0] !== "choose") return 0;
    const l = this.constantChoiceSize(n[2]), r = l && this.constantChoiceSize(n[3]);
    return l && r ? l + r : 0;
  }
  numberValue(id) { return { kind: "number", id }; }
  boolValue(id) { return { kind: "bool", id }; }
  constantNumber(v) { return this.numberValue(this.addNode("constant", -1, -1, -1, v)); }
  constantBool(v) { return this.boolValue(this.addNode("constantBool", -1, -1, -1, !!v)); }
  isConstantNumber(p) { return p.kind === "number" && this.nodes[p.id][0] === "constant"; }
  isConstantBool(p) { return p.kind === "bool" && this.nodes[p.id][0] === "constantBool"; }
  constantOf(p) { return this.nodes[p.id][4]; }
  isFalse(p) { return this.isConstantBool(p) && this.constantOf(p) === false; }
  cellOfValues(parts, keys, values) { return { kind: "cell", parts, keys: keys || [], values: values || [] }; }
  not(p) { return this.boolValue(this.addNode("not", p.id)); }
  and(a, b) { return this.boolValue(this.addNode("and", a.id, b.id)); }
  or(a, b) { return this.boolValue(this.addNode("or", a.id, b.id)); }
  // a check that must hold in every run, or the whole spork runs the ordinary way; it only counts where the program gets to it
  addCheck(holds) { const check = this.or(this.not(this.pathCondition), holds); if (!this.isConstantBool(check) || !this.constantOf(check)) this.checks.push(check.id); }
  underCondition(test, work) { const outer = this.pathCondition; this.pathCondition = this.and(outer, test); try { return work(); } finally { this.pathCondition = outer; } }

  // ---- names: the kernel's own, then the frames the compiler knows, then the built-ins
  isName(name, scope) {
    for (let level = scope; level; level = level.parent) {
      if (level.locals) { if (level.locals.has(name)) return true; continue; }
      if (level.prelude) return prelude().has(name) || this.gen.globals.has(name);
      return !!this.findInFrames(name, level.frameIndex, level.positionLimit) || this.gen.globals.has(name);
    }
    return false;
  }
  lookUp(name, scope) {
    for (let level = scope; level; level = level.parent) {
      if (level.locals) { if (level.locals.has(name)) return level.locals.get(name); continue; }
      return level.prelude ? this.fromOutside(name, -1, Infinity) : this.fromOutside(name, level.frameIndex, level.positionLimit);
    }
    this.giveUp("it uses " + name);
  }
  // a prelude cell: a cell that takes input is inlined where it is called; anything else is worked out now
  fromPrelude(name) {
    const key = "\u0001" + name;
    if (this.outsideValues.has(key)) { const v = this.outsideValues.get(key); if (v === STILL_WORKING_OUT) this.giveUp("it uses " + name + " inside its own definition"); return v; }
    const binding = prelude().get(name), terms = binding.value.terms, scope = { prelude: true };
    this.outsideValues.set(key, STILL_WORKING_OUT);
    const v = terms.length === 1 && terms[0].type === "cell" ? this.cellValue(terms[0], scope) : this.chain(binding.value, scope);
    this.outsideValues.set(key, v);
    return v;
  }
  findInFrames(name, frameIndex, positionLimit) {
    for (let frame = frameIndex; frame >= 0; frame--) {
      const names = this.gen.frames[frame].names, entry = names.get(name);
      if (!entry) continue;
      if (frame === frameIndex && positionLimit !== Infinity && positionAmongNames(names, name) >= positionLimit) continue;
      return { entry: entry, frameIndex: frame };
    }
    return null;
  }
  fromOutside(name, frameIndex, positionLimit) {
    const found = this.findInFrames(name, frameIndex, positionLimit);
    if (found) {
      const key = found.frameIndex + "\u0000" + name;
      if (this.outsideValues.has(key)) { const value = this.outsideValues.get(key); if (value === STILL_WORKING_OUT) this.giveUp("it uses " + name + " inside its own definition"); return value; }
      const position = positionAmongNames(this.gen.frames[found.frameIndex].names, name), entry = found.entry;
      let value = null;
      if (entry.ast && entry.ast.names.length) value = { kind: "function", ast: entry.ast, scope: { frameIndex: found.frameIndex, positionLimit: position + 1 } };
      else if ((entry.ast || entry.value) && !couldNotWorkOut(this.gen, found.frameIndex, name) && this.outsideBudget > 0) {
        // a name bound outside: worked out again here (it is pure, so the value is the same), or else read as a number when spork runs
        this.outsideValues.set(key, STILL_WORKING_OUT);
        const why = this.reason, pc = this.pathCondition, caps = this.outsideReads.length, seen = new Set(this.outsideValues.keys()), cap0 = this.stepLimit;
        this.pathCondition = this.TRUE;
        // a name from outside gets a small budget of its own: past it, it is read as a number when the loop runs
        const s0 = this.stepsTaken;
        this.stepLimit = Math.min(cap0, this.stepsTaken + Math.min(2500, this.outsideBudget));
        try { value = entry.ast ? this.cellValue(entry.ast, { frameIndex: found.frameIndex, positionLimit: position + 1 }) : this.chain(entry.value, { frameIndex: found.frameIndex, positionLimit: position }); }
        catch (e) {
          if (e !== GIVE_UP) throw e;
          // a failed try leaves nothing behind: no outside reads it made, no names it worked out
          this.reason = why; value = null; couldNotWorkOut(this.gen, found.frameIndex, name, true);
          for (const c of this.outsideReads.splice(caps)) this.outsideReadIndex.delete(c);
          for (const k of [...this.outsideValues.keys()]) if (!seen.has(k)) this.outsideValues.delete(k);
          this.outsideValues.set(key, STILL_WORKING_OUT);
        }
        this.stepLimit = cap0; this.pathCondition = pc; this.outsideBudget -= this.stepsTaken - s0;
      }
      if (!value) value = this.readAtRunTime(this.gen.referenceCode(entry));
      this.outsideValues.set(key, value);
      return value;
    }
    if (prelude().has(name) && (!this.gen.globals.has(name) || (Object.getOwnPropertyDescriptor(GLOBALS, name) || {}).get)) return this.fromPrelude(name);
    if (name === "any") return { kind: "any" };
    if (this.gen.globals.has(name)) {
      const descriptor = Object.getOwnPropertyDescriptor(GLOBALS, name);
      if (!descriptor || descriptor.get) this.giveUp(name === "random" ? "it reads random, which changes from run to run" : "it uses " + name + ", a library cell spork can't work out yet");
      if (descriptor.value instanceof Native) return INLINED_BUILTINS.has(name) ? { kind: "builtin", name: name } : descriptor.value.effect ? { kind: "hostWord", name: name } : this.giveUp(name === "rand" ? "it uses rand, which reads random, which changes from run to run" : "it uses " + name);
      if (typeof descriptor.value === "number") return this.readAtRunTime(this.gen.globalCode(name));
      this.giveUp("it uses " + name);
    }
    this.giveUp("it uses " + name + ", which isn't a name it can see");
  }
  readAtRunTime(code) {
    let index = this.outsideReadIndex.get(code);
    if (index === undefined) { index = this.outsideReads.length; this.outsideReads.push(code); this.outsideReadIndex.set(code, index); }
    return this.numberValue(this.addNode("outside", -1, -1, -1, index));
  }

  // ---- terms, chains and bodies, mirroring Gen.genChain step for step
  term(term, scope) {
    this.countStep();
    switch (term.type) {
      case "num": return this.constantNumber(term.value);
      case "str": return { kind: "text", value: term.value };
      case "tmpl": { let text = ""; for (const part of term.parts) text += typeof part === "string" ? part : this.textNow(this.chain(part.ast, scope)); return { kind: "text", value: text }; }
      case "word":
        if (term.value === "true") return this.TRUE;
        if (term.value === "false") return this.FALSE;
        if (["!", "_", "left", "right"].includes(term.value)) this.giveUp("it uses " + term.value);
        return this.lookUp(term.value, scope);
      case "group": return this.group(term.items, scope);
      case "cell": return this.cellValue(term, scope);
      case "chain": return this.chain(term, scope);
    }
    this.giveUp("it uses something spork can't work out");
  }
  // text made now: only from values that are the same in every run
  textNow(value) {
    if (value.kind === "text") return value.value;
    if (this.isConstantNumber(value) || this.isConstantBool(value)) return formatValue(this.constantOf(value));
    this.giveUp("it puts a value that changes from run to run into text");
  }
  group(items, scope) {
    if (items.length === 1 && items[0].type === "chain") return this.chain(items[0], scope);
    const inner = { locals: new Map(), parent: scope }; let result = this.FALSE;
    for (const item of items) { if (item.type === "bind") { result = this.chain(item.value, inner); inner.locals.set(item.name, result); } else result = this.chain(item, inner); }
    return result;
  }
  cellValue(cell, scope) {
    if (cell.names.length) return { kind: "function", ast: cell, scope };
    if (usesInputWords(cell)) this.giveUp("it uses _ or left");
    const inner = { locals: new Map(), parent: scope }, parts = [], keys = [], values = [];
    for (const item of cell.items) {
      if (item.type === "bind") { const value = this.bindingValue(item, inner); inner.locals.set(item.name, value); keys.push(item.name); values.push(value); }
      else parts.push(this.chain(item, inner));
    }
    return this.cellOfValues(parts, keys, values);
  }
  bindingValue(binding, scope) { const terms = binding.value.terms; return terms.length === 1 && terms[0].type === "cell" ? this.cellValue(terms[0], scope) : this.chain(binding.value, scope); }
  // a cell's body run in order: the last part is what it gives (genRunBody)
  runBody(items, scope) {
    let lastPart = this.FALSE;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === "bind") { scope.locals.set(item.name, this.bindingValue(item, scope)); if (i === items.length - 1) return lastPart; }
      else { const value = this.chain(item, scope); if (i === items.length - 1) return value; lastPart = value; }
    }
    return this.FALSE;
  }
  runBlock(cell, scope) { if (cell.names.length || usesInputWords(cell)) this.giveUp("a branch takes input"); return this.runBody(cell.items, { locals: new Map(), parent: scope }); }
  rightSide(term, scope) { return term.type === "cell" && !term.names.length ? this.runBlock(term, scope) : this.term(term, scope); }

  chain(chain, scope) {
    const terms = chain.terms; if (!terms.length) return this.FALSE;
    let value = this.term(terms[0], scope);
    for (let i = 1; i < terms.length; i++) {
      this.countStep();
      const term = terms[i];
      if (term.type === "word" && (term.value === "!" || term.value === "true" || term.value === "false")) this.giveUp("it sends " + term.value);
      if (term.type === "word") {
        const word = term.value;
        if (FUSED_OPERATORS.has(word) && i + 1 < terms.length && !this.isName(word, scope)) {
          const nextTerm = terms[++i];
          if ((word === "with" || word === "..") && nextTerm.type === "cell" && isFieldsOnly(nextTerm)) { value = this.withFields(value, nextTerm, scope); continue; }
          value = this.operator(word, value, this.term(nextTerm, scope)); continue;
        }
        if (LAZY_OPERATORS.has(word) && i + 1 < terms.length && !this.isName(word, scope)) { const elseTerm = terms[++i]; value = this.lazyOperator(word, value, () => this.rightSide(elseTerm, scope)); continue; }
        const quiet = terms[i + 1] && terms[i + 1].type === "word" && terms[i + 1].value === "else" && terms[i + 2] && !this.isName("else", scope);
        value = this.wordAfter(value, word, scope, quiet); continue;
      }
      if (term.type === "cell" && !term.names.length) {
        const elsePat = terms[i + 1] && terms[i + 1].type === "word" && terms[i + 1].value === "else" && terms[i + 2] && !this.isName("else", scope);
        if (value.kind === "bool") {
          // a boolean runs the block (decision 62); else runs when the test is false or the block gives false
          if (elsePat) { const elseTerm = terms[i + 2]; i += 2; value = this.branch(value, () => this.runBlock(term, scope), () => this.rightSide(elseTerm, scope)); }
          else value = this.branch(value, () => this.runBlock(term, scope), null);
          continue;
        }
        // any other value is sent the cell; with else, the else sees what it gave
        const result = this.send(value, this.cellValue(term, scope));
        if (elsePat) { const elseTerm = terms[i + 2]; i += 2; value = this.lazyOperator("else", result, () => this.rightSide(elseTerm, scope)); } else value = result;
        continue;
      }
      value = this.send(value, this.term(term, scope));
    }
    return value;
  }

  branch(test, runThen, runElse) {
    if (this.isConstantBool(test)) {
      if (!this.constantOf(test)) return runElse ? runElse() : this.FALSE;
      const thenValue = runThen();
      if (!runElse || thenValue.kind !== "bool") return thenValue;
      if (this.isConstantBool(thenValue)) return this.constantOf(thenValue) ? thenValue : runElse();
      return this.choose(thenValue, this.TRUE, this.underCondition(this.not(thenValue), runElse));
    }
    // a test that changes from run to run: both sides are worked out, and each run picks one
    const thenValue = this.underCondition(test, runThen);
    if (!runElse) { if (thenValue.kind === "bool") return this.and(test, thenValue); this.giveUp("a test without else gives false in some runs and a value in others"); }
    const pick = thenValue.kind === "bool" ? this.and(test, thenValue) : test;
    const elseValue = this.underCondition(this.not(pick), runElse);
    return this.choose(pick, thenValue.kind === "bool" ? this.TRUE : thenValue, elseValue);
  }
  choose(test, ifTrue, ifFalse) {
    if (this.isConstantBool(test)) return this.constantOf(test) ? ifTrue : ifFalse;
    if (this.sameValue(ifTrue, ifFalse)) return ifTrue;
    if (ifTrue.kind === "number" && ifFalse.kind === "number") return this.numberValue(this.addNode("choose", test.id, ifTrue.id, ifFalse.id));
    if (ifTrue.kind === "bool" && ifFalse.kind === "bool") return this.boolValue(this.addNode("choose", test.id, ifTrue.id, ifFalse.id));
    if (ifTrue.kind === "row" && ifFalse.kind === "row" && [...ifTrue.laidOver.keys()].join("\u0000") === [...ifFalse.laidOver.keys()].join("\u0000"))
      return { kind: "row", laidOver: new Map([...ifTrue.laidOver].map(([k, part]) => [k, this.choose(test, part, ifFalse.laidOver.get(k))])) };
    if (ifTrue.kind === "cell" && ifFalse.kind === "cell" && ifTrue.parts.length === ifFalse.parts.length && ifTrue.keys.join("\u0000") === ifFalse.keys.join("\u0000"))
      return this.cellOfValues(ifTrue.parts.map((part, j) => this.choose(test, part, ifFalse.parts[j])), ifTrue.keys, ifTrue.values.map((part, j) => this.choose(test, part, ifFalse.values[j])));
    this.giveUp("a test picks between different kinds of value from run to run");
  }
  sameValue(x, y) {
    if (x === y) return true;
    if (x.kind !== y.kind) return false;
    if (x.kind === "number" || x.kind === "bool") return x.id === y.id;
    if (x.kind === "text") return x.value === y.value;
    if (x.kind === "function") return x.ast === y.ast && x.scope === y.scope;
    if (x.kind === "builtin") return x.name === y.name;
    if (x.kind === "any") return true;
    if (x.kind === "row") return x.laidOver.size === y.laidOver.size && [...x.laidOver].every(([k, p]) => y.laidOver.has(k) && this.sameValue(p, y.laidOver.get(k)));
    if (x.kind === "cell") return x.parts.length === y.parts.length && x.keys.join("\u0000") === y.keys.join("\u0000") &&
      x.parts.every((p, j) => this.sameValue(p, y.parts[j])) && x.values.every((p, j) => this.sameValue(p, y.values[j]));
    return false;
  }
  lazyOperator(word, left, getRight) {
    if (word === "else") {
      if (this.isFalse(left)) return getRight();
      if (left.kind !== "bool" || this.isConstantBool(left)) return left;
      return this.choose(left, this.TRUE, this.underCondition(this.not(left), getRight));
    }
    if (left.kind !== "bool") this.giveUp("its " + word + " isn't after a test");
    const rightRuns = word === "and" ? left : this.not(left);
    if (this.isConstantBool(rightRuns) && !this.constantOf(rightRuns)) return left;
    const right = this.underCondition(rightRuns, getRight);
    if (right.kind !== "bool") this.giveUp("its " + word + " isn't between two tests");
    return this.isConstantBool(left) ? right : this.boolValue(this.addNode(word, left.id, right.id));
  }

  operator(word, left, right) {
    if (OPERATOR_STEPS[word]) {
      if (left.kind === "number" && right.kind === "number") { const step = OPERATOR_STEPS[word]; return COMPARISON_STEPS[step] ? this.boolValue(this.addNode(step, left.id, right.id)) : this.numberValue(this.addNode(step, left.id, right.id)); }
      if (left.kind === "text" && right.kind === "text" && (word === "<" || word === ">")) return this.constantBool(word === "<" ? left.value < right.value : left.value > right.value);
      this.giveUp("it does " + word + " on something that isn't a number");
    }
    if (word === "=" || word === "!=") { const e = this.equal(left, right); return word === "=" ? e : this.not(e); }
    if (word === "@") return this.partAt(left, right);
    // .. and with
    if (left.kind === "text" && word === "..") return { kind: "text", value: left.value + this.textNow(right) };
    if (left.kind === "cell" && right.kind === "cell" && !left.keys.includes(word)) return this.merge(left, right);
    if ((left.kind === "text" || this.isConstantNumber(left)) && word === "with") return { kind: "text", value: this.textNow(left) + this.textNow(right) };
    if (this.isConstantNumber(left) && word === "..") return { kind: "text", value: this.textNow(left) + this.textNow(right) };
    this.giveUp("it uses " + word + " on values spork can't join");
  }
  merge(a, b) {
    const keys = a.keys.slice(), values = a.values.slice();
    b.keys.forEach((k, j) => { const i = keys.indexOf(k); if (i < 0) { keys.push(k); values.push(b.values[j]); } else values[i] = b.values[j]; });
    return this.cellOfValues(b.parts.length ? a.parts.concat(b.parts) : a.parts, keys, values);
  }
  withFields(record, fieldsCell, scope) {
    const values = fieldsCell.items.map(field => this.chain(field.value, scope));
    if (record.kind === "row") { const laidOver = new Map(record.laidOver); fieldsCell.items.forEach((field, j) => laidOver.set(field.name, values[j])); return { kind: "row", laidOver }; }
    if (record.kind !== "cell" || record.keys.includes("with")) this.giveUp("it uses with on something that isn't a record");
    return this.merge(record, this.cellOfValues([], fieldsCell.items.map(field => field.name), values));
  }
  equal(a, b) {
    // any is equal only to itself (it is how match and cond write their last case)
    if (a.kind === "any" || b.kind === "any") return this.constantBool(a.kind === b.kind);
    if (a.kind === "number" && b.kind === "number") return this.boolValue(this.addNode("eq", a.id, b.id));
    if (a.kind === "bool" && b.kind === "bool") return this.boolValue(this.addNode("boolEquals", a.id, b.id));
    if (a.kind === "text" && b.kind === "text") return this.constantBool(a.value === b.value);
    const plain = p => p.kind === "number" || p.kind === "bool" || p.kind === "text";
    if (plain(a) && plain(b)) return this.FALSE;
    if (a.kind === "cell" && b.kind === "cell") {
      if (a.keys.includes("=")) this.giveUp("it compares with a cell's own =");
      if (a.parts.length !== b.parts.length || a.keys.length !== b.keys.length) return this.FALSE;
      let r = this.TRUE;
      a.parts.forEach((p, j) => { r = this.and(r, this.equal(p, b.parts[j])); });
      for (let j = 0; j < a.keys.length; j++) { const i = b.keys.indexOf(a.keys[j]); if (i < 0) return this.FALSE; r = this.and(r, this.equal(a.values[j], b.values[i])); }
      return r;
    }
    if ((plain(a) && b.kind === "cell") || (a.kind === "cell" && plain(b))) return this.FALSE;
    this.giveUp("it compares cells that take input");
  }
  partAt(list, position) {
    if (list.kind === "cell") {
      const workAhead = list.parts;
      if (this.isConstantNumber(position)) { const part = workAhead[this.constantOf(position) - 1]; return part === undefined ? this.FALSE : part; }
      // a choice between constant positions: a choice between those parts
      if (position.kind === "number" && this.nodes[position.id][0] === "choose" && this.constantChoiceSize(position.id)) { const [, c, l, picked] = this.nodes[position.id]; return this.choose(this.boolValue(c), this.partAt(list, this.numberValue(l)), this.partAt(list, this.numberValue(picked))); }
      if (position.kind !== "number" || !workAhead.length || workAhead.length > 256) this.giveUp("it picks from a list with a position that isn't a number");
      // a position that changes from run to run: it must be a whole number inside the list, or spork runs the ordinary way
      const length = this.constantNumber(workAhead.length), one = this.constantNumber(1);
      this.addCheck(this.and(this.and(this.boolValue(this.addNode("ge", position.id, one.id)), this.boolValue(this.addNode("le", position.id, length.id))), this.boolValue(this.addNode("eq", this.addNode("floor", position.id), position.id))));
      let picked = workAhead[workAhead.length - 1];
      for (let j = workAhead.length - 2; j >= 0; j--) picked = this.choose(this.boolValue(this.addNode("eq", position.id, this.constantNumber(j + 1).id)), workAhead[j], picked);
      return picked;
    }
    if (list.kind === "text" && this.isConstantNumber(position)) { const n = this.constantOf(position), s = list.value; return n >= 1 && n <= s.length ? { kind: "text", value: s[n - 1] } : this.FALSE; }
    this.giveUp("it uses @ on something that isn't a list");
  }

  // a word after a value: a field, then a built-in method, then a name in scope sent as the argument (SW)
  wordAfter(receiver, word, scope, quiet) {
    if (receiver.kind === "row") {
      // a field of an item from a list in columns: the column, unless with laid a new value laidOver it
      if (word in LIST_METHOD_TAKES_ARGUMENT || word in EVERY_VALUE_METHODS) this.giveUp("it uses " + word + " on a record from the list");
      if (this.isName(word, scope)) this.giveUp("it reads " + word + ", which is both a field and a name in scope");
      return receiver.laidOver.has(word) ? receiver.laidOver.get(word) : this.numberValue(this.addNode("column", -1, -1, -1, word));
    }
    if (receiver.kind === "cell") {
      const index = receiver.keys.indexOf(word);
      if (index >= 0) {
        if (this.isName(word, scope)) this.giveUp("it reads " + word + ", which is both a field and a name in scope");
        const field = receiver.values[index]; if (field.kind === "function" && usesInputWords(field.ast)) this.giveUp("a field uses left"); return field;
      }
      if (word in LIST_METHOD_TAKES_ARGUMENT) {
        if (LIST_METHOD_TAKES_ARGUMENT[word]) return { kind: "waiting", method: word, left: receiver };
        const workAhead = receiver.parts;
        if (word === "length") return this.constantNumber(workAhead.length);
        if (word === "first") return workAhead.length ? workAhead[0] : this.FALSE;
        return workAhead.length ? workAhead[workAhead.length - 1] : this.FALSE;
      }
    } else if (receiver.kind === "number") {
      if (NUMBER_STEPS_OF_ONE[word]) return this.numberValue(this.addNode(word, receiver.id));
      if (word === "min" || word === "max") return { kind: "waiting", method: word, left: receiver };
      if (word === "times") this.giveUp("it uses times");
    } else if (receiver.kind === "bool") {
      if (word === "not") return this.not(receiver);
    } else if (receiver.kind === "text") {
      if (word === "length") return this.constantNumber(receiver.value.length);
      if (word === "upper") return { kind: "text", value: receiver.value.toUpperCase() };
      if (word === "lower") return { kind: "text", value: receiver.value.toLowerCase() };
    } else if (receiver.kind === "function" || receiver.kind === "builtin") {
      if (receiver.kind === "function" && receiver.ast.items.some(x => x.type === "bind" && x.name === word)) this.giveUp("it reads a field of a cell that takes input");
      if (word in LIST_METHOD_TAKES_ARGUMENT) this.giveUp("it uses " + word + " on a cell that takes input");
    }
    if (word === "str") return { kind: "text", value: this.textNow(receiver) };
    if (word in EVERY_VALUE_METHODS) this.giveUp("it uses " + word + " there");
    if (this.isName(word, scope)) return this.send(receiver, this.lookUp(word, scope));
    if (quiet) return this.FALSE;
    this.giveUp("it reads " + word + ", which isn't there");
  }
  // a host word (circle, beep...) inside a fused each: done in each item's turn, when the tests leading to it hold
  hostCall(name, argument) {
    const args = argument.kind === "cell" && !argument.keys.length ? argument.parts : [argument];
    for (const value of args) if (value.kind !== "number" && value.kind !== "bool" && value.kind !== "text") this.giveUp("the host word " + name + " is given something that isn't a number or a word");
    this.hostCalls.push({ host: name, single: argument.kind !== "cell", args, cond: this.pathCondition });
    this.hostWordsUsed.add(name);
    // what the host word gives back, as when it runs: print gives its value, the others false (so an else after one runs too, decision 74)
    return name === "print" ? argument : this.FALSE;
  }
  send(receiver, argument) {
    if (receiver.kind === "function") {
      if (argument.kind === "text" && receiver.ast.items.some(x => x.type === "bind" && x.name === argument.value)) this.giveUp("it reads a field by name");
      return this.call(receiver, argument);
    }
    if (receiver.kind === "builtin") return this.builtin(receiver.name, argument);
    if (receiver.kind === "hostWord") { if (!this.hostCalls) this.giveUp("it uses the host word " + receiver.name); return this.hostCall(receiver.name, argument); }
    if (receiver.kind === "waiting") return this.listMethod(receiver.method, receiver.left, argument);
    this.giveUp(receiver.kind === "number" ? "it sends a value to a number" : "it sends a value to something that isn't a cell");
  }
  call(cell, argument) {
    const literal = cell.ast, nameCount = literal.names.length;
    if (usesInputWords(literal)) this.giveUp("it calls a cell that uses _ or left");
    if (++this.callDepth > 300) this.giveUp("it calls itself too deeply to work out");
    const vars = new Map();
    if (nameCount === 1) vars.set(literal.names[0].name, argument);
    else {
      // several names: by position, then by name (decision 15); a missing one with no default would be false, with a lint
      if (argument.kind !== "cell" || argument.parts.length > nameCount) this.giveUp("it gives a cell the wrong number of values");
      literal.names.forEach((input, j) => {
        let value = j < argument.parts.length ? argument.parts[j] : undefined;
        const fieldPosition = argument.keys.indexOf(input.name); if (fieldPosition >= 0) value = argument.values[fieldPosition];
        if (value === undefined) { if (!input.defaultValue) this.giveUp("it leaves out " + input.name); value = this.term(input.defaultValue, cell.scope); }
        vars.set(input.name, value);
      });
    }
    const result = this.runBody(literal.items, { locals: vars, parent: cell.scope });
    this.callDepth--;
    return result;
  }
  applyToItem(cell, item) { if (cell.kind === "function") { if (!cell.ast.names.length) this.giveUp("it collects with a cell that has no inputs"); return this.call(cell, item); } return this.send(cell, item); }
  listMethod(method, left, argument) {
    if (method === "min" || method === "max") { if (argument.kind !== "number") this.giveUp("its " + method + " isn't given a number"); return this.numberValue(this.addNode(method, left.id, argument.id)); }
    const workAhead = left.parts;
    if (method === "@") return this.partAt(left, argument);
    if (method === "collect" || method === "spork") return this.cellOfValues(workAhead.map(part => this.applyToItem(argument, part)));
    if (method === "keep") {
      const kept = [];
      for (const part of workAhead) {
        const answer = this.applyToItem(argument, part);
        if (!this.isConstantBool(answer)) this.giveUp(answer.kind === "bool" ? "keep's test changes from run to run" : "keep's test doesn't give true or false");
        if (this.constantOf(answer)) kept.push(part);
      }
      return this.cellOfValues(kept);
    }
    if (method === "fold") {
      if (argument.kind !== "cell") this.giveUp("fold isn't given [start, cell]");
      let total = argument.parts[0] || this.FALSE; const cell = argument.parts[1] || this.FALSE;
      for (const part of workAhead) total = cell.kind === "function" && cell.ast.names.length === 2 ? this.call(cell, this.cellOfValues([total, part])) : this.applyToItem(cell, this.cellOfValues([total, part]));
      return total;
    }
    this.giveUp("it uses " + method + " inside spork");
  }
  builtin(name, argument) {
    const part = k => argument.kind === "cell" ? (argument.parts[k] || this.FALSE) : k === 0 ? argument : this.FALSE;
    const nums = k => { const o = []; for (let j = 0; j < k; j++) { const first = part(j); if (first.kind !== "number") this.giveUp(name + " isn't given numbers"); o.push(first); } return o; };
    if (name === "range") {
      if (!this.isConstantNumber(argument)) this.giveUp("range is given a count that changes from run to run");
      const count = Math.max(0, Math.floor(this.constantOf(argument)));
      if (count > 100000) this.giveUp("it unrolls a range that is too long");
      const workAhead = new Array(count); for (let j = 0; j < count; j++) workAhead[j] = this.constantNumber(j + 1);
      return this.cellOfValues(workAhead);
    }
    const [first, second] = nums(2);   // noise
    return this.numberValue(this.addNode("noise", first.id, second.id));
  }

  // ---- the whole cell: [x | ...] whose runs each give a number, true or false, or a record of numbers
  buildSporkKernel(cell) {
    if (cell.names.length !== 1 || cell.names[0].defaultValue) this.giveUp("spork runs as a kernel only for a cell with one named input");
    if (usesInputWords(cell)) this.giveUp("it uses _ or left");
    const input = this.numberValue(this.addNode("input", -1, -1, -1));
    const result = this.runBody(cell.items, { locals: new Map([[cell.names[0].name, input]]), parent: { frameIndex: this.gen.frames.length - 1, positionLimit: Infinity } });
    let kind, outs, keys = null;
    if (result.kind === "number") { kind = "numbers"; outs = [result.id]; }
    else if (result.kind === "bool") { kind = "bools"; outs = [result.id]; }
    else if (result.kind === "cell" && !result.parts.length && result.keys.length && result.values.every(p => p.kind === "number")) { kind = "records"; keys = result.keys; outs = result.values.map(p => p.id); }
    else this.giveUp("each run gives something other than a number, true or false, or a record of numbers");
    return this.emitKernel(kind, outs, keys);
  }
  // ---- loop fusion (decision 95): xs collect f keep g ... fold [start, h] (or length), as one loop laidOver the items.
  // item is "numbers" (range, a list of numbers) or "rows" (a list of records of numbers, in columns).
  buildFusedLoop(stages, item) {
    // one item's work: a body that takes more than this to work out isn't worth a fused loop (spork's cells get more)
    this.reason = null; this.stepsTaken = 0; this.callDepth = 0; this.stepLimit = 20000;
    const scope = { frameIndex: this.gen.frames.length - 1, positionLimit: Infinity };
    let current = item === "numbers" ? this.numberValue(this.addNode("input", -1, -1, -1)) : { kind: "row", laidOver: new Map() }, passes = this.TRUE;
    const fn = stage => { const cell = this.term(stage.argument, scope); if (cell.kind !== "function" && cell.kind !== "builtin") this.giveUp(stage.word + " isn't given a cell"); return cell; };
    for (const stage of stages) {
      if (stage.word === "collect") { const cell = fn(stage); this.pathCondition = passes; current = this.applyToItem(cell, current); }
      else if (stage.word === "each") {
        // host words called for each item that passed, in order, each under the tests that lead to it
        const cell = fn(stage); this.pathCondition = passes; this.hostCalls = [];
        try { this.applyToItem(cell, current); } finally { this.pathCondition = this.TRUE; }
        const calls = this.hostCalls; this.hostCalls = null;
        if (!calls.length) this.giveUp("each does nothing here a host word doesn't do");
        return this.emitKernel("each", [passes.id], null, calls);
      }
      else if (stage.word === "keep") {
        const cell = fn(stage); this.pathCondition = passes;
        const test = this.applyToItem(cell, current); if (test.kind !== "bool") this.giveUp("keep's test doesn't give true or false");
        passes = this.and(passes, test);
      } else {
        // fold [start, h], or length: one number carried from item to item, through the items that pass
        let start, next;
        const carried = this.numberValue(this.addNode("carried", -1, -1, -1));
        this.pathCondition = passes;
        if (stage.word === "length") { start = this.constantNumber(0); next = this.numberValue(this.addNode("add", carried.id, this.constantNumber(1).id)); }
        else {
          this.pathCondition = this.TRUE; const startAndCell = this.term(stage.argument, scope); this.pathCondition = passes;
          if (startAndCell.kind !== "cell" || startAndCell.parts.length < 2) this.giveUp("fold isn't given [start, cell]");
          start = startAndCell.parts[0]; const cell = startAndCell.parts[1];
          if (start.kind !== "number") this.giveUp("fold starts from something that isn't a number");
          next = cell.kind === "function" && cell.ast.names.length === 2 ? this.call(cell, this.cellOfValues([carried, current])) : this.applyToItem(cell, this.cellOfValues([carried, current]));
          if (next.kind !== "number") this.giveUp("fold's cell doesn't give a number");
        }
        this.pathCondition = this.TRUE;
        return this.emitKernel("fold", [start.id, this.choose(passes, next, carried).id], null);
      }
    }
    this.pathCondition = this.TRUE;
    if (current.kind === "number") return this.emitKernel("numbers", [passes.id, current.id], null);
    if (current.kind === "bool") return this.emitKernel("bools", [passes.id, current.id], null);
    if (current.kind === "cell" && !current.parts.length && current.keys.length && current.values.every(p => p.kind === "number")) return this.emitKernel("records", [passes.id, ...current.values.map(p => p.id)], current.keys);
    if (current.kind === "row" && [...current.laidOver.values()].every(p => p.kind === "number")) return this.emitKernel("rows", [passes.id, ...[...current.laidOver.values()].map(p => p.id)], [...current.laidOver.keys()]);
    this.giveUp("each item gives something other than a number, true or false, or a record of numbers");
  }
  // keep only the steps the answer needs, numbered afresh, as a JavaScript literal
  emitKernel(kind, outputIds, keys, calls) {
    const nodes = this.nodes, needed = new Uint8Array(nodes.length);
    for (const i of outputIds.concat(this.checks)) needed[i] = 1;
    if (calls) for (const call of calls) { needed[call.cond.id] = 1; for (const a of call.args) if (a.kind !== "text") needed[a.id] = 1; }
    for (let i = nodes.length - 1; i >= 0; i--) if (needed[i]) { const [, a, b, c] = nodes[i]; if (a >= 0) needed[a] = 1; if (b >= 0) needed[b] = 1; if (c >= 0) needed[c] = 1; }
    const newIndex = new Int32Array(nodes.length).fill(-1), lines = []; let jsOnly = false;
    for (let i = 0; i < nodes.length; i++) if (needed[i]) {
      const [op, a, b, c, v] = nodes[i]; newIndex[i] = lines.length;
      if (JAVASCRIPT_ONLY_STEPS.has(op)) jsOnly = true;
      const literalCode = v === undefined ? "" : "," + (typeof v === "number" ? numberLiteral(v) : typeof v === "string" ? JSON.stringify(v) : String(v));
      lines.push("[\"" + op + "\"," + (a >= 0 ? newIndex[a] : -1) + "," + (b >= 0 ? newIndex[b] : -1) + "," + (c >= 0 ? newIndex[c] : -1) + literalCode + "]");
    }
    const checkIds = [...new Set(this.checks)].map(i => newIndex[i]);
    const callsCode = calls ? ",hostCalls:[" + calls.map(call => "{host:" + JSON.stringify(call.host) + ",single:" + call.single + ",cond:" + newIndex[call.cond.id] + ",args:[" +
      call.args.map(a => a.kind === "text" ? JSON.stringify(a.value) : String(newIndex[a.id])).join(",") + "]}").join(",") + "]" : "";
    return "{nodes:[" + lines.join(",") + "],outputs:[" + outputIds.map(i => newIndex[i]).join(",") + "],checks:[" + checkIds.join(",") + "],kind:\"" + kind + "\"" +
      (keys ? ",keys:" + JSON.stringify(keys) : "") + callsCode + ",javascriptOnly:" + jsOnly + "}";
  }
}
// a run of collect, keep and fold steps (each given a cell, or a name), and length at the end, starting at T[i]
const LOOP_STEP_WORDS = new Set(["collect", "keep", "fold", "each"]);
function findLoopRun(terms, start) {
  let at = start; const stages = [];
  while (at + 1 < terms.length && terms[at].type === "word" && LOOP_STEP_WORDS.has(terms[at].value) &&
    (terms[at + 1].type === "cell" || (terms[at + 1].type === "word" && !FUSED_OPERATORS.has(terms[at + 1].value) && !LAZY_OPERATORS.has(terms[at + 1].value) && !(terms[at + 1].value in EVERY_VALUE_METHODS) && !["!", "true", "false", "_", "left", "right"].includes(terms[at + 1].value)))) {
    stages.push({ word: terms[at].value, argument: terms[at + 1], line: terms[at].line }); at += 2;
    if (terms[at - 2].value === "fold" || terms[at - 2].value === "each") break;
  }
  if (stages.length && stages[stages.length - 1].word !== "fold" && stages[stages.length - 1].word !== "each" && at < terms.length && terms[at].type === "word" && terms[at].value === "length") { stages.push({ word: "length", line: terms[at].line }); at++; }
  if (!stages.length) return null;
  return { stages, start: start, end: at };
}
// the first and last line a piece of the tree is on
function lineSpan(n) {
  let lo = Infinity, hi = -Infinity;
  (function walk(x) { if (!x || typeof x !== "object") return; if (typeof x.line === "number" && x.line > 0) { lo = Math.min(lo, x.line); hi = Math.max(hi, x.line); } for (const k in x) if (!COMPILER_NOTE_KEYS.has(k) || k === "line") { const v = x[k]; if (v && typeof v === "object") walk(v); } })(n);
  return [lo, hi];
}
// names from outside that couldn't be worked out ahead, remembered for the rest of the compile (each frame is one object)
function couldNotWorkOut(gen, frameIndex, name, mark) {
  const frame = gen.frames[frameIndex], names = (gen.namesNotWorkedOut || (gen.namesNotWorkedOut = new WeakMap())).get(frame) || new Set();
  if (mark) { names.add(name); gen.namesNotWorkedOut.set(frame, names); }
  return names.has(name);
}
// where a name sits among a frame's names, in the order they were bound
function positionAmongNames(names, n) { let i = 0; for (const k of names.keys()) { if (k === n) return i; i++; } return -1; }
// does a cell (or anything in it) use _ or left?
const INPUT_WORDS = new Set(["_", "left", "right"]);
function usesInputWords(c) { if (c.usesInputWords === undefined) c.usesInputWords = mentions(c, INPUT_WORDS); return c.usesInputWords; }


// the cells spork is given: by name (spork one-run), or written in place (spork [n | ...]); and each cell bound to a name
function sporkTargets(ast) {
  const names = new Set();
  (function walk(n) {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) { for (const x of n) walk(x); return; }
    if (n.type === "chain") {
      const T = n.terms;
      for (let i = 0; i + 1 < T.length; i++) if (T[i].type === "word" && T[i].value === "spork") { const t = T[i + 1]; if (t.type === "word") names.add(t.value); else if (t.type === "cell") t.sporkArg = true; }
    }
    if (n.type === "bind" && n.value && n.value.terms && n.value.terms.length === 1 && n.value.terms[0].type === "cell") n.value.terms[0].bindName = n.name;
    for (const key in n) if (!COMPILER_NOTE_KEYS.has(key)) walk(n[key]);
  })(ast);
  return names;
}


// ---- spork (decision 47): a parallel collect. A pure cell worked out ahead (decision 91) runs as one numeric kernel,
// on the fastest way this machine has; anything else is collect.
let sporkState = { info: null, wasm: undefined, gpu: null, tally: [] };
const recordSpork = info => { sporkState.info = info; if (sporkState.tally.length < 50) sporkState.tally.push(info); };
function spork(xs, f) {
  if (f instanceof Cell && f.fastForms && f.fastForms.spork) { const r = runSpork(f.fastForms.spork, xs); if (r) return r; }
  const t0 = nowMs(), r = internals.collect(xs, f);
  recordSpork({ n: isCell(xs) ? xs.count() : 0, how: "collect", ms: nowMs() - t0, steps: 0 });
  return r;
}
const nowMs = () => typeof performance !== "undefined" ? performance.now() : Date.now();
function runSpork(s, xs) {
  const kernel = s.kernel;
  let n, inputs = null;
  if (xs instanceof RangeCell) n = xs.size;
  else if (xs instanceof NumberList) { inputs = xs.numbers; n = inputs.length; }
  else if (xs instanceof ValueCell && !(xs instanceof ColumnCell) && xs.fieldShape === NO_FIELDS) {
    const p = xs.parts; n = p.length; inputs = new Float64Array(n);
    for (let i = 0; i < n; i++) { const v = p[i]; if (typeof v !== "number") return null; inputs[i] = v; }
  } else return null;
  if (n === 0) return makeList([]);
  const outsideValues = s.outsideReads();
  for (let i = 0; i < outsideValues.length; i++) if (typeof outsideValues[i] !== "number") return null;
  const t0 = nowMs(); let outputs = null, how = "";
  // the GPU (32-bit maths) only when the host allows it; else WebAssembly SIMD; else JavaScript. The last two give the same answer.
  if (sporkState.gpu && !kernel.javascriptOnly) { outputs = sporkState.gpu(kernel, n, inputs, outsideValues) || null; if (outputs) how = "gpu"; }
  if (sporkState.wasm === undefined) sporkState.wasm = makeWasmRunner();
  if (!outputs && sporkState.wasm && !kernel.javascriptOnly && n >= 16) { outputs = sporkState.wasm(kernel, n, inputs, outsideValues); how = "simd"; if (!outputs) return null; }
  if (!outputs) { outputs = kernel.outputs.map(() => new Float64Array(n)); how = "js"; if (!sporkKernelFunction(kernel)(n, inputs, outsideValues, outputs)) return null; }
  recordSpork({ n, how, ms: how === "gpu" && outputs.ms !== undefined ? outputs.ms : nowMs() - t0, steps: kernel.nodes.length });
  if (kernel.kind === "numbers") return new NumberList(outputs[0]);
  if (kernel.kind === "bools") { const o = new Array(n), a = outputs[0]; for (let i = 0; i < n; i++) o[i] = a[i] !== 0; return makeList(o); }
  return new ColumnCell(shapeFor(kernel.keys), outputs, n);
}
// ---- loop fusion (decision 95): a run of collect, keep, fold and length laidOver range, a list of numbers or a list of
// records of numbers, as one loop with no lists in between. NOT_FUSED means the steps run as written.
const NOT_FUSED = { fuse: "no" };
// hostWords: the host words the loop calls, read when the program loaded, as the steps as written read them
// (each game has its own circle, so looking it up by name now could find another game's)
function runFusedLoop(xs, fusedKernels, caps, hostWords) {
  if (!internals.fast()) return NOT_FUSED;
  let kernel, n, inputs = null, columns = null, recordShape = null;
  if (xs instanceof RangeCell) { kernel = fusedKernels.numbers; n = xs.size; }
  else if (xs instanceof NumberList) { kernel = fusedKernels.numbers; inputs = xs.numbers; n = inputs.length; }
  else if (xs instanceof ColumnCell) { kernel = fusedKernels.rows; columns = xs.columns; recordShape = xs.recordShape; n = xs.size; }
  else if (xs instanceof ValueCell && xs.fieldShape === NO_FIELDS) {
    const p = xs.parts; n = p.length;
    if (!n) return NOT_FUSED;
    if (typeof p[0] === "number") { kernel = fusedKernels.numbers; inputs = new Float64Array(n); for (let i = 0; i < n; i++) { const v = p[i]; if (typeof v !== "number") return NOT_FUSED; inputs[i] = v; } }
    else { const c = asColumns(xs); if (!c) return NOT_FUSED; kernel = fusedKernels.rows; columns = c.columns; recordShape = c.recordShape; n = c.size; }
  } else return NOT_FUSED;
  // a short list is quicker as written
  if (!kernel || n < 16) return NOT_FUSED;
  if (recordShape && kernel.keys && kernel.keys.length && recordShape.index("with") >= 0) return NOT_FUSED;
  const outsideValues = caps ? caps() : EMPTY;
  for (let i = 0; i < outsideValues.length; i++) if (typeof outsideValues[i] !== "number") return NOT_FUSED;
  const f = fusedLoopFunction(kernel);
  if (kernel.kind === "fold") return f(n, inputs, columns, recordShape, outsideValues, null, null);
  if (kernel.kind === "each") {
    const hostCallers = [];
    for (const e of kernel.hostCalls) {
      const h = hostWords && hostWords[e.host], k = e.args.length;
      if (!(h instanceof Native)) return NOT_FUSED;
      hostCallers.push(e.single ? h.fn : h.direct && h.direct.length === k ? h.direct : (...xs) => h.fn(makeList(xs)));
    }
    return f(n, inputs, columns, recordShape, outsideValues, hostCallers, null) === NOT_FUSED ? NOT_FUSED : false;
  }
  const outputs = kernel.outputs.slice(1).map(() => new Float64Array(n)), keptRows = kernel.kind === "rows" ? new Uint32Array(n) : null;
  const m = f(n, inputs, columns, recordShape, outsideValues, outputs, keptRows);
  if (m === NOT_FUSED) return NOT_FUSED;
  // when every item passed, the arrays are already the right length, and unchanged columns can be shared (columns never change)
  const cut = o => m === n ? o : o.slice(0, m);
  if (kernel.kind === "numbers") return new NumberList(cut(outputs[0]));
  if (kernel.kind === "bools") { const o = new Array(m); for (let i = 0; i < m; i++) o[i] = outputs[0][i] !== 0; return makeList(o); }
  if (kernel.kind === "records") return new ColumnCell(shapeFor(kernel.keys), outputs.map(cut), m);
  // records from the list, with any fields laid laidOver by with: unchanged columns are gathered for the items that passed
  let out = recordShape; for (const k of kernel.keys) if (out.index(k) < 0) out = out.add(k);
  const oc = out.keys.map((k, j) => {
    const o = kernel.keys.indexOf(k); if (o >= 0) return cut(outputs[o]);
    const src = columns[j]; if (m === n) return src;
    const g = new Float64Array(m); for (let q = 0; q < m; q++) g[q] = src[keptRows[q]]; return g;
  });
  return new ColumnCell(out, oc, m);
}
function fusedLoopFunction(kernel) {
  if (kernel.compiledFunction) return kernel.compiledFunction;
  const nodes = kernel.nodes, invariant = new Uint8Array(nodes.length), ref = i => "v" + i;
  let beforeLoop = "", loopBody = "";
  for (let i = 0; i < nodes.length; i++) {
    const [op, a, b, c, v] = nodes[i];
    let expression;
    if (op === "carried") expression = "acc";
    else if (op === "column") { beforeLoop += "const c" + i + "=columns[recordShape.index(" + JSON.stringify(v) + ")];if(c" + i + "===undefined)return NOT_FUSED;"; expression = "c" + i + "[i]"; }
    else expression = stepExpression(nodes[i], ref);
    invariant[i] = op !== "input" && op !== "carried" && op !== "column" && (a < 0 || invariant[a]) && (b < 0 || invariant[b]) && (c < 0 || invariant[c]) ? 1 : 0;
    if (invariant[i]) beforeLoop += "const v" + i + "=" + expression + ";"; else loopBody += "const v" + i + "=" + expression + ";";
  }
  const checks = kernel.checks.length ? "if(!(" + kernel.checks.map(ref).join("&&") + "))return NOT_FUSED;" : "";
  let source;
  if (kernel.kind === "fold") source = beforeLoop + "let acc=" + ref(kernel.outputs[0]) + ";" + loopOverItems(loopBody + checks + "acc=" + ref(kernel.outputs[1]) + ";") + "return acc";
  else if (kernel.kind === "each") source = beforeLoop + "const " + kernel.hostCalls.map((expression, j) => "h" + j + "=outputs[" + j + "]").join(",") + ";" + loopOverItems(loopBody + checks +
    "if(" + ref(kernel.outputs[0]) + "){" + kernel.hostCalls.map((expression, j) => "if(" + ref(expression.cond) + ")h" + j + "(" + expression.args.map(a => typeof a === "string" ? JSON.stringify(a) : ref(a)).join(",") + ");").join("") + "}") + "return false";
  else source = beforeLoop + "let m=0;" + (kernel.outputs.length > 1 ? "const " + kernel.outputs.slice(1).map((o, j) => "outputs" + j + "=outputs[" + j + "]").join(",") + ";" : "") + loopOverItems(loopBody + checks + "if(" + ref(kernel.outputs[0]) + "){" +
    kernel.outputs.slice(1).map((o, j) => "outputs" + j + "[m]=" + (kernel.kind === "bools" ? ref(o) + "?1:0" : ref(o)) + ";").join("") + (kernel.kind === "rows" ? "keptRows[m]=i;" : "") + "m++}") + "return m";
  const compiled = new Function("noiseHash", "NOT_FUSED", "n", "inputs", "columns", "recordShape", "outsideValues", "outputs", "keptRows", source);
  return (kernel.compiledFunction = (n, inputs, columns, recordShape, outsideValues, outputs, keptRows) => compiled(noiseHash, NOT_FUSED, n, inputs, columns, recordShape, outsideValues, outputs, keptRows));
}
// the loop laidOver the items, written twice: laidOver a list of numbers (inputs), or laidOver range's own numbers.
// (One loop asking inputs ? inputs[i] : i + 1 each time runs about ten times slower when inputs is null.)
const loopOverItems = body => "if(inputs){for(let i=0;i<n;i++){const item=inputs[i];" + body + "}}else{for(let i=0;i<n;i++){const item=i+1;" + body + "}}";
// one step of a kernel as a JavaScript expression
function stepExpression(node, ref) {
  const [op, a, b, c, v] = node;
  switch (op) {
    case "constant": return numberLiteral(v); case "constantBool": return String(v);
    case "input": return "item"; case "outside": return "outsideValues[" + v + "]";
    case "add": return ref(a) + "+" + ref(b); case "sub": return ref(a) + "-" + ref(b);
    case "mul": return ref(a) + "*" + ref(b); case "div": return ref(a) + "/" + ref(b);
    case "mod": return "((" + ref(a) + "%" + ref(b) + ")+" + ref(b) + ")%" + ref(b);
    case "min": case "max": return "Math." + op + "(" + ref(a) + "," + ref(b) + ")";
    case "noise": return "noiseHash(" + ref(a) + "," + ref(b) + ")";
    case "neg": return "-" + ref(a);
    case "abs": case "floor": case "ceil": case "round": case "sqrt": case "sin": case "cos": case "tan": case "log": return "Math." + op + "(" + ref(a) + ")";
    case "lt": return ref(a) + "<" + ref(b); case "gt": return ref(a) + ">" + ref(b);
    case "le": return ref(a) + "<=" + ref(b); case "ge": return ref(a) + ">=" + ref(b);
    case "eq": case "boolEquals": return ref(a) + "===" + ref(b); case "ne": return ref(a) + "!==" + ref(b);
    case "and": return ref(a) + "&&" + ref(b); case "or": return ref(a) + "||" + ref(b); case "not": return "!" + ref(a);
    case "choose": return ref(a) + "?" + ref(b) + ":" + ref(c);
  }
  throw new Error("kernel step " + op);
}
// the kernel as JavaScript: one loop; steps that don't depend on the input are worked out before it
function sporkKernelFunction(kernel) {
  if (kernel.compiledFunction) return kernel.compiledFunction;
  const nodes = kernel.nodes, invariant = new Uint8Array(nodes.length), ref = i => "v" + i;
  let beforeLoop = "", loopBody = "";
  for (let i = 0; i < nodes.length; i++) {
    const [op, a, b, c, v] = nodes[i]; let expression;
    switch (op) {
      case "constant": expression = numberLiteral(v); break; case "constantBool": expression = String(v); break;
      case "input": expression = "item"; break; case "outside": expression = "outsideValues[" + v + "]"; break;
      case "add": expression = ref(a) + "+" + ref(b); break; case "sub": expression = ref(a) + "-" + ref(b); break;
      case "mul": expression = ref(a) + "*" + ref(b); break; case "div": expression = ref(a) + "/" + ref(b); break;
      case "mod": expression = "((" + ref(a) + "%" + ref(b) + ")+" + ref(b) + ")%" + ref(b); break;
      case "min": case "max": expression = "Math." + op + "(" + ref(a) + "," + ref(b) + ")"; break;
      case "noise": expression = "noiseHash(" + ref(a) + "," + ref(b) + ")"; break;
      case "neg": expression = "-" + ref(a); break;
      case "abs": case "floor": case "ceil": case "round": case "sqrt": case "sin": case "cos": case "tan": case "log": expression = "Math." + op + "(" + ref(a) + ")"; break;
      case "lt": expression = ref(a) + "<" + ref(b); break; case "gt": expression = ref(a) + ">" + ref(b); break;
      case "le": expression = ref(a) + "<=" + ref(b); break; case "ge": expression = ref(a) + ">=" + ref(b); break;
      case "eq": case "boolEquals": expression = ref(a) + "===" + ref(b); break; case "ne": expression = ref(a) + "!==" + ref(b); break;
      case "and": expression = ref(a) + "&&" + ref(b); break; case "or": expression = ref(a) + "||" + ref(b); break; case "not": expression = "!" + ref(a); break;
      case "choose": expression = ref(a) + "?" + ref(b) + ":" + ref(c); break;
      default: throw new Error("spork step " + op);
    }
    invariant[i] = op !== "input" && (a < 0 || invariant[a]) && (b < 0 || invariant[b]) && (c < 0 || invariant[c]) ? 1 : 0;
    if (invariant[i]) beforeLoop += "const v" + i + "=" + expression + ";"; else loopBody += "const v" + i + "=" + expression + ";";
  }
  const checks = kernel.checks.length ? "if(!(" + kernel.checks.map(ref).join("&&") + "))return false;" : "";
  const stores = kernel.outputs.map((o, j) => "outputs" + j + "[i]=" + (kernel.kind === "bools" ? ref(o) + "?1:0" : ref(o)) + ";").join("");
  const compiled = new Function("noiseHash", "n", "inputs", "outsideValues", "outputs", "const " + kernel.outputs.map((o, j) => "outputs" + j + "=outputs[" + j + "]").join(",") + ";" + beforeLoop +
    loopOverItems(loopBody + checks + stores) + "return true");
  return (kernel.compiledFunction = (n, inputs, outsideValues, outputs) => compiled(noiseHash, n, inputs, outsideValues, outputs));
}
// ---- the kernel as WebAssembly SIMD: two runs per instruction, in f64x2, so every step is the same IEEE double step
// JavaScript takes and the answers match bit for bit. noise is the same 32-bit hash, done in i32x4 lanes.
// run(n, xp, cp, op, stride): inputs at xp (0 for range), outside numbers at cp, each output at op + j * stride.
const wasmBinary = {
  unsigned: n => { const o = []; do { let b = n & 127; n >>>= 7; if (n) b |= 128; o.push(b); } while (n); return o; },
  signed: n => { const o = []; for (;;) { const b = n & 127; n >>= 7; if ((n === 0 && !(b & 64)) || (n === -1 && (b & 64))) { o.push(b); return o; } o.push(b | 128); } },
  float64: v => Array.from(new Uint8Array(new Float64Array([v]).buffer)),
  name: s => [...wasmBinary.unsigned(s.length), ...Array.from(s, ch => ch.charCodeAt(0))],
  section: (id, body) => [id, ...wasmBinary.unsigned(body.length), ...body],
};
const simd = op => [0xfd, ...wasmBinary.unsigned(op)];   // a SIMD instruction
const SIMD_OPCODES = { add: 0xf0, sub: 0xf1, mul: 0xf2, div: 0xf3, min: 0xf4, max: 0xf5, abs: 0xec, neg: 0xed, sqrt: 0xef, floor: 0x75, ceil: 0x74,
  eq: 0x47, ne: 0x48, lt: 0x49, gt: 0x4a, le: 0x4b, ge: 0x4c, not: 0x4d, and: 0x4e, or: 0x50, xor: 0x51, choose: 0x52, any: 0x53,
  ishru: 0xad, imul: 0xb5, splat: 0x14, isplat: 0x11, toU: 0xfd, fromU: 0xff, load: 0x00, store: 0x0b, konst: 0x0c };
const v128Constant = bytes => [...simd(SIMD_OPCODES.konst), ...bytes];
const f64x2Constant = (a, b) => v128Constant([...wasmBinary.float64(a), ...wasmBinary.float64(b === undefined ? a : b)]);
const i32x4Constant = c => { const b = new Uint8Array(16), d = new DataView(b.buffer); for (let j = 0; j < 4; j++) d.setInt32(j * 4, c | 0, true); return v128Constant(Array.from(b)); };
const SIGN_BITS = v128Constant([0, 0, 0, 0, 0, 0, 0, 0x80, 0, 0, 0, 0, 0, 0, 0, 0x80]);
const ALL_ONES = v128Constant(new Array(16).fill(255));
const ALL_ZEROS = v128Constant(new Array(16).fill(0));

function wasmKernelBytes(kernel) {
  const nodes = kernel.nodes;
  // locals: 0 n, 1 xp, 2 cp, 3 op, 4 stride (params); 5 i; then one per output base; then v128s
  const PARAM_COUNT = 0, PARAM_INPUTS = 1, PARAM_OUTSIDE = 2, PARAM_OUTPUTS = 3, PARAM_STRIDE = 4, LOCAL_INDEX = 5, LOCAL_OUTPUT_BASE = 6, outputCount = kernel.outputs.length;
  let nextLocal = LOCAL_OUTPUT_BASE + outputCount; const newV128Local = () => nextLocal++;
  const laneNumbers = newV128Local(), laneInputs = newV128Local(), failedLanes = newV128Local(), laneCount = newV128Local(), temp0 = newV128Local(), temp1 = newV128Local(), temp2 = newV128Local(), temp3 = newV128Local(), temp4 = newV128Local();
  const localOf = new Int32Array(nodes.length).fill(-1), invariant = new Uint8Array(nodes.length);
  const localGet = l => [0x20, ...wasmBinary.unsigned(l)], localSet = l => [0x21, ...wasmBinary.unsigned(l)], localTee = l => [0x22, ...wasmBinary.unsigned(l)];
  const pushValue = i => { const [op, , , , v] = nodes[i]; if (op === "constant") return f64x2Constant(v); if (op === "constantBool") return v ? ALL_ONES : ALL_ZEROS; if (op === "input") return localGet(laneInputs); return localGet(localOf[i]); };
  // floor(v) mod 2^32, as the bits of a 32-bit integer (JavaScript's ToInt32), in i32 lanes 0 and 1
  const wrapToU32 = code => [...code, ...localTee(temp4), ...localGet(temp4), ...f64x2Constant(1 / 4294967296), ...simd(SIMD_OPCODES.mul), ...simd(SIMD_OPCODES.floor), ...f64x2Constant(4294967296), ...simd(SIMD_OPCODES.mul), ...simd(SIMD_OPCODES.sub), ...simd(SIMD_OPCODES.toU)];
  const xorShiftRight = s => [...localTee(temp4), ...localGet(temp4), 0x41, ...wasmBinary.signed(s), ...simd(SIMD_OPCODES.ishru), ...simd(SIMD_OPCODES.xor)];   // h ^= h >>> s
  const stepCode = i => {
    const [op, a, b, c, v] = nodes[i];
    switch (op) {
      case "constant": case "constantBool": case "input": return [];
      case "outside": return [0x20, ...wasmBinary.unsigned(PARAM_OUTSIDE), 0x2b, 3, ...wasmBinary.unsigned(v * 8), ...simd(SIMD_OPCODES.splat)];
      case "add": case "sub": case "mul": case "div": case "min": case "max": case "lt": case "gt": case "le": case "ge": case "eq": case "ne": case "and": case "or":
        return [...pushValue(a), ...pushValue(b), ...simd(SIMD_OPCODES[op])];
      case "neg": case "abs": case "sqrt": case "floor": case "ceil": case "not": return [...pushValue(a), ...simd(SIMD_OPCODES[op])];
      case "boolEquals": return [...pushValue(a), ...pushValue(b), ...simd(SIMD_OPCODES.xor), ...simd(SIMD_OPCODES.not)];
      case "choose": return [...pushValue(b), ...pushValue(c), ...pushValue(a), ...simd(SIMD_OPCODES.choose)];
      case "round":
        // Math.round: floor, plus one when the rest is at least a half; a zero keeps the sign of its input
        return [...pushValue(a), ...simd(SIMD_OPCODES.floor), ...localSet(temp0),
          ...localGet(temp0), ...f64x2Constant(1), ...simd(SIMD_OPCODES.add), ...localGet(temp0), ...pushValue(a), ...localGet(temp0), ...simd(SIMD_OPCODES.sub), ...f64x2Constant(0.5), ...simd(SIMD_OPCODES.ge), ...simd(SIMD_OPCODES.choose), ...localSet(temp1),
          ...pushValue(a), ...SIGN_BITS, ...simd(SIMD_OPCODES.and), ...localGet(temp1), ...localGet(temp1), ...f64x2Constant(0), ...simd(SIMD_OPCODES.eq), ...simd(SIMD_OPCODES.choose)];
      case "noise":
        return [...pushValue(a), ...localSet(temp0), ...pushValue(b), ...localSet(temp1), ...localGet(temp0), ...simd(SIMD_OPCODES.floor), ...localSet(temp2), ...localGet(temp1), ...simd(SIMD_OPCODES.floor), ...localSet(temp3),
          ...wrapToU32(localGet(temp2)), ...i32x4Constant(0x9e3779b9), ...simd(SIMD_OPCODES.xor), ...i32x4Constant(0x85ebca6b), ...simd(SIMD_OPCODES.imul),
          ...wrapToU32([...localGet(temp3), ...f64x2Constant(0x632be5ab), ...simd(SIMD_OPCODES.add)]), ...i32x4Constant(0xc2b2ae35), ...simd(SIMD_OPCODES.imul), ...simd(SIMD_OPCODES.xor),
          // the fraction times 2^32 can round up to 2^32 itself (x = -1e-300), which JavaScript wraps to 0, so it is wrapped here too
          ...wrapToU32([...localGet(temp0), ...localGet(temp2), ...simd(SIMD_OPCODES.sub), ...f64x2Constant(4294967296), ...simd(SIMD_OPCODES.mul)]), ...i32x4Constant(0x27d4eb2f), ...simd(SIMD_OPCODES.imul), ...simd(SIMD_OPCODES.xor),
          ...wrapToU32([...localGet(temp1), ...localGet(temp3), ...simd(SIMD_OPCODES.sub), ...f64x2Constant(4294967296), ...simd(SIMD_OPCODES.mul)]), ...i32x4Constant(0x165667b1), ...simd(SIMD_OPCODES.imul), ...simd(SIMD_OPCODES.xor),
          ...xorShiftRight(16), ...i32x4Constant(0x7feb352d), ...simd(SIMD_OPCODES.imul), ...xorShiftRight(15), ...i32x4Constant(0x846ca68b), ...simd(SIMD_OPCODES.imul), ...xorShiftRight(16),
          ...simd(SIMD_OPCODES.fromU), ...f64x2Constant(1 / 4294967296), ...simd(SIMD_OPCODES.mul)];
    }
    throw new Error("no SIMD step for " + op);
  };
  for (let i = 0; i < nodes.length; i++) {
    const [op, a, b, c] = nodes[i];
    invariant[i] = op !== "input" && (a < 0 || invariant[a]) && (b < 0 || invariant[b]) && (c < 0 || invariant[c]) ? 1 : 0;
    if (op !== "constant" && op !== "constantBool" && op !== "input") localOf[i] = newV128Local();
  }
  const code = [];
  // before the loop: output bases, the lane numbers [0, 1], n in both lanes, and every step that doesn't depend on the input
  kernel.outputs.forEach((o, j) => code.push(...localGet(PARAM_OUTPUTS), ...localGet(PARAM_STRIDE), 0x41, ...wasmBinary.signed(j), 0x6c, 0x6a, ...localSet(LOCAL_OUTPUT_BASE + j)));
  code.push(...f64x2Constant(0, 1), ...localSet(laneNumbers), ...localGet(PARAM_COUNT), 0xb7, ...simd(SIMD_OPCODES.splat), ...localSet(laneCount), ...ALL_ZEROS, ...localSet(failedLanes));
  for (let i = 0; i < nodes.length; i++) if (invariant[i] && localOf[i] >= 0) code.push(...stepCode(i), ...localSet(localOf[i]));
  code.push(0x02, 0x40, 0x03, 0x40, ...localGet(LOCAL_INDEX), ...localGet(PARAM_COUNT), 0x4e, 0x0d, 1);
  // this pair's input: from memory, or the range's own numbers
  code.push(...localGet(PARAM_INPUTS), 0x04, 0x40, ...localGet(PARAM_INPUTS), ...localGet(LOCAL_INDEX), 0x41, 3, 0x74, 0x6a, ...simd(SIMD_OPCODES.load), 4, 0, ...localSet(laneInputs),
    0x05, ...localGet(laneNumbers), ...f64x2Constant(1), ...simd(SIMD_OPCODES.add), ...localSet(laneInputs), 0x0b);
  for (let i = 0; i < nodes.length; i++) if (!invariant[i] && localOf[i] >= 0) code.push(...stepCode(i), ...localSet(localOf[i]));
  // a check that fails in a real lane (not the spare one past n) means the ordinary way
  for (const g of kernel.checks) code.push(...localGet(failedLanes), ...pushValue(g), ...simd(SIMD_OPCODES.not), ...localGet(laneNumbers), ...localGet(laneCount), ...simd(SIMD_OPCODES.lt), ...simd(SIMD_OPCODES.and), ...simd(SIMD_OPCODES.or), ...localSet(failedLanes));
  kernel.outputs.forEach((o, j) => {
    code.push(...localGet(LOCAL_OUTPUT_BASE + j), ...localGet(LOCAL_INDEX), 0x41, 3, 0x74, 0x6a);
    if (kernel.kind === "bools") code.push(...f64x2Constant(1), ...f64x2Constant(0), ...pushValue(o), ...simd(SIMD_OPCODES.choose)); else code.push(...pushValue(o));
    code.push(...simd(SIMD_OPCODES.store), 4, 0);
  });
  code.push(...localGet(laneNumbers), ...f64x2Constant(2), ...simd(SIMD_OPCODES.add), ...localSet(laneNumbers), ...localGet(LOCAL_INDEX), 0x41, 2, 0x6a, ...localSet(LOCAL_INDEX), 0x0c, 0, 0x0b, 0x0b);
  code.push(...localGet(failedLanes), ...simd(SIMD_OPCODES.any), 0x45, 0x0b);
  const locals = [...wasmBinary.unsigned(2), ...wasmBinary.unsigned(1 + outputCount), 0x7f, ...wasmBinary.unsigned(nextLocal - LOCAL_INDEX - 1 - outputCount), 0x7b];
  const body = [...locals, ...code];
  return new Uint8Array([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0,
    ...wasmBinary.section(1, [1, 0x60, 5, 0x7f, 0x7f, 0x7f, 0x7f, 0x7f, 1, 0x7f]),
    ...wasmBinary.section(2, [1, ...wasmBinary.name("m"), ...wasmBinary.name("mem"), 0x02, 0x00, 1]),
    ...wasmBinary.section(3, [1, 0]),
    ...wasmBinary.section(7, [1, ...wasmBinary.name("run"), 0x00, 0]),
    ...wasmBinary.section(10, [1, ...wasmBinary.unsigned(body.length), ...body])]);
}
// the WebAssembly way, if this machine has SIMD: one memory, grown as needed; each kernel is made once
function makeWasmRunner() {
  if (typeof WebAssembly === "undefined") return null;
  try { if (!WebAssembly.validate(wasmKernelBytes({ nodes: [["input", -1, -1, -1], ["sqrt", 0, -1, -1]], outputs: [1], checks: [], kind: "numbers" }))) return null; } catch (e) { return null; }
  const memory = new WebAssembly.Memory({ initial: 1 }), instances = new WeakMap();
  return (kernel, n, inputs, outsideValues) => {
    let instance = instances.get(kernel);
    if (instance === undefined) {
      try { instance = new WebAssembly.Instance(new WebAssembly.Module(wasmKernelBytes(kernel)), { m: { mem: memory } }); } catch (e) { instance = null; }
      instances.set(kernel, instance);
    }
    if (!instance) return null;
    const evenCount = n + (n & 1), stride = evenCount * 8, outsideAt = 16, inputsAt = outsideAt + ((outsideValues.length * 8 + 15) & ~15), outputsAt = inputsAt + (inputs ? stride + 16 : 0);
    const bytesNeeded = outputsAt + kernel.outputs.length * stride + 64, bytesThere = memory.buffer.byteLength;
    if (bytesNeeded > bytesThere) memory.grow(Math.ceil((bytesNeeded - bytesThere) / 65536));
    new Float64Array(memory.buffer, outsideAt, outsideValues.length).set(outsideValues);
    if (inputs) { const inputView = new Float64Array(memory.buffer, inputsAt, evenCount); inputView.set(inputs); if (evenCount > n) inputView[n] = 0; }
    if (!instance.exports.run(n, inputs ? inputsAt : 0, outsideAt, outputsAt, stride)) return null;
    return kernel.outputs.map((o, j) => new Float64Array(memory.buffer, outputsAt + j * stride, n).slice());
  };
}
// numbers in the same order as a typed array's own sort (-0 before 0, NaN last), by radix: four passes of 16 bits
function radixSortNumbers(numbers) {
  const length = numbers.length;
  if (length < 512) return Float64Array.from(numbers).sort();
  let kept = 0, notANumberCount = 0; const copy = new Float64Array(length);
  for (let i = 0; i < length; i++) { const v = numbers[i]; if (v !== v) notANumberCount++; else copy[kept++] = v; }
  let bits = new Uint32Array(copy.buffer, 0, kept * 2), spare = new Uint32Array(kept * 2);
  // the bits of a double, turned so that unsigned order is number order
  for (let i = 0; i < kept; i++) { const high = bits[2 * i + 1]; if (high & 0x80000000) { bits[2 * i + 1] = ~high; bits[2 * i] = ~bits[2 * i]; } else bits[2 * i + 1] = high | 0x80000000; }
  const buckets = new Uint32Array(65536);
  for (let pass = 0; pass < 4; pass++) {
    const word = pass >> 1, shift = (pass & 1) * 16;
    buckets.fill(0);
    for (let i = 0; i < kept; i++) buckets[(bits[2 * i + word] >>> shift) & 0xffff]++;
    let sum = 0; for (let k = 0; k < 65536; k++) { const c = buckets[k]; buckets[k] = sum; sum += c; }
    for (let i = 0; i < kept; i++) { const j = buckets[(bits[2 * i + word] >>> shift) & 0xffff]++; spare[2 * j] = bits[2 * i]; spare[2 * j + 1] = bits[2 * i + 1]; }
    const swap = bits; bits = spare; spare = swap;
  }
  for (let i = 0; i < kept; i++) { const high = bits[2 * i + 1]; if (high & 0x80000000) bits[2 * i + 1] = high & 0x7fffffff; else { bits[2 * i + 1] = ~high; bits[2 * i] = ~bits[2 * i]; } }
  const sorted = new Float64Array(length); sorted.set(new Float64Array(bits.buffer, bits.byteOffset, kept)); sorted.fill(NaN, kept);
  return sorted;
}


// ===================================================================== plugging into the compiler
// a cell that spork is given, by name or written in place: worked out now into one kernel (decision 91)
function sporkKernelForCell(gen, cell) {
  if (!(cell.sporkArg || (cell.bindName && gen.sporkNames && gen.sporkNames.has(cell.bindName)))) return null;
  const workAhead = new WorkAhead(gen);
  let kernelCode = null;
  try { kernelCode = workAhead.buildSporkKernel(cell); } catch (e) { if (e !== GIVE_UP) throw e; }
  const outcome = kernelCode ? true : workAhead.reason || "it can't be worked out ahead";
  cell.sporkWhy = outcome;
  if (cell.bindName) (gen.sporkWhy || (gen.sporkWhy = new Map())).set(cell.bindName, outcome);
  if (!kernelCode) return null;
  // the loops inside it were unrolled when it was worked out, so their speed notes don't apply
  const lines = lineSpan(cell); gen.speedNotes = gen.speedNotes.filter(x => x.line < lines[0] || x.line > lines[1]);
  const name = "SK" + gen.constants.length;
  gen.constants.push("const " + name + "=" + kernelCode + ";");
  return "{spork:{kernel:" + name + ",outsideReads:()=>[" + workAhead.outsideReads.join(",") + "]}}";
}
// spork's speed note: given a name or a cell written in place
function sporkNote(gen, terms, i) {
  const previous = terms[i - 1], term = terms[i];
  if (!previous || previous.type !== "word" || previous.value !== "spork") return;
  const result = term.type === "word" && gen.sporkWhy ? gen.sporkWhy.get(term.value) : term.type === "cell" ? term.sporkWhy : undefined;
  if (result !== undefined) gen.speedNotes.push({ line: previous.line || 0, word: "spork", fast: result === true, why: result === true ? "" : result });
}
function prescan(gen, ast) { gen.sporkNames = sporkTargets(ast); }
// the fused loop, tried first; the steps as written are the way back when it can't run (NOT_FUSED)
function wrapFusedLoop(gen, run, ordinary) {
  const workAhead = new WorkAhead(gen), kernel = {}, reasons = {};
  for (const item of ["numbers", "rows"]) {
    try { kernel[item] = workAhead.buildFusedLoop(run.stages, item); } catch (e) { if (e !== GIVE_UP) throw e; kernel[item] = null; reasons[item] = workAhead.reason; }
  }
  const words = run.stages.map(stage => stage.word), line = run.stages[0].line || 0;
  if (!kernel.numbers && !kernel.rows) {
    gen.speedNotes.push({ line, word: words.join(" "), fast: false, why: reasons.rows || reasons.numbers || "it can't be worked out ahead" });
    return "(" + run.temp + "=" + run.source + "," + ordinary + ")";
  }
  const name = "FK" + gen.constants.length, resultTemp = gen.newTemp();
  gen.constants.push("const " + name + "={numbers:" + (kernel.numbers || "null") + ",rows:" + (kernel.rows || "null") + "};");
  gen.speedNotes.push({ line, word: words.join(" "), fast: true, why: "" });
  const hostWords = workAhead.hostWordsUsed.size ? "{" + [...workAhead.hostWordsUsed].map(word => JSON.stringify(word) + ":" + gen.globalCode(word)).join(",") + "}" : "null";
  return "((" + resultTemp + "=runFusedLoop((" + run.temp + "=" + run.source + ")," + name + "," + (workAhead.outsideReads.length ? "()=>[" + workAhead.outsideReads.join(",") + "]" : "null") + "," + hostWords + "))!==NOT_FUSED?" + resultTemp + ":" + ordinary + ")";
}

core.install({
  cell: sporkKernelForCell, note: sporkNote, prescan, fuse: { find: findLoopRun, wrap: wrapFusedLoop },
  spork, sortNumbers: radixSortNumbers, runtime: { runFusedLoop, NOT_FUSED },
});
// spork's API: how the last one ran, and the ways it can run (decision 91); the GPU plugs in here (decision 93)
Object.defineProperty(core, "sporkInfo", { get: () => sporkState.info, configurable: true });
core.sporkTally = reset => { const t = sporkState.tally; if (reset) sporkState.tally = []; return t; };
core.sporkWays = w => { if (sporkState.wasm === undefined) sporkState.wasm = makeWasmRunner(); Object.assign(sporkState, w); return sporkState; };
core.kernels = { WorkAhead, sporkKernelFunction, wasmKernelBytes, fusedLoopFunction };
if (typeof module !== "undefined") module.exports = core.kernels;
})(typeof window !== "undefined" ? window : globalThis);
