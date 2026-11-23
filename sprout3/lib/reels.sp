-- reels: a slot machine's grid and what it pays. A grid is a list of rows, each a list of symbols; a place is a pair,
-- the column across and the row down, from 1x1. Symbols are drawn by their weights from a seed, so a run that rewinds
-- gets the same luck. The paylines are the rows, the columns and the diagonals; a win is a line whose first symbols
-- are alike, at least so many of them, and a table of pays gives what each is worth.

-- a grid of symbols, size across and down, each drawn by its weight from the seed
-- e.g. reels spin [["a", "b"], [1, 0], 3x2, 7] → [[a, a, a], [a, a, a]]
-- e.g. reels spin [["a", "b", "c"], [1, 1, 1], 4x2, 9] collect [r | r length] → [4, 4]
spin : [symbols weights size seed | range (size y) collect [r | range (size x) collect [c | seeded weighted [symbols, weights, seed * 97 + (r * 13) + c]]]]

-- the symbol at a place
-- e.g. reels at [[["a", "b"], ["c", "d"]], 2x1] → b
at : [grid place | grid @ (place y) @ (place x)]

-- the paylines of a grid of a size: each row, each column, and every diagonal as long as the grid is tall, falling to
-- the right and rising to the right; each line is its kind and its places, in order from where it starts
-- e.g. reels lines 3x3 length → 8
-- e.g. reels lines 5x3 length → 14
-- e.g. reels lines 2x2 @ 5 → [kind : diagonal, places : [1x1, 2x2]]
lines : [size |
  across : size x
  down : size y
  slants : across - down + 1 max 0
  by-row : range down collect [r | [kind : "row", places : range across collect [c | pair [c, r]]]]
  by-column : range across collect [c | [kind : "column", places : range down collect [r | pair [c, r]]]]
  falling : range slants collect [c | [kind : "diagonal", places : range down collect [r | pair [c + r - 1, r]]]]
  rising : range slants collect [c | [kind : "diagonal", places : range down collect [r | pair [c + r - 1, down + 1 - r]]]]
  by-row .. by-column .. falling .. rising
]

-- the wins on some lines: each line whose first symbols are alike, at least length of them, with its kind, the symbol,
-- how many are alike and their places
-- e.g. reels wins [[["a", "a", "a", "b"]], reels lines 4x1, 3] → [[kind : row, symbol : a, alike : 3, places : [1x1, 2x1, 3x1]]]
-- e.g. reels wins [[["a", "b", "a"], ["b", "a", "b"], ["a", "b", "a"]], reels lines 3x3, 3] collect [w | w kind] → [diagonal, diagonal]
wins : [grid lines length |
  found : lines collect [line |
    spots : line places
    marks : spots collect [p | at [grid, p]]
    lead : marks @ 1
    many : marks take-while [m | m = lead] length
    [kind : line kind, symbol : lead, alike : many, places : spots take many]
  ]
  found keep [w | w alike >= length]
]

-- how many of a symbol are anywhere on the grid
-- e.g. reels tally [[["a", "b"], ["b", "b"]], "b"] → 3
tally : [grid symbol | grid collect [r | r count [s | s = symbol]] sum]

-- the coins some wins pay from a table of each symbol's pays by how many are alike (a symbol not in it pays nothing)
-- e.g. reels pay [[[kind : "row", symbol : "a", alike : 3, places : []]], [a : [0, 0, 5, 10, 20]]] → 5
-- e.g. reels pay [[[kind : "row", symbol : "z", alike : 4, places : []]], [a : [0, 0, 5, 10, 20]]] → 0
pay : [found table | found collect [w | (table has-field (w symbol)) [table get-in [w symbol] @ (w alike) else [0]] else [0]] sum]

-- is the whole grid one symbol? (a jackpot)
-- e.g. reels same [[["a", "a"], ["a", "a"]]] → true
same : [grid | lead : grid @ 1 @ 1, grid all [r | r all [s | s = lead]]]

-- how many reels have stopped, count of them stopping one after another gap seconds apart from a spin that began then
-- e.g. reels stopped [10, 5, 0.25, 10.9] → 3
-- e.g. reels stopped [10, 5, 0.25, 10.1] → 0
-- e.g. reels stopped [10, 5, 0.25, 20] → 5
stopped : [began count gap now | now - began - 0.4 / gap floor + 1 max 0 min count]

-- the symbol a still-rolling reel shows at a row, flicking past quickly
-- e.g. reels blur [["a", "b", "c"], 2, 1, 0.5] → a
blur : [symbols column row now | symbols @ (now * 14 floor + (column * 3) + (row * 5) % (symbols length) + 1)]
