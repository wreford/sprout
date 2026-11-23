-- platform: how the hero of a platform game runs and jumps, the way the good ones feel: speeding up and slowing down,
-- gravity with a top falling speed, a jump cut short when the button is let go, a jump still allowed a moment after
-- running off a ledge (coyote time), and a press a moment before landing still counting (the jump buffer). step does a
-- whole frame of it through tilemap move, which keeps the hero out of the walls. Distilled from Sprig and Headstrong.

-- the speed across after a frame of running one way (-1, 0 or 1): speeding up by accel toward top, else slowing by brake
-- e.g. platform run [0, 1, 100, 800, 1000, 0.1] → 80
-- e.g. platform run [90, 0, 100, 800, 1000, 0.05] → 40
-- e.g. platform run [95, 1, 100, 800, 1000, 0.1] → 100
run : [speed-x way top accel brake dt | (way != 0) [speed-x + (way * accel * dt) max (0 - top) min top] else [motion approach [speed-x, 0, brake, dt]]]

-- the speed down after a frame of falling: gravity pulls, a rise is cut to cut when the button isn't held, and it never
-- falls faster than top (up is minus)
-- e.g. platform fall [-300, true, 900, -110, 270, 0.1] → -210
-- e.g. platform fall [-300, false, 900, -110, 270, 0.1] → -20
-- e.g. platform fall [250, true, 900, -110, 270, 0.1] → 270
fall : [speed-y holding pull cut top dt | kept : ((holding not) and (speed-y < cut)) [cut] else [speed-y], kept + (pull * dt) min top]

-- coyote time: how long a jump is still allowed after leaving the ground, full again while standing on it
-- e.g. platform coyote [0.05, false, 0.08, 0.02] → 0.03
-- e.g. platform coyote [0, true, 0.08, 0.02] → 0.08
coyote : [left-over grounded span dt | grounded [span] else [left-over - dt max 0]]

-- the jump buffer: how long a press of jump is remembered, so pressing just before landing still jumps
-- e.g. platform buffer [0, true, 0.12, 0.02] → 0.12
-- e.g. platform buffer [0.1, false, 0.12, 0.02] → 0.08
buffer : [left-over pressed-now span dt | pressed-now [span] else [left-over - dt max 0]]

-- does the hero jump now: a press remembered while the ground is under foot, or only just left
-- e.g. platform jumps [0.05, 0.1] → true
-- e.g. platform jumps [0, 0.1] → false
jumps : [coyote-left buffer-left | (coyote-left > 0) and (buffer-left > 0)]

-- how a hero feels, to change with with: its box, the map's tile and which characters are solid or one-way, running
-- (top speed, speeding up on the ground and in the air, braking), jumping (speed, gravity, the cut, the top fall speed)
-- and the two windows
-- e.g. platform feel jump → 340
feel : [
  size : 12x14, tile : 16, solids : "#", platforms : "="
  top : 100, accel : 800, air : 500, brake : 1000
  jump : 340, pull : 900, cut : -110, fall-top : 280, coyote-time : 0.08, buffer-time : 0.12
]

-- a hero for one frame: running one way (-1, 0 or 1), jumping when jump was pressed (held for higher), falling, and
-- moved through the map; gives the hero with at, speed, ground, coyote-left, buffer-left and jumped (did it jump now?)
-- e.g. platform step [[at : 0x2, speed : 0x0, ground : true, coyote-left : 0.08, buffer-left : 0], 0, true, true, ["....", "####"], platform feel, 0.02] jumped → true
-- e.g. platform step [[at : 0x2, speed : 0x0, ground : true, coyote-left : 0.08, buffer-left : 0], 1, false, false, ["....", "####"], platform feel, 0.1] speed → 80x0
step : [hero way pressed-now holding map how dt |
  across : run [hero speed x, way, how top, hero ground [how accel] else [how air], how brake, dt]
  queued : buffer [hero buffer-left else 0, pressed-now, how buffer-time, dt]
  going : jumps [hero coyote-left else 0, queued]
  rise : going [0 - (how jump)] else [hero speed y]
  down : fall [rise, holding, how pull, how cut, how fall-top, dt]
  moved : tilemap move [[at : hero at, speed : pair [across, down]], how size, map, how tile, how solids, how platforms, dt]
  left-over : going [0] else [hero coyote-left else 0]
  hero with [
    at : moved at, speed : moved speed, ground : moved ground, jumped : going
    coyote-left : coyote [left-over, moved ground, how coyote-time, dt], buffer-left : going [0] else [queued]
  ]
]
