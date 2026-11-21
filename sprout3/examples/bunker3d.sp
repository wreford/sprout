-- Bunker 3D: the same lab, guards and proximity mines as Bunker, drawn in 3D with three.js and real models:
-- soldiers by Quaternius, a blaster from Kenney's Blaster Kit, textures by Screaming Brain Studios (all CC0).
-- Phone: drag to walk and turn, tap to fire, tap MINE to drop a mine, SENTRY to set down a turret.
-- Keys: arrows or WASD, space to fire, M for a mine, T for a turret.
-- The turrets run turret-program, written in Sprout: change it while you play and every turret thinks the new way.
-- The game is the same Sprout code as Bunker, plus the turrets; draw is new. Change the props, the fog or the colours too.

level : [
  "################"
  "#......#.......#"
  "#......#.......#"
  "#..##..#..###..#"
  "#..##.....#....#"
  "#......#..#....#"
  "####.###..#.####"
  "#......#.......#"
  "#......#.......#"
  "#.###..####..###"
  "#...#..........#"
  "#...#..#####...#"
  "#......#...#...#"
  "#..........#...#"
  "#......#.......#"
  "################"
]
fov : 1.05                 -- how wide you see, in radians
columns : 72               -- rays across the screen: more is sharper and slower
walk-speed : 2.6
turn-speed : 2.4
mine-arm : 1.2             -- seconds before a dropped mine is live
mine-reach : 1.0           -- how close someone must come to set it off
blast : 2.1                -- how far the blast reaches
sentries : 2               -- turrets you carry
sentry-reach : 7           -- how far a turret can see
sentry-turn : 2.5          -- how fast it can turn, in radians a second
sentry-reload : 0.45       -- seconds between its shots
sentry-damage : 34
wall-colour : [208, 214, 196]
floor-colour : "#2b2c27"
ceiling-colour : "#1b1d22"

-- ---------------------------------------------------------------- the map
solid : [cx cy |
  row : level @ (cy floor + 1)
  cond [row = false, true, any, row @ (cx floor + 1) = "#"]
]
wall-cells : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | ch = "#"] collect [[c, ch] | [c, r]]]
-- is the way from a to b clear of walls?
clear-line : [ax ay bx by |
  steps : (bx - ax * (bx - ax) + (by - ay * (by - ay)) sqrt * 4 ceil) max 1
  range steps all [k | t : k / steps, (solid [bx - ax * t + ax, by - ay * t + ay]) not]
]
wrap : [a | cond [a > pi, a - (2 * pi), a < (0 - pi), a + (2 * pi), any, a]]

-- one ray from ox, oy at an angle: how far to the wall, and which face it hit (DDA, grid cell by grid cell)
cast : [ox oy angle |
  dx : angle cos
  dy : angle sin
  step-x : cond [dx < 0, -1, any, 1]
  step-y : cond [dy < 0, -1, any, 1]
  across : cond [dx = 0, 1000000, any, 1 / dx abs]
  along : cond [dy = 0, 1000000, any, 1 / dy abs]
  cell-x : ox floor
  cell-y : oy floor
  march : [mx my sx sy n |
    cond [
      n > 40, [far : 30, side : 0]
      sx < sy, (
        nx : mx + step-x
        solid [nx, my] [[far : sx, side : 0]] else [march [nx, my, sx + across, sy, n + 1]]
      )
      any, (
        ny : my + step-y
        solid [mx, ny] [[far : sy, side : 1]] else [march [mx, ny, sx, sy + along, n + 1]]
      )
    ]
  ]
  march [cell-x, cell-y, cond [dx < 0, ox - cell-x * across, any, cell-x + 1 - ox * across], cond [dy < 0, oy - cell-y * along, any, cell-y + 1 - oy * along], 0]
]

