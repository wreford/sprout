-- tiles: puzzle and board games on a grid (a list of rows, as in grid): rows of three, pieces falling into gaps,
-- 2048 slides and turns, straight lines across the board, and what can be seen from where. An empty cell is false.
-- Distilled from the TaskIAP games: 96 of the 319 are played on tiles, 53 match or merge them, 11 have fog of war.

-- the cells in runs of three or more alike, across or down, as [x, y] (for match-three)
-- e.g. tiles runs [[1, 1, 1, 2], [3, 2, 3, 2], [3, 2, 1, 2]] length
runs : [g |
  same : [row s v | (s >= 1) and (s + 2 <= (row length)) [(row @ s = v) and (row @ (s + 1) = v) and (row @ (s + 2) = v)] else [false]]
  in-run : [row i | v : row @ i, (v != false) and ((same [row, i - 2, v]) or (same [row, i - 1, v]) or (same [row, i, v]))]
  columns : range (g @ 1 length) collect [x | g collect [row | row @ x]]
  across : g numbered collect-flat [[y, row] | range (row length) keep [x | in-run [row, x]] collect [x | [x, y]]]
  down : columns numbered collect-flat [[x, column] | range (column length) keep [y | in-run [column, y]] collect [y | [x, y]]]
  across .. down distinct
]

-- the grid with its pieces fallen into the gaps (false) below them, and the gaps risen to the top
-- e.g. tiles fall [[1, 2], [false, 3], [4, false]]
fall : [g |
  columns : range (g @ 1 length) collect [x | g collect [row | row @ x]]
  settled : columns collect [column | kept : column keep [v | v != false], range (column length - (kept length)) collect [k | false] .. kept]
  range (g length) collect [y | settled collect [column | column @ y]]
]

-- a row slid toward its start, 2048-style: alike neighbours merge, each only once. [row, points], points being what
-- the merges made
-- e.g. tiles slide [2, 2, 4, false]
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
-- e.g. tiles turn [[1, 2], [3, 4]]
turn : [g | range (g @ 1 length) collect [x | g reverse collect [row | row @ x]]]

-- the cells on the straight line from one cell to another, both ends included (aiming, laser beams, line of sight)
-- e.g. tiles ray [1, 1, 4, 2]
ray : [x1 y1 x2 y2 |
  n : x2 - x1 abs max (y2 - y1 abs) max 1
  range (n + 1) collect [k | t : k - 1 / n, [x2 - x1 * t + x1 round, y2 - y1 * t + y1 round]] distinct
]

-- can the cell at x2, y2 be seen from x1, y1, with no wall on a cell between?
-- e.g. tiles sees [[[0, 0, 0], [0, 1, 0], [0, 0, 0]], 1, 2, 3, 2, 1]
sees : [g x1 y1 x2 y2 wall | line : ray [x1, y1, x2, y2], line drop 1 take (line length - 2) all [[a, b] | grid at [g, a, b] != wall]]

-- the cells within r of cx, cy that can be seen from there (fog of war lifting round a player)
-- e.g. tiles seen [grid make [5, 5, 0], 3, 3, 1, 1] length
seen : [g cx cy r wall | grid cells g keep [[a, b, v] | (a - cx * (a - cx) + (b - cy * (b - cy)) <= (r * r)) and (sees [g, cx, cy, a, b, wall])] collect [[a, b, v] | [a, b]]]
