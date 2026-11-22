-- arc: things thrown through the air, a ball at a hoop, a grenade, a leaping frog: where one is along its flight from
-- one point to another, how far through the flight it is, the speed to throw at to land on a spot, and where a thing
-- already flying comes down. Points are pairs, y counts down the screen, and gravity pulls down (a number above 0).

-- where a thing is at fraction t (0 to 1) of its flight from origin to target, rising height above the straight line
-- at the middle
-- e.g. arc point [0x100, 100x100, 40, 0.5] → 50x60
-- e.g. arc point [0x100, 100x50, 40, 1] → 100x50
point : [origin target height t | origin + (target - origin * t) - (pair [0, height * 4 * t * (1 - t)])]

-- how far through a flight of some length it is now, from when it began: 0 before, 1 once it has landed
-- e.g. arc progress [0.8, 2, 2.4] → 0.5
-- e.g. arc progress [0.8, 2, 5] → 1
progress : [span began now | now - began / span max 0 min 1]

-- the speed to throw at, across and up, to land on a target from origin, rising height above origin, under gravity
-- e.g. arc launch [0x100, 80x100, 100, 200] → 40x-200
launch : [origin target height gravity |
  up : height * 2 * gravity sqrt
  rise : height * 2 / gravity sqrt
  fall : height + (target y) - (origin y) max 0 * 2 / gravity sqrt
  pair [target x - (origin x) / (rise + fall), 0 - up]
]

-- where a thing thrown from origin at a speed comes back down to the ground (a height on the screen), to run to where a
-- loose ball will land
-- e.g. arc landing [0x100, 40x-200, 200, 100] → 80x100
landing : [origin speed gravity ground |
  climb : speed y
  above : origin y - ground
  t : climb * climb - (2 * gravity * above) max 0 sqrt - climb / gravity
  pair [origin x + (speed x * t), ground]
]
