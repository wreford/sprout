-- grid: boards of cells: a list of rows, each a list of cells, and a cell found by a pair, across x down (1x1 is the
-- top left). Read and change cells, find neighbours, regions and the shortest way through; and the moves of board and
-- puzzle games: rows of three, pieces falling into gaps, 2048 slides, straight lines and what can be seen from where.
-- An empty cell is false. Distilled from the TaskIAP games: 96 of the 319 are played on tiles, 53 match or merge them.

-- a grid of size (across x down) with every cell holding value
-- e.g. grid make [3x2, 0] → [[0, 0, 0], [0, 0, 0]]
make : [size value | range (size y) collect [row | range (size x) collect [column | value]]]

-- how big a grid is, across x down
-- e.g. grid size [[1, 2, 3], [4, 5, 6]] → 3x2
size : [g | pair [g @ 1 length, g length]]

-- is a cell on the grid?
-- e.g. grid inside [grid make [3x2, 0], 3x3] → false
inside : [g c | (c x >= 1) and (c y >= 1) and (c y <= (g length)) and (c x <= (g @ 1 length))]

-- what's in a cell (false off the grid)
-- e.g. grid at [[[1, 2], [3, 4]], 2x1] → 2
at : [g c | inside [g, c] [g @ (c y) @ (c x)] else [false]]

-- the grid with one cell changed
-- e.g. grid put [grid make [3x2, 0], 2x1, 9] → [[0, 9, 0], [0, 0, 0]]
put : [g c value | g set-in [[c y, c x], value]]

-- the four cells beside one (above, right, below, left) that are on the grid
-- e.g. grid beside [grid make [3x3, 0], 1x1] → [2x1, 1x2]
beside : [g c | [pair [0, -1], 1x0, 0x1, pair [-1, 0]] collect [d | c + d] keep [n | inside [g, n]]]

-- the eight cells round one that are on the grid
-- e.g. grid around [grid make [3x3, 0], 2x2] length → 8
around : [g c | [pair [-1, -1], pair [0, -1], pair [1, -1], pair [-1, 0], 1x0, pair [-1, 1], 0x1, 1x1] collect [d | c + d] keep [n | inside [g, n]]]

-- how many of the eight cells round one hold value (Life, minesweeper)
-- e.g. grid count-around [[[1, 1, 0], [0, 0, 0], [0, 1, 1]], 2x2, 1] → 4
count-around : [g c value | around [g, c] count [n | at [g, n] = value]]

-- every cell with where it is, as [cell, value]
-- e.g. grid cells [[1, 2], [3, 4]] → [[1x1, 1], [2x1, 2], [1x2, 3], [2x2, 4]]
cells : [g | g numbered collect-flat [[y, row] | row numbered collect [[x, value] | [pair [x, y], value]]]]

-- a new grid made by a cell given each cell and its value
-- e.g. grid map [[[1, 2], [3, 4]], [c v | v * 10]] → [[10, 20], [30, 40]]
map : [g change | g numbered collect [[y, row] | row numbered collect [[x, value] | change [pair [x, y], value]]]]

-- the cells joined to one through cells of the same value
-- e.g. grid region [[[1, 1, 0], [0, 1, 0], [0, 1, 1]], 1x1] length → 5
region : [g c |
  value : at [g, c]
  grow : [found frontier |
    (frontier length = 0) [found] else [
      next : frontier collect-flat [p | beside [g, p]] keep [q | at [g, q] = value] distinct keep [q | (found has q) not]
      grow [found .. next, next]
    ]
  ]
  grow [[c], [c]]
]

-- the grid with the region at a cell changed to value (flood fill)
-- e.g. grid fill [[[1, 1, 0], [0, 1, 0]], 1x1, 7] → [[7, 7, 0], [0, 7, 0]]
fill : [g c value | region [g, c] fold [g, [h q | put [h, q, value]]]]

