-- Bounce: keep the ball up

serve : [x : W / 2, y : 100, vx : 150, vy : 220]

start :
  paddle : W / 2
  ball : serve
  score : 0
  best : 0

-- the ball's sideways speed after the side walls
side : [b | b x < 10 [b vx abs] else [b x > (W - 10) [b vx abs neg] else [b vx]]]

update : [g |
  i : g input
  dt : g dt

  aim : i touching [toward [g paddle, i touch-x, 0.4]] else [g paddle]
  steer : i held "left" [aim - (400 * dt)] else [i held "right" [aim + (400 * dt)] else [aim]]
  paddle : clamp [steer, 50, W - 50]

  b : g ball
  moved : b with [x : b x + (b vx * dt), y : b y + (b vy * dt)]
  walled : moved with [vx : side moved, vy : moved y < 10 [moved vy abs] else [moved vy]]

  near : walled x - paddle abs < 50
  hit : walled vy > 0 and near and (walled y > (H - 50))
  bounced : hit [walled with [vy : walled vy * -1.05, vx : walled vx + (walled x - paddle * 3)]] else [walled]
  lost : bounced y > (H + 20)

  hit
    beep [660, 0.05]
  lost
    beep [140, 0.3]
    shake 10

  top : g score > (g best) [g score] else [g best]

  g with
    paddle : paddle
    ball : lost [serve] else [bounced]
    score : lost [0] else [hit [g score + 1] else [g score]]
    best : top
]

draw : [g |
  clear "#1d1b3a"
  rect [g paddle - 50, H - 40, 100, 12, "#ffcc33"]
  circle [g ball x, g ball y, 10, "#ff5d8f"]
  text ["[g score]", W / 2, 60, 48, "#ffffff"]
  text ["best [g best]", W / 2, 95, 16, "#9a94c8"]
]
