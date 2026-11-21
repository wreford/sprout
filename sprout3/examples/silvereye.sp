-- SilverEye: an underground lab, proximity mines and turrets you program in Sprout, in low-poly 3D.
-- Alone, sneak through and take down the six guards. With a friend it's a duel: send an invite by text (no server)
-- and the first to five takedowns wins. Mines and turrets go for whoever comes near, so lay traps.
-- On its own page (taskiap.com/silvereye) it plays on a pocket console: the stick moves and strafes (push it all the
-- way up to run), drag the screen to look, hold A to fire, B drops a mine, C-up sets down a turret, C-down turns round.
-- Keys: WASD to move and strafe, arrows to turn, space to fire, M for a mine, T for a turret.
-- In the editor's player: drag above or below the middle to walk, left or right to turn, tap the middle to fire.
-- The turrets run turret-program: change it while you play and every turret thinks the new way, on both phones.
-- Modes: Mission (the guards), Combat sim (you against simulants), Duel (two phones, simulants welcome).
-- A love letter to GoldenEye 007 (Rare, 1997) and Perfect Dark (Rare, 2000): their ideas, our own lab and art.
-- Soldiers and the turret by Quaternius, the blaster from Kenney's Blaster Kit, textures by Screaming Brain Studios (CC0).

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
mode : "mission"           -- "mission": the lab and its guards · "sim": you against simulants
simulants : 2              -- simulants in a combat sim, and joining a duel
simulant-skill : 2         -- 1 rookie, 2 agent, 3 ace
difficulty : 2             -- a mission's guards: 1 rookie (no generators to wreck), 2 agent, 3 ace
fov-across : 90            -- how wide you see, side to side, in degrees: wider than the old consoles
zoom-view : 0.45           -- aiming (Z) narrows the view to this much
walk-speed : 2.6
run-boost : 1.4            -- the stick pushed all the way up runs this much faster
turn-speed : 2.4
mine-arm : 1.2             -- seconds before a dropped mine is live
mine-reach : 1.0           -- how close someone must come to set it off
blast : 2.1                -- how far the blast reaches
mines-each : 4             -- mines you carry
sentries : 2               -- turrets you carry
sentry-reach : 7           -- how far a turret can see
sentry-turn : 2.5          -- how fast it can turn, in radians a second
sentry-reload : 0.45       -- seconds between its shots
sentry-damage : 34
shot-damage : 50           -- your shot at a guard
duel-damage : 34           -- a shot at another player
steady-damage : 50         -- the same shot while aiming
fire-every : 0.25          -- hold fire and it fires this often
clip-size : 8              -- shots before you reload
ammo-each : 48             -- spare shots you start with
reload-time : 1.1          -- seconds to reload
machine-spots : [[9.0, 10.7], [5.8, 7.7]]   -- the generators to wreck, on a mission
intel-spot : [14.5, 12.5]  -- where the intel case is
lift : [2.5, 2.5]          -- where you leave from, once it's all done
pickup-back : 20           -- seconds before a pickup is back, in a match
pickup-spots : [["ammo", 5.5, 1.5], ["armour", 8.5, 5.5], ["ammo", 14.5, 8.5], ["armour", 3.5, 10.5], ["ammo", 9.5, 13.5], ["ammo", 1.5, 5.5]]
frag-limit : 5             -- takedowns to win a duel
respawn-after : 2.5        -- seconds before you're back in a duel

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
slide : [x y dx dy |
  pad : 0.22
  nx : solid [x + dx + (cond [dx < 0, 0 - pad, any, pad]), y] [x] else [x + dx]
  ny : solid [nx, y + dy + (cond [dy < 0, 0 - pad, any, pad])] [y] else [y + dy]
  [x : nx, y : ny]
]
distance : [ax ay bx by | bx - ax * (bx - ax) + (by - ay * (by - ay)) sqrt]

-- ---------------------------------------------------------------- the turrets' program
-- Each frame every turret is asked what to do. It sees: aim (where it points, in radians), cool (seconds until it can
-- fire), sees (is anyone in sight: a guard, or the player who didn't set it down), dx and dy (to the nearest one in
-- sight), far (how far that is) and count (how many it can see). It answers with turn (-1 to 1) and fire (true or false).
-- A shot hits if the turret points at its mark.
turret-program : [t |
  want : t dy atan2 (t dx)
  off : wrap (want - (t aim))
  [turn : clamp [off * 4, -1, 1], fire : (t sees) and (t cool <= 0) and (off abs < 0.1)]
]

