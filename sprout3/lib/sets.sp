-- sets: lists used as sets, where what matters is which things are in, not their order or how often. Each answer keeps
-- the order of the first list and holds each thing once. And the ways to choose some of the things, or to order them.

-- every thing in either list
-- e.g. sets union [[1, 2, 3], [3, 4]] → [1, 2, 3, 4]
union : [a b | a .. b distinct]

-- the things in both lists
-- e.g. sets both [[1, 2, 3], [4, 3, 2]] → [2, 3]
both : [a b | a keep [thing | b has thing] distinct]

-- the things in the first list that aren't in the second
-- e.g. sets minus [[1, 2, 3, 2], [2]] → [1, 3]
minus : [a b | a keep [thing | (b has thing) not] distinct]

-- the list with a thing taken out when it's in, or added when it isn't (a tag, a selected tile, a crew's members)
-- e.g. sets toggle [["a", "b"], "a"] → [b]
-- e.g. sets toggle [["b"], "a"] → [b, a]
toggle : [items thing | (items has thing) [items keep [other | other != thing]] else [items .. [thing]]]

-- is everything in the first list also in the second?
-- e.g. sets inside [[1, 2], [3, 2, 1]] → true
-- e.g. sets inside [[1, 4], [3, 2, 1]] → false
inside : [a b | a all [thing | b has thing]]

-- do two lists hold the same things, in any order?
-- e.g. sets same [[1, 2, 2], [2, 1]] → true
same : [a b | (inside [a, b]) and (inside [b, a])]

-- every way to choose n of the things, each in the list's order (hands of cards, teams, pairs to compare)
-- e.g. sets picks [["a", "b", "c"], 2] → [[a, b], [a, c], [b, c]]
-- e.g. sets picks [[1, 2], 3] → []
picks : [items n |
  cond [
    n = 0, [[]]
    items length < n, []
    any, (picks [items rest, n - 1] collect [chosen | [items first] .. chosen]) .. (picks [items rest, n])
  ]
]

-- every order the things can go in (for a puzzle small enough to try them all)
-- e.g. sets orders [1, 2, 3] → [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
orders : [items |
  (items length <= 1) [[items]] else [
    items numbered collect-flat [[k, thing] |
      others : items numbered keep [[j, other] | j != k] collect [[j, other] | other]
      orders others collect [order-of-others | [thing] .. order-of-others]
    ]
  ]
]
