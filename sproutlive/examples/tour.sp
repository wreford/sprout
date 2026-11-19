-- A tour of Sprout 2.0. Each line prints what it makes.

-- fields: : makes one, := changes it
count : 0
count := count + 1
count print

-- maths reads left to right, with no precedence
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
