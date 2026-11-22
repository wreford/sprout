-- SilverEye: five missions, proximity mines and turrets you program in Sprout, in low-poly 3D.
-- Alone, a campaign: the lab, the depot, the relay, then the compound and the quarry out under the sky. In each, take
-- down the guards, wreck the targets, take the intel and get out; keeping the scientists safe is a bonus. Guards hear
-- gunfire, so a silencer helps. A combat sim puts you against simulants; two phones play a duel or the campaign in
-- co-op, linked by an invite sent by text (no server). Mines and turrets go for whoever comes near, so lay traps.
-- On its own page (taskiap.com/silvereye) it plays on a pocket console: the stick moves and strafes (push it all the
-- way up to run), drag the screen to look, hold A to fire, B drops a mine, C-up sets down a turret, C-down turns round.
-- Keys: WASD to move and strafe, arrows to turn, space to fire, M for a mine, T for a turret.
-- In the editor's player: drag above or below the middle to walk, left or right to turn, tap the middle to fire.
-- The turrets run turret-program and the simulants simulant-program, in plain words (it sees-someone, it how-far):
-- change one while you play and they think the new way at once, on both phones. Every number below can be changed too.
-- A love letter to GoldenEye 007 (Rare, 1997) and Perfect Dark (Rare, 2000): their ideas, our own maps and art.
-- Characters, props and the turret by Quaternius, the blasters from Kenney's Blaster Kit, textures by Screaming Brain
-- Studios (all CC0, credited in vendor/models/README.md).

-- the maps are our own: the lab, the depot (rows of shelving round a loading bay) and the relay indoors, the compound
-- and the quarry out in the open. Any of them but the relay can be the arena for a match.
arena : "lab"              -- "lab", "depot", "compound" or "quarry" (both out in the open), for a combat sim or a duel
two-phones : "duel"        -- what two phones play: "duel" (against each other) or "coop" (the mission, together)
depot : [
  "################"
  "#..............#"
  "#..............#"
  "#.##..#..#..##.#"
  "#.##..#..#..##.#"
  "#...........#..#"
  "#..####D##.....#"
  "#..............#"
  "#.....#..#.....#"
  "#.###........###"
  "#.....#...#....#"
  "#..##.......##.#"
  "#..##.###.#.##.#"
  "#..............#"
  "#......#.......#"
  "################"
]
-- the compound: a walled yard out under the sky, an HQ, a guard hut and a garage (, is outdoor ground)
compound : [
  "########################"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,,,####,,#"
  "#,,#######,,,,,,,#..#,,#"
  "#,,#.....#,,,,,,,#..D,,#"
  "#,,#.....#,,,,,,,####,,#"
  "#,,#.....D,,,,,,,,,,,,,#"
  "#,,###D###,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,##,,,,,,,,,#"
  "#,,,,,,,,,,,##,,,,,,,,,#"
  "#,,,,##,,,,,,,,,,,,,,,,#"
  "#,,,,##,,,,,,,,,,,##,,,#"
  "#,,,,,,,,,,,,,,,,,##,,,#"
  "#,,,,,,,,,,,,,#######,,#"
  "#,,,,,,,,,,,,,#.....#,,#"
  "#,,,,,,,,,,,,,#.....#,,#"
  "#,,,,,,,,,,,,,#.....D,,#"
  "#,,,,,,,,,,,,,#######,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,##,,,,,,,,,,,,,,#"
  "#,,,,,,##,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "########################"
]
-- the quarry: wide open ground in the hills, rock outcrops for cover, and the site office in one corner
quarry : [
  "########################"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,###,,,,,,,,,,,,,,,#"
  "#,,,,###,,,,,,,,,##,,,,#"
  "#,,,,,,,,,,,,,,,,##,,,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,####,,,,,,,,#"
  "#,,,,,,,,,,####,,,,,,,,#"
  "#,,##,,,,,,,,,,,,,,,,,,#"
  "#,,##,,,,,,,,,,,,,,###,#"
  "#,,,,,,,,,,,,,,,,,,###,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,###,,,,,,,,,,,#"
  "#,,,,,,,,###,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,,,,##,,,#"
  "#,,,,,,,,,,,,,,,,,##,,,#"
  "#,,,,,,,,,,,,,,,,,,,,,,#"
  "#,,,,,,,,,,,,,,#######,#"
  "#,,##,,,,,,,,,,#.....#,#"
  "#,,##,,,,,,,,,,#.....D,#"
  "#,,,,,,,,,,,,,,#.....#,#"
  "#,,,,,,,,,,,,,,#######,#"
  "########################"
]
relay : [
  "################"
  "#..............#"
  "#.####D##D####.#"
  "#.#..........#.#"
  "#.#.##....##.#.#"
  "#...#......#...#"
  "##..#.#..#.#..##"
  "#.....#..#.....#"
  "#.....#..#.....#"
  "##..#.#..#.#..##"
  "#...#......#...#"
  "#.#.##....##.#.#"
  "#.#..........#.#"
  "#.####.##.####.#"
  "#..............#"
  "################"
]
lab : [
  "################"
  "#......#.......#"
  "#......#.......#"
  "#..##..#..###..#"
  "#..##..D..#....#"
  "#......#..#....#"
  "####D###..#D####"
  "#......#.......#"
  "#......#.......#"
  "#D###..####..###"
  "#...#..........#"
  "#...#..#####...#"
  "#......#...#...#"
  "#..........#...#"
  "#......#.......#"
  "################"
]
mode : "mission"           -- "mission": the lab and its guards · "sim": you against simulants
simulants : 3              -- simulants in a combat sim, and joining a duel (up to 7)
simulant-skill : 2         -- 1 rookie, 2 agent, 3 ace
difficulty : 2             -- a mission's guards: 1 rookie (no generators to wreck), 2 agent, 3 ace
-- seeing
fov-across : 110           -- how wide you see, side to side, in degrees: far wider than the old consoles
sight-always : true        -- the sight on screen all the time, or only while you aim
markers : true             -- objective markers on screen (off: find your own way, as on the old consoles)
zoom-view : 0.45           -- aiming (Z) narrows the view to this much
tiny : false               -- a secret: guards drawn at sixty per cent (only the look)
turbo : false              -- unlocked by all three medals in one mission: everyone moves half as fast again
-- moving
walk-pace : 2.6             -- metres a second at a walk
walk-speed : walk-pace * (cond [turbo, 1.5, any, 1])
run-boost : 1.4            -- the stick pushed all the way up runs this much faster
turn-speed : 2.4            -- how fast the keys and simulants turn, in radians a second
-- mines
mine-arm : 1.2             -- seconds before a dropped mine is live
mine-reach : 1.0           -- how close someone must come to set it off
blast : 2.1                -- how far the blast reaches
mines-each : 4             -- mines you carry
-- turrets
sentries : 2               -- turrets you carry
sentry-reach : 7           -- how far a turret can see
sentry-turn : 2.5          -- how fast it can turn, in radians a second
sentry-reload : 0.45       -- seconds between its shots
sentry-damage : 34         -- a turret's shot
-- guards
hearing : 7                -- how far off a guard hears your shot, through walls (the heavy blaster half as far again)
-- shots
shot-damage : 50           -- your shot at a guard
duel-damage : 34           -- a shot at another player
steady-damage : 50         -- the same shot while aiming
fire-every : 0.25          -- hold fire and it fires this often
clip-size : 8              -- shots before you reload
ammo-each : 48             -- spare shots you start with
reload-time : 1.1          -- seconds to reload
heavy-spot : [12.5, 9.5]   -- where the heavy blaster lies
heavy-every : 0.6          -- the heavy blaster fires this often
heavy-damage : 70          -- and hits this hard (110 on a guard)
-- matches and missions
pickup-back : 20           -- seconds before a pickup is back, in a match
pickup-spots : [["ammo", 5.5, 1.5], ["armour", 8.5, 5.5], ["ammo", 14.5, 8.5], ["armour", 3.5, 10.5], ["ammo", 9.5, 13.5], ["ammo", 1.5, 5.5]]
frag-limit : 5             -- takedowns to win a duel
respawn-after : 2.5        -- seconds before you're back in a duel
par-time : 180             -- finish a mission inside this for the time medal
time-limit : 300           -- a match ends after this many seconds; the most takedowns wins

