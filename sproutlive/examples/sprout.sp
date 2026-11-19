-- Sprout: catch the rain, dodge the bugs

x : W / 2         -- where the sprout stands
height : 40       -- how tall it is
drops : []        -- falling rain
bugs : []         -- falling ladybirds
sparks : []
score : 0
over : false

update : [dt |
  restart (over and tapped)
  pace : over [0, 1]

  touching [x := toward x touch-x 0.2]
  key "left" [x := x - 5]
  key "right" [x := x + 5]
  x := clamp x 20 (W - 20)

  every 0.3 [
    drops := drops append {x : rand 20 (W - 20), y : -10}
    random < 0.3 [bugs := bugs append {x : rand 20 (W - 20), y : -10}]
  ]

  speed : 160 + (score * 4) * dt * pace
  top : H - 40 - height
  drops each [d |
    d.y := d.y + speed
    (dist d.x d.y x top) < 24 [(
      3 times [sparks := sparks append {x : d.x, y : d.y, vx : rand -80 80, vy : rand -120 0, life : 0.5}]
      d.y := H + 99
      height := clamp (height + 8) 0 (H - 140)
      score := score + 1
      beep 880 0.06
    )]
  ]
  drops := keep drops [_.y < H]

  bugs each [b |
    b.y := b.y + (speed * 0.8)
    near : (b.x - x) abs < 14
    near and (b.y > top) [(
      b.y := H + 99
      height := height - 30
      shake 12
      beep 110 0.25
    )]
  ]
  bugs := keep bugs [_.y < H]
  over := height < 20

  sparks each [s |
    s.x := s.x + (s.vx * dt)
    s.y := s.y + (s.vy * dt)
    s.life := s.life - dt
  ]
  sparks := keep sparks [_.life > 0]
]

draw : [
  clear "#ffb38a"
  circle 300 70 (34 + (wave 3 * 3)) "#ff6b4a"
  cloud : clock * 12 % (W + 120) - 60
  circle cloud 120 20 "#ffffff"
  circle (cloud + 24) 112 26 "#ffffff"
  circle (cloud + 50) 120 18 "#ffffff"
  rect 0 (H - 40) W 40 "#7a4b2a"

  top : H - 40 - height
  rect (x - 3) top 6 height "#3c9d3c"
  leaf : H - 60
  side : 1
  while [leaf > (top + 20)] [
    circle (x + (side * 8)) leaf 6 "#4fb04f"
    side := 0 - side
    leaf := leaf - 28
  ]
  circle (x - 9) top 9 "#5cc85c"
  circle (x + 9) top 9 "#5cc85c"

  drops each [circle _.x _.y 6 "#2f7fe0"]
  bugs each [b |
    circle b.x b.y 10 "#d62828"
    circle b.x (b.y - 8) 5 "#222222"
  ]
  sparks each [circle _.x _.y 3 "#e8f7ff"]
  text "{score} drops" (W / 2) 30 22 "#5a2a1a"

  over [(
    rect 0 0 W H "rgba(0,0,0,0.5)"
    text "Your sprout wilted" (W / 2) (H / 2 - 20) 28 "#ffffff"
    text "Tap to grow again" (W / 2) (H / 2 + 20) 18 "#ffe066"
  )]
]
