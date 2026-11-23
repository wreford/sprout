-- orbit: things going round: the point on a circle at a turn, the turn a point is at, which way is out and which way
-- is along, whether a point is on a ring, the short way between two turns and how far apart they are, and where a
-- turning thing has got to. Turns run from 0 to 1 the way a clock's hand goes on a screen, y down: 0 is right, a
-- quarter is down. For orbit hoppers, clocks, radial menus, planets and anything on a wheel.

-- the point on a circle round a centre at a turn
-- e.g. orbit point [100x100, 50, 0.25] → 100x150
point : [centre radius turn | a : turn * 6.283185307179586, centre + (pair [a cos * radius, a sin * radius])]

-- the turn a point is at round a centre, from 0 up to 1
-- e.g. orbit turn-of [100x100, 100x150] → 0.25
-- e.g. orbit turn-of [0x0, -1x0] → 0.5
turn-of : [centre p | d : p - centre, t : d y atan2 (d x) / 6.283185307179586, (t < 0) [t + 1] else [t]]

-- the unit pair pointing out from the centre through a point
-- e.g. orbit outward [0x0, 0x10] → 0x1
outward : [centre p | d : p - centre, far : (d x * (d x) + (d y * (d y))) sqrt, (far = 0) [0x0] else [d / far]]

-- the unit pair along a circle at a turn, going round the way spin goes (1 the clock's way, -1 the other)
-- e.g. orbit along [0, 1] → 0x1
along : [turn spin | a : turn * 6.283185307179586, pair [0 - (a sin) * spin, a cos * spin]]

-- is a point on a ring, within slack of it?
-- e.g. orbit near [0x48, 0x0, 50, 4] → true
-- e.g. orbit near [0x40, 0x0, 50, 4] → false
near : [p centre radius slack | d : p - centre, ((d x * (d x) + (d y * (d y))) sqrt - radius) abs <= slack]

-- the short way from one turn to another, between -0.5 and 0.5
-- e.g. orbit gap [0.9, 0.1] → 0.2
-- e.g. orbit gap [0.1, 0.9] → -0.2
gap : [from to | d : to - from % 1, (d > 0.5) [d - 1] else [(d <= -0.5) [d + 1] else [d]]]

-- how far apart two turns are round a ring of a radius, the short way, as a distance
-- e.g. orbit apart [0, 0.25, 4] → 6.2831853072
apart : [from to radius | gap [from, to] abs * 6.283185307179586 * radius]

-- where a thing going round has got to after some seconds at spin turns a second, from 0 up to 1
-- e.g. orbit spun [0.75, 0.5, 1] → 0.25
-- e.g. orbit spun [0.1, -0.5, 1] → 0.6
spun : [turn spin seconds | t : turn + (spin * seconds) % 1, (t < 0) [t + 1] else [t]]
