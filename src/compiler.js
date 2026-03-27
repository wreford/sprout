'use strict';

const { OP, Chunk, makeNum, makeStr } = require('./cell');

// Token types
const T = {
  NUM:     'NUM',
  STR:     'STR',
  IDENT:   'IDENT',
  OP:      'OP',       // binary operators: + - * / = > < >= <= !=
  COLON:   'COLON',    // :
  COMMA:   'COMMA',    // ,
  NL:      'NL',       // newline (acts like comma)
  INDENT:  'INDENT',
  DEDENT:  'DEDENT',
  LBRACK:  'LBRACK',   // [
  RBRACK:  'RBRACK',   // ]
  PIPE:    'PIPE',     // |
  AT:      'AT',       // @
  QMARK:   'QMARK',    // ?
  HASH:    'HASH',     // # (meta field prefix)
  EOF:     'EOF',
};

const BINARY_OPS = new Set(['+','-','*','/','=','>','<','>=','<=','!=']);

class Scanner {
  constructor(src) {
    this.src    = src;
    this.pos    = 0;
    this.line   = 1;
    this.col    = 1;
    this.indent = [0]; // indent stack
    this.queue  = []; // buffered tokens
    this._scanAll();
  }

  _scanAll() {
    const src = this.src;
    let pos = 0;
    const len = src.length;
    const toks = [];
    const indentStack = [0];

    let i = 0;

    const peek  = () => i < len ? src[i] : '';
    const peek2 = () => i+1 < len ? src[i+1] : '';
    const adv   = () => { const c = src[i++]; return c; };

    while (i < len) {
      // Skip spaces/tabs on a line (NOT newlines)
      while (i < len && (src[i] === ' ' || src[i] === '\t') && (toks.length === 0 || toks[toks.length-1].type !== T.NL)) {
        i++;
      }

      if (i >= len) break;

      const c = src[i];

      // Comment
      if (c === '-' && peek2() === '-') {
        while (i < len && src[i] !== '\n') i++;
        continue;
      }

      // Newline handling
      if (c === '\n') {
        i++;
        // Measure indent of next line
        let indent = 0;
        while (i < len && (src[i] === ' ' || src[i] === '\t')) {
          indent += src[i] === '\t' ? 2 : 1;
          i++;
        }
        // Skip blank lines
        if (i < len && src[i] === '\n') continue;
        if (i >= len) break;

        const curIndent = indentStack[indentStack.length - 1];
        if (indent > curIndent) {
          indentStack.push(indent);
          toks.push({ type: T.INDENT });
        } else if (indent < curIndent) {
          while (indentStack[indentStack.length - 1] > indent) {
            indentStack.pop();
            toks.push({ type: T.DEDENT });
          }
          toks.push({ type: T.NL });
        } else {
          toks.push({ type: T.NL });
        }
        continue;
      }

      // Number
      if (c >= '0' && c <= '9') {
        let s = '';
        while (i < len && ((src[i] >= '0' && src[i] <= '9') || src[i] === '.')) s += src[i++];
        toks.push({ type: T.NUM, val: parseFloat(s) });
        continue;
      }

      // String
      if (c === '"') {
        i++;
        let s = '';
        while (i < len && src[i] !== '"') {
          if (src[i] === '\\') { i++; s += src[i++]; }
          else s += src[i++];
        }
        i++; // closing "
        toks.push({ type: T.STR, val: s });
        continue;
      }

      // Hash ident (meta field): #foo
      if (c === '#') {
        i++;
        let s = '#';
        while (i < len && /[a-zA-Z0-9_]/.test(src[i])) s += src[i++];
        toks.push({ type: T.IDENT, val: s, meta: true });
        continue;
      }

      // Identifier or keyword
      if (/[a-zA-Z_]/.test(c)) {
        let s = '';
        while (i < len && /[a-zA-Z0-9_]/.test(src[i])) s += src[i++];
        toks.push({ type: T.IDENT, val: s });
        continue;
      }

      // Two-char ops
      if ((c === '>' || c === '<' || c === '!') && peek2() === '=') {
        toks.push({ type: T.OP, val: c + '=' });
        i += 2;
        continue;
      }

      // Single-char ops and punctuation
      switch (c) {
        case '+': case '-': case '*': case '/':
          toks.push({ type: T.OP, val: c }); i++; break;
        case '=': toks.push({ type: T.OP, val: '=' }); i++; break;
        case '>': toks.push({ type: T.OP, val: '>' }); i++; break;
        case '<': toks.push({ type: T.OP, val: '<' }); i++; break;
        case ':': toks.push({ type: T.COLON }); i++; break;
        case ',': toks.push({ type: T.COMMA }); i++; break;
        case '[': toks.push({ type: T.LBRACK }); i++; break;
        case ']': toks.push({ type: T.RBRACK }); i++; break;
        case '|': toks.push({ type: T.PIPE }); i++; break;
        case '@': toks.push({ type: T.AT }); i++; break;
        case '?': toks.push({ type: T.QMARK }); i++; break;
        case ' ': case '\t': case '\r': i++; break;
        default: i++; // skip unknown
      }
    }

    // Close any open indents
    while (indentStack.length > 1) {
      indentStack.pop();
      toks.push({ type: T.DEDENT });
    }

    toks.push({ type: T.EOF });
    this.queue = toks;
    this.qi = 0;
  }

