-- vec: two-dimensional vectors, written as pairs like 3x4. Pairs already add, take away, multiply and divide.
-- These are the other things a game needs: length, direction, angle, rotation.

-- a vector from two numbers
-- e.g. vec of [3, 4] → 3x4
of : [x y | pair [x, y]]

-- a vector one long, pointing at an angle (in radians)
-- e.g. vec from-angle 0 → 1x0
from-angle : [angle | pair [angle cos, angle sin]]

-- how long a vector is
-- e.g. vec size 3x4 → 5
size : [v | v x * (v x) + (v y * (v y)) sqrt]

-- the same direction, one long
-- e.g. vec unit 3x4 → 0.6x0.8
unit : [v | n : size v, n = 0 [v] else [v / n]]

-- the angle a vector points at, in radians
-- e.g. vec angle 0x1 → 1.5707963268
angle : [v | v y atan2 (v x)]

-- turned round by an angle, in radians
-- e.g. vec rotate [1x0, 1.5707963267948966] → 0x1
rotate : [v turn | pair [v x * (turn cos) - (v y * (turn sin)), v x * (turn sin) + (v y * (turn cos))]]

-- how much two vectors point the same way
-- e.g. vec dot [1x0, 0x1] → 0
dot : [a b | a x * (b x) + (a y * (b y))]

-- the distance between two points
-- e.g. vec distance [0x0, 3x4] → 5
distance : [a b | size (b - a)]

-- part of the way from a to b: t of 0 is a, 1 is b
-- e.g. vec mix [0x0, 10x20, 0.5] → 5x10
mix : [a b t | b - a * t + a]

-- no longer than most, in the same direction
-- e.g. vec limit [30x40, 5] → 3x4
limit : [v most | size v > most [unit v * most] else [v]]

-- bounced off a surface facing the way of n (n one long)
-- e.g. vec reflect [1x-1, 0x1] → 1x1
reflect : [v n | v - (n * (2 * (dot [v, n])))]

-- turned a quarter to the left
-- e.g. vec perpendicular 1x0 → 0x1
perpendicular : [v | pair [0 - (v y), v x]]

-- a vector with both parts rounded (for a point on screen, or a cell)
-- e.g. vec round 1.4x2.6 → 1x3
round : [v | pair [v x round, v y round]]

-- a point moved toward another by at most step, never past it
-- e.g. vec toward [0x0, 10x0, 4] → 4x0
toward : [from to step | gap : to - from, far : size gap, (far <= step) [to] else [gap / far * step + from]]

-- the velocity that heads from one point to another at speed (a shot aimed at a player)
-- e.g. vec aim [0x0, 3x4, 10] → 6x8
aim : [from to speed | gap : to - from, far : size gap, (far = 0) [0x0] else [gap / far * speed]]

-- n copies of a velocity fanned out across an angle (radians), for a spread of shots
-- e.g. vec fan [10x0, 3, pi] collect [v | vec round v] → [0x-10, 10x0, 0x10]
fan : [v n spread | (n = 1) [[v]] else [range n collect [k | rotate [v, k - 1 / (n - 1) - 0.5 * spread]]]]
