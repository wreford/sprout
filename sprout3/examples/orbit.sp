-- Orbit: drag on the sky and let go to throw a moon. The sun pulls on everything.
-- Throw sideways to make an orbit. Too slow and it falls in; too fast and it flies away.

sun : [x : W / 2, y : H / 2 - 20, r : 24]
pull : 1500000               -- how strongly the sun pulls
colours : ["#9fd8ff", "#ffd166", "#ff9e7a", "#b8f28c"]

-- a few fixed stars behind everything
stars : range 70 collect [n | [x : n * 137 % W, y : n * 211 % H, r : n % 3 * 0.5 + 0.6]]

-- a new moon at x, y moving at vx, vy
moon : [px py vx0 vy0 | [x : px, y : py, vx : vx0, vy : vy0, c : rand [1, 5] floor]]

start :
  moons : []
  lost : 0
  aiming : false
  ax : 0
  ay : 0

update : [g |
  i : g input
  dt : g dt

  -- aiming: a drag starts where you touch, and a moon is thrown when you let go
  holding : i touching
  starting : holding and (g aiming not)
  released : g aiming and (holding not)
  from-x : starting [i touch-x] else [g ax]
  from-y : starting [i touch-y] else [g ay]
  thrown : [moon [from-x, from-y, from-x - (i touch-x) * 2.5, from-y - (i touch-y) * 2.5]] keep [released]

  -- the sun pulls each moon toward it: harder the closer it gets
  fall : [m |
    dx : sun x - (m x)
    dy : sun y - (m y)
    d2 : dx * dx + (dy * dy) max 100
    k : pull / d2 / (d2 sqrt) * dt
    ux : m vx + (dx * k)
    uy : m vy + (dy * k)
    m with [vx : ux, vy : uy, x : m x + (ux * dt), y : m y + (uy * dt)]
  ]
  moved : g moons .. thrown collect fall

  -- what fell into the sun, and what flew away
  hit : [m | dist [m x, m y, sun x, sun y] < (sun r)]
  gone : [m | dist [m x, m y, sun x, sun y] > 900]
  crashed : moved keep hit length
  escaped : moved keep gone length

  released
    beep [520, 0.05]
  crashed > 0
    shake 10
    beep [90, 0.35]

  g with
    moons : moved keep [m | hit m not and (gone m not)]
    lost : g lost + crashed + escaped
    aiming : holding
    ax : from-x
    ay : from-y
]

draw : [g |
  i : g input else [touch-x : 0, touch-y : 0]
  glow : wave [4, g clock] * 4
  clear "#060818"
  stars each [s | circle [s x, s y, s r, "#3a4a7a"]]

  circle [sun x, sun y, sun r + 14 + glow, rgba [255, 170, 60, 0.15]]
  circle [sun x, sun y, sun r + 6 + glow, rgba [255, 190, 80, 0.3]]
  circle [sun x, sun y, sun r, "#ffcf5a"]

  g moons each [m |
    line [m x, m y, m x - (m vx * 0.12), m y - (m vy * 0.12), rgba [255, 255, 255, 0.25]]
    circle [m x, m y, 5, colours @ (m c)]
  ]

  g aiming
    line [g ax, g ay, i touch-x, i touch-y, "#5a6aa0"]
    circle [g ax, g ay, 6, "#ffffff"]

  text ["[g moons length] in orbit", W / 2, 30, 20, "#e8ecff"]
  text ["[g lost] lost", W / 2, 54, 14, "#7d88b8"]
  g moons length = 0 and (g aiming not)
    text ["drag and let go to throw a moon", W / 2, H - 30, 14, "#7d88b8"]
]