  peek(offset = 0) {
    const idx = this.qi + offset;
    return idx < this.queue.length ? this.queue[idx] : { type: T.EOF };
  }

  next() {
    const t = this.queue[this.qi];
    if (this.qi < this.queue.length - 1) this.qi++;
    return t;
  }

  check(type, val) {
    const t = this.peek();
    if (t.type !== type) return false;
    if (val !== undefined && t.val !== val) return false;
    return true;
  }

  eat(type, val) {
    if (!this.check(type, val)) return false;
    this.next();
    return true;
  }
}

// ─── Compiler ────────────────────────────────────────────────────────────────

class Compiler {
  constructor(src, name = '<main>') {
    this.sc    = new Scanner(src);
    this.chunk = new Chunk(name);
  }

  compile() {
    this.compileBody(this.chunk);
    this.chunk.emit(OP.RETURN);
    return this.chunk;
  }

  // Compile a sequence of expressions (newline/comma separated)
  // Returns after EOF, DEDENT, or RBRACK (not consumed)
  compileBody(chunk) {
    this.skipNL();
    while (true) {
      const t = this.sc.peek();
      if (t.type === T.EOF || t.type === T.DEDENT || t.type === T.RBRACK) break;
      this.compileExpr(chunk);
      // After expression, there may be NL/COMMA separators
      const sep = this.sc.peek();
      if (sep.type === T.NL || sep.type === T.COMMA) {
        this.sc.next(); // consume separator
        // Emit POP for all but the last expression
        const next = this.sc.peek();
        if (next.type !== T.EOF && next.type !== T.DEDENT && next.type !== T.RBRACK) {
          chunk.emit(OP.POP);
        }
        this.skipNL();
      } else {
        break;
      }
    }
  }

  skipNL() {
    while (this.sc.check(T.NL)) this.sc.next();
  }

  // Compile one expression.
  // Assignment: IDENT COLON <greedy rhs>
  // Otherwise: atom (message)*
  compileExpr(chunk) {
    const t = this.sc.peek();

    // Assignment: ident :
    if (t.type === T.IDENT && this.sc.peek(1).type === T.COLON) {
      const name = t.val;
      this.sc.next(); // ident
      this.sc.next(); // colon
      this.compileGreedy(chunk); // RHS is greedy to NL/comma
      chunk.emit(OP.STORE, chunk.addConst(name));
      // STORE leaves value on stack (so last assign is returned)
      chunk.emit(OP.LOAD, chunk.addConst(name));
      return;
    }

    // Otherwise it's a message chain
    this.compileChain(chunk);
  }

  // Greedy RHS: compile a message chain (no assignment)
  compileGreedy(chunk) {
    this.compileChain(chunk);
  }

