'use strict';

const { Cell, EMPTY, wrap, unwrap, makeNum, makeStr } = require('./cell');

function num(c) {
  if (c && c._num !== undefined) return c._num;
  if (c && c.array && c.array[1] !== undefined && typeof c.array[1] === 'number') return c.array[1];
  return NaN;
}

function str(c) {
  if (c && c._str !== undefined) return c._str;
  if (c && c.array && c.array[1] !== undefined && typeof c.array[1] === 'string') return c.array[1];
  return display(c);
}

function display(c) {
  if (c === EMPTY) return '[]';
  if (c._num !== undefined) return String(c._num);
  if (c._str !== undefined) return c._str;
  // Cell with array/fields
  const parts = [];
  for (let i = 1; i < c.array.length; i++) {
    if (c.array[i] !== undefined) parts.push(display(c.array[i]));
  }
  for (const [k, v] of c.fields) {
    if (!k.startsWith('#')) parts.push(`${k} : ${display(v)}`);
  }
  if (parts.length === 0) return '[]';
  return '[' + parts.join(', ') + ']';
}

function makeBuiltins() {
  const B = new Map();

  const def = (name, fn) => B.set(name, fn);

  // ── Arithmetic ────────────────────────────────────────────────────────────
  def('+', (r, [a]) => makeNum(num(r) + num(a)));
  def('-', (r, [a]) => makeNum(num(r) - num(a)));
  def('*', (r, [a]) => makeNum(num(r) * num(a)));
  def('/', (r, [a]) => makeNum(num(r) / num(a)));
  def('%', (r, [a]) => makeNum(num(r) % num(a)));

  // ── Comparison ───────────────────────────────────────────────────────────
  const boolCell = (b) => b ? makeNum(1) : EMPTY;

  def('=',  (r, [a]) => boolCell(sproutEq(r, a)));
  def('!=', (r, [a]) => boolCell(!sproutEq(r, a)));
  def('>',  (r, [a]) => boolCell(num(r) >  num(a)));
  def('<',  (r, [a]) => boolCell(num(r) <  num(a)));
  def('>=', (r, [a]) => boolCell(num(r) >= num(a)));
  def('<=', (r, [a]) => boolCell(num(r) <= num(a)));

  // ── Logic ────────────────────────────────────────────────────────────────
  def('and', (r, [a]) => r.isTruthy() ? a : EMPTY);
  def('or',  (r, [a]) => r.isTruthy() ? r : a);
  def('not', (r)      => r.isTruthy() ? EMPTY : makeNum(1));

  // ── String ───────────────────────────────────────────────────────────────
  def('reverse', (r) => makeStr(str(r).split('').reverse().join('')));
  def('upper',   (r) => makeStr(str(r).toUpperCase()));
  def('lower',   (r) => makeStr(str(r).toLowerCase()));
  def('length',  (r) => {
    if (r._str !== undefined) return makeNum(r._str.length);
    return makeNum(r.length());
  });
  def('trim',   (r) => makeStr(str(r).trim()));
  def('split',  (r, [sep]) => {
    const parts = str(r).split(str(sep));
    const c = new Cell();
    parts.forEach((p, i) => c.array[i + 1] = makeStr(p));
    return c;
  });
  def('join', (r, [sep]) => {
    const parts = [];
    for (let i = 1; i < r.array.length; i++) {
      if (r.array[i] !== undefined) parts.push(str(r.array[i]));
    }
    return makeStr(parts.join(str(sep)));
  });
  def('concat', (r, [a]) => makeStr(str(r) + str(a)));
  def('+', (r, [a]) => {
    // Overload + for strings
    if (r._str !== undefined || a._str !== undefined) {
      return makeStr(str(r) + str(a));
    }
    return makeNum(num(r) + num(a));
  });

  // ── I/O ──────────────────────────────────────────────────────────────────
  def('say',   (r) => { console.log(display(r)); return r; });
  def('print', (r) => { process.stdout.write(display(r)); return r; });
  def('show',  (r) => { console.log(display(r)); return r; });

  // ── Cell / collection ─────────────────────────────────────────────────────
  def('count', (r) => {
    let n = 0;
    for (let i = 1; i < r.array.length; i++) {
      if (r.array[i] !== undefined) n++;
    }
    for (const [k] of r.fields) {
      if (!k.startsWith('#')) n++;
    }
    return makeNum(n);
  });

  def('at', (r, [k]) => {
    const key = unwrap(k);
    const v = r.get(typeof key === 'number' ? key : String(key));
    return v !== undefined ? v : EMPTY;
  });

  def('set', (r, [k, v]) => {
    const c = r.clone();
    const key = unwrap(k);
    c.set(typeof key === 'number' ? key : String(key), v);
    return c;
  });

  def('push', (r, [v]) => {
    const c = r.clone();
    c.array[c.array.length] = v;
    return c;
  });

  def('each', (r, [block], vm, callerFrame) => {
    for (let i = 1; i < r.array.length; i++) {
      if (r.array[i] !== undefined) {
        vm._callBlock(block, [r.array[i]], callerFrame.self, callerFrame);
      }
    }
    for (const [k, v] of r.fields) {
      if (!k.startsWith('#')) {
        vm._callBlock(block, [v], callerFrame.self, callerFrame);
      }
    }
    return r;
  });

  def('map', (r, [block], vm, callerFrame) => {
    const result = new Cell();
    let idx = 1;
    for (let i = 1; i < r.array.length; i++) {
      if (r.array[i] !== undefined) {
        result.array[idx++] = vm._callBlock(block, [r.array[i]], callerFrame.self, callerFrame);
      }
    }
    return result;
  });

  def('filter', (r, [block], vm, callerFrame) => {
    const result = new Cell();
    let idx = 1;
    for (let i = 1; i < r.array.length; i++) {
      const v = r.array[i];
      if (v !== undefined) {
        const keep = vm._callBlock(block, [v], callerFrame.self, callerFrame);
        if (keep.isTruthy()) result.array[idx++] = v;
      }
    }
    return result;
  });

  def('reduce', (r, [block, init], vm, callerFrame) => {
    let acc = init ?? EMPTY;
    for (let i = 1; i < r.array.length; i++) {
      if (r.array[i] !== undefined) {
        // Block takes acc then item — curried
        let step = vm._callBlock(block, [acc], callerFrame.self, callerFrame);
        if (step instanceof Cell && step.block) {
          step = vm._callBlock(step, [r.array[i]], callerFrame.self, callerFrame);
        }
        acc = step;
      }
    }
    return acc;
  });

  def('first', (r) => r.array[1] !== undefined ? r.array[1] : EMPTY);
  def('last',  (r) => {
    const len = r.array.length - 1;
    return len >= 1 ? r.array[len] : EMPTY;
  });
  def('rest',  (r) => {
    const c = new Cell();
    for (let i = 2; i < r.array.length; i++) c.array[i - 1] = r.array[i];
    return c;
  });

  // ── Mixin ─────────────────────────────────────────────────────────────────
  // mixin: copy all non-# fields from arg into receiver (copy semantics = new cell)
  def('mixin', (r, [src]) => {
    const c = r.clone();
    if (src instanceof Cell) {
      for (let i = 1; i < src.array.length; i++) {
        if (src.array[i] !== undefined) c.array[i] = src.array[i];
      }
      for (const [k, v] of src.fields) {
        if (!k.startsWith('#')) c.fields.set(k, v);
      }
    }
    return c;
  });

  // ── Type checks ───────────────────────────────────────────────────────────
  def('isNum',    (r) => r._num !== undefined ? makeNum(1) : EMPTY);
  def('isStr',    (r) => r._str !== undefined ? makeNum(1) : EMPTY);
  def('isBlock',  (r) => r.block ? makeNum(1) : EMPTY);
  def('isEmpty',  (r) => r === EMPTY ? makeNum(1) : EMPTY);
  def('isTruthy', (r) => r.isTruthy() ? makeNum(1) : EMPTY);

  // ── Number utils ──────────────────────────────────────────────────────────
  def('abs',   (r) => makeNum(Math.abs(num(r))));
  def('floor', (r) => makeNum(Math.floor(num(r))));
  def('ceil',  (r) => makeNum(Math.ceil(num(r))));
  def('round', (r) => makeNum(Math.round(num(r))));
  def('sqrt',  (r) => makeNum(Math.sqrt(num(r))));
  def('neg',   (r) => makeNum(-num(r)));

  // ── Repetition ────────────────────────────────────────────────────────────
  def('times', (r, [block], vm, callerFrame) => {
    const n = Math.floor(num(r));
    for (let i = 1; i <= n; i++) {
      vm._callBlock(block, [makeNum(i)], callerFrame.self, callerFrame);
    }
    return r;
  });

  // ── String conversion ─────────────────────────────────────────────────────
  def('asStr', (r) => makeStr(display(r)));
  def('asNum', (r) => makeNum(parseFloat(str(r))));

  return B;
}

function sproutEq(a, b) {
  if (a === b) return true;
  if (a === EMPTY && b === EMPTY) return true;
  if (a._num !== undefined && b._num !== undefined) return a._num === b._num;
  if (a._str !== undefined && b._str !== undefined) return a._str === b._str;
  return false;
}

module.exports = { makeBuiltins, display };
