-- camera: a view that follows: gliding after its target with a dead zone, kept inside the world, and turning world
-- points into screen points. A camera is [x, y], the world point at the middle of the screen. Distilled from the
-- TaskIAP games: 32 of the 319 have a camera that moves.

-- the camera's next place, following target: still while the target is within dead of it, else closing share of the
-- gap beyond that every second
-- e.g. camera follow [[x : 0, y : 0], [x : 100, y : 0], 0.9, 10, 0.1] x round
follow : [cam target share dead dt |
  dx : target x - (cam x)
  dy : target y - (cam y)
  far : dx * dx + (dy * dy) sqrt
  k : 1 - (1 - share pow dt)
  (far <= dead) [cam] else [cam with [x : dx - (dx / far * dead) * k + (cam x), y : dy - (dy / far * dead) * k + (cam y)]]
]

-- the camera moved so a w by h screen stays inside a world-w by world-h world
-- e.g. camera keep-in [[x : 5, y : 300], 100, 80, 400, 320]
keep-in : [cam w h world-w world-h | cam with [x : cam x max (w / 2) min (world-w - (w / 2)), y : cam y max (h / 2) min (world-h - (h / 2))]]

-- where a world point px, py lands on a w by h screen
-- e.g. camera on-screen [[x : 100, y : 100], 130, 90, 320, 240]
on-screen : [cam px py w h | pair [px - (cam x) + (w / 2), py - (cam y) + (h / 2)]]