  // Parse a message chain: atom (message)*
  // Messages:
  //   - unary: IDENT (not followed by COLON, not a keyword)
  //   - binary: OP atom
  //   - call with cell arg: [ ... ] (conditional or apply)
  //   - ? ifTrue ifFalse
  compileChain(chunk) {
    this.compileAtom(chunk);

    while (true) {
      const t = this.sc.peek();

      // Binary op
      if (t.type === T.OP) {
        const op = t.val;
        this.sc.next();
        this.compileAtom(chunk);
        chunk.emit(OP.SEND, chunk.addConst(op), 1);
        continue;
      }

      // Ternary ?
      if (t.type === T.QMARK) {
        this.sc.next();
        this.compileAtom(chunk);
        this.compileAtom(chunk);
        chunk.emit(OP.SEND, chunk.addConst('?'), 2);
        continue;
      }

      // Message: IDENT
      // If followed by [, pass [..] as single arg: receiver ident [arg]
      // Otherwise unary (0 args): receiver ident
      if (t.type === T.IDENT && this.sc.peek(1).type !== T.COLON) {
        const name = t.val;
        this.sc.next();
        if (this.sc.peek().type === T.LBRACK) {
          this.compileBlockOrCell(chunk);
          chunk.emit(OP.SEND, chunk.addConst(name), 1);
        } else {
          chunk.emit(OP.SEND, chunk.addConst(name), 0);
        }
        continue;
      }

      // Bare [ after expression — conditional call: expr [yes, no]
      if (t.type === T.LBRACK) {
        this.compileBlockOrCell(chunk);
        chunk.emit(OP.SEND, chunk.addConst('call'), 1);
        continue;
      }

      // Bare num/str literal — equivalent to [literal], so call with it
      if (t.type === T.NUM) {
        this.sc.next();
        chunk.emit(OP.PUSH_CONST, chunk.addConst(makeNum(t.val)));
        chunk.emit(OP.SEND, chunk.addConst('call'), 1);
        continue;
      }
      if (t.type === T.STR) {
        this.sc.next();
        chunk.emit(OP.PUSH_CONST, chunk.addConst(makeStr(t.val)));
        chunk.emit(OP.SEND, chunk.addConst('call'), 1);
        continue;
      }

      break;
    }
  }

  // Compile a primary atom
  compileAtom(chunk) {
    const t = this.sc.peek();

    if (t.type === T.NUM) {
      this.sc.next();
      chunk.emit(OP.PUSH_CONST, chunk.addConst(makeNum(t.val)));
      return;
    }

    if (t.type === T.STR) {
      this.sc.next();
      chunk.emit(OP.PUSH_CONST, chunk.addConst(makeStr(t.val)));
      return;
    }

    if (t.type === T.AT) {
      // @ = implicit first arg in a block
      this.sc.next();
      chunk.emit(OP.LOAD, chunk.addConst('@'));
      return;
    }

    if (t.type === T.IDENT) {
      this.sc.next();
      chunk.emit(OP.LOAD, chunk.addConst(t.val));
      return;
    }

    if (t.type === T.LBRACK) {
      this.compileBlockOrCell(chunk);
      return;
    }

    // Unexpected — push EMPTY
    chunk.emit(OP.PUSH_CONST, chunk.addConst(null));
  }

  // [ ... ] — could be a block [params | body] or a cell literal [k:v, ...]
  compileBlockOrCell(chunk) {
    this.sc.next(); // consume [

    // Empty [] = EMPTY
    if (this.sc.eat(T.RBRACK)) {
      chunk.emit(OP.PUSH_CONST, chunk.addConst(null)); // null = EMPTY
      return;
    }

    // Detect if this is a block: starts with IDENT PIPE or AT PIPE or PIPE (zero params)
    const isBlock = this.looksLikeBlock();
    if (isBlock) {
      this.compileBlock(chunk);
    } else {
      this.compileCellLiteralBody(chunk);
    }
  }

  looksLikeBlock() {
    if (this.sc.peek().type === T.PIPE) return true; // [| ...]
    if (this.sc.peek().type === T.AT)   return true; // [@ ...]
    // [ident | ...] or [ident, ident | ...]
    let i = 0;
    while (this.sc.peek(i).type === T.IDENT) {
      i++;
      if (this.sc.peek(i).type === T.PIPE) return true;
      if (this.sc.peek(i).type === T.COMMA) { i++; continue; }
      break;
    }
    // Scan top-level tokens: , or : → cell literal; >1 token → zero-arg block
    let depth = 0, n = 0;
    for (let j = 0; ; j++) {
      const t = this.sc.peek(j);
      if (t.type === T.EOF) break;
      if (t.type === T.LBRACK) { depth++; n++; continue; }
      if (t.type === T.RBRACK) { if (depth === 0) break; depth--; n++; continue; }
      if (depth > 0) continue;
      if (t.type === T.COMMA || t.type === T.NL) return false;
      if (t.type === T.COLON) return false;
      n++;
    }
    return n > 1; // zero-arg block if has message sends
  }

