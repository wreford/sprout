'use strict';

// Opcodes
const OP = {
  PUSH_CONST:  0,
  PUSH_SELF:   1,
  LOAD:        2,
  STORE:       3,
  SEND:        4,
  MAKE_CELL:   5,
  MAKE_BLOCK:  6,
  JUMP:        7,
  JUMP_FALSE:  8,
  RETURN:      9,
  POP:        10,
};

// A Chunk is compiled bytecode + constants + sub-chunks (for blocks)
class Chunk {
  constructor(name = '<main>') {
    this.name = name;
    this.code = [];      // flat array: [opcode, ...operands, opcode, ...]
    this.constants = []; // constants pool
    this.chunks = [];    // nested block chunks
  }

  addConst(val) {
    const i = this.constants.indexOf(val);
    if (i !== -1) return i;
    this.constants.push(val);
    return this.constants.length - 1;
  }

  emit(...ops) {
    for (const op of ops) this.code.push(op);
    return this.code.length - 1;
  }

  // emit a jump, return index of the operand so we can patch it
  emitJump(op) {
    this.code.push(op, 0);
    return this.code.length - 1; // index of the 0 placeholder
  }

  patch(idx, val) {
    this.code[idx] = val;
  }
}

// The EMPTY cell — the only falsy value
class Cell {
  constructor() {
    this.array  = [undefined]; // 1-based: index 0 unused
    this.fields = new Map();
    this.block  = null; // { params: string[], chunk: Chunk, closure: Frame|null }
    this.parent = null; // mixin chain
  }

  // Field lookup: own fields, then parent chain, then builtins
  get(key) {
    if (typeof key === 'number') {
      return this.array[key] !== undefined ? this.array[key] : EMPTY;
    }
    if (this.fields.has(key)) return this.fields.get(key);
    if (this.parent !== null) return this.parent.get(key);
    return undefined; // not found
  }

  set(key, val) {
    if (typeof key === 'number') {
      this.array[key] = val;
    } else {
      this.fields.set(key, val);
    }
  }

  // True if this cell is the EMPTY cell (falsy)
  isEmpty() {
    return this === EMPTY;
  }

  isTruthy() {
    return this !== EMPTY;
  }

  // Clone for copy semantics (mixin)
  clone() {
    const c = new Cell();
    c.array = [...this.array];
    c.fields = new Map(this.fields);
    c.block  = this.block; // blocks are shared (immutable)
    c.parent = this.parent;
    return c;
  }

  // Shallow length of array part
  length() {
    return this.array.length - 1;
  }
}

// Singleton EMPTY cell — the only falsy value
const EMPTY = new Cell();

// Wrap a JS primitive in a Cell
function wrap(val) {
  if (val instanceof Cell) return val;
  if (val === null || val === undefined) return EMPTY;
  if (typeof val === 'boolean') return val ? makeNum(1) : EMPTY;
  if (typeof val === 'number') return makeNum(val);
  if (typeof val === 'string') return makeStr(val);
  return EMPTY;
}

// Unwrap: get the "primary value" of a cell
function unwrap(cell) {
  if (cell === EMPTY) return null;
  if (cell._num !== undefined) return cell._num;
  if (cell._str !== undefined) return cell._str;
  return cell;
}

function makeNum(n) {
  const c = new Cell();
  c._num = n;
  c.array[1] = n;
  return c;
}

function makeStr(s) {
  const c = new Cell();
  c._str = s;
  c.array[1] = s;
  return c;
}

function makeBlock(params, chunk, closure) {
  const c = new Cell();
  c.block = { params, chunk, closure };
  return c;
}

module.exports = { OP, Chunk, Cell, EMPTY, wrap, unwrap, makeNum, makeStr, makeBlock };
