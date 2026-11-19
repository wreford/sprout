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