  // Compile [params | body] into a MAKE_BLOCK
  compileBlock(chunk) {
    let params = [];

    if (this.sc.peek().type === T.AT) {
      // [@  ...body...] — implicit param block, no |
      // We treat @ as a hidden param named '@'
      params = ['@'];
      // Don't consume @; the body compiler will treat it as LOAD @
      // Actually we need to consume it and emit the body
      // But @ might appear multiple times in body. So just leave it.
      // No pipe needed.
    } else if (this.sc.peek().type === T.PIPE) {
      this.sc.next(); // consume |, zero params
    } else {
      // Collect params until |
      while (!this.sc.check(T.PIPE) && !this.sc.check(T.RBRACK) && !this.sc.check(T.EOF)) {
        if (this.sc.check(T.IDENT)) {
          params.push(this.sc.next().val);
        }
        this.sc.eat(T.COMMA);
      }
      if (this.sc.check(T.PIPE)) this.sc.next();
    }

    // Desugar multi-arg into currying
    if (params.length > 1) {
      this._compileCurried(chunk, params, 0);
      this.sc.eat(T.RBRACK);
      return;
    }

    // Single (or zero) param block — compile body into new chunk
    const blockChunk = new Chunk('<block>');
    chunk.chunks.push(blockChunk);
    const blockIdx = chunk.chunks.length - 1;

    // If single param, it will be passed via LOAD when VM calls
    if (params.length === 1) {
      // The VM will STORE param before running body
      blockChunk._params = params;
    } else {
      blockChunk._params = [];
    }

    this.compileBody(blockChunk);
    blockChunk.emit(OP.RETURN);

    this.sc.eat(T.RBRACK);

    chunk.emit(OP.MAKE_BLOCK, blockIdx);
  }

  // Recursively build curried blocks for [x, y, z | body]
  _compileCurried(chunk, params, idx) {
    if (idx === params.length - 1) {
      // Last param — compile actual body
      const blockChunk = new Chunk('<block>');
      blockChunk._params = [params[idx]];
      chunk.chunks.push(blockChunk);
      const blockIdx = chunk.chunks.length - 1;
      this.compileBody(blockChunk);
      blockChunk.emit(OP.RETURN);
      chunk.emit(OP.MAKE_BLOCK, blockIdx);
    } else {
      // Outer block: param[idx], body = next curried block
      const outerChunk = new Chunk('<block>');
      outerChunk._params = [params[idx]];
      chunk.chunks.push(outerChunk);
      const outerIdx = chunk.chunks.length - 1;
      this._compileCurried(outerChunk, params, idx + 1);
      outerChunk.emit(OP.RETURN);
      chunk.emit(OP.MAKE_BLOCK, outerIdx);
    }
  }

  // Compile cell literal body: sequence of k:v or bare values
  compileCellLiteral(chunk) {
    this.sc.next(); // consume [
    if (this.sc.eat(T.RBRACK)) {
      chunk.emit(OP.PUSH_CONST, chunk.addConst(null));
      return;
    }
    this.compileCellLiteralBody(chunk);
  }

  compileCellLiteralBody(chunk) {
    let count = 0;

    while (!this.sc.check(T.RBRACK) && !this.sc.check(T.EOF)) {
      this.skipNL();
      if (this.sc.check(T.RBRACK)) break;

      // Key:value pair or bare value
      const t = this.sc.peek();
      const t1 = this.sc.peek(1);

      if ((t.type === T.IDENT || t.type === T.NUM || t.type === T.STR) && t1.type === T.COLON) {
        // Key
        if (t.type === T.IDENT || t.type === T.STR) {
          chunk.emit(OP.PUSH_CONST, chunk.addConst(makeStr(t.val)));
        } else {
          chunk.emit(OP.PUSH_CONST, chunk.addConst(makeNum(t.val)));
        }
        this.sc.next(); // key
        this.sc.next(); // colon
        this.compileGreedy(chunk); // value
        count++;
      } else {
        // Bare value — key is positional (auto-increment, handled by MAKE_CELL)
        chunk.emit(OP.PUSH_CONST, chunk.addConst(null)); // null key = positional
        this.compileGreedy(chunk);
        count++;
      }

      this.sc.eat(T.COMMA);
      this.skipNL();
    }

    this.sc.eat(T.RBRACK);
    chunk.emit(OP.MAKE_CELL, count);
  }
}

function compile(src, name) {
  return new Compiler(src, name).compile();
}

module.exports = { compile };
