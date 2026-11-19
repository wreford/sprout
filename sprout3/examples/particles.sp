-- Particles: a fountain, for speed tests. About 2000 alive at once.

start :
  sparks : []

spawn : [n | [x : W / 2, y : H - 20, vx : rand [-60, 60], vy : rand [-420, -260], life : 2]]

update : [g |
  dt : g dt
  born : range 17 collect spawn
  moved : g sparks collect [s | s with [x : s x + (s vx * dt), y : s y + (s vy * dt), vy : s vy + (300 * dt), life : s life - dt]]
  g with
    sparks : moved keep [s | s life > 0] .. born
]

draw : [g |
  clear "#000000"
  g sparks each [s | circle [s x, s y, 2, "#ffcc66"]]
]
