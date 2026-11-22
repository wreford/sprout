-- CRATE COVE: a pushing puzzle for the SPROUT·8 console. Pinch the hermit crab tidies the cove before the tide: push
-- every piece of driftwood onto a glowing tide mark. Driftwood can be pushed, never pulled, one piece at a time. The
-- D-pad walks, button 1 takes a move back, button 2 starts the cove again. Six coves; your fewest moves are kept.

-- ================================================================ the art
ink : [k : #000000, w : #ffffff, r : #ff0000, o : #ff5500, y : #ffff55, n : #aa5500, b : #550000, c : #55ffff, a : #00aaaa, s : #ffaa55, g : #55ff55]
home-ink : ink with [n : #00aa55, b : #005500, s : #55ff55]
crab-art : [
  "................"
  "..kk........kk.."
  ".krrk......krrk."
  ".krrrk....krrrk."
  "..krrk.kk.krrk.."
  "...kk.kwwk.kk..."
  "......kwkk......"
  "...kkkkkkkkkk..."
  "..koosssssoook.."
  ".kooossssssoook."
  ".koowkooookwook."
  ".koookooookoook."
  "..kooooooooook.."
  ".k.kk.kkkk.kk.k."
  "k..k..k..k..k..k"
  "................"
]
wood-art : [
  "kkkkkkkkkkkkkkkk"
  "knnnnnnnnnnnnnnk"
  "knssnnnnnnnssnnk"
  "knnnbbbbbbbbnnnk"
  "kbbbbnnnnnbbbbbk"
  "knnnnnnnnnnnnnnk"
  "knsnnnnssnnnnsnk"
  "kbbbbbbbbbbbbbbk"
  "knnnnnnnnnnnnnnk"
  "knnsnnnnnnnnsnnk"
  "kbbbbbnnnnbbbbbk"
  "knnnnbbbbbbnnnnk"
  "knnssnnnnnnssnnk"
  "knnnnnnnnnnnnnnk"
  "kbbbbbbbbbbbbbbk"
  "kkkkkkkkkkkkkkkk"
]
mark-art : [
  "................"
  "................"
  ".....aaaaaa....."
  "....acccccca...."
  "...accaaaacca..."
  "..acca....acca.."
  "..aca......aca.."
  "..aca......aca.."
  "..aca......aca.."
  "..aca......aca.."
  "..acca....acca.."
  "...accaaaacca..."
  "....acccccca...."
  ".....aaaaaa....."
  "................"
  "................"
]
rock-tile : [
  "eeeeeeeeeeeeeeee"
  "efffffffeffffffe"
  "efhhhhhfefhhhhfe"
  "efhfffffefhfffee"
  "efffffffeffffffe"
  "eeeeeeeeeeeeeeee"
  "ffffeffffffeffff"
  "fhhfefhhhhfefhhf"
  "fhffefhfffffefhf"
  "ffffeffffffeffff"
  "eeeeeeeeeeeeeeee"
  "efffffffeffffffe"
  "efhhhhhfefhhhhfe"
  "efhfffffefhfffee"
  "efffffffeffffffe"
  "eeeeeeeeeeeeeeee"
]
sand-tile : [
  "pppppppppppppppp"
  "ppqpppppppppqppp"
  "pppppppqpppppppp"
  "pppppppppppppppp"
  "pqpppppppppppqpp"
  "pppppqpppppppppp"
  "pppppppppppqpppp"
  "ppppqppppppppppp"
  "pppppppppppppppp"
  "pppppppppqpppppp"
  "pqpppppppppppppq"
  "ppppppqppppppppp"
  "pppppppppppppppp"
  "pppqpppppppqpppp"
  "pppppppppppppppp"
  "ppppppppqppppppp"
]
tile-set : [["#", rock-tile], [".", sand-tile]]
tile-ink : [e : #000000, f : #555555, h : #aaaaaa, p : #ffaa55, q : #aa5500]

-- ================================================================ the coves
levels-text : [
  [
    "#######"
    "#.....#"
    "#.PB.x#"
    "#.....#"
    "#######"
  ]
  [
    "########"
    "#..x...#"
    "#..B...#"
    "#P.B.x.#"
    "#......#"
    "########"
  ]
  [
    "########"
    "#......#"
    "#.B##B.#"
    "#.x..x.#"
    "##.B.#.#"
    "#..x...#"
    "#P.....#"
    "########"
  ]
  [
    "######  "
    "#....#  "
    "#.BB.###"
    "#..#...#"
    "#xx#.P.#"
    "########"
  ]
  [
    "#######"
    "#x...x#"
    "#.B.B.#"
    "#..P..#"
    "#.B.B.#"
    "#x...x#"
    "#######"
  ]
  [
    "#######"
    "#.....#"
    "#.B.B.#"
    "#..#..#"
    "#x...x#"
    "#..P..#"
    "#######"
  ]
]
-- each cove read from its text once: its walls, its marks, where the driftwood and the crab start, and where it sits
coves : levels-text collect [rows |
  w : rows @ 1 length
  h : rows length
  [
    walls : tilemap find [rows, "#"]
    marks : tilemap find [rows, "x"] .. (tilemap find [rows, "X"])
    wood : tilemap find [rows, "B"] .. (tilemap find [rows, "X"])
    crab : tilemap find [rows, "P"] @ 1
    origin : pair [256 - (w * 16) / 2 floor, 176 - (h * 16) / 2 floor + 16]
    plan : tilemap clear [rows, "xXBP"]
  ]
]
cell-xy : [origin c | c - 1 * 16 + origin]

songs : [
  title : [
    bpm : 100, beats : 16
    lead : music track ["C5 . E5 . G5 . E5 . | F5 . A5 . G5 - - . | E5 . C5 . D5 . B4 . | C5 - - . . . . .", 0.5]
    bass : music track ["C3 - - . G2 - - . | F2 - - . C3 - - . | A2 - - . G2 - - . | C3 - - . G2 - - .", 0.5]
  ]
  cove : [
    bpm : 104, beats : 32
    lead : music track ["G4 . C5 . E5 . D5 . | C5 . . . G4 . . . | A4 . C5 . F5 . E5 . | D5 . . . . . . . | G4 . C5 . E5 . G5 . | A5 . G5 . E5 . C5 . | D5 . . E5 F5 . D5 . | C5 - - . . . . .", 0.5]
    bass : music track ["C3 . G3 . C3 . G3 . | E3 . G3 . E3 . G3 . | F3 . C4 . F3 . C4 . | G3 . D3 . G3 . D3 . | C3 . G3 . C3 . G3 . | F3 . C4 . F3 . C4 . | G3 . D3 . G3 . D3 . | C3 . G2 . C3 . . .", 0.5]
    drums : music track ["kick . hat . . . hat . | kick . hat . . . hat . | kick . hat . . . hat . | kick . hat . . . hat hat | kick . hat . . . hat . | kick . hat . . . hat . | kick . hat . . . hat . | kick . hat . snare . hat .", 0.5]
  ]
  solved : [
    bpm : 150, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 - . G5 C6 | - - - - . . . .", 0.5]
    bass : music track ["C3 . G3 . C4 . . . | C3 - - - . . . .", 0.5]
  ]
]

-- ================================================================ moving
begin : [g n now |
  c : coves @ n
  g with [mode : "play", mode-at : now, cove : n, crab : c crab, wood : c wood, moves : 0, history : [], facing : 1, step-at : 0, song : "cove"]
]

-- one step: walk, or push a piece of driftwood if the space beyond it is clear
step : [g d now |
  c : coves @ (g cove)
  ahead : g crab + d
  beyond : ahead + d
  pushing : g wood has ahead
  blocked : (c walls has ahead) or (pushing and ((c walls has beyond) or (g wood has beyond)))
  wood-after : pushing [g wood collect [p | (p = ahead) [beyond] else [p]]] else [g wood]
  turned : (d x != 0) [d x] else [g facing]
  (blocked not) and pushing
    zzfx preset "step"
  blocked
    zzfx preset ["blip", 0.5]
  blocked [g with [facing : turned, step-at : now]] else [
    g with [
      history : undo push [g history, [crab : g crab, wood : g wood], 300], crab : ahead, wood : wood-after
      moves : g moves + 1, facing : turned, step-at : now
    ]
  ]
]

play : [g keys b1-now b2-now now |
  c : coves @ (g cove)
  d : cond [keys go-left, -1x0, keys go-right, 1x0, keys go-up, 0x-1, keys go-down, 0x1, any, 0x0]
  fresh : d != (g held-dir)
  due : (d != 0x0) and (fresh or (now - (g step-at) > 0.17))
  moved : due [step [g, d, now]] else [g]
  back : undo back [g history, [crab : g crab, wood : g wood]]
  undone : b1-now [moved with [crab : back state crab, wood : back state wood, history : back history, moves : g moves - 1 max 0]] else [moved]
  restarted : b2-now [begin [g, g cove, now]] else [undone]
  done : c marks all [m | restarted wood has m]
  b1-now
    zzfx preset ["select", 0.7]
  done
    zzfx preset "power"
  restarted with [held-dir : d, mode : done ["solved"] else ["play"], mode-at : done [now] else [restarted mode-at], song : done ["solved"] else [restarted song]]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  prev : [one : false, two : false]
  bests : saved bests else [[0, 0, 0, 0, 0, 0]]
  keep : [bests : saved bests else [[0, 0, 0, 0, 0, 0]]]
  song : "title"
  cove : 1
  held-dir : 0x0

update : [game |
  g : game
  inp : g input
  b1 : inp held "one" else false
  b2 : inp held "two" else false
  b1-now : b1 and ((g prev one) not)
  b2-now : b2 and ((g prev two) not)
  keys : [go-left : inp held "left" else false, go-right : inp held "right" else false, go-up : inp held "up" else false, go-down : inp held "down" else false]
  now : g clock
  since : now - (g mode-at)
  after : (g mode = "play") [play [g, keys, b1-now, b2-now, now]] else [
    (g mode = "title") [(b1-now or b2-now) [begin [g, 1, now]] else [g]] else [
      (g mode = "solved") [(since > 2.2) [
        n : g cove
        old : g bests @ n
        bests : g bests numbered collect [[i, b] | (i = n) [((b = 0) or (g moves < b)) [g moves] else [b]] else [b]]
        (n < (coves length)) [begin [g with [bests : bests], n + 1, now]] else [g with [bests : bests, mode : "done", mode-at : now, song : "title"]]
      ] else [g]] else [
        ((since > 2) and (b1-now or b2-now)) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
      ]
    ]
  ]
  (g mode = "title") and (b1-now or b2-now)
    zzfx preset "select"
  after with [prev : [one : b1, two : b2], keep : [bests : after bests]]
]

-- ================================================================ drawing
banner : [line y size colour | text [line, 129, y + 1, size, #000000], text [line, 128, y, size, colour]]
sea : [now | range 6 each [i | rect [0 - (now * 8 + (i * 37) % 64), i * 32 + 24, 320, 2, #55aaff]]]
draw-cove : [g |
  now : g clock
  c : coves @ (g cove)
  o : c origin
  tiles [c plan, tile-set, tile-ink, o x, o y]
  c marks each [m | sprite [mark-art, cell-xy [o, m] x, cell-xy [o, m] y, ink, false]]
  g wood each [p | sprite [wood-art, cell-xy [o, p] x, cell-xy [o, p] y, (c marks has p) [home-ink] else [ink], false]]
  bob : (now - (g step-at) < 0.12) [-1] else [0]
  sprite [crab-art, cell-xy [o, g crab] x, cell-xy [o, g crab] y + bob, ink, g facing < 0]
  rect [0, 0, 256, 12, #000000]
  text ["COVE [g cove]/[coves length]", 4, 6, 8, #ffffff, "left"]
  text ["MOVES [g moves]", 128, 6, 8, #ffff55]
  best : g bests @ (g cove)
  best-text : (best = 0) ["-"] else [best str]
  text ["BEST [best-text]", 252, 6, 8, #55ffff, "right"]
  text ["1 UNDO  2 RESTART", 128, 186, 8, #ffffff]
]
draw : [game |
  g : game
  now : g clock
  clear #0055aa
  sea now
  g mode = "title"
    banner ["CRATE", 48, 24, #ffaa55]
    banner ["COVE", 76, 24, #ffff55]
    banner ["PUSH THE DRIFTWOOD", 106, 8, #ffffff]
    banner ["ONTO THE TIDE MARKS", 118, 8, #ffffff]
    sprite [crab-art, 120, 132 + ((now * 3) sin * 2), ink, false]
    (now * 2 floor % 2 = 0)
      banner ["PRESS 1 OR 2", 168, 8, #ffffff]
  (g mode = "play") or (g mode = "solved")
    draw-cove g
  g mode = "solved"
    rect [0, 80, 256, 32, #000000]
    banner ["TIDY! [g moves] MOVES", 96, 8, #55ff55]
  g mode = "done"
    banner ["THE COVE IS TIDY", 70, 16, #ffff55]
    total : g bests sum
    banner ["ALL SIX IN [total] MOVES", 100, 8, #ffffff]
    banner ["PRESS 1 OR 2", 130, 8, #55ffff]
]
