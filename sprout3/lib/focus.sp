-- focus: boxes on a screen that a finger taps or the arrows move between, so a menu, a shop or a board works by touch
-- and by keys alike. A box is a record with at (its top left) and size, both pairs; places count from 1.

-- the place of the first box that holds a point, 0 when none does
-- e.g. focus hit [[[at : 0x0, size : 10x10], [at : 20x0, size : 10x10]], 25x5] → 2
-- e.g. focus hit [[[at : 0x0, size : 10x10]], 50x50] → 0
hit : [boxes point |
  holding : boxes numbered keep [[i, b] | (point x >= (b at x)) and (point x < (b at x + (b size x))) and (point y >= (b at y)) and (point y < (b at y + (b size y)))] collect [[i, b] | i]
  (holding length > 0) [holding @ 1] else [0]
]

-- the middle of a box
-- e.g. focus middle [at : 10x20, size : 10x4] → 15x22
middle : [box | box at + (box size / 2)]

-- the place moved by a step of the arrows: across goes to the next box or the one before, round the ends; up and down
-- go to the nearest box above or below, staying put when there is none
-- e.g. focus step [[[at : 0x0, size : 10x10], [at : 20x0, size : 10x10], [at : 0x30, size : 10x10]], 1, 1x0] → 2
-- e.g. focus step [[[at : 0x0, size : 10x10], [at : 20x0, size : 10x10], [at : 0x30, size : 10x10]], 2, 0x1] → 3
-- e.g. focus step [[[at : 0x0, size : 10x10], [at : 0x30, size : 10x10]], 1, pair [0, -1]] → 1
-- e.g. focus step [[[at : 0x0, size : 10x10], [at : 20x0, size : 10x10]], 1, pair [-1, 0]] → 2
step : [boxes place way |
  n-boxes : boxes length
  here : middle (boxes @ place)
  rise : way y
  across : place - 1 + (way x) % n-boxes + n-boxes % n-boxes + 1
  ahead : boxes numbered keep [[i, b] | gap : middle b y - (here y), ((rise > 0) and (gap > 2)) or ((rise < 0) and (gap + 2 < 0))]
  scored : ahead collect [[i, b] | m : middle b, [i, m y - (here y) abs * 2 + (m x - (here x) abs)]]
  nearest : (scored length > 0) [scored sort-by [s | s @ 2] @ 1 @ 1] else [place]
  (rise = 0) [across] else [nearest]
]

-- the box drawn round a place, a little bigger, for a cursor
-- e.g. focus ring [[[at : 10x10, size : 20x10]], 1, 2] → [at : 8x8, size : 24x14]
ring : [boxes place grow | b : boxes @ place, [at : b at - (pair [grow, grow]), size : b size + (pair [grow * 2, grow * 2])]]
