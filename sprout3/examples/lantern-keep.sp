-- LANTERN KEEP: a maze game for the SPROUT·8 console. You are Wick, a lamplighter in a dark keep. Walk onto every
-- lantern to light it while the shadow wisps hunt you down the corridors; light them all and the gate opens to the
-- floor above. An oil flare lets you banish wisps for a few seconds. The D-pad walks; buttons start the game.

-- ================================================================ the art
ink : [k : #000000, w : #ffffff, n : #aa5500, s : #ffaa55, b : #0055aa, y : #ffff55, o : #ffaa00, d : #555555, m : #aa00aa, r : #ff0000, c : #55ffff, l : #aaaaaa]
scared-ink : ink with [m : #0000aa, w : #55ffff]
wick-art : [
  "......kkkk......"
  ".....knnnnk....."
  "....knnnnnnk...."
  "...kkkkkkkkkk..."
  "....kssssssk...."
  "....kswkkwsk...."
  "....kssssssk...."
  ".....kssssk....."
  "....kbbbbbbk.yk."
  "...kbbbbbbbbkyk."
  "...kbbbbbbbbkk.."
  "....kbbbbbbk...."
  "....kbbkkbbk...."
  "....kbbk.kbbk..."
  "....kkk...kkk..."
  "................"
]
wisp-a : [
  "................"
  ".....kkkkkk....."
  "....kmmmmmmk...."
  "...kmmmmmmmmk..."
  "..kmmwwmmwwmmk.."
  "..kmmwkmmwkmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmkmmkmmmk.."
  "..kmmk.kk.kmmk.."
  "..kmk......kmk.."
  "..kk........kk.."
  "................"
  "................"
]
wisp-b : [
  "................"
  ".....kkkkkk....."
  "....kmmmmmmk...."
  "...kmmmmmmmmk..."
  "..kmmwwmmwwmmk.."
  "..kmmwkmmwkmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmmmmmmmmmmk.."
  "..kmk.kmmk.kmk.."
  "..kk..kmmk..kk.."
  "......kkkk......"
  "................"
  "................"
]
lantern-dark : [
  "................"
  "................"
  "......kkkk......"
  ".....kd..dk....."
  "......kkkk......"
  ".....kddddk....."
  "....kdkkkkdk...."
  "....kdk..kdk...."
  "....kdk..kdk...."
  "....kdk..kdk...."
  "....kdkkkkdk...."
  ".....kddddk....."
  "......kkkk......"
  "................"
  "................"
  "................"
]
lantern-lit : [
  "................"
  "................"
  "......kkkk......"
  ".....kd..dk....."
  "......kkkk......"
  ".....kddddk....."
  "....kdkkkkdk...."
  "....kdkyykdk...."
  "....kdywwykk...."
  "....kdkoykdk...."
  "....kdkkkkdk...."
  ".....kddddk....."
  "......kkkk......"
  "................"
  "................"
  "................"
]
flare-art : [
  "................"
  "................"
  "................"
  ".......kk......."
  "......kllk......"
  ".....kkkkkk....."
  ".....krrrrk....."
  ".....krwwrk....."
  ".....krrrrk....."
  ".....krrrrk....."
  ".....kkkkkk....."
  "................"
  "................"
  "................"
  "................"
  "................"
]
gate-shut : [
  "kkkkkkkkkkkkkkkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kkkkkkkkkkkkkkkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kkkkkkkkkkkkkkkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kdkdkdkdkdkdkdkk"
  "kkkkkkkkkkkkkkkk"
]
gate-open : [
  "kkkkkkkkkkkkkkkk"
  "kyyyyyyyyyyyyyyk"
  "kyoooooooooooyyk"
  "kyoyyyyyyyyyyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoywwwwwwwwyoyk"
  "kyoyyyyyyyyyyoyk"
  "kyoooooooooooyyk"
  "kyyyyyyyyyyyyyyk"
  "kkkkkkkkkkkkkkkk"
]
wall-tile : [
  "hhhhhhhfhhhhhhhf"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "kkkkkkkkkkkkkkkk"
  "hhhfhhhhhhhfhhhh"
  "fffkhffffffkhfff"
  "fffkhffffffkhfff"
  "fffkhffffffkhfff"
  "kkkkkkkkkkkkkkkk"
  "hhhhhhhfhhhhhhhf"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "kkkkkkkkkkkkkkkk"
  "hhhfhhhhhhhfhhhh"
]
floor-tile : [
  "aaaaaaaaaaaaaaaa"
  "aeaaaaaaaaaaeaaa"
  "aaaaaaaaaaaaaaaa"
  "aaaaaeaaaaaaaaaa"
  "aaaaaaaaaaaaaaae"
  "aaaaaaaaaeaaaaaa"
  "aaeaaaaaaaaaaaaa"
  "aaaaaaaaaaaaaaaa"
  "aaaaaaaaaaaeaaaa"
  "aaaaaeaaaaaaaaaa"
  "aaaaaaaaaaaaaaaa"
  "aeaaaaaaaaaaaaea"
  "aaaaaaaaaaaaaaaa"
  "aaaaaaaeaaaaaaaa"
  "aaaaaaaaaaaaaaaa"
  "aaaaaaaaaaeaaaaa"
]
tile-set : [["#", wall-tile], [".", floor-tile]]
floor-inks : [
  [k : #000000, h : #5555aa, f : #000055, a : #000000, e : #000055]
  [k : #000000, h : #aa55aa, f : #550055, a : #000000, e : #550055]
  [k : #000000, h : #aa5555, f : #550000, a : #000000, e : #550000]
]

-- ================================================================ the floors
floor-1 : [
  "################"
  "#P....#....L...#"
  "#.##.L#.##.###.#"
  "#.#.........F#.#"
  "#.#.###.##.#.#.#"
  "#L....#.W#.#...#"
  "###.#.#.##.#.#L#"
  "#...#...L....#.#"
  "#.#####.###.#..#"
  "#L.....F...W#.G#"
  "################"
]
floor-2 : [
  "################"
  "#P.....#.....L.#"
  "#.###.##.###.#.#"
  "#.#L....W...F#.#"
  "#.#.##.###.###.#"
  "#...#L.....#...#"
  "###.#.##.#.#.#.#"
  "#L..#..W.#...#L#"
  "#.###.####.###.#"
  "#F....L......WG#"
  "################"
]
floor-3 : [
  "################"
  "#P...#...L...#L#"
  "#.##.#.#####.#.#"
  "#L#..W...F.#...#"
  "#.#.####.#.###.#"
  "#.....L#.#...W.#"
  "#.###.##.###.#.#"
  "#.#L...W...#.#L#"
  "#.#.######.#.#.#"
  "#F..L.......W.G#"
  "################"
]
floors : [floor-1, floor-2, floor-3]
grids : floors collect [rows | rows collect [line | line chars]]
-- the floor plan drawn under everything: walls and stone, the markers taken away
plans : floors collect [rows | tilemap clear [rows, "LFGWP"]]

-- where a cell of the map is on screen (the keep starts one row down, under the score)
cell-xy : [c | pair [c x - 1 * 16, c y * 16]]
cells-of : [rows ch | tilemap find [rows, ch]]

-- ================================================================ the songs
songs : [
  title : [
    bpm : 96, beats : 16
    lead : music track ["A4 . C5 . E5 - D5 . | C5 . B4 . A4 - - . | F4 . A4 . C5 - B4 . | A4 - G#4 . A4 - - .", 0.5]
    bass : music track ["A2 - - . E2 - - . | A2 - - . E2 - - . | F2 - - . G2 - - . | E2 - - . A2 - - .", 0.5]
  ]
  floor : [
    bpm : 120, beats : 16
    lead : music track ["E5 . . E5 D5 . C5 . | B4 . . . A4 . . . | C5 . . C5 B4 . A4 . | G#4 . . . E4 . . . ", 0.5]
    bass : music track ["A2 . A3 . A2 . A3 . | G2 . G3 . G2 . G3 . | F2 . F3 . F2 . F3 . | E2 . E3 . E2 . E3 .", 0.5]
    drums : music track ["kick . . hat . . hat . | kick . . hat . . hat . | kick . . hat . . hat . | kick . . hat snare . hat hat", 0.5]
  ]
  flare : [
    bpm : 168, beats : 8
    lead : music track ["A5 E5 A5 E5 B5 E5 B5 E5 | C6 E5 C6 E5 B5 E5 B5 E5", 0.5]
    bass : music track ["A2 . A2 . A2 . A2 . | A2 . A2 . E2 . E2 .", 0.5]
    drums : music track ["kick hat snare hat kick hat snare hat | kick hat snare hat kick kick snare snare", 0.5]
  ]
  clear : [
    bpm : 140, beats : 8, once : true
    lead : music track ["A4 C5 E5 A5 - . E5 A5 | - - - - . . . .", 0.5]
    bass : music track ["A2 . E3 . A3 . . . | A2 - - - . . . .", 0.5]
  ]
  over : [
    bpm : 90, beats : 8, once : true
    lead : music track ["E5 . C5 . A4 . F4 . | E4 - - - . . . .", 0.5]
    bass : music track ["A2 . F2 . D2 . B1 . | E2 - - - . . . .", 0.5]
  ]
]

-- ================================================================ moving through the keep
passable : [rows c gate-open | ch : rows @ (c y) slice [c x, c x], (ch != "#") and (ch != "") and ((ch != "G") or gate-open)]

step-wick : [w keys rows gate-open dt |
  want : cond [keys go-left, -1x0, keys go-right, 1x0, keys go-up, 0x-1, keys go-down, 0x1, any, w want]
  arrived : vec distance [w at, cell-xy (w cell)] < 0.5
  turning-back : (arrived not) and (w dir != 0x0) and (want = (0x0 - (w dir)))
  next-dir : arrived [(passable [rows, w cell + want, gate-open]) [want] else [(passable [rows, w cell + (w dir), gate-open]) [w dir] else [0x0]]] else [turning-back [want] else [w dir]]
  next-cell : arrived [w cell + next-dir] else [turning-back [w cell + want] else [w cell]]
  w with [cell : next-cell, at : vec toward [w at, cell-xy next-cell, 64 * dt], dir : next-dir, want : want]
]

-- a wisp chases two times in three at each crossing, and wanders the other time, so a lamplighter can slip away
step-wisp : [v walk-grid wick-cell fleeing speed dt seed |
  arrived : vec distance [v at, cell-xy (v cell)] < 0.5
  open : [x | (x != "#") and (x != "G")]
  ways : grid beside [walk-grid, v cell] keep [c | open (grid at [walk-grid, c])]
  wander : seeded chance [0.34, seed]
  next-cell : arrived [fleeing [grid away-step [walk-grid, v cell, wick-cell, open]] else [(wander and (ways length > 0)) [seeded pick [ways, seed + 1]] else [grid next-step [walk-grid, v cell, wick-cell, open]]]] else [v cell]
  v with [cell : next-cell, at : vec toward [v at, cell-xy next-cell, speed * dt]]
]

begin : [g n now |
  rows : floors @ n
  home : cells-of [rows, "P"] @ 1
  g with [
    mode : "intro", mode-at : now, floor : n
    wick : [cell : home, at : cell-xy home, dir : 0x0, want : 0x0], start-cell : home
    wisps : cells-of [rows, "W"] collect [c | [cell : c, at : cell-xy c, home : c, out-until : 0]]
    lanterns : cells-of [rows, "L"] collect [c | [cell : c, lit : false]]
    flares : cells-of [rows, "F"], flare-until : -9, gate : cells-of [rows, "G"] @ 1, song : "floor"
  ]
]

play : [g keys dt now |
  rows : floors @ (g floor)
  all-lit : g lanterns all [l | l lit]
  w : step-wick [g wick, keys, rows, all-lit, dt]
  near : [c | vec distance [w at, cell-xy c] < 9]
  lit-now : g lanterns count [l | (l lit not) and (near (l cell))]
  lanterns : g lanterns collect [l | ((l lit not) and (near (l cell))) [l with [lit : true]] else [l]]
  took-flare : g flares count [c | near c] > 0
  flare-until : took-flare [now + 6] else [g flare-until]
  fleeing : now < flare-until
  waking : now - (g mode-at) < 2
  speed : waking [0] else [fleeing [30] else [34 + (g floor * 6)]]
  -- a banished wisp is gone for three seconds, then comes back from where it started
  moved : g wisps numbered collect [[i, v] | (now < (v out-until)) [v] else [step-wisp [v, grids @ (g floor), w cell, fleeing, speed, dt, now * 1000 floor + (i * 37)]]]
  touching : moved keep [v | (now >= (v out-until)) and (vec distance [v at, w at] < 10)]
  banished : fleeing [touching length] else [0]
  caught : (fleeing not) and (touching length > 0)
  wisps : moved collect [v | (fleeing and (touching has v)) [v with [cell : v home, at : cell-xy (v home), out-until : now + 3]] else [v]]
  open-now : lanterns all [l | l lit]
  out : open-now and (vec distance [w at, cell-xy (g gate)] < 4)
  lit-now > 0
    zzfx preset ["coin", 0.8]
  took-flare
    zzfx preset "power"
  banished > 0
    zzfx preset "explode"
  caught
    zzfx preset "hurt"
    shake 5
  open-now and (all-lit not)
    zzfx preset ["select", 0.5]
  g with [
    wick : w, lanterns : lanterns, flares : g flares keep [c | near c not], flare-until : flare-until, wisps : wisps
    score : g score + (lit-now * 100) + (banished * 500) + (out [1000] else [0])
    mode : caught ["caught"] else [out ["clear"] else ["play"]], mode-at : (caught or out) [now] else [g mode-at]
    song : caught ["quiet"] else [out ["clear"] else [fleeing ["flare"] else ["floor"]]]
  ]
]

after-caught : [g now |
  (g lives > 1) [
    g with [
      mode : "play", mode-at : now, lives : g lives - 1, song : "floor", flare-until : -9
      wick : [cell : g start-cell, at : cell-xy (g start-cell), dir : 0x0, want : 0x0]
      wisps : g wisps collect [v | v with [cell : v home, at : cell-xy (v home)]]
    ]
  ] else [g with [mode : "over", mode-at : now, song : "over"]]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  prev : [one : false, two : false]
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  score : 0
  floor : 1

update : [game |
  g : game
  inp : g input
  b1 : inp held "one" else false
  b2 : inp held "two" else false
  pressed : (b1 and ((g prev one) not)) or (b2 and ((g prev two) not))
  keys : [go-left : inp held "left" else false, go-right : inp held "right" else false, go-up : inp held "up" else false, go-down : inp held "down" else false]
  now : g clock
  since : now - (g mode-at)
  after : (g mode = "play") [play [g, keys, g dt, now]] else [
    (g mode = "title") [pressed [begin [g with [score : 0, lives : 3], 1, now]] else [g]] else [
      (g mode = "intro") [(since > 1.8) [g with [mode : "play", mode-at : now]] else [g]] else [
        (g mode = "caught") [(since > 1.6) [after-caught [g, now]] else [g]] else [
          (g mode = "clear") [(since > 3) [(g floor < (floors length)) [begin [g, g floor + 1, now]] else [g with [mode : "won", mode-at : now, song : "title"]]] else [g]] else [
            ((since > 2) and pressed) or (since > 12) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
          ]
        ]
      ]
    ]
  ]
  (g mode = "title") and pressed
    zzfx preset "select"
  top : after score max (after best)
  after with [prev : [one : b1, two : b2], best : top, keep : [best : top]]
]

-- ================================================================ drawing
banner : [line y size colour | text [line, 129, y + 1, size, #000000], text [line, 128, y, size, colour]]
draw-keep : [g |
  now : g clock
  rows : floors @ (g floor)
  w : g wick
  fleeing : now < (g flare-until)
  tiles [plans @ (g floor), tile-set, floor-inks @ (g floor), 0, 16]
  all-lit : g lanterns all [l | l lit]
  sprite [all-lit [gate-open] else [gate-shut], cell-xy (g gate) x, cell-xy (g gate) y, ink, false]
  g lanterns each [l | sprite [(l lit) [lantern-lit] else [lantern-dark], cell-xy (l cell) x, cell-xy (l cell) y, ink, false]]
  g flares each [c | sprite [flare-art, cell-xy c x, cell-xy c y + ((now * 4) sin * 2), ink, false]]
  g wisps keep [v | now >= (v out-until)] each [v | sprite [flipbook pick [[wisp-a, wisp-b], 6, now], v at x, v at y, fleeing [scared-ink] else [ink], false]]
  sprite [wick-art, w at x, w at y, ink, w dir x < 0]
  -- the dark: only near Wick, and near a lit lantern, can anything be seen
  glow : g lanterns keep [l | l lit] collect [l | l cell]
  range 11 each [r | range 16 each [c |
    cell : pair [c, r]
    seen : (vec distance [cell-xy cell, w at] < 54) or (glow count [q | vec distance [q, cell] < 2.3] > 0)
    seen not
      rect [c - 1 * 16, r * 16, 16, 16, #000000]
  ]]
  rect [0, 0, 256, 16, #000000]
  text ["SC [g score]", 4, 8, 8, #ffffff, "left"]
  lit-count : g lanterns count [l | l lit]
  text ["LAMPS [lit-count]/[g lanterns length]", 128, 8, 8, #ffff55]
  text ["x[g lives]", 252, 8, 8, #55ffff, "right"]
]
draw : [game |
  g : game
  now : g clock
  clear #000000
  g mode = "title"
    banner ["LANTERN", 50, 24, #ffff55]
    banner ["KEEP", 80, 24, #ffaa00]
    banner ["LIGHT EVERY LANTERN", 110, 8, #ffffff]
    banner ["BEWARE THE WISPS", 124, 8, #aa55ff]
    (now * 2 floor % 2 = 0)
      banner ["PRESS 1 OR 2", 150, 8, #ffffff]
    best-text : g best str pad-left [6, "0"]
    banner ["BEST [best-text]", 168, 8, #55ffff]
  (g mode != "title") and (g mode != "won")
    draw-keep g
  g mode = "intro"
    rect [0, 80, 256, 34, #000000]
    banner ["FLOOR [g floor]", 96, 16, #ffff55]
  g mode = "caught"
    banner ["CAUGHT!", 96, 16, #ff5555]
  g mode = "clear"
    rect [0, 80, 256, 34, #000000]
    banner ["THE GATE IS OPEN", 96, 8, #ffff55]
  g mode = "over"
    banner ["GAME OVER", 88, 16, #ff5555]
    banner ["SCORE [g score]", 110, 8, #ffffff]
  g mode = "won"
    banner ["THE KEEP IS LIT", 70, 16, #ffff55]
    banner ["WICK CAN REST", 96, 8, #ffffff]
    banner ["SCORE [g score]", 116, 8, #55ffff]
]
