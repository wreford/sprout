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

---

## Appendix A. Sprout programs

### examples/tour.sp

````sprout
-- A tour of Sprout 2.0. Each line prints what it makes.

-- fields: : makes one, := changes it
count : 0
count := count + 1
count print

-- math reads left to right, with no precedence
2 + 3 * 4 print
2 + (3 * 4) print

-- words and templates
name : "Sprout"
"Hello, {name}! count is {count}" print
"joined " ++ (count str) print

-- choices: true picks the first, false the second
count > 0 ["positive", "not positive"] print
(count > 0) and (count < 10) ["small", "big"] print

-- blocks: _ is the input, or name the inputs before |
double : [_ * 2]
double 21 print
add : [a, b | a + b]
add 2 3 print
add-ten : add 10
add-ten 5 print

-- recursion, with memoize to remember answers
fib : [n | n <= 1 [n, (fib (n - 1)) + (fib (n - 2))]] memoize
fib 30 print

-- lists start at 1
xs : [3, 1, 4, 1, 5]
xs 1 print
xs length print
xs collect [_ * 10] print
xs fold 0 [total, x | total + x] print
xs append 9 print

-- loops
sum : 0
5 times [sum := sum + _]
sum print
xs each [n | n > 3 ["big {n}" print]]
k : 1
while [k < 100] [k := k * 2]
k print

-- records
p : {x : 1, y : 2}
p.x := p.x + 10
p print
"p is at {p.x}, {p.y}" print
````

### examples/sprout.sp

````sprout
-- Sprout: catch the rain, dodge the bugs

x : W / 2         -- where the sprout stands
height : 40       -- how tall it is
drops : []        -- falling rain
bugs : []         -- falling ladybirds
sparks : []
score : 0
over : false

update : [dt |
  restart (over and tapped)
  pace : over [0, 1]

  touching [x := toward x touch-x 0.2]
  key "left" [x := x - 5]
  key "right" [x := x + 5]
  x := clamp x 20 (W - 20)

  every 0.3 [
    drops := drops append {x : rand 20 (W - 20), y : -10}
    random < 0.3 [bugs := bugs append {x : rand 20 (W - 20), y : -10}]
  ]

  speed : 160 + (score * 4) * dt * pace
  top : H - 40 - height
  drops each [d |
    d.y := d.y + speed
    (dist d.x d.y x top) < 24 [(
      3 times [sparks := sparks append {x : d.x, y : d.y, vx : rand -80 80, vy : rand -120 0, life : 0.5}]
      d.y := H + 99
      height := clamp (height + 8) 0 (H - 140)
      score := score + 1
      beep 880 0.06
    )]
  ]
  drops := keep drops [_.y < H]

  bugs each [b |
    b.y := b.y + (speed * 0.8)
    near : (b.x - x) abs < 14
    near and (b.y > top) [(
      b.y := H + 99
      height := height - 30
      shake 12
      beep 110 0.25
    )]
  ]
  bugs := keep bugs [_.y < H]
  over := height < 20

  sparks each [s |
    s.x := s.x + (s.vx * dt)
    s.y := s.y + (s.vy * dt)
    s.life := s.life - dt
  ]
  sparks := keep sparks [_.life > 0]
]

draw : [
  clear "#ffb38a"
  circle 300 70 (34 + (wave 3 * 3)) "#ff6b4a"
  cloud : clock * 12 % (W + 120) - 60
  circle cloud 120 20 "#ffffff"
  circle (cloud + 24) 112 26 "#ffffff"
  circle (cloud + 50) 120 18 "#ffffff"
  rect 0 (H - 40) W 40 "#7a4b2a"

  top : H - 40 - height
  rect (x - 3) top 6 height "#3c9d3c"
  leaf : H - 60
  side : 1
  while [leaf > (top + 20)] [
    circle (x + (side * 8)) leaf 6 "#4fb04f"
    side := 0 - side
    leaf := leaf - 28
  ]
  circle (x - 9) top 9 "#5cc85c"
  circle (x + 9) top 9 "#5cc85c"

  drops each [circle _.x _.y 6 "#2f7fe0"]
  bugs each [b |
    circle b.x b.y 10 "#d62828"
    circle b.x (b.y - 8) 5 "#222222"
  ]
  sparks each [circle _.x _.y 3 "#e8f7ff"]
  text "{score} drops" (W / 2) 30 22 "#5a2a1a"

  over [(
    rect 0 0 W H "rgba(0,0,0,0.5)"
    text "Your sprout wilted" (W / 2) (H / 2 - 20) 28 "#ffffff"
    text "Tap to grow again" (W / 2) (H / 2 + 20) 18 "#ffe066"
  )]
]
````

