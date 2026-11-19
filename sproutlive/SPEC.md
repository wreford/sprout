# Sprout 2.0 language spec (Sprout Live)

This spec describes Sprout 2.0 as compiled and run by Sprout Live, at taskiap.com/sproutlive/.

- **The language:** `sprout2.js` compiles Sprout to JavaScript and holds its runtime.
- **The game layer:** `live.js` runs a Sprout program as a game and swaps in new code while it runs.
- **The page:** `index.html` is the editor, the game words and the rewind bar.

Sprout Live started from the compiler in `2026experiments/pm-tools/sprout2-ide.html` and adds to it. Anything marked **(Live)** in this spec exists only in Sprout Live. The 11 example programs in the original IDE give the same output in both.

Example programs are in `examples/`:
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
- `-- note` runs to the end of the line.
- `'note'` between single quotes is an older comment style that still works.

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
| list | `[1, 2, 3]` | Counts from 1. |
| record | `{x : 1, y : 2}` | **(Live)** The same thing as a map with string keys. |
| map | `map` | An empty map; fill it with `m "key" := value`. |
| block | `[_ * 2]` | A function. |

---

## 4. Statements

```
name : expr          -- makes a field
name := expr         -- changes a field
target key := expr   -- stores into a list, record or map
```

Some examples of storing:
- `xs 2 := 9` changes the second item of a list.
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
| a block | Calls it. Extra values go to whatever it returns. With too few values, you get a block that waits for the rest (`add-ten : add 10`). **(Live fix)** |
| a list | Gives item `x`, or `none` if there isn't one. |
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
| `[ ... _ ... ]` | one: `_` (the older `@` also works) |
| `[a, b \| ... ]` or `[a b \| ... ]` | named inputs |
| `[\| ... ]` | always none, even if every line is a call |

A block's value is the value of its last statement. Blocks capture the names around them (closures):

```
adder : [n | [_ + n]]
add5 : adder 5
add5 10 print          -- 15
```

### 6.2 Block or list? (Live)
`[ ... ]` is a **list** in these cases:
- It is empty: `[]`.
- It has two or more items separated by commas, and none of them uses `_` or `:`.

Anything else is a **block**:
- Several lines without commas are the steps of a block.
- `[5]` is a block that gives 5. A one-item list is `[] append 5`.

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
- Inside a loop body, `:=` changes fields outside it, and `xs 2 := v` or `d.x := v` store into what they name.
- **Runaway loops (Live):** Sprout Live stops a loop that runs more than 2,000,000 times, or longer than 60 ms in one frame. You get the error "A loop kept going too long".

---

## 9. Lists, records and maps

### Lists
| Write | To |
|---|---|
| `xs 1` | read the first item |
| `xs 2 := 9` | change an item |
| `xs append v` | make a **new** list with `v` added (the old one is unchanged) |
| `xs length`, `first`, `second`, `last` | read size and ends |
| `xs collect [...]`, `xs fold s [a, b \| ...]` | transform |
| `keep xs [test]` | keep only the items that pass (a game word, see 11) |

Storing past the end of a list leaves gaps. Use `append` to grow a list.

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
- Lists are arrays with an unused slot 0, so `xs 1` is `xs[1]`.
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
- **No one-item list literal.** Use `[] append x`.
- **Zero-input blocks** are called by giving them any value, for example `reset none`.
- **`print` shows full precision**, for example `0.30000000000000004`. Use `round` or `floor` before printing.
- **Tweak** can't drag numbers inside `{ }` in a template.

---

## 15. Changes Sprout Live made to the Sprout 2.0 compiler

These are marked in `sprout2.js` with "Sprout Live fix N" or "Sprout Live addition X".

### Fixes
1. `:=` inside a choice branch now runs; it used to be dropped.
2. `[| ... ]` is always a block.
3. In `each` and `collect` bodies, `:=` changes the outer field and `xs 2 := v` stores into the list.
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
