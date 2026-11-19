-- Breakout: clear the bricks

brick-w : 40
brick-h : 16

-- a wall of 8 by 5 bricks
wall : range 40 collect [n | [x : n - 1 % 8 * 44 + 4, y : n - 1 / 8 floor * 20 + 60, hp : 1]]

serve : [x : W / 2, y : 300, vx : 120, vy : -240]

start :
  paddle : W / 2
  ball : serve
  bricks : wall
  score : 0
  lives : 3

-- does the ball touch this brick?
touches : [b k | b x > (k x) and (b x < (k x + brick-w)) and (b y > (k y)) and (b y < (k y + brick-h))]

update : [g |
  i : g input
  dt : g dt
  paddle : clamp [i touching [toward [g paddle, i touch-x, 0.5]] else [g paddle], 40, W - 40]

  b : g ball
  m : b with [x : b x + (b vx * dt), y : b y + (b vy * dt)]
  hit-bricks : g bricks keep [k | touches [m, k]]
  left-bricks : g bricks keep [k | touches [m, k] not]
  broke : hit-bricks length > 0

  vx : m x < 8 or (m x > (W - 8)) [m vx neg] else [m vx]
  top-or-brick : m y < 8 or broke
  on-paddle : m vy > 0 and (m y > (H - 50)) and (m x - paddle abs < 40)
  vy : top-or-brick [m vy abs] else [on-paddle [m vy abs neg] else [m vy]]
  lost : m y > (H + 10)

  broke
    beep [520, 0.04]
  lost
    shake 8

  g with
    paddle : paddle
    ball : lost [serve] else [m with [vx : vx, vy : vy]]
    bricks : left-bricks
    score : g score + (hit-bricks length)
    lives : lost [g lives - 1] else [g lives]
]

draw : [g |
  clear "#0b0b1e"
  g bricks each [k | rect [k x, k y, brick-w, brick-h, "#5fa8ff"]]
  rect [g paddle - 40, H - 40, 80, 10, "#ffffff"]
  circle [g ball x, g ball y, 6, "#ffd23f"]
  text ["[g score]  lives [g lives]", W / 2, 30, 18, "#ffffff"]
]
