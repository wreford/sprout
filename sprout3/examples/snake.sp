-- Snake: eat, grow, don't bite yourself. A 20 by 20 grid.

size : 18

start :
  body : [[x : 5, y : 10], [x : 4, y : 10], [x : 3, y : 10]]
  dx : 1
  dy : 0
  food : [x : 9, y : 10]
  score : 0
  over : false

-- arrow keys turn, but never straight back
turn : [g i |
  cond [
    i held "left" and (g dx = 0), g with [dx : -1, dy : 0]
    i held "right" and (g dx = 0), g with [dx : 1, dy : 0]
    i held "up" and (g dy = 0), g with [dx : 0, dy : -1]
    i held "down" and (g dy = 0), g with [dx : 0, dy : 1]
    any, g
  ]
]

-- one step of the snake
step : [g |
  head : g body @ 1
  next : [x : head x + (g dx) % 20, y : head y + (g dy) % 20]
  ate : next = (g food)
  grown : [next] .. (g body)
  kept : ate [grown] else [take [grown, g body length]]
  bitten : g body keep [p | p = next] length > 0
  fresh : [x : rand [0, 20] floor, y : rand [0, 20] floor]

  ate
    beep [880, 0.05]
  bitten
    beep [110, 0.4]

  g with
    body : kept
    food : ate [fresh] else [g food]
    score : ate [g score + 1] else [g score]
    over : bitten
]

update : [g |
  t : turn [g, g input]
  g over [g input tapped [start] else [g]] else [
    every [0.12, g clock, g dt] [step t] else [t]]
]

draw : [g |
  clear "#10220f"
  g body each [p | rect [p x * size, p y * size, size - 2, size - 2, "#7ddc6a"]]
  rect [g food x * size, g food y * size, size - 2, size - 2, "#ff4d4d"]
  text ["[g score]", W / 2, 400, 28, "#ffffff"]
  g over
    text ["Bitten! Tap to play again", W / 2, 440, 18, "#ffe066"]
]
