-- ease: easing curves for animation. Each takes t, from 0 to 1, and gives a value that starts at 0 and ends at 1.
-- Use one to move something smoothly: x : ease out-cubic (ease progress [elapsed, 2]) * 300

-- straight along, at one speed
-- e.g. ease linear 0.25
linear : [t | t]

-- starts slow, speeds up
-- e.g. ease in-quad 0.5
in-quad : [t | t * t]

-- starts fast, slows down
-- e.g. ease out-quad 0.5
out-quad : [t | 2 - t * t]

-- slow at both ends
-- e.g. ease in-out-quad 0.25
in-out-quad : [t | t < 0.5 [2 * t * t] else [4 - (2 * t) * t - 1]]

-- starts slower still
-- e.g. ease in-cubic 0.5
in-cubic : [t | t * t * t]

-- arrives gently: the usual choice for things that slide into place
-- e.g. ease out-cubic 0.5
out-cubic : [t | t - 1 * (t - 1) * (t - 1) + 1]

-- slow at both ends, more so than in-out-quad
-- e.g. ease in-out-cubic 0.75
in-out-cubic : [t | t < 0.5 [4 * t * t * t] else [t - 1 * (2 * t - 2) * (2 * t - 2) + 1]]

-- goes a little past the end, then settles back
-- e.g. ease out-back 0.8
out-back : [t |
  past : 1.70158
  u : t - 1
  past + 1 * u * u * u + (past * u * u) + 1
]

-- springs past the end and wobbles to a stop
-- e.g. ease out-elastic 0.3
out-elastic : [t | cond [t <= 0, 0, t >= 1, 1, any, 2 pow (-10 * t) * (t * 10 - 0.75 * 2.0943951023931953 sin) + 1]]

-- bounces like a dropped ball
-- e.g. ease out-bounce 0.9
out-bounce : [t |
  n : 7.5625
  cond [
    t < (1 / 2.75), n * t * t
    t < (2 / 2.75), t - (1.5 / 2.75) * n * (t - (1.5 / 2.75)) + 0.75
    t < (2.5 / 2.75), t - (2.25 / 2.75) * n * (t - (2.25 / 2.75)) + 0.9375
    any, t - (2.625 / 2.75) * n * (t - (2.625 / 2.75)) + 0.984375
  ]
]

-- a soft S-curve, slow at both ends
-- e.g. ease smooth 0.25
smooth : [t | t * t * (3 - (2 * t))]

-- how far through something is, from 0 to 1: elapsed seconds out of the whole
-- e.g. ease progress [1.5, 2]
progress : [elapsed seconds | clamp [elapsed / seconds, 0, 1]]

-- t from 0 to 1 and back again, for things that go to and fro
-- e.g. ease ping-pong 1.25
ping-pong : [t | u : t % 2, u > 1 [2 - u] else [u]]

-- a curve applied between two values: [curve, from, to, t]
-- e.g. ease between [ease out-cubic, 0, 300, 0.5]
between : [curve from to t | to - from * (curve t) + from]
