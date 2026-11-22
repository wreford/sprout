-- gesture: reading fingers and sticks: swipes, taps, long presses and double taps, pinches and twists, flicks, a
-- stick's direction and its dead zone. Points are pairs on screen, across x down (y grows downward).

-- the way a finger swiped from one point to another, "left", "right", "up" or "down", or false when it moved less
-- than least
-- e.g. gesture swipe [100x100, 40x110, 30] → left
-- e.g. gesture swipe [100x100, 105x90, 30] → false
swipe : [from to least |
  d : to - from
  (vec size d >= least) [(d x abs >= (d y abs)) [(d x > 0) ["right"] else ["left"]] else [(d y > 0) ["down"] else ["up"]]] else [false]
]

-- which of eight ways a stick points, or false inside the dead zone
-- e.g. gesture stick-direction [0.7x-0.7, 0.2] → up-right
stick-direction : [v dead |
  names : ["right", "down-right", "down", "down-left", "left", "up-left", "up", "up-right"]
  (vec size v > dead) [names @ (v y atan2 (v x) / (pi / 4) round % 8 + 1)] else [false]
]

-- a stick's push with a dead zone in the middle, so a resting thumb doesn't drift, growing smoothly from the edge
-- of it to 1
-- e.g. gesture dead-zone [0.6x0, 0.2] → 0.5x0
dead-zone : [v dead | far : vec size v, (far <= dead) [0x0] else [v / far * (far - dead / (1 - dead) min 1)]]

-- was a touch a tap: held briefly without moving far?
-- e.g. gesture tap [3, 0.12] → true
tap : [moved held | (moved < 10) and (held < 0.25)]

-- was a touch a long press: held still for half a second or more?
-- e.g. gesture long-press [4, 0.8] → true
long-press : [moved held | (moved < 10) and (held >= 0.5)]

-- is a tap now the second of a double tap?
-- e.g. gesture double-tap [10.1, 10.32] → true
double-tap : [last-tap now | now - last-tap < 0.3]

-- how much two fingers pinched: the new gap between them over the old one (above 1 spreads apart)
-- e.g. gesture pinch [[0x0, 100x0], [0x0, 150x0]] → 1.5
pinch : [before after | vec distance [after @ 1, after @ 2] / (vec distance [before @ 1, before @ 2])]

-- how far two fingers turned, in radians
-- e.g. gesture twist [[0x0, 100x0], [0x0, 0x100]] → 1.5707963268
twist : [before after |
  a : before @ 2 - (before @ 1)
  b : after @ 2 - (after @ 1)
  b y atan2 (b x) - (a y atan2 (a x)) + pi % (pi * 2) - pi
]

-- the speed of a flick, from where a finger was to where it let go, over the seconds between
-- e.g. gesture flick [0x0, 30x-12, 0.1] → 300x-120
flick : [from to seconds | to - from / seconds]
