'use strict';

const { OP, Cell, EMPTY, wrap, unwrap, makeNum, makeStr, makeBlock } = require('./cell');

class Frame {
  constructor(chunk, self, closure = null) {
    this.chunk   = chunk;
    this.ip      = 0;
    this.stack   = [];
    this.self    = self;   // current cell (field scope)
    this.closure = closure;
  }

  push(v) { this.stack.push(v); }
  pop()   { return this.stack.pop() ?? EMPTY; }
  peek()  { return this.stack[this.stack.length - 1] ?? EMPTY; }
}

class VM {
  constructor(builtins) {
    this.builtins = builtins; // Map<string, function>
    this.globals  = new Cell();
  }

  run(chunk) {
    const frame = new Frame(chunk, this.globals);
    return this._exec(frame);
  }

  _exec(frame) {
    const { chunk } = frame;
    const { code, constants, chunks } = chunk;

    while (frame.ip < code.length) {
      const op = code[frame.ip++];

      switch (op) {

        case OP.PUSH_CONST: {
          const val = constants[code[frame.ip++]];
          frame.push(val === null ? EMPTY : val);
          break;
        }

        case OP.PUSH_SELF: {
          frame.push(frame.self);
          break;
        }

        case OP.LOAD: {
          const name = constants[code[frame.ip++]];
          const val = this._lookup(name, frame);
          frame.push(val !== undefined ? val : EMPTY);
          break;
        }

        case OP.STORE: {
          const name = constants[code[frame.ip++]];
          const val = frame.peek(); // leave on stack
          frame.self.set(name, val);
          break;
        }

        case OP.SEND: {
          const msgIdx  = code[frame.ip++];
          const nargs   = code[frame.ip++];
          const msg     = constants[msgIdx];

          // Pop args (in reverse: last arg first on stack)
          const args = [];
          for (let i = 0; i < nargs; i++) args.unshift(frame.pop());
          const receiver = frame.pop();

          const result = this._send(msg, receiver, args, frame);
          frame.push(result);
          break;
        }

        case OP.MAKE_CELL: {
          const n = code[frame.ip++];
          const cell = new Cell();
          let arrayIdx = 1;
          // stack order: key was pushed before val, so TOS=val, TOS-1=key
          const pairs = [];
          for (let i = 0; i < n; i++) {
            const val = frame.pop();
            const key = frame.pop();
            pairs.unshift([key, val]);
          }
          for (const [key, val] of pairs) {
            if (key === EMPTY || key === null) {
              cell.array[arrayIdx++] = val;
            } else {
              const k = unwrap(key);
              if (typeof k === 'number') {
                cell.array[k] = val;
                if (k >= arrayIdx) arrayIdx = k + 1;
              } else {
                cell.fields.set(String(k), val);
              }
            }
          }
          // [x] = x semantics: single-element, no named fields → unwrap
          if (cell.array.length === 2 && cell.fields.size === 0 && cell.array[1] !== undefined) {
            frame.push(cell.array[1]);
          } else {
            frame.push(cell);
          }
          break;
        }

        case OP.MAKE_BLOCK: {
          const blockIdx = code[frame.ip++];
          const blockChunk = chunks[blockIdx];
          const params = blockChunk._params || [];
          const block = makeBlock(params, blockChunk, frame);
          frame.push(block);
          break;
        }

        case OP.JUMP: {
          frame.ip = code[frame.ip];
          break;
        }

        case OP.JUMP_FALSE: {
          const target = code[frame.ip++];
          const cond = frame.pop();
          if (!cond.isTruthy()) frame.ip = target;
          break;
        }

        case OP.RETURN: {
          return frame.pop();
        }

        case OP.POP: {
          frame.pop();
          break;
        }

        default:
          throw new Error(`Unknown opcode ${op} at ip ${frame.ip - 1}`);
      }
    }

    return EMPTY;
  }

  _lookup(name, frame) {
    // 1. Current cell's fields (including parent chain via cell.get)
    const own = frame.self.get(name);
    if (own !== undefined) return own;

    // 2. Closure frame chain (for lexical scoping of blocks)
    let cl = frame.closure;
    while (cl) {
      const v = cl.self.get(name);
      if (v !== undefined) return v;
      cl = cl.closure;
    }

    // 3. Globals
    const g = this.globals.get(name);
    if (g !== undefined) return g;

    return undefined;
  }

  _send(msg, receiver, args, callerFrame) {
    // Special: ? ternary
    if (msg === '?') {
      return receiver.isTruthy() ? args[0] : args[1];
    }

    // Special: call (apply a block / index into cell)
    if (msg === 'call') {
      const arg = args[0];
      return this._call(receiver, arg, callerFrame);
    }

    // 1. Check receiver's own fields for the message
    const field = receiver.get(msg);
    if (field !== undefined) {
      if (field instanceof Cell && field.block) {
        // It's a method/block — call it with args
        return this._callBlock(field, args, receiver, callerFrame);
      }
      if (args.length === 0) return field; // plain field access
      // Field exists but not a block and args provided — pass args as messages
    }

    // 2. Built-in methods
    const builtin = this.builtins.get(msg);
    if (builtin) {
      return builtin(receiver, args, this, callerFrame);
    }

    // 3. No field found — if args provided, the message becomes an arg to the receiver
    //    (Sprout: "if no field exists then pass as an arg")
    if (args.length === 0 && receiver.block) {
      // Unary message on a block = call it with the message name as string
      return this._callBlock(receiver, [makeStr(msg)], callerFrame.self, callerFrame);
    }

    // Field not found — return EMPTY
    return EMPTY;
  }

  _call(receiver, arg, callerFrame) {
    // If receiver is a block, call it with arg
    if (receiver.block) {
      return this._callBlock(receiver, [arg], callerFrame.self, callerFrame);
    }

    // If receiver is a cell and arg is a cell (conditional: cond [yes, no])
    // receiver is truthy/falsy, arg is [yes, no]
    if (arg instanceof Cell) {
      const yes = arg.get(1);
      const no  = arg.get(2);
      if (receiver.isTruthy()) {
        // call yes if it's a block, else return it
        if (yes instanceof Cell && yes.block) {
          return this._callBlock(yes, [], callerFrame.self, callerFrame);
        }
        return yes ?? EMPTY;
      } else {
        if (no instanceof Cell && no.block) {
          return this._callBlock(no, [], callerFrame.self, callerFrame);
        }
        return no ?? EMPTY;
      }
    }

    return EMPTY;
  }

  _callBlock(block, args, self, callerFrame) {
    const { params, chunk, closure } = block.block;

    // Fresh scope cell for this invocation; delegates to caller's self
    const blockSelf = new Cell();
    blockSelf.parent = self;

    // Bind params into the fresh scope
    for (let i = 0; i < params.length; i++) {
      blockSelf.set(params[i], args[i] !== undefined ? args[i] : EMPTY);
    }

    const newFrame = new Frame(chunk, blockSelf, closure ?? callerFrame);
    const result = this._exec(newFrame);
    return result;
  }
}

module.exports = { VM };
