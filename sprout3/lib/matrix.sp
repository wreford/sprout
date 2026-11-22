-- matrix: grids of numbers kept as lists of rows: multiplying, turning over, determinants, inverses and solving
-- equations; and moves, turns and scales in 2D as 3x3 matrices that chain together and carry points.

-- the n x n identity matrix
-- e.g. matrix identity 2 → [[1, 0], [0, 1]]
identity : [n | range n collect [i | range n collect [j | (i = j) [1] else [0]]]]

-- a matrix with its rows and columns swapped
-- e.g. matrix transpose [[1, 2, 3], [4, 5, 6]] → [[1, 4], [2, 5], [3, 6]]
transpose : [m | range (m @ 1 length) collect [j | m collect [row | row @ j]]]

-- one matrix times another
-- e.g. matrix multiply [[[1, 2], [3, 4]], [[5, 6], [7, 8]]] → [[19, 22], [43, 50]]
multiply : [a b | cols : transpose b, a collect [row | cols collect [col | row zip col collect [[x, y] | x * y] sum]]]

-- a matrix times a list of numbers
-- e.g. matrix apply [[[1, 2], [3, 4]], [1, 1]] → [3, 7]
apply : [m v | m collect [row | row zip v collect [[x, y] | x * y] sum]]

-- the determinant of a square matrix
-- e.g. matrix determinant [[4, 7], [2, 6]] → 10
-- e.g. matrix determinant [[2, 0, 1], [1, 3, 2], [1, 1, 2]] → 6
determinant : [m |
  (m length = 1) [m @ 1 @ 1] else [
    (m length = 2) [m @ 1 @ 1 * (m @ 2 @ 2) - (m @ 1 @ 2 * (m @ 2 @ 1))] else [
      m @ 1 numbered collect [[j, v] |
        minor : m drop 1 collect [row | row numbered keep [[k, x] | k != j] collect [[k, x] | x]]
        v * (determinant minor) * ((j % 2 = 1) [1] else [-1])
      ] sum
    ]
  ]
]

-- the inverse of a square matrix, or false if it has none
-- e.g. matrix inverse [[4, 7], [2, 6]] → [[0.6, -0.7], [-0.2, 0.4]]
inverse : [m |
  det : determinant m
  n : m length
  minor : [i j | m numbered keep [[r, row] | r != i] collect [[r, row] | row numbered keep [[c, x] | c != j] collect [[c, x] | x]]]
  (det != 0) [
    (n = 1) [[[1 / det]]] else [range n collect [i | range n collect [j | determinant (minor [j, i]) * (((i + j) % 2 = 0) [1] else [-1]) / det]]]
  ] else [false]
]

-- the numbers that make m times them give v: equations solved together, or false
-- e.g. matrix solve [[[2, 1], [1, 3]], [3, 5]] → [0.8, 1.4]
solve : [m v | inv : inverse m, (inv != false) [apply [inv, v]] else [false]]

-- a 2D move by an offset
-- e.g. matrix point [matrix move 10x5, 1x1] → 11x6
move : [offset | [[1, 0, offset x], [0, 1, offset y], [0, 0, 1]]]

-- a 2D turn by an angle in radians, about 0x0
-- e.g. matrix point [matrix turn (pi / 2), 1x0] → 0x1
turn : [angle | c : angle cos, s : angle sin, [[c, 0 - s, 0], [s, c, 0], [0, 0, 1]]]

-- a 2D scale, across x down
-- e.g. matrix point [matrix scale 2x3, 1x1] → 2x3
scale : [factors | [[factors x, 0, 0], [0, factors y, 0], [0, 0, 1]]]

-- moves, turns and scales chained into one, the first done first
-- e.g. matrix point [matrix then [matrix scale 2x2, matrix move 10x0], 1x1] → 12x2
then : [steps | steps fold [identity 3, [m t | multiply [t, m]]]]

-- a point carried by a 2D matrix
-- e.g. matrix point [matrix then [matrix turn (pi / 2), matrix move 5x0], 2x0] → 5x2
point : [m p | v : apply [m, [p x, p y, 1]], pair [v @ 1, v @ 2]]
