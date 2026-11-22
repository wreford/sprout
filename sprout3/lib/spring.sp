-- spring: things that move like they're on a spring: they overshoot, wobble and settle, which makes buttons, cameras
-- and characters feel alive. A spring's state is [at, speed]; at and target can be numbers or pairs. Step it each
-- frame with the time that passed.

-- a spring's state after dt seconds pulled toward target: stiffness pulls harder, damping calms it
-- e.g. spring step [[at : 0, speed : 0], 10, 100, 10, 0.01] → [at : 0.1, speed : 10]
-- e.g. spring step [[at : 0x0, speed : 0x0], 10x0, 100, 10, 0.01] → [at : 0.1x0, speed : 10x0]
step : [state target stiffness damping dt |
  force : target - (state at) * stiffness - (state speed * damping)
  moving : state speed + (force * dt)
  [at : state at + (moving * dt), speed : moving]
]

-- a state after dt seconds closing on target as fast as it can without overshooting, taking about smooth-time
-- seconds (a critically damped spring, for cameras and pointers)
-- e.g. spring follow [[at : 0, speed : 0], 10, 0.5, 0.1] at * 100 round / 100 → 0.62
follow : [state target smooth-time dt |
  omega : 2 / smooth-time
  x : omega * dt
  fade : 1 / (1 + x + (x * x * 0.48) + (x * x * x * 0.235))
  change : state at - target
  pull : state speed + (change * omega) * dt
  [at : change + pull * fade + target, speed : state speed - (pull * omega) * fade]
]

-- has a spring come to rest: near its target and hardly moving?
-- e.g. spring resting [[at : 9.99, speed : 0.01], 10, 0.05] → true
resting : [state target tolerance |
  size-of : [v | (v kind = "number") [v abs] else [vec size v]]
  (size-of (state at - target) <= tolerance) and (size-of (state speed) <= tolerance)
]

-- the damping that settles a spring of this stiffness fastest without a wobble
-- e.g. spring critical 100 → 20
critical : [stiffness | stiffness sqrt * 2]

-- a wobble that dies away: amplitude at the start, frequency times a second, fading at decay a second, t seconds in
-- e.g. spring wobble [1, 2, 3, 0.125] → 0.6872892788
wobble : [amplitude frequency decay t | fall : 0 - (decay * t) exp, turn : pi * 2 * frequency * t sin, amplitude * fall * turn]

-- squash and stretch from speed: narrower and taller the faster something moves, up to 30%, as a scale across x down
-- e.g. spring stretch [-300, 600] → 0.85x1.15
stretch : [speed most | s : speed abs / most min 1 * 0.3, pair [1 - s, 1 + s]]
