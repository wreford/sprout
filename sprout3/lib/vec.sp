-- vec: two-dimensional vectors, written as pairs like 3x4. Pairs already add, take away, multiply and divide.
-- These are the other things a game needs: length, direction, angle, rotation.

-- a vector from two numbers
-- e.g. vec of [3, 4]
of : [x y | pair [x, y]]

-- a vector one long, pointing at an angle (in radians)
-- e.g. vec from-angle 0
from-angle : [angle | pair [angle cos, angle sin]]

-- how long a vector is
-- e.g. vec size 3x4
size : [v | v x * (v x) + (v y * (v y)) sqrt]

-- the same direction, one long
-- e.g. vec unit 3x4
unit : [v | n : size v, n = 0 [v] else [v / n]]

-- the angle a vector points at, in radians
-- e.g. vec angle 0x1
angle : [v | v y atan2 (v x)]

-- turned round by an angle, in radians
-- e.g. vec rotate [1x0, 1.5707963267948966]
rotate : [v turn | pair [v x * (turn cos) - (v y * (turn sin)), v x * (turn sin) + (v y * (turn cos))]]

-- how much two vectors point the same way
-- e.g. vec dot [1x0, 0x1]
dot : [a b | a x * (b x) + (a y * (b y))]

-- the distance between two points
-- e.g. vec distance [0x0, 3x4]
distance : [a b | size (b - a)]

-- part of the way from a to b: t of 0 is a, 1 is b
-- e.g. vec mix [0x0, 10x20, 0.5]
mix : [a b t | b - a * t + a]

-- no longer than most, in the same direction
-- e.g. vec limit [30x40, 5]
limit : [v most | size v > most [unit v * most] else [v]]

-- bounced off a surface facing the way of n (n one long)
-- e.g. vec reflect [1x-1, 0x1]
reflect : [v n | v - (n * (2 * (dot [v, n])))]

-- turned a quarter to the left
-- e.g. vec perpendicular 1x0
perpendicular : [v | pair [0 - (v y), v x]]