-- ---------------------------------------------------------------- the turrets' program
-- Each frame every turret is asked what to do. It sees: aim (where it points, in radians), cool (seconds until it can
-- fire), sees (is a guard in sight), dx and dy (to the nearest one in sight), far (how far that is) and count (how many
-- it can see). It answers with turn (-1 to 1) and fire (true or false). A shot hits if the turret points at the guard.
turret-program : [t |
  want : t dy atan2 (t dx)
  off : wrap (want - (t aim))
  [turn : clamp [off * 4, -1, 1], fire : (t sees) and (t cool <= 0) and (off abs < 0.1)]
]

-- ---------------------------------------------------------------- the people
guard : [id gx gy tx ty | [id : id, x : gx, y : gy, angle : 0, health : 100, wait : 1, alert : false, home-x : gx, home-y : gy, to-x : tx, to-y : ty, fell : false]]
start :
  hero : [x : 2.5, y : 2.5, angle : 0.6, health : 100]
  guards : [guard [1, 12.5, 2.5, 12.5, 4.5], guard [2, 3.5, 7.5, 6.5, 7.5], guard [3, 13.5, 7.5, 9.5, 7.5], guard [4, 2.5, 11.5, 2.5, 13.5], guard [5, 9.5, 12.5, 9.5, 12.5], guard [6, 13.5, 13.5, 13.5, 10.5]]
  mines : []
  blasts : []
  carried : 6
  turrets : []
  sentries-left : sentries
  drag : false
  fire-wait : 0
  mine-wait : 0
  turret-wait : 0
  flash : 0
  hurt : 0
  over : ""
  clock : 0
  dt : 0

-- move from (x, y) by (dx, dy), sliding along walls
slide : [x y dx dy |
  pad : 0.22
  nx : solid [x + dx + (cond [dx < 0, 0 - pad, any, pad]), y] [x] else [x + dx]
  ny : solid [nx, y + dy + (cond [dy < 0, 0 - pad, any, pad])] [y] else [y + dy]
  [x : nx, y : ny]
]
distance : [ax ay bx by | bx - ax * (bx - ax) + (by - ay * (by - ay)) sqrt]
near-mine-button : [tx ty | distance [tx, ty, W - 48, H - 48] < 40]
near-turret-button : [tx ty | distance [tx, ty, W - 48, H - 128] < 40]
near-button : [tx ty | (near-mine-button [tx, ty]) or (near-turret-button [tx, ty])]

