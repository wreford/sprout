-- the tall test card (decision 143): a screen 240 wide and 400 tall, and taps on it. Tap anywhere: a ring marks it.
start : [taps : 0, at : 120x200]
update : [g |
  t : g input
  t tapped [g with [taps : g taps + 1, at : pair [t touch-x, t touch-y]]] else [g]
]
draw : [g |
  clear #000000
  range 20 each [i | rect [0, i * 20, 240, 20, rgb [i * 12, 30, 200 - (i * 8)]]]
  ui banner ["TALL", 40, 16, #ffcc00]
  ui banner ["TAP THE SCREEN", 70, 8, #ffffff]
  circle [g at x, g at y, 10, #ffffff]
  circle [g at x, g at y, 7, #000000]
  ui strip ["240 X 400", "TAPS [g taps]", "16-BIT", #000000, #e8202c]
]
