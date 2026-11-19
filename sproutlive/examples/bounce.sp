-- Bounce: keep the ball up

paddle : W / 2
ball : {x : W / 2, y : 100, vx : 150, vy : 220}
score : 0
best : 0

update : [dt |
  touching [paddle := toward paddle touch-x 0.4]
  key "left" [paddle := paddle - (400 * dt)]
  key "right" [paddle := paddle + (400 * dt)]
  paddle := clamp paddle 50 (W - 50)

  ball.x := ball.x + (ball.vx * dt)
  ball.y := ball.y + (ball.vy * dt)
  ball.x < 10 [ball.vx := ball.vx abs]
  ball.x > (W - 10) [ball.vx := 0 - (ball.vx abs)]
  ball.y < 10 [ball.vy := ball.vy abs]

  near : (ball.x - paddle) abs < 50
  low : ball.y > (H - 50)
  (ball.vy > 0) and near and low [(
    ball.vy := 0 - (ball.vy * 1.05)
    ball.vx := ball.vx + ((ball.x - paddle) * 3)
    score := score + 1
    beep 660 0.05
  )]

  ball.y > (H + 20) [(
    best := score > best [score, best]
    beep 140 0.3
    ball := {x : W / 2, y : 100, vx : 150, vy : 220}
    score := 0
    shake 10
  )]
]

draw : [
  clear "#1d1b3a"
  rect (paddle - 50) (H - 40) 100 12 "#ffcc33"
  circle ball.x ball.y 10 "#ff5d8f"
  text score (W / 2) 60 48 "#ffffff"
  text "best {best}" (W / 2) 95 16 "#9a94c8"
]
