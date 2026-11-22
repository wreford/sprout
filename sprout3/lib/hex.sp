-- hex: grids of hexagons, the board of strategy games. A hex is a pair q x r in axial coordinates (the third, s, is
-- 0 - q - r), pointed upward. Distilled from the TaskIAP games: 23 of the 319 play on hexes.

-- the six hexes round one
-- e.g. hex around 0x0 → [1x0, 1x-1, 0x-1, -1x0, -1x1, 0x1]
around : [h | [1x0, pair [1, -1], pair [0, -1], pair [-1, 0], pair [-1, 1], 0x1] collect [d | h + d]]

-- how many steps from one hex to another
-- e.g. hex steps [0x0, pair [2, -1]] → 2
steps : [a b | d : a - b, d x abs + (d y abs) + (d x + (d y) abs) / 2]

-- every hex within n steps of one
-- e.g. hex within [0x0, 2] length → 19
within : [h n | span : range (n * 2 + 1) collect [i | i - n - 1], span collect-flat [q | span keep [r | q + r abs <= n] collect [r | h + (pair [q, r])]]]

-- where a hex's centre is on screen, for hexes size from centre to corner
-- e.g. vec round (hex to-screen [1x1, 10]) → 26x15
to-screen : [h size | pair [h x + (h y / 2) * size * (3 sqrt), h y * size * 1.5]]

-- the nearest whole hex to fractional axial coordinates
-- e.g. hex snap 0.6x0.7 → 0x1
snap : [h |
  q : h x
  r : h y
  s : 0 - q - r
  rq : q round
  rr : r round
  rs : s round
  dq : rq - q abs
  dr : rr - r abs
  ds : rs - s abs
  cond [(dq > dr) and (dq > ds), pair [0 - rr - rs, rr], dr > ds, pair [rq, 0 - rq - rs], any, pair [rq, rr]]
]

-- the hex under a point on screen (a tap), for hexes size from centre to corner
-- e.g. hex from-screen [26x15, 10] → 1x1
from-screen : [p size | snap (pair [3 sqrt / 3 * (p x) - (p y / 3) / size, 2 / 3 * (p y) / size])]
