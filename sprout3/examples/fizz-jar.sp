-- FIZZ JAR: a falling-pair puzzle for the SPROUT·8 console. Pairs of fizzy drops fall into a soda jar where grumpy
-- sour candies sit. Line up four or more of one colour, drops and sours together, across or down, and they pop; what
-- was resting on them falls. Pop every sour to clear the jar. Each jar holds more sours, and the drops fall faster.
-- The arrows move the pair, down drops it faster, buttons 1 and 2 turn it. Pops that set off more pops score double.

-- ================================================================ the art
drop-art : [
  "....kkkk...."
  "..kkmmmmkk.."
  ".kmwwmmmmmk."
  ".kmwmmmmmmk."
  "kmlmmmmmmmdk"
  "kmmmmmmmmmdk"
  "kmmmmmmmmmdk"
  "kmmmmmmmmddk"
  ".kmmmmmmddk."
  ".kdmmmmdddk."
  "..kkddddkk.."
  "....kkkk...."
]
sour-art : [
  ".kkkkkkkkkk."
  "kmlmmwmmlmmk"
  "kmmmmmmmmmmk"
  "kmkkkmmkkkmk"
  "kmmwkmmwkmmk"
  "kmmmmmmmmmmk"
  "kmmmkkkkmmmk"
  "kmmkwmwmkmmk"
  "kmmmkkkkmmmk"
  "kdmmmmmmmmdk"
  "kddddddddddk"
  ".kkkkkkkkkk."
]
star-art : [
  ".....w......"
  ".....w......"
  "..w..w..w..."
  "...w.w.w...."
  "....www....."
  "wwwwwwwwwww."
  "....www....."
  "...w.w.w...."
  "..w..w..w..."
  ".....w......"
  ".....w......"
  "............"
]
red-ink : [k : #000000, m : #ff0000, d : #aa0000, l : #ff5555, w : #ffffff]
green-ink : red-ink with [m : #55ff00, d : #00aa00, l : #aaff55]
blue-ink : red-ink with [m : #5555ff, d : #0000aa, l : #55aaff]
star-ink : [w : #ffffaa]
ink-for : [c | match [c lower, ["r", red-ink, "g", green-ink, any, blue-ink]]]
candy : ["r", "g", "b"]
sours : "RGB"

-- ================================================================ music
songs : [
  title : [
    bpm : 128, beats : 16
    lead : music track ["C5 . E5 . G5 . E5 . | F5 . A5 . C6 - A5 . | G5 . E5 . C5 . E5 . | D5 - - . G4 - - .", 0.5]
    bass : music track ["C3 . C3 . G2 . G2 . | F2 . F2 . A2 . A2 . | C3 . C3 . E2 . E2 . | G2 - G2 . G2 - - .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat kick snare . hat . | kick . hat . snare . hat . | kick kick snare . snare snare crash .", 0.5]
  ]
  fizz : [
    bpm : 144, beats : 32
    lead : music track ["E5 G5 . E5 C5 . D5 E5 | . G5 . A5 G5 - E5 . | F5 A5 . F5 D5 . E5 F5 | . A5 . B5 A5 - - . | G5 . E5 . G5 . C6 . | B5 . G5 . A5 - - . | F5 . D5 . E5 . C5 . | D5 . B4 . C5 - - .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | C3 . G2 . C3 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 . G2 . | E2 . B2 . A2 . E2 . | F2 . C3 . G2 . D3 . | G2 . G2 . C3 - - .", 0.5]
    drums : music track ["kick . snare . kick kick snare . | kick . snare . kick kick snare hat | kick . snare . kick kick snare . | kick . snare . kick kick snare hat | kick . snare . kick kick snare . | kick . snare . kick kick snare hat | kick . snare . kick kick snare . | kick . snare . snare snare crash .", 0.5]
  ]
  cleared : [
    bpm : 150, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 . G5 C6 - | - - . . . . . .", 0.5]
    bass : music track ["C3 . G2 . C3 - - . | . . . . . . . .", 0.5]
  ]
  over : [
    bpm : 90, beats : 8, once : true
    lead : music track ["G4 . F4 . E4 . D4 . | C4 - - - . . . .", 0.5]
    bass : music track ["G2 . F2 . E2 . D2 . | C2 - - - . . . .", 0.5]
  ]
]

-- ================================================================ the jar
-- the turns of a pair: where the second drop sits from the first, going round clockwise
offsets : [1x0, 0x1, -1x0, 0x-1]
halves : [pc | [pc at, pc at + (offsets @ (pc turn))]]
fall-time : [jar | 0.75 - (jar * 0.06) max 0.18]
two-colours : [seed k | [seeded pick [candy, seed + (k * 7)], seeded pick [candy, seed + (k * 7) + 3]]]
popping-in : [well | runs find [well collect [line | line lower], 4]]
popping-in-three : [well | runs find [well collect [line | line lower], 3] length]

-- a jar with its sours, low down, never three of a colour in a line
fill-jar : [jar seed |
  wanted : jar * 2 + 2 min 24
  bare : range 15 collect [r | "........"]
  range (wanted * 2) fold [bare, [well k |
    spot : pair [seeded whole [1, 8, seed + (k * 13)], seeded whole [7, 15, seed + (k * 17) + 1]]
    tried : runs put [well, spot, seeded pick [["R", "G", "B"], seed + (k * 19) + 2]]
    ready : runs count [well, sours] >= wanted
    (ready not) and (runs cell-at [well, spot] = ".") and ((popping-in-three tried) = 0) [tried] else [well]
  ]]
]

-- the pair moved by a step, if there's room
shift : [well pc by | moved : pc with [at : pc at + by], (runs open [well, halves moved]) [moved] else [pc]]
-- the pair turned, nudged aside or up if it must be, or left as it was
spin : [well pc by |
  turned : pc with [turn : menu wrap [pc turn, 4, by]]
  tries : [turned, turned with [at : turned at - 1x0], turned with [at : turned at + 1x0], turned with [at : turned at - 0x1]]
  fits : tries keep [t | runs open [well, halves t]]
  (fits length > 0) [fits @ 1] else [pc]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  sfx : ""
  score : 0
  jar : 1
  seed : 1
  well : range 15 collect [r | "........"]
  piece : [at : 4x1, turn : 1, colours : ["r", "g"]]
  coming : ["r", "g"]
  dropped : 0
  phase : "fall"
  fall-at : 0
  slide-at : 0
  popping : []
  pop-at : 0
  chain : 0
  said : ""
  said-at : -9
  said-spot : 1x1

-- the next pair comes in at the top; if there's no room, the jar has fizzled out
spawn : [g now |
  pc : [at : 4x1, turn : 1, colours : g coming]
  later : two-colours [g seed, g dropped + 1]
  (runs open [g well, halves pc]) [g with [piece : pc, coming : later, dropped : g dropped + 1, fall-at : now + (fall-time (g jar)), phase : "fall"]] else [g with [mode : "over", mode-at : now, song : "over", sfx : "over"]]
]
new-game : [g now |
  seed : now * 997 floor + 11
  spawn [g with [mode : "play", mode-at : now, song : "fizz", score : 0, jar : 1, seed : seed, dropped : 0, well : fill-jar [1, seed], coming : two-colours [seed, 0], chain : 0, popping : [], said : "", said-at : -9], now]
]
next-jar : [g now |
  n : g jar + 1
  fresh : fill-jar [n, g seed + (n * 101)]
  spawn [g with [mode : "play", mode-at : now, song : "fizz", jar : n, well : fresh, chain : 0, popping : []], now]
]

-- the pair lands: its drops go into the jar, a drop left hanging falls, and runs of four start to pop
land : [g pc now |
  hs : halves pc
  well1 : runs put [g well, hs @ 1, pc colours @ 1]
  settled : runs fall [runs put [well1, hs @ 2, pc colours @ 2], sours]
  found : popping-in settled
  (found length > 0) [g with [well : settled, phase : "pop", popping : found, pop-at : now, chain : 1, sfx : "pop"]] else [spawn [g with [well : settled, sfx : "land"], now]]
]

-- the drops and sours popping go, what they held up falls, and the next runs pop in a chain
pop-step : [g now |
  (now - (g pop-at) < 0.35) [g] else [
    hit : g popping
    sours-hit : hit keep [p | sours chars has (runs cell-at [g well, p])] length
    gained : sours-hit * 100 + (hit length - sours-hit * 10) * ([1, 2, 4, 8, 16] @ (g chain min 5))
    fallen : runs fall [runs clear [g well, hit], sours]
    found : popping-in fallen
    scored : g with [well : fallen, score : g score + gained, said : "+[gained]", said-at : now, said-spot : hit @ 1]
    cond [
      found length > 0, scored with [popping : found, pop-at : now, chain : g chain + 1, sfx : "pop"]
      runs count [fallen, sours] = 0, scored with [mode : "clear", mode-at : now, score : g score + gained + (g jar * 500), song : "cleared", sfx : "clear"]
      any, spawn [scored with [phase : "fall"], now]
    ]
  ]
]

-- the pair as the buttons move it: a press moves a place and holding repeats; down falls faster
fall-step : [g inp now |
  hit : inp pressed
  hold : inp held
  way : pad across hit
  again : (pad across hold != 0) and (now >= (g slide-at))
  step-x : (way != 0) [way] else [again [pad across hold] else [0]]
  slide : (way != 0) [now + 0.22] else [again [now + 0.07] else [g slide-at]]
  moved : shift [g well, g piece, pair [step-x, 0]]
  turn-by : (hit "one" [1] else [0]) - (hit "two" [1] else [0])
  turned : (turn-by = 0) [moved] else [spin [g well, moved, turn-by]]
  due : now >= (g fall-at)
  lower : shift [g well, turned, 0x1]
  wait : (hold "down") [0.04] else [fall-time (g jar)]
  noise-of : (turn-by != 0) ["turn"] else [""]
  cond [
    due and (lower = turned), land [g, turned, now]
    due, g with [piece : lower, fall-at : now + wait, slide-at : slide, sfx : noise-of]
    any, g with [piece : turned, slide-at : slide, fall-at : (hold "down") [g fall-at min (now + 0.04)] else [g fall-at], sfx : noise-of]
  ]
]
play : [g inp now | (g phase = "pop") [pop-step [g, now]] else [fall-step [g, inp, now]]]

update : [game |
  g : game with [sfx : ""]
  inp : g input
  now : g clock
  since : now - (g mode-at)
  go : pad either (inp pressed)
  after : cond [
    g mode = "title", go [new-game [g, now]] else [g]
    g mode = "play", play [g, inp, now]
    g mode = "clear", (since > 2.4) [next-jar [g, now]] else [g]
    g mode = "over", ((since > 1.5) and go) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    any, g
  ]
  fx : after sfx
  fx = "pop"
    hiss [0.18, 5000]
    beep [after chain * 110 + 440, 0.07]
  fx = "land"
    beep [140, 0.04]
  fx = "turn"
    zzfx preset ["blip", 1.6]
  fx = "clear"
    zzfx preset "power"
  fx = "over"
    zzfx preset "explode"
    shake 6
  (g mode = "title") and go
    zzfx preset "select"
  top : after score max (after best)
  after with [best : top, keep : [best : top]]
]

-- ================================================================ drawing
cell-spot : [p | pair [p x - 1 * 12 + 80, p y - 1 * 12 + 8]]
candy-art : [c | (sours chars has c) [sour-art] else [drop-art]]
bubbles : [now |
  range 12 each [i |
    up : now * (i % 3 * 8 + 14) + (i * 29) % 176
    circle [i * 37 % 90 + 83, 186 - up, i % 2 + 1, (i % 3 = 0) [#aaffff] else [#55aaaa]]
  ]
]
draw-jar : [g now |
  rect [76, 5, 104, 187, #aaffff]
  rect [79, 8, 98, 181, #005555]
  rect [72, 0, 112, 7, #ff5555]
  range 7 each [i | rect [i * 15 + 64, 1, 8, 5, #aa0000]]
  bubbles now
  g well numbered each [[row, line] |
    line chars numbered each [[col, c] |
      spot : cell-spot (pair [col, row])
      (c != ".") and ((g phase = "pop") and (g popping has (pair [col, row])) and (now * 12 floor % 2 = 0) not)
        sprite [candy-art c, spot x, spot y, ink-for c]
    ]
  ]
  g phase = "pop"
    g popping each [p | s : cell-spot p, sprite [star-art, s x, s y, star-ink]]
  (g mode = "play") and (g phase = "fall")
    halves (g piece) numbered each [[i, p] | s : cell-spot p, sprite [drop-art, s x, s y, ink-for (g piece colours @ i)]]
]
draw-side : [g now |
  remaining : runs count [g well, sours]
  ui panel [4x24, 68x112, #ffffff, #000000]
  text ["SCORE", 38, 36, 8, #55ffff]
  text ["[g score]", 38, 50, 8, #ffffff]
  text ["JAR", 38, 72, 8, #55ffff]
  text ["[g jar]", 38, 86, 8, #ffffff]
  text ["SOURS", 38, 108, 8, #55ffff]
  text ["[remaining]", 38, 122, 8, #ffff55]
  ui panel [184x24, 68x60, #ffffff, #000000]
  text ["NEXT", 218, 36, 8, #55ffff]
  sprite [drop-art, 205, 50, ink-for (g coming @ 1)]
  sprite [drop-art, 219, 50, ink-for (g coming @ 2)]
  ui panel [184x96, 68x40, #ffffff, #000000]
  text ["BEST", 218, 108, 8, #55ffff]
  text ["[g best]", 218, 122, 8, #ffffff]
  sprite [sour-art, 22, 150 + ((now * 3) sin * 3), red-ink, false, 2]
  sprite [sour-art, 204, 150 + ((now * 3 + 2) sin * 3), blue-ink, false, 2]
]
draw-title : [g now |
  bubbles now
  rect [40, 30, 176, 70, #000000]
  ui banner ["FIZZ", 52, 16, #ff5555]
  ui banner ["JAR", 76, 16, #55ffff]
  candy numbered each [[i, c] | sprite [sour-art, i * 40 + 48, 112 + ((now * 4 + i) sin * 4), ink-for c, false, 2]]
  ui blink ["PRESS 1", 158, #ffffff, now]
  g best > 0
    text ["BEST [g best]", 128, 178, 8, #ffff55]
]
draw : [game |
  g : game
  now : g clock
  clear #000055
  g mode = "title"
    draw-title [g, now]
  g mode != "title"
    draw-jar [g, now]
    draw-side [g, now]
    ui float [g said, cell-spot (g said-spot), #ffff55, g said-at, now]
  g mode = "clear"
    rect [56, 80, 144, 36, #000000]
    ui banner ["JAR CLEAR!", 92, 16, #ffff55]
    ui banner ["BONUS [g jar * 500]", 108, 8, #ffffff]
  g mode = "over"
    rect [52, 80, 152, 36, #000000]
    ui banner ["FIZZLED OUT", 92, 16, #ff5555]
    ui blink ["PRESS 1", 108, #ffffff, now]
]
