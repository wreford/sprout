-- shape: the points of shapes, as lists of pairs, ready to draw or test. Nothing here draws: draw a shape's edges
-- with line, as in  shape edges (shape polygon [180x240, 50, 6]) each [[a, b] | line [a x, a y, b x, b y, "#fff"]]

-- n points evenly round a circle at centre c (a pair) with radius r
-- e.g. shape circle [0x0, 10, 4] collect [p | p x round] → [10, 0, -10, 0]
circle : [c r n | range n collect [k | k - 1 * 6.283185307179586 / n] collect [a | c + (pair [a cos * r, a sin * r])]]

-- a regular polygon with n sides, its first corner straight up
-- e.g. shape polygon [0x0, 10, 3] length → 3
polygon : [c r sides | range sides collect [k | k - 1 * 6.283185307179586 / sides - 1.5707963267948966] collect [a | c + (pair [a cos * r, a sin * r])]]

-- a star with n points, between radius outer and inner
-- e.g. shape star [0x0, 10, 5, 5] length → 10
star : [c outer inner n |
  range (n * 2) collect [k |
    a : k - 1 * 3.141592653589793 / n - 1.5707963267948966
    r : k % 2 = 1 [outer] else [inner]
    c + (pair [a cos * r, a sin * r])
  ]
]

-- the four corners of a box from its top-left corner and its size (both pairs)
-- e.g. shape box [0x0, 4x2] → [0x0, 4x0, 4x2, 0x2]
box : [corner size | [corner, corner + (pair [size x, 0]), corner + size, corner + (pair [0, size y])]]

-- the sides of a closed shape: each point with the next, the last with the first, as [a, b]
-- e.g. shape edges [0x0, 1x0, 0x1] length → 3
edges : [points | points zip (points rest .. [points first])]

-- the shape moved by a pair
-- e.g. shape move [[0x0, 1x1], 5x5] → [5x5, 6x6]
move : [points by | points collect [p | p + by]]

-- the shape turned round centre c by an angle in radians
-- e.g. shape turn [[1x0], 0x0, 3.141592653589793] collect [p | p x round] → [-1]
turn : [points c angle |
  points collect [p |
    d : p - c
    c + (pair [d x * (angle cos) - (d y * (angle sin)), d x * (angle sin) + (d y * (angle cos))])
  ]
]

-- the shape grown or shrunk round centre c
-- e.g. shape grow [[2x2], 1x1, 3] → [4x4]
grow : [points c times-bigger | points collect [p | p - c * times-bigger + c]]

-- the area inside a closed shape
-- e.g. shape area (shape box [0x0, 4x2]) → 8
area : [points | edges points collect [[a, b] | a x * (b y) - (b x * (a y))] sum / 2 abs]

-- the middle of the points
-- e.g. shape centre (shape box [0x0, 4x2]) → 2x1
centre : [points | points fold [0x0, [t p | t + p]] / (points length)]

-- the smallest box round the points, as [top-left, bottom-right]
-- e.g. shape bounds [3x1, 0x4, 2x2] → [0x1, 3x4]
bounds : [points |
  xs : points collect [p | p x]
  ys : points collect [p | p y]
  [pair [xs smallest, ys smallest], pair [xs largest, ys largest]]
]

-- is point p inside the closed shape?
-- e.g. shape holds [shape box [0x0, 4x2], 1x1] → true
holds : [points p |
  crossings : edges points count [[a, b] |
    ((a y > (p y)) != (b y > (p y))) and (p x < (b x - (a x) * (p y - (a y)) / (b y - (a y)) + (a x)))
  ]
  crossings % 2 = 1
]