-- ---------------------------------------------------------------- one frame
play : [game |
  dt : game dt
  now : game clock
  i : game input
  hero : game hero
  -- a finger: where it went down, and how far it has moved since
  finger : cond [i tapped, [x : i touch-x, y : i touch-y, at : now, last-x : i touch-x, last-y : i touch-y], i touching and (game drag != false), game drag with [last-x : i touch-x, last-y : i touch-y], any, game drag]
  released : (i touching not) and (game drag != false)
  quick-tap : released and (now - (game drag at) < 0.3) and ((game drag last-x - (game drag x)) abs < 14) and ((game drag last-y - (game drag y)) abs < 14)
  touch-turn : cond [i touching and (finger != false), clamp [finger last-x - (finger x) / 110, -1, 1], any, 0]
  touch-walk : cond [i touching and (finger != false) and (near-button [finger x, finger y] not), clamp [finger y - (finger last-y) / 80, -1, 1], any, 0]
  key-turn : cond [(i held "left") or (i held "a"), -1, (i held "right") or (i held "d"), 1, any, 0]
  key-walk : cond [(i held "up") or (i held "w"), 1, (i held "down") or (i held "s"), -1, any, 0]
  turn : touch-turn + key-turn
  walk : touch-walk + key-walk
  wants-mine : (quick-tap and (near-mine-button [game drag x, game drag y])) or ((i held "m") and (game mine-wait <= 0))
  wants-turret : (quick-tap and (near-turret-button [game drag x, game drag y])) or ((i held "t") and (game turret-wait <= 0))
  wants-fire : (quick-tap and (near-button [game drag x, game drag y] not)) or ((i held "space") and (game fire-wait <= 0))
  -- walking and turning
  heading : hero angle + (turn * turn-speed * dt)
  step : walk * walk-speed * dt
  moved : slide [hero x, hero y, heading cos * step, heading sin * step]
  -- firing: the nearest live guard near the middle of the view, nearer than the wall
  centre-wall : cast [moved x, moved y, heading] far
  target : game guards keep [g | g health > 0] keep [g |
    gd : distance [moved x, moved y, g x, g y]
    rel : wrap (g y - (moved y) atan2 (g x - (moved x)) - heading)
    (rel abs < (0.05 + (0.22 / gd))) and (gd < centre-wall)
  ] smallest-by [g | distance [moved x, moved y, g x, g y]]
  shot : wants-fire and (target != false)
  wants-fire [sound "shoot"]
  -- dropping a mine just ahead
  drop : wants-mine and (game carried > 0)
  drop [beep [440, 0.05]]
  mines : drop [game mines .. [[x : heading cos * 0.4 + (moved x), y : heading sin * 0.4 + (moved y), armed : now + mine-arm]]] else [game mines]
  -- setting down a turret just ahead
  set-down : wants-turret and (game sentries-left > 0)
  set-down [beep [660, 0.06]]
  placed : set-down [game turrets .. [[x : heading cos * 0.7 + (moved x), y : heading sin * 0.7 + (moved y), aim : heading, cool : 0.6, shots : 0, fired : false]]] else [game turrets]
  -- guards: hit by the shot, then each one patrols, or turns on you once it sees you
  hit-guards : game guards collect [g | shot and (g id = (target id)) [g with [health : g health - 50, alert : true]] else [g]]
  -- each turret finds the nearest guard it can see, asks turret-program what to do, then turns and maybe fires
  thought : placed collect [t |
    in-sight : hit-guards keep [g | (g health > 0) and (distance [t x, t y, g x, g y] < sentry-reach) and (clear-line [t x, t y, g x, g y])]
    mark : in-sight smallest-by [g | distance [t x, t y, g x, g y]]
    sees : mark != false
    dx : sees [mark x - (t x)] else [t aim cos]
    dy : sees [mark y - (t y)] else [t aim sin]
    said : turret-program [aim : t aim, cool : t cool, sees : sees, dx : dx, dy : dy, far : dx * dx + (dy * dy) sqrt, count : in-sight length]
    aim : wrap (clamp [said turn else 0, -1, 1] * sentry-turn * dt + (t aim))
    fires : (said fire else false) and (t cool <= 0)
    lands : fires and sees and (wrap (dy atan2 dx - aim) abs < 0.15)
    t with [aim : aim, cool : cond [fires, sentry-reload, any, t cool - dt], fired : fires, victim : lands [mark id] else [0], shots : cond [fires, t shots + 1, any, t shots]]
  ]
  thought any [t | t fired] [sound "shoot"]
  zapped : hit-guards collect [g |
    n : thought count [t | t victim = (g id)]
    n > 0 [g with [health : g health - (n * sentry-damage), alert : true]] else [g]
  ]
  thinking : zapped collect [g |
    g health <= 0 [g] else [
      gd : distance [g x, g y, moved x, moved y]
      facing : g y - (moved y) atan2 (g x - (moved x)) + pi
      looking : wrap (facing - (g angle)) abs < 0.9
      sees : (gd < 9) and ((g alert) or looking) and (clear-line [g x, g y, moved x, moved y])
      alert : (g alert) or sees
      goal-x : cond [alert, moved x, any, g to-x]
      goal-y : cond [alert, moved y, any, g to-y]
      gap : distance [g x, g y, goal-x, goal-y]
      pace : cond [alert and (gd < 3), 0, alert, 1.2, any, 0.8]
      head : goal-y - (g y) atan2 (goal-x - (g x))
      went : cond [gap < 0.05, [x : g x, y : g y], any, slide [g x, g y, head cos * pace * dt, head sin * pace * dt]]
      arrived : (alert not) and (gap < 0.3)
      fires : sees and (g wait <= 0)
      next-x : cond [arrived, g home-x, any, g to-x]
      next-y : cond [arrived, g home-y, any, g to-y]
      back-x : cond [arrived, g to-x, any, g home-x]
      back-y : cond [arrived, g to-y, any, g home-y]
      g with [
        x : went x, y : went y, angle : cond [alert, facing - pi, any, head], alert : alert
        wait : cond [fires, 0.9, any, g wait - dt]
        to-x : next-x, to-y : next-y, home-x : back-x, home-y : back-y
        fired : fires, hits : fires and (noise [now * 7, g id] < (0.5 - (gd * 0.035)))
      ]
    ]
  ]
  pain : thinking count [g | g hits else false] * 9
  thinking any [g | g fired else false] [sound "hit"]
  -- mines: an armed mine goes off when anyone comes near
  armed : mines keep [m | now >= (m armed)]
  goes-off : armed keep [m | (thinking any [g | (g health > 0) and (distance [m x, m y, g x, g y] < mine-reach)]) or (distance [m x, m y, moved x, moved y] < (mine-reach * 0.7))]
  still : mines keep [m | (goes-off has m) not]
  (goes-off length > 0) [shake 10, sound "impact"]
  caught : [px py | goes-off collect [m | distance [m x, m y, px, py]] keep [d | d < blast]]
  blown : thinking collect [g | caught [g x, g y] length > 0 [g with [health : 0]] else [g]]
  -- when each one fell, for the fall
  guards : blown collect [g | g with [fell : cond [(g health <= 0) and (g fell = false), now, any, g fell]]]
  blasted : caught [moved x, moved y] collect [d | blast - d * 60] sum
  life : hero health - pain - blasted
  (pain + blasted > 0) [sound "hurt"]
  blasts : game blasts keep [b | now - (b at) < 0.6] .. (goes-off collect [m | [x : m x, y : m y, at : now]])
  over : cond [life <= 0, "lost", guards all [g | g health <= 0], "won", any, ""]
  game with [
    hero : [x : moved x, y : moved y, angle : heading, health : life max 0]
    guards : guards, mines : still, blasts : blasts
    carried : drop [game carried - 1] else [game carried]
    turrets : thought
    sentries-left : set-down [game sentries-left - 1] else [game sentries-left]
    turret-wait : cond [wants-turret, 0.5, any, game turret-wait - dt]
    drag : cond [released, false, any, finger]
    fire-wait : cond [wants-fire, 0.25, any, game fire-wait - dt]
    mine-wait : cond [wants-mine, 0.5, any, game mine-wait - dt]
    flash : cond [wants-fire, 0.08, any, game flash - dt]
    hurt : cond [pain + blasted > 0, 0.25, any, game hurt - dt]
    over : over
  ]
]

