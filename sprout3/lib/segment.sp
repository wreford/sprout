-- segment: straight lines between two points, a segment written [from, to] with both ends pairs: how long, the middle,
-- the nearest point to something, where two segments cross, which side a point is on. For lasers, walls, line of
-- sight, cutting and ropes.

-- how long a segment is
-- e.g. segment size [0x0, 3x4] → 5
size : [seg | vec distance [seg @ 1, seg @ 2]]

-- the middle of a segment
-- e.g. segment middle [0x0, 4x2] → 2x1
middle : [seg | seg @ 1 + (seg @ 2) / 2]

-- the point a share t of the way along a segment
-- e.g. segment along [[0x0, 10x0], 0.25] → 2.5x0
along : [seg t | seg @ 2 - (seg @ 1) * t + (seg @ 1)]

-- the point on a segment nearest to p
-- e.g. segment closest [[0x0, 10x0], 3x5] → 3x0
-- e.g. segment closest [[0x0, 10x0], pair [-4, 2]] → 0x0
closest : [seg p |
  a : seg @ 1
  d : seg @ 2 - a
  len2 : vec dot [d, d]
  (len2 = 0) [a] else [d * (vec dot [p - a, d] / len2 max 0 min 1) + a]
]

-- how far p is from a segment
-- e.g. segment distance-to [[0x0, 10x0], 3x5] → 5
distance-to : [seg p | vec distance [closest [seg, p], p]]

-- where two segments cross, or false if they don't
-- e.g. segment cross [[0x0, 4x4], [0x4, 4x0]] → 2x2
-- e.g. segment cross [[0x0, 1x1], [2x0, 3x1]] → false
cross : [one two |
  p : one @ 1
  r : one @ 2 - p
  q : two @ 1
  s : two @ 2 - q
  denom : r x * (s y) - (r y * (s x))
  (denom != 0) [
    qp : q - p
    t : qp x * (s y) - (qp y * (s x)) / denom
    u : qp x * (r y) - (qp y * (r x)) / denom
    ((t >= 0) and (t <= 1) and (u >= 0) and (u <= 1)) [r * t + p] else [false]
  ] else [false]
]

-- do two segments cross?
-- e.g. segment crosses [[0x0, 4x4], [0x4, 4x0]] → true
crosses : [one two | cross [one, two] != false]

-- which side of a segment's line p is on: 1 one way, -1 the other, 0 on the line
-- e.g. segment side [[0x0, 10x0], 5x5] → 1
-- e.g. segment side [[0x0, 10x0], 5x0] → 0
side : [seg p | a : seg @ 1, d : seg @ 2 - a, w : p - a, d x * (w y) - (d y * (w x)) sign]

-- the direction a segment points, as an angle in radians
-- e.g. segment angle [0x0, 0x5] → 1.5707963268
angle : [seg | d : seg @ 2 - (seg @ 1), d y atan2 (d x)]

-- a segment's normal: one long, square to it
-- e.g. segment normal [0x0, 10x0] → 0x1
normal : [seg | vec perpendicular (vec unit (seg @ 2 - (seg @ 1)))]

-- n + 1 points evenly along a segment, both ends included
-- e.g. segment points [[0x0, 10x0], 2] → [0x0, 5x0, 10x0]
points : [seg n | range (n + 1) collect [k | along [seg, k - 1 / n]]]
