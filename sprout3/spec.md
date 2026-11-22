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
79. **Speed roadmap (all four steps built: see 82, 95, 91 and 87).** In order: (1) columns: records of one shape stored as flat number arrays per field; (2) loop fusion: `collect`, `keep`, `fold` chains run as one loop with no in-between lists; (3) spork sends pure numeric cells to WebAssembly with SIMD or to the GPU; (4) seeded randomness for big runs, `noise [sample, id]`, so replay needs nothing recorded. JavaScript stays the backend; a LuaJIT backend is parked.
80. **Library-level choices are Claude's to make and record**, without asking first.
81. **Only `[ ]` is a template inside a string.** `"[g score] drops"` puts a value in; `( )` is plain text, so SQL (`values (?, ?)`) and CSS (`rgba(0,0,0,0.5)`) need no escapes. Write `\[` for a plain bracket. Replaces the `( )` half of decisions 5 and 6.
82. **Columns (built; Claude's call under decision 80).** A list of 32 or more records that share one shape and hold only numbers is stored as one number array per field. A cell with one named input gets a column version of its body when the body is one of three things: `s with [...]` where each new value is number math on `s`'s fields; a test made of number math and comparisons; or a host word given a cell of values, such as `circle [s x, s y, 2, "#fc6"]`. `collect`, `keep` and `each` use the column version on a list in columns, and `..` keeps two such lists in columns. Anything else falls back to the ordinary way, including a field that isn't there, a word in a record and an outside name that isn't a number. So a program can't tell the difference: parts, `@`, `length`, `=` and `str` all see ordinary records (decisions 22 and 39), and the tests run both ways. `random` and other recorded reads are never moved out of the loop, so replay stays exact. The particle fountain went from 1.45 to 0.28 ms a frame, and 10,000 records times 20 updates from 11 to 1.4 ms.
83. **A read right before `else` may miss quietly (built; Claude's call, fixing a listed rough edge).** In `p name else "anon"`, `else` is the program saying the field may be missing, so a miss on that one read gives `false` without a log (decision 28). Misses anywhere else, including deeper inside the left side, still log. The prelude's `s input else fresh-input` no longer logs on a game's first event.
84. **`match` and `cond` give a `false` answer instead of falling through (built; library, decision 80).** They were written with `[answer] else [try the next case]`, so an answer of `false` set off the `else` catch (decision 74) and the search carried on, against decision 35 ("gives the first matching result"). They now find the position of the first matching case (a number, never `false`) and then give that case's answer, whatever it is. Only the chosen answer is worked out, as before. Decision 74 itself is unchanged for user code.
85. **Typos get a suggestion (built; Claude's call).** An unknown word's note names the nearest name in scope or built-in, as in `"cuont" isn't a word Sprout knows yet (did you mean "count"?)`. A missing field's note names the nearest field of that cell: `doesn't know sped (did you mean speed?)`. "Nearest" means at most 1 edit for names of 4 letters or fewer, and 2 for longer ones. A swap of two neighbouring letters counts as 1 edit. When two names are equally near, there is no suggestion.
86. **Speed notes (built; Claude's call, the editor-side lint for slow paths).** The compiler notes, for every `collect`, `keep` and `each` given a cell literal, whether its body can run over columns (decision 82), and if not, why: for example "it calls near for each item", "it works with words, not numbers" or "the body has more than one step". `load` puts the notes on the file cell as `speed`, and a game exposes them as `game speed`. The page shows a thin bar in the code's gutter, green when a loop can run over columns and amber when it runs item by item, and lists every loop with its reason in the State tab. Running item by item is fine for short lists, so the notes are information, not warnings.
87. **`noise [sample, id]` (built; step 4 of decision 79).** It gives a number from 0 up to 1, always the same for the same two inputs: a 32-bit hash of both, whole and fractional parts. It is pure, so it isn't recorded for replay (decision 54) and can run inside a column loop (decision 82). `ace-schedule.sp` uses `noise [run, atom]` instead of `random`, so a graph and a seed always give the same Monte Carlo histogram, as ACE's theory asks (7.3).
88. **`fold` can run as a tight loop (built; Claude's call, from the benchmarks).** A fold block with two named inputs whose body is number math on them, as in `range n fold [0, [t x | t + (x * x)]]`, gets a loop version: one plain loop with no cell made per step. It is used when the list is `range n` or a list of numbers and the starting value is a number; anything else falls back to the ordinary way, so a program can't tell the difference, and the tests run both ways. Outside names that are numbers, `noise` (decision 87) and the math words all work inside it; a branch (`... [a] else [b]`) or a call to another cell does not yet. Speed notes (decision 86) cover `fold` too. Summing 100,000 numbers went from 0.81 to 0.15 ms.
89. **Host words can take their values one by one (built; library, decision 80).** A host word may offer a direct form that takes its values as separate arguments. When an `each` loop over columns (decision 82) calls `circle [s x, s y, 2, "#fc6"]`, it uses the direct form, so no argument cell is made per shape. The program is unchanged. Drawing 10,000 particles went from 0.63 to 0.36 ms a frame; at 100,000 the time is mostly the draw list itself, about 5 ms either way.
90. **The page has SQLite and WebGPU (built; Claude's call).** In the browser, `db` (decision 78) is SQLite compiled to WebAssembly (sql.js, MIT, in `vendor/sqljs`), with the same `query` and `run` as Node's `node:sqlite`. The database is kept in the browser (IndexedDB) and saved shortly after each write. The State tab lists its tables and can clear it. It is loaded only when a program uses `db`. The game view can draw with WebGPU: every shape in a frame goes to the GPU as one instanced draw, with text on a 2D layer above it. It is used only when the browser offers WebGPU, a test scene reads back correctly, and the frames actually show; otherwise the page uses Canvas 2D, and a pill in the bar switches between them. A frame WebGPU can't give a texture for (Safari, after the canvas is resized or while the page is hidden) is drawn with Canvas 2D; if WebGPU keeps failing, or the GPU is lost, the page uses Canvas 2D from then on and says so once. A JavaScript error is never shown as a line of the program: only Sprout's own errors point at a line. `bench.html` times the language, the games, particles up to 100,000 on both renderers, and SQLite.
91. **Spork works a pure cell out ahead, into one numeric kernel (built; implements decision 47 and step 3 of decision 79, Claude's call under decision 80).** `xs spork f` gives the same list as `xs collect f`. When `f` is written after `spork` or bound to a name that `spork` is given, the compiler works it out once, when the program loads, as far as it can without its input. Calls are inlined, including recursion that ends without the input. Lists, records, words and `range`, `collect`, `keep`, `fold`, `first` and `@` on them are unrolled. A test that changes from run to run becomes a choice made in each run, with both sides worked out. A position in a list that changes from run to run becomes a check: it must be a whole number inside the list, or the spork runs the ordinary way. What is left is number math on the input, `noise` included. It runs as one loop over `range n` or a list of numbers, on WebAssembly SIMD (two runs per instruction, in 64-bit floats) or else in JavaScript. Both give the same bits, so a program can't tell which way it ran, and the tests check it. Each run may give a number, true or false, or a record of numbers (kept as columns, decision 82). Anything spork can't work out ahead means `collect`, and the speed notes (decision 86) say why: `random`, a host word, text made from a value that changes, `keep` with a test that changes from run to run, recursion that depends on the input. `%`, `sin`, `cos`, `tan` and `log` keep a kernel in JavaScript, since WebAssembly has no exact match for them. Spork over an effectful cell, which reports back as events (decision 47), is not built yet. `ace-schedule.sp`'s Monte Carlo run (string ids, a walk over `requires`, triangle draws and a shared risk) becomes 155 steps: 100,000 runs take about 9 ms instead of 1.9 s.
92. **`sort` is a method (built; library, decision 80).** `xs sort` gives numbers from least to most (in the same order as JavaScript's own number sort, so -0 comes before 0 and NaN last), or words in order. Numbers are sorted by radix, about 50 ms for a million. A list of numbers from `spork` or `sort` is kept as one array of numbers, the way columns are (decision 82); to a program it is the same list. `rs collect [r | r f]` over columns gives that column straight away. A program that binds its own `sort` still uses its own, as `ace-schedule.sp` does.
93. **Big sporks can run on the GPU (built; Claude's call, from the request to use WebGPU for Monte Carlo work).** The same kernel (decision 91) becomes a WebGPU compute shader, one run per GPU thread. The GPU does 32-bit math, so its answers can differ from SIMD and JavaScript in the last digits. A risk roll that lands right at its chance can even come out the other way, about one run in a few million. So the GPU is a host choice, not the default everywhere. The page uses it for sporks of 100,000 runs or more in a program that prints, while WebGPU works, and the State tab can turn it off. Games always use SIMD. A GPU answer arrives later, but Sprout runs straight through, so the page runs a program in passes. A spork the GPU hasn't answered stops the pass and starts the job, and when it's done the program runs again from the start and finds the answer waiting. What the stopped pass printed is dropped. A program that uses `db` doesn't wait, since its writes would happen twice. Answers are kept for the same kernel, inputs and outside numbers, so editing the rest of a program doesn't run the million runs again. Node and pages without WebGPU use SIMD. A program doesn't ask for exact answers itself (Troy, 20 Nov): the host decides.
94. **Every control structure is a library cell (Troy, 20 Nov).** Choosing, looping and gathering are cells and methods, not syntax. A boolean sent a cell runs it (decision 62), and `else`, `and` and `or` are prototype methods. `match`, `cond`, `take`, `every`, `wave` and `frame` are Sprout cells in the prelude. `collect`, `keep`, `fold`, `each`, `times`, `spork` and `sort` are methods, and `range` is a host cell. The compiler's inline branches, column loops and spork kernels are fast paths that give the same answers as those cells, and the tests check it. They are never a different meaning.
95. **Loop fusion (built; step 2 of decision 79, Claude's call under decision 80).** A run of `collect`, `keep` and `fold` steps in one chain is also compiled as one loop with no lists in between. Each step is given a cell or a name bound to one, and the run may end in `length`. It is worked out ahead the way spork works a cell out (decision 91), so calls are inlined and tests that change from item to item become choices made per item. It runs over `range`, a list of numbers, or a list of records of numbers in columns (decision 82). A record's fields are read straight from the columns, and `with` lays new values over them. `keep ... length` counts without making a list, and `fold` carries its number from item to item. Every value is worked out in the same order, by the same steps, as the steps one by one, so the answers are the same bits, and the tests run every case both ways. A list shorter than 16, anything that isn't numbers, and anything the loop can't do (words, a position outside a list) run the steps as written. The speed notes show one note for the run. Counting a million numbers below a line with `keep ... length` takes 8 ms instead of 18. Keeping 100,000 records and laying two new fields over them takes 4.6 ms instead of 39.
96. **The core and its libraries (built; Claude's call under decision 80, from Troy's ask on 20 Nov to simplify the core and move more to libraries).** `sprout3.js` is the core: tokens, parser, compiler, runtime, prototypes, the host cells `range`, `rand`, `noise` and `print`, and the prelude. It runs every program on its own. Faster ways live in libraries that plug into four hooks: a faster form of a cell, a run of steps in a chain, speed notes, and a look over the whole program first. A library can't change an answer. `kernels.js` holds the work-ahead pass, loop fusion, spork's kernels on WebAssembly SIMD and in JavaScript, and the radix sort; `gpu-spork.js` adds the GPU. The column loops of decisions 82, 88 and 89 are gone, because loop fusion does their work: a single `collect`, `keep`, `fold` or `each` is a run of one step. So there is one way of working a loop out ahead instead of two. A fused run can now end with `each` and host words, as in `each [s | circle [s x, s y, 2, "#fc6"]]`, and each host word is called for every item that passes, in order, under the tests that lead to it. Every example prints and plays the same with and without `kernels.js` (`SPROUT3_CORE_ONLY=1` leaves it out). The core went from 2,028 lines to about 1,050. Compiling every example takes about 200 ms instead of 420, and the test files run in 0.75 and 1.8 s instead of 1.0 and 3.0. Two fixes came with the move. A failed try at working out an outside name now leaves nothing behind (it could leave outside reads that stopped a fused loop from ever running, as in `fireflies.sp`). Outside names, and fused loops, now get small step budgets, so a program like `ace-schedule.sp` no longer takes 235 ms to compile.
97. **Plain math lives in the prelude (built; library, decision 80).** `clamp`, `toward` and `dist` are now Sprout cells in the prelude, not JavaScript. `dist` is `(dx * dx + (dy * dy)) sqrt`, which can differ from the old `Math.hypot` in the last digit. `rand` stays in the core, since it reads the recorded random source, like `random`. The work-ahead pass inlines prelude cells like any other, so `clamp`, `toward`, `dist`, `cond` and `match` run inside fused loops and spork kernels. Math on a choice between constants is done on each constant, so `cond`'s chosen position, and the answer it picks, become a choice made per item. A host word gives what it gives when it runs: false, or `print`'s value. So a branch that ends with one before `else` runs the else too (decision 74), in a fused loop as well, and the decision 74 lint now names that case.
98. **Descriptive names (Troy, 20 Nov).** The implementation uses whole words for names, as Sprout programs do. In `sprout3.js`, `kernels.js` and `gpu-spork.js` that means `ValueCell`, `RangeCell`, `ColumnCell`, `NumberList`, `sendWord`, `makeCell`, `CodeGen` and `WorkAhead`, not `VCell`, `RCell`, `SW`, `MK`, `Gen` or `Spk`. A kernel's steps are called `constant`, `input`, `outside`, `carried`, `column` and `choose`, and the syntax tree's fields are `type`, `value` and `name`. The prelude's inputs are named the same way, as in `clamp : [value low high | ...]` and `match : [value cases | ...]`. The public API has `format`, `equal`, `globals` and `fastPaths`, not `fmt`, `eq`, `G` and `columns`. Only loop counters (`i`, `j`), coordinates (`x`, `y`) and `n` for a count stay short. The renaming changed no behaviour: every test passes and every example gives the same output, with and without `kernels.js`.
99. **The standard words (built; library, decision 80, from Troy's ask on 20 Nov to make Sprout better than Clojure at Clojure and Lua at Lua).** `words.js` adds methods to the core's prototypes through a new `methods` hook, and is always loaded after `sprout3.js`. Lists get Clojure's sequence words: `reverse`, `distinct`, `sum`, `product`, `mean`, `largest`, `smallest`, `flatten`, `second`, `rest`, `all-but-last`, `take`, `drop`, `take-while`, `drop-while`, `find`, `index-of`, `has`, `any`, `all`, `count`, `sort-by`, `largest-by`, `smallest-by`, `group-by`, `frequencies`, `partition`, `chunks`, `windows`, `zip`, `numbered`, `interpose`, `collect-flat`, `scan` and `join`. Records get `keys`, `values`, `pairs`, `select`, `without`, `update`, `get-in`, `set-in` and `update-in`, each giving a new record. Text gets Lua's string words: `split`, `lines`, `words`, `chars`, `trim`, `starts-with`, `ends-with`, `has`, `index-of`, `slice` (positions from 1, negative ones from the end, as in Lua's `sub`), `repeat`, `reverse`, `number`, `code`, `pad-left`, `pad-right` and `capitalize`. Numbers get `pow`, `exp`, `atan`, `sign`, `even`, `odd`, `between`, `to` (`1 to 5` is `[1, 2, 3, 4, 5]`), and (decision 109) `pad-left`, `pad-right` and `clock`. Every value answers `kind`. **Endless lists** are Clojure's lazy sequences: `iterate [start, step]`, `cycle xs` and `forever v` make lists whose items are worked out only when read, and kept. `collect`, `keep`, `drop`, `zip` and `partition` on one give another endless list, `take`, `take-while`, `find` and `@` read only as far as they need, and `length`, `fold`, `each` and `sort` log that they would never finish. A fused loop leaves an endless list to these methods. A field still wins over a method of the same name, so records that have a `count` or `keys` field read their own. Every example prints and plays the same as before (checked over 300 frames of each).
100. **Rebol's literals (Troy, 20 Nov).** Values that are more than numbers and text are written as they are, with no quotes and no constructor: a date `2026-11-20`, a time `9:30` or `9:30:15`, money `$19.99`, a pair `640x480`, a url `https://taskiap.com/sprout3/`, an email `ada@example.com`, a colour `#ff8800` (or `#f80`, or `#ff880080` with alpha), a percent `15%` (the number 0.15) and a word `'move`. The lexer tries them where a word could start, and each must end where a word would, so `2026 - 11` is still a subtraction and `don't` is still a name. Each kind does the math that makes sense for it. A date plus a number is that many days later, and two dates take away to the days between. Dates answer `year`, `month`, `day`, `weekday`, `add-months`, `add-workdays` and `is-weekend`, and are kept as days in UTC, so they never shift with a time zone. Times add and compare, and answer `hour`, `minute` and `in-hours`. Money is whole cents, so `$0.10 + $0.20 = $0.30` is true; `*` and `/` by a number round to the cent, halves to even, and `split 3` shares out every cent. Pairs do math part by part and answer `x`, `y`, `length` and `area`. A url answers `host`, `path` and `query`, and `/` adds a step to its path. A colour answers `red`, `green`, `blue`, `mix`, `lighter`, `darker` and `fade`, and draws as its text. A word is equal only to the same word, which is what dialects and code as data are made of. The kinds live in `words.js`. A literal is made once, when the program loads. `date [2026, 11, 20]`, `money 12.5`, `pair [3, 4]`, `colour [255, 136, 0]` and `word "move"` make the same values from parts, and a date that isn't real (`2026-02-30`) is logged.
101. **Destructuring (Troy, 20 Nov).** A pattern in square brackets unpacks a value, wherever a name could take one. As an input, `[[x, y] | x + y]` takes one value and names its parts, and a cell can take several, as in `[[x1, y1] [x2, y2] | ...]` or `fold [0, [total [x, y] | ...]]`. As a binding, `[x, y] : point` names the parts of a value in a cell or a group. Each name reads the field of that name if the value has one, else the part at its position, so `[name, age]` unpacks `[name : "Ada", age : 36]` and `["Ada", 36]` alike. A kind from decision 100 unpacks the same way: by its fields (`x`, `y`, `year`), else by its parts in order, so `[w, h] : 640x480` and `[y, m, d] : 2026-11-20` work. A name can have a default, `[name, age : 0]`, used when the part is false or missing. A pattern can hold a pattern, `[a, [b, c]]`, and `..rest` takes the parts left over as a list, `[first, ..others]`. Unpacked names are local names, not fields: `[[x, y] : [10, 20], sum : x + y]` has the one field `sum`. A cell that unpacks is never worked out ahead into a kernel; it runs as written.
102. **Code as data (Troy, 20 Nov).** `quote [move 10, turn 90]` gives the code in the brackets as a value instead of running it, so a program can read, build and change code, as in Rebol and Clojure. The value is a block: a list of its items. An item of one term is that term's value (a number, text, a literal, or a word such as `'move`), an item of several terms is a phrase (a list of its terms), `x : 5` is a binding (`name` and `value`), `( )` is a group, and a block with inputs answers `inputs`. Each has a `kind`, every list word works on them, and they print as the code they came from: `quote [move 10, turn 90]` prints `[move 10, turn 90]`. `quote` works anywhere a value can go (`eval quote [1 + 2]`, `a = quote [x]`), unless a program names something `quote` itself. Every cell gives its own code: `[n | n * 2] code` is the block `[n | n * 2]`. `eval` runs code: a block that takes no input runs as a program and gives its last value, a block with inputs gives back a cell, text runs as the code it holds, and any value turns into code with `source` (the text that makes it). `eval` runs at the top level, so it sees host words and the prelude but not a program's own names. `eval-with [names, code]` hands it some, as fields of a record. `phrase [items]` builds a phrase, as in `eval-with [[double : double], phrase ['double, 21]]`. A compiled program is kept for the next eval of the same code. A dialect is a cell that walks a block: `program fold [start, [state [command, amount] | match [command, ['move, ..., 'turn, ...]]]]` runs a turtle program written as data.
103. **parse (built; library, decision 80, from Troy's ask on 20 Nov to make Sprout better than Rebol at Rebol).** `parse.js` brings Rebol's parse dialect, and its rules are ordinary Sprout values, not a language inside strings. Text is a rule that matches itself, a list of rules matches each in turn, a cell with one input tests one character or item, and any other value (a word like `'move`, a number, a date) matches an item equal to it. The rule words are `some`, `maybe`, `maybe-some`, `repeat [n, rule]` and `repeat [least, most, rule]`, `one-of [rules]` (tried in order) and `one-of "abc"`, `none-of`, `to`, `thru`, `ahead`, `not-ahead`, `into` (one item that is a list, parsed all through) and `of-kind`, with `digit`, `letter`, `upper-letter`, `lower-letter`, `letter-or-digit`, `space`, `any-char`, `end`, `a-number`, `a-text` and `a-word`. Matching is PEG: a choice takes the first rule that matches, a repeat takes all it can, and nothing is tried again, so a rule's meaning is what it says. `rule as "name"` keeps what it matched, `rule as ["name", [t | t number]]` keeps what a cell makes of it, and `rule all-as "name"` keeps every match in a list. `text parse rule` gives true, or a record of what was kept, when the rule matches all of the text, and false when it doesn't. `find-all` gives every match, and `replace-all [rule, new]` replaces each, with text or with what a cell makes of the match. Lists parse the same way, item by item, so a block of quoted code (decision 102) is parsed like text, and a dialect is checked by a rule: `quote [move 10, turn 90] parse some one-of [into ['move, a-number], into ['turn, a-number]]`. Rule words given a rule word wait for the rule, so `some one-of [...]` reads as Rebol would read it. Names are still bound before use (decision 25), so a grammar that refers back to itself is one cell that names itself, with the rules it needs as its fields: `expr : [factor : one-of [some digit, ["(", expr, ")"]], ..., term, maybe-some [one-of "+-", term]]`. To make that work, a cell that mentions its own name is always lazy, even when it is a short list of values (`digits : [digit, maybe digits]`).
104. **Scripts: coroutines that stay values (Troy, 20 Nov).** `script [| ... yield 1 ... x : yield 2 ...]` is a script, Lua's coroutine done Sprout's way. `s resume v` runs it on to its next `yield` and gives a new script whose `value` is what was yielded (or, once it finishes, what it gave back) and whose `done` says whether it has finished. `yield` gives back the value sent by the next resume, a script's input is the first value sent, and `s next` resumes with false. Unlike a Lua coroutine, a script never changes: `s` is the same after `s resume v`, so a game keeps its script in its state and rewinds, replays, saves and compares it like any other value. A resume works by running the cell again from the start with every value sent so far, so the code must be pure, as all Sprout code is. The steps already taken don't have their effects again (a `print` or a `beep` happens once), and `random` and `rand` give them the numbers they had the first time, so the run is the same run. A new step's random numbers are new, as anywhere. Running again costs time that grows with the steps taken; a game script of a few hundred steps resumes in microseconds. `take n` and `yields` give the values a script yields (a generator), and `wait seconds`, written in Sprout in `words.js`, waits inside a game script that is resumed with each frame's `dt`. A cell written with a bar and no inputs, `[| ...]`, is code: it runs when it is run, never when it is made, even when its parts look like simple values. An input named `left` is now linted, since `left` means a method's receiver.
105. **The standard library (built; library, decision 80, from Troy's ask on 21 Nov).** Ten modules, each a global cell whose fields are its words, in every program: `ease` (easing curves, `progress`, `between`), `vec` (vectors as pairs: `size`, `unit`, `angle`, `rotate`, `dot`, `distance`, `mix`, `limit`, `reflect`), `stats` (`mean`, `median`, `mode`, `variance`, `spread`, `percentile`, `histogram`, `correlation`, `summary`), `grid` (lists of rows: `make`, `at`, `put`, `beside`, `around`, `count-around`, `cells`, `map`, `region`, `fill`, and `path`, the shortest way through), `seeded` (repeatable random choices from `noise`: `between`, `whole`, `chance`, `pick`, `shuffle`, `bell`, `in-circle`, `weighted`), `format` (`commas`, `places`, `percent`, `ordinal`, `plural`, `clock`, `wrap`, `centre`, `title`, `bar`), `shape` (points as pairs: `circle`, `polygon`, `star`, `box`, `edges`, `move`, `turn`, `grow`, `area`, `centre`, `bounds`, `holds`), `palette` (`hsl`, `along`, `wheel`, `grey`, and the sets `warm`, `cool`, `soft`), `csv` (`read`, `write`) and `json` (`read`, `write`, `pretty`). All but `json` are written in Sprout, one file each in `lib/`, so the library is also a set of worked examples; `json` is JavaScript in `words.js`. `node make-stdlib.js` turns `lib/*.sp` into `stdlib.js`, which Node and the pages load after `parse.js`, and writes `library.html`, the reference: each word's comment, its inputs, and its `-- e.g.` example run with the answer it gave. A module is compiled the first time a program uses it. Nothing in the library draws, since host words belong to each game; `shape edges` gives the sides for a program's own `each [[a, b] | line ...]`. A program's own names come first, so a program that binds `grid` or `format` keeps its own. Three words joined the built-in ones to make the modules short: `find-index`, `distinct-by` and `has-field` on lists and records, and `atan2` and `fixed` on numbers. The tests check that `stdlib.js` matches `lib/` and that every example runs without a message.
106. **Wrapped libraries (built; library, decision 80, from Troy's ask on 21 Nov).** Eight popular JavaScript libraries are modules like the standard library's: `chroma` (chroma.js: colour scales, ColorBrewer palettes, contrast, Lab mixing, named colours, temperature), `simplex` (simplex-noise: smooth, seeded noise in 2D, 3D and fractal layers), `mathjs` (math.js: expressions with units, conversions, exact fractions, matrices, linear equations, derivatives, simplifying), `date-fns` (formatting with patterns, distances in words, parsing, weeks and months), `fuse` (Fuse.js: fuzzy search over text or records), `nlp` (compromise: nouns, verbs, people, places, sentences, plurals, tenses, numbers in words), `tone` (Tone.js: notes, chords and drums, as effects like `beep`; in the browser only) and `turf` (Turf: distances, bearings, areas and points along routes on the Earth). `libs.js` holds them all. Each library's file is kept in `vendor/` with its licence and served from the site, never from another server, and loaded only when a program names it: the page finds the names in the code and loads those first, showing "Loading chroma.js…", and Node runs the same files. Values cross over both ways: lists and arrays, records and objects, Sprout colours and hex text, Sprout dates and JavaScript dates. A library word that fails logs its message and gives false, like any other word. `library.html` lists every word with an example and the answer it gave. Decision 73 is refined: a field that has the same name as a global (a host word, a library module, `format` or `noise`) is read without a lint, since a module's words would clash with globals all the time; a field that has the same name as one the program binds still lints. `examples/terrain.sp` flies over a map made with `simplex fractal` and coloured with `chroma steps`.
107. **Two players, no server (Troy, 21 Nov).** Two phones play one game, connected straight to each other with WebRTC; the details each needs to reach the other travel as links sent by text message. One player taps Two players and sends the invite (it carries the game's code); the friend opens it, taps Join and sends back the reply; tapping the reply in another tab hands it to the game's tab, or it can be pasted. A public STUN server helps the phones find each other across the internet; on the same Wi-Fi nothing else is needed, and networks that block direct connections can't be used. The game runs in lockstep: each phone sends only its touches and keys for the frame four ahead, both run the same frames with the same seeded random numbers, and a frame waits until both inputs are there. Every 120 frames they compare a fingerprint of the state, and if it differs (floating point can differ between browsers), the inviter's state is sent across exactly and both carry on from it. Code edits travel too, and both phones swap them in on the same frame, so two people can live-code one game. In the language: an event from player 2 carries `player : 2` and changes `input2`; the tick of a game for two carries player 2's held keys, so `game input2` is there only when two play (`game has-field "input2"`); and the host word `me` is which player this screen shows (1 alone), for draw to show each player at the bottom. Reading `me` in update would make the two games differ. Each game now sets its own random source at every tick, so a page making other games (cover art) can't take its random numbers. `examples/volley.sp` is the first game for two.
108. **3D words (Troy, 21 Nov).** A game can draw in 3D with six more drawing words, and the 2D words go on top, for what sits on the screen: `view [x, y, z, yaw, pitch, fov]` is the camera, `block [x, y, z, sx, sy, sz, material]` a box with a texture name or a colour, `model [name, x, y, z, yaw, height, animation, time]` a glTF model, `hold [name, x, y, z, yaw, pitch, size]` a model held in front of the camera, `flash [x, y, z, radius, colour]` a light with a glow, and `fog [colour, near, far]`. Angles are Sprout's: 0 looks along +x and they turn towards +z, so a game's own `atan2` points a model the way it walks. As with 2D, the list is the whole scene each frame, and `three-view.js` (three.js) keeps the objects from frame to frame and only moves them. Models are scaled to the height asked for and stood on the floor whatever size they were made at; one held is measured by its longest side. An animation is posed from the time the game gives, never from the page's clock, so rewinding, replaying and two-player lockstep pose every model the same; Death and the like stop at their last frame. The page loads three.js the first time a draw list holds a 3D word. The effect word `sound "name"` plays a short sound from `vendor/sfx`. The models, textures and sounds are CC0, by Quaternius, Kenney and Screaming Brain Studios, credited in `vendor/models/README.md`. `examples/silvereye.sp` (SilverEye, also on its own page, `/silvereye/`) is SilverEye 2D with the same Sprout game code, programmable turrets and a new draw.

109. **Words for a game's screen, and a highlighter that asks Sprout (Claude, 21 Nov; library and host, no change to the language).** Numbers get `pad-left` and `pad-right` (as text has: `5 pad-left [2, "0"]` is `"05"`) and `clock` (`75.4 clock` is `"1:15"`, minutes and seconds, for a game's timer). `Sprout3.knownWords()` gives every word Sprout knows at that moment, the globals and every kind's methods, and `highlight.js` (shared by the editor and SilverEye's program sheet) colours those when it isn't handed its own list. A game's `held` record may carry numbers as well as `true`: the POCKET64 page sends a stick's tilt as `walk` and `strafe`, and how far you've dragged to look as `look`, and `net.js` carries those numbers across the link (`[name, value]` pairs; plain names still mean `true`). Wanted on the way and not built, since it would change the language: a `"` inside a text insert (`"[cond [a, \"x\", any, \"y\"]]"`), which the tokenizer reads as the end of the text; for now such a choice is worked out on its own line first.

110. **Light, sky and things in hand (Claude, 21–22 Nov; host words, no change to the language).** Four more 3D words and two map characters, all in `three-view.js`, so a game can be lit and open to the sky. `light [sky, ground, key, strength]` sets each frame's light: a hemisphere light from the sky colour above to the ground colour below, a key light in the third colour, and a strength (1 is ordinary); without it the defaults come back, so SilverEye sets one per mission and turns it red while the alarm is up. `sky [top, horizon]` draws a gradient behind everything instead of the fog's flat colour. A block's material written `glow:#rrggbb` is lit from within (lamps, screens), whatever the light. `model` takes a ninth argument, the name of a model to carry in the character's right hand (`model ["adventurer", x, 0, z, angle, 1.8, "Walk", time, "blaster_g"]`), found on its hand bone and scaled to the hand; `false` carries nothing. `hold` models, the gun in your hands, are drawn in a scene of their own with a fixed 62-degree camera and the same lights, so they sit the same however wide the view is, and a flash close in front of the camera lights them too. Map text in SilverEye gained `,` (ground out under the sky, with no ceiling over it) and `D` (a door that slides up when anyone comes near); these belong to the game, not to Sprout. Live3's draw list counts the arguments of each word (`light` 4, `sky` 2, `model` 9). `beam [x1, y1, z1, x2, y2, z2, colour]` draws a thin streak lit from within between two points, for a shot's tracer, and a flash coloured `smoke:#rrggbb` is a see-through puff that gives off no light. makeView takes `soft` and `setSoft` switches every texture between sharp (each texel a hard square) and soft (cut to 64 by 64 and filtered smoothly). The 2D word `text` takes an optional sixth value, `"left"` or `"right"`, which pins that edge of the text at x instead of its middle, so a column of lines lines up whatever their letters.

111. **A library distilled from the games (Claude, 22 Nov; library, decisions 80 and 105, from Troy's ask to look at all the TaskIAP games and distil a library of beautiful Sprout cells).** A survey of the 319 TaskIAP apps (the 27 in this repository's folders and the 292 in 2026experiments) counted what they keep writing again: progress saved (118), things eased about (112), tiles and grids (96), cards (96), dice (66), days and nights (59), hit points (57), gravity (57), screen shake (55), matching and merging (53), leagues and schedules (48), idle earnings (45), streaks (42) and more. Sixteen new standard-library modules write those once, in Sprout, each word small, with a comment, an example whose answer the library page shows, and a checked answer in test.js: `motion` (tween, approach, glide, shake, calm, bob, pulse, fall, bounce, drag, jump-speed), `collide` (boxes, circles, in-box, in-circle, circle-box, wrap-around), `cards` (suits, deck, shuffled, deal, faces, name, red, blackjack, poker), `dice` (rolls, roll "2d6+3", odds, at-least, advantage), `combat` (damage through armour, strike, health, hits-to-down, xp-for, level-of, level-progress, ready, cooling, over-time, turn-order), `idle` (price, price-of-many, how-many, away, prestige, wander, short), `league` (rounds by the circle method, table, chance, rate, bracket), `wordplay` (marks, as DECAWORDLE marks a guess, anagram, scramble, hide, solved, vowels), `rewards` (streak-points, day-streak, stars, grade, top, earned, restore), `story` (open, go, flag, typed, typed-all), `daytime` (hour, part, light, sky, season, weekday, stage, ripe), `hex` (around, steps, within, to-screen, snap, from-screen), `particles` (burst, step, fade), `camera` (follow, keep-in, on-screen), `waves` (size, toughness, gap, boss, spawn-point) and `tiles` (runs, fall, slide, turn, ray, sees, seen). Two names were changed on the way: `days` and `progress` are common field names, and a global module of either name kept a loop that reads such a field (ace-schedule's) off the SIMD path, so they are `daytime` and `rewards`. Randomness always comes from a seed, through `seeded`, so a replay and a second phone get the same luck.

112. **One library, one way of working (Claude, 22 Nov; library, decisions 105 and 111, from Troy's ask to redo the Sprout standard library; no change to the language).** The nine modules of decision 105 and the sixteen of decision 111 were written at different times and read like it: a point was `[x, y]` in one, `x, y` as two inputs in another and `[x : 0, y : 0]` in a third, and the time came first in some words and last in others. They are one library now, 24 modules in Sprout and `json`, 201 words, held to one way of working. A point, a size, a cell of a grid and a hex are pairs, like `3x4`: `grid make [3x2, 0]`, `grid at [g, 2x1]`, `grid cells g` gives `[cell, value]` pairs, `hex from-screen [26x15, 10]`, a box is `[at, size]` and a circle `[at, r]` in `collide`, a camera is the pair at the middle of the screen (`camera keep-in [cam, screen, world]`, `on-screen`, and a new `to-world`), a body in `motion` is `[at, speed]`, and `waves spawn-point` gives a pair; `motion tween` and `motion glide` take numbers or points alike. A word's inputs come in one order: what it works on, then how, then the time or the seed, last: `combat ready [last, every, now]`, `daytime hour [day-length, start-hour, now]`, `story typed [text, per-second, elapsed]`, `economy away [per-second, cap-hours, seconds]`, `rewards day-streak [streak, last-day, today]`, `motion progress [length, elapsed]`, `particles burst [from, n, speed, life, colours, now, seed]`. Chance comes only from a seed, through `seeded`. Modules that overlapped were merged: `tiles` into `grid` (runs, fall, slide, turn, ray, sees and seen take cells as pairs), `idle` into `economy`, its `short` into `format`, and `ease progress` and `ease between` into `motion` (`motion progress`, `motion tween`), so `ease` is only curves. `daytime ripe` is `grown`; `vec` gained `round` and `toward`. Every example states its answer, `-- e.g. grid size [[1, 2, 3], [4, 5, 6]] → 3x2` (a line break in a text shows as `\n`): `make-stdlib.js` runs each one and fails if the answer differs or is missing, and test.js checks the same, along with the order of inputs over every word (an input named `dt`, `now`, `elapsed`, `today` or `seed` comes after the rest, and a seed is last) and that nothing in `lib/` calls `rand`. The library page is grouped by what you're making (words and numbers, time and motion, space, chance, play, colour), with the conventions set out at the top. Nothing outside `lib/` used the changed words, so no program needed changing.

113. **SPROUT·8, an 8-bit console page, and Sprig (Claude, 22 Nov; host, library and a game, from Troy's ask for a loop of new games in the style of the Sega Master System, using outside libraries and the code already made; no change to the language).** `eight.js` is a console any Sprout game can run on: `Eight.start({ game: "examples/x.sp" })` gives a 256x192 screen whose colours are snapped to 64 (red, green and blue each at one of four levels), an 8x8 pixel font (Press Start 2P, by CodeMan38, under the SIL Open Font License, in `vendor/fonts`), square waves, a triangle bass and hiss for noise, and a D-pad with buttons 1 and 2 from the keys (arrows or WASD, Z and X), the touch screen or a controller, with pause, sound and a full screen. The game layer gained two drawing words and a sound: `sprite [art, x, y, ink, flip]` draws pixel art written as rows of letters, each letter coloured by an ink record (`.` is clear), and `tiles [map, set, ink, x, y]` draws a whole level written as rows of characters from a set of [character, art] pairs; the page draws each picture once and keeps it, so a scrolling level costs one image a frame. `hiss [length, pitch]` is the noise channel beside `beep` (it couldn't be `noise`, which is the smooth random function, and host words share the globals). A state may name a `song`, which the page plays from the program's `songs` record (bpm, beats, lead, harmony, bass and drums, and once for a jingle), and a `keep` record, which the page saves on the phone and hands back as `saved` when the game next loads. The page runs one frame before drawing the first, since the state has its clock only once update has run. ZzFX (the Zuper Zmall Zound Zynth, by Frank Force, MIT) is the ninth wrapped library: `zzfx preset "jump"` plays one of ten ready-made sounds (coin, jump, hit, hurt, explode, power, laser, blip, select, step), `[name, pitch]` plays it higher or lower, and `zzfx play` takes ZzFX's own numbers; its micro build is in `vendor/zzfx`, with two lines that hand its names to the window. The library gained `tilemap` (char-at, to-cell, to-pixel, size-of, find, clear, solid, touches, `move`, which carries a body through a map without passing into walls and onto one-way platforms only from above, and drop-ahead) and `music track`, which reads a line of notes written as text (`"C4 - E4 . | kick"`, a word a step) into [beat, note, beats]. Sprig (`examples/sprig.sp`, on its own page at `/sprig/`) is the first game: a seedling crossing three gardens (a meadow, root caves, a thorn garden at dusk) to the flower at the end of each, stomping grubs, spitting seeds at bees and hopping caps, gathering dew (a hundred is a life) and three sun seeds hidden in each garden, with a checkpoint flag, hearts and lives; its art, levels and four songs and two jingles are all written in the program, and it uses tilemap, music, motion, flipbook, camera, collide, particles and ease. A bot that reads the map clears the first garden in game-tests.js, and clears all three when left to play.

114. **Each game keeps its own Sprout (Claude, 22 Nov; host, from Troy's ask that every game have its own version of Sprout so that updates don't break it).** A published game no longer runs on `/sprout3/`. `node sprout3/freeze.js <game>` copies the runtime as it is that day (sprout3.js, words.js, parse.js, stdlib.js, libs.js, kernels.js, live3.js, eight.js), the pixel font, the wrapped libraries its program names and the program itself (as `game.sp`) into the game's own folder, `/<game>/sprout/`, with a `VERSION` naming the commit it came from, and writes the game's page and manifest with its base set to that folder. `sprout3/games.json` lists the published games with their titles and descriptions. Sprout can then change as it likes: a game changes only when it is frozen again, on purpose. `frozen-tests.js` loads each game in a Node of its own from its own folder and plays it for twenty seconds, and it runs before every push. Sprig was frozen first. Comet Lance (`examples/comet-lance.sp`, at `/comet-lance/`) is the second game on SPROUT·8: a vertical shooter in which the Lance flies up through the comet belt against waves of drones (which weave and fire), darters (which dive at you) and spinners (which circle down), with a boss every fifth wave that fires a spread, P capsules that widen the shot to two and then three, a scrolling starfield and a song each for the title, the waves and the boss. It uses waves (size, toughness, boss), seeded, particles, collide, music track and ZzFX, and `vec` gained `aim` (the velocity that heads from one point to another) and `fan` (copies of a velocity spread across an angle), which it uses for the shots aimed at you.

115. **Lantern Keep (Claude, 22 Nov; a game and library, no change to the language).** The third SPROUT·8 game (`examples/lantern-keep.sp`, at `/lantern-keep/`, on its own frozen Sprout): Wick the lamplighter lights every lantern on three floors of a dark keep, where only what is near Wick or near a lit lantern can be seen, while shadow wisps hunt him; lighting the last one opens the gate to the floor above, and an oil flare turns the wisps blue for six seconds so he can banish them (each is gone for three seconds, then comes back from where it started). A wisp waits two seconds at the start of each life, and at each crossing it chases two times in three and wanders the other time, so a lamplighter can always slip away. `grid` gained `next-step` (the next cell on the shortest way to a cell, for a chaser) and `away-step` (the open neighbour farthest from a threat, for something fleeing). A walker that heads for the nearest unlit lantern and steers round the wisps clears the first floor in game-tests.js.

116. **Crate Cove, and undo (Claude, 22 Nov; a game and a library module, no change to the language).** The fourth SPROUT·8 game (`examples/crate-cove.sp`, at `/crate-cove/`, on its own frozen Sprout) is a pushing puzzle: Pinch the hermit crab pushes driftwood onto the tide marks of six coves, never pulling, one piece at a time; button 1 takes a move back and button 2 starts the cove again, and the fewest moves for each cove are kept on the phone. Every cove was checked to be solvable by a breadth-first search over the crab and the driftwood, which also found the fewest moves (2, 5, 18, 19, 21 and 20), and game-tests.js plays each of those shortest solutions in the game itself and checks that it solves its cove, move for move. The library gained `undo`: `push` (a history with a state put on top, keeping at most so many), `peek`, `pop`, `can` and `back` (one step back from the state now, as [state, history], the state kept when there's nothing to go back to). Two traps met on the way, both in the language as it stands: a record's earlier fields are names for its later ones, so a field named rows hid the rows the record was made from; and else takes code, so `x else [0, 0, 0]` gives 0, the last value, and a list needs `else [[0, 0, 0]]`.

117. **No zooming on a double tap (Claude, 22 Nov; host, from Troy's report that iOS zooms in on a double tap).** iOS Safari ignores user-scalable=no, and calling preventDefault on pointer events doesn't stop its own gestures, so a quick double tap on the console (or a pinch) zoomed the page. The SPROUT·8 page and SilverEye's page now set touch-action on every element (none on SPROUT·8, manipulation on SilverEye, whose briefing still scrolls), cancel the second tap of a double tap and every pinch (Safari's gesture events) in script, leaving text boxes such as SilverEye's program editor alone, and say maximum-scale=1, which also keeps iOS from zooming into a text box. The four SPROUT·8 games were frozen again to take the fix, the first deliberate update of decision 114.

118. **Each game a handheld of its own, and a local web app (Claude, 22 Nov; host, from Troy's asks that each game have its own branded handheld like a Game Boy, and that local web apps fix the zooming).** SPROUT·8 is now drawn as a portrait handheld: a body with the big rounded corner at the bottom right, the screen in a dark bezel with two coloured lines, a tagline and a power light, a maker's plate with the game's name and its hero drawn from the game's own sprite art, a D-pad, buttons 1 and 2 set at an angle, two pill buttons (sound and pause) and a speaker grille; on a phone it fills the screen, and on a phone turned on its side the screen sits between the D-pad and the buttons. Every part of the look comes from a skin, which `games.json` gives each game: the colours of the body, the bezel, its lines, the buttons, the D-pad and the page, the brand name, its tagline and its font, and which sprite is the mascot. Each game has its own original brand and font, all under the SIL Open Font License and kept in `vendor/fonts`: Sprig Pocket Garden in leaf green with sunflower buttons (Fredoka), Comet Lance Orbiter in deep-space blue with comet stripes (Orbitron), Lantern Keep Nightwatch in plum and brass with amber buttons (Cinzel) and Crate Cove Tidepool in sand and sea teal with coral buttons (Lilita One). None uses another maker's names or marks. `freeze.js` copies only the game's own font, and makes each game a local web app: its manifest says standalone, and its page registers its own service worker (`/<game>/sw.js`), which keeps every file the game needs under a name that changes with each freezing, so an installed game opens and plays with no connection. The site's old service worker, which clears caches when an old visitor's copy wakes, now leaves the games' caches alone. `frozen-tests.js` checks that every file a game keeps is there and that it installs as an app of its own.

119. **cond works out only what it chooses, and library words don't clash with a program's names (Claude, 22 Nov; the language, from Troy's ask that each new game make Sprout the language better, not only its libraries).** `cond [test, answer, ...]` was a word of the prelude that took a list, so every test and every answer was worked out before it chose: an answer that called its own cell again never stopped (three games met this), and the sounds and other effects written in the answers not chosen happened anyway. The compiler now writes a `cond` given its list in place as a chain of choices: the tests are worked out in order up to the first that is true (or any), and only that answer is worked out, in the tail of the cell when the cond is, so an answer can call its own cell again as deep as it likes (`f : [n | cond [n < 1, 0, any, f (n - 1)]]` runs to twenty thousand). The answers given are the same as before. A program's own `cond`, and `cond` given a list made elsewhere, are as they were. And the lint "is both a field here and a name in scope" no longer fires for a word read straight from a global named in place (`piles draw`, `vec size`): every game has a cell called draw, and a library module's word can't mean it; a program's own records still lint as before.

120. **Blended Zebra 8, and handhelds that differ in more than colour (Claude, 22 Nov; a game, the host and the library, from Troy's asks for a simple 8-bit Blended Zebra and for more variety in each new game's handheld).** Blended Zebra 8 (`examples/blended-zebra.sp`, at `/blended-zebra/`, on its own frozen Sprout) is the endless black, white and red deckbuilder made small: a zebra climbs a savanna floor by floor, picking a door (a fight, an oasis every third floor, a boss every fifth); a fight deals five cards and three energy a turn, attacks go through the foe's guard, blocks last the turn, and the foe shows its next move (attack, guard or roar); after a win you take one of three cards; at an oasis you rest or blend two cards into one that does both, at the dearer cost, under a name made of both (BITE and HIDE blend to BIDE), and a blend can be blended once more before it is MAX; BITE and KICK make the ancestral CRUSH. It keeps your best floor. The library gained `piles` (fresh, draw, play, exhaust, end-turn, all-cards: the stock, hand and discard of a deckbuilder, the discard shuffled back by seed when the stock runs out) and `prose blend` (two words into one, half of each). The skins gained options that change the handheld's shape and feel, not only its colours: `shape: "wide"` (a landscape body with the screen in the middle, the D-pad on the left and the buttons on the right, on a computer or a tablet held sideways), `pattern: "zebra"` (wavy stripes in the plastic), `dpadShape: "disc"` (a round pad), `buttonRow` (the buttons side by side) and `plate` (a light panel behind the brand, and behind the small labels on a patterned body). Blended Zebra's handheld uses all of them, in white plastic with black stripes and red controls, with its own font, Sora (SIL Open Font License). `sprite` takes a sixth value, a whole number, to draw a picture that many times bigger. And SPROUT·8 now latches a press until the next frame has seen it, so a tap quicker than a frame still counts.

121. **Pressed and released (Claude, 22 Nov; the game layer, from Troy's ask to make Sprout better with each new game).** The frame now gives a game's input `pressed` and `released` beside `held`: records of the keys that went down, or came up, since the tick before (`g input pressed "one"` is true on the one tick a button goes in). Every game so far kept last tick's keys in its own state to see a press; now none needs to. The second player's input2 gets them too. They are worked out from the input the state already holds, so a rewind or a replay sees the same presses. A key held down shows in `held` every tick and in `pressed` once.

122. **Kits: library modules that draw (Claude, 22 Nov; the host and the library, from Troy's ask for a system for making apps easily by reusing Sprout code).** A kit is a module written in Sprout, in `kit/`, that draws and sounds with a game's own words. A game that names one gets it, loaded with its own drawing words (`ui banner ["GO", 40, 8, #ffffff]`); a game that doesn't, doesn't. The first kit, `ui`, holds what the 8-bit games kept writing again: `banner` (words across the middle with a shadow), `blink` (a prompt shown half of every second), `panel`, `meter`, `choices` (a menu with its pointer), `strip` (words along the top), `talk` and `talked` (a line typed out in a box, a letter at a time), `float` (words that rise from where something happened) and `wipe` (bars closing between scenes). A kit's examples say what they draw (`ui panel [10x20, 40x30, #ffffff, #000000] draws rect [10, 20, 40, 30, #ffffff], rect [12, 22, 36, 26, #000000]`), and that is checked when the library is built, as answers are. The game layer gained `drawsOf` and `answerOf` for that. Two modules joined the library with them: `pad` (way, across, upward, either, any-in: the arrows as a pair, and whether button 1 or 2 is in) and `menu` (wrap, clamp, grid, top, window, spend: a cursor over choices, cards or a grid, scrolling a long list, and points spent along a row of values, as when building a player).

123. **The arcade cabinet (Claude, 22 Nov; the host, for Basketball Legends 8).** A skin can now make the handheld a small arcade cabinet: `shape: "cabinet"` (the logo lit in a marquee on top, a square bezel, the controls on a deck), `dpadShape: "stick"` (a ball-top joystick in a round gate that leans the way it's pushed), `buttonStyle: "ball"` (buttons drawn as basketballs, seams and all), `stick` (the joystick's colour) and `pattern: "wood"` (hardwood planks with the three-point line painted round the controls).

124. **Games made side by side (Claude, 22 Nov; the host, from Troy's ask for rapid iterations done in parallel).** A new game now lives in files of its own, so several can be made at once without two hands on one file: its program (`examples/<game>.sp`), its entry in the registry (`games.d/<game>.json`: title, file, about, a one-line `line` for Sprout's page, the skin, and `bits` for a 16-bit game), its tests (`tests8/<game>.js`, a function given the test helpers, run by game-tests.js), its icons, and, when the skin's options aren't enough, its own handheld (`skins/<game>.css`, laid over the shell's stylesheet and frozen with the game). `registry.js` reads games.json and games.d together for freeze.js and frozen-tests.js, and `node publish.js <game>` puts a game on the site in one go: frozen, with a row at the top of the home page and a line on Sprout's page.

125. **SPROUT·16 (Claude, 22 Nov; the host, from Troy's asks for 16-bit games).** `Eight.start({ bits: 16 })`, or `"bits": 16` in a game's registry entry, makes the console a 16-bit one: a 320 by 224 screen, colours snapped to 512 (eight levels of red, green and blue, as on the 16-bit consoles), and songs played with a warmer voice: the lead and harmony a sawtooth through a filter, the bass the triangle as before, and a little echo on the music. The drawing words, sprites, sounds, keys and saving are the same, so a game moves up by changing one number, and the `ui` kit already takes the wider screen from W and H. Its own default handheld is black plastic with a red stripe on the wide body, and `examples/test-card-16.sp` is its test card. frozen-tests.js plays a 16-bit game on a 16-bit screen.

126. **Keys that repeat (Claude, 22 Nov; the game layer, for the puzzles Troy asked for).** The frame's input now has `held-for` (how long each key has been held, in seconds) and `repeated`: a key is repeated on the tick it goes down, again once it has been held a quarter of a second, and then twelve times a second while it stays down, the way a menu cursor or a falling piece slides when you hold an arrow. `g input repeated "left"` reads like `pressed`. The time held is counted from the input the state already holds, and each repeat is found by comparing with the time stored the tick before (not by taking a tick away, which a sum of sixtieths can miss), so rewinds and replays repeat alike.

127. **Fizz Jar, a falling-pair puzzle, and runs (Claude, 22 Nov; a game and the library, from Troy's ask for an 8-bit falling-pair colour-matching puzzle).** Fizz Jar (`examples/fizz-jar.sp`, at `/fizz-jar/`, on its own frozen Sprout) is an original falling-pair puzzle: pairs of fizzy drops (cherry, lime, berry) fall into a soda jar where grumpy sour candies sit. Four or more of a colour in a row or column, drops and sours together, pop, and what they held up falls, so one pop can set off another, each worth double. Pop every sour to clear the jar; each jar holds two more sours and drops a little faster. The arrows move the pair, down drops it faster, and buttons 1 and 2 turn it, nudging it aside or up when something is in the way. It keeps your best score. It was the first game built on the new pieces: presses from `input pressed` (decision 121), turning with `menu wrap`, moving with `pad across`, and its panels, title, rising scores and prompts drawn with the `ui` kit (decision 122). The library gained `runs` (cell-at, put, open, find, clear, settle, fall, count): a well of cells kept as rows of text, one letter a cell, for falling-block and matching games, which finds the runs of one letter long enough to pop, empties them, and lets what is loose fall while fixed letters stay put. Its handheld is mint soda plastic with bubbles rising through it, a cherry soda label for the brand and a crimped bottle cap for the D-pad (`skins/fizz-jar.css`). It was made by one of several builders working side by side (decision 124).

128. **Brick Snap, a block puzzle with toy bricks, and piece (Claude, 22 Nov; a game and the library, from Troy's ask for an 8-bit block-placement puzzle).** Brick Snap (`examples/brick-snap.sp`, at `/brick-snap/`, on its own frozen Sprout) is an 8-bit block puzzle of its own: three toy bricks wait in a tray, the arrows move the shadow of the one you hold over an 8 by 8 green baseplate, 1 snaps it down and 2 takes another. Full rows and columns pop off together, scoring 10 × lines² × the streak of snaps in a row that popped, plus 300 for emptying the whole plate. The shadow flashes the lines it would pop, and popped bricks burst into sparks. The game ends when no brick left fits, and it keeps your best. Bricks come by `seeded` from the run's seed, in thirteen forms and four turns. It reads `pressed` (decision 121) and draws with the `ui` kit. The library gained `piece` (cells, size, fits, put, spots, anywhere, full-lines, full-count, clear, cleared, turn, filled): a piece is its cells written as rows of text, on a `grid` board. Its handheld is a red toy brick with studs standing along the top, a yellow name plate in Lilita One, yellow stud buttons in a row and a blue brick cross for the pad (`skins/brick-snap.css`).
