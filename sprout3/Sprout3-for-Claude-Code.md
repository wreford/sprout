# Sprout 3: complete project for Claude Code

This one file holds the whole Sprout 3 project: the design spec, the compiler and runtime, the game layer, the tests, the benchmarks and the example programs. Every file is below in full, under a heading that gives its path.

## Start here

**Rebuild the project.** Recreate each file under "Files" at the path in its heading, inside a folder such as `sprout3/`. Each file sits in a fenced block that opens with four backticks; copy everything between the fences exactly.

**Run it (Node 22 or later):**

```
node test.js          # language tests (71)
node game-tests.js    # game tests (20)
node frame-bench.js   # ms per frame for each game
node bench.js         # speed against the old compiler and plain JS
node run3.js examples/tour.sp
```

All 91 tests pass as of 19 November 2026. `test.js` uses `node:sqlite`, which prints an "experimental" warning; that is expected.

## How to work on it

- **The spec is the source of truth.** The section "Design decisions not yet built" (decisions 1 to 81) defines Sprout 3, despite its name: almost all of it is now built. Later decisions override earlier ones and say so. Sections 1 to 15 at the top of the spec describe the older Sprout 2.0 / Sprout Live baseline and are kept for history only.
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
- **Runtime values:** `Cell` (from a literal, lazy), `VCell` (a cell of values: shape plus value array), `RCell` (a lazy `range`), `ColCell` (a list of number records stored as one number array per field), `Native` (a host word), `Waiting` (a prototype method waiting for its right side). `false` is the only falsy value.
- **Prelude:** a short Sprout program inside `sprout3.js` defines `match`, `cond`, `take`, `rgb`, `rgba`, `every`, `wave` and `frame` in Sprout itself.
- **`live3.js`, the game loop.** A game file binds `start`, `update` and `draw`. Events (`down`, `move`, `up`, `tick`) fold through `frame update`. Effects are queued during `update` and carried out after it. Random numbers are recorded per tick, so `replayFrom` is exact. Rewind is a list of states, since cells never change. Hot-swap keeps live values whose starting value didn't change.

## Open items and next steps

1. **The speed roadmap (decision 79), in order:**
   - columns: built (decision 82)
   - loop fusion for `collect`/`keep`/`fold` chains
   - spork sending pure numeric cells to WebAssembly with SIMD or to the GPU
   - seeded `noise [sample, id]` for big runs
2. **Not built yet:**
   - files and folders as cells (decisions 63 to 66)
   - extending built-ins by shadowing (40)
   - spork (47)
   - automatic purity detection (32)
   - the editor-side lint that flags slow paths
3. **Known rough edges:**
   - The `else` catch: a then-branch that gives `false` also runs the `else` (74).
   - Field/name clash lints fire on the common `update` pattern; rename the local (73).
   - A missing-field read still logs even inside `x else default`.
   - A cell can't have a field whose name is worked out at run time, so the host passes held keys in on each tick.
4. **Current speed:**
   - Games use 0.005 to 0.03 ms a frame. 2,000 particles went from about 1.45 to 0.28 ms a frame with columns (decision 82).
   - fib 25 takes about 2.2 ms, against 1.0 for plain JS; sum to 1,000,000 about 3 ms; 10,000 records times 20 updates went from about 11 to 1.4 ms with columns, which is faster than the plain JS version of the same work.
   - Compiling `sprout.sp` takes about 4 ms.

## Contents