-- ---------------------------------------------------------------- the map
-- ---------------------------------------------------------------- the campaign
-- Three missions, each its own map, guards, targets and way out. On the console, winning one leads to the next
-- (alone, or two phones in co-op). guards: [number, x, y, then where it patrols to]; targets: [x, y, model, size].
stage : 1                  -- which mission (1 to 5)
campaign : false           -- true on the console: a won mission waits for the next instead of starting again
lab-props : [["crate", 5.4, 1.6, 0.3, 0.8], ["barrels", 14.2, 1.7, 1.2, 0.9], ["crate", 1.7, 14.2, 1.9, 0.8], ["barrels", 14.3, 12.4, 0.4, 0.9], ["crate", 12.3, 8.3, 0.8, 0.8]]
depot-props : [["barrels", 7.5, 7.5, 0.3, 0.9], ["crate", 1.6, 1.6, 0.4, 0.8], ["crate", 14.4, 14.4, 1.2, 0.8], ["barrels", 14.3, 1.6, 2.0, 0.9], ["crate", 8.0, 9.4, 0, 0.7], ["barrels", 1.7, 14.3, 0.7, 0.9], ["delivery_van", 12.4, 14.35, 0, 1.7]]
relay-props : [["satellite_dish", 8.6, 5.4, 2.3, 1.5], ["column", 3.5, 3.5, 0, 2.5], ["column", 12.5, 3.5, 0, 2.5], ["column", 3.5, 12.5, 0, 2.5], ["column", 12.5, 12.5, 0, 2.5], ["barrels", 1.6, 1.6, 0.2, 0.9], ["crate", 14.4, 1.6, 0.9, 0.8], ["crate", 1.6, 14.4, 1.4, 0.8], ["barrels", 14.3, 14.3, 2.2, 0.9]]
compound-props : [["tree_pine", 1.7, 1.7, 0, 3.4], ["tree_pine_tall", 22.3, 6.5, 0.6, 4.2], ["tree_oak", 1.8, 10.5, 0.3, 3], ["tree_oak", 22.2, 21.4, 1.1, 3], ["tree_pine", 15.6, 22.2, 0.2, 3.2], ["tree_pine", 10.5, 1.6, 0.9, 3.1], ["tree_oak", 9.0, 13.2, 2.1, 2.8], ["bush", 13.6, 11.2, 0, 0.9], ["bush", 4.2, 16.4, 0.7, 1], ["bush", 21.4, 15.3, 1.3, 0.9], ["rock_large", 18.2, 9.4, 0.5, 1.1], ["rock_large", 6.8, 18.4, 2.2, 0.9], ["delivery_van", 9.6, 22.3, 0, 1.7], ["crate", 16.4, 3.6, 0.4, 0.8], ["barrels", 22.3, 1.7, 0.2, 0.9], ["crate", 14.2, 19.4, 1.1, 0.8], ["barrels", 1.7, 22.3, 0.8, 0.9], ["generator", 10.5, 4.6, 1.6, 1.0]]
-- the compound's pickups (the heavy blaster waits in the HQ), for its mission and for matches out in the yard
compound-spots : [["ammo", 8.5, 9.5], ["armour", 19.5, 10.5], ["ammo", 3.5, 13.5], ["ammo", 12.5, 20.5], ["armour", 17.5, 15.5], ["ammo", 18.5, 3.5]]
compound-heavy : [5.5, 5.5]
-- the quarry's things: the truck you came in, rocks, a few trees, the rigs' generator and crates
quarry-props : [["delivery_van", 5.0, 1.7, 0, 1.0], ["rock_large", 9.5, 2.0, 0.4, 1.4], ["rock_large", 22.0, 6.0, 1.2, 1.2], ["rock_large", 6.0, 19.0, 2.0, 1.3], ["rock_large", 13.0, 17.8, 0.7, 1.0], ["tree_pine", 1.7, 22.2, 0, 3.2], ["tree_pine_tall", 22.3, 1.7, 0.5, 4.0], ["tree_oak", 9.0, 22.0, 0.3, 2.8], ["crate", 17.0, 9.5, 0.4, 0.8], ["barrels", 7.0, 12.8, 0, 0.9], ["crate", 14.2, 19.6, 1.0, 0.8], ["generator", 14.0, 1.6, 0, 1.0]]
quarry-spots : [["ammo", 6.5, 9.5], ["armour", 15.5, 3.5], ["ammo", 4.5, 15.5], ["ammo", 13.5, 21.5], ["armour", 21.5, 12.5], ["ammo", 10.5, 4.5]]
quarry-heavy : [12.5, 13.5]
missions : [
  [
    name : "THE LAB", map : lab, props : lab-props, walls : "concrete", band : #2a9d8f, air : #2a3140, floor : "plate", ceiling : "metal", haze : 22, light : [#eef4ff, #5a4a38, #fff0d8, 1.25]
    spawn-at : [2.5, 2.5, 0.6], exit : [2.5, 2.5], exit-name : "BACK TO THE LIFT"
    guards : [[1, 12.5, 2.5, 12.5, 4.5], [2, 3.5, 7.5, 6.5, 7.5], [3, 13.5, 7.5, 9.5, 7.5], [4, 2.5, 11.5, 2.5, 13.5], [5, 9.5, 12.5, 9.5, 12.5], [6, 13.5, 13.5, 13.5, 10.5]]
    targets : [[9.0, 10.7, "generator_large", 1.4], [5.8, 7.7, "generator", 1.0]], target-name : "GENERATORS", target-one : "GENERATOR"
    guard-kinds : [1]
    intel : [14.5, 12.5], intel-name : "INTEL CASE", silencer : [1.5, 10.5]
    scientists : [[1, 8.5, 1.5, 14.5, 1.5], [2, 1.5, 13.5, 10.5, 13.5]]
    brief : ["An underground lab. Six guards.", "Wreck both generators, take the intel case,", "then get back to the lift."]
  ]
  [
    name : "THE DEPOT", map : depot, props : depot-props, walls : "metal", band : #e0a526, air : #3a3528, floor : "wood", ceiling : "plate", haze : 28, light : [#fff6e2, #5e4a2e, #ffd9a0, 1.3]
    spawn-at : [1.5, 1.5, 0.8], exit : [14.5, 14.5], exit-name : "TO THE LOADING BAY"
    guards : [[1, 7.5, 7.5, 12.5, 7.5], [2, 4.5, 1.5, 10.5, 1.5], [3, 14.5, 5.5, 14.5, 10.5], [4, 1.5, 9.5, 1.5, 13.5], [5, 8.5, 13.5, 12.5, 13.5], [6, 11.5, 10.5, 11.5, 8.5], [7, 5.5, 5.5, 5.5, 8.5]]
    targets : [[7.5, 9.5, "barrels", 1.1], [13.5, 7.5, "barrels", 1.1], [3.5, 13.5, "barrels", 1.1]], target-name : "FUEL STACKS", target-one : "FUEL STACK"
    guard-kinds : [2]
    intel : [14.5, 1.5], intel-name : "SHIPPING MANIFEST", silencer : [8.5, 1.5]
    scientists : [[1, 2.5, 7.5, 13.5, 7.5]]
    brief : ["A supply depot, rows of shelving, seven guards.", "Blow the three fuel stacks, find the manifest,", "and get out through the loading bay."]
  ]
  [
    name : "THE RELAY", map : relay, props : relay-props, walls : "wall", band : #3d7cc9, air : #1d2a3a, floor : "metal", ceiling : "plate", haze : 18, light : [#dff0ff, #2e3a4e, #c8e4ff, 1.2]
    spawn-at : [14.5, 3.5, 3.1], exit : [14.5, 3.5], exit-name : "BACK TO THE HATCH"
    guards : [[1, 7.5, 7.5, 8.5, 8.5], [2, 1.5, 1.5, 14.5, 1.5], [3, 14.5, 14.5, 1.5, 14.5], [4, 3.5, 7.5, 3.5, 10.5], [5, 12.5, 7.5, 12.5, 10.5], [6, 7.5, 3.5, 10.5, 3.5], [7, 7.5, 12.5, 10.5, 12.5], [8, 1.5, 7.5, 1.5, 10.5]]
    targets : [[7.5, 5.5, "generator_large", 1.2], [8.5, 10.5, "generator_large", 1.2]], target-name : "TRANSMITTERS", target-one : "TRANSMITTER"
    guard-kinds : [3, 1]
    intel : [8.0, 7.5], intel-name : "CODEBOOK", silencer : [1.5, 14.5]
    scientists : [[1, 5.5, 14.5, 10.5, 14.5], [2, 5.5, 1.5, 10.5, 1.5]]
    warden : [9, 8.0, 8.0, 8.0, 7.0]
    brief : ["A relay station, held by the Warden himself.", "Silence both transmitters, take the codebook,", "and leave by the hatch you came in."]
  ]
  [
    name : "THE COMPOUND", map : compound, props : compound-props, walls : "concrete", air : #bcd6ee, floor : "wood", ceiling : "plate", haze : 38
    light : [#ffffff, #6e8a50, #fff2d8, 1.55], sky-top : #4f8fdc, ground : "grass"
    spawn-at : [2.5, 21.5, -0.8], exit : [12.5, 22.5], exit-name : "OUT THROUGH THE GATE"
    guards : [[1, 6.5, 9.5, 16.5, 9.5], [2, 12.5, 6.5, 12.5, 12.5], [3, 20.5, 8.5, 20.5, 13.5], [4, 9.5, 15.5, 9.5, 21.5], [5, 16.5, 20.5, 21.5, 20.5], [6, 3.5, 9.5, 3.5, 13.5], [7, 5.5, 4.5, 7.5, 5.5], [8, 18.5, 3.5, 18.5, 4.5], [9, 17.5, 16.5, 19.5, 16.5], [10, 15.5, 11.5, 10.5, 11.5]]
    targets : [[12.5, 3.5, "satellite_dish", 1.7], [6.5, 18.5, "satellite_dish", 1.7]], target-name : "RADIO MASTS", target-one : "RADIO MAST"
    guard-kinds : [2, 1]
    intel : [4.5, 4.5], intel-name : "FLIGHT PLANS", silencer : [16.5, 16.5]
    scientists : [[1, 16.5, 15.5, 19.5, 15.5]]
    spots : compound-spots, heavy : compound-heavy
    brief : ["A walled compound in the open: ten guards in the yard.", "Wreck both radio masts, take the flight plans", "from the HQ, and get out through the gate."]
  ]
  [
    name : "THE QUARRY", map : quarry, props : quarry-props, walls : "stone", air : #cdbfa4, floor : "wood", ceiling : "plate", haze : 42
    light : [#fff6e6, #8a7350, #ffe2b8, 1.4], sky-top : #5d9de2, ground : "gravel"
    spawn-at : [2.5, 1.5, 0.8], exit : [2.5, 1.5], exit-name : "BACK TO THE TRUCK"
    guards : [[1, 6.5, 6.5, 16.5, 6.5], [2, 12.5, 2.5, 12.5, 5.5], [3, 20.5, 2.5, 20.5, 8.5], [4, 5.5, 11.5, 15.5, 11.5], [5, 14.5, 9.5, 14.5, 15.5], [6, 2.5, 13.5, 2.5, 17.5], [7, 7.5, 16.5, 15.5, 16.5], [8, 21.5, 12.5, 21.5, 16.5], [9, 11.5, 20.5, 11.5, 18.5], [10, 18.5, 13.5, 18.5, 13.5]]
    targets : [[8.5, 8.5, "generator_large", 1.3], [20.5, 14.5, "generator_large", 1.3]], target-name : "DRILL RIGS", target-one : "DRILL RIG"
    guard-kinds : [2, 1, 3]
    intel : [18.5, 20.5], intel-name : "SURVEY MAPS", silencer : [22.5, 2.5]
    scientists : [[1, 4.5, 21.5, 12.5, 21.5]]
    spots : quarry-spots, heavy : quarry-heavy
    brief : ["A quarry in the hills, wide open, ten guards.", "Wreck both drill rigs, take the survey maps", "from the site office, and get back to the truck."]
  ]
]
mission : missions @ (stage max 1 min (missions length))
-- where players start and come back in a match: indoors, out in the compound's yard, and in the quarry
room-spawns : [[2.5, 2.5, 0.6], [13.5, 13.5, -2.4], [13.5, 2.5, 2.4], [2.5, 13.5, -0.8], [7.5, 4.5, 1.6], [9.5, 10.5, -1.6], [6.5, 13.5, 0], [11.5, 5.5, 3.1], [14.5, 7.5, 3.1], [1.5, 12.5, 0], [8.5, 1.5, 1.6], [5.5, 4.5, 0], [12.5, 10.5, -1.6], [1.5, 7.5, 0], [14.5, 13.5, 3.1]]
yard-spawns : [[2.5, 21.5, -0.8], [20.5, 1.5, 2.4], [20.5, 21.5, -2.4], [3.5, 1.5, 0.8], [12.5, 12.5, 0], [16.5, 8.5, 3.1], [6.5, 9.5, 0], [10.5, 19.5, -1.6], [12.5, 1.5, 1.6], [1.5, 15.5, 0], [22.5, 12.5, 3.1], [6.5, 5.5, 0], [17.5, 16.5, 3.1], [12.5, 5.5, 1.6], [19.5, 3.5, 1.6]]
quarry-spawns : [[2.5, 1.5, 0.8], [22.5, 21.5, -2.4], [21.5, 1.5, 2.4], [1.5, 21.5, -0.8], [12.5, 12.5, 0], [6.5, 6.5, 0], [19.5, 4.5, 3.1], [4.5, 15.5, 0], [18.5, 12.5, 3.1], [10.5, 19.5, -1.6], [13.5, 9.5, 1.6], [8.5, 3.5, 1.6], [22.5, 9.5, 3.1], [2.5, 10.5, 0], [16.5, 16.5, -1.6]]
-- the arenas for a combat sim or a duel: each a map with its props, where players start, its pickups, and which
-- mission's look it borrows. A new arena is a new row (and a name for arena, at the top).
arenas : [
  [name : "lab", map : lab, props : lab-props, spawns : room-spawns, spots : pickup-spots, heavy : heavy-spot, look : 1]
  [name : "depot", map : depot, props : depot-props, spawns : room-spawns, spots : pickup-spots, heavy : heavy-spot, look : 2]
  [name : "compound", map : compound, props : compound-props, spawns : yard-spawns, spots : compound-spots, heavy : compound-heavy, look : 4]
  [name : "quarry", map : quarry, props : quarry-props, spawns : quarry-spawns, spots : quarry-spots, heavy : quarry-heavy, look : 5]
]
arena-here : arenas keep [a | a name = arena] @ 1 else (arenas @ 1)
level : cond [mode = "mission", mission map, any, arena-here map]
props : cond [mode = "mission", mission props, any, arena-here props]
-- how a place looks (walls, floor, light, air, sky): a match borrows the look of the mission played on the same map
scene : cond [mode = "mission", mission, any, missions @ (arena-here look)]
solid : [cx cy |
  row : level @ (cy floor + 1)
  cond [row = false, true, any, row @ (cx floor + 1) = "#"]
]
-- how big the map is (maps can be any size), and whether any of it is out under the sky (a , in the map)
map-w : level @ 1 length
map-h : level length
has-sky : level any [row | row has ","]
-- a row's runs of cells that are (or aren't) out under the sky, as [from, to] columns: one block each, not one a cell
runs-of : [row outdoor |
  marks : row chars collect [ch | (ch = ",") = outdoor]
  done : marks numbered fold [[list : [], from : 0], [acc [c, on] |
    cond [
      on and (acc from = 0), acc with [from : c]
      (on not) and (acc from > 0), [list : acc list .. [[acc from, c - 1]], from : 0]
      any, acc
    ]
  ]]
  done list .. (cond [done from > 0, [[done from, marks length]], any, []])
]
spans : [outdoor | level numbered collect-flat [[r, row] | runs-of [row, outdoor] collect [[a, b] | [x : a - 1 + b / 2, z : r - 0.5, w : b - a + 1]]]]
ceiling-runs : spans false
ground-runs : spans true
wall-cells : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | ch = "#"] collect [[c, ch] | [c, r]]]
-- lamps in the ceiling, over every third open cell each way
ceiling-lamps : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | (ch = ".") and (c % 3 = 2) and (r % 3 = 2)] collect [[c, ch] | [c - 0.5, r - 0.5]]]
-- doors: a D in a map is floor with a door in it; the door slides up as anyone comes near. across: walls left and
-- right (spans-x), so the door spans the passage east to west (otherwise north to south)
door-cells : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | ch = "D"] collect [[c, ch] | [x : c - 0.5, y : r - 0.5, spans-x : row @ (c - 1) = "#"]]]
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
-- Every frame each turret asks this what to do. What it knows:
--   it sees-someone   true when a guard, or a player who didn't set it down, is in sight
--   it off-target     how far round it must turn to face the nearest one (0 is dead on; the sign says which way)
--   it how-far        how far away they are, in metres (99 when no one is in sight)
--   it can-fire       true when it has reloaded
--   it how-many       how many it can see
-- What it answers: turn (-1 to 1, which way and how fast) and fire (true or false). A shot hits if it faces its mark.
turret-program : [it |
  [turn : it off-target * 4, fire : (it sees-someone) and (it can-fire) and (it off-target abs < 0.1)]
]