-- ---------------------------------------------------------------- the simulants' program
-- Each frame every simulant is asked what to do. It sees: aim (where it faces), sees (is anyone in sight), dx and dy
-- (to the nearest one it can see), far (how far that is), health, goal-dx and goal-dy (to where it's heading when it
-- sees no one), clock and id. It answers walk and strafe (-1 to 1), turn (-1 to 1) and fire (true or false).
simulant-program : [s |
  want : cond [s sees, s dy atan2 (s dx), any, s goal-dy atan2 (s goal-dx)]
  off : wrap (want - (s aim))
  [
    turn : clamp [off * 3, -1, 1]
    walk : cond [(s sees) and (s far < 2.5), -0.3, s sees, 0.6, any, 1 - (off abs) max 0]
    strafe : cond [s sees, s clock * 1.7 + (s id) sin, any, 0]
    fire : (s sees) and (off abs < 0.15)
  ]
]

-- ---------------------------------------------------------------- the people
guard-health : cond [difficulty = 1, 70, difficulty = 3, 140, any, 100]
guard : [id gx gy tx ty | [id : id, x : gx, y : gy, angle : 0, health : guard-health, wait : 1, alert : false, home-x : gx, home-y : gy, to-x : tx, to-y : ty, fell : false]]
spawns : [[2.5, 2.5, 0.6], [13.5, 13.5, -2.4], [13.5, 2.5, 2.4], [2.5, 13.5, -0.8], [7.5, 4.5, 1.6], [9.5, 10.5, -1.6], [6.5, 13.5, 0]]
spawn-of : [id | spawns @ (id - 1 % (spawns length) + 1)]
open-cells : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | ch = "."] collect [[c, ch] | [c - 0.5, r - 0.5]]]
agent : [id sx sy sa | [id : id, x : sx, y : sy, angle : sa, health : 100, carried : mines-each, sentries-left : sentries, fire-wait : 0, mine-wait : 0, turret-wait : 0, flash : 0, hurt : 0, kills : 0, hit-at : -10, down-at : false, look : false, moving : false, aimed : false, asks : false, zoomed : false, fov : fov-across, last-by : 0, bot : false, goal-x : sx, goal-y : sy, stuck : 0, clip : clip-size, ammo : ammo-each, reloading : 0, armour : 0, shots-fired : 0, shots-hit : 0]]
pickups-fresh : pickup-spots collect [[kind, px, py] | [kind : kind, x : px, y : py, back-at : 0]]
simulant : [id | s : spawn-of id, agent [id, s @ 1, s @ 2, s @ 3] with [bot : true]]
sims : [first | range simulants collect [k | simulant (first + k - 1)]]
start :
  agents : [agent [1, 2.5, 2.5, 0.6]] .. (cond [mode = "sim", sims 2, any, []])
  guards : mode = "sim" [[]] else [[guard [1, 12.5, 2.5, 12.5, 4.5], guard [2, 3.5, 7.5, 6.5, 7.5], guard [3, 13.5, 7.5, 9.5, 7.5], guard [4, 2.5, 11.5, 2.5, 13.5], guard [5, 9.5, 12.5, 9.5, 12.5], guard [6, 13.5, 13.5, 13.5, 10.5]]]
  mines : []
  turrets : []
  pickups : pickups-fresh .. (cond [mode = "sim", [], any, [[kind : "intel", x : intel-spot @ 1, y : intel-spot @ 2, back-at : 0]]])
  machines : (mode = "sim") or (difficulty = 1) [[]] else [machine-spots numbered collect [[k, spot] | [id : k, x : spot @ 1, y : spot @ 2, health : 100]]]
  intel : false
  blasts : []
  over : ""
  over-at : 0
  versus : mode = "sim"
  shell : false
  clock : 0
  dt : 0
-- two players: the same lab with no guards, one player in each far corner, and the simulants if there are any
duel : [agents : [agent [1, 2.5, 2.5, 0.6], agent [2, 13.5, 13.5, -2.4]] .. (sims 3), guards : [], mines : [], turrets : [], pickups : pickups-fresh, machines : [], blasts : [], over : "", versus : true]

