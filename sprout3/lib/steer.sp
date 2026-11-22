-- steer: steering for things that move by themselves: chasing, fleeing, arriving gently, heading off a target,
-- wandering, and the three rules of a flock (keep apart, line up, stay together). A body is [at, speed], both pairs,
-- as in motion. Each word gives a push to add to speed; apply adds it.

aim : [from to top | gap : to - from, far : vec size gap, (far = 0) [0x0] else [gap / far * top]]
near : [body others radius | others keep [o | d : vec distance [o at, body at], (d > 0) and (d < radius)]]

-- the push toward a target at up to top speed
-- e.g. steer seek [[at : 0x0, speed : 0x0], 10x0, 5] → 5x0
seek : [body target top | aim [body at, target, top] - (body speed)]

-- the push away from a threat
-- e.g. steer flee [[at : 0x0, speed : 0x0], 10x0, 5] → -5x0
flee : [body threat top | 0x0 - (aim [body at, threat, top]) - (body speed)]

-- the push toward a target that slows down within slow of it, to stop there
-- e.g. steer arrive [[at : 0x0, speed : 0x0], 5x0, 10, 20] → 2.5x0
arrive : [body target top slow |
  gap : target - (body at)
  far : vec size gap
  want : (far = 0) [0x0] else [gap / far * (top * (far / slow min 1))]
  want - (body speed)
]

-- the push toward where a moving quarry will be
-- e.g. vec round (steer pursue [[at : 0x0, speed : 0x0], [at : 10x0, speed : 0x5], 10]) → 9x4
pursue : [body quarry top | ahead : vec distance [body at, quarry at] / top, seek [body, quarry at + (quarry speed * ahead), top]]

-- a push that drifts this way and that over time, for things that wander
-- e.g. vec round (steer wander [[at : 0x0, speed : 0x0], 10, 0, 7]) → 3x10
wander : [body top now seed | a : noise [seed, now * 0.5] - 0.5 * pi * 4, pair [a cos, a sin] * top - (body speed)]

-- the push away from others closer than radius, stronger the closer they are
-- e.g. steer separate [[at : 0x0, speed : 0x0], [[at : 2x0, speed : 0x0]], 5] → -0.5x0
separate : [body others radius | near [body, others, radius] fold [0x0, [push o | gap : body at - (o at), push + (gap / (vec size gap) / (vec size gap))]]]

-- the push to match the speed of others within radius
-- e.g. steer align [[at : 0x0, speed : 0x0], [[at : 2x0, speed : 4x0]], 5] → 4x0
align : [body others radius |
  close : near [body, others, radius]
  (close length = 0) [0x0] else [close fold [0x0, [s o | s + (o speed)]] / (close length) - (body speed)]
]

-- the push toward the middle of others within radius
-- e.g. vec round (steer cohere [[at : 0x0, speed : 0x0], [[at : 4x0, speed : 0x0], [at : 0x4, speed : 0x0]], 5, 10]) → 7x7
cohere : [body others radius top |
  close : near [body, others, radius]
  (close length = 0) [0x0] else [seek [body, close fold [0x0, [s o | s + (o at)]] / (close length), top]]
]

-- the three flocking pushes together: keep apart, line up, stay together
-- e.g. vec round (steer flock [[at : 0x0, speed : 0x0], [[at : 2x0, speed : 0x4]], 5, 10]) → 3x4
flock : [body others radius top | separate [body, others, radius] * top * 1.5 + (align [body, others, radius]) + (cohere [body, others, radius, top])]

-- a body after dt seconds of a push, its speed kept under most
-- e.g. steer apply [[at : 0x0, speed : 0x0], 10x0, 5, 0.5] → [at : 2.5x0, speed : 5x0]
apply : [body push most dt | v : vec limit [body speed + (push * dt), most], [at : body at + (v * dt), speed : v]]
