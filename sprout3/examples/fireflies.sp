-- Fireflies: hundreds of lights drift on the night air. Hold a finger down and they gather to it.
-- Try changing count, the pull, or the glow colour while it runs.

count : 400

-- a new firefly, rising from the grass
hatch : [n | [x : rand [0, W], y : H + 8, vx : rand [-20, 20], vy : rand [-90, -40], ph : rand [0, 6.28]]]

start :
  flies : []

update : [g |
  i : g input
  dt : g dt
  t : g clock

  -- where they gather: your finger, or a slow loop round the middle of the sky
  gx : i touching [i touch-x] else [W / 2 + (t * 0.5 sin * 90)]
  gy : i touching [i touch-y] else [H / 2 - 40 + (t * 0.7 cos * 110)]
  pull : i touching [1.2] else [0.5]

  -- a few more hatch each frame until there are enough
  born : g flies length < count [range 5 collect hatch] else [[]]

  -- each one is pulled toward the gathering point and wobbles on its own beat
  flies : g flies .. born collect [f |
    f with
      vx : f vx * 0.96 + (gx - (f x) * pull * dt) + (f ph + t sin * 80 * dt)
      vy : f vy * 0.96 + (gy - (f y) * pull * dt) + (f ph * 1.3 + t cos * 80 * dt)
      x : f x + (f vx * dt) max -20 min (W + 20)
      y : f y + (f vy * dt) max -20 min (H + 20)
  ]

  g with [flies : flies]
]

draw : [g |
  t : g clock
  halo : rgba [255, 225, 110, 0.13]
  clear "#070b1a"
  rect [0, H - 30, W, 30, "#0b1a12"]
  g flies each [f | circle [f x, f y, f ph + (t * 3) sin * 3 + 5, halo]]
  g flies each [f | circle [f x, f y, 1.8, "#fff4b0"]]
  text ["hold to call them", W / 2, H - 14, 13, "#4f6a8f"]
]