-- ---------------------------------------------------------------- controls
-- what a player asks for this frame. On the console page the stick, the look drag and the buttons arrive as held
-- values (walk, strafe, look, fire, mine, sentry); keys arrive as held keys; in the editor a finger does it all.
near-mine-button : [tx ty | distance [tx, ty, W - 48, H - 48] < 40]
near-turret-button : [tx ty | distance [tx, ty, W - 48, H - 128] < 40]
near-button : [tx ty | (near-mine-button [tx, ty]) or (near-turret-button [tx, ty])]
in-middle : [tx ty | ((tx - (W / 2)) abs < (W / 6)) and ((ty - (H / 2)) abs < (H / 8))]
wants : [inp |
  key : [k | inp held k else false]
  on-console : inp held "shell" else false
  finger : (on-console not) and (inp touching) and (near-button [inp touch-x, inp touch-y] not) and (in-middle [inp touch-x, inp touch-y] not)
  tap : (on-console not) and (inp tapped)
  walk : (inp held "walk" else 0) + (cond [(key "up") or (key "w"), 1, (key "down") or (key "s"), -1, finger, clamp [H / 2 - (inp touch-y) / (H / 4), -1, 1], any, 0])
  strafe : (inp held "strafe" else 0) + (cond [key "d", 1, key "a", -1, any, 0])
  turn : cond [key "left", -1, key "right", 1, finger, clamp [inp touch-x - (W / 2) / (W / 3), -1, 1], any, 0]
  [
    walk : clamp [walk, -1, run-boost], strafe : clamp [strafe, -1, 1], turn : turn, look : inp held "look" else false
    fire : (inp held "fire" else false) or (key "space") or (tap and (in-middle [inp touch-x, inp touch-y]))
    mine : (inp held "mine" else false) or (key "m") or (tap and (near-mine-button [inp touch-x, inp touch-y]))
    reload : (inp held "reload" else false) or (key "r")
    sentry : (inp held "sentry" else false) or (key "t") or (tap and (near-turret-button [inp touch-x, inp touch-y]))
    restart : (inp tapped) or (inp held "fire" else false) or (key "space")
    zoom : (inp held "zoom" else false) or (key "z") or (key "shift"), fov : inp held "fov" else fov-across, hunt-x : false, hunt-y : false
  ]
]
up : [a | a down-at = false]
can-shoot : [a | (up a) and (a asks fire) and (a fire-wait <= 0) and (a clip > 0) and (a reloading <= 0)]
can-drop : [a | (up a) and (a asks mine) and (a mine-wait <= 0) and (a carried > 0)]
can-set : [a | (up a) and (a asks sentry) and (a turret-wait <= 0) and (a sentries-left > 0)]

