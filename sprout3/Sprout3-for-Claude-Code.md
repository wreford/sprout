# Sprout 3: complete project for Claude Code

This one file holds the whole Sprout 3 project: the design spec, the compiler and runtime, the game layer, the tests, the benchmarks and the example programs. Every file is below in full, under a heading that gives its path.

## Start here

**Rebuild the project.** Recreate each file under "Files" at the path in its heading, inside a folder such as `sprout3/`. Each file sits in a fenced block that opens with four backticks; copy everything between the fences exactly.

**Run it (Node 22 or later):**

```
node test.js          # language tests (114)
node game-tests.js    # game tests (77)
node frame-bench.js   # ms per frame for each game
node bench.js         # speed against the old compiler and plain JS
node run3.js examples/tour.sp
```

The page and `bench.html` need a local web server, such as `python3 -m http.server` in the folder above `sprout3/`. SQLite in the browser needs sql.js 1.13.0 (MIT) in `sprout3/vendor/sqljs/`: `sql-wasm.js` and `sql-wasm.wasm` from the npm package `sql.js`. They are binary, so they aren't in this file.

The page and `bench.html` need a local web server, such as `python3 -m http.server` in the folder above `sprout3/`. SQLite in the browser needs sql.js 1.13.0 (MIT) in `sprout3/vendor/sqljs/`: `sql-wasm.js` and `sql-wasm.wasm` from the npm package `sql.js`. They are binary, so they aren't in this file.

The page and `bench.html` need a local web server, such as `python3 -m http.server` in the folder above `sprout3/`. SQLite in the browser needs sql.js 1.13.0 (MIT) in `sprout3/vendor/sqljs/`: `sql-wasm.js` and `sql-wasm.wasm` from the npm package `sql.js`. They are binary, so they aren't in this file.

The page and `bench.html` need a local web server, such as `python3 -m http.server` in the folder above `sprout3/`. SQLite in the browser needs sql.js 1.13.0 (MIT) in `sprout3/vendor/sqljs/`: `sql-wasm.js` and `sql-wasm.wasm` from the npm package `sql.js`. They are binary, so they aren't in this file.

All 191 tests pass as of 20 November 2026. `test.js` uses `node:sqlite`, which prints an "experimental" warning; that is expected.

## How to work on it

- **The spec is the source of truth.** The section "Design decisions not yet built" (decisions 1 to 94) defines Sprout 3, despite its name: almost all of it is now built. Later decisions override earlier ones and say so. Sections 1 to 15 at the top of the spec describe the older Sprout 2.0 / Sprout Live baseline and are kept for history only.
- **Language changes go to Troy first.** Talk any change to syntax or semantics through with him before building it, and ask one question at a time. Library-level choices (cells in the prelude, host cells, internals) are yours to make; record them in the spec (decision 80).
- **Don't rewrite example programs or files unless asked.**
- **Keep it streamable.** The tokenizer and parser work in one pass with no look-ahead across the file. Warn if a change would break that.
- **Style:** kebab-case names; straight quotes; `--` for comments; no em dashes.

## How the implementation works

- **`sprout3.js`, the compiler.** It tokenizes (an indent opens a cell unless the line above ends with `[`, `(` or `|`), parses into chains of sends, and generates JavaScript. Each cell literal compiles to a `run` function (straight-line code; inputs arrive as arguments) and, when it has readable fields, a `slots` function (one lazy thunk per field, worked out once).
- **Fast paths:**
  - Branches (`test [a] else [b]`) compile to inline conditionals.
  - Operators get fused fast paths.
  - `x with [f : ...]` compiles straight to a field update.
  - Simple records and argument lists are built eagerly as value cells.
  - Field reads and `with` use inline caches keyed on record shape.
  - Calls in tail position bounce, so recursion stays flat.
  - Lists of number records are stored as columns, and simple `collect`, `keep` and `each` bodies run as loops over the columns (decision 82).
  - A `fold` block of number maths runs as one plain loop over `range` or a list of numbers (decision 88).
  - In a column `each`, host words take their values one by one, with no argument cell per shape (decision 89).
  - A `fold` block of number maths runs as one plain loop over `range` or a list of numbers (decision 88).
  - In a column `each`, host words take their values one by one, with no argument cell per shape (decision 89).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
  - A `fold` block of number maths runs as one plain loop over `range` or a list of numbers (decision 88).
  - In a column `each`, host words take their values one by one, with no argument cell per shape (decision 89).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
  - A `fold` block of number maths runs as one plain loop over `range` or a list of numbers (decision 88).
  - In a column `each`, host words take their values one by one, with no argument cell per shape (decision 89).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
  - `spork` works a pure cell out ahead into one kernel of number maths (`Spk` in `sprout3.js`): calls inlined, lists, records and words unrolled, tests that change from run to run made into per-run choices. The kernel runs on WebAssembly SIMD (`spkWasmBytes`, f64x2, the same bits as JavaScript), in JavaScript (`spkJS`), or on the GPU (`gpu-spork.js`, 32-bit) (decisions 91 to 93).
- **Runtime values:** `Cell` (from a literal, lazy), `VCell` (a cell of values: shape plus value array), `RCell` (a lazy `range`), `ColCell` (a list of number records stored as one number array per field), `Native` (a host word), `Waiting` (a prototype method waiting for its right side). `false` is the only falsy value.
- **Prelude:** a short Sprout program inside `sprout3.js` defines `match`, `cond`, `take`, `rgb`, `rgba`, `every`, `wave` and `frame` in Sprout itself.
- **`live3.js`, the game loop.** A game file binds `start`, `update` and `draw`. Events (`down`, `move`, `up`, `tick`) fold through `frame update`. Effects are queued during `update` and carried out after it. Random numbers are recorded per tick, so `replayFrom` is exact. Rewind is a list of states, since cells never change. Hot-swap keeps live values whose starting value didn't change.

## Open items and next steps

1. **The speed roadmap (decision 79), in order:**
   - columns: built (decision 82)
   - loop fusion for `collect`/`keep`/`fold` chains
   - spork sending pure numeric cells to WebAssembly with SIMD or to the GPU: built (decisions 91 to 93)
   - seeded `noise [sample, id]` for big runs: built (decision 87)
2. **Not built yet:**
   - files and folders as cells (decisions 63 to 66)
   - extending built-ins by shadowing (40)
   - spork over an effectful cell, reporting back as events (47)
   - (built since: SQLite and WebGPU on the page, decision 90)
   - automatic purity detection (32)
   - (built since: the editor-side lint that flags slow paths, decision 86)
   - (built since: the editor-side lint that flags slow paths, decision 86)
   - (built since: the editor-side lint that flags slow paths, decision 86)
   - (built since: the editor-side lint that flags slow paths, decision 86)
   - (built since: the editor-side lint that flags slow paths, decision 86)
3. **Known rough edges:**
   - The `else` catch is kept (74, decided 20 Nov): a then-branch that gives `false` also runs the `else`. A lint names any branch whose answer is a test, and `cond` keeps a false answer (84). Every control structure is a library cell (94).
   - Field/name clash lints fire on the common `update` pattern; rename the local (73).
   - A cell can't have a field whose name is worked out at run time, so the host passes held keys in on each tick.
4. **Current speed:**
   - Games use 0.007 to 0.27 ms a frame (headless Chromium; `bench.html`). 2,000 particles went from about 1.45 to 0.28 ms a frame with columns (decision 82).
   - In the browser: fib 25 takes about 1.8 ms, against 0.9 for plain JS; summing 1 to 1,000,000 with `fold` about 0.8 ms, level with plain JS (decision 88); 10,000 records times 20 updates about 3 ms, against 7 for plain JS.
   - 100,000 particles: about 5 ms to update and 5 to 7 ms to build the draw list. Canvas 2D takes 180 ms to draw them; WebGPU takes about 4 ms of CPU to build and submit the frame.
   - SQLite: 10,000 rows into Sprout records with `db query` in about 11 ms.
   - Monte Carlo (`ace-risk.sp`'s run, five graph walks each): 100,000 runs take about 10 s the ordinary way, 28 ms as a JavaScript kernel and 21 ms on SIMD; a million take about 0.2 s on SIMD. In Node, ace-schedule's run on SIMD is about 3 times the JavaScript kernel.
   - Monte Carlo (`ace-risk.sp`'s run, five graph walks each): 100,000 runs take about 10 s the ordinary way, 28 ms as a JavaScript kernel and 21 ms on SIMD; a million take about 0.2 s on SIMD. In Node, ace-schedule's run on SIMD is about 3 times the JavaScript kernel.
   - Monte Carlo (`ace-risk.sp`'s run, five graph walks each): 100,000 runs take about 10 s the ordinary way, 28 ms as a JavaScript kernel and 21 ms on SIMD; a million take about 0.2 s on SIMD. In Node, ace-schedule's run on SIMD is about 3 times the JavaScript kernel.
   - Compiling `sprout.sp` takes about 4 ms.

## Contents

- Spec: `spec.md`
- `sprout3.js`: Compiler (Sprout to JavaScript) and runtime
- `live3.js`: Game layer: event loop, queued effects, recorded randomness, rewind, replay, hot-swap
- `sqlite-host.js`: SQLite host cell (Node built-in node:sqlite)
- `sqlite-web.js`: SQLite host cell for the browser: sql.js (SQLite in WebAssembly), kept in IndexedDB; same query and run as sqlite-host.js
- `gpu-paint.js`: WebGPU renderer for the page: every shape in a frame as one instanced draw, with a self-test before use
- `gpu-spork.js`: Spork on the GPU: a kernel worked out ahead as a WebGPU compute shader (32-bit), with the page's run-again-when-the-answer-is-back passes
- `test.js`: Language tests, one or more per decision
- `game-tests.js`: Headless game tests
- `bench.js`: Benchmarks against the old Sprout 2.0 compiler and plain JS
- `frame-bench.js`: Milliseconds per frame for each example game
- `run3.js`: Run a .sp file: node run3.js examples/tour.sp
- `game-test.js`: Quick headless run of sprout.sp
- `live-test.js`: Quick rewind, replay and hot-swap check
- `examples/tour.sp`: The language, one feature per line
- `examples/sprout.sp`: Demo game: catch the rain, dodge the bugs
- `examples/bounce.sp`: Bounce
- `examples/snake.sp`: Snake
- `examples/breakout.sp`: Breakout
- `examples/particles.sp`: Particle fountain (speed test)
- `examples/fireflies.sp`: Fireflies: 400 lights that gather to your finger (runs on columns)
- `examples/orbit.sp`: Orbit: throw moons round a sun
- `examples/hop.sp`: Hop: land gently on the pad
- `examples/life.sp`: Life: a living grid you can draw on
- `examples/ace-derive.sp`: ACE (the Atomic Constraint Engine): the five kinds of atom, with done derived to a fixed point (prints)
- `examples/ace-schedule.sp`: ACE: critical path, then a Monte Carlo finish date with a shared risk (prints)
- `examples/ace-board.sp`: ACE: an interactive atom graph; tap work to close it, and gates, the rollup and the critical path follow
- `examples/ace-site.sp`: ACE: positions are expressions over named dimensions, and overlaps are clashes
- `examples/ace-crews.sp`: ACE: sequence and capacity constraints; work waits for what it requires and for a free crew of its trade
- `examples/ace-morning.sp`: ACE: the morning question; open constraints ranked by the hours of work each would release (prints)
- `examples/ace-ledger.sp`: ACE: the atoms live in SQLite; each run closes the first workable atom and logs it (prints; uses db)
- `examples/ace-risk.sp`: ACE: a million runs of the job with a risk register, through spork; the finish as a distribution, and what each risk adds at P80 (prints)
- `examples/recipes.sp`: Recipes: quicksort, primes, FizzBuzz, a vector with its own + (prints; not a game)
- `index.html`: The web page at taskiap.com/sprout3/: a library of examples with artwork, the running game shown like album art, live editing, a now-playing bar whose progress bar rewinds time, state, output and the spec; light and dark
- `bench.html`: Benchmarks in the browser: the language against plain JS, the games, particles up to 100,000 on Canvas 2D and WebGPU, and SQLite
- `old-sprout2.js`: The old Sprout 2.0 compiler, kept only so bench.js can compare against it

---

# Spec

## spec.md

````markdown
# Sprout 2.0 language spec (Sprout Live)

This spec describes Sprout 2.0 as compiled and run by Sprout Live, at taskiap.com/sproutlive/.

- **The language:** `sprout2.js` compiles Sprout to JavaScript and holds its runtime.
- **The game layer:** `live.js` runs a Sprout program as a game and swaps in new code while it runs.
- **The page:** `index.html` is the editor, the game words and the rewind bar.

Sprout Live started from the compiler in `2026experiments/pm-tools/sprout2-ide.html` and adds to it. Anything marked **(Live)** in this spec exists only in Sprout Live. The 11 example programs in the original IDE give the same output in both.

This file holds everything in one place:
- the spec (sections 1–15)
- the Sprout programs (Appendix A)
- `sprout2.js` (Appendix B)
- `live.js` (Appendix C)

The example programs in Appendix A are:
- `tour.sp`: the language, one feature per line.
- `sprout.sp`: the finished demo game.
- `bounce.sp` and `blank.sp`: the two starter games.

---

## 1. The idea in one paragraph

A Sprout program is a list of statements. A statement either names a value (`x : 10`), changes one (`x := 11`), or is an expression that does something (`x print`).

Expressions are read **left to right with no operator precedence**:
- A name followed by values calls it (`circle 10 20 5 "#fff"`).
- A value followed by a word sends that word to it (`xs length`).
- A true or false value followed by a pair of blocks picks one (`x > 0 ["yes", "no"]`).

Square brackets make blocks, which are both functions and the bodies of loops and choices.

---

## 2. Text

### 2.1 Separators
- Spaces and tabs separate terms.
- A **new line** ends a statement, and so does a **comma**.
- Inside `[ ]`, the choice between the two matters: see 6.2. **(Live)**

### 2.2 Comments
- `-- note` runs to the end of the line. It is the only kind of comment.
- `'` is an ordinary character, so `don't` is one word.

### 2.3 Numbers
- A number matches `-?digits(.digits)?`, for example `3`, `0.25`, `-5`.
- A `-` written directly against digits belongs to the number.
  - `x -1` means "x given -1".
  - Write `x - 1` to subtract.

### 2.4 Strings
- Strings go in double quotes: `"hello"`.
- Escapes: `\n` new line, `\t` tab, `\\` backslash, `\"` quote. Any other `\c` gives `c`.
- **Templates (Live):** `"{score} drops"` puts a value into the string.
  - Any one expression can go inside the braces: `"x is {x * 2}"`, `"at {p.x}, {p.y}"`.
  - Write `\{` for a plain brace.
  - A template compiles to `"" ++ (score str) ++ " drops"`.

### 2.5 Words
A word is any run of characters except spaces, new lines and `[ ] ( ) { } " , | :`. So:

- Names can hold hyphens and symbols: `touch-x`, `max-val`, `ready?`.
- Operators are words too: `+ - * / % < > <= >= != = ++ and or`.
- **Operators need spaces round them.** `x+1` is one word, a name that doesn't exist.
- **Dotted words (Live):** `p.x` reads field `x` of `p`. `a.b.c` reads through every level.

### 2.6 Punctuation
| | |
|---|---|
| `[ ]` | a block or a list |
| `( )` | a group |
| `{ }` | a record **(Live)** |
| `,` | separates items |
| `\|` | ends a block's input names |
| `:` | names a value |
| `:=` | changes a value |

---

## 3. Values

| Kind | Written | Notes |
|---|---|---|
| number | `3`, `0.5`, `-2` | 64-bit floating point |
| string | `"hi"` | |
| true / false | `true`, `false` | The only values a choice accepts. Numbers are not true or false. |
| none | `none` | What you get from a missing item, a choice with no branch taken, or a loop. |
| record | `{x : 1, y : 2}` | **(Live)** The same thing as a map with string keys. |
| map | `map` | An empty map; fill it with `m "key" := value`. |
| cell | `[1, 2, 3]`, `[_ * 2]` | The only kind of block or list. Parts count from 1. See 6.2. |

---

## 4. Statements

```
name : expr          -- makes a field
name := expr         -- changes a field
target key := expr   -- stores into a list, record or map
```

Some examples of storing:
- `xs @ 2 := 9` changes the second part of a cell.
- `m "a" := 1` stores into a map.
- `p.x := 5` changes a record field, and `a.b.c := 7` changes a nested one.

At the top of a program, `:` makes a field the whole program can see. Inside a block, `:` makes a name local to that block.

**Rule of thumb:** use `:` only for new names and `:=` to change any name that already exists. Reusing an outer name with `:` inside a block behaves differently in different kinds of block.

---

## 5. Expressions

### 5.1 Terms
A term is one of these:
- a number
- a string
- a word
- a dotted word
- `( ... )`
- `[ ... ]`
- `{ ... }`

A statement is a chain of terms, read left to right.

### 5.2 Operators: left to right, no precedence
```
2 + 3 * 4        -- 20
2 + (3 * 4)      -- 14
H - 40 - height  -- (H - 40) - height
```

| Operator | Meaning |
|---|---|
| `+ - * / %` | Arithmetic. `%` is the remainder. |
| `< > <= >= !=` | Comparisons; each gives `true` or `false`. |
| `=` | Equal. Numbers and strings compare by value. Lists and records are equal only if they are the same one. |
| `++` | Joins: `"n=" ++ 4` is `"n=4"`. |
| `a and b` **(Live)** | true if both are true. `b` is only worked out when `a` is true. |
| `a or b` **(Live)** | true if either is true. `b` is only worked out when `a` is false. |

Comparisons also run left to right, so put brackets round each side: `(a > 1) and (b < 2)`.

### 5.3 Postfix words
These apply to **everything to their left**:

```
x str            -- text form of any value: 3, [1, 2], {x : 1}
xs length        -- items in a list, or characters in a string
xs first         -- the first item
xs second        -- the second item
xs last          -- the last item
n sqrt           -- also floor, round, ceil, abs, sin, cos, tan, log
b not            -- (Live) flips true and false
x print          -- shows x and gives x back
```

So `sum / n floor` is `(sum / n) floor`.

### 5.4 Calls and lookups
`f a b c` gives the values after `f` to `f`, until an operator or a postfix word ends the chain.

What happens depends on what `f` is:

| `f` is | `f x` does |
|---|---|
| a cell | Runs it with `x` as its input, even when `x` is a number. Extra values go to whatever it returns. With too few values, you get a cell that waits for the rest (`add-ten : add 10`). **(Live fix)** |
| a record or map | Gives the value at key `x`, or `none`. |
| `true` / `false` with a block | Picks a branch (see 7). |
| anything else | Gives `none`. |

To run a block that takes no input, give it any value: `reset none`.

Each argument is a single term, so put calculations in brackets:
```
circle (x + 9) top 9 "#5cc85c"
```

A call ends at an operator, so its result can be used directly:
```
dist d.x d.y x top < 24     -- (dist d.x d.y x top) < 24
```

### 5.5 Groups
`( ... )` groups an expression. A group holding several lines runs them in order and gives the last one's value. That is how a branch does several things:

```
hit [(
  score := score + 1
  beep 880 0.06
)]
```

### 5.6 Special names
| Name | Value |
|---|---|
| `true`, `false`, `none` | constants |
| `pi` | π |
| `random` | a fresh number from 0 up to 1 |
| `time` | milliseconds since 1970 |
| `map` | a fresh empty map |
| `range n` | the list `[1, 2, …, n]` |
| `list n` | a list of n zeros |

---

## 6. Blocks

### 6.1 Inputs
| Written | Inputs |
|---|---|
| `[ ... ]` with no `_` | none |
| `[ ... _ ... ]` | one: `_` |
| `[a, b \| ... ]` or `[a b \| ... ]` | named inputs |
| `[\| ... ]` | always none, even if every line is a call |

A block's value is the value of its last statement. Blocks capture the names around them (closures):

```
adder : [n | [_ + n]]
add5 : adder 5
add5 10 print          -- 15
```

### 6.2 Cells only (Live)
There is one kind of `[ ... ]`: a cell. Its parts are its steps, separated by commas or new lines.

- **Lazy.** A cell's parts are worked out each time it runs or a part is read, never when it is made. So `[random, 5] @ 1` gives a fresh number on every read. Use `( )` to work something out now.
- **Run, a cell gives its last part.** `[5]` gives 5, and `[3, 1, 4]` gives 4.
- **A value sent to a cell is its input.** `double 1` runs `double` with 1, and `xs 2` runs `xs`. Numbers are never indexes.
- **`@` reads a part.** `xs @ 2` is the second part, and `xs @ 2 := 9` changes it. `@` works on every cell, and on strings (`"abc" @ 2` is `"b"`).
- Only a cell made of values, like `[1, 2]` or the result of `append`, `collect` or `keep`, can have a part changed.
- Reading a part that uses `_` works it out with no input, so `double @ 1` is an error.
- Because parts are lazy, a record written inside a cell, as in `[{x : 1}]`, is a fresh record on every read. Changes to it are lost. Build such lists with `append`.

### 6.3 Recursion
A block can call itself by its field name:
- When the self-call is the last thing it does, the compiler turns it into a loop, so it doesn't use up the stack.
- Other calls in last position are run one after another rather than nested.

`memoize` after a block remembers each answer (`pure` means the same):
```
fib : [n | n <= 1 [n, (fib (n - 1)) + (fib (n - 2))]] memoize
```

---

## 7. Choices

```
test [then, else]      -- only the chosen branch runs
test [then]            -- runs then when test is true; otherwise gives none
```

- `test` must be `true` or `false`. Any other value picks neither branch, and you get `none`.
- To do several things in a branch, wrap them in `( )` (see 5.5).

Choices nest:
```
n = 0 ["zero", n > 0 ["positive", "negative"]]
```

Choices combine with `and`, `or` and `not`:
```
near and (b.y > top) [( height := height - 30, shake 12 )]
restart (over and tapped)
```

---

## 8. Loops

```
5 times [ ... ]                    -- _ counts 1 to 5
5 times [i | ... ]                 -- or name it
xs each [ ... ]                    -- _ is each item
xs each [d | ... ]                 -- or name it
xs collect [_ * 2]                 -- a new list of the results
xs fold 0 [total, x | total + x]   -- carries a value through the list
while [k < 100] [k := k * 2]       -- the test is a block too
```

- `times`, `each` and `while` give `none`.
- Inside a loop body, `:=` changes fields outside it, and `xs @ 2 := v` or `d.x := v` store into what they name.
- **Runaway loops (Live):** Sprout Live stops a loop that runs more than 2,000,000 times, or longer than 60 ms in one frame. You get the error "A loop kept going too long".

---

## 9. Lists, records and maps

### Lists
| Write | To |
|---|---|
| `xs @ 1` | read the first part |
| `xs @ 2 := 9` | change a part |
| `xs append v` | make a **new** cell with `v` added (the old one is unchanged) |
| `xs length`, `first`, `second`, `last` | read size and ends |
| `xs collect [...]`, `xs fold s [a, b \| ...]` | transform |
| `keep xs [test]` | keep only the items that pass (a game word, see 11) |

Storing past the end leaves `none` parts. Use `append` to grow a cell.

### Records (Live)
- Make one with `{x : 1, y : 2}`. The field values are any expressions: `{x : rand 20 (W - 20), y : -10}`.
- Read with `p.x`, and inside a loop with `_.x`.
- Change with `p.x := 5`.
- Records nest: `a.b.c` reads and `a.b.c := 1` writes.
- `p "x"` is the same as `p.x`, because a record is a map.

### Maps
- `m : map` makes an empty map.
- `m "k" := v` stores, and `m "k"` reads (`none` if missing).

---

## 10. Grammar

```
program  = { statement sep } ;
sep      = newline | "," ;
statement= chain [ ( ":" | ":=" ) chain ] ;
chain    = term { term } ;
term     = number | string | word | dotted
         | "(" { statement sep } ")"
         | "[" [ names "|" ] { statement sep } "]"
         | "{" { word ":" chain sep } "}" ;
names    = { word [ "," ] } ;
dotted   = word "." word { "." word } ;
```

The parser builds each chain as nested sends: `a b c` is `((a b) c)`. The code generator then works out what each send means: a call, an operator, a postfix word, a lookup, a choice or a loop. There is no fixed meaning at parse time.

---

## 11. The game layer (Sprout Live)

### 11.1 Shape of a game
```
-- fields: the game's state
x : W / 2
score : 0

update : [dt |
  -- runs every frame; dt is seconds since the last one (at most 0.05)
]

draw : [
  -- paints the screen every frame, after update
]
```

Either block can be left out. The screen is 360 × 480. `x` goes right, `y` goes down, and `0 0` is the top-left corner.

### 11.2 Inputs
| Word | Value |
|---|---|
| `touch-x`, `touch-y` | the finger or mouse position, in game units |
| `touching` | `true` while pressed |
| `tapped` | `true` on the frame of a tap, or when Space or Enter is pressed |
| `key "left"` | `true` while that key is held. Names: `"left"`, `"right"`, `"up"`, `"down"`, `"space"`, `"enter"`, or a letter. |
| `clock` | seconds since the game started |

### 11.3 Drawing
Colours are any CSS colour string: `"#ffe066"`, `"rgba(0,0,0,0.5)"`, `"tomato"`.

| Word | Draws |
|---|---|
| `clear colour` | fills the screen |
| `rect x y w h colour` | a box, from its top-left corner |
| `circle x y r colour` | a circle around x, y |
| `line x1 y1 x2 y2 colour` | a line, 3 px wide with round ends |
| `text words x y size colour` | bold text centred on x, y; `size` in px |

### 11.4 Helpers
| Word | Does |
|---|---|
| `rand a b` | a random number from a up to b |
| `dist x1 y1 x2 y2` | distance between two points |
| `clamp v lo hi` | keeps v between lo and hi |
| `keep xs [test]` | a new list of the items whose test is `true` |
| `toward a b amt` **(Live)** | `a + (b - a) * amt`. Used every frame, it follows smoothly. |
| `mix c1 c2 t` **(Live)** | a colour t of the way from c1 to c2. Takes `#rgb`, `#rrggbb` or `rgb(…)`. |
| `wave secs` **(Live)** | swings smoothly between -1 and 1, one full swing every `secs` seconds, on the game clock (a sine wave that starts at 0) |
| `every secs [ ... ]` **(Live)** | runs the block on a beat; at most 4 times in one frame |
| `shake amount` **(Live)** | shakes the screen; it settles within about a second |
| `beep pitch secs` | a short square-wave note. 440 is A. At most 6 per frame. |
| `restart yes` | starts the game over when `yes` is `true` |
| `x print` | shows x over the top of the game for 4 seconds |

---

## 12. Live coding rules (Sprout Live)

**When new code runs.**
- In the Code tab, the program is recompiled 300 ms after you stop typing.
- In Tweak, it's recompiled on every step of a number drag or colour pick.
- The Watch demo only recompiles when the brackets balance.

**What is kept when new code swaps in.** Each top-level field is checked:
- **It keeps its current value** if its starting value is the same as before. Starting values are compared by value for numbers, strings, true/false/none, lists and records.
  - So editing `update` keeps the score and every falling drop.
  - `x : W / 2` keeps its value too, because it still starts at 180.
- **It takes the new value** if you change its starting value. Change `height : 40` to `height : 90` and the sprout jumps to 90.
- **Blocks always take the new code.**
- **`every` beats** are tied to their block's code. Editing one block restarts only its beat.
- **`clock`** carries on.

**Errors never stop the game.**
- **A typo:** the last working version keeps running. The red bar names the line, and tapping it jumps there.
- **An error while running** (an unknown word, a runaway loop): the game swaps back to the last working version and names the line.
- Sprout-style messages replace JavaScript ones. For example, `"boop" isn't a word Sprout knows yet`.

**Rewind.**
- The last 600 frames (10 seconds) are saved, as a full copy of the game state each frame.
- Press ⏸ to pause, then drag the rewind bar to any saved moment.
- Code changed while paused takes effect from that moment. ▶ plays on from there with the new code, and the frames after it are dropped.

**Live values.**
- In Code and Tweak, each top-level field shows its current value in grey.
- Numbers and list sizes also show a small graph of the last ~5 seconds.
- A value is hidden when it matches what's written.

**Sharing.** The Share button makes a link ending in `#sp=` plus the source in URL-safe base64. Opening the link loads the code.

**Restart.** ↺ builds the program again from fresh starting values, and clears the rewind history.

---

## 13. How it compiles

- Each top-level statement becomes one line of JavaScript.
  - Names become `v_<name>`, with symbols spelled as hex: `touch-x` becomes `v_touch_2dx`.
  - `_` becomes `IT`.
- A cell is a JavaScript function. A cell of values carries its parts as an array of thunks with an unused slot 0; a code cell builds its parts only when `@` asks for them.
- `true` and `false` are two runtime objects, and `none` is a symbol.
- Records and maps are JavaScript `Map`s.
- Game words are passed in as functions. The runtime's `AR(fn, n)` records how many inputs a function takes.

Sprout Live adds three things on top of the compiled code:
- It wraps each top-level `let` in `__keep(...)`, which carries old values across a swap.
- It wraps each `while(` in a loop guard.
- It adds `get`, `set`, `save` and `load` so the page can read, copy and rewind the state.

---

## 14. Known limits

- **Reserved words.** `and`, `or` and `not` are now reserved. A program can still define its own and call them before their inputs (`and true false`), as the original "Closures & HOF" example does.
- **Equality.** `=` on two lists or records only says whether they are the same one, not whether they have equal contents.
- **One-item cells.** `[x]` is a cell whose one part is `x`; it gives `x` when run and `x` from `@ 1`. Only `[] append x` can have its part changed.
- **`m "k" := v` on a cell** is an error; it only works on maps and records.
- **Zero-input blocks** are called by giving them any value, for example `reset none`.
- **`print` shows full precision**, for example `0.30000000000000004`. Use `round` or `floor` before printing.
- **Tweak** can't drag numbers inside `{ }` in a template.

---

## 15. Changes Sprout Live made to the Sprout 2.0 compiler

These are marked in `sprout2.js` with "Sprout Live fix N" or "Sprout Live addition X".

### Fixes
1. `:=` inside a choice branch now runs; it used to be dropped.
2. `[| ... ]` is always a block.
3. In `each` and `collect` bodies, `:=` changes the outer field and `xs @ 2 := v` stores into the cell.
4. `each` and `collect` finish a last call that was left pending.
5. A named loop item (`xs each [d | ...]`) is set in every kind of loop.
6. `a.b.c` reads every level.
7. A block given fewer values than it takes waits for the rest.

### Additions
- **A.** A new line is a new step and a comma is a new item.
- **B.** Records `{x : 1}`.
- **C.** Dotted fields `d.x`.
- **D.** String templates `"{x}"`.
- **E.** `and`, `or`, `not`.
- **F.** Cells only: no separate lists. Cells are lazy, a value sent to a cell is its input, `@` reads and changes parts, and `_` is the only input name.

---


---

## Design decisions not yet built

1. **No dot.** `p.x` goes. A field is read by sending a message to the cell, the same way as any call or method.
2. **How a word after a cell is read.** In `p x`, the word `x` is first looked up as a field of `p`, including what `p` gets from its prototype and mixins. If `p` has no such field, `x` is a name: looked up locally, then outward, and its value is sent to `p`.
3. **No escape for a clash.** If a local's name clashes with a field, rename the local first (`v : x` then `p v`). There is no syntax for forcing the local.
4. **No `{ }`.** Records go. A cell with named fields takes their place: `[x : 1, y : 2]`.
5. **(Refined by 81.) Templates use `[ ]`.** `"[score] drops"` puts a value into a string. Write `\[` for a plain bracket.
6. **(Dropped by 81.) Template timing follows the brackets.** `"(score) drops"` puts the value in once, when the string is made. `"[score] drops"` is lazy and works it out on every read. Write `\(` and `\[` for plain brackets.
7. **Timing spreads inward.** Everything inside `[ ]` is lazy and everything inside `( )` is eager, all the way down, until the other bracket switches it. In `[x : W / 2, y : (rand 0 9)]`, `x` is worked out on each read and `y` once, when the cell is made.
8. **`( )` is a group.** It works out what is inside straight away and gives the last value: `2 + (3 * 4)` is 14. Only `[ ]` makes a cell that keeps fields.
9. **Strictly left to right, like Smalltalk.** Every chain is worked out from left to right, one send at a time, with no precedence and no other order. Word sends do not bind tighter than operators (unlike Smalltalk): `a x + r x` is `((a x) + r) x`.
10. **No top level.** A file is a cell. Its names are that cell's fields, like any other cell's.
11. **The event loop is built in.** It is core, there even when a program doesn't use it, so other features can build on it: errors and spork among them. A program's state moves from event to event through the loop, the way `update` gives back a new game each frame.
12. **Cells are immutable.** No `:=`, and no changing a part or field in place. New values come from building new cells (`with`, `..`, `collect`), and state moves through the event loop.
13. **No rebinding, for now.** A name is bound once in a cell. A second `p :` in the same cell is an error. (Parked idea: shadowing as versioned fields, with rewind as reading older versions of the file cell.)
14. **No currying.** A cell that needs several values takes one cell holding them: `circle [x, y, 10, "#fff"]`. Each send gives exactly one value.
15. **Arguments by position, by name, or both.** A body can read `_ @ 1` or `_ x`. A cell can also declare names before `|`: in `add : [x y | x + y]`, `add [3, 4]` binds `x` to 3 and `y` to 4 by position, and `add [y : 4, x : 3]` binds them by name. The names become fields of that call.
16. **A missing argument is a lint, not an error.** `add [3]` to `[x y | x + y]` gets a warning that names the missing `y`.
17. **An extra argument is a lint, not an error.** `add [3, 4, 5]` to `[x y | x + y]` gets a warning.
18. **A bare value fills a single name.** With `double : [n | n * 2]`, `double 5` binds `n` to 5.
19. **One name takes the whole value.** A cell with a single name binds whatever it is sent, cell or not: `size [3, 1, 4]` binds `xs` to the whole cell. Unpacking happens only with two or more names.
20. **A missing argument is `false`.** After `add [3]`, `y` is `false` inside the body.
21. **No `none`. `false` is the one falsy value.** Missing parts, missing fields, missing arguments and choices with no branch taken all give `false`. `false` is a real boolean, not a stand-in for nothing in general. Names before `|` can take defaults: `[x y : 0 | x + y]`, so `add [3]` gives 3.
22. **Same contents, same cell.** `=` compares by contents: `[1, 2] = [1, 2]` is true. There is no separate notion of identity.
23. **`=` never runs anything.** On lazy cells it compares the code, not worked-out values: `[random] = [random]` is true, and `[1 + 1] = [2]` is false.
24. **Names are filled in when a cell is made.** A cell doesn't keep a link to where it was made: each outside name in it is replaced by that name's value. With `make : [x | [x + 1]]`, `make 1` gives `[1 + 1]` and `make 2` gives `[2 + 1]`, so they are not equal (decision 23). A cell's own input names are not filled in.
25. **Bound before use, Pascal-style.** A name must be bound above where it is used. The one exception is a cell's own name inside its body, so `fib` can call `fib`. No forward declarations and no mutual recursion.
26. **Booleans are booleans.** Only `true` and `false` pick a branch. `lives ["playing", "game over"]` with `lives` at 3 is not a choice; it is an ordinary send of a cell to 3. Write `(lives > 0) [...]`.
27. **Unhandled sends go to method-missing.** Every value has a prototype (numbers, strings, booleans and cells each have one). A send that finds no field and no body goes to the prototype's method-missing, which decides what happens. Prototypes can be extended, so a number could be taught to handle a cell.
28. **Built-in method-missing logs and gives `false`.** An unhandled send logs an error naming the value and the message, then gives `false`, so the program carries on.
29. **`times` stays, for doing things.** `5 times [circle [(_ * 40), 100, 10, "#fff"]]` runs its body five times, with `_` counting 1 to 5. It changes nothing; it is for effects such as drawing, sound and printing.
30. **Control structures are written in Sprout.** `times`, `each`, `collect`, `fold`, `while` and the like are library cells built from recursion and choices, not core syntax. Whether the library ships `while` is left open; anyone can write one.
31. **`with` merges two cells into a new one (parts rule superseded by 45).** `ball with [y : 60]` copies `ball` with `y` changed; fields on the right win, numbered parts merge by position, and `..` adds parts on the end. The same word composes behaviour: `button with clickable with draggable`.
32. **Effects come only from the host (for now).** The host registers its effect cells (`beep`, `shake`, `circle`, `print` and so on). A cell that sends to one, directly or through other cells, is effectful; every other cell is pure. The compiler works this out, with no marking syntax, and uses it for spork routing and `memoize`.
33. **Effects are queued.** `beep [880, 0.06]` inside `update` adds to that frame's queue; the loop carries out the queue after `update` returns. On rewind or replay the loop drops queued effects. Spork and errors use the same queue: forking work is an effect, and a result or failure comes back as an event.
34. **Events are the core; frames are a library cell.** The loop hands `update` one event at a time (`tick`, `down`, `move`, `up`, keys, spork results, errors). The library cell `frame`, written in Sprout, gathers the events between ticks into one input cell and calls a frame-style `update` once per tick, so games can still read `g input touching`.
35. **`match` is a library cell.** `match [value, [key, result, key, result, ..., any, fallback]]` compares the value with each key using `=` and gives the first matching result; only that result is worked out, because the cases cell is lazy. Written in Sprout:
    ```
    match : [v cases |
      try : [n |
        n > (cases length) [false] else [
          (cases @ n) = any or ((cases @ n) = v) [cases @ (n + 1)] else [try (n + 2)]]
      ]
      try 1
    ]
    ```
36. **Operators are ordinary prototype fields.** `2 + 3` sends `+` to 2; the number prototype has a field `+` whose value is a cell that takes the right-hand side. Nothing is curried automatically: a prototype method that wants a second value says so by giving back a cell that takes it. Users can add `+` to their own prototypes, such as a vector.
37. **`left` and `right`.** Inside a prototype field's cell, `left` is the value the message was sent to and `right` is the value that cell is given:
    ```
    vector : [
      + : [right | [x : left x + (right x), y : left y + (right y)]]
    ]
    ```
38. **A field runs on read only if its cell takes no input.** `rect area` runs `area : [left w * (left h)]` and gives the number. A cell that takes an input (named, `_` or `right`) is handed back waiting: `game update` is the cell, ready to pass around, and `game update e` runs it.
39. **Methods come in through `with`.** `p : vector with [x : 1, y : 2]` gives `p` the `+` from `vector`. Since cells never change, copying and linking look the same to a program, so the runtime is free to share instead of copy.
40. **Built-ins are extended by shadowing in scope.** A file binds `number : number with [...]`; inside that file and the cells it contains, numbers use the extended prototype, and everywhere else is untouched. The `number` on the right is the outer one, so this is not a rebinding (decision 13).
41. **`..` joins, as in Lua.** `"n=" .. 4` is `"n=4"`. It replaces `++`. Templates stay for building text with values in it.
42. **`..` joins cells too.** `[1, 2] .. [3]` is `[1, 2, 3]`: the parts of the right cell go after the parts of the left.
43. **No `append`.** `drops .. [d]` adds `d` on the end.
44. **`..` merges fields like `with` (superseded by 45).** `[x : 1] .. [y : 2]` is `[x : 1, y : 2]`, and the right wins on a clash. The two differ only on parts: `..` puts the right cell's parts after the left's, while `with` lays them over the left's by position.
45. **`with` and `..` are one operation with two names.** Fields merge with the right side winning, and the right cell's parts go after the left's (no overlay by position). Use whichever reads better: `"a" .. "b"`, `drops .. [d]`, `ball with [y : 60]`, `button with clickable`.
46. **`else` gives a fallback.** `p name else "anon"` gives `p name` unless it is `false`, and then `"anon"`. The right side is only worked out when needed. `and`, `or` and `not` stay booleans-only.
47. **Spork: pure work returns, effectful work reports back.** `xs spork [f]` over a pure cell is a parallel `collect`: it gives the results straight away, and the compiler picks cores or GPU. Spork over an effectful cell is queued as an effect (decision 33); each result or failure comes back to `update` as an event, keyed by its position.
48. **Effect failures come back as error events, and the program keeps going.** A failed effect (a fetch, a spork task) is logged and arrives at `update` as an error event naming what failed. `update` may react or ignore it; nothing stops. The aim throughout is to keep running past errors.
49. **Hot-swap keeps today's rule.** New code builds a fresh file cell, then the live state is laid over it field by field: a field keeps its live value unless its starting value in the code changed (compared with `=`, which never runs anything), and cells that are code always take the new version.
50. **`every` and `wave` are pure library cells.** `every [0.3, g clock, g dt]` is `true` on frames where a 0.3-second beat lands; `wave [3, g clock]` swings between -1 and 1. Neither keeps hidden state, so rewind and hot-swap need nothing special. `shake` and `beep` are effects (decision 33).

### Decisions from rewriting `sprout.sp` (made by Claude, for review)

51. **Lazy means worked out once, on first read.** A field or part is worked out the first time it is read and then kept (call-by-need). Running a cell is always fresh. This replaces "every read" from decision F/7: `[x : rand [20, W - 20], y : -10]` keeps its `x`, and `d with [y : d y + speed]` does not build an ever-longer chain of sums frame after frame.
52. **Only methods run on read (refines 38).** A field whose cell mentions `left` is a method: reading it binds `left`, then runs it if it takes no input, or hands it back waiting for `right`. Any other cell in a field is a value and comes back as itself, so `g ball`, `g drops` and `game update` give the cell.
53. **State lives in `start`, apart from code.** A game file binds `start` (the state) beside `update` and `draw` (the code). The loop begins from `start`, a restart is just giving back `start`, and hot-swap lays the live state over the new `start` (decision 49).
54. **Outside reads are recorded.** `random`, `rand` and the clock are read like values, but the loop records what they gave each frame and plays them back on rewind and replay, so a replayed frame comes out the same. They count as not pure (decision 32).
55. **Collection words are methods.** `xs collect f`, `xs keep f`, `xs each f`, `xs fold [start, f]`, like operators (decision 36), so they chain left to right: `g drops .. new collect fall keep alive`.
56. **Name inputs in nested cells.** `_` belongs to the nearest cell around it, so `g drops each [circle [_ x, _ y, 6, "#2f7fe0"]]` would make the argument cell take an input. Inside nested brackets, name the input (`[d | circle [d x, d y, ...]]`); the linter flags `_` used that way.
57. **(Superseded by 62.) Several effects in a branch go in a group.** `bitten length > 0 [( shake 12, beep [110, 0.25] )]`: a choice reads parts 1 and 2, so a branch of several steps is one `( )` group.

58. **`!` is an argument.** `!` is a value you send, meaning "no input": `reset !` sends it to `reset`, which runs with no input. It takes the place of `reset none`. Since sends go left to right, `game reset !` reads the field, then sends it `!`.
59. **A new line plus indent is `[ ]`.** An indented block is a cell, sent as the next term of the line above: `start :` then indented fields binds a cell; `g with` then indented fields merges them; `g over` then two indented lines is a choice. The tokenizer reads a new line and its indent as one unit, so this stays streamable.
60. **(Dropped by 71.) `[[x]]` is `[x]`.** A bracket that directly wraps exactly one bracketed cell collapses into it, so an indented block inside brackets never doubles up. This is about the written brackets only: `[d]` where `d` holds a cell is still a one-part cell, so `drops .. [d]` adds `d` as one part.
61. **Named inputs keep their brackets.** A cell with input names is written `[g | ...]` even when its body is an indented block; the indent inside the brackets doesn't add a second cell (decision 60):
    ```
    play : [g |
      i : g input
      ...
    ]
    ```
62. **A boolean given a cell runs the whole cell; `else` is the other branch.** `true c` runs `c` and gives its value; `false c` gives `false`. `else` (decision 46) then supplies the other branch, and if given a cell it runs it: `x > 0 ["yes"] else ["no"]`, or `else "no"` with a plain value. An indented block under a test is one branch of any length. This replaces the two-part `[then, else]` choice, so there is one rule for booleans. Catch: if the then-branch itself gives `false`, the `else` runs too. Both are library cells.
63. **A file sees its directory.** Every other file in the same directory is a name in scope: with `physics.sp` beside it, a file writes `physics gravity`. The directory is the next scope out after the file cell, so normal lookup (decision 2) reaches it; there is no import.
64. **A folder is a cell.** Its files and subfolders are its fields: `ui button` reaches `ui/button.sp`, and `ui forms date` reaches `ui/forms/date.sp`.
65. **Lookup stops at the file's own directory.** Names are not searched for in parent folders. Past the directory come only the built-ins the host provides.
66. **Code outside the folder is copied in.** To use `physics` from a parent folder, copy the file into this folder. Every folder is self-contained, with nothing reached from outside it.
67. **`!` can attach to the word before it, and the style guide prefers that.** `hello!` is `hello !`, and `game reset!` is `game reset !`. The tokenizer splits a trailing `!` off as its own word, so names cannot end in `!`.
68. **One argument only, confirmed.** Cells do not use their arity to gather several values from a chain. Several values always travel as one argument cell: `circle [d x, d y, 6, "#2f7fe0"]`. (Explored and rejected: with no dot, every field-read argument would need parentheses, defaults blur where arguments end, and too few values would leave a waiting cell.)
69. **`!` fills every input with its default.** Sent `!`, a cell runs with each input set to its default: `add : [x : 1, y : 2 | x + y]` gives 3 from `add !`. An input with no default, `_` included, is `false` (decision 20).
70. **An indent continues an open bracket; `[[x]]` collapses only with nothing between (picked by Claude).** An indent opens a cell unless the line above ends with `[`, `(` or `|`; then the bracket is already open and the indented lines are its items. So `play : [g |` with an indented body is one cell, and `match ["tap", [` with indented cases adds no extra cell. `[[x]]` is `[x]` only when nothing sits between the two brackets, so `[x | [x : x, y : -10]]` gives back its inner cell. This replaces the collapse part of decision 61.
71. **No collapse: `[[x]]` is a cell holding a cell.** Decision 60 is dropped. Decision 70 already stops indentation from doubling brackets, and the collapse broke branches that give back a record: `lost [[x : 1, y : 2]] else [...]` now gives the record.
72. **Cells that take no input compare by value (picked by Claude).** `=` works out their parts and fields and compares those, so `[x : 1 + 1] = [x : 2]` is true and two identical squares in Snake are equal. Cells that take input still compare by code and captured values (decision 23). `[random] = [random]` is now false.

### Decisions from the voice call (19 Nov), built and tested

73. **Field/name clashes are loud.** When a word after a value is both a field of that value and a name in scope, the field still wins (decision 2), and a lint names the word and line, once. Writing the games showed the common trigger: naming a local after the state field it replaces (`body : ...` then `g body`). Rename the local (decision 3).
74. **`else` stays a plain library cell, catch included (decided by Claude, 20 Nov: Troy left the choice open, as long as every control structure stays in the library).** If a then-branch gives `false`, the `else` runs too. `else` is a cell that sees one value, so it can't tell "the test was false" from "the branch gave false". The only ways round that are a special form in the compiler, which decision 94 rules out, or a second kind of false that `else` could tell apart, which would leak into every comparison and print, against decision 21. So `else` keeps its one rule: if the left is false, the right. That is the same rule that gives `p name else "anon"` its default (decision 83). The catch is made loud instead. A branch written as `[false]` before `else` gets a lint, and so does any branch whose answer is a test (a comparison, `and`, `or`, `not`, `true`) unless the `else` gives false too, when it makes no difference. The lint names the way to keep a false answer: `cond [test, answer, any, other]`, which gives the chosen answer whatever it is (decision 84).
75. **One rule for every cell.** A cell's fields can always be read and compare by value; its body runs on a send and compares by code. A record is a cell with no body, a function a cell with no fields, and a cell can be both: `[n | doc : "doubles", n * 2]` has a readable `doc` and runs on `21`. In a cell that takes input, a binding that uses the input is a local of that run, not a field: in `[n | m : n * 2, m + 1]`, `m` can't be read from outside.
76. **Colours are cells.** `rgb [255, 0, 0]` and `rgba [0, 0, 0, 0.5]` are library cells giving colour text, so games never write colour strings with brackets. Hex strings like `"#ff6b4a"` still work.
77. **`cond` and `take` are library cells (Claude's call).** `cond [test, result, test, result, ..., any, fallback]` gives the result of the first true test, like `match` but with tests. `take [xs, n]` gives the first `n` parts.
78. **SQLite is a host cell.** `db query "select ..."` or `db query [sql, [params]]` gives a cell of records straight away; `db run [sql, [params]]` is an effect, so inside `update` it is queued, carried out after, and dropped on replay. The language stays storage-neutral.
79. **Speed roadmap (steps 1, 3 and 4 built, see 82, 91 and 87).** In order: (1) columns: records of one shape stored as flat number arrays per field; (2) loop fusion: `collect`, `keep`, `fold` chains run as one loop with no in-between lists; (3) spork sends pure numeric cells to WebAssembly with SIMD or to the GPU; (4) seeded randomness for big runs, `noise [sample, id]`, so replay needs nothing recorded. JavaScript stays the backend; a LuaJIT backend is parked.
80. **Library-level choices are Claude's to make and record**, without asking first.
81. **Only `[ ]` is a template inside a string.** `"[g score] drops"` puts a value in; `( )` is plain text, so SQL (`values (?, ?)`) and CSS (`rgba(0,0,0,0.5)`) need no escapes. Write `\[` for a plain bracket. Replaces the `( )` half of decisions 5 and 6.
82. **Columns (built; Claude's call under decision 80).** A list of 32 or more records that share one shape and hold only numbers is stored as one number array per field. A cell with one named input gets a column version of its body when the body is one of three things: `s with [...]` where each new value is number maths on `s`'s fields; a test made of number maths and comparisons; or a host word given a cell of values, such as `circle [s x, s y, 2, "#fc6"]`. `collect`, `keep` and `each` use the column version on a list in columns, and `..` keeps two such lists in columns. Anything else falls back to the ordinary way, including a field that isn't there, a word in a record and an outside name that isn't a number. So a program can't tell the difference: parts, `@`, `length`, `=` and `str` all see ordinary records (decisions 22 and 39), and the tests run both ways. `random` and other recorded reads are never moved out of the loop, so replay stays exact. The particle fountain went from 1.45 to 0.28 ms a frame, and 10,000 records times 20 updates from 11 to 1.4 ms.
83. **A read right before `else` may miss quietly (built; Claude's call, fixing a listed rough edge).** In `p name else "anon"`, `else` is the program saying the field may be missing, so a miss on that one read gives `false` without a log (decision 28). Misses anywhere else, including deeper inside the left side, still log. The prelude's `s input else fresh-input` no longer logs on a game's first event.
84. **`match` and `cond` give a `false` answer instead of falling through (built; library, decision 80).** They were written with `[answer] else [try the next case]`, so an answer of `false` set off the `else` catch (decision 74) and the search carried on, against decision 35 ("gives the first matching result"). They now find the position of the first matching case (a number, never `false`) and then give that case's answer, whatever it is. Only the chosen answer is worked out, as before. Decision 74 itself is unchanged for user code.
85. **Typos get a suggestion (built; Claude's call).** An unknown word's note names the nearest name in scope or built-in, as in `"cuont" isn't a word Sprout knows yet (did you mean "count"?)`. A missing field's note names the nearest field of that cell: `doesn't know sped (did you mean speed?)`. "Nearest" means at most 1 edit for names of 4 letters or fewer, and 2 for longer ones. A swap of two neighbouring letters counts as 1 edit. When two names are equally near, there is no suggestion.
86. **Speed notes (built; Claude's call, the editor-side lint for slow paths).** The compiler notes, for every `collect`, `keep` and `each` given a cell literal, whether its body can run over columns (decision 82), and if not, why: for example "it calls near for each item", "it works with words, not numbers" or "the body has more than one step". `load` puts the notes on the file cell as `speed`, and a game exposes them as `game speed`. The page shows a thin bar in the code's gutter, green when a loop can run over columns and amber when it runs item by item, and lists every loop with its reason in the State tab. Running item by item is fine for short lists, so the notes are information, not warnings.
87. **`noise [sample, id]` (built; step 4 of decision 79).** It gives a number from 0 up to 1, always the same for the same two inputs: a 32-bit hash of both, whole and fractional parts. It is pure, so it isn't recorded for replay (decision 54) and can run inside a column loop (decision 82). `ace-schedule.sp` uses `noise [run, atom]` instead of `random`, so a graph and a seed always give the same Monte Carlo histogram, as ACE's theory asks (7.3).
88. **`fold` can run as a tight loop (built; Claude's call, from the benchmarks).** A fold block with two named inputs whose body is number maths on them, as in `range n fold [0, [t x | t + (x * x)]]`, gets a loop version: one plain loop with no cell made per step. It is used when the list is `range n` or a list of numbers and the starting value is a number; anything else falls back to the ordinary way, so a program can't tell the difference, and the tests run both ways. Outside names that are numbers, `noise` (decision 87) and the maths words all work inside it; a branch (`... [a] else [b]`) or a call to another cell does not yet. Speed notes (decision 86) cover `fold` too. Summing 100,000 numbers went from 0.81 to 0.15 ms.
89. **Host words can take their values one by one (built; library, decision 80).** A host word may offer a direct form that takes its values as separate arguments. When an `each` loop over columns (decision 82) calls `circle [s x, s y, 2, "#fc6"]`, it uses the direct form, so no argument cell is made per shape. The program is unchanged. Drawing 10,000 particles went from 0.63 to 0.36 ms a frame; at 100,000 the time is mostly the draw list itself, about 5 ms either way.
90. **The page has SQLite and WebGPU (built; Claude's call).** In the browser, `db` (decision 78) is SQLite compiled to WebAssembly (sql.js, MIT, in `vendor/sqljs`), with the same `query` and `run` as Node's `node:sqlite`. The database is kept in the browser (IndexedDB) and saved shortly after each write. The State tab lists its tables and can clear it. It is loaded only when a program uses `db`. The game view can draw with WebGPU: every shape in a frame goes to the GPU as one instanced draw, with text on a 2D layer above it. It is used only when the browser offers WebGPU, a test scene reads back correctly, and the frames actually show; otherwise the page uses Canvas 2D, and a pill in the bar switches between them. `bench.html` times the language, the games, particles up to 100,000 on both renderers, and SQLite.
91. **Spork works a pure cell out ahead, into one numeric kernel (built; implements decision 47 and step 3 of decision 79, Claude's call under decision 80).** `xs spork f` gives the same list as `xs collect f`. When `f` is written after `spork` or bound to a name that `spork` is given, the compiler works it out once, when the program loads, as far as it can without its input. Calls are inlined, including recursion that ends without the input. Lists, records, words and `range`, `collect`, `keep`, `fold`, `first` and `@` on them are unrolled. A test that changes from run to run becomes a choice made in each run, with both sides worked out. A position in a list that changes from run to run becomes a check: it must be a whole number inside the list, or the spork runs the ordinary way. What is left is number maths on the input, `noise` included. It runs as one loop over `range n` or a list of numbers, on WebAssembly SIMD (two runs per instruction, in 64-bit floats) or else in JavaScript. Both give the same bits, so a program can't tell which way it ran, and the tests check it. Each run may give a number, true or false, or a record of numbers (kept as columns, decision 82). Anything spork can't work out ahead means `collect`, and the speed notes (decision 86) say why: `random`, a host word, text made from a value that changes, `keep` with a test that changes from run to run, recursion that depends on the input. `%`, `sin`, `cos`, `tan` and `log` keep a kernel in JavaScript, since WebAssembly has no exact match for them. Spork over an effectful cell, which reports back as events (decision 47), is not built yet. `ace-schedule.sp`'s Monte Carlo run (string ids, a walk over `requires`, triangle draws and a shared risk) becomes 155 steps: 100,000 runs take about 9 ms instead of 1.9 s.
92. **`sort` is a method (built; library, decision 80).** `xs sort` gives numbers from least to most (in the same order as JavaScript's own number sort, so -0 comes before 0 and NaN last), or words in order. Numbers are sorted by radix, about 50 ms for a million. A list of numbers from `spork` or `sort` is kept as one array of numbers, the way columns are (decision 82); to a program it is the same list. `rs collect [r | r f]` over columns gives that column straight away. A program that binds its own `sort` still uses its own, as `ace-schedule.sp` does.
93. **Big sporks can run on the GPU (built; Claude's call, from the request to use WebGPU for Monte Carlo work).** The same kernel (decision 91) becomes a WebGPU compute shader, one run per GPU thread. The GPU does 32-bit maths, so its answers can differ from SIMD and JavaScript in the last digits. A risk roll that lands right at its chance can even come out the other way, about one run in a few million. So the GPU is a host choice, not the default everywhere. The page uses it for sporks of 100,000 runs or more in a program that prints, while WebGPU works, and the State tab can turn it off. Games always use SIMD. A GPU answer arrives later, but Sprout runs straight through, so the page runs a program in passes. A spork the GPU hasn't answered stops the pass and starts the job, and when it's done the program runs again from the start and finds the answer waiting. What the stopped pass printed is dropped. A program that uses `db` doesn't wait, since its writes would happen twice. Answers are kept for the same kernel, inputs and outside numbers, so editing the rest of a program doesn't run the million runs again. Node and pages without WebGPU use SIMD. Open question for Troy: should a program be able to ask for exact answers (no GPU) itself, since the same seed can give different last digits on different machines?
94. **Every control structure is a library cell (Troy, 20 Nov).** Choosing, looping and gathering are cells and methods, not syntax. A boolean sent a cell runs it (decision 62), and `else`, `and` and `or` are prototype methods. `match`, `cond`, `take`, `every`, `wave` and `frame` are Sprout cells in the prelude. `collect`, `keep`, `fold`, `each`, `times`, `spork` and `sort` are methods, and `range` is a host cell. The compiler's inline branches, column loops and spork kernels are fast paths that give the same answers as those cells, and the tests check it. They are never a different meaning.
````

---

# Files

## sprout3.js

Compiler (Sprout to JavaScript) and runtime.

````js
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
  // keep only the steps the answer needs, numbered afresh, as a JavaScript literal
  emit(kind, outs, keys) {
    const N = this.nodes, live = new Uint8Array(N.length);
    for (const i of outs.concat(this.guards)) live[i] = 1;
    for (let i = N.length - 1; i >= 0; i--) if (live[i]) { const [, a, b, c] = N[i]; if (a >= 0) live[a] = 1; if (b >= 0) live[b] = 1; if (c >= 0) live[c] = 1; }
    const map = new Int32Array(N.length).fill(-1), out = []; let jsOnly = false;
    for (let i = 0; i < N.length; i++) if (live[i]) {
      const [op, a, b, c, v] = N[i]; map[i] = out.length;
      if (SPK_JSONLY.has(op)) jsOnly = true;
      const lit = v === undefined ? "" : "," + (typeof v === "number" ? spkNum(v) : String(v));
      out.push("[\"" + op + "\"," + (a >= 0 ? map[a] : -1) + "," + (b >= 0 ? map[b] : -1) + "," + (c >= 0 ? map[c] : -1) + lit + "]");
    }
    const g = [...new Set(this.guards)].map(i => map[i]);
    return "{nodes:[" + out.join(",") + "],outs:[" + outs.map(i => map[i]).join(",") + "],guards:[" + g.join(",") + "],kind:\"" + kind + "\"" +
      (keys ? ",keys:" + JSON.stringify(keys) : "") + ",jsOnly:" + jsOnly + "}";
  }
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
  const K = s.k, C = s.caps();
  for (let i = 0; i < C.length; i++) if (typeof C[i] !== "number") return null;
  let n, X = null;
  if (xs instanceof RCell) n = xs.n;
  else if (xs instanceof NCell) { X = xs.a; n = X.length; }
  else if (xs instanceof VCell && !(xs instanceof ColCell) && xs.fs === ROOT) {
    const p = xs.parts; n = p.length; X = new Float64Array(n);
    for (let i = 0; i < n; i++) { const v = p[i]; if (typeof v !== "number") return null; X[i] = v; }
  } else return null;
  if (n === 0) return VP([]);
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
  ADD, SUB, MUL, DIV, MOD, LT, GT, LE, GE, EQ, NE, CAT, WITH, AT, VC, VP, ISBOOL, MISSING, TAIL, SWI, shapeFor, COLC, NCOL, NATIVE: Native, NOISE };
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
````

## live3.js

Game layer: event loop, queued effects, recorded randomness, rewind, replay, hot-swap.

````js
// Sprout 3 game layer: the built-in event loop (decisions 11, 34), queued effects (33),
// recorded outside reads (54), rewind as a list of states (12), hot-swap over the new start (49, 53).
(function (root) {
"use strict";
const S = root.Sprout3 || require("./sprout3.js");
const { VCell, Native, isCell, eq, UNSET } = S;

const ev = fields => S.VFM([], new Map(Object.entries(fields)));
const NOKEYS = new VCell([]);
const DRAW = { clear: 1, rect: 5, circle: 4, line: 5, text: 5 };
const SOUND = { beep: 2, shake: 1 };

function makeGame(src, opts) {
  opts = opts || {};
  const draws = [];
  const argsOf = (a, n) => n === 1 ? [a] : (isCell(a) ? S.partsOf(a) : [a]);
  // host words: drawing happens in draw; sound and shake are effects, queued during update
  const host = { W: opts.W || 360, H: opts.H || 480 };
  for (const name in DRAW) {
    host[name] = new Native(name, a => { draws.push([name, argsOf(a, DRAW[name])]); return false; }, true);
    // the same word with its values given one by one, for column loops: no argument cell per shape
    const n = DRAW[name];
    host[name].direct = n === 1 ? (a) => { draws.push([name, [a]]); return false; } : n === 4 ? (a, b, c, d) => { draws.push([name, [a, b, c, d]]); return false; }
      : (a, b, c, d, e) => { draws.push([name, [a, b, c, d, e]]); return false; };
  }
  for (const name in SOUND) host[name] = new Native(name, a => S.effect(() => opts.onEffect && opts.onEffect([name, argsOf(a, SOUND[name])])), true);
  Object.assign(host, opts.host || {});
  if (opts.onPrint) S.setOut(opts.onPrint);

  // outside reads: the random numbers a tick used are recorded, and played back on replay (decision 54)
  let rec = null, replay = null;
  S.setRandom(() => replay ? (replay.length ? replay.shift() : 0) : (r => (rec && rec.push(r), r))(Math.random()));

  let file, handler, state, clock = 0;
  const history = [];
  function wire(f) {
    const upd = f.field("update"); if (upd === UNSET) throw new Error("the game needs an update field");
    handler = S.G.frame.run(upd); // frame update: events in, states out (decision 34)
    file = f;
  }
  wire(S.load(src, { host }));
  state = file.field("start"); if (state === UNSET) throw new Error("the game needs a start field");
  const send = e => { state = handler.run(new VCell([state, e])); };

  // one tick: update runs with effects queued; they are carried out once it returns (unless replaying)
  function tick(dt, held, replayRnd) {
    rec = replayRnd ? null : []; replay = replayRnd ? replayRnd.slice() : null;
    S.queueEffects();
    send(ev({ kind: "tick", dt, clock: clock + dt, held: held || NOKEYS }));
    if (replayRnd) S.dropEffects(); else S.runEffects();
    clock += dt;
    if (!replayRnd) { history.push({ state, rnd: rec, clock, dt, held }); if (history.length > (opts.keep || 600)) history.shift(); }
    rec = replay = null;
  }

  const api = {
    get state() { return state; }, history,
    // which collect, keep and each bodies can run over columns, from the compiler (decision 86)
    get speed() { return file.speed || []; },
    down(x, y) { send(ev({ kind: "down", x, y })); },
    move(x, y) { send(ev({ kind: "move", x, y })); },
    up() { send(ev({ kind: "up" })); },
    tick(dt, held) { tick(dt, held); return api; },
    draw() { draws.length = 0; const d = file.field("draw"); if (d !== UNSET) d.run(state); return draws; },
    // rewind: a saved frame is just the state it held, since cells never change
    rewind(i) { state = history[i].state; clock = history[i].clock; },
    // replay the tick after frame i with the random numbers it used: it comes out the same, with no effects
    replayFrom(i) { const h = history[i], next = history[i + 1]; state = h.state; clock = h.clock; tick(next.dt, next.held, next.rnd); return state; },
    // hot-swap: build the new file; keep live values whose starting value didn't change
    swap(newSrc) {
      const nf = S.load(newSrc, { host }), oldStart = file.field("start"), newStart = nf.field("start");
      const out = S.fieldsOf(state);
      for (const [k, v] of S.fieldsOf(newStart)) { const was = oldStart.field(k); if (was === UNSET || !eq(was, v)) out.set(k, v); }
      wire(nf); state = S.VFM([], out);
    },
  };
  return api;
}

const api = { makeGame };
if (typeof module !== "undefined") module.exports = api; else root.Sprout3Live = api;
})(typeof window !== "undefined" ? window : globalThis);
````

## sqlite-host.js

SQLite host cell (Node built-in node:sqlite).

````js
// SQLite as a host cell (decision 78), using the SQLite built into Node.
// Reads come back straight away as a cell of records; writes are effects, so inside update they are queued
// and carried out after it returns (decision 33), and they are dropped on replay.
//   db query "select * from atoms"
//   db query ["select * from atoms where zone = ?", [3]]
//   db run ["insert into log values (?, ?)", [t, msg]]
const S = require("./sprout3.js");

function sqliteCell(path) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(path || ":memory:");
  const split = a => {
    if (typeof a === "string") return [a, []];
    if (!S.isCell(a)) return [String(a), []];
    const ps = a.part(2);
    return [a.part(1), S.isCell(ps) ? S.partsOf(ps).map(v => v === true ? 1 : v === false ? 0 : v) : []];
  };
  const row = r => S.VFM([], new Map(Object.entries(r)));
  const query = new S.Native("query", a => { const [sql, ps] = split(a); return new S.VCell(db.prepare(sql).all(...ps).map(row)); });
  const run = new S.Native("run", a => { const [sql, ps] = split(a); return S.effect(() => db.prepare(sql).run(...ps)); }, true);
  const cell = S.VFM([], new Map([["query", query], ["run", run]]));
  cell.raw = db;
  return cell;
}
module.exports = { sqliteCell };
````

## sqlite-web.js

SQLite host cell for the browser: sql.js (SQLite in WebAssembly), kept in IndexedDB; same query and run as sqlite-host.js

````js
// SQLite in the browser as a host cell (decision 78), using sql.js (SQLite compiled to WebAssembly, in vendor/sqljs).
// It is the same cell sqlite-host.js gives Node: reads come back straight away as a cell of records;
// writes are effects, so inside update they are queued, carried out after it, and dropped on replay (decision 33).
//   db query "select * from atoms"
//   db query ["select * from atoms where zone = ?", [3]]
//   db run ["insert into log values (?, ?)", [t, msg]]
// The database is kept in this browser (IndexedDB), saved shortly after each write.
(function (root) {
"use strict";
const S = root.Sprout3;
const IDB = "sprout3-sqlite", STORE = "files";

function idb() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
async function loadBytes(name) {
  try { const d = await idb(); return await new Promise(ok => { const t = d.transaction(STORE).objectStore(STORE).get(name); t.onsuccess = () => ok(t.result || null); t.onerror = () => ok(null); }); }
  catch (e) { return null; }
}
async function saveBytes(name, bytes) {
  try { const d = await idb(); await new Promise(ok => { const t = d.transaction(STORE, "readwrite"); if (bytes) t.objectStore(STORE).put(bytes, name); else t.objectStore(STORE).delete(name); t.oncomplete = ok; t.onerror = ok; }); }
  catch (e) {}
}

// SQL values into Sprout values: there is no null in Sprout, so null is false (decision 21)
const fromSql = v => v === null || v === undefined ? false : v instanceof Uint8Array ? "[" + v.length + " bytes]" : v;
// Sprout values into SQL values: true and false are 1 and 0, anything else that isn't a number or text is its printed form
const toSql = v => v === true ? 1 : v === false ? 0 : typeof v === "number" || typeof v === "string" ? v : S.fmt(v);
// the argument of query and run: "sql", or ["sql", [params]]
function split(a) {
  if (typeof a === "string") return [a, []];
  if (!S.isCell(a)) return [String(a), []];
  const ps = a.part(2);
  return [String(a.part(1)), S.isCell(ps) ? S.partsOf(ps).map(toSql) : []];
}

let SQLP = null;
function sqljs(base) { return SQLP || (SQLP = root.initSqlJs({ locateFile: f => base + f })); }

async function openSqlite(opts) {
  opts = opts || {};
  const SQL = await sqljs(opts.base || "vendor/sqljs/");
  const name = opts.name || "sprout3";
  const bytes = opts.fresh ? null : await loadBytes(name);
  let db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  let saveT = 0, writes = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => saveBytes(name, db.export()), 300); };

  // every row of one query shares one field shape, so the records are cheap to make and to read
  const query = new S.Native("query", a => {
    const [sql, ps] = split(a), st = db.prepare(sql), out = [];
    try {
      st.bind(ps); let keys = null;
      while (st.step()) { if (!keys) keys = st.getColumnNames(); const vals = st.get(); out.push(S.VFM([], new Map(keys.map((k, i) => [k, fromSql(vals[i])])))); }
    } finally { st.free(); }
    return new S.VCell(out);
  });
  const run = new S.Native("run", a => {
    const [sql, ps] = split(a);
    return S.effect(() => { db.run(sql, ps); writes++; save(); if (opts.onWrite) opts.onWrite(sql); });
  }, true);

  const cell = S.VFM([], new Map([["query", query], ["run", run]]));
  cell.raw = () => db;
  cell.writes = () => writes;
  // what's in it: each table and how many rows it has
  cell.tables = () => {
    const t = db.exec("select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name");
    return t.length ? t[0].values.map(([n]) => [n, db.exec("select count(*) from \"" + String(n).replace(/"/g, '""') + "\"")[0].values[0][0]]) : [];
  };
  // start again with an empty database
  cell.clear = async () => { clearTimeout(saveT); db.close(); db = new SQL.Database(); await saveBytes(name, null); };
  return cell;
}

root.SproutSqlite = { openSqlite, fromSql, toSql };
})(typeof window !== "undefined" ? window : globalThis);
````

## gpu-paint.js

WebGPU renderer for the page: every shape in a frame as one instanced draw, with a self-test before use

````js
// A WebGPU painter for Sprout games. Every circle, rect and line of a frame goes into one instance buffer
// and is drawn in a single call, in the order the game drew them (later shapes on top).
// Shapes are smoothed in the fragment shader, so circles and lines have soft edges like Canvas 2D.
// Text is handed back to the caller, to draw on a 2D canvas laid over the top.
(function (root) {
"use strict";

const WGSL = `
struct U { size : vec2f, scale : f32, pad : f32, shift : vec2f, pad2 : vec2f };
@group(0) @binding(0) var<uniform> u : U;
struct VIn { @builtin(vertex_index) vi : u32, @location(0) a : vec4f, @location(1) b : vec4f, @location(2) col : vec4f };
struct VOut {
  @builtin(position) pos : vec4f, @location(0) p : vec2f,
  @location(1) @interpolate(flat) a : vec4f, @location(2) @interpolate(flat) b : vec4f, @location(3) @interpolate(flat) col : vec4f
};
// kind 0: rect (a = x1 y1 x2 y2)   kind 1: circle (a = x y r)   kind 2: line (a = x1 y1 x2 y2, b.y = width)
@vertex fn vs(v : VIn) -> VOut {
  let c = vec2f(f32(v.vi & 1u), f32(v.vi >> 1u));
  let edge = 1.0 / u.scale;
  var p : vec2f;
  if (v.b.x < 0.5) {
    p = mix(v.a.xy, v.a.zw, c);
  } else if (v.b.x < 1.5) {
    p = v.a.xy + (c * 2.0 - 1.0) * (v.a.z + edge);
  } else {
    let d = v.a.zw - v.a.xy; let len = length(d);
    var dir = vec2f(1.0, 0.0); if (len > 1e-5) { dir = d / len; }
    let nrm = vec2f(-dir.y, dir.x); let hw = v.b.y * 0.5 + edge;
    p = v.a.xy - dir * hw + dir * (len + 2.0 * hw) * c.x + nrm * (c.y * 2.0 - 1.0) * hw;
  }
  let q = (p + u.shift) * u.scale;
  var o : VOut;
  o.pos = vec4f(q.x / u.size.x * 2.0 - 1.0, 1.0 - q.y / u.size.y * 2.0, 0.0, 1.0);
  o.p = p; o.a = v.a; o.b = v.b; o.col = v.col;
  return o;
}
@fragment fn fs(i : VOut) -> @location(0) vec4f {
  var cover = 1.0;
  if (i.b.x > 0.5 && i.b.x < 1.5) {
    cover = clamp(0.5 - (distance(i.p, i.a.xy) - i.a.z) * u.scale, 0.0, 1.0);
  } else if (i.b.x > 1.5) {
    let pa = i.p - i.a.xy; let ba = i.a.zw - i.a.xy;
    let h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    cover = clamp(0.5 - (length(pa - ba * h) - i.b.y * 0.5) * u.scale, 0.0, 1.0);
  }
  let a = i.col.a * cover;
  if (a <= 0.0) { discard; }
  return vec4f(i.col.rgb * a, a);
}`;

// CSS colours to [r, g, b, a] from 0 to 1, worked out once per colour by a 2D canvas
function colourParser() {
  const c = document.createElement("canvas").getContext("2d"), cache = new Map();
  return s => {
    let v = cache.get(s); if (v) return v;
    c.fillStyle = "#000"; c.fillStyle = s; const f = c.fillStyle;
    if (f[0] === "#") v = [parseInt(f.slice(1, 3), 16) / 255, parseInt(f.slice(3, 5), 16) / 255, parseInt(f.slice(5, 7), 16) / 255, 1];
    else { const m = f.match(/[\d.]+/g) || [0, 0, 0, 1]; v = [m[0] / 255, m[1] / 255, m[2] / 255, m[3] === undefined ? 1 : +m[3]]; }
    if (cache.size > 4096) cache.clear();
    cache.set(s, v); return v;
  };
}

async function makeGpuPainter(canvas) {
  if (!root.navigator || !navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter(); if (!adapter) return null;
  const device = await adapter.requestDevice();
  const ctx = canvas.getContext("webgpu"); if (!ctx) return null;
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });
  const module = device.createShaderModule({ code: WGSL });
  const blend = { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" };
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs", buffers: [{ arrayStride: 48, stepMode: "instance", attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x4" }, { shaderLocation: 1, offset: 16, format: "float32x4" }, { shaderLocation: 2, offset: 32, format: "float32x4" }] }] },
    fragment: { module, entryPoint: "fs", targets: [{ format, blend: { color: blend, alpha: blend } }] },
    primitive: { topology: "triangle-strip" }
  });
  const ubuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const bind = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: ubuf } }] });
  const colour = colourParser(), uni = new Float32Array(8);
  let cap = 0, vbuf = null, data = null;
  const grow = n => { if (n <= cap) return; cap = 1024; while (cap < n) cap *= 2; if (vbuf) vbuf.destroy(); vbuf = device.createBuffer({ size: cap * 48, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST }); data = new Float32Array(cap * 12); };
  const str = c => typeof c === "string" ? c : String(c);
  const put = (n, a0, a1, a2, a3, kind, w, col) => { const o = n * 12, k = colour(str(col)); data[o] = a0; data[o + 1] = a1; data[o + 2] = a2; data[o + 3] = a3; data[o + 4] = kind; data[o + 5] = w; data[o + 8] = k[0]; data[o + 9] = k[1]; data[o + 10] = k[2]; data[o + 11] = k[3]; };

  // draw one frame's draw list into a texture of tw by th pixels; gives back the texts, for a 2D canvas on top
  function encode(list, view, tw, th, gw, gh, sx, sy) {
    grow(list.length + 1);
    let n = 0, clear = [0, 0, 0, 1]; const texts = [];
    for (let i = 0; i < list.length; i++) {
      const name = list[i][0], a = list[i][1];
      switch (name) {
        case "clear": if (n === 0) clear = colour(str(a[0])); else put(n++, 0, 0, gw, gh, 0, 0, a[0]); break;
        case "rect": put(n++, a[0], a[1], a[0] + a[2], a[1] + a[3], 0, 0, a[4]); break;
        case "circle": if (a[2] > 0) put(n++, a[0], a[1], a[2], 0, 1, 0, a[3]); break;
        case "line": put(n++, a[0], a[1], a[2], a[3], 2, 2, a[4]); break;
        case "text": texts.push(a); break;
      }
    }
    uni[0] = tw; uni[1] = th; uni[2] = tw / gw; uni[4] = sx || 0; uni[5] = sy || 0;
    device.queue.writeBuffer(ubuf, 0, uni);
    if (n) device.queue.writeBuffer(vbuf, 0, data, 0, n * 12);
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({ colorAttachments: [{ view, loadOp: "clear", storeOp: "store",
      clearValue: { r: clear[0] * clear[3], g: clear[1] * clear[3], b: clear[2] * clear[3], a: clear[3] } }] });
    if (n) { pass.setPipeline(pipeline); pass.setBindGroup(0, bind); pass.setVertexBuffer(0, vbuf); pass.draw(4, n); }
    pass.end();
    return { enc, texts };
  }
  function paint(list, gw, gh, sx, sy) {
    const r = encode(list, ctx.getCurrentTexture().createView(), canvas.width, canvas.height, gw, gh, sx, sy);
    device.queue.submit([r.enc.finish()]);
    return r.texts;
  }

  // a self-test before trusting the GPU: draw a known scene off screen and read three pixels back.
  // Red square on the left, green circle on the right, blue behind. Any error or a wrong pixel, and the page keeps Canvas 2D.
  async function selfTest() {
    const W = 32, tex = device.createTexture({ size: [W, W], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    const r = encode([["clear", ["#0000ff"]], ["rect", [0, 0, 16, 32, "#ff0000"]], ["circle", [24, 16, 6, "#00ff00"]]], tex.createView(), W, W, W, W, 0, 0);
    const buf = device.createBuffer({ size: 256 * W, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    r.enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: 256 }, [W, W]);
    device.queue.submit([r.enc.finish()]);
    const timeout = new Promise((_, no) => setTimeout(() => no(new Error("the GPU didn't answer")), 2000));
    await Promise.race([buf.mapAsync(GPUMapMode.READ), timeout]);
    const px = new Uint8Array(buf.getMappedRange()).slice(), bgra = format.startsWith("bgra");
    buf.unmap(); buf.destroy(); tex.destroy();
    const at = (x, y) => { const o = y * 256 + x * 4; return bgra ? [px[o + 2], px[o + 1], px[o]] : [px[o], px[o + 1], px[o + 2]]; };
    const near = (c, want) => c.every((v, i) => Math.abs(v - want[i]) < 40);
    if (!(near(at(8, 16), [255, 0, 0]) && near(at(24, 16), [0, 255, 0]) && near(at(24, 2), [0, 0, 255]))) throw new Error("the GPU drew the test scene wrong");
    return true;
  }
  // draw a list off screen and read the pixels back as RGBA rows: for tests and benchmarks
  async function snapshot(list, gw, gh, w, h) {
    const row = Math.ceil(w * 4 / 256) * 256, tex = device.createTexture({ size: [w, h], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC });
    const r = encode(list, tex.createView(), w, h, gw, gh, 0, 0), buf = device.createBuffer({ size: row * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    r.enc.copyTextureToBuffer({ texture: tex }, { buffer: buf, bytesPerRow: row }, [w, h]); device.queue.submit([r.enc.finish()]);
    await buf.mapAsync(GPUMapMode.READ);
    const raw = new Uint8Array(buf.getMappedRange()), out = new Uint8Array(w * h * 4), bgra = format.startsWith("bgra");
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * row + x * 4, o = (y * w + x) * 4; out[o] = raw[i + (bgra ? 2 : 0)]; out[o + 1] = raw[i + 1]; out[o + 2] = raw[i + (bgra ? 0 : 2)]; out[o + 3] = raw[i + 3]; }
    buf.unmap(); buf.destroy(); tex.destroy();
    return out;
  }
  // time k frames drawn off screen: the CPU cost of building and submitting each one, and the total until the GPU has finished them
  async function timeFrames(list, gw, gh, w, h, k) {
    const tex = device.createTexture({ size: [w, h], format, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }), view = tex.createView();
    const sync = device.createBuffer({ size: 256, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const t0 = performance.now(); let cpu = 0;
    for (let i = 0; i < k; i++) { const c0 = performance.now(); const r = encode(list, view, w, h, gw, gh, 0, 0); device.queue.submit([r.enc.finish()]); cpu += performance.now() - c0; }
    const e = device.createCommandEncoder(); e.copyTextureToBuffer({ texture: tex }, { buffer: sync, bytesPerRow: 256 }, [1, 1]); device.queue.submit([e.finish()]);
    await sync.mapAsync(GPUMapMode.READ); const total = performance.now() - t0;
    sync.unmap(); sync.destroy(); tex.destroy();
    return { cpu: cpu / k, total: total / k };
  }
  const info = adapter.info || {};
  const painter = { paint, snapshot, timeFrames, device, name: "WebGPU", adapter: [info.vendor, info.architecture].filter(Boolean).join(" "), done: () => device.queue.onSubmittedWorkDone() };
  await selfTest();
  return painter;
}

root.SproutGpu = { makeGpuPainter };
})(typeof window !== "undefined" ? window : globalThis);
````

## gpu-spork.js

Spork on the GPU: a kernel worked out ahead as a WebGPU compute shader (32-bit), with the page's run-again-when-the-answer-is-back passes

````js
// Spork on the GPU (decision 93): a kernel worked out ahead (decision 91) as a WebGPU compute shader.
// The GPU does 32-bit maths, so its answers can differ from WebAssembly and JavaScript in the last digits;
// the host chooses whether big sporks may use it.
// A GPU answer comes back later, but Sprout runs straight through, so the page runs a program in passes:
// a spork the GPU hasn't answered yet starts a job and stops the pass (SPORK_WAIT); when the jobs are done
// the program runs again from the start and finds the answers waiting. Games never wait: they use SIMD.
(function (root) {
"use strict";
const WAIT = { spork: "wait" };

// a 32-bit float constant, written as its exact bits (WGSL has no literal for infinity or NaN)
const f32bits = v => { const b = new Uint32Array(new Float32Array([v]).buffer)[0]; return "bitcast<f32>(0x" + b.toString(16) + "u)"; };

function wgsl(K) {
  const N = K.nodes, r = i => "v" + i, types = new Array(N.length);
  let body = "";
  for (let i = 0; i < N.length; i++) {
    const [op, a, b, c, v] = N[i]; let e, ty = "f32";
    switch (op) {
      case "c": e = f32bits(v); break;
      case "cb": e = String(v); ty = "bool"; break;
      case "x": e = "x"; break;
      case "k": e = "C[" + v + "]"; break;
      case "add": e = r(a) + " + " + r(b); break; case "sub": e = r(a) + " - " + r(b); break;
      case "mul": e = r(a) + " * " + r(b); break; case "div": e = r(a) + " / " + r(b); break;
      case "min": case "max": e = op + "(" + r(a) + ", " + r(b) + ")"; break;
      case "noise": e = "noise2(" + r(a) + ", " + r(b) + ")"; break;
      case "neg": e = "-" + r(a); break;
      case "abs": case "floor": case "ceil": case "sqrt": e = op + "(" + r(a) + ")"; break;
      case "round": e = "floor(" + r(a) + " + 0.5)"; break;
      case "lt": case "gt": case "le": case "ge": case "eq": case "ne": case "beq":
        e = r(a) + ({ lt: " < ", gt: " > ", le: " <= ", ge: " >= ", eq: " == ", ne: " != ", beq: " == " })[op] + r(b); ty = "bool"; break;
      case "and": e = r(a) + " && " + r(b); ty = "bool"; break;
      case "or": e = r(a) + " || " + r(b); ty = "bool"; break;
      case "not": e = "!" + r(a); ty = "bool"; break;
      case "sel": e = "select(" + r(c) + ", " + r(b) + ", " + r(a) + ")"; ty = types[b]; break;
      default: throw new Error("no GPU step for " + op);
    }
    types[i] = ty;
    body += "  let v" + i + ": " + ty + " = " + e + ";\n";
  }
  const guards = K.guards.length ? "  if (!(" + K.guards.map(r).join(" && ") + ")) { atomicStore(&bad, 1u); }\n" : "";
  const outs = K.outs.map((o, j) => "  O[" + (j ? j + "u * p.n + " : "") + "i] = " + (K.kind === "b" ? "select(0.0, 1.0, " + r(o) + ")" : r(o)) + ";\n").join("");
  return `struct P { n: u32, hasX: u32, nx: u32, pad: u32 }
@group(0) @binding(0) var<uniform> p: P;
@group(0) @binding(1) var<storage, read> C: array<f32>;
@group(0) @binding(2) var<storage, read> X: array<f32>;
@group(0) @binding(3) var<storage, read_write> O: array<f32>;
@group(0) @binding(4) var<storage, read_write> bad: atomic<u32>;
// noise [x, y]: the same 32-bit hash as the CPU, on 32-bit inputs
fn noise2(x: f32, y: f32) -> f32 {
  let fx = floor(x); let fy = floor(y);
  var h = ((bitcast<u32>(i32(fx)) ^ 0x9e3779b9u) * 0x85ebca6bu) ^ ((bitcast<u32>(i32(fy)) + 0x632be5abu) * 0xc2b2ae35u)
    ^ (u32(floor((x - fx) * 4294967296.0)) * 0x27d4eb2fu) ^ (u32(floor((y - fy) * 4294967296.0)) * 0x165667b1u);
  h = h ^ (h >> 16u); h = h * 0x7feb352du; h = h ^ (h >> 15u); h = h * 0x846ca68bu; h = h ^ (h >> 16u);
  return f32(h) / 4294967296.0;
}
@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) g: vec3<u32>) {
  let i = g.x + g.y * p.nx * 256u;
  if (i >= p.n) { return; }
  var x: f32 = f32(i + 1u);
  if (p.hasX == 1u) { x = X[i]; }
${body}${guards}${outs}}
`;
}
const shader = wgsl;

async function makeGpuSpork(opts) {
  opts = opts || {};
  if (typeof navigator === "undefined" || !navigator.gpu) throw new Error("this browser has no WebGPU");
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) throw new Error("no GPU adapter");
  const device = await adapter.requestDevice();
  const info = adapter.info || {};
  const layout = device.createBindGroupLayout({ entries: [
    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
    { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } }] });
  const plLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
  const pipes = new Map();
  const pipeFor = K => {
    const code = shader(K);
    let p = pipes.get(code);
    if (!p) { p = device.createComputePipelineAsync({ layout: plLayout, compute: { module: device.createShaderModule({ code }), entryPoint: "main" } }); pipes.set(code, p); }
    return p;
  };
  const MAXN = 1 << 24;   // the input is a 32-bit float: whole numbers are exact up to 2^24
  // run a kernel on n inputs: Float64Array outputs, or null if a check failed
  async function run(K, n, X, C) {
    const pipe = await pipeFor(K), nOut = K.outs.length;
    const buf = (size, usage) => device.createBuffer({ size: Math.max(16, (size + 3) & ~3), usage });
    const S = GPUBufferUsage;
    const ub = buf(16, S.UNIFORM | S.COPY_DST), cb = buf(C.length * 4, S.STORAGE | S.COPY_DST), xb = buf(X ? n * 4 : 4, S.STORAGE | S.COPY_DST);
    const ob = buf(nOut * n * 4, S.STORAGE | S.COPY_SRC), bb = buf(4, S.STORAGE | S.COPY_SRC | S.COPY_DST);
    const rb = buf(nOut * n * 4 + 16, S.MAP_READ | S.COPY_DST);
    const groups = Math.ceil(n / 256), nx = Math.min(groups, 65535), ny = Math.ceil(groups / nx);
    device.queue.writeBuffer(ub, 0, new Uint32Array([n, X ? 1 : 0, nx, 0]));
    if (C.length) device.queue.writeBuffer(cb, 0, new Float32Array(C));
    if (X) device.queue.writeBuffer(xb, 0, new Float32Array(X));
    device.queue.writeBuffer(bb, 0, new Uint32Array([0]));
    const bg = device.createBindGroup({ layout, entries: [ub, cb, xb, ob, bb].map((b, i) => ({ binding: i, resource: { buffer: b } })) });
    const enc = device.createCommandEncoder(), pass = enc.beginComputePass();
    pass.setPipeline(pipe); pass.setBindGroup(0, bg); pass.dispatchWorkgroups(nx, ny); pass.end();
    const outBytes = nOut * n * 4, off = (outBytes + 15) & ~15;
    enc.copyBufferToBuffer(ob, 0, rb, 0, outBytes);
    enc.copyBufferToBuffer(bb, 0, rb, off, 4);
    device.queue.submit([enc.finish()]);
    await rb.mapAsync(GPUMapMode.READ);
    const m = rb.getMappedRange(), f = new Float32Array(m, 0, nOut * n), failed = new Uint32Array(m, off, 1)[0] !== 0;
    const O = failed ? null : K.outs.map((o, j) => Float64Array.from(f.subarray(j * n, (j + 1) * n)));
    rb.unmap(); [ub, cb, xb, ob, bb, rb].forEach(b => b.destroy());
    return O;
  }

  // the hook spork calls: an answer already back, or (when a pass may wait) a new job and SPORK_WAIT
  const ids = new WeakMap(); let nextId = 1;
  const answers = new Map(), jobs = [];
  let mayWait = false, min = opts.min || 100000, last = null;
  const keyOf = (K, n, X, C) => {
    let id = ids.get(K); if (!id) { id = shader(K); ids.set(K, id); }
    let h = 2166136261;
    if (X) { const u = new Uint32Array(X.buffer, X.byteOffset, X.length * 2); for (let i = 0; i < u.length; i++) h = Math.imul(h ^ u[i], 16777619); }
    return id + "|" + n + "|" + (X ? "x" + (h >>> 0) : "r") + "|" + C.join(",");
  };
  function hook(K, n, X, C) {
    if (n < min || n > MAXN) return undefined;
    const key = keyOf(K, n, X, C);
    if (answers.has(key)) { const a = answers.get(key); last = a.info; return a.O; }
    if (!mayWait) return undefined;
    const t0 = performance.now();
    jobs.push(run(K, n, X, C).then(O => {
      const info = { n, ms: performance.now() - t0 };
      if (O) O.ms = info.ms;
      answers.set(key, { O, info }); while (answers.size > 8) answers.delete(answers.keys().next().value);
    }));
    throw WAIT;
  }
  return {
    hook, run, wgsl: shader, WAIT, device, adapter: [info.vendor, info.architecture || info.device].filter(Boolean).join(" ") || "available",
    get last() { return last; },
    // the page's own passes: let a spork start a job and stop the pass, then wait for the jobs
    mayWait(on) { mayWait = !!on; if (on) jobs.length = 0; },
    pending() { return Promise.all(jobs.splice(0)); },
    set min(v) { min = v; },
    // run a whole program (a function that runs it), waiting for the GPU as needed; at most a few passes
    async passes(go, onWait) {
      for (let k = 0; k < 6; k++) {
        mayWait = true; jobs.length = 0;
        try { const r = go(); mayWait = false; return r; }
        catch (e) { mayWait = false; if (e !== WAIT) throw e; }
        if (onWait) onWait();
        await Promise.all(jobs.splice(0));
      }
      return go();
    },
    forget() { answers.clear(); },
  };
}

root.SproutGpuSpork = { makeGpuSpork, wgsl: shader, WAIT };
})(typeof window !== "undefined" ? window : globalThis);
````

## test.js

Language tests, one or more per decision.

````js
// Sprout 3 tests: node test.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log("FAIL", name); } };
const logs = []; S.setLog(m => logs.push(m));
const out = []; S.setOut(s => out.push(s));
const run = src => { out.length = 0; S.load(src).run(S.BANG); return out.slice(); };
const val = src => S.fmt(S.load("result : " + src).field("result"));

// the tour gives exactly these lines
const want = ["1","1","480","20","true","7","7","3","42","long","anon","[x : 1, y : 5]","[3, 1, 4, 9]","n=4","p is at 1, 2",
  "[30, 10, 40]","[3, 4]","8","hi","hi","hi","tapped","11","hello","true","true","false","6765"];
const got = run(fs.readFileSync(__dirname + "/examples/tour.sp", "utf8"));
ok("tour", JSON.stringify(got) === JSON.stringify(want));
if (JSON.stringify(got) !== JSON.stringify(want)) console.log(got);

// one decision per line
ok("1 -- only comments", val("1 -- note") === "1");
ok("' is a word character", val("[don't : 5] don't") === "5");
ok("-2 is a number", val("3 + -2") === "1");
ok("9 left to right", val("2 + 3 * 4") === "20");
ok("8 ( ) groups", val("2 + (3 * 4)") === "14");
ok("F @ reads a part", val("[3, 1, 4] @ 3") === "4");
ok("F a number is input, not index", val("[3, 1, 4] 2") === "4");
ok("71 [[x]] holds a cell", val("[[1, 2]] @ 1") === "[1, 2]");
ok("71 a branch can give back a record", val("true [[x : 1]] else [7]") === "[x : 1]");
ok("60 [x | [..]] keeps the inner cell", val("([x | [a : x]] 5) a") === "5");
ok("51 lazy once", S.fmt(S.load("r : [rand [0, 1000]]\nresult : (r @ 1) = (r @ 1)").field("result")) === "true");
ok("51 run is fresh", val("([] .. [1]) @ 1") === "1");
ok("81 template [ ]", val('"a[1 + 1]b"') === "a2b");
{ const before = logs.length;
  ok("83 a read before else may miss quietly", val('[x : 1] name else "anon"') === "anon" && logs.length === before);
  val('[x : 1] name'); ok("83 a read without else still logs the miss", logs.length === before + 1 && /doesn't know name/.test(logs[logs.length - 1]));
  ok("83 a miss deeper inside the left side still logs", (val('[x : [y : 1]] x z w else 0'), logs.slice(before).some(m => /doesn't know z/.test(m)))); }
ok("84 match gives a false answer instead of falling through", val('match ["leaf", ["leaf", false, any, true]]') === "false" && val('match [2, [1, "a", 2, "b", any, "c"]]') === "b" && val('match [9, [1, "a"]]') === "false");
ok("84 cond too", val('cond [true, false, any, 5]') === "false" && val('cond [false, 1, 2 > 1, 2, any, 3]') === "2");
ok("84 match only works out the answer it picks", val('match [1, [1, "one", 2, nope]]') === "one");
{ const before = logs.length;
  S.load("count : 3\nresult : cuont + 1").field("result");
  S.load("result : [speed : 3] sped").field("result");
  S.load("result : zzz-not-close").field("result");
  const got = logs.slice(before).join(" | ");
  ok("typos: an unknown word suggests the nearest name", /"cuont" isn't a word Sprout knows yet \(did you mean "count"\?\)/.test(got), got);
  ok("typos: a missing field suggests the nearest field", /doesn't know sped \(did you mean speed\?\)/.test(got), got);
  ok("typos: nothing close, no suggestion", /"zzz-not-close" isn't a word Sprout knows yet( \(line \d+\))?( \||$)/.test(got), got); }
{ const lineOf = src => { try { S.load(src); return 0; } catch (e) { return e.line; } };
  ok("an unclosed [ is reported where it opened", lineOf("a : 1\nb : [2, 3\nc : 4\nd : [5]\ne : 6") === 2);
  ok("an unclosed ( too", lineOf("a : 1\nb : (2 + 3\nc : 4") === 2); }
{ const sp = S.load("xs : []\nf : [p | p x > 1]\na : xs collect [p | p with [x : p x + 1]]\nb : xs keep [p | p x > 1]\nc : xs keep [p | f p]\nd : xs collect [p | p with [x : rand [0, 1]]]\ne : xs keep [p | p name = \"a\"]").speed;
  const at = l => sp.find(n => n.line === l);
  ok("86 speed notes: a with of number maths runs over columns", at(3).fast && at(3).word === "collect" && at(4).fast && at(4).word === "keep");
  ok("86 speed notes: say why a body runs item by item", at(5).why === "it calls f for each item" && /calls something/.test(at(6).why) && at(7).why === "it works with words, not numbers", sp.map(n => n.line + " " + n.why)); }
{ const n1 = +val("noise [3, 7]"), n2 = +val("noise [3, 7]"), n3 = +val("noise [3, 8]");
  ok("87 noise: the same inputs give the same number, from 0 up to 1", n1 === n2 && n1 !== n3 && n1 >= 0 && n1 < 1);
  const xs = Array.from({ length: 2000 }, (_, k) => +val("noise [" + k + ", 1]")), mean = xs.reduce((a, b) => a + b) / xs.length;
  ok("87 noise: spread evenly", mean > 0.47 && mean < 0.53 && Math.min(...xs) < 0.01 && Math.max(...xs) > 0.99, mean);
  const prog = "ps : range 50 collect [n | [x : n, y : 0]]\nresult : ps collect [p | p with [y : noise [p x, 9]]]";
  const a = S.load(prog).field("result"); S.columns(false); const b = S.load(prog).field("result"); S.columns(true);
  ok("87 noise runs inside a column loop, with the same results", a instanceof S.ColCell && S.fmt(a) === S.fmt(b) && S.load(prog).speed.find(n => n.line === 2).fast); }
{ const both = src => { const a = S.fmt(S.load(src).field("result")); S.columns(false); const b = S.fmt(S.load(src).field("result")); S.columns(true); return [a, b]; };
  ok("fold loop: a sum over range", val("range 1000 fold [0, [t n | t + n]]") === "500500");
  ok("fold loop: over a list of numbers, with an outside name", S.fmt(S.load("k : 3\nresult : [1, 2, 3, 4] fold [0, [t n | t + (n * k)]]").field("result")) === "30");
  for (const src of ["result : range 500 fold [0, [t n | t + (n * n) - (t / 7)]]", "result : [1.5, 2, -3, 4] fold [1, [t n | t * n + 1]]", "result : range 40 fold [0, [t n | n > 20 [t + n] else [t - 1]]]", "result : range 64 fold [0, [t n | t + (noise [n, 2])]]"]) {
    const [a, b] = both(src); ok("fold loop: same answer with and without it: " + src, a === b && a !== "false"); }
  ok("fold loop: anything else still works the ordinary way", val('["a", "b"] fold ["", [t n | t .. n]]') === "ab" && val("[1, 2] fold [[], [t n | t .. [n]]]") === "[1, 2]");
  const sp = S.load("a : range 9 fold [0, [t n | t + n]]\nb : range 9 fold [0, [t n | t .. n]]").speed;
  ok("fold loop: speed notes say which folds run as a tight loop", sp.find(n => n.line === 1).fast && !sp.find(n => n.line === 2).fast && sp.every(n => n.word === "fold"), sp); }
// decision 74, decided: else keeps its one rule; a branch whose answer is a test is named, and cond keeps a false answer
{ logs.length = 0;
  const c = S.load("x : 3\na : x > 0 [x < 2] else [x = 3]\nb : x > 0 [x < 2] else [false]\nc : cond [x > 0, x < 2, any, x = 3]");
  ok("74: a branch that gives true or false before else is named", logs.length === 1 && /line 2: this branch gives true or false/.test(logs[0]) && /cond/.test(logs[0]), logs);
  ok("74: else still runs when the branch gives false, and cond keeps the false", c.field("a") === true && c.field("b") === false && c.field("c") === false);
  logs.length = 0; }
// spork (decisions 47 and 91): the same answer as collect, whichever way it runs
{ const W = S.sporkWays({}).wasm;
  const three = (src, xs, f) => {
    f = f || "f";
    const c = S.load(src + "\nA : [k | k spork " + f + "]\nB : [k | k collect " + f + "]"), a = c.field("A"), b = c.field("B");
    const L = xs || S.load("r : range 300").field("r");
    S.sporkWays({ wasm: W }); const simd = a.run(L), how1 = S.sporkInfo && S.sporkInfo.how; S.sporkWays({ info: null });
    S.sporkWays({ wasm: null }); const js = a.run(L), how2 = S.sporkInfo && S.sporkInfo.how; S.sporkWays({ wasm: W, info: null });
    const plain = b.run(L), want = S.fmt(plain);
    return { same: S.fmt(simd) === want && S.fmt(js) === want && S.eq(simd, plain), how: [how1, how2], speed: c.speed };
  };
  const kernels = {
    "number maths and noise": "f : [n | noise [n, 7] * 10 floor + (n / 3 round) - (n sqrt)]",
    "a test that changes from run to run": "f : [n | n > 150 [n * 2] else [0 - n]]",
    "else catching a false branch": "f : [n | n > 5 [n < 80] else [n = 2]]",
    "a record each run": "f : [n | [a : n * 2, b : noise [n, 1]]]",
    "calls, lists and fold worked out ahead": "w : [3, 1, 4, 1, 5]\ng : [a b | a * 10 + b]\nf : [n | w fold [0, [t x | t + (g [x, n])]]]",
    "a position that changes from run to run": "w : [3, 1, 4, 1, 5]\nf : [n | w @ (n % 5 + 1)]",
    "text and records only used ahead": "rs : [[id : \"a\", v : 3], [id : \"b\", v : 5]]\nf : [n | rs keep [r | r id = \"b\"] first v * n]",
    "clamp, toward, min and max": "f : [n | clamp [n, 50, 200] + (toward [0, 10, n / 300]) min 180 max 60]",
  };
  for (const k in kernels) { const r = three(kernels[k]); ok("spork: " + k, r.same && r.how[0] === (/%/.test(kernels[k]) ? "js" : "simd") && r.how[1] === "js", r.how); }
  // the ACE schedule's own run (strings, a walk over requires, triangle draws, a shared risk) is worked out into one kernel
  const ace = fs.readFileSync(__dirname + "/examples/ace-schedule.sp", "utf8").replace(/\nfinishes :[^\n]*/, "\nfinishes : [3]");
  const r = three(ace, S.load("r : range 3000").field("r"), "one-run");
  ok("spork: ace-schedule's Monte Carlo run, same numbers as collect", r.same && r.how[0] === "simd", r.how);
  // a position outside the list, or anything spork can't work out ahead, runs the ordinary way
  ok("spork: a position outside the list falls back", (() => { const r = three("w : [3, 1, 4]\nf : [n | (w @ n) else [0]]"); return r.same && r.how[0] === "collect" && r.how[1] === "collect"; })());
  ok("collect [r | r f] over columns gives that column", (() => { const c = S.load("rs : range 100 collect [n | [a : n, b : n * 2]]\nA : rs collect [r | r b]\nB : rs collect [r | r b + 0]"); return S.fmt(c.field("A")) === S.fmt(c.field("B")) && c.field("A") instanceof S.NCell; })());
  const rnd = S.load("f : [n | random + n]\nA : range 5 spork f").speed.find(x => x.word === "spork");
  ok("spork: speed notes say why a cell can't be worked out ahead", rnd && !rnd.fast && /random/.test(rnd.why), rnd);
  ok("spork: a cell written in place", S.fmt(S.load("A : range 40 spork [n | n * n]").field("A")) === S.fmt(S.load("A : range 40 collect [n | n * n]").field("A")));
  ok("spork: a list of numbers in, and noise bit for bit", (() => { const L = S.load("r : range 64 collect [n | n * 1.37 - 40]").field("r"); return three("f : [n | noise [n, 0 - n]]", L).same; })());
  const sorted = S.load("a : [3, 1, 2] sort\nb : [\"pear\", \"fig\"] sort\nc : range 2000 spork [n | noise [n, 1]] sort");
  ok("sort: numbers and words", S.fmt(sorted.field("a")) === "[1, 2, 3]" && S.fmt(sorted.field("b")) === "[fig, pear]");
  const c3 = sorted.field("c"); let up = true; for (let i = 2; i <= 2000; i++) if (c3.part(i) < c3.part(i - 1)) up = false;
  ok("sort: a spork's numbers, least to most", up && c3.count() === 2000 && c3 instanceof S.NCell); }
ok("and/or run a call on their right before checking it", val("[k | k > 1 and ([d | d = 3] k)] 3") === "true" && val("[k | k > 9 or ([d | d = 3] k)] 3") === "true");
ok("81 ( ) is plain text", val('"rgba(0,0,0,0.5)"') === "rgba(0,0,0,0.5)");
ok("81 escaped bracket", val('"a\\[b]"') === "a[b]");
ok("15 by position", val("[x y | x - y] [5, 2]") === "3");
ok("15 by name", val("[x y | x - y] [y : 2, x : 5]") === "3");
ok("19 one name takes the cell", val("[xs | xs length] [1, 2, 3]") === "3");
ok("20 missing is false", val("[x y | y] [1]") === "false");
ok("21 defaults", val("[x y : 10 | x + y] [1]") === "11");
ok("69 ! fills defaults", val("[x : 1, y : 2 | x + y] !") === "3");
ok("22 equal contents", val("[1, [2, 3]] = [1, [2, 3]]") === "true");
ok("72 records compare by value", val("[x : 1 + 1, y : 2] = [x : 2, y : 2]") === "true" && val("[random] = [random]") === "false");
ok("23 cells that take input compare by code", val("[n | n + 1] = [n | n + 1]") === "true" && val("[n | n + 1] = [n | n + 2]") === "false");
ok("24 names filled in", val("(([x | [y | x + y]] 1) = ([x | [y | x + y]] 2))") === "false");
ok("26 booleans only", val("3 [\"yes\"]") === "false");
ok("28 miss gives false", val("5 frobnicate") === "false");
ok("36/37 operator on a cell", S.fmt(S.load("v : [+ : [right | left with [n : left n + (right n)]]]\na : v with [n : 2]\nb : v with [n : 5]\nresult : a + b n").field("result")) === "7");
ok("38/52 method runs on read", S.fmt(S.load("r : [w : 3, h : 4, area : [left w * (left h)]]\nresult : r area").field("result")) === "12");
ok("52 a value cell comes back", S.fmt(S.load("g : [ball : [x : 1]]\nresult : g ball x").field("result")) === "1");
ok("41/42 .. joins", val('"a" .. "b" .. 3') === "ab3" && val("[1] .. [2, 3]") === "[1, 2, 3]");
ok("45 with merges fields", val("[x : 1, y : 2] with [y : 9]") === "[x : 1, y : 9]");
ok("46 else", val("false else 7") === "7" && val("4 else 7") === "4");
ok("62 a boolean runs a cell", val("1 < 2 [\"a\"] else [\"b\"]") === "a" && val("1 > 2 [\"a\"] else [\"b\"]") === "b");
ok("62 catch: then gives false", val("true [false] else [\"b\"]") === "b");
ok("35 match", val('match [2, [1, "one", 2, "two", any, "many"]]') === "two" && val('match [9, [1, "one", any, "many"]]') === "many");
ok("55 collect keep fold", val("range 5 collect [n | n * n] keep [n | n > 4] fold [0, [t n | t + n]]") === "50");
ok("29 times", run("3 times [_ print]").join() === "1,2,3");
ok("59 indent is a cell", S.fmt(S.load("box :\n  w : 3\n  h : 4\nresult : box h").field("result")) === "4");
ok("61 named inputs with an indented body", S.fmt(S.load("f : [n |\n  m : n * 2\n  m + 1\n]\nresult : f 5").field("result")) === "11");
ok("25 self-recursion and tail calls", S.fmt(S.load("count : [n acc | n = 0 [acc] else [count [n - 1, acc + n]]]\nresult : count [100000, 0]").field("result")) === "5000050000");
ok("13 bound twice is an error", (() => { try { S.load("a : 1\na : 2"); return false; } catch (e) { return /bound twice/.test(e.message); } })());
ok("50 every and wave", val("every [0.5, 1.0, 0.1]") === "true" && val("every [0.5, 0.9, 0.1]") === "false");

// voice-call decisions (73-78)
logs.length = 0; S.load("x : 1\np : [x : 5]\nresult : p x").field("result");
ok("73 a field/name clash is loud", logs.some(m => /"x" is both a field here and a name in scope/.test(m)));
ok("75 a cell that takes input still has readable fields", val("[n | doc : \"doubles\", n * 2] doc") === "doubles");
ok("75 a binding that uses the input is a local", val("[n | m : n * 2, m + 1] m") === "false");
ok("75 its body still runs", val("[n | doc : \"doubles\", n * 2] 21") === "42");
logs.length = 0; S.load("a : 1\nb : 2\nresult : true [false] else [1]");
ok("74 a false then-branch before else is flagged", logs.some(m => /gives false before else/.test(m)));
ok("76 colour cells", val("rgba [0, 0, 0, 0.5]") === "rgba(0,0,0,0.5)" && val("rgb [255, 0, 0]") === "rgb(255,0,0)");
ok("77 cond", val('cond [1 > 2, "a", 2 > 1, "b", any, "c"]') === "b" && val('cond [1 > 2, "a"]') === "false");
ok("77 take", val("take [[5, 6, 7], 2]") === "[5, 6]" && val("take [[5], 9]") === "[5]");
ok("35 match with no match gives false", val('match [9, [1, "one"]]') === "false");
{
  const { sqliteCell } = require("./sqlite-host.js");
  process.removeAllListeners("warning");
  const db = sqliteCell(":memory:");
  db.raw.exec("create table atoms(id integer, zone integer, hours real); insert into atoms values (1, 3, 8), (2, 3, 4), (3, 5, 2);");
  S.G.db = db;
  ok("78 sqlite reads give cells", S.fmt(S.load('result : db query ["select hours from atoms where zone = ?", [3]] collect [r | r hours] fold [0, [t h | t + h]]').field("result")) === "12");
  const c = S.load('w : [db run ["insert into atoms values (?, ?, ?)", [4, 9, 1]]]');
  S.queueEffects(); c.field("w").run(S.BANG);
  ok("78 writes are queued", db.raw.prepare("select count(*) n from atoms").get().n === 3);
  S.runEffects();
  ok("78 and carried out after", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  S.queueEffects(); c.field("w").run(S.BANG); S.dropEffects();
  ok("78 and dropped on replay", db.raw.prepare("select count(*) n from atoms").get().n === 4);
  delete S.G.db;
}

// 82: columns. Lists of number records are stored as columns, with exactly the same results as without them.
{
  const both = src => { const a = S.load(src).field("result"); S.columns(false); const b = S.load(src).field("result"); S.columns(true); return [a, b]; };
  const [a, b] = both(`step : [rs | rs collect [r | r with [y : r y + 1, z : r x * 2]] keep [r | (r y % 3) != 0 or (r x > 50)]]
go : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]
result : go [range 100 collect [n | [x : n, y : 0]], 5]`);
  ok("82 columns are used", a instanceof S.ColCell && !(b instanceof S.ColCell));
  ok("82 columns give the same list", S.fmt(a) === S.fmt(b) && S.eq(a, b) && S.eq(b, a) && a.count() === 50);
  ok("82 a part of a column list is a record", S.fmt(a.part(2)) === "[x : 52, y : 5, z : 104]" && a.part(0) === false && a.part(51) === false);
  const [c, d] = both(`xs : range 40 collect [n | [x : n, y : n * 2]]
result : xs collect [r | r with [x : r x + 1]] .. [[x : 0, y : 0]] .. (range 3 collect [n | [x : n, y : n]])`);
  ok("82 .. keeps columns", c instanceof S.ColCell && c.count() === 44 && S.fmt(c) === S.fmt(d));
  const [e, f] = both(`xs : range 40 collect [n | [x : n, name : "a"]]
result : xs collect [r | r with [x : r x + 1]]`);
  ok("82 a record with words stays as records", !(e instanceof S.ColCell) && S.fmt(e) === S.fmt(f));
  const [g2, h] = both(`xs : range 40 collect [n | [x : n]]
result : xs collect [r | r with [x : r nope + 1]]`);
  ok("82 a missing field falls back to the ordinary way", !(g2 instanceof S.ColCell) && S.fmt(g2) === S.fmt(h));
  // the particle fountain plays the same with and without columns
  const psrc = fs.readFileSync(__dirname + "/examples/particles.sp", "utf8");
  const play = on => {
    S.columns(on); const mr = Math.random; let seed = 7; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pg = L.makeGame(psrc); for (let t = 0; t < 150; t++) pg.tick(1 / 60);
    const dr = JSON.stringify(pg.draw()); Math.random = mr; S.columns(true);
    return [pg.state.field("sparks"), dr];
  };
  const [p1, d1] = play(true), [p2, d2] = play(false);
  ok("82 particles use columns", p1 instanceof S.ColCell && p1.count() > 1000);
  ok("82 particles play the same", S.fmt(p1) === S.fmt(p2) && d1 === d2);
}

// the game: events in, states out; effects queued; rewind, replay, hot-swap
S.setLog(() => {});
const src = fs.readFileSync(__dirname + "/examples/sprout.sp", "utf8");
const fx = [];
const g = L.makeGame(src, { onEffect: e => fx.push(e[0]) });
let maxScore = 0;
for (let f = 0; f < 900; f++) { if (f % 30 === 0) g.down(60 + (f * 7) % 240, 300); if (f % 30 === 15) g.up(); g.tick(1 / 60); maxScore = Math.max(maxScore, g.state.field("score")); }
ok("game scores", maxScore > 0);
ok("game effects are queued and carried out", fx.includes("beep"));
ok("game draws", g.draw().length > 5);
ok("replay is exact", S.fmt(g.history[100].state) === S.fmt(g.history[100].state) && S.fmt(g.history[201].state) === S.fmt(g.replayFrom(200, 1 / 60)));
const sc = g.state.field("score");
g.swap(src.replace("beep [880, 0.06]", "beep [660, 0.06]"));
ok("hot-swap keeps live state", g.state.field("score") === sc);
g.swap(src.replace("height : 40", "height : 99"));
ok("hot-swap takes a changed start value", g.state.field("height") === 99);

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
````

## game-tests.js

Headless game tests.

````js
// Headless tests for the example games: node game-tests.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log("FAIL", name, extra === undefined ? "" : extra); } };
const logs = []; S.setLog(m => logs.push(m));
const game = (name, opts) => L.makeGame(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8"), opts);
const held = keys => S.VFM([], new Map(keys.map(k => [k, true])));
const f = (g, k) => g.state.field(k);

// ---------------- Bounce
{
  const fx = [], g = game("bounce", { onEffect: e => fx.push(e[0]) });
  // follow the ball with a finger: it keeps bouncing and the score climbs
  let hits = 0;
  for (let t = 0; t < 1200; t++) { g.down(f(g, "ball").field("x"), 400); g.tick(1 / 60); }
  ok("bounce: following the ball scores", f(g, "score") >= 3, f(g, "score"));
  ok("bounce: hits beep", fx.filter(x => x === "beep").length >= 3);
  // let go: the ball is lost, score resets, best remembers
  g.up();
  const before = f(g, "score");
  for (let t = 0; t < 600; t++) { g.down(0, 400); g.tick(1 / 60); }
  ok("bounce: missing resets the score", f(g, "score") < before || before === 0, f(g, "score"));
  ok("bounce: best is kept", f(g, "best") >= before, [f(g, "best"), before]);
  ok("bounce: draws 5 things", g.draw().length === 5);
}

// ---------------- Snake
{
  const fx = [], g = game("snake", { onEffect: e => fx.push(e[0]) });
  // food sits 4 squares ahead: going straight eats it
  for (let t = 0; t < 40; t++) g.tick(1 / 60);
  ok("snake: moves on the beat", f(g, "body").part(1).field("x") > 5, S.fmt(f(g, "body").part(1)));
  for (let t = 0; t < 40; t++) g.tick(1 / 60);
  ok("snake: eats and grows", f(g, "score") === 1 && f(g, "body").count() === 4, [f(g, "score"), f(g, "body").count()]);
  ok("snake: eating beeps", fx.includes("beep"));
  // wraps around the right edge
  for (let t = 0; t < 120; t++) g.tick(1 / 60);
  const hx = f(g, "body").part(1).field("x");
  ok("snake: wraps around", hx >= 0 && hx < 20, hx);
  // turning: down then left then up bites a long enough snake
  const g2 = game("snake");
  g2.swap(fs.readFileSync(__dirname + "/examples/snake.sp", "utf8").replace("body : [[x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]",
    "body : [[x : 8, y : 10], [x : 7, y : 10], [x : 6, y : 10], [x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]").replace("food : [x : 9, y : 10]", "food : [x : 0, y : 0]"));
  const steer = (keys, n) => { for (let t = 0; t < n; t++) g2.tick(1 / 60, held(keys)); };
  steer(["down"], 8); steer(["left"], 8); steer(["up"], 8);
  ok("snake: biting yourself ends the game", f(g2, "over") === true, S.fmt(f(g2, "body")));
  g2.down(10, 10); g2.tick(1 / 60);
  ok("snake: a tap starts again", f(g2, "over") === false && f(g2, "score") === 0);
  ok("snake: can't reverse", (() => { const g3 = game("snake"); g3.tick(1 / 60, held(["left"])); return f(g3, "dx") === 1; })());
}

// ---------------- Breakout
{
  const g = game("breakout");
  ok("breakout: 40 bricks", f(g, "bricks").count() === 40);
  const b1 = f(g, "bricks").part(1), b40 = f(g, "bricks").part(40);
  ok("breakout: wall layout", b1.field("x") === 4 && b1.field("y") === 60 && b40.field("x") === 312 && b40.field("y") === 140, [S.fmt(b1), S.fmt(b40)]);
  for (let t = 0; t < 3000; t++) { g.down(f(g, "ball").field("x"), 400); g.tick(1 / 60); }
  ok("breakout: bricks break and score", f(g, "bricks").count() < 40 && f(g, "score") === 40 - f(g, "bricks").count(), [f(g, "bricks").count(), f(g, "score")]);
  ok("breakout: following the ball keeps lives", f(g, "lives") === 3, f(g, "lives"));
  const g2 = game("breakout");
  for (let t = 0; t < 600; t++) { g2.down(0, 400); g2.tick(1 / 60); }
  ok("breakout: missing loses lives", f(g2, "lives") < 3, f(g2, "lives"));
  const g3 = game("breakout"); let lost = 0, prev = 3;
  for (let t = 0; t < 400 && !lost; t++) { g3.down(0, 400); g3.tick(1 / 60); if (f(g3, "lives") < prev) { lost++; prev = f(g3, "lives"); } }
  for (let t = 0; t < 20; t++) { g3.down(0, 400); g3.tick(1 / 60); if (f(g3, "lives") < prev) { lost++; prev = f(g3, "lives"); } }
  ok("breakout: one miss costs one life", lost === 1 && f(g3, "lives") === 2, [lost, f(g3, "lives")]);
  ok("breakout: the ball comes back after a miss", typeof f(g2, "ball").field("x") === "number", S.fmt(f(g2, "ball")));
}

// ---------------- Fireflies
{
  const g = game("fireflies");
  for (let t = 0; t < 300; t++) g.tick(1 / 60);
  ok("fireflies: they hatch up to the count, stored as columns", f(g, "flies").count() === 400 && f(g, "flies") instanceof S.ColCell, f(g, "flies").count());
  const spread = () => { const p = S.partsOf(f(g, "flies")); return p.reduce((a, r) => a + Math.hypot(r.field("x") - 80, r.field("y") - 120), 0) / p.length; };
  const before = spread();
  g.down(80, 120); for (let t = 0; t < 240; t++) g.tick(1 / 60);
  ok("fireflies: holding a finger down gathers them", spread() < before * 0.6, [before, spread()]);
  ok("fireflies: two circles each", g.draw().length === 2 + 800 + 1);
}

// ---------------- Orbit
{
  const fx = [], g = game("orbit", { onEffect: e => fx.push(e[0]) });
  const fling = (x, y, x2, y2) => { g.down(x, y); g.tick(1 / 60); for (let k = 1; k <= 10; k++) { g.move(x + (x2 - x) * k / 10, y + (y2 - y) * k / 10); g.tick(1 / 60); } g.up(); g.tick(1 / 60); };
  fling(180, 120, 132, 120);
  for (let t = 0; t < 900; t++) g.tick(1 / 60);
  ok("orbit: a sideways throw stays in orbit", f(g, "moons").count() === 1 && f(g, "lost") === 0, [f(g, "moons").count(), f(g, "lost")]);
  fling(180, 60, 180, 30);
  for (let t = 0; t < 300; t++) g.tick(1 / 60);
  ok("orbit: a throw straight at the sun falls in", f(g, "moons").count() === 1 && f(g, "lost") === 1 && fx.includes("shake"), [f(g, "moons").count(), f(g, "lost")]);
}

// ---------------- Life
{
  const g = game("life");
  const live = b => S.partsOf(b).filter(v => v === 1).length;
  ok("life: starts with the glider and the R-pentomino", live(f(g, "board")) === 10);
  const blink = L.makeGame(fs.readFileSync(__dirname + "/examples/life.sp", "utf8").replace(/seed : .*/, "seed : [[5, 5], [6, 5], [7, 5]]"));
  const b0 = S.fmt(f(blink, "board"));
  for (let t = 0; t < 7; t++) blink.tick(1 / 60);
  const b1 = S.fmt(f(blink, "board"));
  for (let t = 0; t < 6; t++) blink.tick(1 / 60);
  ok("life: a blinker flips and flips back", f(blink, "generation") === 2 && b1 !== b0 && S.fmt(f(blink, "board")) === b0, f(blink, "generation"));
  const n0 = live(f(g, "board"));
  g.down(200, 300); g.tick(1 / 60); g.move(230, 300); g.tick(1 / 60);
  ok("life: drawing brings squares to life and stops time", live(f(g, "board")) === n0 + 2 && f(g, "generation") === 0, live(f(g, "board")));
}

// ---------------- Hop
{
  const src = fs.readFileSync(__dirname + "/examples/hop.sp", "utf8");
  const place = (x, y, vx, vy) => L.makeGame(src.replace("ship : [x : 70, y : 70, vx : 40, vy : 0]", "ship : [x : " + x + ", y : " + y + ", vx : " + vx + ", vy : " + vy + "]"));
  const soft = place(220, 420, 0, 5); for (let t = 0; t < 60; t++) soft.tick(1 / 60);
  ok("hop: a gentle landing on the pad scores", f(soft, "phase") === "landed" && f(soft, "score") === 150 && f(soft, "best") === 150, [f(soft, "phase"), f(soft, "score")]);
  const hard = place(220, 300, 0, 120); for (let t = 0; t < 60; t++) hard.tick(1 / 60);
  ok("hop: coming down too fast crashes", f(hard, "phase") === "crashed" && f(hard, "score") === 0);
  const off = place(60, 420, 0, 5); for (let t = 0; t < 60; t++) off.tick(1 / 60);
  ok("hop: missing the pad crashes", f(off, "phase") === "crashed");
  const fire = place(220, 200, 0, 60); for (let t = 0; t < 40; t++) fire.tick(1 / 60, held(["up"]));
  ok("hop: the engine slows the fall and uses fuel", f(fire, "ship").field("vy") < 10 && f(fire, "fuel") < 100 && f(fire, "burning") === true);
  // a careful pilot: steer toward the pad, and brake late
  const g = game("hop"); const rounds = [];
  for (let r = 0; r < 3; r++) {
    for (let t = 0; t < 5000 && f(g, "phase") === "flying"; t++) {
      const s = f(g, "ship"), x = s.field("x"), y = s.field("y"), vx = s.field("vx"), vy = s.field("vy");
      const want = Math.max(-22, Math.min(22, (f(g, "pad-x") - x) * 0.6));
      const brake = vy > 0 && vy * vy > 2 * 85 * Math.max(1, 416 - y) * 0.6 || vy > 40, side = Math.abs(vx - want) > 3;
      if (brake || side) g.down(x + (side ? (vx > want ? 60 : -60) : 0), y + 40); else g.up();
      g.tick(1 / 60);
    }
    rounds.push(f(g, "phase"));
    g.up(); g.tick(1 / 60); g.down(5, 5); g.tick(1 / 60); g.up(); g.tick(1 / 60);
  }
  ok("hop: a careful pilot lands round after round", rounds.join() === "landed,landed,landed" && f(g, "best") > 200, [rounds, f(g, "best")]);
}

// ---------------- Recipes (a program, not a game)
{
  const lines = []; S.setOut(s => lines.push(s));
  S.load(fs.readFileSync(__dirname + "/examples/recipes.sp", "utf8")).run(S.BANG);
  S.setOut(() => {});
  const want = ["[1, 1, 3, 4, 5, 8, 9]", "[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]", "[1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz]",
    "tuorps", "true", "111", "[1]", "[1, 1]", "[1, 2, 1]", "[1, 3, 3, 1]", "[1, 4, 6, 4, 1]", "[1, 5, 10, 10, 5, 1]", "5", "12, 16", "[mon, tue, wed]",
    "[work, work, work, work, work, rest, rest]"];
  ok("recipes: every answer", JSON.stringify(lines) === JSON.stringify(want), lines);
}

// ---------------- ACE (the Atomic Constraint Engine) examples
{
  const printed = name => { const lines = []; S.setOut(x => lines.push(x)); S.load(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8")).run(S.BANG); S.setOut(() => {}); return lines; };
  const d = printed("ace-derive");
  ok("ace-derive: done is derived, 4 of 11 today", d.includes("done      4 of 11") && d.some(l => l.startsWith("[ ] gate      RFI: splice length") && l.endsWith("waits on eng-reply")));
  ok("ace-derive: the gate closes itself once the reply is in", d.includes("workable  rebar-on-site, eng-reply") && d.includes("workable  place-rebar") && d.includes("done      7 of 11"), d.filter(l => l.startsWith("workable")));
  ok("ace-derive: a signed inspection isn't done until it has a narrative", d.some(l => l.startsWith("[!] verified  Pre-pour inspection") && l.endsWith("closed, but needs a narrative")) && d.includes("done      8 of 11"));
  ok("ace-derive: writing it up closes it and frees the pour", d.includes("done      9 of 11") && d.includes("workable  pour"));
  const sc = printed("ace-schedule");
  ok("ace-schedule: the critical path", sc.includes("finish on day 21, through rebar > place-rebar > inspect > pour > cure"), sc.find(l => l.startsWith("finish")));
  const p = sc.find(l => l.startsWith("P10")), nums = (p || "").match(/\d+/g).map(Number);
  ok("ace-schedule: monte carlo percentiles in order, and later than the likely plan", nums.length === 8 && nums[1] >= 21 && nums[1] <= nums[3] && nums[3] <= nums[5] && nums[5] <= nums[7] && nums[3] > 21, p);

  ok("ace-schedule: seeded, so the same graph and seed give the same histogram", JSON.stringify(sc) === JSON.stringify(printed("ace-schedule")) && sc.includes("P10 day 22   P50 day 25   P80 day 28   P90 day 29"), sc.find(l => l.startsWith("P10")));
  ok("ace-schedule: cost is a view of crews, rates, time, materials and equipment", sc.includes("labour     $58,900    crews x days x $950") && sc.includes("budget     $149,535"));
  ok("ace-schedule: earned value on the status day", sc.includes("SPI 0.83  behind schedule") && sc.includes("CPI 0.96  over budget") && sc.includes("forecast at completion  $156,284  (budget / CPI)"), sc.filter(l => /SPI|CPI|forecast/.test(l)));
  const mo = printed("ace-morning");
  ok("ace-morning: what changed since yesterday", mo.includes("cleared   Conduit delivered, Excavate north footings") && mo.includes("can start Form north footings") && mo.includes("ready     1 package, 220 hours"));
  ok("ace-morning: constraints ranked by the hours they release", mo.includes("1. South access road              180 h   1 package   <- this one first") && mo.some(l => l.startsWith("2. Electrical drawings rev C")) && mo.some(l => l.startsWith("4. RFI 118: grounding depth")), mo.slice(4, 10));
  ok("ace-morning: a pair that only releases work together", mo.includes("   RFI 112: splice length         with Rebar delivery, north: 260 h") && mo.includes("   Anchor bolts                   waits on other work first"));
  const src = fs.readFileSync(__dirname + "/examples/ace-board.sp", "utf8"), AT = S.partsOf(S.load(src).field("atoms"));
  const fx = [], b = L.makeGame(src, { onEffect: e => fx.push(e[0]) });
  const tapOn = id => { const a = AT.find(r => r.field("id") === id); b.down(a.field("x") + 50, a.field("y") + 18); b.tick(1 / 60); b.up(); b.tick(1 / 60); return f(b, "msg"); };
  const header = () => { const t = b.draw().filter(x => x[0] === "text"); return t[t.length - 3][1][0]; };
  b.tick(1 / 60);
  ok("ace-board: starts 3 of 11 done, 14 days of work", header() === "ACE  3/11 done  ·  14d of work left", header());
  ok("ace-board: blocked work can't be closed", tapOn("place") === "place rebar waits on dig, rebar, rfi" && fx.includes("shake"));
  ok("ace-board: a gate isn't tapped", tapOn("rfi") === "RFI: splice is a gate: it closes by itself");
  for (const id of ["dig", "rebar", "reply", "place"]) tapOn(id);
  ok("ace-board: verified needs the work and then a witness", tapOn("inspect") === "inspection done: now tap again to sign" && tapOn("inspect") === "inspection signed: now write it up");
  ok("ace-board: a signed inspection still needs its write-up", tapOn("inspect") === "write up the inspection first: choose below" && !header().startsWith("ACE  9/"));
  const tapAt = (x, y) => { b.down(x, y); b.tick(1 / 60); b.up(); b.tick(1 / 60); return f(b, "msg"); };
  ok("ace-board: written up as nominal, it closes", tapAt(60, 445) === "inspection written up: nominal" && header().startsWith("ACE  9/11 done"), header());
  tapOn("forms"); tapOn("pour");
  ok("ace-board: everything done, nothing left", header() === "ACE  11/11 done  ·  0d of work left", header());
  // narrative is structure: an inspection that finds rework adds an atom the pour has to wait for
  const r = L.makeGame(src); r.tick(1 / 60);
  const rtap = id => { const a = AT.find(x => x.field("id") === id); r.down(a.field("x") + 50, a.field("y") + 18); r.tick(1 / 60); r.up(); r.tick(1 / 60); return f(r, "msg"); };
  const rhead = () => { const t = r.draw().filter(x => x[0] === "text").map(x => x[1][0]); return t.find(x => x.startsWith("ACE")); };
  for (const id of ["dig", "rebar", "reply", "place", "inspect", "inspect", "forms"]) rtap(id);
  r.down(175, 445); r.tick(1 / 60); r.up(); r.tick(1 / 60);
  ok("ace-board: finding rework adds an atom to the graph", f(r, "msg") === "inspection found rework: new work joins the graph" && rhead().startsWith("ACE  10/12 done"), rhead());
  ok("ace-board: and the pour waits for it", rtap("pour") === "pour waits on rework");
  r.down(296, 284); r.tick(1 / 60); r.up(); r.tick(1 / 60);
  ok("ace-board: once the rework is done, the pour can go", rtap("pour") === "closed pour" && rhead() === "ACE  12/12 done  ·  0d of work left", rhead());
  ok("ace-board: reopening the inspection takes the added atom away", rtap("inspect") === "reopened inspection" && / \d+\/11 done/.test(rhead()) && f(r, "story") === "", rhead());
  tapOn("dig");
  ok("ace-board: reopening upstream work reopens what depends on it", /^ACE  \d\/11 done/.test(header()) && !header().startsWith("ACE  11/11"), header());

  const siteSrc = fs.readFileSync(__dirname + "/examples/ace-site.sp", "utf8");
  const fx2 = [], st = L.makeGame(siteSrc, { onEffect: e => fx2.push(e[0]) });
  const size = x => { st.down(x, 200); st.tick(1 / 60); st.up(); st.tick(1 / 60); return [f(st, "rb-d"), f(st, "failing")]; };
  const failing = g => g.draw().filter(d => d[0] === "text").map(d => d[1][0]).filter(t => t.startsWith("FAIL "));
  st.tick(1 / 60);
  ok("ace-site: every constraint holds at 46 m", f(st, "failing") === 0 && failing(st).length === 0);
  ok("ace-site: a bigger reactor stretches the cable run first", JSON.stringify(size(270)) === "[55,1]" && failing(st)[0] === "FAIL must: cable run under 65 m", failing(st));
  ok("ace-site: then the service building hits the fuel bay", JSON.stringify(size(300)) === "[58,2]" && fx2.includes("shake"));
  ok("ace-site: and the turbine hall leaves the site", JSON.stringify(size(359)) === "[65,3]");
  ok("ace-site: too small breaks the design basis", JSON.stringify(size(0)) === "[25,1]" && failing(st)[0] === "FAIL must: reactor at least 36 m across");
  const narrow = L.makeGame(siteSrc.replace("gap : 15", "gap : 10")); narrow.tick(1 / 60);
  ok("ace-site: a narrow road fails the fire rule", failing(narrow).join() === "FAIL must: fire road at least 12 m wide");
}

// ---------------- ACE crews: capacity constraints
{
  const src = fs.readFileSync(__dirname + "/examples/ace-crews.sp", "utf8");
  const statusOf = g => S.partsOf(f(g, "packages")).map(p => p.field("status"));
  const runOut = g => { for (let t = 0; t < 4000 && statusOf(g).some(x => x !== "done"); t++) g.tick(0.05); return f(g, "day"); };
  const all = L.makeGame(src);
  ok("ace-crews: with every crew, the slab is done on day 23", runOut(all) === 23, f(all, "day"));
  const rows = S.partsOf(f(all, "packages"));
  const rec = id => rows.find(p => p.field("id") === id);
  ok("ace-crews: a package starts only after what it requires", rec("pour").field("begun") >= rec("embeds").field("ended") && rec("rebar").field("begun") >= rec("piles").field("ended"));
  ok("ace-crews: each package is done by a crew of its trade", rows.every(p => p.field("crew").startsWith(p.field("trade"))));
  const chip = n => [(n - 1) * 86 + 48, 440];
  const g = L.makeGame(src); g.tick(0.05);
  g.down(...chip(3)); g.tick(0.05); g.up(); g.tick(0.05);
  ok("ace-crews: tapping a crew sends it home", f(g, "crews").part(3).field("on") === false);
  for (let t = 0; t < 4000 && f(g, "day") < 10; t++) g.tick(0.05);
  const notes = g.draw().filter(d => d[0] === "text").map(d => d[1][0]);
  ok("ace-crews: work that needs a crew that isn't there says so", notes.includes("needs an iron crew") && rows.length === 10, notes.filter(x => /crew/.test(x)));
  g.down(...chip(3)); g.tick(0.05); g.up(); g.tick(0.05);
  ok("ace-crews: the slab slips while the iron crew is away", runOut(g) > 23, f(g, "day"));
}

// ---------------- ACE ledger: SQLite (node:sqlite here, sql.js on the page)
{
  const { sqliteCell } = require("./sqlite-host.js");
  const saved = S.G.db; S.G.db = sqliteCell(":memory:");
  const src = fs.readFileSync(__dirname + "/examples/ace-ledger.sp", "utf8");
  const day = () => { const lines = []; S.setOut(x => lines.push(x)); S.load(src).run(S.BANG); S.setOut(() => {}); return lines; };
  const d1 = day(), d2 = day(), d3 = day();
  ok("ace-ledger: each run is a day, and the database remembers", d1[0] === "== day 1 ==" && d3[0] === "== day 3 ==" && d3.includes("day 1  closed Survey and layout") && d3.includes("day 3  closed Rebar delivered"), d3);
  ok("ace-ledger: what's workable is derived from the rows", d3.some(l => l.startsWith("[>] Place rebar")) && d3.some(l => l.startsWith("[ ] Pre-pour inspection")));
  for (let k = 0; k < 4; k++) day();
  const end = day();
  ok("ace-ledger: it finishes, and the log keeps every day", end.includes("the pedestal is finished") && S.G.db.raw.prepare("select count(*) n from events").get().n === 6);
  S.G.db = saved;
}

// ace-risk: a million runs through spork (decision 91); with fewer runs, the whole program prints the same with collect
{
  const src = fs.readFileSync(__dirname + "/examples/ace-risk.sp", "utf8");
  const run = text => { const lines = []; S.setOut(x => lines.push(x)); S.load(text).run(S.BANG); S.setOut(() => {}); return lines; };
  const full = run(src), info = S.sporkInfo;
  ok("ace-risk: a million runs, as one kernel", full[0] === "== 1000000 runs of the pedestal job ==" && info.n === 1000000 && info.how === "simd", info);
  const p = (full[1].match(/[\d.]+/g) || []).map(Number);
  ok("ace-risk: P10 to P90 in order", p.length === 8 && p[1] < p[3] && p[3] < p[5] && p[5] < p[7], full[1]);
  const adds = full.filter(l => /\+[\d.]+ days$/.test(l));
  ok("ace-risk: what each risk adds at P80, weather the most", adds.length === 4 && adds[0].startsWith("wet weather on the pour") && Math.max(...adds.map(l => +l.match(/\+([\d.]+)/)[1])) === +adds[0].match(/\+([\d.]+)/)[1], adds);
  const small = src.replace("runs : 1000000", "runs : 3000");
  ok("ace-risk: spork prints exactly what collect prints", JSON.stringify(run(small)) === JSON.stringify(run(small.replace("range runs spork one-run", "range runs collect one-run"))));
}

const errs = logs.slice();
ok("no unexpected runtime messages", errs.length === 0, errs.slice(0, 5));
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
````

## bench.js

Benchmarks against the old Sprout 2.0 compiler and plain JS.

````js
const S3=require('./sprout3.js');const O=require('./old-sprout2.js');const L=require('./live3.js');const fs=require('fs');
S3.setLog(()=>{});S3.setOut(()=>{});
const best=(f,n=5)=>{let b=1e9,r;for(let i=0;i<n;i++){const t=performance.now();r=f();b=Math.min(b,performance.now()-t)}return [b,r]};
function old(src){const js=O.SproutToJS.compile(src);const R=O.SproutRuntime;const names=Object.keys(R);
  const fn=new Function(...names,'prnt','v_print',js+';\nreturn typeof v_result!=="undefined"?v_result:null');return ()=>fn(...names.map(k=>R[k]),x=>x,x=>x)}
const B={
 fib:{s3:`fib : [n | n < 2 [n] else [fib (n - 1) + (fib (n - 2))]]\nresult : fib 25`,
      old:`fib : [n | n < 2 [n, (fib (n - 1)) + (fib (n - 2))]]\nresult : fib 25`,
      js:()=>{const f=n=>n<2?n:f(n-1)+f(n-2);return f(25)}},
 fold:{s3:`result : range 1000000 fold [0, [t n | t + n]]`,
      old:`xs : range 1000000\nresult : xs fold 0 [t, x | t + x]`,
      js:()=>{let t=0;for(let i=1;i<=1e6;i++)t+=i;return t}},
 records:{s3:`step : [rs | rs collect [r | r with [y : r y + 1]] keep [r | r y > 0]]
go : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]
result : go [range 10000 collect [n | [x : n, y : 0]], 20] length`,
      old:`rs : range 10000 collect [{x : _, y : 0}]
20 times [rs := rs collect [r | {x : r.x, y : r.y + 1}]]
result : rs length`,
      js:()=>{let rs=[];for(let i=1;i<=1e4;i++)rs.push({x:i,y:0});for(let k=0;k<20;k++)rs=rs.map(r=>({...r,y:r.y+1})).filter(r=>r.y>0);return rs.length}},
};
const rows=[];
for(const [name,b] of Object.entries(B)){
  const c3=S3.load(b.s3);const r3=best(()=>{c3._a=null;return c3.field("result")},9);
  const fo=old(b.old);const ro=best(fo,9);const rj=best(b.js,9);
  rows.push([name,r3[0].toFixed(1),ro[0].toFixed(1),rj[0].toFixed(2),S3.fmt(r3[1]),String(ro[1]),String(rj[1])]);
}
// game: ms per frame
const src=fs.readFileSync('examples/sprout.sp','utf8');
const g=L.makeGame(src);g.down(100,300);for(let f=0;f<300;f++)g.tick(1/60);
const [gt]=best(()=>{for(let f=0;f<1000;f++){g.tick(1/60);g.draw()}},9);
rows.push(['game x1000',gt.toFixed(1),'','','ms/frame '+(gt/1000).toFixed(3),'','']);
console.log('bench        sprout3(ms) old2.0(ms) js(ms)   results s3 / old / js');
for(const r of rows)console.log(r[0].padEnd(12),r[1].padStart(10),r[2].padStart(10),r[3].padStart(8),'  ',r[4],'/',r[5],'/',r[6]);
````

## frame-bench.js

Milliseconds per frame for each example game.

````js
// ms per frame (update + draw) for each example game: node frame-bench.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
S.setLog(() => {});
const games = ["sprout", "bounce", "snake", "breakout", "particles", "fireflies", "orbit", "life", "hop"];
const rows = [];
for (const name of games) {
  const g = L.makeGame(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8"));
  const play = n => { for (let t = 0; t < n; t++) { if (t % 50 === 0) g.down(100 + (t % 160), 300); if (t % 50 === 25) g.up(); g.tick(1 / 60); g.draw(); } };
  play(300);
  let best = 1e9;
  for (let r = 0; r < 7; r++) { const t0 = performance.now(); play(300); best = Math.min(best, (performance.now() - t0) / 300); }
  const st = g.state, size = name === "particles" ? st.field("sparks").count() : "";
  rows.push([name, best.toFixed(4), size]);
}
console.log("game        ms/frame   (16.7 ms budget)");
for (const r of rows) console.log(r[0].padEnd(11), r[1].padStart(8), r[2] ? "  " + r[2] + " particles" : "");
````

## run3.js

Run a .sp file: node run3.js examples/tour.sp.

````js
const S=require('./sprout3.js'),fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
try{const c=S.load(src);c.run(S.BANG)}catch(e){console.log('ERROR',e.message,e.line||'');if(process.argv[3])console.log(e.stack)}
````

## game-test.js

Quick headless run of sprout.sp.

````js
const L=require('./live3.js'),S=require('./sprout3.js'),fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'examples/sprout.sp','utf8');
const g=L.makeGame(src,{onEffect:e=>{eff[e[0]]=(eff[e[0]]||0)+1}});const eff={};
let x=180;
for(let f=0;f<1200;f++){
  if(f%40===0){x=40+Math.random()*280;g.down(x,300)} if(f%40===20)g.up();
  g.tick(1/60); if(f%300===0){const d=g.draw();console.log('frame',f,'draw calls',d.length)}
}
const s=g.state;const show=k=>S.fmt(s.field(k));
console.log('score',show('score'),'height',show('height'),'drops',s.field('drops').count(),'bugs',s.field('bugs').count(),'sparks',s.field('sparks').count(),'over',show('over'));
console.log('effects',JSON.stringify(eff));
````

## live-test.js

Quick rewind, replay and hot-swap check.

````js
const L=require('./live3.js'),S=require('./sprout3.js'),fs=require('fs');
S.setLog(()=>{});
const src=fs.readFileSync('examples/sprout.sp','utf8');
const g=L.makeGame(src);
g.down(100,300);for(let f=0;f<200;f++)g.tick(1/60);
// replay: frame 150 re-run with its recorded random numbers gives the same next state
const i=150,a=S.fmt(g.history[i+1].state),b=S.fmt(g.replayFrom(i,1/60));
console.log('replay identical:',a===b);
// rewind is free: old states are untouched values
const before=S.fmt(g.history[50].state);g.rewind(50);for(let f=0;f<30;f++)g.tick(1/60);
console.log('history kept its old states:',S.fmt(g.history[50].state)===before);
// hot-swap: change update code only -> score and drops carry over
const sc=g.state.field('score'),dn=g.state.field('drops').count();
g.swap(src.replace('beep [880, 0.06]','beep [440, 0.06]'));
console.log('code swap keeps state:',g.state.field('score')===sc&&g.state.field('drops').count()===dn);
// change a starting value -> that field takes the new value, others carry over
g.swap(src.replace('height : 40','height : 90'));
console.log('start change takes new value:',g.state.field('height')===90,'score kept:',g.state.field('score')===sc);
g.tick(1/60);console.log('runs after swap:',typeof g.state.field('score'));
````

## examples/tour.sp

The language, one feature per line.

````sprout
-- cells: numbered parts and named fields
xs : [3, 1, 4]
xs @ 2 print
p : [x : 1, y : 2]
p x print

-- an indented block is a cell
size :
  w : 360
  h : 480
size h print

-- strictly left to right
2 + 3 * 4 print
xs length > 2 print

-- inputs by position or by name, with defaults
add : [x y : 0 | x + y]
add [3, 4] print
add [y : 4, x : 3] print
add [3] print
double : [n | n * 2]
double 21 print

-- a boolean runs a cell; else is the other branch
xs length > 2 ["long"] else ["short"] print
p name else "anon" print

-- with and .. are one operation
p with [y : 5] print
xs .. [9] print
"n=" .. 4 print
"p is at [p x], [p y]" print

-- collections are methods, chained left to right
xs collect [n | n * 10] print
xs keep [n | n > 2] print
xs fold [0, [t n | t + n]] print
3 times ["hi" print]

-- match, from the library
match ["tap", [
  "tap", "tapped"
  "key", "pressed"
  any, "other"
]] print

-- methods use left and right
vec : [
  + : [right | left with [x : left x + (right x), y : left y + (right y)]]
]
a : vec with [x : 1, y : 2]
b : vec with [x : 10, y : 20]
a + b x print

-- ! runs a cell that takes no input
hello : ["hello" print]
hello!

-- equality: same contents, never runs anything
[1, 2] = [1, 2] print
make : [x | [x + 1]]
(make 1) = (make 1) print
(make 1) = (make 2) print

-- recursion
fib : [n | n < 2 [n] else [fib (n - 1) + (fib (n - 2))]]
fib 20 print
````

## examples/sprout.sp

Demo game: catch the rain, dodge the bugs.

````sprout
-- Sprout: catch the rain, dodge the bugs
-- Written to the design-decisions section of the spec (on paper; not yet runnable).
-- The host runs it as:  events fold [start, frame update]  and calls  draw  after each tick.

-- the game as it begins, and as it begins again after a restart
start :
  x : W / 2
  height : 40
  drops : []
  bugs : []
  sparks : []
  score : 0
  over : false

-- something new falling from the top
drop-at : [x | [x : x, y : -10]]

-- three sparks fly off a caught drop
spark : [d | [x : d x, y : d y, vx : rand [-80, 80], vy : rand [-120, 0], life : 0.5]]

-- one frame of play: takes the game, gives the next game
play : [g |
  i : g input
  dt : g dt

  -- move the sprout
  aim : i touching [toward [g x, i touch-x, 0.2]] else [g x]
  moved : i held "left" [aim - 5] else [i held "right" [aim + 5] else [aim]]
  x : clamp [moved, 20, W - 20]

  -- new rain and bugs on a beat
  beat : every [0.3, g clock, dt]
  new-drops : [drop-at (rand [20, W - 20])] keep [beat]
  new-bugs : [drop-at (rand [20, W - 20])] keep [beat and (random < 0.3)]

  -- everything falls
  speed : 160 + (g score * 4) * dt
  top : H - 40 - (g height)
  falling : g drops .. new-drops collect [d | d with [y : d y + speed]]
  crawling : g bugs .. new-bugs collect [b | b with [y : b y + (speed * 0.8)]]

  -- what hit the sprout
  near : [d | dist [d x, d y, x, top] < 24]
  bitten-by : [b | b x - x abs < 14 and (b y > top)]
  caught : falling keep near
  bitten : crawling keep bitten-by

  -- sparks: three per caught drop, then they drift and fade
  new-sparks : caught fold [[], [all d | all .. (range 3 collect [spark d])]]
  drift : [s |
    s with
      x : s x + (s vx * dt)
      y : s y + (s vy * dt)
      life : s life - dt
  ]
  sparks : g sparks .. new-sparks collect drift keep [s | s life > 0]

  -- growing and wilting
  height : clamp [g height + (caught length * 8) - (bitten length * 30), 0, H - 140]

  -- sound and shake (queued; they happen after update returns)
  caught length > 0
    beep [880, 0.06]
  bitten length > 0
    shake 12
    beep [110, 0.25]

  g with
    x : x
    height : height
    drops : falling keep [d | near d not and (d y < H)]
    bugs : crawling keep [b | bitten-by b not and (b y < H)]
    sparks : sparks
    score : g score + (caught length)
    over : height < 20
]

-- the game's update: play, or wait for a tap to grow again
update : [g |
  g over [g input tapped [start] else [g]] else [play g]
]

draw : [g |
  top : H - 40 - (g height)
  cloud : g clock * 12 % (W + 120) - 60
  leaves : H - 80 - top / 28 ceil

  clear "#ffb38a"
  circle [300, 70, 34 + (wave [3, g clock] * 3), "#ff6b4a"]
  circle [cloud, 120, 20, "#ffffff"]
  circle [cloud + 24, 112, 26, "#ffffff"]
  circle [cloud + 50, 120, 18, "#ffffff"]
  rect [0, H - 40, W, 40, "#7a4b2a"]

  rect [g x - 3, top, 6, g height, "#3c9d3c"]
  range leaves each [n | circle [g x + (n % 2 = 1 [8] else -8), H - 60 - (n - 1 * 28), 6, "#4fb04f"]]
  circle [g x - 9, top, 9, "#5cc85c"]
  circle [g x + 9, top, 9, "#5cc85c"]

  g drops each [d | circle [d x, d y, 6, "#2f7fe0"]]
  g bugs each [b |
    circle [b x, b y, 10, "#d62828"]
    circle [b x, b y - 8, 5, "#222222"]
  ]
  g sparks each [s | circle [s x, s y, 3, "#e8f7ff"]]
  text ["[g score] drops", W / 2, 30, 22, "#5a2a1a"]

  g over
    rect [0, 0, W, H, rgba [0, 0, 0, 0.5]]
    text ["Your sprout wilted", W / 2, H / 2 - 20, 28, "#ffffff"]
    text ["Tap to grow again", W / 2, H / 2 + 20, 18, "#ffe066"]
]
````

## examples/bounce.sp

Bounce.

````sprout
-- Bounce: keep the ball up

serve : [x : W / 2, y : 100, vx : 150, vy : 220]

start :
  paddle : W / 2
  ball : serve
  score : 0
  best : 0

-- the ball's sideways speed after the side walls
side : [b | b x < 10 [b vx abs] else [b x > (W - 10) [b vx abs neg] else [b vx]]]

update : [g |
  i : g input
  dt : g dt

  aim : i touching [toward [g paddle, i touch-x, 0.4]] else [g paddle]
  steer : i held "left" [aim - (400 * dt)] else [i held "right" [aim + (400 * dt)] else [aim]]
  paddle : clamp [steer, 50, W - 50]

  b : g ball
  moved : b with [x : b x + (b vx * dt), y : b y + (b vy * dt)]
  walled : moved with [vx : side moved, vy : moved y < 10 [moved vy abs] else [moved vy]]

  near : walled x - paddle abs < 50
  hit : walled vy > 0 and near and (walled y > (H - 50))
  bounced : hit [walled with [vy : walled vy * -1.05, vx : walled vx + (walled x - paddle * 3)]] else [walled]
  lost : bounced y > (H + 20)

  hit
    beep [660, 0.05]
  lost
    beep [140, 0.3]
    shake 10

  top : g score > (g best) [g score] else [g best]

  g with
    paddle : paddle
    ball : lost [serve] else [bounced]
    score : lost [0] else [hit [g score + 1] else [g score]]
    best : top
]

draw : [g |
  clear "#1d1b3a"
  rect [g paddle - 50, H - 40, 100, 12, "#ffcc33"]
  circle [g ball x, g ball y, 10, "#ff5d8f"]
  text ["[g score]", W / 2, 60, 48, "#ffffff"]
  text ["best [g best]", W / 2, 95, 16, "#9a94c8"]
]
````

## examples/snake.sp

Snake.

````sprout
-- Snake: eat, grow, don't bite yourself. A 20 by 20 grid.

size : 18

start :
  body : [[x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]
  dx : 1
  dy : 0
  food : [x : 9, y : 10]
  score : 0
  over : false

-- arrow keys turn, but never straight back
turn : [g i |
  cond [
    i held "left" and (g dx = 0), g with [dx : -1, dy : 0]
    i held "right" and (g dx = 0), g with [dx : 1, dy : 0]
    i held "up" and (g dy = 0), g with [dx : 0, dy : -1]
    i held "down" and (g dy = 0), g with [dx : 0, dy : 1]
    any, g
  ]
]

-- one step of the snake
step : [g |
  head : g body @ 1
  next : [x : head x + (g dx) % 20, y : head y + (g dy) % 20]
  ate : next = (g food)
  grown : [next] .. (g body)
  kept : ate [grown] else [take [grown, g body length]]
  bitten : g body keep [p | p = next] length > 0
  fresh : [x : rand [0, 20] floor, y : rand [0, 20] floor]

  ate
    beep [880, 0.05]
  bitten
    beep [110, 0.4]

  g with
    body : kept
    food : ate [fresh] else [g food]
    score : ate [g score + 1] else [g score]
    over : bitten
]

update : [g |
  t : turn [g, g input]
  g over [g input tapped [start] else [g]] else [
    every [0.12, g clock, g dt] [step t] else [t]]
]

draw : [g |
  clear "#10220f"
  g body each [p | rect [p x * size, p y * size, size - 2, size - 2, "#7ddc6a"]]
  rect [g food x * size, g food y * size, size - 2, size - 2, "#ff4d4d"]
  text ["[g score]", W / 2, 400, 28, "#ffffff"]
  g over
    text ["Bitten! Tap to play again", W / 2, 440, 18, "#ffe066"]
]
````

## examples/breakout.sp

Breakout.

````sprout
-- Breakout: clear the bricks

brick-w : 40
brick-h : 16

-- a wall of 8 by 5 bricks
wall : range 40 collect [n | [x : n - 1 % 8 * 44 + 4, y : n - 1 / 8 floor * 20 + 60, hp : 1]]

serve : [x : W / 2, y : 300, vx : 120, vy : -240]

start :
  paddle : W / 2
  ball : serve
  bricks : wall
  score : 0
  lives : 3

-- does the ball touch this brick?
touches : [b k | b x > (k x) and (b x < (k x + brick-w)) and (b y > (k y)) and (b y < (k y + brick-h))]

update : [g |
  i : g input
  dt : g dt
  paddle : clamp [i touching [toward [g paddle, i touch-x, 0.5]] else [g paddle], 40, W - 40]

  b : g ball
  m : b with [x : b x + (b vx * dt), y : b y + (b vy * dt)]
  hit-bricks : g bricks keep [k | touches [m, k]]
  left-bricks : g bricks keep [k | touches [m, k] not]
  broke : hit-bricks length > 0

  vx : m x < 8 or (m x > (W - 8)) [m vx neg] else [m vx]
  top-or-brick : m y < 8 or broke
  on-paddle : m vy > 0 and (m y > (H - 50)) and (m x - paddle abs < 40)
  vy : top-or-brick [m vy abs] else [on-paddle [m vy abs neg] else [m vy]]
  lost : m y > (H + 10)

  broke
    beep [520, 0.04]
  lost
    shake 8

  g with
    paddle : paddle
    ball : lost [serve] else [m with [vx : vx, vy : vy]]
    bricks : left-bricks
    score : g score + (hit-bricks length)
    lives : lost [g lives - 1] else [g lives]
]

draw : [g |
  clear "#0b0b1e"
  g bricks each [k | rect [k x, k y, brick-w, brick-h, "#5fa8ff"]]
  rect [g paddle - 40, H - 40, 80, 10, "#ffffff"]
  circle [g ball x, g ball y, 6, "#ffd23f"]
  text ["[g score]  lives [g lives]", W / 2, 30, 18, "#ffffff"]
]
````

## examples/particles.sp

Particle fountain (speed test).

````sprout
-- Particles: a fountain, for speed tests. About 2000 alive at once.

start :
  sparks : []

spawn : [n | [x : W / 2, y : H - 20, vx : rand [-60, 60], vy : rand [-420, -260], life : 2]]

update : [g |
  dt : g dt
  born : range 17 collect spawn
  moved : g sparks collect [s | s with [x : s x + (s vx * dt), y : s y + (s vy * dt), vy : s vy + (300 * dt), life : s life - dt]]
  g with
    sparks : moved keep [s | s life > 0] .. born
]

draw : [g |
  clear "#000000"
  g sparks each [s | circle [s x, s y, 2, "#ffcc66"]]
]
````

## examples/fireflies.sp

Fireflies: 400 lights that gather to your finger (runs on columns)

````sprout
-- Fireflies: hundreds of lights drift on the night air. Hold a finger down and they gather to it.
-- Try changing count, the pull, or the glow colour while it runs.

count : 400

-- a new firefly, rising from the grass
hatch : [n | [x : rand [0, W], y : H + 8, vx : rand [-20, 20], vy : rand [-90, -40], ph : rand [0, 6.28]]]

start :
  flies : []

update : [g |
  i : g input
  dt : g dt
  t : g clock

  -- where they gather: your finger, or a slow loop round the middle of the sky
  gx : i touching [i touch-x] else [W / 2 + (t * 0.5 sin * 90)]
  gy : i touching [i touch-y] else [H / 2 - 40 + (t * 0.7 cos * 110)]
  pull : i touching [1.2] else [0.5]

  -- a few more hatch each frame until there are enough
  born : g flies length < count [range 5 collect hatch] else [[]]

  -- each one is pulled toward the gathering point and wobbles on its own beat
  flies : g flies .. born collect [f |
    f with
      vx : f vx * 0.96 + (gx - (f x) * pull * dt) + (f ph + t sin * 80 * dt)
      vy : f vy * 0.96 + (gy - (f y) * pull * dt) + (f ph * 1.3 + t cos * 80 * dt)
      x : f x + (f vx * dt) max -20 min (W + 20)
      y : f y + (f vy * dt) max -20 min (H + 20)
  ]

  g with [flies : flies]
]

draw : [g |
  t : g clock
  halo : rgba [255, 225, 110, 0.13]
  clear "#070b1a"
  rect [0, H - 30, W, 30, "#0b1a12"]
  g flies each [f | circle [f x, f y, f ph + (t * 3) sin * 3 + 5, halo]]
  g flies each [f | circle [f x, f y, 1.8, "#fff4b0"]]
  text ["hold to call them", W / 2, H - 14, 13, "#4f6a8f"]
]
````

## examples/orbit.sp

Orbit: throw moons round a sun

````sprout
-- Orbit: drag on the sky and let go to throw a moon. The sun pulls on everything.
-- Throw sideways to make an orbit. Too slow and it falls in; too fast and it flies away.

sun : [x : W / 2, y : H / 2 - 20, r : 24]
pull : 1500000               -- how strongly the sun pulls
colours : ["#9fd8ff", "#ffd166", "#ff9e7a", "#b8f28c"]

-- a few fixed stars behind everything
stars : range 70 collect [n | [x : n * 137 % W, y : n * 211 % H, r : n % 3 * 0.5 + 0.6]]

-- a new moon at x, y moving at vx, vy
moon : [px py vx0 vy0 | [x : px, y : py, vx : vx0, vy : vy0, c : rand [1, 5] floor]]

start :
  moons : []
  lost : 0
  aiming : false
  ax : 0
  ay : 0

update : [g |
  i : g input
  dt : g dt

  -- aiming: a drag starts where you touch, and a moon is thrown when you let go
  holding : i touching
  starting : holding and (g aiming not)
  released : g aiming and (holding not)
  from-x : starting [i touch-x] else [g ax]
  from-y : starting [i touch-y] else [g ay]
  thrown : [moon [from-x, from-y, from-x - (i touch-x) * 2.5, from-y - (i touch-y) * 2.5]] keep [released]

  -- the sun pulls each moon toward it: harder the closer it gets
  fall : [m |
    dx : sun x - (m x)
    dy : sun y - (m y)
    d2 : dx * dx + (dy * dy) max 100
    k : pull / d2 / (d2 sqrt) * dt
    ux : m vx + (dx * k)
    uy : m vy + (dy * k)
    m with [vx : ux, vy : uy, x : m x + (ux * dt), y : m y + (uy * dt)]
  ]
  moved : g moons .. thrown collect fall

  -- what fell into the sun, and what flew away
  hit : [m | dist [m x, m y, sun x, sun y] < (sun r)]
  gone : [m | dist [m x, m y, sun x, sun y] > 900]
  crashed : moved keep hit length
  escaped : moved keep gone length

  released
    beep [520, 0.05]
  crashed > 0
    shake 10
    beep [90, 0.35]

  g with
    moons : moved keep [m | hit m not and (gone m not)]
    lost : g lost + crashed + escaped
    aiming : holding
    ax : from-x
    ay : from-y
]

draw : [g |
  i : g input else [touch-x : 0, touch-y : 0]
  glow : wave [4, g clock] * 4
  clear "#060818"
  stars each [s | circle [s x, s y, s r, "#3a4a7a"]]

  circle [sun x, sun y, sun r + 14 + glow, rgba [255, 170, 60, 0.15]]
  circle [sun x, sun y, sun r + 6 + glow, rgba [255, 190, 80, 0.3]]
  circle [sun x, sun y, sun r, "#ffcf5a"]

  g moons each [m |
    line [m x, m y, m x - (m vx * 0.12), m y - (m vy * 0.12), rgba [255, 255, 255, 0.25]]
    circle [m x, m y, 5, colours @ (m c)]
  ]

  g aiming
    line [g ax, g ay, i touch-x, i touch-y, "#5a6aa0"]
    circle [g ax, g ay, 6, "#ffffff"]

  text ["[g moons length] in orbit", W / 2, 30, 20, "#e8ecff"]
  text ["[g lost] lost", W / 2, 54, 14, "#7d88b8"]
  g moons length = 0 and (g aiming not)
    text ["drag and let go to throw a moon", W / 2, H - 30, 14, "#7d88b8"]
]
````

## examples/hop.sp

Hop: land gently on the pad

````sprout
-- Hop: set the lander down gently on the pad.
-- Hold a finger down to fire the engine; it pushes away from your finger, so hold left of the lander to drift right.
-- Keys: up or space to fire, left and right to lean. Land slower than 50 going down and 25 sideways.

gravity : 55
thrust : 140
ground : H - 40

start :
  ship : [x : 70, y : 70, vx : 40, vy : 0]
  fuel : 100
  phase : "flying"            -- "flying", "landed" or "crashed"
  burning : false
  pad-x : 220
  score : 0
  best : 0

-- one frame of flying
fly : [g |
  i : g input
  dt : g dt
  s : g ship

  burn : i touching or (i held "up") or (i held "space") and (g fuel > 0)
  lean : i touching [s x - (i touch-x) / 60 max -1 min 1] else [
    i held "left" [-1] else [i held "right" [1] else [0]]]
  push : burn [thrust] else [0]
  speed-x : s vx + (lean * push * 0.5 * dt)
  speed-y : s vy + (gravity - push * dt)
  moved : s with [x : s x + (speed-x * dt) max 10 min (W - 10), y : s y + (speed-y * dt), vx : speed-x, vy : speed-y]

  down : moved y > (ground - 12)
  on-pad : moved x > (g pad-x - 30) and (moved x < (g pad-x + 30))
  soft : speed-y < 50 and (speed-x abs < 25)
  landed : down and on-pad and soft
  crashed : down and (landed not)
  points : landed [g fuel round + 50] else [0]

  burn and (every [0.07, g clock, dt])
    beep [70 + (rand [0, 30]), 0.05]
  landed
    beep [660, 0.1]
    beep [880, 0.2]
  crashed
    shake 14
    beep [80, 0.5]

  g with
    ship : moved with [y : down [ground - 12] else [moved y]]
    fuel : burn [g fuel - (15 * dt) max 0] else [g fuel]
    phase : landed ["landed"] else [crashed ["crashed"] else ["flying"]]
    burning : burn
    score : g score + points
    best : g score + points max (g best)
]

-- after a landing or a crash, a tap sends the next lander; a crash starts the score again
again : [g |
  next : start with [pad-x : rand [50, W - 50], best : g best]
  g input tapped [g phase = "landed" [next with [score : g score]] else [next]] else [g]
]

update : [g | g phase = "flying" [fly g] else [again g]]

draw : [g |
  s : g ship
  sky : g phase = "crashed" ["#2a0f14"] else ["#0d1530"]
  clear sky
  circle [60, ground + 120, 160, "#1c2448"]
  circle [300, ground + 140, 190, "#18203f"]
  rect [0, ground, W, H - ground, "#2b2f45"]
  rect [g pad-x - 30, ground - 4, 60, 6, "#ffd166"]

  g burning
    line [s x, s y + 10, s x - (s vx * 0.05), s y + 26 + (rand [0, 8]), "#ff9e4a"]
  line [s x - 8, s y + 4, s x - 13, s y + 13, "#c8d0ea"]
  line [s x + 8, s y + 4, s x + 13, s y + 13, "#c8d0ea"]
  circle [s x, s y, 10, "#e8ecff"]
  circle [s x, s y - 2, 4, "#5fa8ff"]

  rect [12, 14, 100, 8, "#2b2f45"]
  rect [12, 14, g fuel, 8, g fuel > 25 ["#8ef08e"] else ["#ff6b6b"]]
  speed-ok : s vy < 50 and (s vx abs < 25)
  text ["down [s vy round]  side [s vx round]", W / 2, 44, 13, speed-ok ["#8ef08e"] else ["#ffb38a"]]
  text ["[g score]", W - 40, 20, 18, "#ffffff"]
  text ["best [g best]", W - 40, 40, 11, "#8a93b8"]

  g phase = "landed"
    text ["Landed! +[g fuel round + 50]", W / 2, H / 2 - 40, 24, "#8ef08e"]
    text ["tap for the next one", W / 2, H / 2 - 12, 14, "#c8d0ea"]
  g phase = "crashed"
    text ["Crashed", W / 2, H / 2 - 40, 26, "#ff6b6b"]
    text ["tap to try again", W / 2, H / 2 - 12, 14, "#c8d0ea"]
]
````

## examples/life.sp

Life: a living grid you can draw on

````sprout
-- Life: squares live, die and are born on a 24 by 32 grid, and the edges wrap round.
-- A square with 3 live neighbours comes alive; a live one with 2 or 3 stays alive.
-- Draw with your finger to bring squares to life. Time stops while you draw.

cols : 24
rows : 32
side : 15
speed : 0.1                  -- seconds per generation

-- a glider in the corner and an R-pentomino in the middle
seed : [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2], [12, 14], [13, 14], [11, 15], [12, 15], [12, 16]]
column-of : [k | k - 1 % cols]
row-of : [k | k - 1 / cols floor]

start :
  board : range (cols * rows) collect [k |
    seed keep [p | p @ 1 = (column-of k) and (p @ 2 = (row-of k))] length > 0 [1] else [0]
  ]
  generation : 0

-- 1 if the square at x, y is alive (wrapping round the edges), else 0
at : [b x y | b @ (y % rows * cols + (x % cols) + 1)]

-- the next generation of the whole board
next : [b |
  range (cols * rows) collect [k |
    x : column-of k
    y : row-of k
    n : at [b, x - 1, y - 1] + (at [b, x, y - 1]) + (at [b, x + 1, y - 1]) + (at [b, x - 1, y]) + (at [b, x + 1, y]) + (at [b, x - 1, y + 1]) + (at [b, x, y + 1]) + (at [b, x + 1, y + 1])
    n = 3 or (n = 2 and (b @ k = 1)) [1] else [0]
  ]
]

-- bring the square under your finger to life
draw-at : [b i |
  spot : i touch-y / side floor * cols + (i touch-x / side floor) + 1
  range (cols * rows) collect [k | k = spot [1] else [b @ k]]
]

update : [g |
  i : g input
  i touching [g with [board : draw-at [g board, i]]] else [
    every [speed, g clock, g dt] [g with [board : next (g board), generation : g generation + 1]] else [g]
  ]
]

draw : [g |
  clear "#0d1410"
  range (cols * rows) each [k |
    g board @ k = 1
      rect [column-of k * side + 1, row-of k * side + 1, side - 2, side - 2, "#8ef08e"]
  ]
  text ["generation [g generation]", W / 2, H - 14, 13, "#5f8f73"]
]
````

## examples/ace-derive.sp

ACE (the Atomic Constraint Engine): the five kinds of atom, with done derived to a fixed point (prints)

````sprout
-- ACE: the Atomic Constraint Engine, in Sprout. One primitive: the atom.
-- An atom has an id, a name, a kind, tags and two links: requires (what must finish first)
-- and contains (its children). Done is never stored. It is derived from the graph.
--
-- Five kinds, by who says an atom is done:
--   trivial   born done: a fact other atoms can rely on
--   leaf      a person closes it
--   verified  closed AND signed by a witness: two locks
--   gate      done when everything it requires is done (RFIs, constraints)
--   rollup    done when all its children are done (areas, work packages)
--
-- A tag carries no maths, except one: narrative-required. An atom with it isn't done,
-- however it was closed, until someone writes down what happened.

atoms : [
  [id : "basis", name : "Design basis issued", kind : "trivial", tags : [], requires : [], contains : []]
  [id : "permit", name : "Excavation permit", kind : "verified", closed : true, signed : true, tags : ["regulatory"], requires : [], contains : []]
  [id : "survey", name : "Survey and layout", kind : "leaf", closed : true, tags : [], requires : [], contains : []]
  [id : "dig", name : "Excavate pedestal", kind : "leaf", closed : true, tags : [], requires : ["permit", "survey"], contains : []]
  [id : "rebar-on-site", name : "Rebar delivered", kind : "leaf", closed : false, tags : ["material"], requires : [], contains : []]
  [id : "eng-reply", name : "Engineer answers splice RFI", kind : "leaf", closed : false, tags : [], requires : [], contains : []]
  [id : "rfi-splice", name : "RFI: splice length", kind : "gate", tags : ["rfi"], requires : ["eng-reply"], contains : []]
  [id : "place-rebar", name : "Place rebar", kind : "leaf", closed : false, tags : [], requires : ["dig", "rebar-on-site", "rfi-splice"], contains : []]
  [id : "inspect", name : "Pre-pour inspection", kind : "verified", closed : false, signed : false, tags : ["narrative-required"], requires : ["place-rebar"], contains : []]
  [id : "pour", name : "Pour concrete", kind : "leaf", closed : false, tags : ["narrative-required"], requires : ["inspect"], contains : []]
  [id : "pedestal", name : "Turbine pedestal", kind : "rollup", tags : [], requires : ["basis"], contains : ["dig", "place-rebar", "pour"]]
]

-- small helpers
find : [want atoms-in | atoms-in keep [a | a id = want] first]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]

-- the narrative an atom still owes, if it has the tag and nothing written yet
owes-story : [a | has [a tags, "narrative-required"] and ((a narrative else "") = "")]

-- does this atom close, given the ids already done?
closes : [a ok |
  links-done : a requires .. (a contains) keep [x | has [ok, x] not] length = 0
  match [a kind, [
    "trivial", true
    "leaf", a closed and (owes-story a not)
    "verified", a closed and (a signed) and (owes-story a not)
    any, links-done
  ]]
]
-- derive: start from nothing and close whatever the graph allows, until nothing changes (a fixed point)
settle : [atoms-in ok |
  more : atoms-in keep [a | has [ok, a id] not and (closes [a, ok])] collect [a | a id]
  more length = 0 [ok] else [settle [atoms-in, ok .. more]]
]

-- a short report: done, workable now, and what each open atom is waiting for
report : [atoms-in title |
  done : settle [atoms-in, []]
  open : atoms-in keep [a | has [done, a id] not]
  manual : [a | a kind = "leaf" or (a kind = "verified")]
  workable : open keep [a | manual a and (a requires keep [x | has [done, x] not] length = 0) and (a closed not)]
  "== [title] ==" print
  "done      [done length] of [atoms-in length]" print
  atoms-in each [a |
    waits : a requires .. (a contains) keep [x | has [done, x] not]
    stuck : manual a and (a closed) and (has [done, a id] not)
    mark : match [true, [
      has [done, a id], "\[x]"
      stuck, "\[!]"
      has [workable collect [w | w id], a id], "\[>]"
      any, "\[ ]"
    ]]
    note : cond [
      stuck and (owes-story a), "closed, but needs a narrative"
      stuck, "closed, but waiting for a witness to sign"
      waits length > 0, "waits on " .. (join waits)
      (a narrative else "") != "", "narrative: " .. (a narrative)
      any, ""
    ]
    "[mark] [pad [a kind, 9]] [pad [a name, 28]] [note]" print
  ]
  "workable  " .. (join (workable collect [a | a id])) print
  "pedestal  " .. (has [done, "pedestal"] ["done"] else ["open"]) print
  "" print
]

-- change some atoms by id, and derive again
update-atoms : [atoms-in ids change | atoms-in collect [a | has [ids, a id] [a with change] else [a]]]

report [atoms, "today"]

arrived : update-atoms [atoms, ["rebar-on-site", "eng-reply"], [closed : true]]
report [arrived, "rebar in, RFI answered"]

-- the rebar is placed and the inspector signs, but nobody has written up the inspection yet
signed : update-atoms [update-atoms [arrived, ["place-rebar"], [closed : true]], ["inspect"], [closed : true, signed : true]]
report [signed, "inspected and signed, no write-up"]

-- the write-up: a typed outcome first, then the detail
written : update-atoms [signed, ["inspect"], [narrative : "nominal · splice lengths checked against the RFI answer"]]
report [written, "inspection written up"]
````

## examples/ace-schedule.sp

ACE: critical path, then a Monte Carlo finish date with a shared risk (prints)

````sprout
-- ACE schedule: the critical path is a walk over requires, and the plan is a distribution, not a date.
-- Each piece of work has a duration triple in days: [fastest, likely, slowest].

atoms : [
  [id : "permit", requires : [], dur : [0, 0, 0]]
  [id : "survey", requires : [], dur : [1, 2, 3]]
  [id : "dig", requires : ["permit", "survey"], dur : [3, 4, 7]]
  [id : "rebar", requires : [], dur : [5, 8, 15]]
  [id : "rfi", requires : [], dur : [2, 5, 12]]
  [id : "formwork", requires : ["dig"], dur : [2, 3, 5]]
  [id : "place-rebar", requires : ["dig", "rebar", "rfi"], dur : [3, 4, 6]]
  [id : "inspect", requires : ["place-rebar"], dur : [1, 1, 2]]
  [id : "pour", requires : ["inspect", "formwork"], dur : [1, 1, 2]]
  [id : "cure", requires : ["pour"], dur : [7, 7, 10]]
]
last-atom : "cure"
runs : 400
seed : 1                   -- change it for a different set of runs; the same seed always gives the same answer

-- one shared risk, rolled once per run: wet weather delays the pour by 3 days, 3 times in 10
risk : [chance : 0.3, delay : 3, hits : "pour"]

find : [want ds | ds keep [a | a id = want] first]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
bar : [n | range n fold ["", [s k | s .. "#"]]]

-- earliest finish: the latest finish of everything required, plus this atom's own time
finish : [want ds |
  a : find [want, ds]
  (a requires collect [r | finish [r, ds]] fold [0, [m x | m max x]]) + (a days)
]
-- the critical path: walk back from the end, always through the requirement that finishes last
path : [want ds |
  a : find [want, ds]
  a requires length = 0 [[want]] else [
    worst : a requires fold ["", [w r | w = "" or (finish [r, ds] > (finish [w, ds])) [r] else [w]]]
    path [worst, ds] .. [want]
  ]
]

-- the plan on likely durations
likely : atoms collect [a | a with [days : a dur @ 2]]
critical : path [last-atom, likely]
"== critical path (likely durations) ==" print
likely each [a |
  on : critical keep [c | c = (a id)] length > 0 ["*"] else [" "]
  start : finish [a id, likely] - (a days)
  "[on] [pad [a id, 12]] day [pad [start str, 3]] to [pad [finish [a id, likely] str, 3]]" print
]
"finish on day [finish [last-atom, likely]], through " .. (critical fold ["", [s x | s = "" [x] else [s .. " > " .. x]]]) print

-- a time from a triangle, given u from 0 up to 1: most often near likely, never outside fastest..slowest
tri : [t u |
  lo : t @ 1, mode : t @ 2, hi : t @ 3
  hi = lo [lo] else [
    u < (mode - lo / (hi - lo)) [lo + (u * (hi - lo) * (mode - lo) sqrt)] else [hi - (1 - u * (hi - lo) * (hi - mode) sqrt)]
  ]
]
-- one run: sample every duration, roll the shared risk once, walk the graph
-- the draws come from noise [run, atom], not random, so the same seed gives the same histogram every time
one-run : [n |
  sampled : range (atoms length) collect [k | atoms @ k with [days : tri [atoms @ k dur, noise [n, k + (seed * 1000)]]]]
  wet : noise [n, seed * 1000 + 999] < (risk chance)
  ds : wet [sampled collect [a | a id = (risk hits) [a with [days : a days + (risk delay)]] else [a]]] else [sampled]
  finish [last-atom, ds]
]

sort : [xs |
  xs length < 2 [xs] else [
    p : xs @ 1
    rest : range (xs length - 1) collect [k | xs @ (k + 1)]
    sort (rest keep [v | v < p]) .. [p] .. (sort (rest keep [v | v >= p]))
  ]
]
finishes : sort (range runs collect one-run)
pct : [p | finishes @ (p * runs ceil)]

"" print
"== monte carlo, [runs] runs ==" print
"P10 day [pct 0.1 round]   P50 day [pct 0.5 round]   P80 day [pct 0.8 round]   P90 day [pct 0.9 round]" print
first-day : finishes @ 1 floor
last-day : finishes @ runs ceil
range (last-day - first-day / 2 + 1 ceil) each [k |
  from : k - 1 * 2 + first-day
  n : finishes keep [f | f >= from and (f < (from + 2))] length
  "day [pad [from str, 3]] [pad [n str, 4]] [bar (n / 4 ceil)]" print
]
"chance of finishing by day [finish [last-atom, likely]]: " .. (finishes keep [f | f <= (finish [last-atom, likely])] length * 100 / runs round) .. "%" print

-- ---------------------------------------------------------------------------------------------
-- Cost is a view, not a property: crews times rates times time, plus materials and equipment.

rate : 950                 -- dollars per person per day
indirect-share : 0.15      -- site overheads, as a share of labour
costs : [
  [id : "permit", crew : 0, materials : 0, equipment : 0]
  [id : "survey", crew : 2, materials : 0, equipment : 0]
  [id : "dig", crew : 3, materials : 0, equipment : 9000]
  [id : "rebar", crew : 0, materials : 38000, equipment : 0]
  [id : "rfi", crew : 0, materials : 0, equipment : 0]
  [id : "formwork", crew : 4, materials : 6500, equipment : 0]
  [id : "place-rebar", crew : 5, materials : 0, equipment : 2500]
  [id : "inspect", crew : 1, materials : 0, equipment : 0]
  [id : "pour", crew : 6, materials : 21000, equipment : 4000]
  [id : "cure", crew : 1, materials : 800, equipment : 0]
]

-- where the work actually stands on the status day, and what has been spent
status-day : 10
progress : [["permit", 1], ["survey", 1], ["dig", 1], ["rebar", 1], ["rfi", 1], ["formwork", 0.5], ["place-rebar", 0.25]]
actual-cost : 84000

sum : [xs | xs fold [0, [t x | t + x]]]
pad3 : [n | n < 10 ["00" .. n] else [n < 100 ["0" .. n] else [n str]]]
commas : [n | n < 1000 [n str] else [commas (n / 1000 floor) .. "," .. (pad3 (n % 1000))]]
money : [n | "$" .. (commas (n round))]
two : [r | r * 100 round / 100]

ids : atoms collect [a | a id]
cost-of : [want | costs keep [c | c id = want] first]
labour-of : [want | c : cost-of want, c crew * ((find [want, likely]) days) * rate]
budget-of : [want | c : cost-of want, labour-of want * (1 + indirect-share) + (c materials) + (c equipment)]

labour : sum (ids collect labour-of)
budget : sum (ids collect budget-of)
"" print
"== cost, worked out from the plan ==" print
"labour     [pad [money labour, 10]] crews x days x [money rate]" print
"indirect   [pad [money (labour * indirect-share), 10]] [indirect-share * 100]% of labour" print
"materials  " .. (money (sum (costs collect [c | c materials]))) print
"equipment  " .. (money (sum (costs collect [c | c equipment]))) print
"budget     " .. (money budget) print

-- planned value: how much of each atom's budget the likely plan says is earned by day d
planned-share : [want d |
  ef : finish [want, likely]
  es : ef - ((find [want, likely]) days)
  ef = es [d >= ef [1] else [0]] else [d - es / (ef - es) max 0 min 1]
]
planned-by : [d | sum (ids collect [x | planned-share [x, d] * (budget-of x)])]
pv : planned-by status-day
ev : sum (progress collect [p | p @ 2 * (budget-of (p @ 1))])
spi : ev / pv
cpi : ev / actual-cost

"" print
"== earned value on day [status-day] ==" print
"planned    [pad [money pv, 10]] what the likely plan has done by now" print
"earned     [pad [money ev, 10]] the budget of the work that is actually done" print
"actual     [pad [money actual-cost, 10]] what has been spent" print
"SPI [two spi]  " .. (spi < 1 ["behind schedule"] else ["on or ahead of schedule"]) print
"CPI [two cpi]  " .. (cpi < 1 ["over budget"] else ["on or under budget"]) print
"forecast at completion  " .. (money (budget / cpi)) .. "  (budget / CPI)" print

"" print
"== planned value over time, and where we are ==" print
range 12 each [k |
  d : k - 1 * 2
  share : planned-by d / budget
  here : d = status-day ["  < earned " .. (ev / budget * 100 round) .. "%"] else [""]
  pct : (share * 100 round) .. "%"
  "day [pad [d str, 3]] [pad [pct, 5]] [bar (share * 30 round)][here]" print
]
````

## examples/ace-board.sp

ACE: an interactive atom graph

````sprout
-- ACE board: tap work to close it, and watch the graph work out the rest.
-- Leaves close with one tap. Verified atoms need two: the work, then the witness.
-- Gates and the rollup are never tapped: they close themselves when what they wait on is done.
-- Blocked work can't be closed. Red marks the critical path: the work that sets the finish.
-- The inspection needs a narrative too, and the narrative is structure: if it finds a problem,
-- new atoms join the graph and the pour waits for them.

bw : 104
bh : 36

atoms : [
  [id : "basis", name : "design basis", kind : "trivial", requires : [], days : 0, x : 10, y : 56]
  [id : "permit", name : "permit", kind : "verified", requires : [], days : 1, x : 128, y : 56]
  [id : "survey", name : "survey", kind : "leaf", requires : [], days : 2, x : 246, y : 56]
  [id : "rebar", name : "rebar on site", kind : "leaf", requires : [], days : 8, x : 10, y : 126]
  [id : "dig", name : "excavate", kind : "leaf", requires : ["permit", "survey"], days : 4, x : 128, y : 126]
  [id : "reply", name : "engineer reply", kind : "leaf", requires : [], days : 5, x : 246, y : 126]
  [id : "forms", name : "formwork", kind : "leaf", requires : ["dig"], days : 3, x : 10, y : 196]
  [id : "place", name : "place rebar", kind : "leaf", requires : ["dig", "rebar", "rfi"], days : 4, x : 128, y : 196]
  [id : "rfi", name : "RFI: splice", kind : "gate", requires : ["reply"], days : 0, x : 246, y : 196]
  [id : "inspect", name : "inspection", kind : "verified", story : true, requires : ["place"], days : 1, x : 128, y : 266]
  [id : "pour", name : "pour", kind : "leaf", requires : ["inspect", "forms"], days : 1, x : 128, y : 336]
]
rollup : [name : "turbine pedestal", contains : ["dig", "forms", "place", "pour"], requires : ["basis"]]
finish-atom : "pour"

-- what the inspection can find, as typed outcomes, and the atoms each one adds
outcomes : ["nominal", "rework", "NCR"]
found : [story |
  match [story, [
    "rework", [[id : "rework", name : "rework splices", kind : "leaf", requires : ["inspect"], days : 2, x : 246, y : 266]]
    "NCR", [[id : "dispo", name : "engineer disposition", kind : "leaf", requires : ["inspect"], days : 3, x : 10, y : 266], [id : "ncr", name : "NCR closed", kind : "gate", requires : ["dispo"], days : 0, x : 10, y : 336]]
    any, []
  ]]
]
-- the graph for a given story: the pour also waits for whatever the inspection added
grown : [story |
  extra : found story
  adds : extra keep [e | e id = "rework" or (e id = "ncr")] collect [e | e id]
  atoms collect [a | a id = "pour" [a with [requires : a requires .. adds]] else [a]] .. extra
]

start :
  closed : ["permit", "survey"]
  signed : ["permit"]
  story : ""
  msg : "tap a box"

-- lists of ids
has : [xs want | xs keep [x | x = want] length > 0]
without : [xs v | xs keep [x | x != v]]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
find : [want graph | graph keep [a | a id = want] first]

-- derive: done is never stored. Close whatever the graph allows until nothing changes.
closes : [a ok g |
  k : a kind
  needs-met : a requires keep [r | has [ok, r] not] length = 0
  told : (a story else false) not or (g story != "")
  k = "trivial" or (needs-met and (k = "gate" or (has [g closed, a id] and told and (k = "leaf" or (has [g signed, a id])))))
]
settle : [graph ok g |
  more : graph keep [a | has [ok, a id] not and (closes [a, ok, g])] collect [a | a id]
  more length = 0 [ok] else [settle [graph, ok .. more, g]]
]

-- days of work left before an atom is finished, through everything it requires
to-go : [want ok graph |
  a : find [want, graph]
  own : has [ok, want] [0] else [a days]
  own + (a requires collect [r | to-go [r, ok, graph]] fold [0, [m x | m max x]])
]
-- the critical path: from the end, back through whichever requirement has the most work left
critical : [want ok graph |
  a : find [want, graph]
  todo : a requires keep [r | to-go [r, ok, graph] > 0]
  has [ok, want] [[]] else [
    todo length = 0 [[want]] else [
      worst : todo fold ["", [w r | w = "" or (to-go [r, ok, graph] > (to-go [w, ok, graph])) [r] else [w]]]
      critical [worst, ok, graph] .. [want]
    ]
  ]
]

inside : [a i | i touch-x > (a x) and (i touch-x < (a x + bw)) and (i touch-y > (a y)) and (i touch-y < (a y + bh))]
waiting-on : [a ok | a requires keep [r | has [ok, r] not]]
-- the outcome buttons, shown while the signed inspection waits for its write-up
button-x : [n | n - 1 * 115 + 10]
awaiting : [g | has [g closed, "inspect"] and (has [g signed, "inspect"]) and (g story = "")]

update : [g |
  i : g input
  graph : grown (g story)
  ok : settle [graph, [], g]
  choosing : awaiting g
  pick : choosing and (i tapped) and (i touch-y > 430) [range 3 keep [n | i touch-x > (button-x n) and (i touch-x < (button-x n + 105))] first] else [false]
  told : pick != false
  a : i tapped and (told not) [graph keep [b | inside [b, i]] first] else [false]
  hit : a != false
  manual : hit and (a kind = "leaf" or (a kind = "verified"))
  is-closed : manual and (has [g closed, a id])
  is-signed : manual and (has [g signed, a id])
  blocked : manual and (is-closed not) and (waiting-on [a, ok] length > 0)
  needs-story : manual and is-signed and ((a story else false) and (g story = ""))
  act : manual and (blocked not) and (needs-story not)

  -- what a tap does: leaf open -> closed -> open; verified open -> closed -> signed -> (written up) -> open
  step : act [a kind = "leaf" [is-closed ["reopen"] else ["close"]] else [is-closed not ["close"] else [is-signed not ["sign"] else ["reopen"]]]] else ["none"]
  closed : step = "close" [g closed .. [a id]] else [step = "reopen" [without [g closed, a id]] else [g closed]]
  signed : step = "sign" [g signed .. [a id]] else [step = "reopen" [without [g signed, a id]] else [g signed]]
  outcome : told [outcomes @ pick] else [step = "reopen" and (a story else false) [""] else [g story]]

  blocked
    shake 5
    beep [120, 0.15]
  act or told
    beep [step = "reopen" [330] else [660], 0.06]

  g with
    closed : closed
    signed : signed
    msg : cond [
      told and (outcome = "nominal"), "inspection written up: nominal"
      told, "inspection found " .. outcome .. ": new work joins the graph"
      blocked, "[a name] waits on " .. (join (waiting-on [a, ok]))
      needs-story, "write up the inspection first: choose below"
      step = "close", a kind = "verified" ["[a name] done: now tap again to sign"] else ["closed [a name]"]
      step = "sign", (a story else false) ["[a name] signed: now write it up"] else ["[a name] signed by the witness"]
      step = "reopen", "reopened [a name]"
      hit, "[a name] is a [a kind]: it closes by itself"
      any, g msg
    ]
    story : outcome
]

draw : [g |
  graph : grown (g story)
  ok : settle [graph, [], g]
  path : critical [finish-atom, ok, graph]
  bottom : [a | [x : a x + (bw / 2), y : a y + bh]]
  top : [a | [x : a x + (bw / 2), y : a y]]
  clear "#0b0f0d"

  -- requires: a line from each requirement to what needs it
  graph each [a |
    a requires each [r |
      b : find [r, graph]
      hot : has [path, r] and (has [path, a id])
      line [bottom b x, bottom b y, top a x, top a y, hot ["#ff6b6b"] else [has [ok, r] ["#2f6b3a"] else ["#3a4a40"]]]
    ]
  ]

  -- the atoms
  graph each [a |
    done : has [ok, a id]
    ready : done not and (waiting-on [a, ok] length = 0)
    edge : done ["#8ef08e"] else [has [path, a id] ["#ff6b6b"] else [ready ["#ffd166"] else ["#3a4a40"]]]
    half : a kind = "verified" and (has [g closed, a id]) and (done not)
    note : cond [
      half and (has [g signed, a id] not), "verified: needs a witness"
      half, "needs a write-up"
      (a story else false) and (g story != ""), "written up: " .. (g story)
      any, a kind .. " · " .. (a days) .. "d"
    ]
    rect [a x, a y, bw, bh, edge]
    rect [a x + 2, a y + 2, bw - 4, bh - 4, done ["#14301c"] else [half ["#3a3214"] else ["#101814"]]]
    text [a name, a x + (bw / 2), a y + 14, 11, done ["#c8f5c8"] else ["#d6e2d9"]]
    text [note, a x + (bw / 2), a y + 28, 9, "#7d968a"]
  ]

  -- the rollup: done when all its children are done
  parts : rollup contains keep [c | has [ok, c]] length
  all-in : parts = (rollup contains length) and (has [ok, "basis"])
  rect [10, 396, W - 20, 22, "#22302a"]
  rect [10, 396, W - 20 * parts / (rollup contains length), 22, all-in ["#8ef08e"] else ["#2f6b3a"]]
  text ["[rollup name]  [parts]/[rollup contains length]", W / 2, 407, 12, all-in ["#0b0f0d"] else ["#d6e2d9"]]

  text ["ACE  [ok length]/[graph length] done  ·  [to-go [finish-atom, ok, graph]]d of work left", W / 2, 22, 14, "#e8f3e9"]
  text ["green done   amber workable   red critical   grey blocked", W / 2, 40, 9, "#7d968a"]

  -- while the inspection waits for its write-up, the typed outcomes are buttons
  awaiting g
    range 3 each [n |
      rect [button-x n, 432, 105, 28, "#ffd166"]
      rect [button-x n + 2, 434, 101, 24, "#2a2410"]
      text [outcomes @ n, button-x n + 52, 446, 12, "#ffd166"]
    ]
    text ["what did the inspection find?", W / 2, 470, 11, "#c8b98a"]
  awaiting g not
    text [g msg, W / 2, 448, 13, "#ffd166"]
]
````

## examples/ace-site.sp

ACE: positions are expressions over named dimensions, and overlaps are clashes

````sprout
-- ACE site: positions are never stored. Each building's place is an expression over a few named dimensions.
-- Drag left and right on the plan to change the reactor's diameter: everything that depends on it moves.
-- Every rule is a constraint, and the panel shows each one passing or failing.
-- "Must not" rules are clashes: two things can't share ground. "Must" rules are limits the design has to meet.
-- Try Tweak on gap, or on a building's size, while it runs.

gap : 15                  -- metres of road between buildings
site-w : 140              -- the site, in metres
site-h : 180
scale : 2                 -- pixels per metre
ox : 40
oy : 26

start :
  rb-d : 46               -- reactor building diameter, metres
  failing : 0

-- the whole plan, worked out from the reactor diameter d
plan : [d |
  rb : [x : 50, y : 55, r : d / 2]
  tb : [x : rb x + (rb r) + gap, y : 30, w : 46, h : 62]
  sb : [x : rb x - 24, y : rb y + (rb r) + gap, w : 48, h : 26]
  fb : [x : 60, y : 124, w : 34, h : 34]
  [reactor : rb, turbine : tb, service : sb, fuel : fb]
]

-- shapes
overlap : [a b | a x < (b x + (b w)) and (b x < (a x + (a w))) and (a y < (b y + (b h))) and (b y < (a y + (a h)))]
on-site : [a | a x >= 0 and (a y >= 0) and (a x + (a w) <= site-w) and (a y + (a h) <= site-h)]
round-overlap : [c b |
  nx : c x max (b x) min (b x + (b w))
  ny : c y max (b y) min (b y + (b h))
  dist [c x, c y, nx, ny] < (c r)
]
centre-gap : [c b | dist [c x, c y, b x + (b w / 2), b y + (b h / 2)]]

-- every rule is a constraint: a name, the buildings it's about, and whether it holds
constraints : [p |
  [
    [name : "reactor clear of the fuel bay", about : ["reactor", "fuel bay"], kind : "must not", holds : round-overlap [p reactor, p fuel] not]
    [name : "turbine hall clear of the fuel bay", about : ["turbine hall", "fuel bay"], kind : "must not", holds : overlap [p turbine, p fuel] not]
    [name : "service building clear of the fuel bay", about : ["service building", "fuel bay"], kind : "must not", holds : overlap [p service, p fuel] not]
    [name : "turbine hall inside the site", about : ["turbine hall"], kind : "must not", holds : on-site (p turbine)]
    [name : "cable run under 65 m", about : ["reactor", "turbine hall"], kind : "must", holds : centre-gap [p reactor, p turbine] < 65]
    [name : "fire road at least 12 m wide", about : [], kind : "must", holds : gap >= 12]
    [name : "reactor at least 36 m across", about : ["reactor"], kind : "must", holds : p reactor r * 2 >= 36]
  ]
]
fails : [p | constraints p keep [c | c holds not]]

update : [g |
  i : g input
  d : i touching [i touch-x / W * 40 + 25 round] else [g rb-d]
  n : fails (plan d) length
  n > (g failing)
    beep [140, 0.2]
    shake 4
  g with [rb-d : d, failing : n]
]

-- metres to pixels
px : [m | m * scale + ox]
py : [m | m * scale + oy]

draw : [g |
  p : plan (g rb-d)
  all : constraints p
  bad : fails p
  in-trouble : [name | bad keep [c | c about keep [x | x = name] length > 0] length > 0]
  fill : [name normal | in-trouble name ["#5a1f24"] else [normal]]
  box : [b name normal note |
    rect [px (b x), py (b y), b w * scale, b h * scale, in-trouble name ["#ff6b6b"] else ["#4a5a52"]]
    rect [px (b x) + 1, py (b y) + 1, b w * scale - 2, b h * scale - 2, fill [name, normal]]
    text [name, px (b x + (b w / 2)), py (b y + (b h / 2)) - 5, 10, "#e8f3e9"]
    text [note, px (b x + (b w / 2)), py (b y + (b h / 2)) + 7, 8, "#7d968a"]
  ]
  rb : p reactor
  tb : p turbine

  clear "#0b0f0d"
  text ["ACE site  ·  drag to resize the reactor", W / 2, 12, 12, "#e8f3e9"]
  rect [px 0, py 0, site-w * scale, site-h * scale, in-trouble "turbine hall" and (on-site tb not) ["#ff6b6b"] else ["#4a5a52"]]
  rect [px 0 + 1, py 0 + 1, site-w * scale - 2, site-h * scale - 2, "#101814"]

  -- the cable run: a line from the reactor's centre to the turbine hall's
  line [px (rb x), py (rb y), px (tb x + (tb w / 2)), py (tb y + (tb h / 2)), in-trouble "turbine hall" ["#ff6b6b"] else ["#2f6b3a"]]

  box [p fuel, "fuel bay", "#1d2a36", "existing, fixed"]
  box [tb, "turbine hall", "#1c2a22", "x = reactor + gap"]
  box [p service, "service building", "#1c2a22", "y = reactor + gap"]
  circle [px (rb x), py (rb y), rb r * scale, in-trouble "reactor" ["#ff6b6b"] else ["#6f9f80"]]
  circle [px (rb x), py (rb y), rb r * scale - 2, fill ["reactor", "#18301f"]]
  line [px (rb x - (rb r)), py (rb y), px (rb x + (rb r)), py (rb y), "#8ef08e"]
  text ["reactor Ø [g rb-d] m", px (rb x), py (rb y) - 9, 10, "#c8f5c8"]

  -- the constraint panel
  text ["[all length - (bad length)] of [all length] constraints hold", W / 2, 398, 11, bad length = 0 ["#8ef08e"] else ["#ff9e7a"]]
  range (all length) each [n |
    c : all @ n
    text [(c holds ["ok   "] else ["FAIL "]) .. (c kind) .. ": " .. (c name), W / 2, 404 + (n * 10), 9, c holds ["#6f9f80"] else ["#ff6b6b"]]
  ]
]
````

## examples/ace-crews.sp

ACE: sequence and capacity constraints; work waits for what it requires and for a free crew of its trade

````sprout
-- ACE crews: two kinds of constraint, one link.
-- A sequence constraint points at an atom: pour requires rebar.
-- A capacity constraint points at a query: any idle crew of the right trade.
-- Each day, every idle crew takes the first ready work of its trade. Tap a crew to send it home,
-- or bring it back, and watch the work that needs it wait. Tap the top to start again.

work : [
  [id : "excavate", trade : "civil", days : 3, requires : []]
  [id : "piles", trade : "civil", days : 4, requires : ["excavate"]]
  [id : "conduit", trade : "elec", days : 3, requires : ["excavate"]]
  [id : "grounding", trade : "elec", days : 2, requires : ["excavate"]]
  [id : "formwork", trade : "civil", days : 3, requires : ["piles"]]
  [id : "rebar", trade : "iron", days : 4, requires : ["piles"]]
  [id : "embeds", trade : "elec", days : 2, requires : ["rebar"]]
  [id : "pour", trade : "civil", days : 1, requires : ["formwork", "rebar", "embeds"]]
  [id : "columns", trade : "iron", days : 5, requires : ["pour"]]
  [id : "cable-tray", trade : "elec", days : 3, requires : ["columns"]]
]
crews-at-start : [
  [id : "civil 1", trade : "civil", on : true]
  [id : "civil 2", trade : "civil", on : true]
  [id : "iron 1", trade : "iron", on : true]
  [id : "elec 1", trade : "elec", on : true]
]
day-length : 0.45          -- seconds per day
colours : [civil : "#c99a5b", iron : "#7aa2d6", elec : "#d9b84a"]

start :
  packages : work collect [w | w with [status : "waiting", crew : "", begun : 0, left : 0, ended : 0]]
  crews : crews-at-start
  day : 0

has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
an : [word | match [word @ 1, ["a", "an ", "e", "an ", "i", "an ", "o", "an ", "u", "an ", any, "a "]] .. word]

-- one day on site
step : [g |
  today : g day + 1
  -- work in hand moves on a day; anything with no days left is done
  worked : g packages collect [p |
    p status = "working" [p with [left : p left - 1]] else [p]
  ]
  finished : worked collect [p |
    p status = "working" and (p left <= 0) [p with [status : "done", ended : today]] else [p]
  ]
  done-ids : finished keep [p | p status = "done"] collect [p | p id]
  -- the capacity constraint: a crew is free when it's on site and holds no work
  busy : finished keep [p | p status = "working"] collect [p | p crew]
  free : g crews keep [c | c on and (has [busy, c id] not)]
  -- each free crew takes the first waiting work of its trade whose requirements are done
  ready : [p | p status = "waiting" and (p requires keep [r | has [done-ids, r] not] length = 0)]
  assigned : free fold [finished, [ps c |
    pick : ps keep [p | ready p and (p trade = (c trade))] first
    pick = false [ps] else [
      ps collect [p | p id = (pick id) [p with [status : "working", crew : c id, begun : today, left : p days]] else [p]]
    ]
  ]]
  g with [packages : assigned, day : today]
]

-- tapping a crew sends it home, or brings it back
chip-x : [n | n - 1 * 86 + 8]
toggle : [g i |
  hit : range (g crews length) keep [n | i touch-x > (chip-x n) and (i touch-x < (chip-x n + 80)) and (i touch-y > 420) and (i touch-y < 460)] first
  hit = false [g] else [
    g with [crews : range (g crews length) collect [n | n = hit [g crews @ n with [on : g crews @ n on not]] else [g crews @ n]]]
  ]
]

update : [g |
  i : g input
  all-done : g packages keep [p | p status != "done"] length = 0
  tapped-top : i tapped and (i touch-y < 50)
  tapped-crew : i tapped and (i touch-y > 410)
  tapped-crew
    beep [520, 0.05]
  cond [
    tapped-top, start
    tapped-crew, toggle [g, i]
    all-done not and (every [day-length, g clock, g dt]), step g
    any, g
  ]
]

px : [d | d * 8 + 100]
row-y : [n | n * 30 + 46]

draw : [g |
  ps : g packages
  done-ids : ps keep [p | p status = "done"] collect [p | p id]
  busy : ps keep [p | p status = "working"] collect [p | p crew]
  trade-on : [t | g crews keep [c | c trade = t and (c on)] length > 0]
  clear "#0e1311"
  text ["ACE crews · day [g day] · [done-ids length] of [ps length] done", W / 2, 20, 13, "#e8f3e9"]

  -- days along the top, and today
  range 8 each [k | text ["[k - 1 * 4]", px (k - 1 * 4), 40, 9, "#5f7a6c"]]
  line [px (g day), 44, px (g day), 360, rgba [255, 209, 102, 0.6]]

  range (ps length) each [n |
    p : ps @ n
    y : row-y n
    text [p id, 48, y + 10, 11, p status = "done" ["#8ef08e"] else ["#d6e2d9"]]
    waiting : p requires keep [r | has [done-ids, r] not]
    p status = "waiting"
      text [waiting length > 0 ["waits on " .. (join waiting)] else [trade-on (p trade) ["waiting for a free " .. (p trade) .. " crew"] else ["needs " .. (an (p trade)) .. " crew"]], 230, y + 10, 9, waiting length > 0 ["#5f7a6c"] else ["#ff9e7a"]]
    p status = "working"
      rect [px (p begun - 1), y + 3, p days - (p left) * 8 + 2, 14, colours (p trade)]
      rect [px (p begun - 1 + (p days - (p left))), y + 3, p left * 8, 14, rgba [255, 255, 255, 0.12]]
    p status = "done"
      rect [px (p begun - 1), y + 3, p days * 8, 14, colours (p trade)]
  ]

  -- the crews: tap one to send it home
  range (g crews length) each [n |
    c : g crews @ n
    job : ps keep [p | p status = "working" and (p crew = (c id))] collect [p | p id]
    rect [chip-x n, 420, 80, 40, c on [colours (c trade)] else ["#2a332e"]]
    rect [chip-x n + 2, 422, 76, 36, "#141b17"]
    text [c id, chip-x n + 40, 433, 11, c on ["#e8f3e9"] else ["#5f7a6c"]]
    text [c on [job length > 0 [job @ 1] else ["idle"]] else ["sent home"], chip-x n + 40, 448, 9, c on ["#a8b8ae"] else ["#5f7a6c"]]
  ]
  text ["tap a crew to send it home · tap the top to start again", W / 2, 472, 9, "#5f7a6c"]
]
````

## examples/ace-morning.sp

ACE: the morning question; open constraints ranked by the hours of work each would release (prints)

````sprout
-- ACE morning: the morning question.
-- Status meetings ask what happened. The job moves on a different question:
-- which constraints, killed today, release the most work?
-- That's a ranking, worked out here from the graph: for each open constraint, the hours of work
-- that would become workable if it were cleared this morning.

-- the constraints: material, drawings, RFIs, permits, access, crews, inspections
constraints : [
  [id : "permit-dig", name : "Excavation permit", open : false]
  [id : "mat-forms", name : "Formwork on site", open : false]
  [id : "mat-conduit", name : "Conduit delivered", open : false]
  [id : "rfi-112", name : "RFI 112: splice length", open : true]
  [id : "mat-rebar-n", name : "Rebar delivery, north", open : true]
  [id : "mat-rebar-s", name : "Rebar delivery, south", open : true]
  [id : "dwg-elec-c", name : "Electrical drawings rev C", open : true]
  [id : "rfi-118", name : "RFI 118: grounding depth", open : true]
  [id : "mat-bolts", name : "Anchor bolts", open : true]
  [id : "access-south", name : "South access road", open : true]
  [id : "insp-footings", name : "Footing inspection", open : true]
  [id : "permit-crane", name : "Crane lift permit", open : true]
  [id : "mat-steel", name : "Structural steel", open : true]
  [id : "crew-scaffold", name : "Scaffold crew booked", open : true]
  [id : "dwg-arch-b", name : "Architectural drawings rev B", open : true]
]

-- the work packages: hours, and everything each one requires (constraints and other work)
work : [
  [id : "iwp-01", name : "Excavate north footings", hours : 180, done : true, requires : ["permit-dig"]]
  [id : "iwp-02", name : "Form north footings", hours : 220, done : false, requires : ["iwp-01", "mat-forms"]]
  [id : "iwp-03", name : "Rebar north footings", hours : 260, done : false, requires : ["iwp-01", "mat-rebar-n", "rfi-112"]]
  [id : "iwp-04", name : "Pour north footings", hours : 120, done : false, requires : ["iwp-02", "iwp-03", "insp-footings"]]
  [id : "iwp-05", name : "Underground conduit", hours : 160, done : false, requires : ["iwp-01", "mat-conduit", "dwg-elec-c"]]
  [id : "iwp-06", name : "Grounding grid", hours : 140, done : false, requires : ["iwp-01", "rfi-118"]]
  [id : "iwp-07", name : "Set anchor bolts", hours : 90, done : false, requires : ["iwp-03", "mat-bolts"]]
  [id : "iwp-08", name : "Excavate south footings", hours : 180, done : false, requires : ["permit-dig", "access-south"]]
  [id : "iwp-09", name : "Form south footings", hours : 220, done : false, requires : ["iwp-08", "mat-forms"]]
  [id : "iwp-10", name : "Rebar south footings", hours : 260, done : false, requires : ["iwp-08", "mat-rebar-s", "rfi-112"]]
  [id : "iwp-11", name : "Lift steel columns", hours : 300, done : false, requires : ["iwp-04", "permit-crane", "mat-steel"]]
  [id : "iwp-12", name : "Scaffold the east wall", hours : 150, done : false, requires : ["crew-scaffold"]]
  [id : "iwp-13", name : "East wall forms", hours : 240, done : false, requires : ["iwp-12", "mat-forms", "dwg-arch-b"]]
  [id : "iwp-14", name : "Site drainage", hours : 130, done : false, requires : ["access-south", "dwg-elec-c"]]
]

-- yesterday, two things were still open that are closed today
yesterday-open : ["mat-conduit", "iwp-01"]

has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
sum : [xs | xs fold [0, [t x | t + x]]]
name-of : [want | (constraints .. work) keep [a | a id = want] first name]

-- what's done, given a list of extra ids to count as cleared
done-with : [extra | (constraints keep [c | c open not] collect [c | c id]) .. (work keep [w | w done] collect [w | w id]) .. extra]
-- work that can start: not done, and everything it requires is done
workable : [cleared | work keep [w | w done not and (w requires keep [r | has [cleared, r] not] length = 0)]]
-- the work an extra clearance would release: workable then, but not now
released : [extra | now : workable (done-with []) collect [w | w id], workable (done-with extra) keep [w | has [now, w id] not]]

open-ones : constraints keep [c | c open]
ranking : open-ones collect [c |
  r : released [c id]
  [id : c id, name : c name, packages : r, hours : sum (r collect [w | w hours])]
]
sort-by-hours : [xs |
  xs length < 2 [xs] else [
    p : xs @ 1
    rest : range (xs length - 1) collect [k | xs @ (k + 1)]
    sort-by-hours (rest keep [x | x hours > (p hours)]) .. [p] .. (sort-by-hours (rest keep [x | x hours <= (p hours)]))
  ]
]
ranked : sort-by-hours ranking

-- since yesterday
today-done : done-with []
yesterday-done : today-done keep [x | has [yesterday-open, x] not]
new-work : workable today-done keep [w | has [workable yesterday-done collect [x | x id], w id] not]
"== since yesterday ==" print
"cleared   " .. (join (yesterday-open collect name-of)) print
"can start " .. (join (new-work collect [w | w name])) print
ready-now : workable today-done
packages-word : ready-now length = 1 ["package"] else ["packages"]
"ready     [ready-now length] [packages-word], [sum (ready-now collect [w | w hours])] hours" print

"" print
"== which constraints, killed today, release the most work? ==" print
range (ranked length) each [n |
  c : ranked @ n
  c hours > 0
    first : n = 1 ["   <- this one first"] else [""]
    count : c packages length
    plural : count = 1 ["package"] else ["packages"]
    hrs : c hours .. " h"
    "[n]. [pad [c name, 30]] [pad [hrs, 7]] [count] [plural][first]" print
]

-- constraints that release nothing alone: the work behind them needs another constraint too
"" print
"== release nothing on their own ==" print
ranked keep [c | c hours = 0] each [c |
  -- only the work that needs both: what the pair releases, less what the partner releases alone
  both : [o | alone : released [o id] collect [w | w id], released [c id, o id] keep [w | has [alone, w id] not]]
  best : open-ones keep [o | o id != (c id)] collect [o | [name : o name, hours : sum (both o collect [w | w hours])]] fold [[name : "", hours : 0], [b x | x hours > (b hours) [x] else [b]]]
  best hours > 0
    "   [pad [c name, 30]] with [best name]: [best hours] h" print
  best hours = 0
    "   [pad [c name, 30]] waits on other work first" print
]
````

## examples/ace-ledger.sp

ACE: the atoms live in SQLite; each run closes the first workable atom and logs it (prints; uses db)

````sprout
-- ACE ledger: the atoms live in SQLite, done is derived in Sprout, and every step is written to an event log.
-- Each run is one day on site: the first workable atom is closed, and the closure is logged.
-- The database is kept in this browser, so run it again and the project moves on a day.
-- (To start over, clear the database in the State tab.)

-- the tables, made once
db run "create table if not exists atoms (id text primary key, name text, closed integer)"
db run "create table if not exists links (atom text, needs text)"
db run "create table if not exists events (n integer primary key autoincrement, day integer, atom text, note text)"

-- the first time, fill them in: atoms, and what each one requires
empty : db query "select count(*) as n from atoms" first n = 0
empty
  db run "insert into atoms values ('permit', 'Excavation permit', 1), ('survey', 'Survey and layout', 0), ('dig', 'Excavate pedestal', 0), ('rebar', 'Rebar delivered', 0), ('place', 'Place rebar', 0), ('inspect', 'Pre-pour inspection', 0), ('pour', 'Pour concrete', 0)"
  db run "insert into links values ('dig', 'permit'), ('dig', 'survey'), ('place', 'dig'), ('place', 'rebar'), ('inspect', 'place'), ('pour', 'inspect')"

has : [xs want | xs keep [x | x = want] length > 0]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
needs-of : [want | db query ["select needs from links where atom = ?", [want]] collect [l | l needs]]

-- derive what can be worked from the rows: done is never a column we trust on its own
workable-in : [rows |
  done : rows keep [a | a closed = 1] collect [a | a id]
  rows keep [a | a closed = 0 and (needs-of (a id) keep [x | has [done, x] not] length = 0)]
]

-- today: close the first workable atom, and write it down
this-day : db query "select count(*) as n from events" first n + 1
today : workable-in (db query "select id, name, closed from atoms order by rowid") first
today != false
  db run ["update atoms set closed = 1 where id = ?", [today id]]
  db run ["insert into events (day, atom, note) values (?, ?, ?)", [this-day, today id, "closed " .. (today name)]]

-- the state of the job, read back from the database
after : db query "select id, name, closed from atoms order by rowid"
next-up : workable-in after collect [a | a id]
"== day [this-day] ==" print
after each [a |
  mark : a closed = 1 ["\[x]"] else [has [next-up, a id] ["\[>]"] else ["\[ ]"]]
  "[mark] [pad [a name, 22]] needs " .. (needs-of (a id) fold ["nothing", [s x | s = "nothing" [x] else [s .. ", " .. x]]]) print
]
"" print
"== the event log, newest first ==" print
db query "select day, note from events order by n desc limit 5" each [e | "day [e day]  [e note]" print]
next-up length = 0
  "" print
  "the pedestal is finished" print
````

## examples/ace-risk.sp

ACE: a million runs of the job with a risk register, through spork; the finish as a distribution, and what each risk adds at P80 (prints)

````sprout
-- ACE risk: the same pedestal job as ace-schedule, run a million times with a risk register.
-- Each run samples every duration and rolls every risk, then walks the graph five times:
-- once with every risk, and once with each risk left out, so we can see what each one costs.
-- spork works one-run out ahead into a single kernel (decision 91), so the million runs take
-- milliseconds, on WebAssembly SIMD or on the GPU (decision 93). Swap spork for collect to compare.

atoms : [
  [id : "permit", requires : [], dur : [0, 0, 0]]
  [id : "survey", requires : [], dur : [1, 2, 3]]
  [id : "dig", requires : ["permit", "survey"], dur : [3, 4, 7]]
  [id : "rebar", requires : [], dur : [5, 8, 15]]
  [id : "rfi", requires : [], dur : [2, 5, 12]]
  [id : "formwork", requires : ["dig"], dur : [2, 3, 5]]
  [id : "place-rebar", requires : ["dig", "rebar", "rfi"], dur : [3, 4, 6]]
  [id : "inspect", requires : ["place-rebar"], dur : [1, 1, 2]]
  [id : "pour", requires : ["inspect", "formwork"], dur : [1, 1, 2]]
  [id : "cure", requires : ["pour"], dur : [7, 7, 10]]
]
last-atom : "cure"
runs : 1000000
seed : 7                   -- the same seed always gives the same answer

-- the risk register: what can go wrong, how often in a run, how many days it adds, and to what
risks : [
  [name : "wet weather on the pour", chance : 0.30, delay : 3, hits : "pour"]
  [name : "rebar delivered late", chance : 0.15, delay : 5, hits : "rebar"]
  [name : "slow answer to the RFI", chance : 0.20, delay : 4, hits : "rfi"]
  [name : "inspection fails, rework", chance : 0.10, delay : 3, hits : "inspect"]
]

find : [want ds | ds keep [a | a id = want] first]
-- earliest finish: the latest finish of everything required, plus this atom's own time
finish : [want ds |
  a : find [want, ds]
  (a requires collect [r | finish [r, ds]] fold [0, [m x | m max x]]) + (a days)
]
-- a time from a triangle, given u from 0 up to 1
tri : [t u |
  lo : t @ 1, mode : t @ 2, hi : t @ 3
  hi = lo [lo] else [
    u < (mode - lo / (hi - lo)) [lo + (u * (hi - lo) * (mode - lo) sqrt)] else [hi - (1 - u * (hi - lo) * (hi - mode) sqrt)]
  ]
]

-- one run: the draws come from noise [run, id], so they are the same whichever way the runs are done
one-run : [n |
  base : range (atoms length) collect [k | tri [atoms @ k dur, noise [n, k + (seed * 1000)]]]
  hit : range (risks length) collect [j | noise [n, 900 + j + (seed * 1000)] < (risks @ j chance)]
  -- the finish with every risk that happened, leaving out risk number off (0 leaves none out)
  finish-without : [off |
    ds : range (atoms length) collect [k |
      a : atoms @ k
      extra : range (risks length) fold [0, [t j | (j != off) and (hit @ j) and (risks @ j hits = (a id)) [t + (risks @ j delay)] else [t]]]
      a with [days : base @ k + extra]
    ]
    finish [last-atom, ds]
  ]
  [all : finish-without 0, weather : finish-without 1, rebar : finish-without 2, rfi : finish-without 3, inspection : finish-without 4]
]

results : range runs spork one-run
finishes : results collect [r | r all] sort
pct : [xs p | xs @ (p * runs ceil)]
-- how many runs finish before day d: a binary search in the sorted finishes
below : [d |
  go : [lo hi | lo >= hi [lo] else [
    mid : lo + hi / 2 floor
    finishes @ (mid + 1) < d [go [mid + 1, hi]] else [go [lo, mid]]
  ]]
  go [0, runs]
]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
bar : [n | range n fold ["", [s k | s .. "#"]]]
day : [x | x * 10 round / 10]

"== [runs] runs of the pedestal job ==" print
"P10 day [day (pct [finishes, 0.1])]   P50 day [day (pct [finishes, 0.5])]   P80 day [day (pct [finishes, 0.8])]   P90 day [day (pct [finishes, 0.9])]" print
"" print
first-day : finishes @ 1 floor
last-day : finishes @ runs ceil
range (last-day - first-day / 2 + 1 ceil) each [k |
  from : k - 1 * 2 + first-day
  n : below (from + 2) - (below from)
  share : (n * 100 / runs * 10 round / 10) str .. "%"
  "day [pad [from str, 3]] [pad [share, 6]] [bar (n * 300 / runs ceil)]" print
]
"" print
"chance of finishing by day 26: [below 26 * 100 / runs round]%" print

-- what each risk adds at P80: the P80 with it, take away the P80 without it
"" print
"== what each risk adds to P80 ==" print
p80 : pct [finishes, 0.8]
adds : [xs | p80 - (pct [xs sort, 0.8]) * 10 round / 10]
"[pad [risks @ 1 name, 26]] +[adds (results collect [r | r weather])] days" print
"[pad [risks @ 2 name, 26]] +[adds (results collect [r | r rebar])] days" print
"[pad [risks @ 3 name, 26]] +[adds (results collect [r | r rfi])] days" print
"[pad [risks @ 4 name, 26]] +[adds (results collect [r | r inspection])] days" print
````

## examples/recipes.sp

Recipes: quicksort, primes, FizzBuzz, a vector with its own + (prints; not a game)

````sprout
-- Recipes: small programs in Sprout 3. Each one prints its answer.

-- quicksort: keep splits the list, .. joins it back up
sort : [xs |
  xs length < 2 [xs] else [
    p : xs @ 1
    rest : range (xs length - 1) collect [k | xs @ (k + 1)]
    sort (rest keep [v | v < p]) .. [p] .. (sort (rest keep [v | v >= p]))
  ]
]
sort [5, 3, 9, 1, 4, 1, 8] print

-- primes: numbers with no divisor between 2 and themselves
divides : [k d | k % d = 0]
prime : [k | k > 1 and (range (k - 1) keep [d | d > 1 and (divides [k, d])] length = 0)]
range 50 keep prime print

-- FizzBuzz with cond: the first true test gives its result
range 15 collect [n | cond [n % 15 = 0, "FizzBuzz", n % 3 = 0, "Fizz", n % 5 = 0, "Buzz", any, n]] print

-- a word backwards, built with fold
backwards : [s | range (s length) fold ["", [done k | (s @ k) .. done]]]
backwards "sprout" print
backwards "level" = "level" print

-- Collatz: how many steps down to 1
steps : [n | n = 1 [0] else [1 + (steps (n % 2 = 0 [n / 2] else [n * 3 + 1]))]]
steps 27 print

-- Pascal's triangle: each row from the one above
next-row : [r | [1] .. (range (r length - 1) collect [k | r @ k + (r @ (k + 1))]) .. [1]]
range 6 fold [[1], [r k | r print, next-row r]]

-- a vector that knows +, * and its own size
vec : [
  + : [right | left with [x : left x + (right x), y : left y + (right y)]]
  * : [right | left with [x : left x * right, y : left y * right]]
  size : [left x * (left x) + (left y * (left y)) sqrt]
]
v : vec with [x : 3, y : 4]
v size print
w : v + v * 2
"[w x], [w y]" print

-- match picks by value; take keeps the first few
days : ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
take [days, 3] print
days collect [d | match [d, ["sat", "rest", "sun", "rest", any, "work"]]] print
````

## index.html

The web page at taskiap.com/sprout3/

````html
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#262624" media="(prefers-color-scheme: dark)">
<title>Sprout 3</title>
<style>
:root{--bg:#f5f4ee;--side:#efede4;--card:#fffefb;--card2:#faf9f5;--line:#e4e1d6;--line2:#d4d0c3;--fg:#1f1e1d;--fg2:#5f5d55;--fg3:#8d8a80;
 --acc:#d97757;--acc2:#c4613f;--accbg:rgba(217,119,87,.13);--ok:#3f8f5a;--warn:#a8701a;--bad:#c4453b;--badbg:#fbeae6;
 --shadow:0 1px 2px rgba(31,30,29,.05),0 8px 28px rgba(31,30,29,.08);--art:0 2px 6px rgba(31,30,29,.1),0 18px 40px rgba(31,30,29,.16);
 --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,Roboto,"Helvetica Neue",sans-serif;
 --serif:ui-serif,"New York","Iowan Old Style",Charter,Georgia,"Times New Roman",serif;
 --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
 --LH:21px;--PAD:12px;--bar:76px;
 --c:#9b978b;--s:#a65a22;--n:#2d6db5;--k:#8a4fb3;--a:#2f7d4a;--o:#c4613f;--tp:rgba(166,90,34,.1)}
@media (prefers-color-scheme:dark){:root{--bg:#262624;--side:#1f1e1d;--card:#30302e;--card2:#2b2a28;--line:#3d3c38;--line2:#4b4a45;--fg:#ecebe4;--fg2:#b5b3aa;--fg3:#87857c;
 --acc:#e08a6b;--acc2:#d97757;--accbg:rgba(224,138,107,.16);--ok:#7fc495;--warn:#e0b25c;--bad:#ec8b80;--badbg:#3a2624;
 --shadow:0 1px 2px rgba(0,0,0,.25),0 10px 30px rgba(0,0,0,.3);--art:0 2px 6px rgba(0,0,0,.3),0 20px 46px rgba(0,0,0,.45);
 --c:#8a887e;--s:#e3b07a;--n:#8ab4f8;--k:#c9a7ff;--a:#9fd39a;--o:#e08a6b;--tp:rgba(227,176,122,.12)}}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--fg);font:14px/1.45 var(--sans);overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
button,input{font:inherit;color:inherit}
button{cursor:pointer;background:none;border:0;padding:0}
#app{position:fixed;left:0;right:0;top:0;height:100%;display:grid;grid-template-columns:248px 1fr;grid-template-rows:1fr var(--bar)}

/* library sidebar */
#side{grid-row:1;background:var(--side);border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;padding-top:env(safe-area-inset-top)}
.brand{display:flex;align-items:center;gap:10px;padding:18px 18px 10px;text-decoration:none;color:var(--fg)}
.brand .logo{width:28px;height:28px;border-radius:8px;background:var(--acc);display:grid;place-items:center;color:#fff;font:600 15px var(--serif)}
.brand b{font:600 19px var(--serif);letter-spacing:-.01em}
.brand small{color:var(--fg3);font-size:12px;margin-left:auto}
#lib{flex:1;overflow:auto;padding:4px 10px 16px}
.lh{font-size:11.5px;font-weight:600;color:var(--fg3);padding:14px 10px 6px}
.li{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:6px 8px;border-radius:9px;color:var(--fg)}
.li:hover{background:rgba(127,120,100,.09)}
.li.on{background:var(--accbg)}.li.on .nm{color:var(--acc2);font-weight:600}
img.th[src=""]{content:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='4'/%3E")}
.li .th{width:34px;height:34px;border-radius:7px;flex:0 0 auto;background:var(--card2);box-shadow:0 0 0 1px var(--line);object-fit:cover}
.li .nm{display:block;font-size:13.5px;line-height:1.2}.li .ds{display:block;font-size:12px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
.sidefoot{padding:10px 14px 14px;border-top:1px solid var(--line);display:flex;gap:8px}
.sidefoot .pill{white-space:nowrap;text-decoration:none;padding:0 13px}

/* main: artwork on the left, the details and the editor on the right */
#main{grid-row:1;min-width:0;min-height:0;position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr);gap:28px;padding:28px 28px 20px;padding-top:calc(28px + env(safe-area-inset-top))}
#glow{position:absolute;left:-10%;top:-30%;width:70%;height:80%;filter:blur(80px) saturate(2) brightness(1.7);opacity:.3;pointer-events:none;z-index:0}
@media (prefers-color-scheme:dark){#glow{opacity:.3;filter:blur(80px) saturate(1.6) brightness(1.1)}}
#artcol,#detail{position:relative;z-index:1;min-height:0}
#artcol{display:flex;flex-direction:column;align-items:center;justify-content:flex-start}
#stage{position:relative;border-radius:16px;overflow:hidden;box-shadow:var(--art);background:#000}
#cv{display:block;touch-action:none;position:relative;z-index:1}
#gv{display:none;position:absolute;left:0;top:0;z-index:0}body.gpu #gv{display:block}
.rend{height:24px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;color:var(--fg2);background:rgba(127,120,100,.12);margin-right:4px}.rend.on{color:#fff;background:var(--acc)}
#noGame{display:none;width:100%;height:100%;position:absolute;inset:0;align-items:center;justify-content:center;text-align:center;padding:28px;background:var(--card);color:var(--fg2);font:17px/1.5 var(--serif)}
#noGame b{color:var(--acc2);font-weight:600}
#noGame{background-size:cover;background-position:center}#noGame.has-art{color:#fff;align-items:flex-end;justify-content:flex-start;text-align:left;font:500 14px/1.4 var(--sans)}#noGame.has-art b{color:#fff}
body.prog .scrub,body.prog #bBack,body.prog #sMs{visibility:hidden}body.prog #bRestart{display:none}
body.prog #noGame{display:flex}
#detail{display:flex;flex-direction:column;min-width:0}
.kicker{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--acc2)}
#title{font:600 34px/1.1 var(--serif);letter-spacing:-.015em;margin:4px 0 6px}
#desc{color:var(--fg2);font-size:14.5px;max-width:62ch;margin:0}
#meta{color:var(--fg3);font-size:12.5px;margin-top:4px}
#meta .dot{color:var(--acc)}
.acts{display:flex;gap:10px;margin:16px 0 18px;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 16px;border-radius:999px;background:var(--card);box-shadow:0 0 0 1px var(--line);font-weight:600;font-size:13.5px;color:var(--fg)}
.pill:hover{box-shadow:0 0 0 1px var(--line2)}
.pill.pri{background:var(--acc);color:#fff;box-shadow:none}.pill.pri:hover{background:var(--acc2)}
.pill svg{width:14px;height:14px;fill:currentColor}

/* segmented control and the card under it */
.seg{display:inline-flex;align-self:flex-start;background:rgba(127,120,100,.12);border-radius:9px;padding:2px;margin-bottom:10px}
.seg button{padding:5px 14px;border-radius:7px;font-size:13px;font-weight:500;color:var(--fg2)}
.seg button.on{background:var(--card);color:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.12)}
.seg i{font-style:normal;font-size:11px;background:var(--acc);color:#fff;border-radius:999px;padding:0 6px;margin-left:5px}
#segrow{display:flex;align-items:center;gap:10px;margin-bottom:10px}#segrow .seg{margin-bottom:0}
.twk{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;font-size:13px;font-weight:500;color:var(--fg2);background:rgba(127,120,100,.12)}
.twk svg{width:14px;height:14px;fill:currentColor}.twk.on{background:var(--acc);color:#fff}
body.t-st .twk,body.t-out .twk{visibility:hidden}
body.tweak #hl .n{border-bottom:1.5px dotted currentColor;border-radius:0}body.tweak #ta{cursor:ew-resize;touch-action:pan-y}
body.tweak #keys{display:none!important}
body.scrubbing,body.scrubbing *{cursor:ew-resize!important;user-select:none!important}
#scrubTip{position:fixed;z-index:40;pointer-events:none;background:var(--fg);color:var(--bg);font:600 12px var(--mono);padding:3px 8px;border-radius:6px;display:none;transform:translate(-50%,-140%)}
#card{position:relative;flex:1;min-height:0;background:var(--card);border-radius:14px;box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column}
#err{display:none;align-items:flex-start;gap:10px;margin:10px 10px 0;padding:9px 12px;border-radius:10px;background:var(--badbg);color:var(--bad);font-size:13px;cursor:pointer}
#err.on{display:flex}#err b{font-weight:600}#err span{flex:1}#err u{text-decoration:none;font-weight:600;white-space:nowrap}
#ed{position:relative;flex:1;min-height:0;overflow:hidden}
#gut,#hl,#ta{font:13px/var(--LH) var(--mono);tab-size:2;font-variant-ligatures:none}
#gut{position:absolute;left:0;top:0;width:42px;padding:var(--PAD) 10px var(--PAD) 0;text-align:right;color:var(--fg3);opacity:.7;white-space:pre;pointer-events:none;z-index:3;background:var(--card);min-height:100%}
#hl,#ta{position:absolute;inset:0;margin:0;padding:var(--PAD) 16px var(--PAD) 52px;white-space:pre;overflow:auto;border:0;outline:none}
#hl{z-index:1;color:var(--fg);pointer-events:none;overflow:hidden}
#ta{z-index:2;background:transparent;color:transparent;caret-color:var(--acc);resize:none;-webkit-text-fill-color:transparent}
#ta::selection{background:var(--accbg)}
.mark{position:absolute;left:0;right:0;height:var(--LH);z-index:0;pointer-events:none;display:none}
.mark.on{display:block}
#errl{background:var(--badbg)}
#smarks{position:absolute;left:0;top:0;width:4px;height:100%;z-index:4;pointer-events:none;overflow:hidden}
#smarks i{position:absolute;left:1px;width:3px;border-radius:2px;height:calc(var(--LH) - 4px)}
#smarks .f{background:var(--ok)}#smarks .s{background:var(--warn);opacity:.55}
.sh{font:600 15px var(--serif);padding:16px 18px 4px}.sp .k2::before{content:"";display:inline-block;width:3px;height:12px;border-radius:2px;margin-right:8px;vertical-align:-1px;background:var(--warn);opacity:.6}.sp.f .k2::before{background:var(--ok);opacity:1}
#live{background:var(--accbg);transition:opacity .7s}#live.fade{opacity:0}
i{font-style:normal}
.c{color:var(--c);font-style:italic}.s{color:var(--s)}.n{color:var(--n)}.k{color:var(--k)}.a{color:var(--a)}.o{color:var(--o)}.tp{background:var(--tp);border-radius:3px}
#st,#out{flex:1;min-height:0;overflow:auto;margin:0;padding:10px 0 40px;display:none}
.row{display:grid;grid-template-columns:minmax(90px,max-content) 1fr;gap:18px;padding:7px 18px;border-bottom:1px solid var(--line);font-size:13px}
.row:hover{background:var(--card2)}.row .k2{color:var(--fg2)}.row .v{font-family:var(--mono);font-size:12.5px;word-break:break-word}
.foot{color:var(--fg3);font-size:12px;padding:12px 18px}
#out .ln{font:12.5px/1.6 var(--mono);padding:1px 18px;white-space:pre-wrap;word-break:break-word}
#out .log{color:var(--warn)}#out .log::before{content:"note ";opacity:.6}
body.t-out #ed,body.t-st #ed{display:none}
body.t-out #out{display:block}body.t-st #st{display:block}
#keys{display:none;gap:6px;padding:8px 10px;overflow-x:auto;border-top:1px solid var(--line);background:var(--card2)}
@media (hover:none){body.t-code #keys{display:flex}}
#keys button{flex:0 0 auto;min-width:38px;height:34px;border-radius:8px;background:var(--card);box-shadow:0 0 0 1px var(--line);font:500 15px var(--mono)}

/* now-playing bar */
#player{grid-column:1/-1;grid-row:2;position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(0,1fr);align-items:center;gap:18px;padding:0 20px;padding-bottom:env(safe-area-inset-bottom);
 background:color-mix(in srgb,var(--card) 82%,transparent);backdrop-filter:saturate(1.6) blur(24px);-webkit-backdrop-filter:saturate(1.6) blur(24px);border-top:1px solid var(--line);z-index:5}
.np{display:flex;align-items:center;gap:12px;min-width:0}
#pArt{width:48px;height:48px;border-radius:8px;box-shadow:0 0 0 1px var(--line),0 2px 8px rgba(0,0,0,.12);flex:0 0 auto;background:#000}
#pTitle{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pSub{font-size:12.5px;color:var(--fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pSub .live{color:var(--acc2);font-weight:600}#pSub .bad{color:var(--bad);font-weight:600}
.ctr{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.tr{display:flex;align-items:center;gap:22px}
.tb{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:var(--fg)}
.tb svg{width:20px;height:20px;fill:currentColor}.tb:hover{background:rgba(127,120,100,.12)}
.tb.big{width:40px;height:40px;background:var(--fg);color:var(--bg)}.tb.big svg{width:18px;height:18px}.tb.big:hover{background:var(--fg2)}
.scrub{display:flex;align-items:center;gap:10px;width:100%;max-width:520px;font-size:11px;color:var(--fg3);font-variant-numeric:tabular-nums}
#tlR{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:linear-gradient(to right,var(--fg2) 0 var(--p,100%),var(--line2) var(--p,100%));outline:none;margin:0}
#tlR::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--fg);box-shadow:0 1px 3px rgba(0,0,0,.3)}
#tlR::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:var(--fg)}
#tlR:disabled{opacity:.5}
#tlB.live{color:var(--acc2);font-weight:700;letter-spacing:.04em}
.rt{display:flex;justify-content:flex-end;align-items:center;gap:6px}
#sMs{font-size:11.5px;color:var(--fg3);margin-right:6px;font-variant-numeric:tabular-nums;white-space:nowrap}
.ptl{display:none}

/* sheets: the library on small screens, and the spec */
#modal{position:fixed;inset:0;background:rgba(20,18,15,.38);display:none;align-items:center;justify-content:center;z-index:20;padding:20px;backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
#modal.on{display:flex}
#mBox{width:100%;max-width:820px;max-height:88%;display:flex;flex-direction:column;background:var(--card);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden}
.mh{display:flex;align-items:center;padding:16px 20px 10px}
.mh h2{flex:1;margin:0;font:600 22px var(--serif)}
.x{width:30px;height:30px;border-radius:50%;background:rgba(127,120,100,.14);display:grid;place-items:center;font-size:16px;color:var(--fg2)}
#mBody{overflow:auto;padding:0 20px 22px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:18px 14px}
.tile{text-align:left;color:var(--fg);display:flex;flex-direction:column;align-items:stretch;align-self:start}
.tile .th{width:100%;aspect-ratio:3/4;border-radius:10px;display:block;box-shadow:0 0 0 1px var(--line),0 6px 18px rgba(0,0,0,.1);background:var(--card2);object-fit:cover;transition:transform .15s}
.tile:hover .th{transform:translateY(-2px)}
.tile b{display:block;font-size:13.5px;font-weight:600;margin-top:7px}.tile small{display:block;font-size:12px;color:var(--fg3)}
.gh{font:600 17px var(--serif);margin:18px 0 10px}
.md{font:16px/1.65 var(--serif);max-width:720px;margin:0 auto;color:var(--fg)}
.md h1,.md h2,.md h3,.md h4{font-family:var(--serif);font-weight:600;letter-spacing:-.01em;line-height:1.25}
.md h1{font-size:26px}.md h2{font-size:21px;margin-top:30px}.md h3{font-size:17px;margin-top:22px}
.md code{font:13px var(--mono);background:var(--card2);box-shadow:0 0 0 1px var(--line);padding:1px 5px;border-radius:5px}
.md pre{background:var(--card2);border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow:auto}.md pre code{box-shadow:none;padding:0;background:none}
.md table{border-collapse:collapse;display:block;overflow:auto;font:14px/1.45 var(--sans)}.md td,.md th{border-bottom:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}.md th{color:var(--fg3);font-weight:600}
.md hr,#mBody>hr{border:0;border-top:1px solid var(--line);margin:22px 0}
.md ul{padding-left:20px}.md li{margin:4px 0}.md .num{color:var(--acc2);font:600 14px var(--sans)}
.md a{color:var(--acc2)}
.intro{font:14.5px/1.6 var(--sans);color:var(--fg2);background:var(--accbg);border-radius:12px;padding:12px 16px;max-width:720px;margin:0 auto}
.intro b{color:var(--fg)}.intro a{color:var(--acc2);font-weight:600}
#toast{position:fixed;left:50%;bottom:calc(var(--bar) + 14px);transform:translate(-50%,8px);background:var(--fg);color:var(--bg);padding:8px 16px;border-radius:999px;font-size:13px;font-weight:500;z-index:30;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;max-width:88%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.2)}
#toast.on{opacity:1;transform:translate(-50%,0)}
#libBtn{display:none}

/* medium screens: no sidebar; the library opens as a sheet */
@media (max-width:1080px){#app{grid-template-columns:1fr}#side{display:none}#main{grid-column:1}#libBtn{display:inline-flex}#bSpec{display:none}}
.mh .pill{margin-right:10px;height:30px;padding:0 12px}
/* phones: everything stacks, and the bar becomes a mini player */
@media (max-width:720px){
 :root{--bar:64px}
 #main{grid-template-columns:1fr;grid-template-rows:auto auto auto minmax(0,1fr);gap:10px;padding:12px 12px 10px;padding-top:calc(12px + env(safe-area-inset-top))}
 #detail{display:contents}
 #head{grid-row:1;display:flex;flex-direction:column}
 #artcol{grid-row:2}
 #segrow{grid-row:3;margin:0}
 #card{grid-row:4}
 #title{font-size:24px;margin:0}#desc{display:none}#meta{margin-top:0}
 .acts{margin:8px 0 0;gap:8px}.pill{height:30px;padding:0 12px;font-size:13px}
 #player{grid-template-columns:minmax(0,1fr) auto auto;gap:6px;padding:0 10px 0 12px;padding-bottom:env(safe-area-inset-bottom)}
 #bRestart{display:none}
 .scrub,#sMs,.opt{display:none}.tr{gap:6px}.ctr{flex-direction:row}
 #pArt{width:40px;height:40px}
 .ptl{display:block;position:absolute;left:0;right:0;top:0;height:2px;background:var(--line)}.ptl i{display:block;height:100%;background:var(--acc);width:var(--p,100%)}
 body.kb #artcol,body.kb #head{display:none}
 #modal{align-items:flex-end;padding:0}#mBox{max-height:92%;border-radius:18px 18px 0 0;animation:up .28s cubic-bezier(.2,.8,.2,1)}
 #mBox::before{content:"";display:block;width:38px;height:5px;border-radius:3px;background:var(--line2);margin:8px auto 0}
 .grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@keyframes up{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
</style></head><body class="t-code">
<div id="app">
<aside id="side">
 <a class="brand" href="/" title="All apps"><span class="logo">S</span><b>Sprout 3</b><small>library</small></a>
 <div id="lib"></div>
 <div class="sidefoot"><button class="pill" id="bSpec2">Read the spec</button> <a class="pill" href="bench.html" target="_blank" rel="noopener">Benchmarks</a></div>
</aside>
<main id="main">
 <canvas id="glow" width="36" height="48"></canvas>
 <div id="artcol"><div id="stage"><canvas id="gv" width="360" height="480"></canvas><canvas id="cv" width="360" height="480"></canvas><div id="noGame"><div id="noGameT">This one isn't a game: it has no <b>update</b>.<br>What it prints is under Output.</div></div></div></div>
 <section id="detail">
  <div id="head">
   <div class="kicker" id="kicker">Atomic Constraint Engine</div>
   <h1 id="title">Sprout 3</h1>
   <p id="desc"></p>
   <div id="meta"></div>
   <div class="acts">
    <button class="pill pri" id="bPlayBig"><svg viewBox="0 0 16 16"><path id="playIcon" d="M4 3h3v10H4zM9 3h3v10H9z"/></svg><span id="playL">Pause</span></button>
    <button class="pill" id="libBtn">Library</button>
    <button class="pill" id="bRestart">Restart</button>
    <button class="pill" id="bShare">Share</button>
    <button class="pill" id="bSpec">Spec</button>
   </div>
  </div>
  <div id="segrow"><div class="seg" id="tabs"><button class="on" data-t="code">Code</button><button data-t="st">State</button><button data-t="out">Output<i id="outN" hidden></i></button></div>
   <button class="twk" id="bTweak" title="Drag numbers to change them while it runs (or hold Alt and drag)"><svg viewBox="0 0 16 16"><path d="M1 8l3-3v2h8V5l3 3-3 3V9H4v2z"/></svg>Tweak</button></div>
  <div id="card">
   <div id="err"><span></span><u>Go to line</u></div>
   <div id="ed"><div id="smarks"></div><div class="mark" id="live"></div><div class="mark" id="errl"></div><div id="gut"></div><pre id="hl"></pre><textarea id="ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Code"></textarea></div>
   <div id="st"></div>
   <div id="out"></div>
   <div id="keys"></div>
  </div>
 </section>
</main>
<footer id="player">
 <div class="ptl"><i id="ptlI"></i></div>
 <div class="np"><canvas id="pArt" width="96" height="96"></canvas><div style="min-width:0"><div id="pTitle">Sprout 3</div><div id="pSub"></div></div></div>
 <div class="ctr">
  <div class="tr">
   <button class="tb opt" id="bBack" title="Back to the oldest saved moment"><svg viewBox="0 0 20 20"><path d="M3 4h2v12H3zM17 4v12L7 10z"/></svg></button>
   <button class="tb big" id="bPlay" title="Pause and play (F7)"><svg viewBox="0 0 20 20"><path id="playIcon2" d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z"/></svg></button>
   <button class="tb" id="bRestart2" title="Start again (F8)"><svg viewBox="0 0 20 20"><path d="M10 3a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 10 5v2.5L6 4l4-3.5z"/></svg></button>
  </div>
  <div class="scrub"><span id="tlA">0:00</span><input type="range" id="tlR" min="0" max="0" value="0" aria-label="Rewind time"><span id="tlB" class="live">LIVE</span></div>
 </div>
 <div class="rt"><span id="sMs"></span><button class="rend" id="bGpu" hidden title="Which renderer draws the game: WebGPU (one draw call per frame) or Canvas 2D. Click to switch and compare."></button><button class="tb" id="bSnd" title="Sound (F9)"><svg viewBox="0 0 20 20"><path id="sndIcon" d="M3 7h3l5-4v14l-5-4H3z"/></svg></button></div>
</footer>
</div>
<div id="modal"><div id="mBox"><div class="mh"><h2 id="mTitle"></h2><button class="x" data-close aria-label="Close">✕</button></div><div id="mBody"></div></div></div>
<div id="toast"></div><div id="scrubTip"></div>

<script src="sprout3.js?v=20261120g"></script>
<script src="live3.js?v=20261120g"></script>
<script src="sqlite-web.js?v=20261120g"></script>
<script src="gpu-paint.js?v=20261120g"></script>
<script src="gpu-spork.js?v=20261120g"></script>
<script>
"use strict";
const V="20261120g";
const $=id=>document.getElementById(id);
const S=window.Sprout3,L=window.Sprout3Live;
const GW=360,GH=480;
const cv=$("cv"),g=cv.getContext("2d"),ta=$("ta"),hl=$("hl"),gut=$("gut");
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let toastT=0;function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),2600)}
const EX=[
 ["ace-board","ace","ACE Board","Tap work to close it. Gates, the rollup and the critical path follow, because done is derived from the graph, never stored."],
 ["ace-site","ace","ACE Site","Positions are expressions over named dimensions. Grow the reactor and watch the buildings move, and clash."],
 ["ace-schedule","ace","ACE Schedule","The critical path on likely durations, then a Monte Carlo finish date. The plan is a distribution, not a date."],
 ["ace-risk","ace","ACE Risk","A million runs of the job with a risk register, worked out ahead into one kernel by spork. The finish as a distribution, and what each risk adds at P80."],
 ["ace-crews","ace","ACE Crews","Sequence and capacity: work waits for what it requires, and for a free crew of its trade. Send a crew home and watch the slab slip."],
 ["ace-morning","ace","ACE Morning","The morning question: which constraints, killed today, release the most work? A ranking by hours released."],
 ["ace-ledger","ace","ACE Ledger","The atoms live in SQLite, kept in this browser. Each run is a day on site: one atom closes and the event log grows."],
 ["ace-derive","ace","ACE Derive","The five kinds of atom, and done worked out to a fixed point."],
 ["sprout","game","Sprout","Catch the rain, dodge the bugs. The demo game."],
 ["fireflies","game","Fireflies","Four hundred lights on the night air. Hold a finger down and they gather to it."],
 ["orbit","game","Orbit","Drag and let go to throw moons round the sun."],
 ["hop","game","Hop","Set the lander down gently on the pad."],
 ["life","game","Life","A living grid. Draw on it."],
 ["bounce","game","Bounce","Keep the ball in the air."],
 ["snake","game","Snake","Arrow keys, or swipe on the game."],
 ["breakout","game","Breakout","Clear the bricks."],
 ["particles","game","Particles","A fountain of two thousand sparks, for speed."],
 ["recipes","prog","Recipes","Quicksort, primes, FizzBuzz, and a vector with its own plus."],
 ["tour","prog","Tour","The language, one feature per line."]];
const GROUPS={ace:"Atomic Constraint Engine",game:"Games",prog:"Programs"};
const exOf=id=>EX.find(x=>x[0]===id);

// ---------- output: what programs print, and Sprout's own notes
let outN=0;
function addOut(s,cls){const o=$("out"),d=document.createElement("div");d.className="ln "+cls;d.textContent=s;o.appendChild(d);while(o.childNodes.length>400)o.removeChild(o.firstChild);
 if(TAB==="out")o.scrollTop=o.scrollHeight;else{outN++;$("outN").hidden=false;$("outN").textContent=outN}}
function clearOut(){$("out").innerHTML="";outN=0;$("outN").hidden=true}
let quietLog=false;
S.setOut(s=>addOut(s,"print"));S.setLog(m=>{if(!quietLog)addOut(m,"log")});

// ---------- sound and shake (effects, carried out after each tick)
let AC=null,muted=LS.get("sprout3.mute",false),shakeAmt=0;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==="suspended")AC.resume()}
function beep(f,d){if(muted||!AC)return;try{const o=AC.createOscillator(),v=AC.createGain(),t=AC.currentTime;d=+d||.1;o.type="square";o.frequency.value=+f||440;v.gain.setValueAtTime(.08,t);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v).connect(AC.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
function onEffect([name,a]){if(name==="beep")beep(a[0],a[1]);else if(name==="shake")shakeAmt=Math.max(shakeAmt,+a[0]||0)}

// ---------- the game
let game=null,running="",goodSrc="",goodTicks=0,paused=false,hpos=-1,err=null,msAvg=0,lastSwap=null,speedNotes=[];
function setErr(e){err=e;const el=$("err");if(e){el.firstChild.innerHTML="<b>"+(e.line?"Line "+e.line:"Error")+"</b> · "+esc(e.msg);el.lastChild.style.display=e.line?"":"none";el.classList.add("on")}else el.classList.remove("on");markErr();subUI()}
$("err").onclick=()=>{if(err&&err.line){tab("code");goLine(err.line)}};
const msgOf=e=>String(e&&e.message||e);
// build: a game swaps in over the running one (live state kept), a plain program just runs
// SQLite: loaded the first time a program uses db, then kept in this browser (decision 78)
const needsDb=src=>/(^|[\s\[(])db\s+(query|run)\b/m.test(src);
let dbP=null;
function ensureDb(){return dbP||(dbP=new Promise((ok,no)=>{const sc=document.createElement("script");sc.src="vendor/sqljs/sql-wasm.js?v="+V;sc.onload=ok;sc.onerror=()=>no(new Error("SQLite couldn't be loaded"));document.head.appendChild(sc)})
 .then(()=>window.SproutSqlite.openSqlite({base:"vendor/sqljs/",onWrite:()=>{if(TAB==="st")renderState()}})).then(cell=>{S.G.db=cell;return cell}))}
function afterBuild(){if(document.body.classList.contains("prog")){tab("out");$("out").scrollTop=0}renderState()}
function build(src,fresh){
 if(needsDb(src)&&!S.G.db){$("pSub").textContent="Opening SQLite…";ensureDb().then(()=>{if(code===src&&build(src,fresh))afterBuild()},e=>setErr({line:0,msg:msgOf(e)}));return false}
 let cell;try{cell=S.load(src)}catch(e){setErr({line:e.line||0,msg:msgOf(e)});return false}
 if(cell.field("update")===S.UNSET){
  game=null;document.body.classList.add("prog");clearOut();
  // a big spork may go to the GPU: the pass stops, the job runs, and the program runs again and finds the answer (decision 93)
  if(gspSrc!==src){gspSrc=src;gspPasses=0}
  if(GSP)GSP.mayWait(useGsp&&!needsDb(src)&&gspPasses<6);
  S.sporkTally(true);
  try{cell.run(S.BANG)}catch(e){
   if(window.SproutGpuSpork&&e===SproutGpuSpork.WAIT){gspPasses++;dropPrints();$("pSub").textContent="Running spork on the GPU…";
    GSP.pending().then(()=>{if(code===src&&build(src,fresh))afterBuild()},e2=>{gspWhy=msgOf(e2);useGsp=false;gspUI();if(code===src&&build(src,fresh))afterBuild()});return false}
   setErr({line:e.line||0,msg:msgOf(e)});return false}
  finally{if(GSP)GSP.mayWait(false)}
  sporks=S.sporkTally().slice();
  speedNotes=cell.speed||[];running=src;goodSrc=src;setErr(null);swapped();renderState();speedMarks();return true}
 document.body.classList.remove("prog");
 try{if(game&&!fresh)game.swap(src);else{game=L.makeGame(src,{W:GW,H:GH,onEffect});setPaused(false)}}
 catch(e){setErr({line:e.line||0,msg:msgOf(e)});return false}
 speedNotes=game.speed||[];running=src;goodTicks=0;setErr(null);swapped();speedMarks();return true}
function dropPrints(){document.querySelectorAll("#out .ln.print").forEach(x=>x.remove())}
function swapped(){lastSwap=new Date();subUI();progUI()}
// a program that only prints shows its cover as the artwork, and its main button runs it again
function progUI(){const prog=document.body.classList.contains("prog"),ng=$("noGame");
 ng.classList.toggle("has-art",prog&&!!ART[curEx]);ng.style.backgroundImage=prog&&ART[curEx]?"url("+ART[curEx]+")":"";
 $("noGameT").innerHTML=prog&&ART[curEx]?"":"This one isn't a game: it has no <b>update</b>.<br>What it prints is under Output.";
 if(prog){$("playL").textContent="Run again";$("playIcon").setAttribute("d","M4 2.5v11l9-5.5z");$("playIcon2").setAttribute("d","M5 4v12l11-6z");
  if(ART[curEx]){const im=new Image();im.onload=()=>{try{$("pArt").getContext("2d").drawImage(im,0,40,240,240,0,0,96,96)}catch(e){}};im.src=ART[curEx]}}
 else setPaused(paused)}
function subUI(){const s=$("pSub");
 if(err){s.innerHTML='<span class="bad">Error</span> · '+(err.line?"line "+err.line:"see the code");return}
 if(document.body.classList.contains("prog")){s.textContent="Program · prints to Output";return}
 if(!game){s.textContent="";return}
 s.innerHTML=paused?"Paused · drag the bar to rewind":'<span class="live">Live</span> · edits swap in'+(lastSwap?" · "+lastSwap.toTimeString().slice(0,5):"")}

// ---------- input: touch and mouse are events; held keys go in with each tick
const P={x:GW/2,y:GH/2,down:false};const KEYS=new Set();let swipe=null,swipeTicks=0,heldKey="",heldC=null;
function heldCell(){const ks=[...KEYS];if(swipeTicks>0)ks.push(swipe);const k=ks.sort().join(",");if(k!==heldKey||!heldC){heldKey=k;heldC=S.VFM([],new Map(ks.map(x=>[x,true])))}return heldC}
const toGame=e=>{const r=cv.getBoundingClientRect();P.x=(e.clientX-r.left)/r.width*GW;P.y=(e.clientY-r.top)/r.height*GH};
let sx=0,sy=0;
cv.addEventListener("pointerdown",e=>{audio();cv.setPointerCapture(e.pointerId);toGame(e);sx=P.x;sy=P.y;P.down=true;if(document.activeElement===ta)ta.blur();if(game&&!paused)try{game.down(P.x,P.y)}catch(_){}});
cv.addEventListener("pointermove",e=>{toGame(e);if(game&&!paused)try{game.move(P.x,P.y)}catch(_){}});
const pup=e=>{if(!P.down)return;P.down=false;const dx=P.x-sx,dy=P.y-sy;if(Math.max(Math.abs(dx),Math.abs(dy))>28){swipe=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");swipeTicks=4}if(game&&!paused)try{game.up()}catch(_){}};
cv.addEventListener("pointerup",pup);cv.addEventListener("pointercancel",pup);
addEventListener("pointerdown",audio,{once:true});
const KEYNAME={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"," ":"space",Enter:"enter"};
const editing=e=>e.target&&(e.target.tagName==="TEXTAREA"||e.target.tagName==="INPUT");
const FKEYS={F2:()=>openLibrary(),F3:()=>openSpec(),F4:()=>share(),F7:()=>togglePause(),F8:()=>restart(),F9:()=>toggleSound()};
addEventListener("keydown",e=>{
 if(FKEYS[e.key]){e.preventDefault();FKEYS[e.key]();return}
 if(MODAL){if(e.key==="Escape"){e.preventDefault();closeModal()}return}
 if(e.altKey&&/^[123]$/.test(e.key)){e.preventDefault();tab(["code","st","out"][+e.key-1]);return}
 if(editing(e))return;const k=KEYNAME[e.key]||e.key.toLowerCase();if(!KEYS.has(k)&&(k==="space"||k==="enter")&&game&&!paused)try{game.down(P.x,P.y)}catch(_){}
 KEYS.add(k);if(e.key.startsWith("Arrow")||e.key===" ")e.preventDefault()});
addEventListener("keyup",e=>{const k=KEYNAME[e.key]||e.key.toLowerCase();KEYS.delete(k);if((k==="space"||k==="enter")&&game&&!paused)try{game.up()}catch(_){}});
addEventListener("blur",()=>KEYS.clear());

// ---------- drawing what draw asked for
const col=c=>typeof c==="string"?c:S.fmt(c);
function paint(ctx,list){
 for(const [name,a] of list){
  switch(name){
   case"clear":ctx.fillStyle=col(a[0]);ctx.fillRect(0,0,GW,GH);break;
   case"rect":ctx.fillStyle=col(a[4]);ctx.fillRect(a[0],a[1],a[2],a[3]);break;
   case"circle":if(a[2]>0){ctx.fillStyle=col(a[3]);ctx.beginPath();ctx.arc(a[0],a[1],a[2],0,Math.PI*2);ctx.fill()}break;
   case"line":ctx.strokeStyle=col(a[4]);ctx.lineWidth=2;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(a[2],a[3]);ctx.stroke();break;
   case"text":drawText(ctx,a);break;
  }
 }
}
function drawText(ctx,a){ctx.fillStyle=col(a[4]);ctx.font="600 "+(+a[3]||16)+'px -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,"Segoe UI",sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(S.fmt(a[0]),a[1],a[2])}
// WebGPU: shapes on the GPU canvas underneath in one draw call, text on the 2D canvas on top
let GPU=null,useGpu=LS.get("sprout3.gpu",true);
function rendererUI(){const on=!!(GPU&&useGpu),b=$("bGpu");document.body.classList.toggle("gpu",on);b.hidden=!GPU;b.textContent=on?"WebGPU":"Canvas";b.classList.toggle("on",on)}
$("bGpu").onclick=()=>{useGpu=!useGpu;LS.set("sprout3.gpu",useGpu);rendererUI();msAvg=0;toast(useGpu?"Drawing with WebGPU":"Drawing with Canvas 2D")};
// WebGPU is used only once it has passed a self-test on this device; otherwise everything stays on Canvas 2D
let gpuWhy="",gpuFrames=0;
// the second check: frames drawn by the GPU must actually show. Every game clears its screen, so a shown frame has no clear pixels.
function checkShown(){try{const c=document.createElement("canvas");c.width=c.height=8;const x=c.getContext("2d");x.drawImage($("gv"),0,0,8,8);const d=x.getImageData(0,0,8,8).data;
 for(let i=3;i<d.length;i+=4)if(d[i]>0)return;}catch(e){}
 GPU=null;gpuWhy="this browser didn't show the WebGPU frames";rendererUI()}
if(window.SproutGpu)SproutGpu.makeGpuPainter($("gv")).then(p=>{GPU=p;rendererUI()},e=>{gpuWhy=msgOf(e)});
// spork on the GPU (decision 93): big sporks in a program that prints, with 32-bit maths; games stay on SIMD
let GSP=null,useGsp=LS.get("sprout3.gpuspork",true),gspWhy="",gspSrc=null,gspPasses=0,sporks=[];
function gspUI(){S.sporkWays({gpu:GSP&&useGsp?GSP.hook:null})}
if(window.SproutGpuSpork)SproutGpuSpork.makeGpuSpork().then(g=>{GSP=g;gspUI();if(TAB==="st")renderState()},e=>{gspWhy=msgOf(e)});
let last=0,statT=0,artT=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000||0);last=now;
 const k=cv.width/GW;g.setTransform(k,0,0,k,0,0);
 if(!game){if(now-statT>400){statT=now;statUI()}return}
 try{
  const t0=performance.now();
  if(!paused){game.tick(dt,heldCell());if(swipeTicks>0)swipeTicks--;if(++goodTicks===30)goodSrc=running}
  const list=game.draw();
  let sx=0,sy=0;if(shakeAmt>.3&&!paused){sx=(Math.random()-.5)*shakeAmt;sy=(Math.random()-.5)*shakeAmt;shakeAmt*=Math.pow(.004,dt)}else if(!paused)shakeAmt=0;
  if(GPU&&useGpu&&++gpuFrames===10)checkShown();
  if(GPU&&useGpu){const texts=GPU.paint(list,GW,GH,sx,sy);g.clearRect(0,0,GW,GH);g.save();g.translate(sx,sy);for(const a of texts)drawText(g,a);g.restore()}
  else{g.save();g.translate(sx,sy);try{paint(g,list)}finally{g.restore()}}
  msAvg=msAvg*.95+(performance.now()-t0)*.05;
 }catch(e){
  const m={line:e.line||0,msg:msgOf(e)};
  if(goodSrc&&running!==goodSrc){try{game.swap(goodSrc);running=goodSrc;m.msg+=" (still running your last working version)"}catch(_){setPaused(true)}}else setPaused(true);
  setErr(m)}
 if(now-statT>200){statT=now;statUI()}
 if(now-artT>500){artT=now;artUI()}
}
requestAnimationFrame(frame);
// the little artwork in the player and the glow behind the page both come from the game itself
function artUI(){try{const p=$("pArt").getContext("2d"),gl=$("glow").getContext("2d"),layers=GPU&&useGpu?[$("gv"),cv]:[cv];
 for(const c of layers){p.drawImage(c,0,c.height*.125,c.width,c.width,0,0,96,96);gl.drawImage(c,0,0,36,48)}}catch(e){}}
const fmtT=s=>{s=Math.max(0,s);return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")};
function statUI(){
 const r=$("tlR"),h=game?game.history:[];
 if(!game){r.disabled=true;r.max=0;r.style.setProperty("--p","100%");$("tlA").textContent="–";$("tlB").textContent="";$("sMs").textContent="";$("ptlI").style.setProperty("--p","100%");return}
 r.disabled=h.length<2;r.max=Math.max(0,h.length-1);const at=paused&&hpos>=0?hpos:h.length-1;r.value=at;
 const p=h.length>1?(at/(h.length-1)*100):100;r.style.setProperty("--p",p+"%");$("ptlI").style.setProperty("--p",p+"%");
 const cur=h[at];$("tlA").textContent=cur?fmtT(cur.clock):"0:00";
 const back=paused&&cur&&h.length?h[h.length-1].clock-cur.clock:0;const b=$("tlB");
 if(back>.05){b.textContent="−"+back.toFixed(1)+"s";b.classList.remove("live")}else{b.textContent="LIVE";b.classList.add("live")}
 $("sMs").textContent=msAvg.toFixed(2)+" ms/frame"}

// ---------- pause and rewind: a saved frame is just the state it held, since cells never change
const PLAY="M5 4v12l11-6z",PAUSE="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z";
function setPaused(on){if(on&&!game)return;if(document.body.classList.contains("prog"))return;paused=on;document.body.classList.toggle("paused",on);
 $("playIcon2").setAttribute("d",on?PLAY:PAUSE);$("playIcon").setAttribute("d",on?"M4 2.5v11l9-5.5z":"M4 3h3v10H4zM9 3h3v10H9z");$("playL").textContent=on?"Play":"Pause";
 if(on){hpos=game.history.length-1}else if(game&&hpos>=0){if(hpos<game.history.length-1)game.history.length=hpos+1;hpos=-1}subUI();statUI()}
$("tlR").addEventListener("input",e=>{if(!game||!game.history.length)return;if(!paused)setPaused(true);hpos=+e.target.value;game.rewind(hpos);statUI();renderState()});
function togglePause(){if(document.body.classList.contains("prog")){restart();return}if(!game)return;setPaused(!paused)}
function restart(){const prog=document.body.classList.contains("prog");if(build(code,true)){toast(prog?"Ran it again":"Started again");renderState();if(prog){tab("out");$("out").scrollTop=0}}}
function toggleSound(){muted=!muted;LS.set("sprout3.mute",muted);sndUI();toast(muted?"Sound off":"Sound on")}
const SND_ON="M3 7h3l5-4v14l-5-4H3zM14 6.5a5 5 0 0 1 0 7l-1.2-1.2a3.3 3.3 0 0 0 0-4.6zM16.3 4.2a8.3 8.3 0 0 1 0 11.6l-1.2-1.2a6.6 6.6 0 0 0 0-9.2z",SND_OFF="M3 7h3l5-4v14l-5-4H3zM13 7.4l1.1-1.1L16 8.2l1.9-1.9L19 7.4 17.1 9.3 19 11.2l-1.1 1.1L16 10.4l-1.9 1.9-1.1-1.1 1.9-1.9z";
const sndUI=()=>$("sndIcon").setAttribute("d",muted?SND_OFF:SND_ON);sndUI();
$("bPlay").onclick=togglePause;$("bPlayBig").onclick=togglePause;$("bRestart").onclick=restart;$("bRestart2").onclick=restart;$("bSnd").onclick=toggleSound;
$("bBack").onclick=()=>{if(!game||game.history.length<2)return;if(!paused)setPaused(true);hpos=0;game.rewind(0);statUI();renderState()};

// ---------- sizes: the artwork keeps 3:4 and fits beside (or above) the editor
function fit(){const m=$("main").getBoundingClientRect(),phone=innerWidth<=720;
 let h,w;
 if(phone){const head=$("head").getBoundingClientRect().height;h=Math.round(Math.max(150,Math.min((m.height-head-24)*.5,(m.width-24)/.75)));w=Math.round(h*.75)}
 else{h=Math.round(Math.max(200,Math.min(m.height-48,(m.width-56)*.5/.75)));w=Math.round(h*.75)}
 const st=$("stage");st.style.width=w+"px";st.style.height=h+"px";const dpr=Math.min(2,devicePixelRatio||1);
 cv.style.width=w+"px";cv.style.height=h+"px";cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
 const gv=$("gv");gv.style.width=w+"px";gv.style.height=h+"px";gv.width=cv.width;gv.height=cv.height}
if(window.ResizeObserver)new ResizeObserver(fit).observe($("main"));addEventListener("resize",fit);
function vv(){const v=window.visualViewport;const h=v?v.height:innerHeight;$("app").style.height=h+"px";$("app").style.top=(v?v.offsetTop:0)+"px";document.body.classList.toggle("kb",h<innerHeight*.75&&document.activeElement===ta)}
if(window.visualViewport){visualViewport.addEventListener("resize",vv);visualViewport.addEventListener("scroll",vv)}vv();

// ---------- the editor: a textarea over a highlighted copy (the same rules as Sprout 3's tokenizer)
const WORDS=new Set("start update draw input dt clock touching tapped touch-x touch-y held W H clear rect circle line text beep shake print rand noise dist clamp toward range match cond take rgb rgba every wave frame any with else and or not collect keep each fold times length first last str min max abs floor round ceil sqrt sin cos tan log neg left right".split(" "));
function lineHTML(s){let o="",i=0;const n=s.length;
 while(i<n){const c=s[i];
  if(c==="-"&&s[i+1]==="-"){o+='<i class="c">'+esc(s.slice(i))+"</i>";break}
  if(c==='"'){let j=i+1,buf='"',h="";while(j<n&&s[j]!=='"'){if(s[j]==="\\"){buf+=s.slice(j,j+2);j+=2;continue}
    if(s[j]==="["){let d=1,k=j+1;while(k<n&&d&&s[k]!=='"'){if(s[k]==="[")d++;else if(s[k]==="]")d--;if(d)k++}h+='<i class="s">'+esc(buf)+'</i><i class="tp">['+lineHTML(s.slice(j+1,k))+(s[k]==="]"?"]":"")+"</i>";buf="";j=s[k]==="]"?k+1:k;continue}
    buf+=s[j];j++}
   if(j<n){buf+='"';j++}o+=h+'<i class="s">'+esc(buf)+"</i>";i=j;continue}
  if("[](),".includes(c)){o+=c;i++;continue}
  if(c===":"||c==="|"){o+='<i class="o">'+c+"</i>";i++;continue}
  if(c===" "||c==="\t"){o+=c;i++;continue}
  let j=i;while(j<n&&!' \t[](),|:"'.includes(s[j])&&!(s[j]==="-"&&s[j+1]==="-"&&j>i))j++;
  const w=s.slice(i,j);o+=/^-?\d+(\.\d+)?$/.test(w)?'<i class="n">'+w+"</i>":WORDS.has(w)?'<i class="a">'+esc(w)+"</i>":(w==="true"||w==="false"||w==="!")?'<i class="k">'+esc(w)+"</i>":esc(w);i=j}
 return o}
let code="",saveT=0,compT=0,liveSrc="",liveT=0,dirty=false,curEx="";
const LH=()=>parseFloat(getComputedStyle(ta).lineHeight)||21,PAD=12;
function render(){speedMarks();hl.innerHTML=code.split("\n").map(lineHTML).join("\n")+"\n ";const n=code.split("\n").length;let gs="";for(let i=1;i<=n;i++)gs+=i+"\n";gut.textContent=gs;sync()}
function sync(){hl.scrollTop=ta.scrollTop;hl.scrollLeft=ta.scrollLeft;gut.style.transform="translateY("+(-ta.scrollTop)+"px)";$("smarks").style.transform="translateY("+(-ta.scrollTop)+"px)";markErr()}
// a thin bar beside each collect, keep and each: green when it can run over columns, amber when it runs item by item
function speedMarks(){const byLine=new Map();for(const n of speedNotes){const was=byLine.get(n.line);byLine.set(n.line,was===undefined?n.fast:was&&n.fast)}
 let h="";for(const [line,fast] of byLine)if(line)h+='<i class="'+(fast?"f":"s")+'" style="top:'+(PAD+(line-1)*LH()+2)+'px"></i>';$("smarks").innerHTML=h;$("smarks").style.height=(PAD*2+code.split("\n").length*LH())+"px"}
ta.addEventListener("scroll",sync);
function markAt(el,line,count){if(!line){el.classList.remove("on");return}el.classList.add("on");el.style.top=(PAD+(line-1)*LH()-ta.scrollTop)+"px";el.style.height=(count||1)*LH()+"px"}
function markErr(){markAt($("errl"),err&&TAB==="code"?err.line:0)}
function flashLive(src){const a=liveSrc.split("\n"),b=src.split("\n");let s=0;while(s<a.length&&s<b.length&&a[s]===b[s])s++;
 let e1=a.length-1,e2=b.length-1;while(e1>=s&&e2>=s&&a[e1]===b[e2]){e1--;e2--}liveSrc=src;if(e2<s||TAB!=="code")return;
 const el=$("live");el.classList.remove("fade");markAt(el,s+1,e2-s+1);clearTimeout(liveT);liveT=setTimeout(()=>{el.classList.add("fade");setTimeout(()=>markAt(el,0),700)},350)}
function headUI(){const ex=exOf(curEx);
 $("kicker").textContent=ex?GROUPS[ex[1]]:"Your code";$("title").textContent=ex?ex[2]:"Untitled";$("desc").textContent=ex?ex[3]:"Your own program. Change anything and it updates as it runs.";
 $("meta").innerHTML=esc((curEx||"untitled")+".sp")+(dirty?' · <span class="dot">●</span> edited':"")+" · Sprout 3";
 $("pTitle").textContent=ex?ex[2]:"Untitled";document.title=(ex?ex[2]+" · ":"")+"Sprout 3";
 document.querySelectorAll("#lib .li").forEach(b=>b.classList.toggle("on",b.dataset.g===curEx))}
function setCode(s){code=s;if(ta.value!==s)ta.value=s;liveSrc=s;render();queueSave();headUI()}
function queueSave(){clearTimeout(saveT);saveT=setTimeout(()=>LS.set("sprout3.code",{code,ex:curEx,dirty}),400)}
function goLine(n){const lines=code.split("\n");let p=0;for(let i=0;i<n-1&&i<lines.length;i++)p+=lines[i].length+1;ta.focus();ta.setSelectionRange(p,p);const y=PAD+(n-1)*LH();ta.scrollTop=Math.max(0,y-ta.clientHeight*.45);sync()}
ta.addEventListener("input",()=>{code=ta.value;const was=dirty;dirty=true;if(!was)headUI();render();queueSave();clearTimeout(compT);compT=setTimeout(()=>{if(build(code))flashLive(code);renderState()},350)});
function insertText(t){ta.focus();if(!document.execCommand||!document.execCommand("insertText",false,t)){const s=ta.selectionStart,e=ta.selectionEnd;ta.setRangeText(t,s,e,"end");ta.dispatchEvent(new Event("input"))}}
ta.addEventListener("keydown",e=>{
 if(e.key==="Tab"){e.preventDefault();insertText("  ")}
 else if(e.key==="Enter"&&!e.isComposing){const s=ta.selectionStart,before=ta.value.slice(0,s),line=before.slice(before.lastIndexOf("\n")+1);let ind=line.match(/^\s*/)[0];
  if(/[\[(|:]\s*$/.test(line.replace(/--.*$/,"")))ind+="  ";e.preventDefault();insertText("\n"+ind)}});
ta.addEventListener("focus",()=>setTimeout(vv,300));ta.addEventListener("blur",()=>setTimeout(vv,300));
const KEYBAR=[":","[","]","(",")","|",'"',",","!","..","+","-","*","/","<",">","=","--","⇥"];
$("keys").innerHTML=KEYBAR.map(k=>'<button data-k="'+esc(k)+'">'+esc(k)+"</button>").join("");
$("keys").addEventListener("pointerdown",e=>{const b=e.target.closest("button");if(!b)return;e.preventDefault();const k=b.dataset.k;insertText(k==="⇥"?"  ":k===":"?" : ":k==="|"?" | ":k)});

// ---------- drag a number to change it: Alt-drag anywhere, or turn on Tweak (made for phones)
let TWEAK=false,scrub=null,cwCache=0;
function charW(){if(!cwCache){const c=document.createElement("canvas").getContext("2d");c.font=getComputedStyle(ta).font;cwCache=c.measureText("0000000000").width/10}return cwCache}
// the number token under the pointer, if any: not in a comment, not in a string
function numAt(e){const r=ta.getBoundingClientRect(),cs=getComputedStyle(ta);
 const col=Math.floor((e.clientX-r.left-parseFloat(cs.paddingLeft)+ta.scrollLeft)/charW()),line=Math.floor((e.clientY-r.top-parseFloat(cs.paddingTop)+ta.scrollTop)/LH());
 const lines=code.split("\n");if(line<0||line>=lines.length)return null;const s=lines[line];if(col<0||col>=s.length)return null;
 const stop=' \t[](),|:"';if(stop.includes(s[col]))return null;
 let a=col,b=col;while(a>0&&!stop.includes(s[a-1]))a--;while(b<s.length&&!stop.includes(s[b]))b++;
 const w=s.slice(a,b);if(!/^-?\d+(\.\d+)?$/.test(w))return null;
 const pre=s.slice(0,a);if((pre.match(/"/g)||[]).length%2)return null;if(/--/.test(pre.replace(/"[^"]*"/g,"")))return null;
 let off=0;for(let i=0;i<line;i++)off+=lines[i].length+1;return {start:off+a,len:b-a,text:w}}
function setTweak(on){TWEAK=on;document.body.classList.toggle("tweak",on);$("bTweak").classList.toggle("on",on);ta.readOnly=on;if(on){ta.blur();toast("Drag a number left or right to change it")}}
$("bTweak").onclick=()=>setTweak(!TWEAK);
ta.addEventListener("pointerdown",e=>{if(!(TWEAK||e.altKey))return;const n=numAt(e);if(!n)return;e.preventDefault();try{ta.setPointerCapture(e.pointerId)}catch(_){}
 scrub={...n,x0:e.clientX,v0:parseFloat(n.text),dec:(n.text.split(".")[1]||"").length,id:e.pointerId,moved:false};document.body.classList.add("scrubbing");tipAt(e,n.text)});
function tipAt(e,t){const tip=$("scrubTip");tip.textContent=t;tip.style.left=e.clientX+"px";tip.style.top=e.clientY+"px";tip.style.display="block"}
ta.addEventListener("pointermove",e=>{if(!scrub||e.pointerId!==scrub.id)return;e.preventDefault();const dx=e.clientX-scrub.x0;if(Math.abs(dx)>3)scrub.moved=true;
 const step=scrub.dec?Math.pow(10,-scrub.dec):(Math.abs(scrub.v0)>=100?2:1),v=scrub.v0+Math.round(dx/6)*step,t=scrub.dec?v.toFixed(scrub.dec):String(Math.round(v));
 tipAt(e,t);if(t===code.substr(scrub.start,scrub.len))return;
 const st=ta.scrollTop,sl=ta.scrollLeft;code=code.slice(0,scrub.start)+t+code.slice(scrub.start+scrub.len);scrub.len=t.length;ta.value=code;ta.scrollTop=st;ta.scrollLeft=sl;
 if(!dirty){dirty=true;headUI()}render();if(build(code))renderState()});
const endScrub=e=>{if(!scrub)return;const was=scrub;scrub=null;document.body.classList.remove("scrubbing");$("scrubTip").style.display="none";queueSave();if(was.moved)flashLive(code)};
ta.addEventListener("pointerup",endScrub);ta.addEventListener("pointercancel",endScrub);

// ---------- the state view: every field of the game right now
function brief(v){if(S.isCell(v)&&!(v instanceof S.Cell&&v.takesInput())){const n=v.count();if(n>6)return n+" parts";const s=S.fmt(v);return s.length>140?s.slice(0,140)+"…]":s}const s=S.fmt(v);return s.length>140?s.slice(0,140)+"…":s}
function speedHTML(){if(!speedNotes.length)return"";const fast=speedNotes.filter(n=>n.fast).length;
 return'<div class="sh">Loops over lists</div><div class="foot" style="padding-top:0">'+fast+" of "+speedNotes.length+" run as tight loops: over columns (a list of 32 or more records of numbers, one array per field), over a list of numbers, or as a spork kernel. The others run item by item, which is fine for short lists.</div>"+
  speedNotes.slice().sort((a,b)=>a.line-b.line).map(n=>'<div class="row sp'+(n.fast?" f":"")+'"><span class="k2">line '+n.line+" · "+n.word+'</span><span class="v">'+(n.fast?(n.word==="spork"?"worked out ahead into one kernel":"runs as a tight loop"):"item by item: "+esc(n.why))+"</span></div>").join("")}
const WAYS={gpu:"on the GPU",simd:"on WebAssembly SIMD",js:"in JavaScript",collect:"the ordinary way, as collect"};
function sporkHTML(){if(!sporks.length&&!/\bspork\b/.test(code))return"";
 const rows=sporks.slice(0,8).map(r=>'<div class="row sp'+(r.how!=="collect"?" f":"")+'"><span class="k2">'+r.n.toLocaleString()+" run"+(r.n===1?"":"s")+'</span><span class="v">'+WAYS[r.how]+" in "+(r.ms<10?r.ms.toFixed(1):Math.round(r.ms))+" ms"+(r.steps?" · "+r.steps+" steps a run":"")+"</span></div>").join("");
 const gpu=GSP?'Big sporks (100,000 runs or more) in a program that prints can run on the GPU ('+esc(GSP.adapter)+'): <a href="#" id="gspT" style="color:var(--acc2);font-weight:600">'+(useGsp?"on":"off")+"</a>. The GPU does 32-bit maths, so the last digits can differ from SIMD, which gives the same bits as JavaScript."
  :"WebGPU isn't available here"+(gspWhy?" ("+esc(gspWhy)+")":"")+", so spork runs on WebAssembly SIMD.";
 return'<div class="sh">Spork</div><div class="foot" style="padding-top:0">A cell given to spork is worked out ahead into one kernel of number maths, run for every input at once. '+gpu+"</div>"+rows}
function dbHTML(){const db=S.G.db;if(!db||!needsDb(code))return"";let t=[];try{t=db.tables()}catch(e){}
 return'<div class="sh">SQLite</div><div class="foot" style="padding-top:0">Kept in this browser between visits. <a href="#" id="dbClear" style="color:var(--acc2);font-weight:600">Clear the database</a></div>'+
  (t.length?t.map(([n,c])=>'<div class="row"><span class="k2">'+esc(n)+'</span><span class="v">'+c+" row"+(c===1?"":"s")+"</span></div>").join(""):'<div class="foot">No tables yet.</div>')}
function wireDb(){const a=$("dbClear");if(a)a.onclick=async e=>{e.preventDefault();if(!confirm("Clear the SQLite database kept in this browser?"))return;await S.G.db.clear();toast("Database cleared");if(build(code,true))afterBuild()}}
// only replace what's shown when it changed, so a link isn't rebuilt under a click
function renderState(){const el=$("st"),h=stateHTML();if(el._h!==h){el.innerHTML=h;el._h=h;wireDb();wireGsp()}}
function wireGsp(){const a=$("gspT");if(a)a.onclick=e=>{e.preventDefault();useGsp=!useGsp;LS.set("sprout3.gpuspork",useGsp);gspUI();toast(useGsp?"Big sporks run on the GPU":"Sporks run on WebAssembly SIMD");if(build(code,true))afterBuild()}}
function stateHTML(){
 if(!game)return'<div class="foot">No game is running.</div>'+sporkHTML()+dbHTML()+speedHTML();
 let rows=[];try{for(const [k,v] of S.fieldsOf(game.state))rows.push([k,brief(v)])}catch(e){return esc(msgOf(e))}
 return rows.map(([k,v])=>'<div class="row"><span class="k2">'+esc(k)+'</span><span class="v">'+esc(v)+"</span></div>").join("")+
  '<div class="foot">'+(paused?"Paused":"Live")+" · "+game.history.length+" moments saved for rewind</div>"+sporkHTML()+dbHTML()+speedHTML()}
setInterval(()=>{if(TAB==="st")renderState()},250);

// ---------- tabs
let TAB="code";
function tab(t){TAB=t;document.body.className=document.body.className.replace(/\bt-\w+/,"t-"+t);document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
 if(t==="out"){outN=0;$("outN").hidden=true;$("out").scrollTop=$("out").scrollHeight}if(t==="st")renderState();if(t==="code")render();markErr()}
document.querySelectorAll("#tabs button").forEach(b=>b.onclick=()=>tab(b.dataset.t));

// ---------- sheets
let MODAL=null;
function openModal(kind,title,html){document.querySelectorAll(".mh .pill").forEach(x=>x.remove());MODAL={kind};$("mTitle").textContent=title;$("mBody").innerHTML=html;$("modal").classList.add("on");$("mBody").scrollTop=0}
function closeModal(){MODAL=null;$("modal").classList.remove("on")}
$("modal").addEventListener("click",e=>{if(e.target.id==="modal"||e.target.closest("[data-close]"))closeModal()});

// ---------- the library
const ART={};  // artwork for each example
function artFor(id){return ART[id]||""}
function libHTML(){let h="",prev="";
 for(const [id,kind,t,d] of EX){if(kind!==prev){h+='<div class="lh">'+GROUPS[kind]+"</div>";prev=kind}
  h+='<button class="li" data-g="'+id+'"><img class="th" alt="" data-art="'+id+'" src="'+artFor(id)+'"><span style="min-width:0"><span class="nm">'+t+'</span><span class="ds">'+esc(d)+"</span></span></button>"}
 return h}
function wireLib(root){root.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{const k=b.dataset.g;
 if(k==="backup"){const bk=LS.get("sprout3.backup","");curEx="";dirty=true;setCode(bk);clearOut();build(bk,true);closeModal();toast("Your code is back")}else loadEx(k)})}
$("lib").innerHTML=libHTML();wireLib($("lib"));
function openLibrary(){const bk=LS.get("sprout3.backup",null);let h="";let prev="";
 for(const [id,kind,t,d] of EX){if(kind!==prev){if(prev)h+="</div>";h+='<div class="gh">'+GROUPS[kind]+'</div><div class="grid">';prev=kind}
  h+='<button class="tile" data-g="'+id+'"><img class="th" alt="" data-art="'+id+'" src="'+artFor(id)+'"><b>'+t+"</b><small>"+esc(d.split(".")[0])+"</small></button>"}
 h+="</div>";if(bk)h+='<div class="gh">Yours</div><div class="grid"><button class="tile" data-g="backup"><span class="th" style="display:grid;place-items:center;font:600 30px var(--serif);color:var(--acc2)">↩</span><b>Last code</b><small>Before you last switched</small></button></div>';
 openModal("lib","Library",h);wireLib($("mBody"));const sp=document.createElement("button");sp.className="pill";sp.textContent="Read the spec";sp.onclick=openSpec;$("mTitle").after(sp)}
$("libBtn").onclick=openLibrary;
async function loadEx(name,quiet){
 if(dirty&&code.trim())LS.set("sprout3.backup",code);
 let src;try{const r=await fetch("examples/"+name+".sp?v="+V);if(!r.ok)throw 0;src=await r.text()}catch(e){toast("Couldn't load "+name+".sp");return}
 curEx=name;dirty=false;setCode(src);clearOut();
 if(build(src,true)){if(document.body.classList.contains("prog")){tab("out");$("out").scrollTop=0}else if(TAB==="out")tab("code")}
 closeModal();fit();if(!quiet)toast(exOf(name)[2]+" · edit the code and it updates as it runs")}

// ---------- artwork: each game is run off-screen for a moment, with a little scripted input, and its frame becomes the cover
const ART_KEY="sprout3.art."+V;
Object.assign(ART,LS.get(ART_KEY,{}));
const SCRIPT={
 "ace-board":g=>{for(const [x,y] of [[178,144],[60,144]]){g.down(x,y);g.tick(1/60);g.up();g.tick(1/60)}},
 "ace-site":g=>{g.tick(1/60);g.down(250,240);g.tick(1/60);g.up();g.tick(1/60)},
 "ace-crews":g=>{for(let t=0;t<200;t++)g.tick(1/20)},
 fireflies:g=>{for(let t=0;t<120;t++)g.tick(1/60);g.down(180,250);for(let t=0;t<150;t++)g.tick(1/60)},
 orbit:g=>{const fling=(x,y,x2,y2)=>{g.down(x,y);g.tick(1/60);for(let k=1;k<=8;k++){g.move(x+(x2-x)*k/8,y+(y2-y)*k/8);g.tick(1/60)}g.up();g.tick(1/60)};fling(180,120,132,120);for(let t=0;t<80;t++)g.tick(1/60);fling(180,330,230,330);for(let t=0;t<70;t++)g.tick(1/60)},
 sprout:g=>{g.down(150,300);for(let t=0;t<150;t++){g.move(120+60*Math.sin(t/20),300);g.tick(1/60)}g.up()},
 hop:g=>{for(let t=0;t<50;t++)g.tick(1/60);g.down(40,90);for(let t=0;t<12;t++)g.tick(1/60);g.up();g.tick(1/60)},
 life:g=>{for(let t=0;t<200;t++)g.tick(1/60)},
 particles:g=>{for(let t=0;t<150;t++)g.tick(1/60)}};
const COVER={ace:["#d97757","#7a3a26"],prog:["#4b6584","#1f2b3c"]};
function cover(id){const ex=exOf(id),c=document.createElement("canvas");c.width=240;c.height=320;const x=c.getContext("2d");
 const [a,b]=COVER[ex[1]]||COVER.prog,gr=x.createLinearGradient(0,0,240,320);gr.addColorStop(0,a);gr.addColorStop(1,b);x.fillStyle=gr;x.fillRect(0,0,240,320);
 const lines=(SRC[id]||"").split("\n").filter(l=>l.trim()&&!/^\s*--/.test(l)).slice(0,16);
 x.font="10px ui-monospace,Menlo,monospace";x.fillStyle="rgba(255,255,255,.16)";lines.forEach((l,i)=>x.fillText(l.slice(0,44),14,22+i*13));
 x.fillStyle="rgba(255,255,255,.75)";x.font="600 11px -apple-system,system-ui,sans-serif";x.fillText(ex[1]==="ace"?"ATOMIC CONSTRAINT ENGINE":"SPROUT 3 · PROGRAM",14,262);
 x.fillStyle="#fff";x.font="600 30px ui-serif,'New York',Georgia,serif";x.fillText(ex[2],14,296);
 return c.toDataURL("image/jpeg",.85)}
const SRC={};
function shot(id,src){const c=document.createElement("canvas");c.width=240;c.height=320;const x=c.getContext("2d");x.setTransform(240/GW,0,0,240/GW,0,0);
 const t=L.makeGame(src,{W:GW,H:GH});(SCRIPT[id]||(g=>{for(let k=0;k<90;k++)g.tick(1/60)}))(t);paint(x,t.draw());return c.toDataURL("image/jpeg",.82)}
function showArt(id){document.querySelectorAll('[data-art="'+id+'"]').forEach(im=>{if(ART[id])im.src=ART[id]});if(id===curEx)progUI()}
async function makeArt(){
 for(const [id,kind] of EX){if(ART[id]){showArt(id);continue}
  try{const r=await fetch("examples/"+id+".sp?v="+V);SRC[id]=await r.text()}catch(e){continue}
  await new Promise(r=>setTimeout(r,40));
  quietLog=true;try{ART[id]=/^update\s*:/m.test(SRC[id])?shot(id,SRC[id]):cover(id)}catch(e){}finally{quietLog=false}
  showArt(id)}
 LS.set(ART_KEY,ART)}
setTimeout(makeArt,600);

// ---------- the spec (spec.md, or the page GitHub Pages makes from it)
function mdInline(s){return esc(s).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>")}
function md(src){const L=src.replace(/\r/g,"").split("\n"),o=[];let i=0;
 while(i<L.length){const l=L[i];
  if(/^\s*(```|````)/.test(l)){const f=l.trim().match(/^`+/)[0],ind=l.match(/^\s*/)[0].length;const b=[];i++;while(i<L.length&&L[i].trim()!==f)b.push(L[i++].slice(ind));i++;o.push("<pre><code>"+esc(b.join("\n"))+"</code></pre>");continue}
  let m;
  if((m=l.match(/^(#{1,4}) (.*)$/))){o.push("<h"+m[1].length+">"+mdInline(m[2])+"</h"+m[1].length+">");i++;continue}
  if(/^---+\s*$/.test(l)){o.push("<hr>");i++;continue}
  if(/^\|/.test(l)){const rows=[];while(i<L.length&&/^\|/.test(L[i]))rows.push(L[i++]);const cells=r=>r.replace(/^\||\|$/g,"").split(/(?<!\\)\|/).map(c=>mdInline(c.trim().replace(/\\\|/g,"|")));
   o.push("<table>"+rows.filter(r=>!/^\|[\s:|-]+\|?$/.test(r)).map((r,k)=>"<tr>"+cells(r).map(c=>k?"<td>"+c+"</td>":"<th>"+c+"</th>").join("")+"</tr>").join("")+"</table>");continue}
  if(/^\s*([-*]|\d+\.) /.test(l)){const items=[];while(i<L.length&&(/^\s*([-*]|\d+\.) /.test(L[i])||(/^\s{2,}\S/.test(L[i])&&items.length&&!/^\s*```/.test(L[i]))))
    {const x=L[i++];const nm=x.match(/^\s*(\d+)\. /);if(/^\s*([-*]|\d+\.) /.test(x))items.push({ind:x.match(/^\s*/)[0].length,num:nm?nm[1]:null,t:x.replace(/^\s*([-*]|\d+\.) /,"")});else items[items.length-1].t+=" "+x.trim()}
   o.push("<ul>"+items.map(x=>'<li style="margin-left:'+(x.ind*8)+'px'+(x.num?';list-style:none;text-indent:-2.6em;padding-left:2.6em':'')+'">'+(x.num?'<span class="num">'+x.num+".</span> ":"")+mdInline(x.t)+"</li>").join("")+"</ul>");continue}
  if(!l.trim()){i++;continue}
  const p=[];while(i<L.length&&L[i].trim()&&!/^(#{1,4} |\||---|\s*```|\s*([-*]|\d+\.) )/.test(L[i]))p.push(L[i++]);o.push("<p>"+mdInline(p.join(" "))+"</p>")}
 return o.join("\n")}
let specHTML=null;
async function loadSpec(){
 for(const [f,kind] of [["spec.md","md"],["spec.html","html"]]){try{const r=await fetch(f+"?v="+V);if(!r.ok)continue;const t=await r.text();
   if(kind==="md"&&!/^\s*</.test(t))return md(t);const d=new DOMParser().parseFromString(t,"text/html");return d.body.innerHTML}catch(e){}}
 return"<p>The spec couldn't be loaded.</p>"}
const SPEC_INTRO='<div class="intro"><b>Using this page.</b> Edit the code and the running program picks the change up; live values are kept unless you change their starting value in <code>start</code>. Pause, drag the bar at the bottom to go back up to ten seconds, edit, and play on from that moment. The ACE examples are the Atomic Constraint Engine written in Sprout. Sections 1 to 15 below describe the older Sprout 2.0 baseline; the design decisions at the end define Sprout 3. <a href="#" id="toDecisions">Jump to the design decisions</a></div><hr>';
async function openSpec(){openModal("spec","The Sprout spec",'<div class="md"><p>Loading…</p></div>');if(!specHTML)specHTML=await loadSpec();if(!MODAL||MODAL.kind!=="spec")return;
 $("mBody").innerHTML=SPEC_INTRO+'<div class="md">'+specHTML+"</div>";
 const h=[...$("mBody").querySelectorAll("h2")].find(x=>/design decisions/i.test(x.textContent)),j=$("toDecisions");
 if(h&&j)j.onclick=e=>{e.preventDefault();$("mBody").scrollTop=h.offsetTop-12};else if(j)j.remove()}
$("bSpec").onclick=openSpec;$("bSpec2").onclick=openSpec;

// ---------- share
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/"))));
async function share(){if(!code.trim()){toast("Nothing to share yet");return}const url=location.origin+location.pathname+"#s3="+b64e(code);
 if(navigator.share){try{await navigator.share({title:"Sprout 3",url});return}catch(e){if(e&&e.name==="AbortError")return}}
 try{await navigator.clipboard.writeText(url);toast("Link copied · anyone who opens it gets this code")}catch(e){prompt("Copy this link:",url)}}
$("bShare").onclick=share;

// ---------- start
(function boot(){
 fit();subUI();
 const m=location.hash.match(/^#s3=([\w-]+)/);
 if(m){try{const src=b64d(m[1]);history.replaceState(null,"",location.pathname);curEx="";dirty=true;setCode(src);build(src,true);toast("Someone shared this with you");return}catch(e){}}
 const sv=LS.get("sprout3.code",null);
 if(sv&&sv.code&&sv.code.trim()){curEx=sv.ex||"";dirty=!!sv.dirty;setCode(sv.code);build(sv.code,true);if(document.body.classList.contains("prog"))tab("out")}
 else loadEx("ace-board",true)})();
</script>
</body></html>
````

## bench.html

Benchmarks in the browser: the language against plain JS, the games, particles up to 100,000 on Canvas 2D and WebGPU, and SQLite

````html
<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f5f4ee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#262624" media="(prefers-color-scheme: dark)">
<title>Sprout 3 benchmarks</title>
<style>
:root{--bg:#f5f4ee;--card:#fffefb;--line:#e4e1d6;--fg:#1f1e1d;--fg2:#5f5d55;--fg3:#8d8a80;--acc:#d97757;--acc2:#c4613f;--ok:#3f8f5a;--bad:#c4453b;
 --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",system-ui,Roboto,sans-serif;--serif:ui-serif,"New York",Charter,Georgia,serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#262624;--card:#30302e;--line:#3d3c38;--fg:#ecebe4;--fg2:#b5b3aa;--fg3:#87857c;--acc:#e08a6b;--acc2:#d97757;--ok:#7fc495;--bad:#ec8b80}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 var(--sans);-webkit-font-smoothing:antialiased}
main{max-width:860px;margin:0 auto;padding:32px 20px 60px}
a{color:var(--acc2)}
h1{font:600 32px/1.15 var(--serif);margin:8px 0 6px;letter-spacing:-.01em}
h2{font:600 20px var(--serif);margin:30px 0 4px}
.kicker{font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--acc2)}
p{color:var(--fg2);margin:6px 0}
.bar{display:flex;gap:10px;align-items:center;margin:18px 0;flex-wrap:wrap}
button{font:600 14px var(--sans);height:36px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;background:var(--acc);color:#fff}
button.sec{background:var(--card);color:var(--fg);box-shadow:0 0 0 1px var(--line)}
button:disabled{opacity:.5;cursor:default}
#status{color:var(--fg3);font-size:13.5px}
.card{background:var(--card);border-radius:14px;box-shadow:0 1px 2px rgba(0,0,0,.05),0 8px 28px rgba(0,0,0,.06);overflow:hidden;margin-top:10px}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:right;padding:8px 14px;border-bottom:1px solid var(--line);white-space:nowrap}
th:first-child,td:first-child{text-align:left}
th{color:var(--fg3);font-weight:600;font-size:12px}
td{font-family:var(--mono);font-size:12.5px}td:first-child{font-family:var(--sans);font-size:13.5px}
tr:last-child td{border-bottom:0}
.note{font-size:13px;color:var(--fg3);padding:10px 14px}
.good{color:var(--ok)}.bad{color:var(--bad)}
.env{font-family:var(--mono);font-size:12.5px;color:var(--fg2)}
</style></head><body>
<main>
<div class="kicker">Sprout 3</div>
<h1>Benchmarks</h1>
<p>Everything here runs in this browser, on this device. Times are the best of several runs, in milliseconds. <a href="./">Back to Sprout 3</a></p>
<div class="bar"><button id="run">Run the benchmarks</button><button class="sec" id="copy" disabled>Copy the results</button><span id="status"></span></div>
<p class="env" id="env"></p>

<h2>The language</h2>
<p>Three small programs, against the same work written in plain JavaScript.</p>
<div class="card"><table id="t-lang"><tr><th>program</th><th>Sprout 3</th><th>plain JS</th><th>ratio</th><th>answer</th></tr></table></div>

<h2>The games</h2>
<p>One frame of each example: update and building the draw list, not painting.</p>
<div class="card"><table id="t-games"><tr><th>game</th><th>ms per frame</th><th>shapes drawn</th></tr></table></div>

<h2>Many particles</h2>
<p>A fountain of N particles, stored as columns (decision 82). Update and the draw list are Sprout; painting is Canvas 2D or WebGPU (one draw call). A frame has 16.7 ms at 60 frames a second.</p>
<div class="card"><table id="t-parts"><tr><th>particles</th><th>update</th><th>draw list</th><th>Canvas 2D</th><th>WebGPU (CPU)</th><th>WebGPU (all)</th></tr></table>
<div class="note" id="gpu-note"></div></div>

<h2>Monte Carlo with spork</h2>
<p>The run from <code>ace-risk.sp</code>: every duration sampled, every risk rolled, and the graph walked five times. spork works it out ahead into one kernel of number maths (decision 91). The ordinary way is <code>collect</code>, timed on 20,000 runs and scaled. SIMD is WebAssembly, two runs per instruction, with the same bits as JavaScript; the GPU does 32-bit maths, and its time includes sending the work and reading the answers back.</p>
<div class="card"><table id="t-mc"><tr><th>runs</th><th>ordinary</th><th>JS kernel</th><th>SIMD</th><th>WebGPU</th><th>GPU vs SIMD</th></tr></table>
<div class="note" id="mc-note"></div></div>

<h2>SQLite</h2>
<p>SQLite compiled to WebAssembly (sql.js), the same as the page uses for <code>db</code>. Rows come back as Sprout records.</p>
<div class="card"><table id="t-sql"><tr><th>work</th><th>ms</th><th>rows</th></tr></table></div>
</main>

<script src="sprout3.js?v=20261120g"></script>
<script src="live3.js?v=20261120g"></script>
<script src="gpu-paint.js?v=20261120g"></script>
<script src="sqlite-web.js?v=20261120g"></script>
<script src="gpu-spork.js?v=20261120g"></script>
<script>
"use strict";
const $=id=>document.getElementById(id),S=window.Sprout3,L=window.Sprout3Live;
S.setLog(()=>{});S.setOut(()=>{});
const GW=360,GH=480,RESULTS=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const status=t=>$("status").textContent=t;
function best(f,n){let b=1e9,r;for(let i=0;i<n;i++){const t=performance.now();r=f();b=Math.min(b,performance.now()-t)}return [b,r]}
async function bestAsync(f,n){let b=1e9,r;for(let i=0;i<n;i++){const t=performance.now();r=await f();b=Math.min(b,performance.now()-t)}return [b,r]}
const ms=x=>x<0.1?x.toFixed(3):x<10?x.toFixed(2):x.toFixed(1);
function row(id,cells,cls){const tr=document.createElement("tr");tr.innerHTML=cells.map((c,i)=>"<td"+(cls&&cls[i]?' class="'+cls[i]+'"':"")+">"+c+"</td>").join("");$(id).appendChild(tr);RESULTS.push(id.slice(2)+": "+cells.join(" | "))}

// ---------- the language
const LANG={
 fib:{src:"fib : [n | n < 2 [n] else [fib (n - 1) + (fib (n - 2))]]\nresult : fib 25",js:()=>{const f=n=>n<2?n:f(n-1)+f(n-2);return f(25)}},
 fold:{src:"result : range 1000000 fold [0, [t n | t + n]]",js:()=>{let t=0;for(let i=1;i<=1e6;i++)t+=i;return t}},
 records:{src:"step : [rs | rs collect [r | r with [y : r y + 1]] keep [r | r y > 0]]\ngo : [rs k | k = 0 [rs] else [go [step rs, k - 1]]]\nresult : go [range 10000 collect [n | [x : n, y : 0]], 20] length",
  js:()=>{let rs=[];for(let i=1;i<=1e4;i++)rs.push({x:i,y:0});for(let k=0;k<20;k++)rs=rs.map(r=>({...r,y:r.y+1})).filter(r=>r.y>0);return rs.length}}};
async function benchLang(){
 for(const [name,b] of Object.entries(LANG)){status("language: "+name);await sleep(10);
  // the last line runs inside a cell that takes an input, so it is worked out again on every run
  const c=S.load(b.src.replace(/^result : (.*)$/m,"f : [k | $1]")).field("f");const [t,r]=best(()=>c.run(1),7);const [tj,rj]=best(b.js,7);
  row("t-lang",[name,ms(t),ms(tj),(t/tj).toFixed(1)+"×",S.fmt(r)+(S.fmt(r)===String(rj)?"":" ≠ "+rj)])}}

// ---------- the games
const GAMES=["sprout","fireflies","orbit","hop","life","bounce","snake","breakout","particles","ace-board","ace-site","ace-crews"];
async function benchGames(){
 for(const name of GAMES){status("games: "+name);await sleep(10);
  const src=await (await fetch("examples/"+name+".sp?v=20261120g")).text();const g=L.makeGame(src,{W:GW,H:GH});
  const play=n=>{for(let t=0;t<n;t++){if(t%50===0)g.down(100+(t%160),300);if(t%50===25)g.up();g.tick(1/60);g.draw()}};
  play(240);const [t]=best(()=>play(120),5);row("t-games",[name,ms(t/120),String(g.draw().length)])}}

// ---------- many particles
const FOUNTAIN=n=>`spawn : [k | [x : noise [k, 1] * W, y : noise [k, 2] * H, vx : noise [k, 3] * 120 - 60, vy : noise [k, 4] * 120 - 60]]
start :
  ps : range ${n} collect spawn
update : [g |
  dt : g dt
  g with [ps : g ps collect [p | p with [x : p x + (p vx * dt) % W, y : p y + (p vy * dt) % H]]]
]
draw : [g |
  clear "#101418"
  g ps each [p | circle [p x, p y, 2, "#ffcc66"]]
]`;
let GPU=null,gpuWhy="";
async function benchParticles(){
 try{GPU=await SproutGpu.makeGpuPainter(document.createElement("canvas"))}catch(e){gpuWhy=e.message||String(e)}
 $("gpu-note").textContent=GPU?"WebGPU: "+(GPU.adapter||"available")+". CPU is the time to build and submit a frame; all is until the GPU has finished it.":"WebGPU isn't available here"+(gpuWhy?" ("+gpuWhy+")":"")+", so only Canvas 2D is timed.";
 const W2=720,H2=960,cv=document.createElement("canvas");cv.width=W2;cv.height=H2;const ctx=cv.getContext("2d");
 for(const n of [2000,10000,50000,100000]){status("particles: "+n);await sleep(10);
  const g=L.makeGame(FOUNTAIN(n),{W:GW,H:GH});for(let t=0;t<3;t++)g.tick(1/60);
  const [tu]=best(()=>g.tick(1/60),5);const [td,list]=best(()=>g.draw().map(d=>[d[0],d[1].slice()]),5);
  const [tc]=best(()=>{ctx.setTransform(W2/GW,0,0,H2/GH,0,0);for(const [k,a] of list){if(k==="clear"){ctx.fillStyle=a[0];ctx.fillRect(0,0,GW,GH)}else if(k==="circle"){ctx.fillStyle=a[3];ctx.beginPath();ctx.arc(a[0],a[1],a[2],0,Math.PI*2);ctx.fill()}}},3);
  let gc="–",ga="–";
  if(GPU){try{let bc=1e9,ba=1e9;for(let r=0;r<3;r++){const t=await GPU.timeFrames(list,GW,GH,W2,H2,5);bc=Math.min(bc,t.cpu);ba=Math.min(ba,t.total)}gc=ms(bc);ga=ms(ba)}catch(e){gc=ga="failed";gpuWhy=e.message;$("gpu-note").textContent="WebGPU stopped answering here ("+gpuWhy+"), so its times are missing."}}
  row("t-parts",[n.toLocaleString(),ms(tu),ms(td),ms(tc),gc,ga],[0,tu+td<16.7?"good":"bad",0,tc<16.7?"good":"bad",0,0])}}

// ---------- SQLite
async function benchSql(){
 status("SQLite: loading");
 await new Promise((ok,no)=>{const s=document.createElement("script");s.src="vendor/sqljs/sql-wasm.js?v=20261120g";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
 const db=await SproutSqlite.openSqlite({base:"vendor/sqljs/",name:"sprout3-bench",fresh:true});S.G.db=db;const raw=db.raw();
 const N=10000;
 const [ti]=best(()=>{raw.run("drop table if exists t");raw.run("create table t (id integer primary key, zone integer, hours real, name text)");raw.run("begin");
  const st=raw.prepare("insert into t values (?, ?, ?, ?)");for(let i=1;i<=N;i++)st.run([i,i%20,(i*7)%40+1,"atom "+i]);st.free();raw.run("commit")},3);
 row("t-sql",["insert 10,000 rows (one transaction)",ms(ti),N.toLocaleString()]);
 const [tq,c]=best(()=>{const st=raw.prepare("select * from t");let n=0;while(st.step()){st.get();n++}st.free();return n},5);
 row("t-sql",["read 10,000 rows in JavaScript",ms(tq),c.toLocaleString()]);
 // each is inside a cell that takes an input, so it is worked out again on every run (a plain field is worked out once)
 const q=S.load('f : [k | db query "select * from t"]').field("f");const [ts,r]=best(()=>q.run(1),5);
 row("t-sql",["db query: 10,000 rows into Sprout records",ms(ts),r.count().toLocaleString()]);
 const a=S.load('f : [k | db query "select * from t" keep [r | r zone = 3] collect [r | r hours] fold [0, [t h | t + h]]]').field("f");const [ta,v]=best(()=>a.run(1),5);
 row("t-sql",["the same, then keep, collect and fold in Sprout",ms(ta),"total "+S.fmt(v)]);
 const w=S.load('f : [k | db query ["select sum(hours) as h from t where zone = ?", [3]] first h]').field("f");const [tw,v2]=best(()=>w.run(1),5);
 row("t-sql",["the same sum, done by SQLite",ms(tw),"total "+S.fmt(v2)]);
 await db.clear()}

// ---------- Monte Carlo: the ace-risk run, five ways
async function benchMonteCarlo(){
 const src=(await (await fetch("examples/ace-risk.sp?v=20261120g")).text()).split("\nresults :")[0];
 const c=S.load(src+"\nA : [k | range k spork one-run]\nB : [k | range k collect one-run]"),A=c.field("A"),B=c.field("B");
 // the kernel itself, to hand straight to the GPU
 let K=null;S.sporkWays({gpu:k=>{K=k;return undefined}});A.run(16);S.sporkWays({gpu:null});
 let gs=null,why="";try{gs=await SproutGpuSpork.makeGpuSpork()}catch(e){why=e.message||String(e)}
 $("mc-note").textContent=(K?"One run is "+K.nodes.length+" steps. ":"")+(gs?"WebGPU: "+gs.adapter+".":"WebGPU isn't available here"+(why?" ("+why+")":"")+", so the GPU isn't timed.");
 status("monte carlo: ordinary");await sleep(10);
 const [to]=best(()=>B.run(20000),1);
 const W=S.sporkWays({}).wasm;
 for(const n of [100000,1000000,4000000]){status("monte carlo: "+n.toLocaleString());await sleep(10);
  S.sporkWays({wasm:null});const [tj]=best(()=>A.run(n),n>1e6?1:3);
  S.sporkWays({wasm:W});const [ts,simd]=best(()=>A.run(n),n>1e6?2:5);
  let tg=NaN,gap="";
  if(gs&&K){try{await gs.run(K,n,null,[]);const [t,O]=await bestAsync(()=>gs.run(K,n,null,[]),3);tg=t;
   // 32-bit maths: a risk roll right at its chance can come out the other way, so count the runs that differ, and compare P50 and P90
   let off=0;const a=simd.cols[0],g=O[0];for(let i=0;i<n;i++)if(Math.abs(a[i]-g[i])>0.01)off++;
   const sa=Float64Array.from(a).sort(),sg=Float64Array.from(g).sort(),q=p=>Math.abs(sa[Math.floor(p*n)]-sg[Math.floor(p*n)]);
   gap=off+(off===1?" run differs":" runs differ")+"; P50 within "+q(0.5).toExponential(0)+", P90 within "+q(0.9).toExponential(0)+" days"}catch(e){gap=e.message||String(e)}}
  row("t-mc",[n.toLocaleString(),ms(to*n/20000)+" (scaled)",ms(tj),ms(ts),isNaN(tg)?"—":ms(tg),gap])}}

$("run").onclick=async()=>{$("run").disabled=true;RESULTS.length=0;
 for(const t of ["t-lang","t-games","t-parts","t-mc","t-sql"])while($(t).rows.length>1)$(t).deleteRow(1);
 $("env").textContent=navigator.userAgent;
 try{await benchLang();await benchGames();await benchParticles();await benchMonteCarlo();await benchSql();status("done")}catch(e){status("stopped: "+(e.message||e))}
 $("run").disabled=false;$("copy").disabled=false;window.BENCH_DONE=true};
$("copy").onclick=async()=>{const t=["Sprout 3 benchmarks",navigator.userAgent,...RESULTS].join("\n");try{await navigator.clipboard.writeText(t);status("copied")}catch(e){prompt("Copy these:",t)}};
</script>
</body></html>
````

## old-sprout2.js

The old Sprout 2.0 compiler, kept only so bench.js can compare against it.

````js
// Sprout 2.0 compiler (Sprout -> JS) and runtime, copied from 2026experiments/pm-tools/sprout2-ide.html.
// Small fixes for Sprout Live, each marked "Sprout Live fix N" in the code:
//  1. a := inside a selection branch, like  x > 0 [count := count + 1, 0], now runs (it was dropped).
//  2. [| ... ] is always a zero-argument block, as the v2 docs describe, even when every line is a call.
//  3. inside each/collect bodies, := updates the outer field and  list 2 := v  stores into the list.
//  4. each/collect run a tail call left pending at the end of their block (a final  beep 880 0.1  was skipped).
//  5. a named item, as in  xs each [d | ...], is bound in every loop (it was only bound inside other blocks).
//  6. a.b.c reads every level of a nested record (it read only the first).
//  7. a block with two or more inputs given just one value waits for the rest (add 1 gave NaN).
// Sprout Live additions, each marked "Sprout Live addition X":
//  A. a new line is a new step and a comma is a new item, so [ ... ] over several lines is a block, and [1, 2] is a list.
//  B. records: {x : 1, y : 2}
//  C. dots read and change fields: d.x, d.x := 5, _.y
//  D. string templates: "{score} drops" puts a value into a string. \{ is a plain brace.
//  E. and, or, not: (a > 1) and (b < 2), over not
var SproutToJS=(function(){"use strict";

function tokenize(src){
  const toks=[];let i=0;const n=src.length;
  const ESC={n:"\n",t:"\t","\\":"\\",'"':'"'};
  while(i<n){
    const c=src[i];
    if(c===" "||c==="\t"||c==="\r"){i++;continue}
    if(c==="\n"){toks.push("\n");i++;continue}/* Sprout Live addition A */
    // -- comments (Sprout 2.0)
    if(c==="-"&&i+1<n&&src[i+1]==="-"){i+=2;while(i<n&&src[i]!=="\n")i++;continue}
    // Legacy ' comments (backward compat)
    if(c==="'"){i++;while(i<n&&src[i]!=="'")i++;i++;continue}
    if(c==='"'){let j=i+1;const buf=[],parts=[];
      while(j<n&&src[j]!=='"'){
        if(src[j]==="\\"&&j+1<n){const x=src[j+1];buf.push(ESC[x]!==undefined?ESC[x]:x);j+=2}
        else if(src[j]==="{"){/* Sprout Live addition D: "{expr}" inside a string */
          let d=1,k=j+1;while(k<n&&d&&src[k]!=='"'){if(src[k]==="{")d++;else if(src[k]==="}")d--;if(d)k++}
          if(d)throw new Error("a { in a string needs a } to close it");
          parts.push(buf.join(""));buf.length=0;parts.push({src:src.slice(j+1,k)});j=k+1}
        else{buf.push(src[j]);j++}}
      if(parts.length){parts.push(buf.join(""));toks.push({k:"str",v:parts.map(p=>typeof p==="string"?p:"{"+p.src+"}").join(""),parts})}
      else toks.push({k:"str",v:buf.join("")});i=j+1;continue}
    if("[](){}".includes(c)){toks.push(c);i++;continue}
    if(",|".includes(c)){toks.push(c);i++;continue}
    // := mutation token (Sprout 2.0)
    if(c===":"&&i+1<n&&src[i+1]==="="){toks.push(":=");i+=2;continue}
    if(c===":"){toks.push(c);i++;continue}
    let j=i;
    while(j<n&&!" \t\r\n".includes(src[j])&&!'[](){}",|:'.includes(src[j])&&!(src[j]==="'"&&j>i)&&!(src[j]==="-"&&j+1<n&&src[j+1]==="-"))j++;
    if(j===i){j=i+1}
    toks.push({k:"word",v:src.slice(i,j)});i=j;
  }
  return toks;
}

const Lit=v=>({t:"Lit",v}),Name=n=>({t:"Name",n}),Send=(tgt,m)=>({t:"Send",tgt,m}),Block=()=>({t:"Block",params:[],body:[],group:false}),SetN=(key,val,mut)=>({t:"Set",key,val,mut:!!mut});
const isWord=x=>x&&typeof x==="object"&&x.k==="word",isStr=x=>x&&typeof x==="object"&&x.k==="str";
const NUM=/^-?\d+(\.\d+)?$/;

class Parser{
  constructor(t){this.t=t;this.i=0}
  pk(){return this.i<this.t.length?this.t[this.i]:null}
  nx(){return this.t[this.i++]}
  program(){return this.seq(null)}
  seq(end){
    const items=[];
    while(true){
      const t=this.pk();
      if(t===null||t===end)break;
      if(t===","||t==="\n"){if(t===",")this._comma=true;this.nx();continue}
      items.push(this.exprOrSet());
    }
    return items;
  }
  exprOrSet(){
    const left=this.chain();
    if(this.pk()===":"){this.nx();return SetN(left,this.chain(),false)}
    if(this.pk()===":="){this.nx();return SetN(left,this.chain(),true)}
    return left;
  }
  chain(){
    let node=this.primary();
    while(true){
      const t=this.pk();
      if(t===null||t===","||t==="\n"||t===":"||t===":="||t==="|"||t==="]"||t===")"||t==="}")break;
      node=Send(node,this.primary());
    }
    return node;
  }
  primary(){
    const t=this.nx();
    if(t==="[")return this.block("]");
    if(t==="("){const b=this.block(")");b.group=true;return b}
    if(t==="{")return this.record();/* Sprout Live addition B */
    if(isStr(t)&&t.parts){/* Sprout Live addition D: "a {x} b" is ("a " ++ (x str)) ++ " b" */
      let node=null;
      for(const p of t.parts){
        let part;
        if(typeof p==="string"){if(!p)continue;part=Lit(p)}
        else{const items=new Parser(tokenize(p.src)).program();if(items.length!==1)throw new Error("put one value inside { } in a string");
          const g=Block();g.group=true;g.body=[Send(items[0],Name("str"))];part=g}
        node=node?Send(Send(node,Name("++")),part):(typeof p==="string"?part:Send(Send(Lit(""),Name("++")),part));
      }
      return node||Lit("");
    }
    if(isStr(t))return Lit(t.v);
    if(isWord(t)){
      if(NUM.test(t.v))return Lit(parseFloat(t.v));
      if(/^[A-Za-z_@][\w-]*(\.[A-Za-z_][\w-]*)+$/.test(t.v)){/* Sprout Live addition C: d.x reads field x of d */
        const parts=t.v.split(".");let node=Name(parts[0]);
        for(const p of parts.slice(1)){if(node.t==="Send"){const g=Block();g.group=true;g.body=[node];node=g}node=Send(node,Lit(p))}/* Sprout Live fix 6: a.b.c reads every level */
        return node;
      }
      return Name(t.v);
    }
    throw new Error("unexpected: "+JSON.stringify(t));
  }
  record(){/* Sprout Live addition B: {x : 1, y : 2} is a record */
    const r={t:"Rec",fields:[]};
    while(true){
      const x=this.pk();
      if(x===null)break;
      if(x===","||x==="\n"){this.nx();continue}
      if(x==="}"){this.nx();break}
      if(!isWord(x)||this.t[this.i+1]!==":")throw new Error("records look like {x : 1, y : 2}");
      this.nx();this.nx();
      r.fields.push(SetN(Name(x.v),this.chain(),false));
    }
    return r;
  }
  block(close){
    const b=Block();
    let depth=0,j=this.i,hasBar=false;
    while(j<this.t.length){
      const x=this.t[j];
      if(typeof x==="string"){
        if(x==="["||x==="(")depth++;
        else if(x==="]"||x===")"){if(depth===0&&x===close)break;depth--}
        else if(x==="|"&&depth===0){hasBar=true;break}
      }
      j++;
    }
    if(hasBar){b.bar=true;/* Sprout Live fix 2 */
      while(true){
        const x=this.pk();
        if(x==="|"){this.nx();break}
        if(x===","||x==="\n"){this.nx();continue}
        if(isWord(x)){b.params.push(x.v);this.nx()}
        else this.nx();
      }
    }
    const sc=this._comma;this._comma=false;b.body=this.seq(close);b.commas=this._comma;this._comma=sc;
    if(this.pk()===close)this.nx();
    return b;
  }
}

const OPS={"+":"+","-":"-","*":"*","/":"/","<":"<",">":">","%":"%","<=":"<=",">=":">=","!=":"!=="},CMP=new Set(["<",">","<=",">=","!="]);

function mangle(name){
  if(name==="_"||name==="@")return"IT";
  let out=[];
  for(const ch of name){
    if(/[A-Za-z0-9_]/.test(ch))out.push(ch);
    else out.push("_"+ch.charCodeAt(0).toString(16));
  }
  let s=out.join("");
  if(s&&/[0-9]/.test(s[0]))s="_"+s;
  return"v_"+s;
}

function strlit(s){
  let out="'";
  for(const ch of s){
    if(ch==="\\")out+="\\\\";else if(ch==="'")out+="\\'";else if(ch==="\n")out+="\\n";else if(ch==="\t")out+="\\t";else if(ch==="\r")out+="\\r";else out+=ch;
  }
  return out+"'";
}

const FLAGNAMES=new Set(["pure","memoize","immutable","shared","lazy"]),
      BUILTIN=new Set(["not","print","length","first","second","append","each","collect","fold","times","while","sqrt","floor","str","last","round","ceil","abs","sin","cos","tan","log"]),
      OPSET=new Set([...Object.keys(OPS),"=","++","and","or"]);

class Gen{
  constructor(){this._self=null;this._declared=new Set();this._lists=new Set();this._maps=new Set();this._fns=new Set();this._dense=new Set();this._arity=new Map();this._mayPromote=new Set()}

  scanMayPromote(node){
    if(!node||typeof node!=="object")return;
    if(node.t==="Set"&&node.key&&node.key.t==="Send"&&node.key.tgt&&node.key.tgt.t==="Name"&&this.litStringKey(node.key.m))this._mayPromote.add(node.key.tgt.n);
    for(const k in node){const v=node[k];if(Array.isArray(v))v.forEach(x=>this.scanMayPromote(x));else if(v&&typeof v==="object"&&v.t)this.scanMayPromote(v)}
  }

  genProgram(items){
    items.forEach(it=>this.scanMayPromote(it));
    return items.map(it=>this.genStmt(it)).filter(p=>p).join(";\n");
  }

  peelFlags(node){
    const flags=new Set();
    while(node.t==="Send"&&node.m.t==="Name"&&FLAGNAMES.has(node.m.n)){flags.add(node.m.n);node=node.tgt}
    return[node,flags];
  }

  producesList(node){
    if(node.t==="Block"&&!node.group&&this.isListLiteral(node))return true;
    if(node.t==="Send"){
      if(node.tgt.t==="Name"&&(node.tgt.n==="range"||node.tgt.n==="list"))return true;
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n==="collect"||inner.m.n==="append"))return true;
    }
    return false;
  }

  litStringKey(node){
    while(node&&node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    return(node&&node.t==="Lit"&&typeof node.v==="string")?node:null;
  }

  genStore(k,valnode){
    const tgtNode=k.tgt,idx=this.genExpr(k.m),val=this.genExpr(valnode);
    if(tgtNode.t==="Name"&&this._maps.has(tgtNode.n))return`${mangle(tgtNode.n)}.set(${idx},${val})`;
    if(tgtNode.t==="Name"&&(this._dense.has(tgtNode.n)||this._lists.has(tgtNode.n))){
      if(this.litStringKey(k.m))return`${mangle(tgtNode.n)} = STORE(${mangle(tgtNode.n)},${idx},${val})`;
      if(this._mayPromote.has(tgtNode.n))return`${mangle(tgtNode.n)} = STORE(${mangle(tgtNode.n)},${idx},${val})`;
      return`(${mangle(tgtNode.n)}[${idx}]=${val})`;
    }
    return`STORE(${this.genExpr(tgtNode)},${idx},${val})`;
  }

  genStmt(node){
    if(node.t==="Set"){
      const key=node.key.t==="Name"?node.key.n:null;
      if(key===null){
        if(node.key.t==="Send")return this.genStore(node.key,node.val);
        throw new Error("unsupported set key");
      }
      // := mutation: always reassign, never declare
      if(node.mut){
        const expr=this.genExpr(node.val);
        return`${mangle(key)} = ${expr}`;
      }
      const[core,flags]=this.peelFlags(node.val);
      const isFnBlock=core.t==="Block"&&!core.group&&!this.isListLiteral(core)&&!flags.has("memoize")&&!flags.has("pure");
      if(isFnBlock){this._fns.add(key);this._arity.set(key,core.params.length?core.params.length:(this.usesImplicit(core.body)?1:0))}
      let expr;
      if(core.t==="Block"&&!core.group&&!flags.has("memoize")&&!flags.has("pure")){
        if(this.isListLiteral(core))expr=this.genList(core);
        else{const params=core.params.length?core.params:(this.usesImplicit(core.body)?["_"]:[]);expr=this.genBlockAsLoop(core,key,params)}
      }else{
        expr=this.genExpr(core);
        if(flags.has("memoize")||flags.has("pure"))expr=`MEMO(${expr})`;
      }
      if(this.producesList(core)||(core.t==="Block"&&this.isListLiteral(core)))this._lists.add(key);else if(this._lists.has(key))this._lists.delete(key);
      if(core.t==="Send"&&core.tgt.t==="Name"&&(core.tgt.n==="list"||core.tgt.n==="range"))this._dense.add(key);else if(this._dense.has(key))this._dense.delete(key);
      if(core.t==="Name"&&core.n==="map")this._maps.add(key);else if(this._maps.has(key))this._maps.delete(key);
      if(!isFnBlock){this._fns.delete(key);this._arity.delete(key)}
      if(this._declared.has(key))return`${mangle(key)} = ${expr}`;
      this._declared.add(key);
      return`let ${mangle(key)} = ${expr}`;
    }
    const stmt=this.matchLoopVerbStmt(node);
    if(stmt!==null)return stmt;
    return this.genExpr(node);
  }

  matchLoopVerbStmt(node){
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Block"&&!inner.m.group&&inner.tgt.t==="Name"&&inner.tgt.n==="while"){
        const condblk=inner.m,bodyblk=node.m;
        let raw=null;
        if(condblk.body.length===1&&condblk.body[0].t!=="Set")raw=this.genRawBool(condblk.body[0]);
        const cond=raw!==null?raw:`(${this.genBlockInlineExpr(condblk)})===TRUE`;
        return`while(${cond}){${this.genBlockInlineStmts(bodyblk)}}`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="times"){
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`for(let __i=0;__i<(${this.genExpr(inner.tgt)});__i++){let IT=__i+1;${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="each"){
        const xs=this.genExpr(inner.tgt);
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`{const __l=${xs};for(let __k=1;__k<__l.length;__k++){let IT=__l[__k];${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}}`;
      }
    }
    return null;
  }

  genBlockAsLoop(blk,selfname,params){
    const ps=params.map(mangle).join(",");
    this._self=[selfname,params];
    const saved=new Set(this._declared);
    for(const p of params)this._declared.add(p);
    const body=this.genBlockBody(blk.body);
    this._declared=saved;
    this._self=null;
    const fn=`((${ps})=>{while(true){${body}}})`;
    return params.length>1?`AR(${fn},${params.length})`:fn;
  }

  isListLiteral(node){
    if(node.t!=="Block"||node.group||node.params.length||node.bar/* Sprout Live fix 2 */)return false;
    if(node.body.length>=2&&!node.commas)return false;/* Sprout Live addition A: lines without commas are steps, not list items */
    if(this.usesImplicit(node.body))return false;
    if(node.body.some(e=>e.t==="Set"))return false;
    return node.body.length===0||node.body.length>=2;
  }

  genList(node){
    if(node.body.length===0)return`[0]`;
    return`[0,${node.body.map(e=>this.genExpr(e)).join(",")}]`;
  }

  genExpr(node,tail=false){
    if(node.t==="Rec")return`(new Map([${node.fields.map(f=>`[${strlit(f.key.n)},${this.genExpr(f.val)}]`).join(",")}]))`;/* Sprout Live addition B */
    if(node.t==="Lit")return typeof node.v==="number"?String(node.v):strlit(node.v);
    if(node.t==="Name"){
      const n=node.n;
      if(n==="true")return"TRUE";
      if(n==="false")return"FALSE";
      if(n==="none")return"NONE";
      if(n==="map")return"newmap()";
      if(n==="random")return"Math.random()";
      if(n==="time")return"Date.now()";
      if(n==="pi")return"Math.PI";
      return mangle(n);
    }
    if(node.t==="Block"){
      if(node.group){
        if(node.body.length===1&&node.body[0].t!=="Set")return this.genExpr(node.body[0],tail);
        const saved=this._self;this._self=null;
        const body=this.genBlockBody(node.body);
        this._self=saved;
        return`(()=>{${body}})()`;
      }
      if(this.isListLiteral(node))return this.genList(node);
      const params=node.params.length?node.params:(this.usesImplicit(node.body)?["_"]:[]);
      const saved=this._self;this._self=null;
      const savedd=new Set(this._declared);
      for(const p of params)this._declared.add(p);
      const body=this.genBlockBody(node.body);
      this._declared=savedd;this._self=saved;
      const fn=`((${params.map(mangle).join(",")})=>{${body}})`;
      return params.length>1?`AR(${fn},${params.length})`:fn;
    }
    if(node.t==="Send")return this.genSend(node,tail);
    throw new Error("node "+JSON.stringify(node));
  }

  // Check for _ or @ (backward compat) as implicit argument
  usesImplicit(body){
    const chk=n=>{
      if(n.t==="Name")return n.n==="_"||n.n==="@";
      if(n.t==="Send")return chk(n.tgt)||chk(n.m);
      if(n.t==="Set")return chk(n.val);
      if(n.t==="Block"&&n.group)return n.body.some(chk);
      if(n.t==="Rec")return n.fields.some(chk);
      return false;
    };
    return body.some(chk);
  }

  genRawBool(node){
    while(node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    if(node.t==="Send"&&node.tgt.t==="Send"&&node.tgt.m.t==="Name"){
      const opn=node.tgt.m.n;
      if(CMP.has(opn))return`(${this.genExpr(node.tgt.tgt)} ${OPS[opn]} ${this.genExpr(node.m)})`;
      if(opn==="=")return`REQ(${this.genExpr(node.tgt.tgt)},${this.genExpr(node.m)})`;
    }
    return null;
  }

  genCallback(blk){
    if(!(blk.t==="Block"&&!blk.group))return this.genExpr(blk);
    const params=blk.params.length?blk.params:(this.usesImplicit(blk.body)?["_"]:[]);
    const saved=this._self;this._self=null;
    const parts=[];
    for(let i=0;i<blk.body.length;i++){
      const it=blk.body[i],last=i===blk.body.length-1;
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        /* Sprout Live fix 3: inside each/collect bodies, := reassigns the outer field and  list 2 := v  stores into the list (they became new locals, or crashed) */
        if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");if(last)parts.push("return NONE;");continue}
        parts.push(`${it.mut?"":"let "}${mangle(key)} = ${this.genExpr(it.val)};`);
        if(last)parts.push(`return ${mangle(key)};`);
      }else{
        parts.push((last?"return ":"")+this.genExpr(it,false)+";");
      }
    }
    this._self=saved;
    const fn=`((${params.map(mangle).join(",")})=>{${parts.length?parts.join(""):"return NONE;"}})`;
    return params.length>1?`AR(${fn},${params.length})`:fn;
  }

  genBlockBody(body){
    if(!body.length)return"return NONE;";
    const savedDecl=new Set(this._declared);
    const parts=[];
    for(let i=0;i<body.length;i++){
      const it=body[i],last=i===body.length-1;
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        if(key!==null){
          // := mutation always reassigns
          if(it.mut){
            parts.push(`${mangle(key)} = ${this.genExpr(it.val,false)};`);
          } else if(this._declared.has(key)){
            parts.push(`${mangle(key)} = ${this.genExpr(it.val,false)};`);
          } else{
            this._declared.add(key);
            parts.push(`let ${mangle(key)} = ${this.genExpr(it.val,false)};`);
          }
          if(last)parts.push(`return ${mangle(key)};`);
        }else if(it.key.t==="Send"){
          parts.push(this.genStore(it.key,it.val)+";");
          if(last)parts.push("return NONE;");
        }
      }else{
        if(last)parts.push(this.genTailStmt(it));
        else parts.push(this.genExpr(it,false)+";");
      }
    }
    this._declared=savedDecl;
    return parts.join("");
  }

  genTailStmt(node){
    while(node.t==="Block"&&node.group&&node.body.length===1&&node.body[0].t!=="Set")node=node.body[0];
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&node.m.body.length===2&&this._self!==null){
      const raw=this.genRawBool(node.tgt);
      const cond=raw!==null?raw:`(${this.genExpr(node.tgt)})===TRUE`;
      return`if(${cond}){${this.genTailStmtElem(node.m.body[0])}}else{${this.genTailStmtElem(node.m.body[1])}}`;
    }
    const e=this.genExpr(node,true);
    if(e.startsWith("__LOOP__"))return e.slice(8)+"continue;";
    return`return ${e};`;
  }

  genTailStmtElem(e){if(e.t==="Set")e=e.val;return this.genTailStmt(e)}

  callSpine(node){
    const spine=[];let head=node;
    while(head.t==="Send"){
      const m=head.m;
      if(m.t==="Name"&&(OPSET.has(m.n)||BUILTIN.has(m.n)))return null;
      spine.push(m);head=head.tgt;
    }
    if(spine.length>=2&&head.t==="Name"&&!["true","false","none"].includes(head.n)){
      spine.reverse();return[head,spine];
    }
    return null;
  }

  matchLoopVerb(node){
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const inner=node.tgt;
      if(inner.t==="Send"&&inner.m.t==="Block"&&!inner.m.group&&inner.tgt.t==="Name"&&inner.tgt.n==="while"){
        const condblk=inner.m,bodyblk=node.m;
        let raw=null;
        if(condblk.body.length===1&&condblk.body[0].t!=="Set")raw=this.genRawBool(condblk.body[0]);
        return`(()=>{while(${raw!==null?raw:`(${this.genBlockInlineExpr(condblk)})===TRUE`}){${this.genBlockInlineStmts(bodyblk)}}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="times"){
        const saved=new Set(this._declared);
        this._declared.add("_");this._declared.add("@");
        const body=this.genBlockInlineStmts(node.m);
        this._declared=saved;
        return`(()=>{for(let __i=0;__i<(${this.genExpr(inner.tgt)});__i++){let IT=__i+1;${node.m.params&&node.m.params.length?`let ${mangle(node.m.params[0])}=IT;`:""}/* Sprout Live fix 5 */${body}}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="each"){
        return`(()=>{const __l=${this.genExpr(inner.tgt)},__f=${this.genCallback(node.m)};for(let __k=1;__k<__l.length;__k++){RUN(__f(__l[__k]));/* Sprout Live fix 4 */}return NONE;})()`;
      }
      if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="collect"){
        return`(()=>{const __l=${this.genExpr(inner.tgt)},__o=[0],__f=${this.genCallback(node.m)};for(let __k=1;__k<__l.length;__k++){__o.push(RUN(__f(__l[__k])));/* Sprout Live fix 4 */}return __o;})()`;
      }
    }
    if(node.t==="Send"&&node.m.t==="Block"&&!node.m.group){
      const i2=node.tgt;
      if(i2.t==="Send"&&i2.tgt.t==="Send"&&i2.tgt.m.t==="Name"&&i2.tgt.m.n==="fold"){
        return`(()=>{const __l=${this.genExpr(i2.tgt.tgt)},__f=${this.genCallback(node.m)};let __a=${this.genExpr(i2.m)};for(let __k=1;__k<__l.length;__k++){__a=__f(__a,__l[__k]);}return __a;})()`;
      }
    }
    return null;
  }

  provenList(node){
    while(node&&node.t==="Block"&&node.group&&node.body.length===1)node=node.body[0];
    if(node.t==="Name")return!this._mayPromote.has(node.n)&&(this._dense.has(node.n)||(this._lists.has(node.n)&&!this._maps.has(node.n)));
    if(node.t==="Send"&&node.tgt.t==="Name"&&(node.tgt.n==="range"||node.tgt.n==="list"))return true;
    if(node.t==="Send"&&node.m.t==="Name"&&(node.m.n==="collect"||node.m.n==="append"))return true;
    if(node.t==="Block"&&this.isListLiteral(node))return true;
    return false;
  }

  genBlockInlineExpr(blk){
    if(blk.body.length===1&&blk.body[0].t!=="Set"){
      const saved=this._self;this._self=null;
      const r=this.genExpr(blk.body[0]);
      this._self=saved;return r;
    }
    const saved=this._self;this._self=null;
    const b=this.genBlockBody(blk.body);
    this._self=saved;
    return`(()=>{${b}})()`;
  }

  genBlockInlineStmts(blk){
    const saved=this._self;this._self=null;
    const parts=[];
    for(const it of blk.body){
      if(it.t==="Set"){
        const key=it.key.t==="Name"?it.key.n:null;
        if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");continue}
        const val=this.genExpr(it.val);
        if(it.mut||this._declared.has(key))parts.push(`${mangle(key)} = ${val};`);
        else{this._declared.add(key);parts.push(`let ${mangle(key)} = ${val};`)}
      }else parts.push(this.genLoopStmt(it));
    }
    this._self=saved;
    return parts.join("");
  }

  genLoopStmt(node){
    const lv=this.matchLoopVerbStmt(node);
    if(lv!==null)return lv;
    let sel=node;
    while(sel.t==="Block"&&sel.group&&sel.body.length===1)sel=sel.body[0];
    if(sel.t==="Block"&&sel.group&&sel.body.length>1){
      const parts=[];
      for(const it of sel.body){
        if(it.t==="Set"){
          const key=it.key.t==="Name"?it.key.n:null;
          if(key===null&&it.key.t==="Send"){parts.push(this.genStore(it.key,it.val)+";");continue}
          const val=this.genExpr(it.val);
          if(it.mut||this._declared.has(key))parts.push(`${mangle(key)} = ${val};`);
          else{this._declared.add(key);parts.push(`let ${mangle(key)} = ${val};`)}
        }else{
          const lv2=this.matchLoopVerbStmt(it);
          parts.push(lv2!==null?lv2:this.genLoopStmt(it));
        }
      }
      return parts.join("");
    }
    if(sel.t==="Send"&&sel.m.t==="Block"&&!sel.m.group&&!sel.m.params.length&&sel.m.body.length===2){
      const raw=this.genRawBool(sel.tgt);
      return`if(${raw!==null?raw:`(${this.genExpr(sel.tgt)})===TRUE`}){${this.genBranchStmt(sel.m.body[0])}}else{${this.genBranchStmt(sel.m.body[1])}}`;
    }
    return this.genExpr(node)+";";
  }

  genBranchStmt(e){
    if(e.t==="Block"&&e.group&&e.body.length>1)return this.genLoopStmt(e);
    if(e.t==="Set"){
      const key=e.key.t==="Name"?e.key.n:null;
      if(key===null&&e.key.t==="Send")return this.genStore(e.key,e.val)+";";
      const val=this.genExpr(e.val);
      if(e.mut||this._declared.has(key))return`${mangle(key)} = ${val};`;
      this._declared.add(key);
      return`let ${mangle(key)} = ${val};`;
    }
    return this.genExpr(e)+";";
  }

  genSend(node,tail=false){
    if(node.tgt.t==="Name"&&node.tgt.n==="range")return`RANGE(${this.genExpr(node.m)})`;
    if(node.tgt.t==="Name"&&node.tgt.n==="list")return`ZEROS(${this.genExpr(node.m)})`;
    const lp=this.matchLoopVerb(node);
    if(lp!==null)return lp;
    const cs=this.callSpine(node);
    if(cs!==null){
      const[head,spine]=cs;
      if(tail&&this._self&&head.n===this._self[0]&&spine.length===this._self[1].length){
        const params=this._self[1],tmps=spine.map(a=>this.genExpr(a));
        return`__LOOP__{${tmps.map((t,i)=>`let __t${i}=${t};`).join("")}${params.map((p,i)=>`${mangle(p)}=__t${i};`).join("")}}`;
      }
      const callee=this.genExpr(head),args=spine.map(a=>this.genExpr(a)).join(",");
      if(!tail&&head.t==="Name"&&this._arity.get(head.n)===spine.length)return`${callee}(${args})`;
      if(tail)return`TCN(${callee},[${args}])`;
      return`APPLY(${callee},[${args}])`;
    }
    const inner=node.tgt;
    if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n in OPS)){
      const opn=inner.m.n,L=this.genExpr(inner.tgt),R=this.genExpr(node.m);
      return CMP.has(opn)?`((${L} ${OPS[opn]} ${R})?TRUE:FALSE)`:`(${L} ${OPS[opn]} ${R})`;
    }
    if(inner.t==="Send"&&inner.m.t==="Name"&&(inner.m.n==="and"||inner.m.n==="or")){/* Sprout Live addition E */
      const a=this.genExpr(inner.tgt),b=this.genExpr(node.m);
      return inner.m.n==="and"?`((${a})===TRUE?(${b}):FALSE)`:`((${a})===TRUE?TRUE:(${b}))`;
    }
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="=")return`eq(${this.genExpr(inner.tgt)},${this.genExpr(node.m)})`;
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="++")return`((${this.genExpr(inner.tgt)})+(${this.genExpr(node.m)}))`;
    if(inner.t==="Send"&&inner.m.t==="Name"&&inner.m.n==="append")return`(${this.genExpr(inner.tgt)}).concat([${this.genExpr(node.m)}])`;
    if(node.m.t==="Name"){
      const m=node.m.n;
      if(m==="dom")return`v_dom(${this.genExpr(node.tgt)})`;
      if(m==="css")return`v_css(${this.genExpr(node.tgt)})`;
      if(m==="prompt")return`v_prompt(${this.genExpr(node.tgt)})`;
      if(m==="print")return`prnt(${this.genExpr(node.tgt)})`;
      if(m==="not")return`((${this.genExpr(node.tgt)})===TRUE?FALSE:TRUE)`;/* Sprout Live addition E */
      if(m==="length")return`LEN(${this.genExpr(node.tgt)})`;
      if(m==="sqrt")return`Math.sqrt(${this.genExpr(node.tgt)})`;
      if(m==="floor")return`Math.floor(${this.genExpr(node.tgt)})`;
      if(m==="round")return`Math.round(${this.genExpr(node.tgt)})`;
      if(m==="ceil")return`Math.ceil(${this.genExpr(node.tgt)})`;
      if(m==="abs")return`Math.abs(${this.genExpr(node.tgt)})`;
      if(m==="sin")return`Math.sin(${this.genExpr(node.tgt)})`;
      if(m==="cos")return`Math.cos(${this.genExpr(node.tgt)})`;
      if(m==="tan")return`Math.tan(${this.genExpr(node.tgt)})`;
      if(m==="log")return`Math.log(${this.genExpr(node.tgt)})`;
      if(m==="str")return`fmt(${this.genExpr(node.tgt)})`;
      if(m==="last"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[(${t}).length-1]`:`LAST(${t})`}
      if(m==="first"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[1]`:`CALL(${t},1)`}
      if(m==="second"){const t=this.genExpr(node.tgt);return this.provenList(node.tgt)?`(${t})[2]`:`CALL(${t},2)`}
      if((m in OPS)||m==="="||m==="++"){
        const t=this.genExpr(node.tgt);
        if(CMP.has(m))return`((R)=>((${t}) ${OPS[m]} R)?TRUE:FALSE)`;
        if(m in OPS)return`((R)=>((${t}) ${OPS[m]} R))`;
        if(m==="=")return`((R)=>eq(${t},R))`;
        if(m==="++")return`((R)=>((${t})+R))`;
      }
      const argname=({true:"TRUE",false:"FALSE",none:"NONE"})[m]||mangle(m);
      const t=this.genExpr(node.tgt);
      return tail?`TC(${t}, ${argname})`:`RUN(SEND(${t}, ${argname}))`;
    }else{
      const mIsData=node.tgt.t==="Name"&&this._fns.has(node.tgt.n)&&node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&this.isListLiteral(node.m);
      if(node.m.t==="Block"&&!node.m.group&&!node.m.params.length&&!mIsData){
        const t=this.genExpr(node.tgt),elems=node.m.body;
        if(elems.length===2){
          const a=this.genExprThunkelem(elems[0],tail),b=this.genExprThunkelem(elems[1],tail),raw=this.genRawBool(node.tgt);
          return raw!==null?`((${raw})?(${a}):(${b}))`:`((${t})===TRUE?(${a}):(${b}))`;
        }
        if(elems.length===1)return`((${this.genExpr(node.tgt)})===TRUE?(${this.genExprThunkelem(elems[0],tail)}):NONE)`;
        const thunks=elems.map(e=>"()=>"+this.genExprThunkelem(e,tail)).join(",");
        return tail?`SELT(${t}, [${thunks}])`:`RUN(SELT(${t}, [${thunks}]))`;
      }
      if(node.tgt.t==="Name"&&this._lists.has(node.tgt.n)){
        if(this.litStringKey(node.m))return`CALL(${mangle(node.tgt.n)},${this.genExpr(node.m)})`;
        const a=this.genExpr(node.m);
        if(this._mayPromote.has(node.tgt.n))return`CALL(${mangle(node.tgt.n)},${a})`;
        return this._dense.has(node.tgt.n)?`${mangle(node.tgt.n)}[${a}]`:`(${mangle(node.tgt.n)}[${a}]??NONE)`;
      }
      if(node.tgt.t==="Name"&&this._maps.has(node.tgt.n))return`(${mangle(node.tgt.n)}.get(${this.genExpr(node.m)})??NONE)`;
      const t=this.genExpr(node.tgt),a=this.genExpr(node.m);
      if(!tail&&node.tgt.t==="Name"&&this._arity.get(node.tgt.n)===1)return`${t}(${a})`;
      return tail?`TC(${t}, ${a})`:`RUN(CALL(${t}, ${a}))`;
    }
  }

  /* Sprout Live fix 1 */genExprThunkelem(e,tail=false){return e.t==="Set"?this.genExpr({t:"Block",params:[],body:[e],group:true},tail):this.genExpr(e,tail)}
}

function compile(src){return new Gen().genProgram(new Parser(tokenize(src)).program())}
return{compile};
})();

var SproutRuntime=(function(){"use strict";const NONE=Symbol("none"),TRUE={sel:0},FALSE={sel:1};const eq=(a,b)=>(a===b)?TRUE:FALSE,REQ=(a,b)=>(a===b);function RANGE(n){const a=new Float64Array(n+1);for(let i=1;i<=n;i++)a[i]=i;return a}function ZEROS(n){return new Float64Array(n+1)}function newmap(){return new Map()}function LEN(x){if(typeof x==="string")return x.length;if(Array.isArray(x)||ArrayBuffer.isView(x))return x.length-1;return 0}function LAST(x){if(typeof x==="string")return x.length?x[x.length-1]:NONE;const n=LEN(x);return n>=1?CALL(x,n):NONE}function STORE(t,k,v){if(Array.isArray(t)&&typeof k==="number"){while(t.length<=k)t.push(NONE);t[k]=v;return v}if(t instanceof Map){t.set(k,v);return v}return v}function fmt(x){if(x===NONE)return"none";if(x===TRUE)return"true";if(x===FALSE)return"false";if(typeof x==="number")return String(x);if(typeof x==="string")return x;if(typeof x==="function")return"[block]";if(x instanceof Map)return"{"+Array.from(x).map(([k,v])=>k+" : "+fmt(v)).join(", ")+"}";if(Array.isArray(x)||ArrayBuffer.isView(x))return"["+Array.from(x).slice(1).map(fmt).join(", ")+"]";return String(x)}function CALL(t,a){if(t===TRUE||t===FALSE){if(Array.isArray(a))return(a[t.sel]!==undefined)?a[t.sel]():NONE;return NONE}if(Array.isArray(t)||ArrayBuffer.isView(t))return typeof a==="number"&&a>=1&&a<t.length?t[a]:NONE;if(t instanceof Map)return t.has(a)?t.get(a):NONE;if(typeof t==="function")return(t.L||1)>1?invoke(t,[a]):t(a);/* Sprout Live fix 7 */return NONE}function SEND(t,arg){if(typeof t==="function")return RUN(t(arg));if(Array.isArray(t)||ArrayBuffer.isView(t)||t instanceof Map)return CALL(t,arg);return NONE}class Bounce{constructor(fn,args){this.fn=fn;this.args=args}}function RUN(v){while(v instanceof Bounce)v=v.fn(...v.args);return v}function AR(fn,n){fn.L=n;return fn}function invoke(fn,args){if(typeof fn!=="function")return args.length?CALL(fn,args[0]):fn;const L=fn.L||1;if(args.length===L)return fn(...args);if(args.length<L){const got=args.slice();const g=(...more)=>invoke(fn,got.concat(more));g.L=L-args.length;return g}return invoke(RUN(fn(...args.slice(0,L))),args.slice(L))}function APPLY(fn,args){if(typeof fn==="function"&&(fn.L||1)===args.length)return RUN(fn(...args));return RUN(invoke(fn,args))}function TCN(fn,args){if(typeof fn==="function"&&(fn.L||1)===args.length)return new Bounce(fn,args);return invoke(fn,args)}function TC(t,arg){if(typeof t==="function"&&(t.L||1)===1)return new Bounce(t,[arg]);return CALL(t,arg)}function SELT(boolv,thunks){if(boolv===TRUE||boolv===FALSE){const i=boolv.sel;return thunks[i]!==undefined?thunks[i]():NONE}return NONE}function MEMO(fn){const L=fn.L||1,cache=new Map();const w=(...args)=>{const key=args.map(keyOf).join("");if(cache.has(key))return cache.get(key);const val=RUN(fn(...args));cache.set(key,val);return val};w.L=L;return w}function keyOf(a){if(a===TRUE)return"T";if(a===FALSE)return"F";if(a===NONE)return"N";return(typeof a)+":"+String(a)}return{NONE,TRUE,FALSE,eq,REQ,RANGE,ZEROS,newmap,LEN,LAST,STORE,fmt,CALL,SEND,Bounce,RUN,AR,invoke,APPLY,TCN,TC,SELT,MEMO,keyOf}})();
if(typeof module!=="undefined")module.exports={SproutToJS,SproutRuntime};
````