-- the shortest way from one cell to another, stepping only on cells whose value passes open (false if there's none)
-- e.g. grid path [[[0, 0, 0], [1, 1, 0], [0, 0, 0]], 1x1, 1x3, [v | v = 0]] length → 7
path : [g from to open |
  key : [p | "[p x],[p y]"]
  search : [frontier came |
    cond [
      frontier length = 0, false
      came has-field (key to), came
      any, (
        steps : frontier collect-flat [p | beside [g, p] keep [q | open (at [g, q])] collect [q | [q, p]]]
        fresh : steps keep [[q, p] | (came has-field (key q)) not] distinct-by [[q, p] | key q]
        search [fresh collect [[q, p] | q], fresh fold [came, [m [q, p] | m set-in [key q, p]]]]
      )
    ]
  ]
  came : search [[from], [] set-in [key from, from]]
  back : [p trail | (p = from) [[from] .. trail] else [back [came get-in [key p], [p] .. trail]]]
  (came = false) not [back [to, []]] else [false]
]

-- the grid as lines of text, one a row
-- e.g. grid show [[1, 2], [3, 4]] → 1 2\n3 4
show : [g | g collect [row | row collect [v | v str] join " "] join "\n"]

-- the cells in runs of three or more alike, across or down (match-three)
-- e.g. grid runs [[1, 1, 1, 2], [3, 2, 3, 2], [3, 2, 1, 2]] length → 6
runs : [g |
  same : [row s v | (s >= 1) and (s + 2 <= (row length)) [(row @ s = v) and (row @ (s + 1) = v) and (row @ (s + 2) = v)] else [false]]
  in-run : [row i | v : row @ i, (v != false) and ((same [row, i - 2, v]) or (same [row, i - 1, v]) or (same [row, i, v]))]
  columns : range (g @ 1 length) collect [x | g collect [row | row @ x]]
  across : g numbered collect-flat [[y, row] | range (row length) keep [x | in-run [row, x]] collect [x | pair [x, y]]]
  down : columns numbered collect-flat [[x, column] | range (column length) keep [y | in-run [column, y]] collect [y | pair [x, y]]]
  across .. down distinct
]

-- the grid with its pieces fallen into the gaps below them, the gaps risen to the top
-- e.g. grid fall [[1, 2], [false, 3], [4, false]] → [[false, false], [1, 2], [4, 3]]
fall : [g |
  columns : range (g @ 1 length) collect [x | g collect [row | row @ x]]
  settled : columns collect [column | kept : column keep [v | v != false], range (column length - (kept length)) collect [k | false] .. kept]
  range (g length) collect [y | settled collect [column | column @ y]]
]

-- a row slid toward its start, 2048-style: alike neighbours merge, each only once; [row, points], points being what the
-- merges made
-- e.g. grid slide [2, 2, 4, false] → [row : [4, 4, false, false], points : 4]
slide : [row |
  pieces : row keep [v | v != false]
  done : pieces fold [[out : [], points : 0, held : false], [acc v |
    (acc held = v) [[out : acc out .. [v * 2], points : acc points + (v * 2), held : false]] else [
      (acc held != false) [[out : acc out .. [acc held], points : acc points, held : v]] else [[out : acc out, points : acc points, held : v]]
    ]
  ]]
  final : (done held != false) [done out .. [done held]] else [done out]
  [row : final .. (range (row length - (final length)) collect [k | false]), points : done points]
]

-- the grid turned a quarter clockwise (turn, slide, turn back: a slide any way)
-- e.g. grid turn [[1, 2], [3, 4]] → [[3, 1], [4, 2]]
turn : [g | range (g @ 1 length) collect [x | g reverse collect [row | row @ x]]]

-- the cells on the straight line from one cell to another, both ends included (aiming, beams, line of sight)
-- e.g. grid ray [1x1, 4x2] → [1x1, 2x1, 3x2, 4x2]
ray : [from to |
  n : to x - (from x) abs max (to y - (from y) abs) max 1
  range (n + 1) collect [k | t : k - 1 / n, pair [to x - (from x) * t + (from x) round, to y - (from y) * t + (from y) round]] distinct
]

-- can one cell be seen from another, with no wall on a cell between?
-- e.g. grid sees [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1x2, 3x2, 1] → false
sees : [g from to wall | line : ray [from, to], line drop 1 take (line length - 2) all [c | at [g, c] != wall]]

-- the cells within r of one that can be seen from it (fog of war lifting round a player)
-- e.g. grid seen [grid make [5x5, 0], 3x3, 1, 1] length → 5
seen : [g from r wall | cells g keep [[c, v] | (vec distance [c, from] <= r) and (sees [g, from, c, wall])] collect [[c, v] | c]]
