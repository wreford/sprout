-- hex: grids of hexagons, the board of strategy games, in axial coordinates [q, r] (the third, s, is 0 - q - r), with
-- the points upward. Distilled from the TaskIAP strategy games: 23 of the 319 play on hexes.

-- the six neighbours of a hex
-- e.g. hex around [0, 0]
around : [h | [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]] collect [[dq, dr] | [h @ 1 + dq, h @ 2 + dr]]]

-- how many steps from one hex to another
-- e.g. hex steps [[0, 0], [2, -1]]
steps : [a b | dq : a @ 1 - (b @ 1), dr : a @ 2 - (b @ 2), dq abs + (dr abs) + (dq + dr abs) / 2]

-- every hex within n steps of a hex
-- e.g. hex within [[0, 0], 1] length
within : [h n |
  span : range (n * 2 + 1) collect [i | i - n - 1]
  span collect-flat [dq | span keep [dr | dq + dr abs <= n] collect [dr | [h @ 1 + dq, h @ 2 + dr]]]
]

-- where a hex's centre is on screen, for hexes size from centre to corner
-- e.g. hex to-screen [[1, 1], 10]
to-screen : [h size | pair [h @ 1 + (h @ 2 / 2) * size * (3 sqrt), h @ 2 * size * 1.5]]

-- the nearest whole hex to a point given in fractional axial coordinates
-- e.g. hex snap [0.6, 0.7]
snap : [h |
  q : h @ 1, r : h @ 2, s : 0 - q - r
  rq : q round, rr : r round, rs : s round
  dq : rq - q abs, dr : rr - r abs, ds : rs - s abs
  cond [(dq > dr) and (dq > ds), [0 - rr - rs, rr], dr > ds, [rq, 0 - rq - rs], any, [rq, rr]]
]

-- the hex under a point on screen (a tap), for hexes size from centre to corner
-- e.g. hex from-screen [26, 15, 10]
from-screen : [px py size | snap [3 sqrt / 3 * px - (py / 3) / size, 2 / 3 * py / size]]
