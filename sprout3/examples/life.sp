-- Life: squares live, die and are born on a 24 by 32 grid, and the edges wrap round.
-- A square with 3 live neighbours comes alive; a live one with 2 or 3 stays alive.
-- Draw with your finger to bring squares to life. Time stops while you draw.

cols : 24
rows : 32
side : 15
speed : 0.1                  -- seconds per generation

-- a glider in the corner and an R-pentomino in the middle
seed : [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2], [12, 14], [13, 14], [11, 15], [12, 15], [12, 16]]
column-of : [k | k - 1 % cols]
row-of : [k | k - 1 / cols floor]

start :
  board : range (cols * rows) collect [k |
    seed keep [p | p @ 1 = (column-of k) and (p @ 2 = (row-of k))] length > 0 [1] else [0]
  ]
  generation : 0

-- 1 if the square at x, y is alive (wrapping round the edges), else 0
at : [b x y | b @ (y % rows * cols + (x % cols) + 1)]

-- the next generation of the whole board
next : [b |
  range (cols * rows) collect [k |
    x : column-of k
    y : row-of k
    n : at [b, x - 1, y - 1] + (at [b, x, y - 1]) + (at [b, x + 1, y - 1]) + (at [b, x - 1, y]) + (at [b, x + 1, y]) + (at [b, x - 1, y + 1]) + (at [b, x, y + 1]) + (at [b, x + 1, y + 1])
    n = 3 or (n = 2 and (b @ k = 1)) [1] else [0]
  ]
]

-- bring the square under your finger to life
draw-at : [b i |
  spot : i touch-y / side floor * cols + (i touch-x / side floor) + 1
  range (cols * rows) collect [k | k = spot [1] else [b @ k]]
]

update : [g |
  i : g input
  i touching [g with [board : draw-at [g board, i]]] else [
    every [speed, g clock, g dt] [g with [board : next (g board), generation : g generation + 1]] else [g]
  ]
]

draw : [g |
  clear "#0d1410"
  range (cols * rows) each [k |
    g board @ k = 1
      rect [column-of k * side + 1, row-of k * side + 1, side - 2, side - 2, "#8ef08e"]
  ]
  text ["generation [g generation]", W / 2, H - 14, 13, "#5f8f73"]
]
