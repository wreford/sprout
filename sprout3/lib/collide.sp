-- collide: does this touch that? A point is a pair; a box is [at, size] (at its top-left corner) and a circle [at, r]
-- (at its centre). Distilled from the TaskIAP games: 30 of the 319 test what runs into what, and a tap on a button is
-- the same question.

-- do two boxes overlap?
-- e.g. collide boxes [[at : 0x0, size : 10x10], [at : 5x5, size : 10x10]] → true
boxes : [a b | (a at x < (b at x + (b size x))) and (b at x < (a at x + (a size x))) and (a at y < (b at y + (b size y))) and (b at y < (a at y + (a size y)))]

-- do two circles overlap?
-- e.g. collide circles [[at : 0x0, r : 5], [at : 8x0, r : 5]] → true
circles : [a b | vec distance [a at, b at] < (a r + (b r))]

-- is a point inside a box? (a tap on a button)
-- e.g. collide in-box [3x4, [at : 0x0, size : 10x10]] → true
in-box : [p b | (p x >= (b at x)) and (p x < (b at x + (b size x))) and (p y >= (b at y)) and (p y < (b at y + (b size y)))]

-- is a point inside a circle?
-- e.g. collide in-circle [3x4, [at : 0x0, r : 5]] → false
in-circle : [p c | vec distance [p, c at] < (c r)]

-- does a circle touch a box? (a ball and a brick)
-- e.g. collide circle-box [[at : 12x5, r : 3], [at : 0x0, size : 10x10]] → true
circle-box : [c b | near : pair [c at x max (b at x) min (b at x + (b size x)), c at y max (b at y) min (b at y + (b size y))], vec distance [c at, near] < (c r)]

-- a point gone off one edge of a screen of size, back on the other
-- e.g. collide wrap-around [pair [105, -3], 100x100] → 5x97
wrap-around : [p size | pair [p x % (size x), p y % (size y)]]