-- ---------------------------------------------------------------- the simulants' program
-- Every frame each simulant asks this what to do. What it knows:
--   it sees-someone   true when someone is in sight
--   it off-target     how far round it must turn to face them (0 is dead on)
--   it how-far        how far away they are, in metres (99 when no one is in sight)
--   it off-path       how far round it must turn to face where it's heading when it sees no one
--   it health         0 to 100
--   it style          "hunter" (closes in), "flanker" (circles) or "camper" (holds its ground)
--   it number         which simulant this is, and it clock, the seconds since the round began
-- What it answers: walk and strafe (-1 to 1: back or forward, left or right), turn (-1 to 1) and fire (true or false).
simulant-program : [it |
  facing : cond [it sees-someone, it off-target, any, it off-path]
  [
    turn : facing * 3
    walk : cond [
      (it sees-someone) and (it style = "camper"), 0
      (it sees-someone) and (it how-far < 2.5), -0.3
      it sees-someone, cond [it style = "hunter", 1, any, 0.4]
      any, 1 - (facing abs) max 0
    ]
    strafe : cond [(it sees-someone) and (it style = "flanker"), 1, (it sees-someone) and (it style = "camper"), 0, it sees-someone, it clock * 1.7 + (it number) sin, any, 0]
    fire : (it sees-someone) and (it off-target abs < 0.15)
  ]
]
styles : ["hunter", "flanker", "camper"]
-- the guards' looks, by mission (guard-kinds): guards in fatigues and caps, soldiers in helmets and vests, and elites
-- in black with masks. They're our own figures (rig: in the 3D words): a grown person's proportions, built from boxes,
-- each carrying a gun, posed by code to walk, run, aim, shoot, flinch and fall.
guard-looks : [
  [body : "rig:guard", walk : "walk", pace : 1, run : "run", aim : "aim", shoot : "shoot", hit : "hit", death : "death", size : 1.8, holds : "gun"]
  [body : "rig:soldier", walk : "walk", pace : 1, run : "run", aim : "aim", shoot : "shoot", hit : "hit", death : "death", size : 1.82, holds : "gun"]
  [body : "rig:elite", walk : "walk", pace : 1, run : "run", aim : "aim", shoot : "shoot", hit : "hit", death : "death", size : 1.84, holds : "gun"]
]
-- the character creator's looks, each with its own clips and a gun where its hand can hold one (all CC0, Quaternius)
looks : [
  [name : "OPERATIVE", body : "hooded_adventurer", run : "Run_Shoot", aim : "Idle_Gun_Pointing", shoot : "Gun_Shoot", death : "Death", size : 1.75, holds : "blaster_g"]
  [name : "FIELD AGENT", body : "adventurer", run : "Run_Shoot", aim : "Idle_Gun_Pointing", shoot : "Gun_Shoot", death : "Death", size : 1.8, holds : "blaster_g"]
  [name : "THE MONARCH", body : "monarch", run : "Run_Shoot", aim : "Idle_Gun_Pointing", shoot : "Gun_Shoot", death : "Death", size : 1.85, holds : "blaster_e"]
  [name : "SPACEFARER", body : "astronaut", run : "Run_Gun", aim : "Idle_Gun", shoot : "Run_Gun_Shoot", death : "Death", size : 1.6, holds : false]
  [name : "TROOPER", body : "soldier", run : "Run_Gun", aim : "Idle_Shoot", shoot : "Idle_Shoot", death : "Death", size : 1.8, holds : false]
  [name : "SCIENTIST", body : "worker", run : "Man_Run", aim : "Man_Idle", shoot : "Man_Idle", death : "Man_Death", size : 1.75, holds : false]
  [name : "GUNNER", body : "robot_gunner", run : "Run", aim : "Idle", shoot : "Shoot", death : "Death", size : 1.6, holds : false]
  [name : "THE AGENT", body : "rig:agent", run : "run", aim : "aim", shoot : "shoot", death : "death", size : 1.82, holds : "gun"]
  [name : "COMMANDO", body : "rig:soldier", run : "run", aim : "aim", shoot : "shoot", death : "death", size : 1.82, holds : "gun"]
]
robot-look : looks @ 7
-- simulants' codenames, by number (players are 1 and 2, so the first simulant is usually 2 or 3)
sim-names : ["ASTER", "BRAM", "CINDER", "DUSK", "EMBER", "FLINT", "GALE", "HALE", "IVO"]
sim-name : [n | sim-names @ (n - 2 max 0 % (sim-names length) + 1)]

-- ---------------------------------------------------------------- the people
guard-health : cond [difficulty = 1, 70, difficulty = 3, 140, any, 100]
guard : [id gx gy tx ty | [id : id, x : gx, y : gy, angle : 0, health : guard-health, wait : 1, alert : false, home-x : gx, home-y : gy, to-x : tx, to-y : ty, fell : false, stagger : 0, target : 1, alert-at : -10, boss : false]]
-- where players and simulants start and come back: open floor in both maps, far corners first
-- a scientist: unarmed, walks between two points, freezes once the alarm is up; hurting one fails the mission
scientist : [id sx sy tx ty | [id : id, x : sx, y : sy, angle : 0, health : 30, home-x : sx, home-y : sy, to-x : tx, to-y : ty, fell : false]]
spawns : arena-here spawns
spawn-of : [id | spawns @ (id - 1 % (spawns length) + 1)]
open-cells : level numbered collect-flat [[r, row] | row chars numbered keep [[c, ch] | (ch = ".") or (ch = ",")] collect [[c, ch] | [c - 0.5, r - 0.5]]]
agent : [id sx sy sa | [id : id, x : sx, y : sy, angle : sa, health : 100, carried : mines-each, sentries-left : sentries, fire-wait : 0, mine-wait : 0, turret-wait : 0, flash : 0, hurt : -10, kills : 0, hit-at : -10, down-at : false, look : false, moving : false, aimed : false, asks : false, zoomed : false, fov : fov-across, last-by : 0, bot : false, goal-x : sx, goal-y : sy, stuck : 0, clip : clip-size, ammo : ammo-each, reloading : 0, armour : 0, shots-fired : 0, shots-hit : 0, has-heavy : false, weapon : "blaster", swap-wait : 0, safe-until : 0, damage-taken : 0, hurt-x : 0, hurt-y : 0, streak : 0, streak-at : -10]]
here-spots : cond [mode = "mission", mission spots else pickup-spots, any, arena-here spots]
here-heavy : cond [mode = "mission", mission heavy else heavy-spot, any, arena-here heavy]
pickups-fresh : here-spots collect [[kind, px, py] | [kind : kind, x : px, y : py, back-at : 0]] .. [[kind : "heavy", x : here-heavy @ 1, y : here-heavy @ 2, back-at : 0]]
simulant : [id | s : spawn-of id, agent [id, s @ 1, s @ 2, s @ 3] with [bot : true]]
sims : [first | range simulants collect [k | simulant (first + k - 1)]]
-- the Warden: a mech in the relay's hall, with four times the health of a guard, who hits twice as hard
wardens : cond [(mode = "mission") and (mission has-field "warden"), [mission warden] collect [[k, gx, gy, tx, ty] | guard [k, gx, gy, tx, ty] with [boss : true, health : guard-health * 4]], any, []]
start :
  agents : cond [mode = "mission", [agent [1, mission spawn-at @ 1, mission spawn-at @ 2, mission spawn-at @ 3]], any, [agent [1, spawn-of 1 @ 1, spawn-of 1 @ 2, spawn-of 1 @ 3]]] .. (cond [mode = "sim", sims 2, any, []])
  -- anything but a mission is a match: no guards, no objectives (a duel waits here for the second phone)
  guards : mode != "mission" [[]] else [mission guards collect [[k, gx, gy, tx, ty] | guard [k, gx, gy, tx, ty]] .. wardens]
  mines : []
  turrets : []
  -- a mission also hides its intel, and a silencer: with it, guards don't hear your blaster
  pickups : pickups-fresh .. (cond [mode != "mission", [], any, [[kind : "intel", x : mission intel @ 1, y : mission intel @ 2, back-at : 0], [kind : "quiet", x : mission silencer @ 1, y : mission silencer @ 2, back-at : 0]]])
  scientists : mode != "mission" [[]] else [mission scientists collect [[k, sx, sy, tx, ty] | scientist [k, sx, sy, tx, ty]]]
  machines : (mode != "mission") or (difficulty = 1) [[]] else [mission targets numbered collect [[k, spot] | [id : k, x : spot @ 1, y : spot @ 2, health : 100, model : spot @ 3, size : spot @ 4]]]
  intel : false
  holes : []
  match-start : 0
  began : 0
  feed : []
  blasts : []
  over : ""
  over-at : 0
  versus : mode != "mission"
  shell : false
  clock : 0
  dt : 0
