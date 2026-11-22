-- geo: places on Earth, each a pair of latitude x longitude in degrees (south and west negative): how far apart, which
-- way, where you end up, halfway, the nearest place, and a flat map in kilometres around a point. Distances are in km
-- on a round Earth, close enough for maps and games.

radius : 6371
rad : [d | d * pi / 180]
deg : [r | r * 180 / pi]

-- the distance between two places, in km
-- e.g. geo distance [51.5074x-0.1278, 48.8566x2.3522] round → 344
distance : [a b |
  dlat : rad (b x - (a x))
  dlon : rad (b y - (a y))
  h : dlat / 2 sin pow 2 + ((rad (a x)) cos * ((rad (b x)) cos) * (dlon / 2 sin pow 2))
  h sqrt atan2 (1 - h sqrt) * 2 * radius
]

-- the compass bearing to set off on from one place to reach another, in degrees from north
-- e.g. geo bearing [51.5074x-0.1278, 48.8566x2.3522] round → 148
bearing : [a b |
  p1 : rad (a x)
  p2 : rad (b x)
  dl : rad (b y - (a y))
  across : dl sin * (p2 cos)
  up : p1 cos * (p2 sin) - (p1 sin * (p2 cos) * (dl cos))
  deg (across atan2 up) + 360 % 360
]

-- where you end up going km from a place on a bearing
-- e.g. vec round (geo destination [0x0, 90, 111.19]) → 0x1
destination : [from heading km |
  d : km / radius
  t : rad heading
  p1 : rad (from x)
  l1 : rad (from y)
  s2 : p1 sin * (d cos) + (p1 cos * (d sin) * (t cos))
  p2 : s2 atan2 (1 - (s2 * s2) sqrt)
  l2 : l1 + (t sin * (d sin) * (p1 cos) atan2 (d cos - (p1 sin * s2)))
  pair [deg p2, deg l2 + 540 % 360 - 180]
]

-- the place halfway between two others
-- e.g. vec round (geo midpoint [0x0, 0x90]) → 0x45
midpoint : [a b |
  p1 : rad (a x)
  p2 : rad (b x)
  dl : rad (b y - (a y))
  bx : p2 cos * (dl cos)
  by : p2 cos * (dl sin)
  pm : p1 sin + (p2 sin) atan2 (p1 cos + bx pow 2 + (by * by) sqrt)
  lm : rad (a y) + (by atan2 (p1 cos + bx))
  pair [deg pm, deg lm]
]

-- a place as km east x km north of an origin, on a flat map (good for a city, not a continent)
-- e.g. vec round (geo to-xy [51.5x0.1, 51.5x0]) → 7x0
to-xy : [p origin | pair [rad (p y - (origin y)) * radius * ((rad (origin x)) cos), rad (p x - (origin x)) * radius]]

-- a bearing as one of the eight compass points
-- e.g. geo compass 148 → SE
compass : [heading | ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] @ (heading / 45 round % 8 + 1)]

-- a place written out with N, S, E and W
-- e.g. geo written 51.5074x-0.1278 → 51.5074° N, 0.1278° W
written : [p |
  ns : (p x < 0) ["S"] else ["N"]
  ew : (p y < 0) ["W"] else ["E"]
  lat : p x abs fixed 4
  lon : p y abs fixed 4
  "[lat]° [ns], [lon]° [ew]"
]

-- are two places within km of each other?
-- e.g. geo within [51.5074x-0.1278, 48.8566x2.3522, 300] → false
within : [a b km | distance [a, b] <= km]

-- the nearest of some places to p
-- e.g. geo nearest [[48.8566x2.3522, 40.7128x-74.006], 51.5074x-0.1278] → 48.8566x2.3522
nearest : [places p | places smallest-by [q | distance [q, p]]]
