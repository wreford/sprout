-- collide: does this touch that? A box is [x, y, w, h] (x, y its top-left corner) and a circle is [x, y, r]. Distilled from
-- the TaskIAP games: 30 of the 319 test what runs into what, and a tap on a button is the same question.

-- do two boxes overlap?
-- e.g. collide boxes [[0, 0, 10, 10], [5, 5, 10, 10]]
boxes : [a b | (a @ 1 < (b @ 1 + (b @ 3))) and (b @ 1 < (a @ 1 + (a @ 3))) and (a @ 2 < (b @ 2 + (b @ 4))) and (b @ 2 < (a @ 2 + (a @ 4)))]

-- do two circles overlap?
-- e.g. collide circles [[0, 0, 5], [8, 0, 5]]
circles : [a b | dist [a @ 1, a @ 2, b @ 1, b @ 2] < (a @ 3 + (b @ 3))]

-- is the point px, py inside the box?
-- e.g. collide in-box [3, 4, [0, 0, 10, 10]]
in-box : [px py b | (px >= (b @ 1)) and (px < (b @ 1 + (b @ 3))) and (py >= (b @ 2)) and (py < (b @ 2 + (b @ 4)))]

-- is the point px, py inside the circle? (a tap on a round button)
-- e.g. collide in-circle [3, 4, [0, 0, 5]]
in-circle : [px py c | dist [px, py, c @ 1, c @ 2] < (c @ 3)]

-- does a circle touch a box? (a ball and a brick)
-- e.g. collide circle-box [[12, 5, 3], [0, 0, 10, 10]]
circle-box : [c b |
  near-x : c @ 1 max (b @ 1) min (b @ 1 + (b @ 3))
  near-y : c @ 2 max (b @ 2) min (b @ 2 + (b @ 4))
  dist [c @ 1, c @ 2, near-x, near-y] < (c @ 3)
]

-- a point gone off one edge of a w by h screen, back on the other
-- e.g. collide wrap-around [105, -3, 100, 100]
wrap-around : [px py w h | pair [px % w, py % h]]