-- two players: the arena with no guards, one player in each far corner, and the simulants if there are any
duel : [agents : [1, 2] collect [k | at : spawn-of k, agent [k, at @ 1, at @ 2, at @ 3]] .. (sims 3), guards : [], mines : [], turrets : [], pickups : pickups-fresh, machines : [], feed : [], blasts : [], over : "", versus : true]

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
    swap : (inp held "swap" else false) or (key "q")
    sentry : (inp held "sentry" else false) or (key "t") or (tap and (near-turret-button [inp touch-x, inp touch-y]))
    restart : (inp tapped) or (inp held "fire" else false) or (key "space")
    zoom : (inp held "zoom" else false) or (key "z") or (key "shift"), fov : inp held "fov" else fov-across, hunt-x : false, hunt-y : false, assist : inp held "assist" else 1, skin : inp held "skin" else 1, tag : inp held "tag" else ""
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
    manner : styles @ (a id % 3 + 1)
    dx : sees [foe x - (a x)] else [0]
    dy : sees [foe y - (a y)] else [0]
    path-dx : a goal-x - (a x)
    path-dy : a goal-y - (a y)
    -- what the program knows, in plain words (aim, sees, dx, dy, far, goal-dx, goal-dy and id are the older names, kept)
    knows : [
      sees-someone : sees, off-target : sees [wrap (dy atan2 dx - (a angle))] else [0], how-far : sees [dx * dx + (dy * dy) sqrt] else [99]
      off-path : wrap (path-dy atan2 path-dx - (a angle)), health : a health, style : manner, number : a id, clock : now
      aim : a angle, sees : sees, dx : dx, dy : dy, far : dx * dx + (dy * dy) sqrt, goal-dx : path-dx, goal-dy : path-dy, id : a id
    ]
    said : simulant-program knows
    [
      walk : clamp [said walk else 0, -1, 1], strafe : clamp [said strafe else 0, -1, 1], look : false
      turn : clamp [said turn else 0, -1, 1] * (simulant-skill * 0.25 + 0.5)
      fire : said fire else false, mine : false, sentry : false, reload : false, swap : false, assist : 1, skin : 7, tag : "", restart : false, zoom : false, fov : fov-across
      hunt-x : sees [foe x] else [a goal-x], hunt-y : sees [foe y] else [a goal-y], knows : knows
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
    a with [x : went x, y : went y, angle : heading, look : w look, moving : (up a) and ((w walk abs) + (w strafe abs) > 0.1), asks : w, skin : w skin, tag : w tag, zoomed : (up a) and (w zoom), fov : w fov, goal-x : goal-x, goal-y : goal-y, stuck : stuck]
  ]
  -- who could be shot: guards still standing, and players still up (but not your partner in a two-phone mission)
  marks : game guards keep [g | g health > 0] collect [g | [who : "guard", id : g id, owner : 0, x : g x, y : g y]] .. (moved-agents keep up keep [a | game versus] collect [a | [who : "agent", id : a id, owner : a id, x : a x, y : a y]]) .. (game machines keep [m | m health > 0] collect [m | [who : "machine", id : m id, owner : 0, x : m x, y : m y]]) .. (game turrets collect [t | [who : "turret", id : t id, owner : t owner, x : t x, y : t y]]) .. (game scientists keep [c | c health > 0] collect [c | [who : "scientist", id : c id, owner : 0, x : c x, y : c y]])
  -- aiming: the nearest mark near the middle of your view, nearer than the wall (a little help, as on a pad)
  aim-at : [a |
    wall : cast [a x, a y, a angle] far
    marks keep [m | m owner != (a id)] keep [m |
      gd : distance [a x, a y, m x, m y]
      rel : wrap (m y - (a y) atan2 (m x - (a x)) - (a angle))
      -- aim help: how near the middle of your view counts, scaled by the help this player asked for (none at 0)
      (rel abs < (cond [a zoomed, 0.03 + (0.12 / gd), any, 0.05 + (0.22 / gd)] * (a asks assist else 1) max 0.012)) and (gd < wall)
    ] smallest-by [m | distance [a x, a y, m x, m y]]
  ]
  ready : moved-agents collect [a | a with [aimed : cond [up a, aim-at a, any, false]]]
  shooters : ready keep can-shoot
  shot-hits : shooters keep [a | a aimed != false] collect [a | [from : a id, key : "[a aimed who] [a aimed id]", steady : a zoomed, heavy : a weapon = "heavy"]]
  -- a shot is loud unless it's from a silenced blaster (the heavy blaster is always loud)
  loud : [a | (a weapon = "heavy") or ((a quiet else false) not)]
  (shooters any [a | (a weapon != "heavy") and (loud a)]) [sound "shoot"]
  (shooters any [a | loud a not]) [sound "quiet"]
  (shooters any [a | a weapon = "heavy"]) [sound "heavy"]
  -- a miss leaves a hole in the wall where it struck (the last 24 stay)
  misses : shooters keep [a | a aimed = false] collect [a |
    far : cast [a x, a y, a angle] far - 0.02
    [x : a angle cos * far + (a x), y : a angle sin * far + (a y), rise : noise [now * 13, a id] * 0.5 + 1.05]
  ]
  holes : (game holes else []) .. misses
  (ready any [a | (a asks fire) and (a clip = 0) and (a fire-wait <= 0) and (a reloading <= 0) and (a bot not)]) [beep [180, 0.03]]
  -- mines and turrets, each with its owner
  droppers : ready keep can-drop
  setters : ready keep can-set
  (droppers length > 0) [beep [440, 0.05]]
  (setters length > 0) [beep [660, 0.06]]
  -- a mine is thrown up to 1.8 m ahead, and lands short of the wall
  throw : [a | 1.8 min (cast [a x, a y, a angle] far - 0.25) max 0.3]
  all-mines : game mines .. (droppers collect [a | [x : a angle cos * (throw a) + (a x), y : a angle sin * (throw a) + (a y), armed : now + mine-arm, owner : a id]])
  placed : game turrets .. (setters collect [a | tag : "[a id]-[now]", [id : tag, health : 60, x : a angle cos * 0.7 + (a x), y : a angle sin * 0.7 + (a y), aim : a angle, cool : 0.6, shots : 0, fired : false, victim : "", owner : a id]])
  -- each turret finds the nearest mark it can see (never its owner), asks turret-program what to do, turns, maybe fires
  thought : placed collect [t |
    in-sight : marks keep [m | ((m who = "guard") or ((m who = "agent") and (m id != (t owner)))) and (distance [t x, t y, m x, m y] < sentry-reach) and (clear-line [t x, t y, m x, m y])]
    mark : in-sight smallest-by [m | distance [t x, t y, m x, m y]]
    sees : mark != false
    dx : sees [mark x - (t x)] else [t aim cos]
    dy : sees [mark y - (t y)] else [t aim sin]
    -- what the program knows, in plain words (aim, cool, sees, dx, dy, far and count are the older names, kept)
    knows : [
      sees-someone : sees, off-target : sees [wrap (dy atan2 dx - (t aim))] else [0], how-far : sees [dx * dx + (dy * dy) sqrt] else [99]
      can-fire : t cool <= 0, how-many : in-sight length
      aim : t aim, cool : t cool, sees : sees, dx : dx, dy : dy, far : dx * dx + (dy * dy) sqrt, count : in-sight length
    ]
    said : turret-program knows
    aim : wrap (clamp [said turn else 0, -1, 1] * sentry-turn * dt + (t aim))
    fires : (said fire else false) and (t cool <= 0)
    lands : fires and sees and (wrap (dy atan2 dx - aim) abs < 0.15)
    t with [aim : aim, cool : cond [fires, sentry-reload, any, t cool - dt], fired : fires, victim : lands ["[mark who] [mark id]"] else [""], shots : cond [fires, t shots + 1, any, t shots], knows : knows]
  ]
  thought any [t | t fired] [sound "shoot"]
  struck : [k | shot-hits count [h | h key = k]]
  power : [k normal hard | shot-hits keep [h | h key = k] collect [h | cond [h heavy, hard, any, normal]] sum]
  zapped : [k | thought count [t | t victim = k]]
  -- guards (only when you play alone): hit by shots and turrets, then each one patrols, or turns on you once it sees you
  hit-guards : game guards collect [g |
    n : power ["guard [g id]", shot-damage, 110] + (zapped "guard [g id]" * sentry-damage)
    n > 0 [g with [health : g health - n, alert : true, stagger : 0.35]] else [g]
  ]
  thinking : hit-guards collect [g |
    g health <= 0 [g] else [
      -- each guard goes for the nearest player still standing
      hero : ready keep up smallest-by [a | distance [a x, a y, g x, g y]] else [ready @ 1]
      gd : distance [g x, g y, hero x, hero y]
      -- the way from this guard to you (an alert guard turns to face it)
      facing : g y - (hero y) atan2 (g x - (hero x)) + pi
      looking : wrap (facing - (g angle)) abs < 0.9
      sees : (up hero) and (gd < 9) and ((g alert) or looking) and (clear-line [g x, g y, hero x, hero y])
      was-alert : g alert
      alert : was-alert or sees
      goal-x : cond [alert, hero x, any, g to-x]
      goal-y : cond [alert, hero y, any, g to-y]
      gap : distance [g x, g y, goal-x, goal-y]
      -- a guard who was just hit staggers: no step, no shot
      staggered : (g stagger else 0) > 0
      pace : cond [staggered, 0, alert and (gd < 3), 0, alert, 1.2, any, 0.8]
      head : goal-y - (g y) atan2 (goal-x - (g x))
      -- an alert guard at range steps from side to side as he comes, so he's harder to hit
      side : cond [alert and (gd > 2.5) and (gd < 8) and (staggered not), now * 1.9 + (g id * 1.3) sin * 0.9, any, 0]
      went : cond [(gap < 0.05) and (side = 0), [x : g x, y : g y], any, slide [g x, g y, head cos * pace - (head sin * side) * dt, head sin * pace + (head cos * side) * dt]]
      arrived : (alert not) and (gap < 0.3)
      fires : sees and (g wait <= 0) and (staggered not)
      next-x : cond [arrived, g home-x, any, g to-x]
      next-y : cond [arrived, g home-y, any, g to-y]
      back-x : cond [arrived, g to-x, any, g home-x]
      back-y : cond [arrived, g to-y, any, g home-y]
      g with [
        x : went x, y : went y, angle : cond [alert, facing, any, head], alert : alert
        alert-at : cond [alert and (was-alert not), now, any, g alert-at else -10]
        wait : cond [fires, 1.5 - (difficulty * 0.3), any, g wait - dt]
        stagger : (g stagger else 0) - dt
        to-x : next-x, to-y : next-y, home-x : back-x, home-y : back-y
        target : hero id, fired : fires, hits : fires and (noise [now * 7, g id] < (0.5 - (gd * 0.035) * (difficulty * 0.35 + 0.3)))
      ]
    ]
  ]
  -- a guard who has seen you calls the others nearby, and a guard who hears a shot (through walls) comes to look
  callers : thinking keep [g | (g alert) and (g health > 0)]
  heard : [g | shooters any [a | (loud a) and (distance [a x, a y, g x, g y] < (cond [a weapon = "heavy", hearing * 1.5, any, hearing]))]]
  called : thinking collect [g | cond [(g alert not) and (g health > 0) and ((callers any [o | distance [o x, o y, g x, g y] < 6]) or (heard g)), g with [alert : true, alert-at : now], any, g]]
  (called count [g | g alert] > (thinking count [g | g alert])) [beep [760, 0.12]]
  pain : [who | thinking keep [g | (g hits else false) and (g target = who)] collect [g | cond [g boss else false, 18, any, 9]] sum]
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
  -- turrets can be shot down (two shots) or blown up
  hit-turrets : thought collect [t | t with [health : t health - (power ["turret [t id]", 34, 70]) - (caught [t x, t y] length * 100)]]
  standing : hit-turrets keep [t | t health > 0]
  gone-turrets : hit-turrets keep [t | t health <= 0]
  (gone-turrets length > 0) [sound "impact"]
  -- scientists: they walk their rounds, freeze when the alarm is up, and a shot or a blast is the end of them
  panic : game guards any [g | (g alert) and (g health > 0)]
  scientists : game scientists collect [c |
    hurt : power ["scientist [c id]", 100, 100] + (zapped "scientist [c id]" * 100) + (caught [c x, c y] length * 100)
    gap : distance [c x, c y, c to-x, c to-y]
    head : c to-y - (c y) atan2 (c to-x - (c x))
    walking : (c health > 0) and (panic not) and (gap > 0.2)
    went : cond [walking, slide [c x, c y, head cos * 0.5 * dt, head sin * 0.5 * dt], any, [x : c x, y : c y]]
    turn-back : gap <= 0.2
    c with [
      x : went x, y : went y, angle : cond [walking, head, any, c angle], health : c health - hurt max 0
      to-x : cond [turn-back, c home-x, any, c to-x], to-y : cond [turn-back, c home-y, any, c to-y]
      home-x : cond [turn-back, c to-x, any, c home-x], home-y : cond [turn-back, c to-y, any, c home-y]
      fell : cond [(c health - hurt <= 0) and (c fell = false), now, any, c fell]
    ]
  ]
  -- the generators: shots and blasts wreck them
  machines : game machines collect [m |
    n : power ["machine [m id]", 25, 50] + (caught [m x, m y] length * 100)
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
    shot-pain : by-shot collect [h | cond [h heavy, heavy-damage, h steady, steady-damage, any, duel-damage]] sum
    -- just back in a match: nothing hurts for a moment
    total : cond [now < (a safe-until), 0, up a, shot-pain + (zapped k * sentry-damage) + (pain (a id)) + blasted, any, 0]
    -- who did it, for the score: the last to hurt you
    culprit : by-shot length > 0 [by-shot @ 1 from] else [by-turret length > 0 [by-turret @ 1 owner] else [by-mine length > 0 [by-mine @ 1 owner] else [a last-by]]]
    got : [wanted | takes count [t | (t by = (a id)) and (t kind = wanted)]]
    took-now : takes keep [t | t by = (a id)] collect [t | t kind] @ 1 else ""
    -- where the hurt came from, for the marker at the edge of your screen
    shooter : by-shot length > 0 [ready keep [o | o id = (by-shot @ 1 from)] @ 1] else [false]
    guard-at : thinking keep [g | (g hits else false) and (g target = (a id))] @ 1 else false
    source : cond [shooter != false, shooter, by-turret length > 0, by-turret @ 1, by-mine length > 0, by-mine @ 1, any, guard-at]
    soak : total min (a armour)
    life : a health - (total - soak)
    a with [
      health : life max 0
      damage-taken : a damage-taken + total
      hurt-x : cond [(total > 0) and (source != false), source x, any, a hurt-x]
      hurt-y : cond [(total > 0) and (source != false), source y, any, a hurt-y]
      armour : a armour - soak + (got "armour" * 50) min 100
      down-at : cond [(up a) and (life <= 0), now, any, a down-at]
      hurt : cond [total > 0, 0.25, any, a hurt - dt]
      last-by : culprit
      fire-wait : cond [can-shoot a, cond [a weapon = "heavy", heavy-every, any, fire-every] * (cond [a bot, 2.6 - (simulant-skill * 0.5), any, 1]), any, a fire-wait - dt]
      -- the heavy blaster: picked up, it's in your hands; C-right (or Q) swaps between the two
      has-heavy : (a has-heavy) or (got "heavy" > 0)
      quiet : (a quiet else false) or (got "quiet" > 0)
      weapon : cond [got "heavy" > 0, "heavy", (a asks swap) and (a has-heavy) and (a swap-wait <= 0), cond [a weapon = "heavy", "blaster", any, "heavy"], any, a weapon]
      swap-wait : cond [a asks swap, 0.3, any, a swap-wait - dt]
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
      -- what you picked up last, and when (the screen says so for a moment)
      took : cond [took-now != "", took-now, any, a took else ""]
      took-at : cond [took-now != "", now, any, a took-at else -10]
    ]
  ]
  (hurt-agents any [a | a hurt = 0.25]) [sound "hurt"]
  went-down : hurt-agents keep [a | a down-at = now]
  -- takedowns in quick succession make a streak: two within three seconds is a double, and so on
  scored : hurt-agents collect [a |
    got : went-down count [d | (d last-by = (a id)) and (d id != (a id))]
    streak : cond [got = 0, a streak, now - (a streak-at) < 3, a streak + got, any, got]
    a with [kills : a kills + got, streak : streak, streak-at : cond [got > 0, now, any, a streak-at]]
  ]
  (scored any [a | (a streak-at = now) and (a streak >= 2)]) [beep [880, 0.06], beep [1175, 0.06], beep [1568, 0.12]]
  -- in a duel you come back after a moment, at the corner farthest from the other player
  back : scored collect [a |
    due : (game versus) and ((up a) not) and (now - (a down-at else now) >= respawn-after)
    others : scored keep [o | o id != (a id)]
    spot : spawns smallest-by [s | 0 - (others collect [o | distance [s @ 1, s @ 2, o x, o y]] sum)]
    due [agent [a id, spot @ 1, spot @ 2, spot @ 3] with [streak : a streak, streak-at : a streak-at, kills : a kills, look : a look, bot : a bot, fov : a fov, shots-fired : a shots-fired, shots-hit : a shots-hit, safe-until : now + 2]] else [a]
  ]
  champions : back keep [a | a kills >= frag-limit]
  winner : champions length > 0 [champions @ 1 id] else [0]
  -- time's up: the most takedowns wins, and a tie is a draw
  top : back fold [0, [m a | m max (a kills)]]
  leaders : back keep [a | a kills = top]
  time-up : leaders length = 1 ["p[leaders @ 1 id]"] else ["draw"]
  -- the mission: every guard down, both generators wrecked, the intel taken, then back to the lift
  intel : (game intel) or (takes any [t | t kind = "intel"])
  done : (fallen all [g | g health <= 0]) and (machines all [m | m health <= 0]) and intel
  -- each objective that completes gets a moment of its own: a chime, and OBJECTIVE COMPLETE
  done-count : (cond [(game versus not) and (fallen all [g | g health <= 0]), 1, any, 0]) + (cond [(game versus not) and (machines length > 0) and (machines all [m | m health <= 0]), 1, any, 0]) + (cond [intel, 1, any, 0])
  newly : done-count > (game ticked else 0)
  newly [beep [784, 0.08], beep [1046, 0.14]]
  home : back any [a | (up a) and (distance [a x, a y, mission exit @ 1, mission exit @ 2] < 1)]
  over : cond [
    game versus, cond [winner > 0, "p[winner]", now - (game match-start) >= time-limit, time-up, any, ""]
    back all [a | up a not], "lost"
    done and home, "won"
    any, ""
  ]
  game with [
    scientists : scientists, agents : back, guards : fallen, mines : still, turrets : standing, pickups : pickups, machines : machines, intel : intel
    feed : game feed .. (went-down collect [d | [by : d last-by, who : d id, at : now]]) keep [e | now - (e at) < 4]
    blasts : game blasts keep [b | now - (b at) < 2.5] .. (goes-off collect [m | [x : m x, y : m y, at : now]]) .. (gone-turrets collect [t | [x : t x, y : t y, at : now]])
    holes : cond [holes length > 24, holes drop (holes length - 24), any, holes]
    over : over, over-at : now, ticked : done-count, ticked-at : cond [newly, now, any, game ticked-at else -10]
    shell : game input held "shell" else false
  ]
]

