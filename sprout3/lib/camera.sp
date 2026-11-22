-- camera: a view that follows. A camera is the point in the world at the middle of the screen, a pair: it glides after
-- its target with a dead zone, stays inside the world, and turns points between the world and the screen. Distilled
-- from the TaskIAP games: 32 of the 319 have a camera that moves.

-- the camera's next place, following target: still while the target is within dead of it, else closing share of the
-- gap beyond that every second
-- e.g. vec round (camera follow [0x0, 100x0, 0.9, 10, 0.1]) → 19x0
follow : [cam target share dead dt |
  gap : target - cam
  far : vec size gap
  k : 1 - (1 - share pow dt)
  (far <= dead) [cam] else [gap - (gap / far * dead) * k + cam]
]

-- the camera moved so a screen of size stays inside a world of size
-- e.g. camera keep-in [pair [5, 300], 100x80, 400x320] → 50x280
keep-in : [cam screen world | pair [cam x max (screen x / 2) min (world x - (screen x / 2)), cam y max (screen y / 2) min (world y - (screen y / 2))]]

-- where a world point lands on a screen of size
-- e.g. camera on-screen [100x100, 130x90, 320x240] → 190x110
on-screen : [cam p screen | p - cam + (screen / 2)]

-- the world point under a point on the screen (where a tap landed)
-- e.g. camera to-world [100x100, 190x110, 320x240] → 130x90
to-world : [cam p screen | p - (screen / 2) + cam]
