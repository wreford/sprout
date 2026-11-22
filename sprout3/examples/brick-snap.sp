-- BRICK SNAP: an 8-bit block puzzle with toy bricks, on SPROUT·8. Three bricks wait in the tray. Move the shadow of
-- the one you hold over the baseplate with the arrows, snap it down with 1, or take another with 2. Fill a row or a
-- column and it pops off, rows and columns together: pop several at once for a bigger score, and pop on snap after
-- snap for a streak. Empty the whole plate for a bonus. When none of the bricks left will fit, the game is over.

-- ================================================================ the bricks
-- each paint: its face, its light edge and its dark edge
paints : [
  [#ff0000, #ff5555, #aa0000]
  [#0055ff, #55aaff, #0000aa]
  [#ffff00, #ffffaa, #aaaa00]
  [#00aa00, #55ff55, #005500]
  [#ffaa00, #ffff55, #aa5500]
  [#aa00ff, #ff55ff, #5500aa]
  [#00aaaa, #55ffff, #005555]
]
forms : [
  ["#"]
  ["##"]
  ["###"]
  ["####"]
  ["#####"]
  ["##", "##"]
  ["###", "###", "###"]
  ["##", "#."]
  ["###", "#..", "#.."]
  ["###", ".#."]
  ["##.", ".##"]
  ["#..", "###"]
  ["###", "###"]
]
-- how often each form comes: the single square and the big square least
form-weights : [2, 4, 4, 3, 2, 4, 1, 4, 2, 3, 3, 3, 2]
brick-ink : [k : #000000, r : #ff0000, l : #ff5555, d : #aa0000]
brick-art : [
  "................"
  "................"
  "..kkkk....kkkk.."
  ".kllrrk..kllrrk."
  ".klrrdk..klrrdk."
  "kkkkkkkkkkkkkkkk"
  "kllllllllllllllk"
  "klrrrrrrrrrrrrdk"
  "klrrrrrrrrrrrrdk"
  "klrrrrrrrrrrrrdk"
  "klrrrrrrrrrrrrdk"
  "klrrrrrrrrrrrrdk"
  "klrrrrrrrrrrrrdk"
  "kddddddddddddddk"
  "kkkkkkkkkkkkkkkk"
  "................"
]

-- a brick of one paint, bevelled, with its stud on top
brick : [px py side k |
  paint : paints @ k
  mid : side / 2 floor
  dot : side / 5 floor max 1
  rect [px, py, side, side, paint @ 3]
  rect [px, py, side - 1, side - 1, paint @ 2]
  rect [px + 2, py + 2, side - 3, side - 3, paint @ 1]
  circle [px + mid + 1, py + mid + 1, dot, paint @ 3]
  circle [px + mid, py + mid, dot, paint @ 2]
  circle [px + mid, py + mid, dot - 1 max 1, paint @ 1]
]
-- an empty square of the green baseplate, with its stud: lit on the rim at the top left, in shadow below
stud : [px py |
  rect [px, py, 17, 17, #00aa00]
  circle [px + 9, py + 9, 4, #005500]
  circle [px + 8, py + 8, 4, #55ff55]
  circle [px + 8, py + 8, 3, #00aa00]
]
-- where a place on the board is on the screen
spot-xy : [p | p - 1x1 * 18 + 10x22]

-- ================================================================ the music
songs : [
  title : [
    bpm : 120, beats : 16
    lead : music track ["C5 . E5 . G5 . E5 . | F5 . A5 . G5 - - . | E5 . G5 . C6 . B5 . | G5 - - . . . . .", 0.5]
    bass : music track ["C3 . C3 . G2 . G2 . | F2 . F2 . G2 . G2 . | C3 . C3 . E3 . E3 . | G2 . G2 . G2 . . .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick kick hat . snare . crash .", 0.5]
  ]
  play : [
    bpm : 144, beats : 32
    lead : music track ["C5 . D5 E5 . G5 . E5 | D5 . C5 . A4 . C5 . | F5 . E5 D5 . C5 . D5 | E5 - - . G4 . . . | C5 . D5 E5 . G5 . A5 | G5 . E5 . C5 . E5 . | F5 . A5 . G5 . F5 . | E5 . D5 . C5 - - .", 0.5]
    bass : music track ["C3 . C3 G2 C3 . G2 . | A2 . A2 E2 A2 . E2 . | F2 . F2 C3 F2 . C3 . | G2 . G2 D3 G2 . D3 . | C3 . C3 G2 C3 . G2 . | A2 . A2 E2 A2 . E2 . | F2 . F2 C3 G2 . D3 . | C3 . G2 . C3 . . .", 0.5]
    drums : music track ["kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . snare snare | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick kick snare kick snare snare crash .", 0.5]
  ]
  over : [
    bpm : 100, beats : 8, once : true
    lead : music track ["G4 . E4 . C4 . . . | D4 - E4 - C4 - - -", 0.5]
    bass : music track ["C3 . G2 . E2 . . . | G2 - G2 - C2 - - -", 0.5]
  ]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  board : grid make [8x8, 0]
  tray : []
  hold : 1
  at : 4x4
  score : 0
  streak : 0
  seed : 1
  deals : 0
  sparks : []
  said : ""
  said-at : -9
  sfx : ""
  rep : 0

-- a brick for the tray, its form, turn and paint all from one seed
make-piece : [seed |
  form : seeded weighted [forms, form-weights, seed]
  turns : seeded whole [0, 3, seed * 7 + 3]
  laid-out : range turns fold [piece cells form, [bits k | piece turn bits]]
  [cells : laid-out, colour : seeded whole [1, 7, seed * 3 + 1], used : false]
]
-- three new bricks in the tray
deal : [g |
  n : g deals + 1
  fresh-tray : range 3 collect [k | make-piece (g seed * 101 + (n * 13) + (k * 5))]
  g with [tray : fresh-tray, deals : n, hold : 1]
]
-- the next brick in the tray not yet used, after the one held
next-free : [tray from |
  ring : range 3 collect [k | from - 1 + k % 3 + 1]
  free : ring keep [k | (tray @ k used) not]
  (free length > 0) [free @ 1] else [from]
]
begin : [g now |
  run-seed : now * 1000 floor % 100000 + 7
  deal (g with [mode : "play", mode-at : now, song : "play", board : grid make [8x8, 0], score : 0, streak : 0, at : 4x4, deals : 0, seed : run-seed, sparks : [], said : "", said-at : -9, sfx : "start", rep : 0])
]

-- a brick snapped down: full lines pop, the score, the streak, the sparks, a new tray, and is there room left?
place : [g pc spot now |
  laid : piece put [g board, pc cells, spot, pc colour]
  full : piece full-lines laid
  n : piece full-count laid
  gone : piece cleared [laid, full]
  wiped : piece clear [laid, full]
  run : (n > 0) [g streak + 1] else [0]
  all-clear : (n > 0) and (piece filled wiped = 0)
  gain : pc cells length + ((n > 0) [10 * n * n * run] else [0]) + (all-clear [300] else [0])
  used-tray : g tray numbered collect [[k, t] | (k = (g hold)) [t with [used : true]] else [t]]
  burst : gone numbered collect-flat [[i, p] |
    centre : spot-xy p + 9x9
    glow : paints @ (grid at [laid, p]) @ 2
    range 3 collect [j | [from : centre, vel : seeded in-circle [110, g seed + (i * 7) + (j * 31) + (g deals * 3) + (g score)] - 0x70, born : now, tint : glow]]
  ]
  word : cond [all-clear, "ALL CLEAR!", n >= 4, "MEGA POP!", n = 3, "TRIPLE POP!", n = 2, "DOUBLE POP!", any, "POP!"]
  new-score : g score + gain
  all-sparks : g sparks .. burst
  said-now : (n > 0) [word] else [g said]
  said-when : (n > 0) [now] else [g said-at]
  noise-name : cond [n >= 2, "big", n = 1, "pop", any, "place"]
  laid-g : g with [board : wiped, tray : used-tray, score : new-score, streak : run, sparks : all-sparks, said : said-now, said-at : said-when, sfx : noise-name]
  dealt : (used-tray all [t | t used]) [deal laid-g] else [laid-g with [hold : next-free [used-tray, g hold]]]
  stuck : dealt tray keep [t | (t used) not] all [t | (piece anywhere [dealt board, t cells]) not]
  stuck [dealt with [mode : "over", mode-at : now, song : "over", sfx : "over"]] else [dealt]
]

-- a tick of play: the arrows move the shadow (held, they repeat), 1 snaps, 2 swaps
play : [g inp now |
  downs : inp pressed
  tap-way : pad way downs
  held-way : pad way (inp held)
  due : (held-way != 0x0) and (g rep > 0.22)
  moved : (tap-way != 0x0) [tap-way] else [due [held-way] else [0x0]]
  rep-next : (held-way = 0x0) [0] else [due [0.15] else [g rep + (g dt)]]
  pc : g tray @ (g hold)
  room : 9x9 - (piece size (pc cells))
  aim : g at + moved
  at-now : pair [aim x max 1 min (room x), aim y max 1 min (room y)]
  fits-now : piece fits [g board, pc cells, at-now]
  snap : downs "one"
  swap : downs "two"
  step-noise : (moved != 0x0) ["move"] else [""]
  moved-g : g with [at : at-now, rep : rep-next, sfx : step-noise]
  cond [
    snap and fits-now, place [moved-g, pc, at-now, now]
    snap, moved-g with [sfx : "bonk"]
    swap, moved-g with [hold : next-free [g tray, g hold], sfx : "swap"]
    any, moved-g
  ]
]

update : [game |
  g : game
  inp : g input
  now : g clock
  go : pad either (inp pressed)
  since : now - (g mode-at)
  after : cond [
    g mode = "title", go [begin [g, now]] else [g with [sfx : ""]]
    g mode = "play", play [g, inp, now]
    g mode = "over", ((since > 1.2) and go) [g with [mode : "title", mode-at : now, song : "title", sfx : "swap"]] else [g with [sfx : ""]]
    any, g
  ]
  top : after score max (after best)
  live-sparks : after sparks keep [s | now - (s born) < 0.8]
  after sfx = "start"
    zzfx preset "select"
  after sfx = "move"
    beep [880, 0.015]
  after sfx = "swap"
    zzfx preset ["blip", 1.3]
  after sfx = "place"
    zzfx preset ["blip", 0.5]
  after sfx = "pop"
    zzfx preset "coin"
    shake 2
  after sfx = "big"
    zzfx preset "power"
    hiss [0.3, 3000]
    shake 4
  after sfx = "bonk"
    beep [110, 0.1]
  after sfx = "over"
    zzfx preset "explode"
    shake 6
  after with [best : top, keep : [best : top], sparks : live-sparks]
]

-- ================================================================ drawing
draw-title : [g now |
  clear #000055
  range 12 each [i | brick [i * 21 + 2, now * 40 + (i * 53) % 230 - 30, 17, i % 7 + 1]]
  ui panel [28x40, 200x76, #ffff55, #000000]
  ui banner ["BRICK", 62, 16, #ff5555]
  ui banner ["SNAP!", 90, 16, #ffff55]
  ui blink ["PRESS 1", 150, #ffffff, now]
  g best > 0
    ui banner ["BEST [g best]", 170, 8, #55ffff]
]
draw-tray : [g |
  g tray numbered each [[k, pc] |
    top : k - 1 * 48 + 22
    ui panel [pair [164, top], 86x44, (k = (g hold)) [#ffff55] else [#555555], #000055]
    (pc used) not
      span-px : piece size (pc cells) * 8
      ox : 207 - (span-px x / 2 floor)
      oy : top + 22 - (span-px y / 2 floor)
      pc cells each [c | brick [ox + (c x * 8), oy + (c y * 8), 8, pc colour]]
  ]
]
draw-ghost : [g now |
  pc : g tray @ (g hold)
  spot : g at
  paint : paints @ (pc colour)
  ok-here : piece fits [g board, pc cells, spot]
  ok-here
    full : piece full-lines (piece put [g board, pc cells, spot, 9])
    now * 6 floor % 2 = 0
      full rows each [r | rect [10, r - 1 * 18 + 30, 144, 2, #ffffff]]
      full columns each [c | rect [c - 1 * 18 + 18, 22, 2, 144, #ffffff]]
    pc cells each [b |
      p : spot-xy (spot + b)
      rect [p x + 1, p y + 1, 15, 15, paint @ 2]
      rect [p x + 4, p y + 4, 9, 9, paint @ 1]
    ]
  ok-here not
    now * 8 floor % 2 = 0
      pc cells each [b | p : spot-xy (spot + b), rect [p x + 4, p y + 4, 9, 9, #ff0000]]
]
draw-play : [g now |
  clear #000055
  ui strip ["SCORE [g score]", (g streak > 1) ["STREAK x[g streak]"] else [""], "BEST [g best]", #000000, #ffff55]
  ui panel [6x18, 152x152, #ffff55, #005500]
  g board numbered each [[r, row] |
    row numbered each [[c, v] |
      p : spot-xy (pair [c, r])
      v = 0
        stud [p x, p y]
      v != 0
        brick [p x, p y, 17, v]
    ]
  ]
  g mode = "play"
    draw-ghost [g, now]
  draw-tray g
  g sparks each [s |
    age : now - (s born)
    age < 0.7
      q : s from + (s vel * age) + (pair [0, age * age * 220])
      rect [q x, q y, 2, 2, s tint]
  ]
  ui float [g said, 82x92, #ffffff, g said-at, now]
  text ["1 SNAP 2 SWAP", 204, 182, 8, #aaaaaa]
]
draw-over : [g now |
  ui panel [36x60, 184x80, #ff5555, #000000]
  ui banner ["NO ROOM!", 78, 16, #ff5555]
  ui banner ["SCORE [g score]", 102, 8, #ffffff]
  ui banner ["BEST [g best]", 116, 8, #55ffff]
  now - (g mode-at) > 1.2
    ui blink ["PRESS 1", 130, #ffff55, now]
]
draw : [game |
  g : game
  now : g clock else 0
  g mode = "title"
    draw-title [g, now]
  g mode != "title"
    draw-play [g, now]
  g mode = "over"
    draw-over [g, now]
]