-- ---------------------------------------------------------------- one frame
play : [game |
  dt : game dt
  now : game clock
  -- a simulant looks for the nearest one it can see, and asks simulant-program what to do
  think : [a |
    foes : game agents keep [o | (o id != (a id)) and (up o) and (distance [a x, a y, o x, o y] < 12) and (clear-line [a x, a y, o x, o y])]
    foe : foes smallest-by [o | distance [a x, a y, o x, o y]]
    sees : foe != false
    dx : sees [foe x - (a x)] else [0]
    dy : sees [foe y - (a y)] else [0]
    said : simulant-program [aim : a angle, sees : sees, dx : dx, dy : dy, far : dx * dx + (dy * dy) sqrt, health : a health, goal-dx : a goal-x - (a x), goal-dy : a goal-y - (a y), clock : now, id : a id]
    [
      walk : clamp [said walk else 0, -1, 1], strafe : clamp [said strafe else 0, -1, 1], look : false
      turn : clamp [said turn else 0, -1, 1] * (simulant-skill * 0.25 + 0.5)
      fire : said fire else false, mine : false, sentry : false, reload : false, restart : false, zoom : false, fov : fov-across
      hunt-x : sees [foe x] else [a goal-x], hunt-y : sees [foe y] else [a goal-y]
    ]
  ]
  -- everyone moves: the stick walks and strafes, the look drag and the keys turn
  moved-agents : game agents collect [a |
    w : a bot [think a] else [wants (a id = 2 [game input2] else [game input])]
    looked : cond [(w look = false) or (a look = false), 0, any, w look - (a look)]
    heading : cond [up a, a angle + looked + (w turn * turn-speed * dt), any, a angle]
    pace : cond [w zoom, walk-speed * 0.5, w walk > 1.05, walk-speed * run-boost, any, walk-speed] * dt
    dx : heading cos * (w walk) - (heading sin * (w strafe)) * pace
    dy : heading sin * (w walk) + (heading cos * (w strafe)) * pace
    went : cond [up a, slide [a x, a y, dx, dy], any, [x : a x, y : a y]]
    -- a simulant heads for whoever it saw last, or somewhere new once it gets there or gets stuck
    stuck : cond [(a bot) and ((w walk abs) > 0.3) and (distance [a x, a y, went x, went y] < (pace * 0.2)), a stuck + dt, any, 0]
    pick : open-cells @ ((noise [now * 3.1, a id] * (open-cells length)) floor + 1)
    fresh : (distance [went x, went y, a goal-x, a goal-y] < 0.7) or (stuck > 0.6)
    goal-x : cond [a bot not, a goal-x, w hunt-x != (a goal-x), w hunt-x, fresh, pick @ 1, any, a goal-x]
    goal-y : cond [a bot not, a goal-y, w hunt-y != (a goal-y), w hunt-y, fresh, pick @ 2, any, a goal-y]
    a with [x : went x, y : went y, angle : heading, look : w look, moving : (up a) and ((w walk abs) + (w strafe abs) > 0.1), asks : w, zoomed : (up a) and (w zoom), fov : w fov, goal-x : goal-x, goal-y : goal-y, stuck : stuck]
  ]
  -- who could be shot: guards still standing, and players still up
  marks : game guards keep [g | g health > 0] collect [g | [who : "guard", id : g id, x : g x, y : g y]] .. (moved-agents keep up collect [a | [who : "agent", id : a id, x : a x, y : a y]]) .. (game machines keep [m | m health > 0] collect [m | [who : "machine", id : m id, x : m x, y : m y]])
  -- aiming: the nearest mark near the middle of your view, nearer than the wall (a little help, as on a pad)
  aim-at : [a |
    wall : cast [a x, a y, a angle] far
    marks keep [m | (m who != "agent") or (m id != (a id))] keep [m |
      gd : distance [a x, a y, m x, m y]
      rel : wrap (m y - (a y) atan2 (m x - (a x)) - (a angle))
      (rel abs < (cond [a zoomed, 0.03 + (0.12 / gd), any, 0.05 + (0.22 / gd)])) and (gd < wall)
    ] smallest-by [m | distance [a x, a y, m x, m y]]
  ]
  ready : moved-agents collect [a | a with [aimed : cond [up a, aim-at a, any, false]]]
  shooters : ready keep can-shoot
  shot-hits : shooters keep [a | a aimed != false] collect [a | [from : a id, key : "[a aimed who] [a aimed id]", steady : a zoomed]]
  (shooters length > 0) [sound "shoot"]
  (ready any [a | (a asks fire) and (a clip = 0) and (a fire-wait <= 0) and (a reloading <= 0) and (a bot not)]) [beep [180, 0.03]]
  -- mines and turrets, each with its owner
  droppers : ready keep can-drop
  setters : ready keep can-set
  (droppers length > 0) [beep [440, 0.05]]
  (setters length > 0) [beep [660, 0.06]]
  all-mines : game mines .. (droppers collect [a | [x : a angle cos * 0.4 + (a x), y : a angle sin * 0.4 + (a y), armed : now + mine-arm, owner : a id]])
  placed : game turrets .. (setters collect [a | [x : a angle cos * 0.7 + (a x), y : a angle sin * 0.7 + (a y), aim : a angle, cool : 0.6, shots : 0, fired : false, victim : "", owner : a id]])
  -- each turret finds the nearest mark it can see (never its owner), asks turret-program what to do, turns, maybe fires
  thought : placed collect [t |
    in-sight : marks keep [m | ((m who = "guard") or ((m who = "agent") and (m id != (t owner)))) and (distance [t x, t y, m x, m y] < sentry-reach) and (clear-line [t x, t y, m x, m y])]
    mark : in-sight smallest-by [m | distance [t x, t y, m x, m y]]
    sees : mark != false
    dx : sees [mark x - (t x)] else [t aim cos]
    dy : sees [mark y - (t y)] else [t aim sin]
    said : turret-program [aim : t aim, cool : t cool, sees : sees, dx : dx, dy : dy, far : dx * dx + (dy * dy) sqrt, count : in-sight length]
    aim : wrap (clamp [said turn else 0, -1, 1] * sentry-turn * dt + (t aim))
    fires : (said fire else false) and (t cool <= 0)
    lands : fires and sees and (wrap (dy atan2 dx - aim) abs < 0.15)
    t with [aim : aim, cool : cond [fires, sentry-reload, any, t cool - dt], fired : fires, victim : lands ["[mark who] [mark id]"] else [""], shots : cond [fires, t shots + 1, any, t shots]]
  ]
  thought any [t | t fired] [sound "shoot"]
  struck : [k | shot-hits count [h | h key = k]]
  zapped : [k | thought count [t | t victim = k]]
  -- guards (only when you play alone): hit by shots and turrets, then each one patrols, or turns on you once it sees you
  hero : ready @ 1
  hit-guards : game guards collect [g |
    n : struck "guard [g id]" * shot-damage + (zapped "guard [g id]" * sentry-damage)
    n > 0 [g with [health : g health - n, alert : true]] else [g]
  ]
  thinking : hit-guards collect [g |
    g health <= 0 [g] else [
      gd : distance [g x, g y, hero x, hero y]
      facing : g y - (hero y) atan2 (g x - (hero x)) + pi
      looking : wrap (facing - (g angle)) abs < 0.9
      sees : (up hero) and (gd < 9) and ((g alert) or looking) and (clear-line [g x, g y, hero x, hero y])
      alert : (g alert) or sees
      goal-x : cond [alert, hero x, any, g to-x]
      goal-y : cond [alert, hero y, any, g to-y]
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
        wait : cond [fires, 1.5 - (difficulty * 0.3), any, g wait - dt]
        to-x : next-x, to-y : next-y, home-x : back-x, home-y : back-y
        fired : fires, hits : fires and (noise [now * 7, g id] < (0.5 - (gd * 0.035) * (difficulty * 0.35 + 0.3)))
      ]
    ]
  ]
  -- a guard who has seen you calls the others nearby
  callers : thinking keep [g | (g alert) and (g health > 0)]
  called : thinking collect [g | cond [(g alert not) and (g health > 0) and (callers any [o | distance [o x, o y, g x, g y] < 6]), g with [alert : true], any, g]]
  (called count [g | g alert] > (thinking count [g | g alert])) [beep [760, 0.12]]
  pain : thinking count [g | g hits else false] * 9
  thinking any [g | g fired else false] [sound "hit"]
  -- mines: an armed mine goes off when anyone comes near, whoever laid it
  armed : all-mines keep [m | now >= (m armed)]
  bodies : called keep [g | g health > 0] collect [g | [x : g x, y : g y]] .. (ready keep up collect [a | [x : a x, y : a y]])
  -- a shot that passes close to a mine sets it off, armed or not
  shot-mines : shooters collect-flat [a |
    wall : cast [a x, a y, a angle] far
    all-mines keep [m |
      gd : distance [a x, a y, m x, m y]
      (wrap (m y - (a y) atan2 (m x - (a x)) - (a angle)) abs < (0.04 + (0.12 / gd))) and (gd < wall)
    ]
  ]
  goes-off : all-mines keep [m | ((now >= (m armed)) and (bodies any [b | distance [m x, m y, b x, b y] < mine-reach])) or (shot-mines has m)]
  still : all-mines keep [m | (goes-off has m) not]
  (goes-off length > 0) [shake 10, sound "impact"]
  caught : [px py | goes-off collect [m | distance [m x, m y, px, py]] keep [d | d < blast]]
  caught-by : [px py | goes-off keep [m | distance [m x, m y, px, py] < blast]]
  blown : called collect [g | caught [g x, g y] length > 0 [g with [health : 0]] else [g]]
  fallen : blown collect [g | g with [fell : cond [(g health <= 0) and (g fell = false), now, any, g fell]]]
  -- pickups: walk over one to take it (ammo, or armour that takes hits before your health); in a match they come back
  near-pickup : [p | ready keep [a | (up a) and (distance [a x, a y, p x, p y] < 0.6)]]
  takes : game pickups keep [p | (now >= (p back-at)) and (near-pickup p length > 0)] collect [p | [kind : p kind, by : near-pickup p @ 1 id]]
  -- the generators: shots and blasts wreck them
  machines : game machines collect [m |
    n : struck "machine [m id]" * 25 + (caught [m x, m y] length * 100)
    m with [health : m health - n max 0]
  ]
  -- a guard who goes down drops what they carried
  drops : fallen keep [g | g fell = now] collect [g | [kind : "ammo", x : g x, y : g y, back-at : now + 0.5]]
  pickups : game pickups collect [p | cond [(now >= (p back-at)) and (near-pickup p length > 0), p with [back-at : cond [game versus, now + pickup-back, any, 1000000]], any, p]] .. drops
  (takes length > 0) [beep [990, 0.05]]
  -- players: shots, turrets, guards and blasts hurt; one who goes down is out (alone) or back soon (a duel)
  hurt-agents : ready collect [a |
    k : "agent [a id]"
    blasted : caught [a x, a y] collect [d | blast - d * 60] sum
    by-shot : shot-hits keep [h | h key = k]
    by-turret : thought keep [t | t victim = k]
    by-mine : caught-by [a x, a y]
    shot-pain : by-shot collect [h | cond [h steady, steady-damage, any, duel-damage]] sum
    total : cond [up a, shot-pain + (zapped k * sentry-damage) + (cond [a id = 1, pain, any, 0]) + blasted, any, 0]
    -- who did it, for the score: the last to hurt you
    by : by-shot length > 0 [by-shot @ 1 from] else [by-turret length > 0 [by-turret @ 1 owner] else [by-mine length > 0 [by-mine @ 1 owner] else [a last-by]]]
    got : [kind | takes count [t | (t by = (a id)) and (t kind = kind)]]
    soak : total min (a armour)
    life : a health - (total - soak)
    a with [
      health : life max 0
      armour : a armour - soak + (got "armour" * 50) min 100
      down-at : cond [(up a) and (life <= 0), now, any, a down-at]
      hurt : cond [total > 0, 0.25, any, a hurt - dt]
      last-by : by
      fire-wait : cond [can-shoot a, fire-every * (cond [a bot, 2.6 - (simulant-skill * 0.5), any, 1]), any, a fire-wait - dt]
      mine-wait : cond [can-drop a, 0.5, any, a mine-wait - dt]
      turret-wait : cond [can-set a, 0.5, any, a turret-wait - dt]
      flash : cond [can-shoot a, 0.08, any, a flash - dt]
      hit-at : cond [(can-shoot a) and (a aimed != false), now, any, a hit-at]
      shots-fired : a shots-fired + (cond [can-shoot a, 1, any, 0])
      shots-hit : a shots-hit + (cond [(can-shoot a) and (a aimed != false), 1, any, 0])
      carried : cond [can-drop a, a carried - 1, any, a carried]
      -- a clip runs out, or you ask: a reload takes a moment, then fills the clip from your spare shots (simulants never run dry)
      clip : cond [can-shoot a, a clip - 1, (a reloading > 0) and (a reloading <= dt), a clip + (clip-size - (a clip) min (a ammo)), any, a clip]
      ammo : cond [(a reloading > 0) and (a reloading <= dt) and (a bot not), a ammo - (clip-size - (a clip) min (a ammo)), any, a ammo] + (got "ammo" * 16)
      reloading : cond [a reloading > 0, a reloading - dt, (up a) and ((a clip = 0) or (a asks reload)) and (a clip < clip-size) and (a ammo > 0), reload-time, any, 0]
      sentries-left : cond [can-set a, a sentries-left - 1, any, a sentries-left]
    ]
  ]
  (hurt-agents any [a | a hurt = 0.25]) [sound "hurt"]
  went-down : hurt-agents keep [a | a down-at = now]
  scored : hurt-agents collect [a | a with [kills : a kills + (went-down count [d | (d last-by = (a id)) and (d id != (a id))])]]
  -- in a duel you come back after a moment, at the corner farthest from the other player
  back : scored collect [a |
    due : (game versus) and ((up a) not) and (now - (a down-at else now) >= respawn-after)
    others : scored keep [o | o id != (a id)]
    spot : spawns smallest-by [s | 0 - (others collect [o | distance [s @ 1, s @ 2, o x, o y]] sum)]
    due [agent [a id, spot @ 1, spot @ 2, spot @ 3] with [kills : a kills, look : a look, bot : a bot, fov : a fov, shots-fired : a shots-fired, shots-hit : a shots-hit]] else [a]
  ]
  champions : back keep [a | a kills >= frag-limit]
  winner : champions length > 0 [champions @ 1 id] else [0]
  -- the mission: every guard down, both generators wrecked, the intel taken, then back to the lift
  intel : (game intel) or (takes any [t | t kind = "intel"])
  done : (fallen all [g | g health <= 0]) and (machines all [m | m health <= 0]) and intel
  home : distance [(back @ 1) x, (back @ 1) y, lift @ 1, lift @ 2] < 1
  over : cond [
    game versus, winner > 0 ["p[winner]"] else [""]
    (up (back @ 1)) not, "lost"
    done and home, "won"
    any, ""
  ]
  game with [
    agents : back, guards : fallen, mines : still, turrets : thought, pickups : pickups, machines : machines, intel : intel
    blasts : game blasts keep [b | now - (b at) < 0.6] .. (goes-off collect [m | [x : m x, y : m y, at : now]])
    over : over, over-at : now
    shell : game input held "shell" else false
  ]
]

