-- Galaxy: twenty thousand stars, pulled toward your finger, or toward a point that drifts round the sky.
-- Every star is a record of numbers, kept in columns (decision 82). Moving them all is one fused loop,
-- drawing them is two more (decision 95), and the page draws every star with WebGPU in one call (decision 90).
-- Try changing star-count, the pull, or the colours while it runs.

star-count : 20000
pull : 5000                  -- how hard the stars fall toward the point
drag : 0.996                 -- how much speed each star keeps from frame to frame
fast : 90                    -- stars faster than this burn white

-- a new star: somewhere on a ring round the middle, already moving round it
new-star : [n |
  angle : noise [n, 1] * 6.283185307179586
  radius : noise [n, 2] * 160 + 30
  speed : noise [n, 3] * 30 + 50
  [x : W / 2 + (angle cos * radius), y : H / 2 + (angle sin * radius), vx : angle sin * (0 - speed), vy : angle cos * speed]
]

start :
  stars : range star-count collect new-star

update : [game |
  dt : game dt
  input : game input
  -- where they fall: your finger, or a point that loops slowly round the middle
  target-x : input touching [input touch-x] else [W / 2 + (game clock * 0.3 sin * 70)]
  target-y : input touching [input touch-y] else [H / 2 + (game clock * 0.4 cos * 90)]
  strength : input touching [pull * 2] else [pull]
  moved : game stars collect [star |
    dx : target-x - (star x)
    dy : target-y - (star y)
    nearness : strength / (dx * dx + (dy * dy) + 900) * dt
    new-vx : star vx + (dx * nearness) * drag
    new-vy : star vy + (dy * nearness) * drag
    star with [x : star x + (new-vx * dt), y : star y + (new-vy * dt), vx : new-vx, vy : new-vy]
  ]
  game with [stars : moved]
]

draw : [game |
  clear "#04050d"
  -- slow stars are blue, fast ones white: two loops, each keeping its own stars
  game stars keep [star | star vx * (star vx) + (star vy * (star vy)) < (fast * fast)] each [star | circle [star x, star y, 1.1, "#7d8bff"]]
  game stars keep [star | star vx * (star vx) + (star vy * (star vy)) >= (fast * fast)] each [star | circle [star x, star y, 1.5, "#f6f2ff"]]
  text ["[star-count] stars", 52, 22, 13, "#8a90b8"]
]