-- two phones turn a game for one into a duel; once it's over, fire (or a tap) starts again after a moment
update : [game |
  -- a new mission (the page moved the campaign on): everything starts fresh from the new start, on the same frame
  -- for both phones; on-stage isn't part of start, so it remembers which mission this state belongs to
  fresh : (game on-stage else 0) != stage
  game : fresh [game with start with [on-stage : stage, began : game clock]] else [game]
  two : game has-field "input2"
  -- two phones: a duel, or the mission together (the second player comes in beside the first)
  coop : two-phones = "coop"
  g : cond [
    two and coop and (game agents length = 1) and (game versus not), game with [agents : game agents .. [agent [2, mission spawn-at @ 1, mission spawn-at @ 2 + 1, mission spawn-at @ 3]]]
    -- a duel starts the moment the second phone's player is here and has no body yet (whatever the mode was)
    two and (coop not) and (game agents all [a | (a id != 2) or (a bot)]), game with duel with [match-start : game clock]
    any, game
  ]
  again : (wants (g input) restart) or (two [wants (g input2) restart] else [false])
  g over = "" [play g] else [
    -- in a campaign a won mission waits here: the page moves on to the next one, or rolls the credits after the last
    waits : campaign and (g over = "won")
    (again and (waits not) and (g clock - (g over-at) > 1.5)) [cond [two and (coop not), g with duel with [match-start : g clock], two, start with [agents : [agent [1, mission spawn-at @ 1, mission spawn-at @ 2, mission spawn-at @ 3], agent [2, mission spawn-at @ 1, mission spawn-at @ 2 + 1, mission spawn-at @ 3]], input : g input, input2 : g input2], any, start]] else [g]
  ]
]

-- ---------------------------------------------------------------- drawing, in 3D
eye : 1.55                -- how high your eyes are, in metres
gun-turn : 0.1            -- which way the gun points, in radians
red : "#ff5a4f"
cream : "#f4f1ea"
cyan : "#9be7ff"
gold : "#ffd166"

