-- spline: curves from points: Bézier curves pulled toward their control points, smooth curves through every point,
-- and paths of straight legs, with how long a path is, where you are a distance along it and which way you face. For
-- enemies on rails, camera moves, roads and drawing. Points are pairs.

-- the point t of the way along a Bézier curve (any number of control points)
-- e.g. spline bezier [[0x0, 5x10, 10x0], 0.5] → 5x5
bezier : [points t | (points length = 1) [points @ 1] else [bezier [points windows 2 collect [[a, b] | b - a * t + a], t]]]

-- the point t of the way along a smooth curve through every point (Catmull-Rom)
-- e.g. spline through [[0x0, 10x10, 20x0], 0.5] → 10x10
-- e.g. vec round (spline through [[0x0, 10x10, 20x0], 0.25]) → 4x6
through : [points t |
  n : points length
  s : t max 0 min 1 * (n - 1)
  i : s floor min (n - 2)
  u : s - i
  p1 : points @ (i + 1)
  p2 : points @ (i + 2)
  p0 : (i > 0) [points @ i] else [p1]
  p3 : (i + 3 <= n) [points @ (i + 3)] else [p2]
  a : p1 * 2
  b : p2 - p0 * u
  c : p0 * 2 - (p1 * 5) + (p2 * 4) - p3 * (u * u)
  d : p1 * 3 - p0 - (p2 * 3) + p3 * (u * u * u)
  a + b + c + d * 0.5
]

-- how long a path of straight legs is
-- e.g. spline path-length [0x0, 3x4, 3x10] → 11
path-length : [points | points windows 2 collect [[a, b] | vec distance [a, b]] sum]

-- the point d along a path of straight legs (the end, past its length)
-- e.g. spline at-distance [[0x0, 10x0, 10x10], 15] → 10x5
at-distance : [points d |
  walk : points windows 2 fold [[to-go : d max 0, at : points @ 1, done : false], [s [a, b] |
    s done [s] else [
      leg : vec distance [a, b]
      spot : (leg = 0) [a] else [b - a * (s to-go / leg) + a]
      still : s to-go - leg
      (s to-go <= leg) [[to-go : 0, at : spot, done : true]] else [[to-go : still, at : b, done : false]]
    ]
  ]]
  walk at
]

-- which way a path faces d along it, as an angle in radians
-- e.g. spline heading [[0x0, 10x0, 10x10], 15] → 1.5707963268
heading : [points d |
  legs : points windows 2
  starts : legs scan [0, [total [a, b] | total + (vec distance [a, b])]]
  k : range (legs length) find [i | d < (starts @ (i + 1))]
  leg : legs @ ((k != false) [k] else [legs length])
  vec angle (leg @ 2 - (leg @ 1))
]

-- the point on a path nearest to p
-- e.g. spline nearest-point [[0x0, 10x0, 10x10], 12x4] → 10x4
nearest-point : [points p | points windows 2 collect [leg | segment closest [leg, p]] smallest-by [q | vec distance [q, p]]]

-- n + 1 points along a Bézier curve, for drawing it
-- e.g. spline curve [[0x0, 5x10, 10x0], 2] → [0x0, 5x5, 10x0]
curve : [points n | range (n + 1) collect [k | bezier [points, k - 1 / n]]]

-- n + 1 points along a smooth curve through every point, for drawing it
-- e.g. spline smooth [[0x0, 10x10, 20x0], 4] length → 5
smooth : [points n | range (n + 1) collect [k | through [points, k - 1 / n]]]

-- a path with the points that hardly change its shape taken out (Ramer-Douglas-Peucker), none moving it more than
-- tolerance
-- e.g. spline simplify [[0x0, 1x0.1, 2x0, 3x0.1, 4x0], 0.5] → [0x0, 4x0]
-- e.g. spline simplify [[0x0, 1x0, 2x0, 2x1, 2x2], 0.1] → [0x0, 2x0, 2x2]
simplify : [points tolerance |
  (points length < 3) [points] else [
    a : points @ 1
    b : points @ (points length)
    inner : points drop 1 take (points length - 2) numbered
    far : inner largest-by [[i, p] | segment distance-to [[a, b], p]]
    (segment distance-to [[a, b], far @ 2] > tolerance) [
      k : far @ 1 + 1
      simplify [points take k, tolerance] all-but-last .. (simplify [points drop (k - 1), tolerance])
    ] else [[a, b]]
  ]
]
