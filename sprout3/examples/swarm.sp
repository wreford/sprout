-- Swarm: thousands of drones fly at the core, and turrets you program in Sprout shoot them down.
-- turret-program is how every turret thinks. Change it while the swarm comes in: aim slower, fire sooner,
-- go for the crowd instead of the nearest. Tap the field to add a turret (up to eight).
-- Speed: every drone is a record of numbers, so Sprout keeps them in columns. Moving them all is one fused loop,
-- each turret's search and shot is one more, a wave is made by spork as one kernel on WebAssembly SIMD, and the page
-- draws every drone with WebGPU in one call. Open State to see which loops run fast.

wave-size : 900            -- drones in the first wave; each wave brings 300 more
wave-every : 5             -- seconds between waves
drone-speed : 40
reach : 150                -- how far a turret can shoot
beam-width : 7             -- how close to the beam a drone must be to be hit
turn-rate : 7              -- how fast turrets can turn, in radians a second
reload : 0.2               -- seconds between shots
core-size : 22

wrap : [a | cond [a > pi, a - (2 * pi), a < (0 - pi), a + (2 * pi), any, a]]

-- ---------------------------------------------------------------- the turrets' program
-- A turret sees: aim (where it points, in radians), cool (seconds until it can fire), dx and dy (to its target),
-- far (how far that is) and crowd (how many drones are in reach). It answers with turn (-1 to 1) and fire (true or false).
turret-program : [t |
  want : t dy atan2 (t dx)
  off : wrap (want - (t aim))
  [turn : clamp [off * 6, -1, 1], fire : (t far < reach) and (t cool <= 0) and (off abs < 0.06)]
]

-- ---------------------------------------------------------------- the game
turret : [tx ty | [x : tx, y : ty, aim : 0, cool : 0, shots : 0]]
start :
  drones : []
  turrets : [turret [W / 2 - 70, H / 2 - 60], turret [W / 2 + 70, H / 2 - 60], turret [W / 2 - 70, H / 2 + 60], turret [W / 2 + 70, H / 2 + 60]]
  core : 100
  wave : 0
  next-wave : 1
  kills : 0
  beams : []
  over : false

play : [game |
  dt : game dt
  now : game clock
  cx : W / 2
  cy : H / 2
  -- a new wave, all at once: spork works the spawn out ahead into one kernel and runs it on SIMD
  due : now >= (game next-wave)
  seed : game wave * 17 + 3
  spawn : [n |
    angle : noise [n, seed] * 6.283185307179586
    far : noise [n, seed + 1] * 80 + 250
    [x : angle cos * far + cx, y : angle sin * far + cy, hp : 1]
  ]
  arriving : due [range (wave-size + (game wave * 300)) spork spawn] else [[]]
  -- every drone flies at the core, weaving: one fused loop over the columns
  wobble : now * 2
  speed : drone-speed * dt
  flown : game drones .. arriving collect [d |
    dx : cx - (d x)
    dy : cy - (d y)
    len : dx * dx + (dy * dy) sqrt max 1
    weave : d x + (d y * 0.7) * 0.05 + wobble sin * 0.7
    d with [x : dx - (dy * weave) / len * speed + (d x), y : dy + (dx * weave) / len * speed + (d y)]
  ]
  -- each turret: find its nearest drone (a fused loop of distances), ask the program, turn, and maybe fire
  thought : game turrets collect [t |
    tx : t x
    ty : t y
    gaps : flown collect [d | d x - tx * (d x - tx) + (d y - ty * (d y - ty))]
    nearest : gaps smallest else 1000000000
    target : flown @ (gaps index-of nearest else 1) else [[x : tx + 1, y : ty]]
    crowd : gaps keep [g | g < (reach * reach)] length
    said : turret-program [aim : t aim, cool : t cool, dx : target x - tx, dy : target y - ty, far : nearest sqrt, crowd : crowd]
    aim : wrap (clamp [said turn else 0, -1, 1] * turn-rate * dt + (t aim))
    fires : (said fire else false) and (t cool <= 0)
    t with [aim : aim, cool : cond [fires, reload, any, t cool - dt], fired : fires, shots : cond [fires, t shots + 1, any, t shots]]
  ]
  firing : thought keep [t | t fired]
  -- each shot is a beam: every drone near it loses its hit point, one fused loop a shot
  shot : firing fold [flown, [ds t |
    tx : t x
    ty : t y
    c : t aim cos
    s : t aim sin
    ds collect [d |
      rx : d x - tx
      ry : d y - ty
      along : rx * c + (ry * s)
      side : rx * s - (ry * c) abs
      d with [hp : cond [(along > 0) and (along < reach) and (side < beam-width), d hp - 1, any, d hp]]
    ]
  ]]
  -- the ones that reached the core hurt it; the ones shot are gone
  inside : core-size * core-size
  reached : shot keep [d | d x - cx * (d x - cx) + (d y - cy * (d y - cy)) < inside] length
  living : shot keep [d | (d hp > 0) and (d x - cx * (d x - cx) + (d y - cy * (d y - cy)) >= inside)]
  core : game core - (reached * 0.5)
  (firing length > 0) [beep [1200, 0.015]]
  (reached > 0) [shake 3]
  -- a tap adds a turret, up to eight
  i : game input
  adds : (i tapped) and (game turrets length < 8) and ((i touch-x - cx) abs + ((i touch-y - cy) abs) > 40)
  turrets : adds [thought .. [turret [i touch-x, i touch-y]]] else [thought]
  game with [
    drones : living
    turrets : turrets
    core : core max 0
    over : core <= 0
    wave : cond [due, game wave + 1, any, game wave]
    next-wave : cond [due, now + wave-every, any, game next-wave]
    kills : game kills + (shot length - (living length) - reached)
    beams : firing collect [t | [x : t x, y : t y, aim : t aim]]
  ]
]

update : [game | game over [(game input tapped) [start] else [game]] else [play game]]

-- ---------------------------------------------------------------- drawing
draw : [game |
  clear "#0b0e14"
  cx : W / 2
  cy : H / 2
  -- every drone: one fused loop of circles, which the page draws with WebGPU in one call
  game drones each [d | circle [d x, d y, 1.8, "#ff6b5b"]]
  game beams each [b | line [b x, b y, b aim cos * reach + (b x), b aim sin * reach + (b y), "#9be7ff"]]
  game turrets each [t |
    circle [t x, t y, reach, "#ffffff08"]
    circle [t x, t y, 9, "#3a4152"]
    line [t x, t y, t aim cos * 14 + (t x), t aim sin * 14 + (t y), "#cfd6e4"]
  ]
  circle [cx, cy, core-size, "#1f6f8b"]
  circle [cx, cy, core-size * (game core / 100), "#4fb0c6"]
  text ["wave [game wave]  ·  [game drones length] drones  ·  [game kills] down", W / 2, 18, 12, "#9aa3b5"]
  text ["core [game core round]", W / 2, H - 16, 12, "#4fb0c6"]
  game over [text ["CORE LOST", W / 2, H / 2 - 50, 26, "#ff6b5b"], text ["tap to start again", W / 2, H / 2 + 50, 12, "#f4f1ea"]]
]