### examples/bounce.sp

````sprout
-- Bounce: keep the ball up

paddle : W / 2
ball : {x : W / 2, y : 100, vx : 150, vy : 220}
score : 0
best : 0

update : [dt |
  touching [paddle := toward paddle touch-x 0.4]
  key "left" [paddle := paddle - (400 * dt)]
  key "right" [paddle := paddle + (400 * dt)]
  paddle := clamp paddle 50 (W - 50)

  ball.x := ball.x + (ball.vx * dt)
  ball.y := ball.y + (ball.vy * dt)
  ball.x < 10 [ball.vx := ball.vx abs]
  ball.x > (W - 10) [ball.vx := 0 - (ball.vx abs)]
  ball.y < 10 [ball.vy := ball.vy abs]

  near : (ball.x - paddle) abs < 50
  low : ball.y > (H - 50)
  (ball.vy > 0) and near and low [(
    ball.vy := 0 - (ball.vy * 1.05)
    ball.vx := ball.vx + ((ball.x - paddle) * 3)
    score := score + 1
    beep 660 0.05
  )]

  ball.y > (H + 20) [(
    best := score > best [score, best]
    beep 140 0.3
    ball := {x : W / 2, y : 100, vx : 150, vy : 220}
    score := 0
    shake 10
  )]
]

draw : [
  clear "#1d1b3a"
  rect (paddle - 50) (H - 40) 100 12 "#ffcc33"
  circle ball.x ball.y 10 "#ff5d8f"
  text score (W / 2) 60 48 "#ffffff"
  text "best {best}" (W / 2) 95 16 "#9a94c8"
]
````

### examples/blank.sp

````sprout
-- Your game! Change anything and watch it update.

dot : {x : W / 2, y : H / 2}

update : [dt |
  touching [(
    dot.x := touch-x
    dot.y := touch-y
  )]
]

draw : [
  clear "#223344"
  circle dot.x dot.y 30 "#ffaa00"
  text "Drag me!" (W / 2) 40 24 "#ffffff"
]
````

## Appendix B. Compiler and runtime: sprout2.js

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

## Appendix C. Live-coding layer: live.js

````js
// Sprout Live: runs a Sprout 2.0 program as a game, and swaps in new code without losing the game's state.
// Used by index.html, and by node tests (require it after sprout2.js).
(function (root) {
"use strict";
const S2 = root.SproutToJS ? root : require("./sprout2.js");
const SproutToJS = S2.SproutToJS, R = S2.SproutRuntime;

// the compiler's name mangling, so the host can define words like touch-x
function mangle(name) {
  if (name === "@") return "AT";
  let s = "";
  for (const ch of name) s += /[A-Za-z0-9_]/.test(ch) ? ch : "_" + ch.charCodeAt(0).toString(16);
  if (s && /[0-9]/.test(s[0])) s = "_" + s;
  return "v_" + s;
}

// split the source into its top-level statements (one per line, or split by commas, outside brackets)
// so a compiled line can be traced back to the line of Sprout it came from
function statements(src) {
  const out = []; let depth = 0, line = 1, start = 0, has = false, i = 0;
  const n = src.length;
  const end = () => { if (has) out.push(start); has = false; };
  while (i < n) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "'") { i++; while (i < n && src[i] !== "'") { if (src[i] === "\n") line++; i++; } i++; continue; }
    if (c === '"') { i++; while (i < n && src[i] !== '"') { if (src[i] === "\\") i++; else if (src[i] === "\n") line++; i++; } i++; if (!has) { has = true; start = line; } continue; }
    if (c === "\n") { if (depth === 0) end(); line++; i++; continue; }
    if (c === "," && depth === 0) { end(); i++; continue; }
    if (c === "[" || c === "(" || c === "{") depth++;
    else if (c === "]" || c === ")" || c === "}") depth = Math.max(0, depth - 1);
    if (!/\s/.test(c) && !has) { has = true; start = line; }
    i++;
  }
  end();
  return out;
}

// a bracket that closes the wrong thing, or one left open, usually marks the typo
function bracketLine(src) {
  const stack = []; let line = 1;
  const pair = { "]": "[", ")": "(", "}": "{" };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < src.length && src[i] !== "\n") i++; i--; continue; }
    if (c === '"') { i++; while (i < src.length && src[i] !== '"') { if (src[i] === "\n") line++; if (src[i] === "\\") i++; i++; } continue; }
    if (c === "\n") { line++; continue; }
    if (c === "[" || c === "(" || c === "{") stack.push([c, line]);
    else if (c === "]" || c === ")" || c === "}") { const top = stack.pop(); if (!top || top[0] !== pair[c]) return top ? top[1] : line; }
  }
  return stack.length ? stack[stack.length - 1][1] : 0;
}