update : [game | game over = "" [play game] else [(game input tapped) [start] else [game]]]

-- ---------------------------------------------------------------- drawing, in 3D
eye : 1.55                -- how high your eyes are, in metres
gun-turn : 0.1            -- which way the gun points, in radians
fog-colour : #14161c
props : [["crate", 5.4, 1.6, 0.3, 0.8], ["barrels", 14.2, 1.7, 1.2, 0.9], ["generator_large", 9.0, 10.7, 0, 1.4], ["crate", 1.7, 14.2, 1.9, 0.8], ["barrels", 14.3, 12.4, 0.4, 0.9], ["generator", 5.8, 7.7, 1.6, 1.0], ["crate", 12.3, 8.3, 0.8, 0.8]]

draw : [game |
  hero : game hero
  now : game clock
  fog [fog-colour, 3, 15]
  view [hero x, eye, hero y, hero angle, 0, 72]
  -- the lab: a floor, a ceiling, and a block for every wall cell of the map
  block [8, -0.05, 8, 16, 0.1, 16, "plate"]
  block [8, 2.55, 8, 16, 0.1, 16, "metal"]
  wall-cells each [[c, r] | block [c - 0.5, 1.25, r - 0.5, 1, 2.5, 1, "concrete"]]
  props each [[name, px, pz, turn, size] | model [name, px, 0, pz, turn, size, false, 0]]
  -- the guards: running when they chase, aiming when they're close, falling when they're hit
  game guards each [g |
    near : distance [g x, g y, hero x, hero y] < 3
    clip : cond [g health <= 0, "Death", g alert and near, "Idle_Shoot", g alert, "Run_Gun", any, "Run"]
    time : cond [g health <= 0, now - (g fell else now), g alert, now, any, now * 0.55]
    model ["soldier", g x, 0, g y, g angle, 1.8, clip, time]
  ]
  -- mines on the floor, blinking once they're live
  game mines each [m |
    model ["grenade", m x, 0, m y, 0, 0.22, false, 0]
    (now >= (m armed)) and (now * 4 % 1 < 0.5) [flash [m x, 0.3, m y, 0.05, "#ff3b30"]]
  ]
  -- the turrets, turned the way their program points them, with a spark when they fire
  game turrets each [t |
    model ["turret", t x, 0, t y, t aim + pi, 0.6, false, 0]   -- the model's barrels point back, so it is turned round
    t fired [flash [t aim cos * 0.45 + (t x), 0.55, t aim sin * 0.45 + (t y), 0.07, "#9be7ff"]]
  ]
  game blasts each [b | age : now - (b at) / 0.6, flash [b x, 0.9, b y, 0.5 + (age * 1.4), "#ffb347"]]
  -- the gun, kicking back when it fires
  kick : cond [game flash > 0, 0.05, any, 0]
  hold ["blaster_g", 0.2, -0.21, -0.55 + kick, gun-turn, 0, 0.26]
  (game flash > 0) [flash [hero angle cos * 0.7 + (hero x), 1.35, hero angle sin * 0.7 + (hero y), 0.08, "#ffd76a"]]
  -- on top: the crosshair, the map, health, mines and the mine button
  line [W / 2 - 8, H / 2, W / 2 + 8, H / 2, "#ffffffaa"]
  line [W / 2, H / 2 - 8, W / 2, H / 2 + 8, "#ffffffaa"]
  wall-cells each [[c, r] | rect [c * 4 + 2, r * 4 + 2, 4, 4, "#4a4d4588"]]
  game guards keep [g | g health > 0] each [g | circle [g x * 4 + 6, g y * 4 + 6, 1.5, "#ff5a4f"]]
  game mines each [m | circle [m x * 4 + 6, m y * 4 + 6, 1.3, "#ffd166"]]
  game turrets each [t | rect [t x * 4 + 4, t y * 4 + 4, 4, 4, "#9be7ff"]]
  circle [hero x * 4 + 6, hero y * 4 + 6, 1.8, "#ffffff"]
  rect [W - 112, 12, 100, 8, "#00000088"]
  rect [W - 112, 12, hero health, 8, cond [hero health > 35, "#7bd389", any, "#ff5a4f"]]
  text ["mines [game carried]", W - 62, 36, 12, "#f4f1ea"]
  circle [W - 48, H - 48, 34, "#00000066"]
  text ["MINE", W - 48, H - 44, 13, "#ffd166"]
  circle [W - 48, H - 128, 34, "#00000066"]
  text ["SENTRY [game sentries-left]", W - 48, H - 124, 11, "#9be7ff"]
  (game hurt > 0) [rect [0, 0, W, H, "#ff000040"]]
  (now < 5) and (game over = "") [text ["drag to walk · tap to fire · MINE · SENTRY", W / 2, H - 140, 11, "#f4f1eacc"]]
  game over = "won" [rect [0, H / 2 - 50, W, 100, "#000000aa"], text ["LAB CLEARED", W / 2, H / 2 - 6, 24, "#7bd389"], text ["tap to go again", W / 2, H / 2 + 24, 12, "#f4f1ea"]]
  game over = "lost" [rect [0, H / 2 - 50, W, 100, "#000000aa"], text ["YOU WERE CAUGHT", W / 2, H / 2 - 6, 24, "#ff5a4f"], text ["tap to go again", W / 2, H / 2 + 24, 12, "#f4f1ea"]]
]