- Spec: `spec.md`
- `sprout3.js`: Compiler (Sprout to JavaScript) and runtime
- `live3.js`: Game layer: event loop, queued effects, recorded randomness, rewind, replay, hot-swap
- `sqlite-host.js`: SQLite host cell (Node built-in node:sqlite)
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
74. **`else` stays a plain library cell, catch included.** If a then-branch gives `false`, the `else` runs too. A branch written as `[false]` before `else` gets a lint. (`match` and `cond` are written so a missing case gives `false` rather than looping.)
75. **One rule for every cell.** A cell's fields can always be read and compare by value; its body runs on a send and compares by code. A record is a cell with no body, a function a cell with no fields, and a cell can be both: `[n | doc : "doubles", n * 2]` has a readable `doc` and runs on `21`. In a cell that takes input, a binding that uses the input is a local of that run, not a field: in `[n | m : n * 2, m + 1]`, `m` can't be read from outside.
76. **Colours are cells.** `rgb [255, 0, 0]` and `rgba [0, 0, 0, 0.5]` are library cells giving colour text, so games never write colour strings with brackets. Hex strings like `"#ff6b4a"` still work.
77. **`cond` and `take` are library cells (Claude's call).** `cond [test, result, test, result, ..., any, fallback]` gives the result of the first true test, like `match` but with tests. `take [xs, n]` gives the first `n` parts.
78. **SQLite is a host cell.** `db query "select ..."` or `db query [sql, [params]]` gives a cell of records straight away; `db run [sql, [params]]` is an effect, so inside `update` it is queued, carried out after, and dropped on replay. The language stays storage-neutral.
79. **Speed roadmap (step 1 built, see 82).** In order: (1) columns: records of one shape stored as flat number arrays per field; (2) loop fusion: `collect`, `keep`, `fold` chains run as one loop with no in-between lists; (3) spork sends pure numeric cells to WebAssembly with SIMD or to the GPU; (4) seeded randomness for big runs, `noise [sample, id]`, so replay needs nothing recorded. JavaScript stays the backend; a LuaJIT backend is parked.
80. **Library-level choices are Claude's to make and record**, without asking first.
81. **Only `[ ]` is a template inside a string.** `"[g score] drops"` puts a value in; `( )` is plain text, so SQL (`values (?, ?)`) and CSS (`rgba(0,0,0,0.5)`) need no escapes. Write `\[` for a plain bracket. Replaces the `( )` half of decisions 5 and 6.
82. **Columns (built; Claude's call under decision 80).** A list of 32 or more records that share one shape and hold only numbers is stored as one number array per field. A cell with one named input gets a column version of its body when the body is one of three things: `s with [...]` where each new value is number maths on `s`'s fields; a test made of number maths and comparisons; or a host word given a cell of values, such as `circle [s x, s y, 2, "#fc6"]`. `collect`, `keep` and `each` use the column version on a list in columns, and `..` keeps two such lists in columns. Anything else falls back to the ordinary way, including a field that isn't there, a word in a record and an outside name that isn't a number. So a program can't tell the difference: parts, `@`, `length`, `=` and `str` all see ordinary records (decisions 22 and 39), and the tests run both ways. `random` and other recorded reads are never moved out of the loop, so replay stays exact. The particle fountain went from 1.45 to 0.28 ms a frame, and 10,000 records times 20 updates from 11 to 1.4 ms.
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
          const B = this.genArg(T[++i], tail && i + 1 >= T.length), ta = this.tmp();
          if (w === "else") v = "((" + ta + "=" + v + ")!==false?" + ta + ":" + B + ")";
          else if (w === "and") v = "((" + ta + "=" + v + ")===true?ISBOOL(" + B + ",'and'):" + ta + "===false?false:MISSING(" + ta + ",'and'))";
          else v = "((" + ta + "=" + v + ")===false?ISBOOL(" + B + ",'or'):" + ta + "===true?true:MISSING(" + ta + ",'or'))";
          continue;
        }
        const r = this.lookup(w);
        const lex = r ? "()=>" + this.refJS(r) : (this.globals.has(w) ? "()=>" + this.globalRef(w) : "null");
        v = "SWI(" + v + "," + JSON.stringify(w) + "," + lex + "," + (t.line || 0) + "," + this.ic() + ")";
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
function SWI(r, w, lex, line, ic) {
  if (r instanceof VCell) {
    const fs = r.fs;
    if (fs === ic.s) { const v = r.fv[ic.i]; return v instanceof Cell && v.sh.usesLeft ? readField(r, v) : v; }
    const i = fs.index(w);
    if (i >= 0) { if (lex) clash(w, line); ic.s = fs; ic.i = i; const v = r.fv[i]; return v instanceof Cell && v.sh.usesLeft ? readField(r, v) : v; }
  }
  return SW(r, w, lex, line);
}
// decision 73: a word that is both a field of the receiver and a name in scope reads the field, loudly
function clash(w, line) { lint("\"" + w + "\" is both a field here and a name in scope; the field wins" + (line ? " (line " + line + ")" : "")); }
function SW(r, w, lex, line) {
  if (r instanceof Cell || r instanceof VCell) { const v = r.field(w); if (v !== UNSET) { if (lex) clash(w, line); return readField(r, v); } }
  const m = protoOf(r)[w];
  if (m !== undefined) return m.ar ? new Waiting(m.fn, r) : m.fn(r);
  if (lex) return SEND(r, lex());
  return MISSING(r, w, line);
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
  for (const name in DRAW) host[name] = new Native(name, a => { draws.push([name, argsOf(a, DRAW[name])]); return false; }, true);
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

const errs = logs.filter(m => !/doesn't know input/.test(m));
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
const games = ["sprout", "bounce", "snake", "breakout", "particles"];
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