draw : [game |
  now : game clock
  you-id : cond [game versus, me, any, 1]
  you : game agents keep [a | a id = you-id] @ 1
  rivals : game agents keep [a | a id != you-id]
  -- is player n a simulant? (numbers aren't enough: in a combat sim, number 2 is one)
  is-sim : [n | game agents any [a | (a id = n) and (a bot)]]
  down : up you not
  -- the camera: your eyes, or the floor once you're down
  -- the air turns red while the alarm is up
  alarm : game guards any [g | (g alert) and (g health > 0)]
  fog [cond [alarm, cond [now * 2 % 1 < 0.5, "#3a1416", any, "#2a1012"], any, scene air], 3, scene haze]
  -- the view is set by how wide it is across (the screen is taller than wide), and narrows while you aim
  across : you fov * (cond [you zoomed, zoom-view, any, 1])
  tall : across / 2 * pi / 180 tan * (H / W) atan * 2 * 180 / pi
  -- a mission opens with the camera sweeping down from high behind you into your eyes (three seconds, eased)
  intro : cond [(mode = "mission") and (game over = ""), 1 - ((now - (game began)) / 3) max 0, any, 0]
  ease : intro * intro * (3 - (intro * 2))
  room : cond [ease > 0, cast [you x, you y, you angle + pi] far - 0.3 min 4.5 max 0, any, 0]
  back-x : you angle cos * (0 - room) * ease + (you x)
  back-y : you angle sin * (0 - room) * ease + (you y)
  -- the mission's light: sky, floor bounce and key light, and how strong
  light-now : scene light
  -- while the alarm is up the key light turns red and pulses, like a warning beacon going round
  beacon : now * 2 % 1 < 0.5
  light [light-now @ 1, cond [alarm, #5a2024, any, light-now @ 2], cond [alarm and beacon, #ff5a4a, alarm, #c0605a, any, light-now @ 3], light-now @ 4 * (cond [alarm and beacon, 1.15, any, 1])]
  view [back-x, cond [down, 0.35, any, eye] + (ease * 2.4), back-y, you angle + (ease * 0.6), cond [down, 0.5, any, 0] - (ease * 0.45), tall]
  -- the lab: a floor, a ceiling, and a block for every wall cell of the map
  block [map-w / 2, -0.05, map-h / 2, map-w, 0.1, map-h, scene floor]
  -- indoors, a ceiling; outdoors, the ground's own surface and the sky
  ceiling-tex : scene ceiling
  has-sky not [block [map-w / 2, 2.55, map-h / 2, map-w, 0.1, map-h, ceiling-tex]]
  has-sky [
    ceiling-runs each [u | block [u x, 2.55, u z, u w, 0.1, 1, ceiling-tex]]
    ground-runs each [u | block [u x, -0.035, u z, u w, 0.1, 1, scene ground else "grass"]]
    sky [scene sky-top else #6fa8e8, scene air]
  ]
  wall-cells each [[c, r] | block [c - 0.5, 1.25, r - 0.5, 1, 2.5, 1, scene walls]]
  -- lamps in the ceiling: lit panels over the floor (drawn glowing, so they're bright whatever the light)
  ceiling-lamps each [[lx, lz] | block [lx, 2.485, lz, 0.62, 0.03, 0.62, "glow:#fff4d8"]]
  -- skirting at the foot of every wall, and a painted band round it at waist height, in the place's own colour
  wall-cells each [[c, r] | block [c - 0.5, 0.09, r - 0.5, 1.02, 0.18, 1.02, "#1a1c20"]]
  band : scene band else false
  (band != false) [wall-cells each [[c, r] | block [c - 0.5, 1.05, r - 0.5, 1.015, 0.14, 1.015, band]]]
  -- doors slide up as anyone comes near, and drop shut behind them
  movers : game agents keep up .. (game guards keep [g | g health > 0]) .. (game scientists keep [c | c health > 0])
  door-cells each [d |
    nearest : movers collect [m | distance [m x, m y, d x, d y]] smallest else 9
    lift-by : 1.9 - nearest / 0.9 max 0 min 1 * 2.3
    block [d x, 1.25 + lift-by, d y, cond [d spans-x, 1, any, 0.14], 2.5, cond [d spans-x, 0.14, any, 1], "plate"]
    block [d x, 2.47, d y, cond [d spans-x, 1.04, any, 0.2], 0.06, cond [d spans-x, 0.2, any, 1.04], "#d6a531"]
    -- a green light over every door, on both sides, so a way through is easy to spot
    block [d x, 2.39, d y, cond [d spans-x, 0.3, any, 0.22], 0.07, cond [d spans-x, 0.22, any, 0.3], "glow:#3ddc84"]
  ]
  -- bullet holes where shots struck the walls
  (game holes else []) each [h | block [h x, h rise, h y, 0.07, 0.07, 0.07, "#0b0b0d"]]
  -- the mission's targets, standing until wrecked
  -- a wrecked one sinks a little, turned and smaller, and smoke rises from it
  game machines each [m |
    wrecked : m health <= 0
    model [m model, m x, cond [wrecked, -0.1, any, 0], m y, cond [wrecked, 0.4, any, 0], m size * (cond [wrecked, 0.9, any, 1]), false, 0]
    wrecked [range 3 each [k | rise : now * 0.5 + (k / 3) % 1, flash [rise * 0.25 + (m x), rise * 1.8 + (m size * 0.8), m y, rise * 0.26 + 0.14, "smoke:#3f3f44"]]]
  ]
  props each [[name, px, pz, turn, size] | model [name, px, 0, pz, turn, size, false, 0]]
  -- the guards: running when they chase, aiming when they're close, falling when they're hit
  -- the fallen blink and then are gone, after five seconds, as on the old consoles
  gone : [t | (t != false) and (now - t > 5) and ((now - t > 6.2) or (now * 10 % 1 < 0.5))]
  game guards keep [g | gone (g fell) not] each [g |
    near : distance [g x, g y, you x, you y] < 3
    big : g boss else false
    -- each mission has its own guards (see guard-looks): walking their rounds, running and firing once they've seen
    -- you, taking aim when they're close. The Warden is the mech.
    kinds : mission guard-kinds else [1]
    kit : guard-looks @ (kinds @ (g id - 1 % (kinds length) + 1))
    -- a guard who has just been hit flinches: the hit plays from the moment the shot landed
    flinch : (g stagger else 0) > 0
    clip : cond [g health <= 0, cond [big, "Death", any, kit death], flinch, cond [big, "HitRecieve_1", any, kit hit], big and (g alert) and near, "Shoot_Big", big and (g alert), "Run", big, "Walk", (g fired else false), kit shoot, g alert and near, kit aim, g alert, kit run, any, kit walk]
    time : cond [g health <= 0, now - (g fell else now), flinch, 0.35 - (g stagger else 0), g alert, now, any, now * (cond [big, 0.9, any, kit pace])]
    model [cond [big, "mech", any, kit body], g x, 0, g y, g angle, cond [big, 2.5, any, kit size] * (cond [tiny, 0.6, any, 1]), clip, time, cond [big, false, any, kit holds]]
  ]
  -- scientists, in their lab coats: walking their rounds, frozen when the alarm is up, falling if hit
  game scientists keep [c | gone (c fell) not] each [c |
    clip : cond [c health <= 0, "death", alarm, "idle", any, "walk"]
    model ["rig:scientist", c x, 0, c y, c angle, 1.74, clip, cond [c health <= 0, now - (c fell else now), any, now], false]
  ]
  -- the other player
  rivals keep [r | gone (r down-at) not] each [r |
    -- simulants are machines, so they look like one: Quaternius's gunner robot
    -- a player looks as they chose in the character creator (their look, sent with their controls); simulants are robots
    kit : cond [r bot, robot-look, any, looks @ ((r skin else 1) max 1 min (looks length))]
    clip : cond [up r not, kit death, r flash > 0, kit shoot, r moving, kit run, any, kit aim]
    time : cond [up r not, now - (r down-at else now), any, now]
    model [kit body, r x, 0, r y, r angle, kit size, clip, time, kit holds]
    (r flash > 0) [flash [r angle cos * 0.6 + (r x), 1.3, r angle sin * 0.6 + (r y), 0.08, "#ffd76a"]]
  ]
  -- mines on the floor, blinking once they're live
  -- mines on the floor, blinking once they're live: your own green, anyone else's red
  game mines each [m |
    model ["grenade", m x, 0, m y, 0, 0.22, false, 0]
    (now >= (m armed)) and (now * 4 % 1 < 0.5) [flash [m x, 0.3, m y, 0.05, cond [m owner = you-id, "#3ddc84", any, "#ff3b30"]]]
  ]
  -- your mine going live says so
  (game mines any [m | (m owner = you-id) and (now >= (m armed)) and (now - (m armed) < 1)]) [text ["MINE ARMED", W / 2, H / 2 + 46, 8, "#3ddc84"]]
  -- a wrecked generator sparks
  game machines keep [m | (m health <= 0) and (now * 5 + (m id) % 1 < 0.35)] each [m | flash [m x, 1.0, m y, 0.12, "#ffb347"]]
  -- pickups, turning slowly and glowing
  game pickups keep [p | now >= (p back-at)] each [p |
    model [cond [p kind = "armour", "chest", p kind = "intel", "chest", p kind = "heavy", "blaster_e", p kind = "quiet", "blaster_g", any, "crate"], p x, 0.05 + (now * 3 + (p x) sin * 0.04), p y, now, cond [p kind = "armour", 0.4, p kind = "intel", 0.3, p kind = "quiet", 0.22, any, 0.3], false, 0]
    flash [p x, 0.5, p y, 0.04, cond [p kind = "armour", cyan, p kind = "intel", "#ff7ab2", p kind = "quiet", "#b18cff", any, gold]]
  ]
  -- a blast: a fireball for a moment, then smoke that rises and spreads as it thins
  game blasts each [b |
    age : now - (b at)
    (age < 0.6) [flash [b x, 0.9, b y, age / 0.6 * 1.4 + 0.5, "#ffb347"]]
    (age > 0.2) [range 3 each [k | flash [k - 2 * 0.3 + (b x), age * 0.7 + 0.6 + (k * 0.15), k - 2 * 0.2 + (b y), age * 0.18 + 0.25, "smoke:#4d4d52"]]]
  ]
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
    -- each line pinned at the left edge ("left" as text's sixth value), so the column lines up whatever the letters
    from-left : [line y | text [line, 7, y, 7, cream, "left"]]
    from-left ["[tick (guards-down = (game guards length))] GUARDS [guards-down]/[game guards length]", 64]
    from-left ["[tick (wrecked = (game machines length))] [mission target-name] [wrecked]/[game machines length]", 74]
    from-left ["[tick (game intel)] [mission intel-name]", 84]
    -- a bonus, not a must: keep the scientists safe
    (game scientists length > 0) [from-left [cond [game scientists all [c | c health > 0], "□ BONUS: NO SCIENTISTS HURT", any, "✕ BONUS LOST: A SCIENTIST WAS HURT"], 94]]
    all-done : (guards-down = (game guards length)) and (wrecked = (game machines length)) and (game intel)
    all-done [flash [mission exit @ 1, 0.2, mission exit @ 2, 0.15 + (now * 4 sin * 0.05), "#7bd389"], text [mission exit-name, W / 2, 50, 11, "#7bd389"]]
  ]
  -- your gun, kicking back when it fires
  kick : cond [you flash > 0, 0.05, any, 0]
  gun : cond [you weapon = "heavy", "blaster_e", any, "blaster_g"]
  -- the gun sways as you walk, more as you run
  stride : cond [you moving, now * (cond [(you asks walk else 0) > 1.05, 14, any, 9]), any, 0]
  sway-x : cond [you moving, stride sin * 0.012, any, 0]
  sway-y : cond [you moving, stride * 2 sin abs * 0.01, any, 0]
  (down not) and (you zoomed not) [hold [gun, 0.2 + sway-x, -0.21 - sway-y, -0.55 + kick, gun-turn, 0, cond [you weapon = "heavy", 0.32, any, 0.26]]]
  (down not) and (you zoomed) [hold [gun, 0.0, -0.17, -0.42 + kick, 0, 0, 0.26]]
  (you flash > 0) [flash [you angle cos * 0.7 + (you x), 1.35, you angle sin * 0.7 + (you y), cond [(you weapon != "heavy") and (you quiet else false), 0.035, any, 0.08], "#ffd76a"]]
  -- tracers: a streak from the gun to where the shot lands, for the moment of the shot, yours and everyone's
  tracer : [sx sy fx fy aimed angle colour |
    end-far : cast [fx, fy, angle] far - 0.05
    ex : (aimed != false) [aimed x] else [angle cos * end-far + fx]
    ey : (aimed != false) [aimed y] else [angle sin * end-far + fy]
    beam [sx, 1.28, sy, ex, cond [aimed != false, 1.15, any, 1.4], ey, colour]
  ]
  (up you) and (you flash > 0.04) [tracer [you angle cos * 0.75 + (you x) - (you angle sin * 0.14), you angle sin * 0.75 + (you y) + (you angle cos * 0.14), you x, you y, you aimed, you angle, cond [you weapon = "heavy", "#9be7ff", any, "#ffe08a"]]]
  rivals keep [r | (up r) and (r flash > 0.04)] each [r | tracer [r angle cos * 0.5 + (r x), r angle sin * 0.5 + (r y), r x, r y, r aimed else false, r angle, "#ffb38a"]]
  game guards keep [g | (g health > 0) and (g fired else false)] each [g |
    mark : game agents keep [a | a id = (g target else 0)] @ 1 else false
    (mark != false) [
      miss : cond [g hits else false, 0, any, noise [now * 9, g id] - 0.5 * 0.9]
      beam [g angle cos * 0.45 + (g x), 1.25, g angle sin * 0.45 + (g y), mark x - (g angle sin * miss), 1.2, mark y + (g angle cos * miss), "#ff9a6a"]
    ]
  ]
  -- a hit sparks on whatever it hit
  ((now - (you hit-at) < 0.08) and (you aimed != false)) [flash [you aimed x, 1.1, you aimed y, 0.09, "#ffe08a"]]
  -- a miss sparks where it hits the wall
  miss : (you flash > 0.03) and (you aimed = false)
  wall-at : miss [cast [you x, you y, you angle] far - 0.05] else [0]
  miss [flash [you angle cos * wall-at + (you x), 1.4, you angle sin * wall-at + (you y), 0.05, "#fff2b3"]]
  -- on top: the sight (red when it's on someone, with a mark when a shot lands), the map, health, what you carry
  sight : cond [you aimed != false, red, any, "#ffffffaa"]
  sight-always or (you zoomed) [
    line [W / 2 - 7, H / 2, W / 2 - 2, H / 2, sight]
    line [W / 2 + 2, H / 2, W / 2 + 7, H / 2, sight]
    line [W / 2, H / 2 - 7, W / 2, H / 2 - 2, sight]
    line [W / 2, H / 2 + 2, W / 2, H / 2 + 7, sight]
  ]
  (now - (you hit-at) < 0.15) [
    line [W / 2 - 10, H / 2 - 10, W / 2 - 5, H / 2 - 5, cream], line [W / 2 + 10, H / 2 - 10, W / 2 + 5, H / 2 - 5, cream]
    line [W / 2 - 10, H / 2 + 10, W / 2 - 5, H / 2 + 5, cream], line [W / 2 + 10, H / 2 + 10, W / 2 + 5, H / 2 + 5, cream]
  ]
  -- the mini-map: 48 pixels across whatever the map's size
  mm : 48 / (map-w max map-h)
  rect [5, 5, 50, 50, "#000000a0"]
  wall-cells each [[c, r] | rect [c * mm + 3, r * mm + 3, mm, mm, "#6a6e6488"]]
  game guards keep [g | g health > 0] each [g | circle [g x * mm + 3 + mm, g y * mm + 3 + mm, 1.4, red]]
  rivals keep up each [r | circle [r x * mm + 3 + mm, r y * mm + 3 + mm, 1.6, cond [game versus, red, any, "#5fa8ff"]]]
  game mines each [m | circle [m x * mm + 3 + mm, m y * mm + 3 + mm, 1.1, gold]]
  game scientists keep [c | c health > 0] each [c | circle [c x * mm + 3 + mm, c y * mm + 3 + mm, 1.2, "#bfe3ff"]]
  game turrets each [t | rect [t x * mm + 3 + (mm / 2), t y * mm + 3 + (mm / 2), mm, mm, cyan]]
  -- the mission's objectives on the map too: targets left, the intel, and the way out once it's all done
  (mode = "mission") and (game versus not) [
    game machines keep [m | m health > 0] each [m | rect [m x * mm + 3 + mm - 1.5, m y * mm + 3 + mm - 1.5, 3, 3, gold]]
    (game intel not) [rect [mission intel @ 1 * mm + 3 + mm - 1.5, mission intel @ 2 * mm + 3 + mm - 1.5, 3, 3, "#ff7ab2"]]
    ((game guards all [g | g health <= 0]) and (game machines all [m | m health <= 0]) and (game intel)) [rect [mission exit @ 1 * mm + 3 + mm - 2, mission exit @ 2 * mm + 3 + mm - 2, 4, 4, "#7bd389"]]
  ]
  -- you, with a short line for the way you face
  line [you x * mm + 3 + mm, you y * mm + 3 + mm, you angle cos * 4.5 + (you x * mm + 3 + mm), you angle sin * 4.5 + (you y * mm + 3 + mm), "#ffffff"]
  circle [you x * mm + 3 + mm, you y * mm + 3 + mm, 1.7, "#ffffff"]
  -- health and armour show when you're hurt (and stay while you're low), then get out of the way
  (you hurt > -3) or (you health <= 35) or (game clock < 4) [
  range 10 each [k | rect [W - 12 - (11 - k * 9), 10, 7, 9, cond [you health > (k - 1 * 10), cond [you health > 35, "#7bd389", any, red], any, "#00000066"]]]
  (you armour > 0) [rect [W - 102, 21, you armour * 0.9, 3, "#5fa8ff"]]
  ]
  text ["MINES [you carried]   SENTRY [you sentries-left]", W - 52, 30, 9, cream]
  -- shots: what's in the clip, and spare (down on the left, clear of the gun in your hand); a bar while you reload
  text ["[you clip] | [you ammo]", 32, H - 40, 13, cond [you clip = 0, red, any, cream]]
  text [cond [you weapon = "heavy", "HEAVY", you quiet else false, "BLASTER · SILENCED", any, "BLASTER"], cond [(you weapon != "heavy") and (you quiet else false), 52, any, 32], H - 26, 8, cond [(you weapon != "heavy") and (you quiet else false), "#b18cff", any, "#9aa3b5"]]
  (you reloading > 0) [rect [W / 2 - 30, H / 2 + 22, 60, 4, "#00000088"], rect [W / 2 - 30, H / 2 + 22, 60 - (you reloading / reload-time * 60), 4, gold], text ["RELOADING", W / 2, H / 2 + 34, 9, gold]]
  -- running low, or out: say so under the sight (a clip that runs dry reloads by itself while there are spare shots)
  shots-left : you clip + (you ammo)
  (up you) and (you reloading <= 0) and (game over = "") and (you bot not) [
    (shots-left = 0) [text ["OUT OF AMMO · FIND A CRATE", W / 2, H / 2 + 34, 9, red]]
    (shots-left > 0) and (shots-left <= 8) [text ["LOW AMMO", W / 2, H / 2 + 34, 8, "#ffb38a"]]
  ]
  (you zoomed) [rect [0, 0, W, 18, "#000000aa"], rect [0, H - 18, W, 18, "#000000aa"], text ["AIM", 22, H / 2, 9, gold]]
  -- in a match: the score, and a takedown that was yours
  game versus [
    best : rivals fold [0, [m r | m max (r kills)]]
    rest : cond [rivals length = 1, "RIVAL", any, "TOP"]
    text ["YOU [you kills] · [best] [rest]", W / 2, H - 16, 12, cream]
    -- a match opens by saying what wins it
    (now - (game match-start) < 3) and (game over = "") [text ["FIRST TO [frag-limit] TAKEDOWNS", W / 2, H / 2 - 60, 13, gold]]
    text [time-limit - (now - (game match-start)) max 0 clock, W / 2, 16, 10, "#c9ccd4"]
    rivals any [r | (up r not) and (r last-by = you-id) and (now - (r down-at else now) < 1.6)] [text ["TAKEDOWN", W / 2, H / 2 - 40, 18, gold]]
    who-did : cond [(you last-by = you-id) or (you last-by = 0), "YOUR OWN TRAP", is-sim (you last-by), sim-name (you last-by), any, "THE RIVAL"]
    down and (game over = "") [text ["TAKEN DOWN BY [who-did]", W / 2, H / 2 + 22, 11, red]]
    down and (game over = "") [text ["DOWN · back in [respawn-after - (now - (you down-at else now)) max 0 ceil]", W / 2, H / 2 + 40, 12, cream]]
  ]
  -- who took down whom, lately
  tag-of : [n | game agents keep [a | a id = n] collect [a | a tag else ""] @ 1 else ""]
  call : [n | cond [n = you-id, "YOU", n = 0, "THE LAB", is-sim n, sim-name n, tag-of n != "", tag-of n, any, "RIVAL"]]
  game versus [game feed numbered each [[k, e] | text [cond [(e by = (e who)) or (e by = 0), "[call (e who)] went down", any, "[call (e by)] took down [call (e who)]"], W / 2, k * 11 + 26, 8, cond [(e by = you-id) or (e who = you-id), gold, any, "#c9ccd4"]]]]
  -- your streak, for a moment
  (you streak >= 2) and (now - (you streak-at) < 1.6) [text [cond [you streak = 2, "DOUBLE TAKEDOWN", you streak = 3, "TRIPLE TAKEDOWN", any, "RAMPAGE"], W / 2, H / 2 - 82, 14, gold]]
  (game versus not) and (now - (game ticked-at else -10) < 2) and (game over = "") [text ["OBJECTIVE COMPLETE", W / 2, H / 2 - 64, 13, "#7bd389"]]
  -- a guard going down says so, with how many are down now (the Warden by name)
  just-fell : game guards keep [g | now - (g fell else -10) < 1.2]
  (game versus not) and (just-fell length > 0) and (game over = "") [
    text [cond [just-fell any [g | g boss else false], "THE WARDEN IS DOWN", any, "GUARD DOWN · [game guards count [g | g health <= 0]]/[game guards length]"], W / 2, H / 2 - 48, 10, cream]
  ]
  -- the Warden's health, across the top, once he's on alert
  game guards keep [g | (g boss else false) and (g alert) and (g health > 0)] each [g |
    text ["THE WARDEN", W / 2, 44, 9, red]
    rect [W / 2 - 60, 50, 120, 4, "#00000099"]
    rect [W / 2 - 60, 50, g health / (guard-health * 4) * 120, 4, red]
  ]
  -- the mission's clock, once the opening card has gone (gold while you're inside the par time)
  (mode = "mission") and (game over = "") and (now - (game began) > 4.5) [text [now - (game began) clock, W / 2, 16, 10, cond [now - (game began) < par-time, gold, any, "#c9ccd4"]]]
  -- a scientist hit: the bonus is gone, but the mission goes on
  game scientists any [c | (c fell != false) and (now - (c fell) < 2)] [text ["SCIENTIST HURT · BONUS LOST", W / 2, H / 2 - 96, 11, red]]
  -- a mission opens with its title card and briefing, for a few seconds
  card : now - (game began)
  (mode = "mission") and (card < 4.5) and (game over = "") [
    rect [0, H / 2 - 70, W, 112, "#000000b8"]
    text ["MISSION [stage] · [mission name]", W / 2, H / 2 - 48, 15, gold]
    mission brief numbered each [[k, line] | text [line, W / 2, k * 15 + (H / 2 - 30), 9, cream]]
  ]
  -- a guard who has just spotted you (or been called) gets a "!" over their head, for a moment
  half-across : across / 2 * pi / 180
  half-tall : tall / 2 * pi / 180
  game guards keep [g | (g health > 0) and (now - (g alert-at else -10) < 1.2)] each [g |
    gd : distance [you x, you y, g x, g y] max 0.5
    rel : wrap (g y - (you y) atan2 (g x - (you x)) - (you angle))
    (rel abs < half-across) and (clear-line [you x, you y, g x, g y]) [
      text ["!", rel tan / (half-across tan) * (W / 2) + (W / 2), H / 2 - (2.15 - eye / gd / (half-tall tan) * (H / 2)), 16, gold]
    ]
  ]
  -- markers: where each objective is and how far, on the screen over it, or at the edge when it's off to one side
  -- (each in its own row there, by slot, so two off the same way don't land on top of each other)
  mark-at : [px py colour slot |
    gd : distance [you x, you y, px, py]
    rel : wrap (py - (you y) atan2 (px - (you x)) - (you angle))
    on : rel abs < (half-across * 0.9)
    depth : gd * (rel cos) max 0.5
    sx : cond [on, rel tan / (half-across tan) * (W / 2) + (W / 2), rel > 0, W - 10, any, 10]
    sy : cond [on, H / 2 - (2.1 - eye / depth / (half-tall tan) * (H / 2)) max 30 min (H - 60), any, slot * 26 + (H / 2 - 52)]
    -- right under the sight, a marker would hide what you're aiming at, so it steps aside
    clear : (on not) or ((sx - (W / 2)) abs > 16) or ((sy - (H / 2)) abs > 16)
    clear [text [cond [on, "◆", rel > 0, "▶", any, "◀"], sx, sy, cond [on, 8, any, 10], colour], text ["[gd round]m", sx, sy + 9, 7, colour]]
  ]
  markers and (mode = "mission") and (game versus not) and (game over = "") and (now - (game began) > 4.5) and (up you) [
    game machines keep [m | m health > 0] each [m | mark-at [m x, m y, "#ffd166cc", m id]]
    (game intel not) [mark-at [mission intel @ 1, mission intel @ 2, "#ff7ab2cc", 0]]
    finished : (game guards all [g | g health <= 0]) and (game machines all [m | m health <= 0]) and (game intel)
    finished [mark-at [mission exit @ 1, mission exit @ 2, "#7bd389", 2]]
  ]
  -- the other players' names over their heads, when they're in sight: codenames, or the simulants' own names
  -- (red for a rival, blue for a partner in a two-phone mission)
  rivals keep up each [r |
    gd : distance [you x, you y, r x, r y]
    rel : wrap (r y - (you y) atan2 (r x - (you x)) - (you angle))
    (rel abs < (half-across * 0.95)) and (gd < 14) and (gd > 0.8) and (clear-line [you x, you y, r x, r y]) [
      depth : gd * (rel cos) max 0.5
      look-name : (looks @ ((r skin else 1) max 1 min (looks length))) name
      named : cond [call (r id) != "RIVAL", call (r id), any, look-name]
      text [named, rel tan / (half-across tan) * (W / 2) + (W / 2), H / 2 - (2.2 - eye / depth / (half-tall tan) * (H / 2)), 7, cond [game versus, "#ff9b8f", any, "#9be7ff"]]
    ]
  ]
  -- what's in your sight: its name, and what it has left
  sighted : you aimed
  (up you) and (sighted != false) and (game over = "") [
    foe : game guards keep [g | g id = (sighted id)] @ 1 else false
    kit : game machines keep [m | m id = (sighted id)] @ 1 else false
    post : game turrets keep [t | t id = (sighted id)] @ 1 else false
    -- (cond works out every item, so a field of something that may be false is read behind a guard: x [..] else [..])
    warden : (foe != false) [foe boss else false] else [false]
    named : cond [
      sighted who = "guard", cond [warden, "THE WARDEN", any, "GUARD"]
      sighted who = "machine", mission target-one else "TARGET"
      sighted who = "scientist", "SCIENTIST · HOLD FIRE"
      sighted who = "turret", "TURRET"
      any, call (sighted id)
    ]
    foe-left : (foe != false) [foe health / (guard-health * (cond [warden, 4, any, 1]))] else [-1]
    kit-left : (kit != false) [kit health / 100] else [-1]
    post-left : (post != false) [post health / 60] else [-1]
    remaining : cond [sighted who = "guard", foe-left, sighted who = "machine", kit-left, sighted who = "turret", post-left, any, -1]
    text [named, W / 2, H / 2 + 17, 7, cond [sighted who = "scientist", "#bfe3ff", (sighted who = "agent") and (game versus not), "#9be7ff", any, red]]
    (remaining >= 0) [rect [W / 2 - 14, H / 2 + 23, 28, 2, "#00000099"], rect [W / 2 - 14, H / 2 + 23, remaining max 0 min 1 * 28, 2, red]]
  ]
  -- what you just picked up, rising for a moment
  since-took : now - (you took-at else -10)
  (since-took < 1.5) [
    what : you took else ""
    text [cond [what = "ammo", "+16 SHOTS", what = "armour", "+50 ARMOUR", what = "heavy", "HEAVY BLASTER", what = "intel", mission intel-name else "INTEL", what = "quiet", "SILENCER · GUARDS WON'T HEAR YOUR BLASTER", any, ""], W / 2, H / 2 + 70 - (since-took * 12), 10, cond [what = "armour", cyan, what = "intel", "#ff7ab2", what = "quiet", "#b18cff", any, gold]]
  ]
  -- the touch buttons, when there's no console around the screen
  game shell not [
    circle [W - 48, H - 48, 34, "#00000066"]
    text ["MINE", W - 48, H - 44, 13, gold]
    circle [W - 48, H - 128, 34, "#00000066"]
    text ["SENTRY [you sentries-left]", W - 48, H - 124, 11, cyan]
  ]
  (you hurt > 0) [rect [0, 0, W, H, "#ff000040"]]
  -- low on health: the edges pulse red, in time with a heartbeat
  (up you) and (you health <= 35) and (now * 1.2 % 1 < 0.25) [rect [0, 0, W, 6, "#ff1a1a66"], rect [0, H - 6, W, 6, "#ff1a1a66"], rect [0, 0, 6, H, "#ff1a1a66"], rect [W - 6, 0, 6, H, "#ff1a1a66"]]
  -- a red mark at the edge, pointing to where the hurt came from
  (you hurt > -0.6) [
    toward-hurt : wrap (you hurt-y - (you y) atan2 (you hurt-x - (you x)) - (you angle))
    circle [toward-hurt sin * (W * 0.42) + (W / 2), H / 2 - (toward-hurt cos * (H * 0.42)), 6, "#ff3b30cc"]
  ]
  (game clock < (you safe-until)) [text ["PROTECTED", W / 2, H / 2 + 52, 9, cyan]]
  hint : cond [game shell, "stick to move · drag to look · hold A to fire", any, "drag to walk · tap the middle to fire"]
  (now < 5) and (game over = "") [text [hint, W / 2, H - 70, 10, "#f4f1eacc"]]
  again : cond [campaign and (game over = "won") and (stage < (missions length)), "press A for the next mission", campaign and (game over = "won"), "press A for the credits", game shell, "press A to go again", any, "tap to go again"]
  -- the end: what happened, and how you did (time, accuracy, takedowns)
  taken : game over-at
  accuracy : cond [you shots-fired = 0, 0, any, you shots-hit / (you shots-fired) * 100 round]
  downs : cond [game versus, you kills, any, game guards count [g | g health <= 0]]
  -- medals for a mission: inside par time, at least 60% of shots on target, and coming through unhurt
  medal : [earned name | cond [earned, "★ [name]", any, "☆ [name]"]]
  m-time : medal [taken < par-time, "TIME"]
  m-aim : medal [accuracy >= 60, "AIM"]
  m-unhurt : medal [you damage-taken = 0, "UNHURT"]
  medals : "[m-time]   [m-aim]   [m-unhurt]"
  ending : [title colour |
    rect [0, H / 2 - 54, W, 116, "#000000bb"]
    text [title, W / 2, H / 2 - 22, 22, colour]
    text ["TIME [taken clock]   ACCURACY [accuracy]%   TAKEDOWNS [downs]", W / 2, H / 2 + 8, 9, cream]
    text [again, W / 2, H / 2 + 36, 11, cream]
    (game over = "won") [text [medals, W / 2, H / 2 + 22, 9, gold]]
    (game over = "won") and (game scientists length > 0) [text [cond [game scientists all [c | c health > 0], "BONUS ★ EVERY SCIENTIST SAFE", any, "BONUS ✕ A SCIENTIST WAS HURT"], W / 2, H / 2 + 50, 8, cond [game scientists all [c | c health > 0], "#7bd389", any, "#c9ccd4"]]]
  ]
  last-one : stage >= (missions length)
  game over = "won" [ending [cond [campaign and last-one, "CAMPAIGN COMPLETE", any, "MISSION COMPLETE"], "#7bd389"]]
  game over = "draw" [ending ["DRAW", gold]]
  game over = "lost" [ending ["YOU WERE CAUGHT", red]]
  game over = "p[you-id]" [ending ["YOU WIN", "#7bd389"]]
  verdict : [w | is-sim w ["[sim-name w] WINS"] else ["YOU LOSE"]]
  champion : (game over != "") and (game over != "won") and (game over != "lost") and (game over != "draw") and (game over != "p[you-id]")
  winners : game agents keep [a | game over = "p[a id]"]
  (game versus) and champion [ending [verdict (winners @ 1 id), red]]
]
