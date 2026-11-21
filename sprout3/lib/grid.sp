-- grid: a grid is a list of rows, each a list of cells, counted from 1 like every Sprout list.
-- Read and change cells by x (across) and y (down), find neighbours, flood-fill and find the shortest way through.

-- a grid width by height with every cell the same
-- e.g. grid make [3, 2, 0]
make : [width height value | range height collect [row | range width collect [column | value]]]

-- how wide and how tall, as a pair
-- e.g. grid size (grid make [3, 2, 0])
size : [g | pair [g @ 1 length, g length]]

-- is x, y on the grid?
-- e.g. grid inside [grid make [3, 2, 0], 3, 3]
inside : [g x y | (x >= 1) and (y >= 1) and (y <= (g length)) and (x <= (g @ 1 length))]

-- the cell at x, y (false off the grid)
-- e.g. grid at [[[1, 2], [3, 4]], 2, 1]
at : [g x y | inside [g, x, y] [g @ y @ x] else [false]]

-- a new grid with the cell at x, y changed
-- e.g. grid put [grid make [3, 2, 0], 2, 1, 9]
put : [g x y value | g set-in [[y, x], value]]

-- the four cells beside x, y (up, right, down, left) that are on the grid, as [x, y]
-- e.g. grid beside [grid make [3, 3, 0], 1, 1]
beside : [g x y | [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]] keep [[a, b] | inside [g, a, b]]]

-- the eight cells round x, y that are on the grid, as [x, y]
-- e.g. grid around [grid make [3, 3, 0], 1, 1] length
around : [g x y | [[x - 1, y - 1], [x, y - 1], [x + 1, y - 1], [x - 1, y], [x + 1, y], [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]] keep [[a, b] | inside [g, a, b]]]

-- how many of the eight cells round x, y hold value (for Life and minesweeper)
-- e.g. grid count-around [[[1, 1, 0], [0, 0, 0], [0, 1, 1]], 2, 2, 1]
count-around : [g x y value | around [g, x, y] count [[a, b] | g @ b @ a = value]]

-- every cell with where it is: a list of [x, y, value]
-- e.g. grid cells [[1, 2], [3, 4]]
cells : [g | g numbered collect-flat [[y, row] | row numbered collect [[x, value] | [x, y, value]]]]

-- a new grid made by a cell given [x, y, value] for every cell
-- e.g. grid map [[[1, 2], [3, 4]], [[x, y, v] | v * 10]]
map : [g change | g numbered collect [[y, row] | row numbered collect [[x, value] | change [x, y, value]]]]

-- the cells joined from x, y through cells of the same value, as [x, y]
-- e.g. grid region [[[1, 1, 0], [0, 1, 0], [0, 1, 1]], 1, 1] length
region : [g x y |
  value : at [g, x, y]
  grow : [found frontier |
    frontier length = 0 [found] else [
      next : frontier collect-flat [[a, b] | beside [g, a, b]] keep [[a, b] | at [g, a, b] = value] distinct keep [p | (found has p) not]
      grow [found .. next, next]
    ]
  ]
  grow [[[x, y]], [[x, y]]]
]

-- a new grid with the region at x, y changed to value
-- e.g. grid fill [[[1, 1, 0], [0, 1, 0]], 1, 1, 7]
fill : [g x y value | region [g, x, y] fold [g, [h [a, b] | put [h, a, b, value]]]]

-- the shortest way from one cell to another, stepping only on cells that pass the test, as a list of [x, y]
-- (false if there is no way)
-- e.g. grid path [[[0, 0, 0], [1, 1, 0], [0, 0, 0]], [1, 1], [1, 3], [v | v = 0]]
path : [g start goal open |
  key : [[a, b] | "[a],[b]"]
  search : [frontier came |
    cond [
      frontier length = 0, false
      came has-field (key goal), came
      any, (
        steps : frontier collect-flat [p | beside [g, p @ 1, p @ 2] keep [q | open (at [g, q @ 1, q @ 2])] collect [q | [q, p]]]
        fresh : steps keep [[q, p] | (came has-field (key q)) not] distinct-by [[q, p] | key q]
        search [fresh collect [[q, p] | q], fresh fold [came, [c [q, p] | c set-in [key q, p]]]]
      )
    ]
  ]
  came : search [[start], [] set-in [key start, start]]
  back : [p trail | p = start [[start] .. trail] else [back [came get-in [key p], [p] .. trail]]]
  (came = false) not [back [goal, []]] else [false]
]

-- the grid as lines of text, one per row
-- e.g. grid show [[1, 2], [3, 4]]
show : [g | g collect [row | row collect [v | v str] join " "] join "\n"]