// find the first statement that will not compile on its own, for a useful line number on typos
function typoLine(src) {
  const b = bracketLine(src);
  if (b) return b;
  const lines = src.split("\n"), starts = statements(src);
  for (let k = 0; k < starts.length; k++) {
    const a = starts[k] - 1, b = (k + 1 < starts.length ? starts[k + 1] - 1 : lines.length);
    const chunk = lines.slice(a, b).join("\n");
    try { SproutToJS.compile(chunk); } catch (e) { return starts[k]; }
  }
  // brackets left open run to the end: report where the open one started
  let depth = 0, at = 0, line = 1;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "-" && src[i + 1] === "-") { while (i < src.length && src[i] !== "\n") i++; line++; continue; }
    if (c === "\n") line++;
    if (c === "[" || c === "(" || c === "{") { if (!depth) at = line; depth++; }
    if (c === "]" || c === ")" || c === "}") depth--;
  }
  return depth > 0 ? at : 0;
}

// wrap every while( loop so a runaway loop stops instead of freezing the page
function guard(js) {
  let out = "", i = 0;
  while (i < js.length) {
    const c = js[i];
    if (c === "'") { let j = i + 1; while (j < js.length && js[j] !== "'") { if (js[j] === "\\") j++; j++; } out += js.slice(i, j + 1); i = j + 1; continue; }
    if (js.startsWith("while(", i) && !/[\w$]/.test(js[i - 1] || "")) {
      let d = 0, j = i + 5;
      for (; j < js.length; j++) { if (js[j] === "(") d++; else if (js[j] === ")") { d--; if (!d) break; } else if (js[j] === "'") { j++; while (j < js.length && js[j] !== "'") { if (js[j] === "\\") j++; j++; } } }
      out += "while(__G()&&" + js.slice(i + 5, j + 1) + ")"; i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

const sig = v => {
  if (v === R.TRUE) return "T"; if (v === R.FALSE) return "F"; if (v === R.NONE) return "N";
  if (typeof v === "number" || typeof v === "string") return typeof v + ":" + v;
  if (Array.isArray(v) || ArrayBuffer.isView(v)) return "[" + Array.from(v).slice(1).map(sig).join(",") + "]";
  if (v instanceof Map) return "{" + Array.from(v).map(([k, x]) => k + ":" + sig(x)).join(",") + "}";
  return null;
};

// a deep copy of lists and records; blocks, words and numbers are shared
function copy(v) {
  if (Array.isArray(v)) return v.map(copy);
  if (ArrayBuffer.isView(v)) return v.slice();
  if (v instanceof Map) { const m = new Map(); for (const [k, x] of v) m.set(k, copy(x)); return m; }
  return v;
}

const INPUTS = ["touch-x", "touch-y", "touching", "tapped", "clock"];

// host: { name: [arity, fn] } plus W and H; returns a program you can step
function build(src, host, keep) {
  host = host || {};
  let js = SproutToJS.compile(src);
  const names = [], lines = js.split("\n");
  const re = /^let (v_[A-Za-z0-9_]+) = (.*?);?$/;
  js = lines.map(l => { const m = l.match(re); if (!m) return l; names.push(m[1]); return "let " + m[1] + " = __keep(\"" + m[1] + "\", " + m[2] + ");"; }).join("\n");
  js = guard(js);
  const inV = INPUTS.map(mangle);
  const head = "let " + inV.map(v => v + "=" + (/touch_2d|clock/.test(v) ? "0" : "FALSE")).join(",") + ";const __in=(a,b,c,d,e)=>{" + inV.map((v, i) => v + "=" + "abcde"[i]).join(";") + "};\n";
  const tail = "\n;return {__in,get:()=>({" + names.map(n => n + ":" + n).join(",") + "}),set:(o)=>{" + names.map(n => "if(\"" + n + "\" in o)" + n + "=o." + n + ";").join("") + "},update:typeof v_update!=='undefined'?v_update:null,draw:typeof v_draw!=='undefined'?v_draw:null}\n//# sourceURL=game.js";
  // every seconds [ ... ]: runs the block on a beat. Timers are keyed by the block's own code,
  // so editing one block restarts only its beat, and the beats carry over when the code changes.
  const timers = new Map(keep && keep.timers ? keep.timers : []);
  let frameDt = 0, clock = keep && keep.clock || 0;
  host = Object.assign({}, host, {
    every: [2, (secs, block) => {
      if (typeof block !== "function" || !(secs > 0)) return R.NONE;
      const k = String(block); let t = (timers.get(k) || 0) + frameDt, n = 0;
      while (t >= secs && n < 4) { t -= secs; n++; R.RUN(block()); }
      timers.set(k, Math.min(t, secs)); return R.NONE;
    }],
    // wave seconds: glides from -1 to 1 and back, once every that many seconds
    wave: [1, secs => secs > 0 ? Math.sin(clock / secs * Math.PI * 2) : 0]
  });
  const rnames = Object.keys(R), hk = Object.keys(host);
  const fresh = {}, init = {};
  let loops = 0, t0 = 0;
  const now = typeof performance !== "undefined" ? () => performance.now() : () => Date.now();
  const __G = () => {
    if (++loops > 2e6 || ((loops & 1023) === 0 && now() - t0 > 60)) throw new Error("A loop kept going too long, so it was stopped");
    return true;
  };
  const __keep = (name, v) => {
    if (typeof v === "function") return v;
    const s = sig(v); init[name] = s;
    if (keep && s !== null && name in keep.vals && keep.init[name] === s) return keep.vals[name];
    return v;
  };
  const args = hk.map(k => { const h = host[k]; return Array.isArray(h) ? (h[0] > 1 ? R.AR(h[1], h[0]) : h[1]) : h; });
  const fn = new Function(...rnames, "prnt", "__keep", "__G", ...hk.map(mangle), head + js + tail);
  t0 = now();
  const p = fn(...rnames.map(k => R[k]), host.print ? host.print[1] : (x => x), __keep, __G, ...args);
  p.init = init;
  p.step = (dt, inp) => {
    frameDt = dt; clock += dt;
    p.__in(inp.x || 0, inp.y || 0, inp.down ? R.TRUE : R.FALSE, inp.tap ? R.TRUE : R.FALSE, clock);
    loops = 0; t0 = now(); if (p.update) R.RUN(p.update(dt));
  };
  p.paint = () => { loops = 0; t0 = now(); frameDt = 0; if (p.draw) R.RUN(p.draw()); };
  p.snapshot = () => ({ vals: p.get(), init: p.init, timers: Array.from(timers), clock });
  // save and load copy the whole game state, so time can be wound back to any saved frame
  p.save = () => { const v = p.get(), o = {}; for (const k in v) if (typeof v[k] !== "function") o[k] = copy(v[k]); return { vals: o, timers: Array.from(timers), clock }; };
  p.load = s => { const o = {}; for (const k in s.vals) o[k] = copy(s.vals[k]); p.set(o); timers.clear(); for (const [k, t] of s.timers) timers.set(k, t); clock = s.clock; };
  p.clock = () => clock;
  return p;
}

// a JS error in game.js points at a compiled line; each compiled line is one top-level statement
let LOFF = null;
function lineOf(e, src) {
  const m = String(e && e.stack || "").match(/game\.js:(\d+)/);
  if (!m) return 0;
  if (LOFF === null) {
    try { build("x : 1\nboom : (missing-thing 1)", {}).step(0, {}); } catch (_) {}
    try { const p = build("f : [| 1 ]\nupdate : [dt | nope 1 2 3]", {}); p.step(0, {}); } catch (e2) { const k = String(e2.stack || "").match(/game\.js:(\d+)/); LOFF = k ? +k[1] - 2 : 1; }
    if (LOFF === null) LOFF = 1;
  }
  const idx = +m[1] - LOFF;
  const starts = statements(src);
  return starts[Math.max(0, Math.min(starts.length - 1, idx - 1))] || 0;
}

// turn JS-flavoured messages into Sprout ones
function friendly(msg) {
  const un = s => s.replace(/_([0-9a-f]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
  return String(msg)
    .replace(/\bv_([A-Za-z0-9_]+) is not defined/, (m, n) => "\"" + un(n) + "\" isn't a word Sprout knows yet")
    .replace(/^unexpected: (.*)$/, (m, t) => "this doesn't make sense here: " + t.replace(/^\{"k":"word","v":(".*")\}$/, "$1"))
    .replace(/\bv_([A-Za-z0-9_]+)/g, (m, n) => un(n));
}

const api = { build, copy, mangle, statements, typoLine, bracketLine, lineOf, friendly, R, SproutToJS };
if (typeof module !== "undefined") module.exports = api; else root.SproutLive = api;
})(typeof window !== "undefined" ? window : globalThis);
````