-- two phones turn a game for one into a duel; once it's over, fire (or a tap) starts again after a moment
update : [game |
  two : game has-field "input2"
  g : (two and (game versus not)) [game with duel] else [game]
  again : (wants (g input) restart) or (two [wants (g input2) restart] else [false])
  g over = "" [play g] else [
    (again and (g clock - (g over-at) > 1.5)) [two [g with duel] else [start]] else [g]
  ]
]

-- ---------------------------------------------------------------- drawing, in 3D
eye : 1.55                -- how high your eyes are, in metres
gun-turn : 0.1            -- which way the gun points, in radians
fog-colour : #14161c
props : [["crate", 5.4, 1.6, 0.3, 0.8], ["barrels", 14.2, 1.7, 1.2, 0.9], ["generator_large", 9.0, 10.7, 0, 1.4], ["crate", 1.7, 14.2, 1.9, 0.8], ["barrels", 14.3, 12.4, 0.4, 0.9], ["generator", 5.8, 7.7, 1.6, 1.0], ["crate", 12.3, 8.3, 0.8, 0.8]]
red : "#ff5a4f"
cream : "#f4f1ea"
cyan : "#9be7ff"
gold : "#ffd166"

draw : [game |
  now : game clock
  you-id : cond [game versus, me, any, 1]
  you : game agents keep [a | a id = you-id] @ 1
  rivals : game agents keep [a | a id != you-id]
  down : up you not
  -- the camera: your eyes, or the floor once you're down
  fog [fog-colour, 3, 15]
  -- the view is set by how wide it is across (the screen is taller than wide), and narrows while you aim
  across : you fov * (cond [you zoomed, zoom-view, any, 1])
  tall : across / 2 * pi / 180 tan * (H / W) atan * 2 * 180 / pi
  view [you x, cond [down, 0.35, any, eye], you y, you angle, cond [down, 0.5, any, 0], tall]
  -- the lab: a floor, a ceiling, and a block for every wall cell of the map
  block [8, -0.05, 8, 16, 0.1, 16, "plate"]
  block [8, 2.55, 8, 16, 0.1, 16, "metal"]
  wall-cells each [[c, r] | block [c - 0.5, 1.25, r - 0.5, 1, 2.5, 1, "concrete"]]
  props each [[name, px, pz, turn, size] | model [name, px, 0, pz, turn, size, false, 0]]
  -- the guards: running when they chase, aiming when they're close, falling when they're hit
  game guards each [g |
    near : distance [g x, g y, you x, you y] < 3
    clip : cond [g health <= 0, "Death", g alert and near, "Idle_Shoot", g alert, "Run_Gun", any, "Run"]
    time : cond [g health <= 0, now - (g fell else now), g alert, now, any, now * 0.55]
    model ["soldier", g x, 0, g y, g angle, 1.8, clip, time]
  ]
  -- the other player
  rivals each [r |
    clip : cond [up r not, "Death", r flash > 0, "Idle_Shoot", r moving, "Run_Gun", any, "Idle_Shoot"]
    time : cond [up r not, now - (r down-at else now), any, now]
    model ["soldier", r x, 0, r y, r angle, 1.8, clip, time]
    (r flash > 0) [flash [r angle cos * 0.6 + (r x), 1.3, r angle sin * 0.6 + (r y), 0.08, "#ffd76a"]]
  ]
  -- mines on the floor, blinking once they're live
  game mines each [m |
    model ["grenade", m x, 0, m y, 0, 0.22, false, 0]
    (now >= (m armed)) and (now * 4 % 1 < 0.5) [flash [m x, 0.3, m y, 0.05, "#ff3b30"]]
  ]
  -- a wrecked generator sparks
  game machines keep [m | (m health <= 0) and (now * 5 + (m id) % 1 < 0.35)] each [m | flash [m x, 1.0, m y, 0.12, "#ffb347"]]
  -- pickups, turning slowly and glowing
  game pickups keep [p | now >= (p back-at)] each [p |
    model [cond [p kind = "armour", "chest", p kind = "intel", "chest", any, "crate"], p x, 0.05 + (now * 3 + (p x) sin * 0.04), p y, now, cond [p kind = "armour", 0.4, p kind = "intel", 0.3, any, 0.3], false, 0]
    flash [p x, 0.5, p y, 0.04, cond [p kind = "armour", cyan, p kind = "intel", "#ff7ab2", any, gold]]
  ]
  game blasts each [b | age : now - (b at) / 0.6, flash [b x, 0.9, b y, 0.5 + (age * 1.4), "#ffb347"]]
  -- the turrets, turned the way their program points them, with a spark when they fire
  game turrets each [t |
    model ["turret", t x, 0, t y, t aim + pi, 0.6, false, 0]   -- the model's barrels point back, so it is turned round
    t fired [flash [t aim cos * 0.45 + (t x), 0.55, t aim sin * 0.45 + (t y), 0.07, cyan]]
  ]
  -- the mission's checklist, and the lift once it's all done
  game versus not [
    guards-down : game guards count [g | g health <= 0]
    wrecked : game machines count [m | m health <= 0]
    tick : [ok | cond [ok, "■", any, "□"]]
    text ["[tick (guards-down = (game guards length))] GUARDS [guards-down]/[game guards length]", 34, 64, 7, cream]
    text ["[tick (wrecked = (game machines length))] GENERATORS [wrecked]/[game machines length]", 38, 74, 7, cream]
    text ["[tick (game intel)] INTEL CASE", 31, 84, 7, cream]
    all-done : (guards-down = (game guards length)) and (wrecked = (game machines length)) and (game intel)
    all-done [flash [lift @ 1, 0.2, lift @ 2, 0.15 + (now * 4 sin * 0.05), "#7bd389"], text ["BACK TO THE LIFT", W / 2, 50, 11, "#7bd389"]]
  ]
  -- your gun, kicking back when it fires
  kick : cond [you flash > 0, 0.05, any, 0]
  (down not) and (you zoomed not) [hold ["blaster_g", 0.2, -0.21, -0.55 + kick, gun-turn, 0, 0.26]]
  (down not) and (you zoomed) [hold ["blaster_g", 0.0, -0.17, -0.42 + kick, 0, 0, 0.26]]
  (you flash > 0) [flash [you angle cos * 0.7 + (you x), 1.35, you angle sin * 0.7 + (you y), 0.08, "#ffd76a"]]
  -- on top: the sight (red when it's on someone, with a mark when a shot lands), the map, health, what you carry
  sight : cond [you aimed != false, red, any, "#ffffffaa"]
  line [W / 2 - 7, H / 2, W / 2 - 2, H / 2, sight]
  line [W / 2 + 2, H / 2, W / 2 + 7, H / 2, sight]
  line [W / 2, H / 2 - 7, W / 2, H / 2 - 2, sight]
  line [W / 2, H / 2 + 2, W / 2, H / 2 + 7, sight]
  (now - (you hit-at) < 0.15) [
    line [W / 2 - 10, H / 2 - 10, W / 2 - 5, H / 2 - 5, cream], line [W / 2 + 10, H / 2 - 10, W / 2 + 5, H / 2 - 5, cream]
    line [W / 2 - 10, H / 2 + 10, W / 2 - 5, H / 2 + 5, cream], line [W / 2 + 10, H / 2 + 10, W / 2 + 5, H / 2 + 5, cream]
  ]
  rect [5, 5, 50, 50, "#000000a0"]
  wall-cells each [[c, r] | rect [c * 3 + 3, r * 3 + 3, 3, 3, "#6a6e6488"]]
  game guards keep [g | g health > 0] each [g | circle [g x * 3 + 6, g y * 3 + 6, 1.4, red]]
  rivals keep up each [r | circle [r x * 3 + 6, r y * 3 + 6, 1.6, red]]
  game mines each [m | circle [m x * 3 + 6, m y * 3 + 6, 1.1, gold]]
  game turrets each [t | rect [t x * 3 + 4.5, t y * 3 + 4.5, 3, 3, cyan]]
  circle [you x * 3 + 6, you y * 3 + 6, 1.7, "#ffffff"]
  range 10 each [k | rect [W - 12 - (11 - k * 9), 10, 7, 9, cond [you health > (k - 1 * 10), cond [you health > 35, "#7bd389", any, red], any, "#00000066"]]]
  (you armour > 0) [rect [W - 102, 21, you armour * 0.9, 3, "#5fa8ff"]]
  text ["MINES [you carried]   SENTRY [you sentries-left]", W - 52, 30, 9, cream]
  -- shots: what's in the clip, and spare; a bar while you reload
  text ["[you clip] | [you ammo]", W - 30, H - 40, 13, cond [you clip = 0, red, any, cream]]
  (you reloading > 0) [rect [W / 2 - 30, H / 2 + 22, 60, 4, "#00000088"], rect [W / 2 - 30, H / 2 + 22, 60 - (you reloading / reload-time * 60), 4, gold], text ["RELOADING", W / 2, H / 2 + 34, 9, gold]]
  (you zoomed) [rect [0, 0, W, 18, "#000000aa"], rect [0, H - 18, W, 18, "#000000aa"], text ["AIM", 22, H / 2, 9, gold]]
  -- in a match: the score, and a takedown that was yours
  game versus [
    best : rivals fold [0, [m r | m max (r kills)]]
    rest : cond [rivals length = 1, "RIVAL", any, "TOP"]
    text ["YOU [you kills] · [best] [rest]", W / 2, H - 16, 12, cream]
    rivals any [r | (up r not) and (r last-by = you-id) and (now - (r down-at else now) < 1.6)] [text ["TAKEDOWN", W / 2, H / 2 - 40, 18, gold]]
    down and (game over = "") [text ["DOWN · back in [respawn-after - (now - (you down-at else now)) max 0 ceil]", W / 2, H / 2 + 40, 12, cream]]
  ]
  -- the touch buttons, when there's no console around the screen
  game shell not [
    circle [W - 48, H - 48, 34, "#00000066"]
    text ["MINE", W - 48, H - 44, 13, gold]
    circle [W - 48, H - 128, 34, "#00000066"]
    text ["SENTRY [you sentries-left]", W - 48, H - 124, 11, cyan]
  ]
  (you hurt > 0) [rect [0, 0, W, H, "#ff000040"]]
  hint : cond [game shell, "stick to move · drag to look · hold A to fire", any, "drag to walk · tap the middle to fire"]
  (now < 5) and (game over = "") [text [hint, W / 2, H - 40, 10, "#f4f1eacc"]]
  again : cond [game shell, "press A to go again", any, "tap to go again"]
  -- the end: what happened, and how you did (time, accuracy, takedowns)
  taken : game over-at
  mins : taken / 60 floor
  secs : taken % 60 floor
  two-digits : cond [secs < 10, "0[secs]", any, "[secs]"]
  accuracy : cond [you shots-fired = 0, 0, any, you shots-hit / (you shots-fired) * 100 round]
  downs : cond [game versus, you kills, any, game guards count [g | g health <= 0]]
  ending : [title colour |
    rect [0, H / 2 - 54, W, 116, "#000000bb"]
    text [title, W / 2, H / 2 - 22, 22, colour]
    text ["TIME [mins]:[two-digits]   ACCURACY [accuracy]%   TAKEDOWNS [downs]", W / 2, H / 2 + 8, 9, cream]
    text [again, W / 2, H / 2 + 36, 11, cream]
  ]
  game over = "won" [ending ["LAB CLEARED", "#7bd389"]]
  game over = "lost" [ending ["YOU WERE CAUGHT", red]]
  game over = "p[you-id]" [ending ["YOU WIN", "#7bd389"]]
  verdict : [w | (w <= 2) ["YOU LOSE"] else ["SIM [w] WINS"]]
  champion : (game over != "") and (game over != "won") and (game over != "lost") and (game over != "p[you-id]")
  winners : game agents keep [a | game over = "p[a id]"]
  (game versus) and champion [ending [verdict (winners @ 1 id), red]]
]
