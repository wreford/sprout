-- integers: whole numbers: common factors and multiples, primes, digits, factorials and choosing, Fibonacci and
-- triangle numbers, Roman numerals and other bases. For number puzzles, quizzes and teaching games.

-- the greatest common divisor: the largest number that divides both
-- e.g. integers gcd [12, 18] → 6
gcd : [a b | (b = 0) [a abs] else [gcd [b, a % b]]]

-- the least common multiple: the smallest number both divide
-- e.g. integers lcm [4, 6] → 12
lcm : [a b | (a = 0) or (b = 0) [0] else [a * b abs / (gcd [a, b])]]

-- is n a prime (divided only by 1 and itself)?
-- e.g. integers prime 97 → true
-- e.g. integers prime 91 → false
prime : [n | (n >= 2) and (range (n abs sqrt floor) drop 1 all [d | n % d != 0])]

-- the primes up to n
-- e.g. integers primes 30 → [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
primes : [n | range n drop 1 keep [k | prime k]]

-- n as a product of primes, smallest first
-- e.g. integers factors 360 → [2, 2, 2, 3, 3, 5]
factors : [n |
  split-off : [m d found |
    (m < 2) [found] else [(d * d > m) [found .. [m]] else [(m % d = 0) [split-off [m / d, d, found .. [d]]] else [split-off [m, d + 1, found]]]]
  ]
  split-off [n abs, 2, []]
]

-- every whole number that divides n, smallest first
-- e.g. integers divisors 12 → [1, 2, 3, 4, 6, 12]
divisors : [n | range (n abs) keep [d | n % d = 0]]

-- is n perfect: the sum of its other divisors?
-- e.g. integers perfect 28 → true
perfect : [n | (n > 1) and (divisors n sum - n = n)]

-- the digits of n, the most significant first
-- e.g. integers digits 4096 → [4, 0, 9, 6]
digits : [n | n abs floor str chars collect [c | c number]]

-- the sum of n's digits
-- e.g. integers digit-sum 4096 → 19
digit-sum : [n | digits n sum]

-- the digits added again and again until one is left
-- e.g. integers digital-root 4096 → 1
digital-root : [n | (n abs < 10) [n abs] else [digital-root (digit-sum n)]]

-- n factorial: 1 × 2 × … × n
-- e.g. integers factorial 5 → 120
factorial : [n | range n product]

-- how many ways there are to choose k things from n, in any order
-- e.g. integers choose [5, 2] → 10
-- e.g. integers choose [52, 5] → 2598960
choose : [n k | (k < 0) or (k > n) [0] else [range (k min (n - k)) fold [1, [c i | c * (n + 1 - i) / i]]]]

-- the nth Fibonacci number: 1, 1, 2, 3, 5, 8, each the sum of the two before
-- e.g. integers fibonacci 10 → 55
fibonacci : [n | range n fold [[0, 1], [[a, b] k | [b, a + b]]] @ 1]

-- the nth triangle number: 1 + 2 + … + n
-- e.g. integers triangle 10 → 55
triangle : [n | n * (n + 1) / 2]

-- is n a whole number squared?
-- e.g. integers square 49 → true
square : [n | (n >= 0) and (n abs sqrt round pow 2 = n)]

-- how many steps n takes to reach 1, halving when even, else three times plus one
-- e.g. integers collatz 27 → 111
collatz : [n | iterate [n, [m | (m % 2 = 0) [m / 2] else [m * 3 + 1]]] take-while [m | m > 1] length]

-- n in Roman numerals
-- e.g. integers roman 2026 → MMXXVI
-- e.g. integers roman 1994 → MCMXCIV
roman : [n |
  marks : [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]]
  marks fold [[remaining : n, out : ""], [acc [v, mark] | k : acc remaining / v floor, [remaining : acc remaining - (k * v), out : acc out .. (mark repeat k)]]] out
]

-- the number a Roman numeral stands for
-- e.g. integers from-roman "MCMXCIV" → 1994
from-roman : [numeral |
  worth : [ch | match [ch, ["I", 1, "V", 5, "X", 10, "L", 50, "C", 100, "D", 500, "M", 1000, any, 0]]]
  worths : numeral upper chars collect [ch | worth ch]
  worths numbered collect [[i, v] | (i < (worths length)) [(worths @ (i + 1) > v) [0 - v] else [v]] else [v]] sum
]

-- n written in a base from 2 to 36
-- e.g. integers to-base [255, 16] → ff
-- e.g. integers to-base [10, 2] → 1010
to-base : [n base |
  symbols : "0123456789abcdefghijklmnopqrstuvwxyz" chars
  (n = 0) ["0"] else [iterate [n, [m | m / base floor]] take-while [m | m > 0] collect [m | symbols @ (m % base + 1)] reverse join ""]
]

-- the number a text in a base stands for
-- e.g. integers from-base ["ff", 16] → 255
from-base : [digits-text base |
  symbols : "0123456789abcdefghijklmnopqrstuvwxyz" chars
  digits-text lower chars fold [0, [total ch | total * base + (symbols index-of ch - 1)]]
]
