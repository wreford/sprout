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
83. **A read right before `else` may miss quietly (built; Claude's call, fixing a listed rough edge).** In `p name else "anon"`, `else` is the program saying the field may be missing, so a miss on that one read gives `false` without a log (decision 28). Misses anywhere else, including deeper inside the left side, still log. The prelude's `s input else fresh-input` no longer logs on a game's first event.
84. **`match` and `cond` give a `false` answer instead of falling through (built; library, decision 80).** They were written with `[answer] else [try the next case]`, so an answer of `false` set off the `else` catch (decision 74) and the search carried on, against decision 35 ("gives the first matching result"). They now find the position of the first matching case (a number, never `false`) and then give that case's answer, whatever it is. Only the chosen answer is worked out, as before. Decision 74 itself is unchanged for user code.
85. **Typos get a suggestion (built; Claude's call).** An unknown word's note names the nearest name in scope or built-in, as in `"cuont" isn't a word Sprout knows yet (did you mean "count"?)`. A missing field's note names the nearest field of that cell: `doesn't know sped (did you mean speed?)`. "Nearest" means at most 1 edit for names of 4 letters or fewer, and 2 for longer ones. A swap of two neighbouring letters counts as 1 edit. When two names are equally near, there is no suggestion.
86. **Speed notes (built; Claude's call, the editor-side lint for slow paths).** The compiler notes, for every `collect`, `keep` and `each` given a cell literal, whether its body can run over columns (decision 82), and if not, why: for example "it calls near for each item", "it works with words, not numbers" or "the body has more than one step". `load` puts the notes on the file cell as `speed`, and a game exposes them as `game speed`. The page shows a thin bar in the code's gutter, green when a loop can run over columns and amber when it runs item by item, and lists every loop with its reason in the State tab. Running item by item is fine for short lists, so the notes are information, not warnings.
87. **`noise [sample, id]` (built; step 4 of decision 79).** It gives a number from 0 up to 1, always the same for the same two inputs: a 32-bit hash of both, whole and fractional parts. It is pure, so it isn't recorded for replay (decision 54) and can run inside a column loop (decision 82). `ace-schedule.sp` uses `noise [run, atom]` instead of `random`, so a graph and a seed always give the same Monte Carlo histogram, as ACE's theory asks (7.3).
88. **`fold` can run as a tight loop (built; Claude's call, from the benchmarks).** A fold block with two named inputs whose body is number maths on them, as in `range n fold [0, [t x | t + (x * x)]]`, gets a loop version: one plain loop with no cell made per step. It is used when the list is `range n` or a list of numbers and the starting value is a number; anything else falls back to the ordinary way, so a program can't tell the difference, and the tests run both ways. Outside names that are numbers, `noise` (decision 87) and the maths words all work inside it; a branch (`... [a] else [b]`) or a call to another cell does not yet. Speed notes (decision 86) cover `fold` too. Summing 100,000 numbers went from 0.81 to 0.15 ms.
89. **Host words can take their values one by one (built; library, decision 80).** A host word may offer a direct form that takes its values as separate arguments. When an `each` loop over columns (decision 82) calls `circle [s x, s y, 2, "#fc6"]`, it uses the direct form, so no argument cell is made per shape. The program is unchanged. Drawing 10,000 particles went from 0.63 to 0.36 ms a frame; at 100,000 the time is mostly the draw list itself, about 5 ms either way.
90. **The page has SQLite and WebGPU (built; Claude's call).** In the browser, `db` (decision 78) is SQLite compiled to WebAssembly (sql.js, MIT, in `vendor/sqljs`), with the same `query` and `run` as Node's `node:sqlite`. The database is kept in the browser (IndexedDB) and saved shortly after each write. The State tab lists its tables and can clear it. It is loaded only when a program uses `db`. The game view can draw with WebGPU: every shape in a frame goes to the GPU as one instanced draw, with text on a 2D layer above it. It is used only when the browser offers WebGPU, a test scene reads back correctly, and the frames actually show; otherwise the page uses Canvas 2D, and a pill in the bar switches between them. `bench.html` times the language, the games, particles up to 100,000 on both renderers, and SQLite.
