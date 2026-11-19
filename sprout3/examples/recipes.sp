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
