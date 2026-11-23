-- STARLANE 2025: surf a glowing lane into the screen, on SPROUT·256 (decision 134), the handheld 1995 dreamed of for
-- 2025. Slide between three lanes with the arrows. Button 1 boosts (orbs count double), 2 jumps over what's ahead, 3
-- spins through it, smashing mines, and 4 bombs everything on the lane (you carry three; stars bring more). Catch the
-- orbs, clear the gates, keep your shields.

-- ================================================================ the art
ink : [k : #000000, w : #ffffff, c : #38e8ff, p : #ff3fb4, y : #ffd21f, s : #ffc08a, r : #ff3344, o : #ffd21f]
surfer-art : [
  "......kkkk......"
  ".....kccwck....."
  ".....kssssk....."
  "......kssk......"
  "....kkppppkk...."
  "...kpppppppppk.."
  "..ks.kppppk.sk.."
  "......pppp......"
  "......cccc......"
  ".....kpp.ppk...."
  ".....kpp.ppk...."
  "...kkkkkkkkkk..."
  "..kcccccccccck.."
  "...kkkkkkkkkk..."
  "....y......y...."
  "....p......p...."
]
orb-art : ["..kkkk..", ".kccwck.", "kccccwck", "kcccccck", "kcccccck", "kcccccck", ".kcccck.", "..kkkk.."]
mine-art : ["...rr...", ".r.rr.r.", "..rrrr..", "rrroorrr", "rrroorrr", "..rrrr..", ".r.rr.r.", "...rr..."]
star-art : ["...yy...", "...yy...", "yyyyyyyy", ".yyyyyy.", "..yyyy..", ".yy..yy.", "yy....yy", "........"]
art-of : [kind | match [kind, ["orb", orb-art, "mine", mine-art, "star", star-art, any, orb-art]]]

-- ================================================================ the lane: three lanes running to the horizon
horizon : 96
near : 236
-- where something on a lane at depth z (1 at the horizon, 0 at your feet) is on the screen, and how big
depth-of : [z | 1 - z * (1 - z)]
spot : [lane z | p : depth-of z, pair [lane * 110 * p + 240, p * (near - horizon) + horizon]]

songs : [
  title : [
    bpm : 96, beats : 16
    lead : music track ["E5 - B4 . G5 - F#5 . | E5 - B4 . D5 - - . | C5 - G4 . E5 - D5 . | B4 - - - . . . .", 0.5]
    harmony : music track ["G4 - - - . . . . | F#4 - - - . . . . | E4 - - - . . . . | D#4 - - - . . . .", 0.5]
    bass : music track ["E2 . E3 . E2 . E3 . | D2 . D3 . D2 . D3 . | C2 . C3 . C2 . C3 . | B1 . B2 . B1 . B2 .", 0.5]
  ]
  run : [
    bpm : 138, beats : 16
    lead : music track ["A4 C5 E5 A5 E5 C5 A4 C5 | G4 B4 D5 G5 D5 B4 G4 B4 | F4 A4 C5 F5 C5 A4 F4 A4 | E4 G#4 B4 E5 B4 G#4 E5 B4", 0.5]
    harmony : music track ["A5 - - - E5 - - - | G5 - - - D5 - - - | F5 - - - C5 - - - | E5 - - - G#5 - - -", 0.5]
    bass : music track ["A2 . A2 A3 . A2 . A3 | G2 . G2 G3 . G2 . G3 | F2 . F2 F3 . F2 . F3 | E2 . E2 E3 . E2 E3 E2", 0.5]
    drums : music track ["kick hat snare hat kick kick snare hat | kick hat snare hat kick kick snare hat | kick hat snare hat kick kick snare hat | kick hat snare hat kick snare snare crash", 0.5]
  ]
  over : [
    bpm : 90, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . B4 . | A4 - - - . . . .", 0.5]
    bass : music track ["A2 . G2 . F2 . E2 . | A1 - - - . . . .", 0.5]
  ]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  sfx : ""

begin : [g now | g with [
  mode : "run", mode-at : now, song : "run", lane : 0, slide : 0, score : 0, shields : 3, bombs : 3, run : 0, things : [], next-at : 0
  boost-until : -9, jump-until : -9, spin-until : -9, ready-at : 0, said : "", said-at : -9, hit-at : -9, seed : now * 1000 floor
]]

-- a new thing far down the lane, by the run's seed and how far it has come
spawn : [g |
  s0 : g seed + (g run * 7 floor)
  what : seeded weighted [["orb", "orb", "gate", "mine", "star"], [5, 3, 3, 3, 1], s0]
  [kind : what, lane : seeded whole [-1, 1, s0 + 11], z : 1]
]

-- one thing reaching you: what it does to the run
meet : [g t now |
  jumping : now < (g jump-until)
  spinning : now < (g spin-until)
  boosting : now < (g boost-until)
  safe : cond [t kind = "orb", true, t kind = "star", true, t kind = "gate", jumping or spinning, t kind = "mine", jumping or spinning, any, true]
  cond [
    t lane != (g lane), g
    t kind = "orb", g with [score : g score + (boosting [20] else [10]), said : boosting ["+20"] else ["+10"], said-at : now, sfx : "orb"]
    t kind = "star", g with [bombs : g bombs + 1 min 5, said : "BOMB +1", said-at : now, sfx : "star"]
    safe, g with [score : g score + ((t kind = "mine") and spinning [15] else [5]), said : spinning ["SMASH"] else ["CLEAR"], said-at : now, sfx : "clear"]
    any, g with [shields : g shields - 1, hit-at : now, said : "OUCH", said-at : now, sfx : "hit"]
  ]
]

run-step : [g now dt |
  inp : g input
  move-by : (inp pressed "left" [-1] else [0]) + (inp pressed "right" [1] else [0])
  to-lane : g lane + move-by max -1 min 1
  airborne : (now < (g jump-until)) or (now < (g spin-until))
  ready : now >= (g ready-at)
  boost : (inp pressed "one") and ready
  jump : (inp pressed "two") and (airborne not)
  spin : (inp pressed "three") and ready and (airborne not)
  bomb : (inp pressed "four") and (g bombs > 0)
  boosting : boost or (now < (g boost-until))
  speed : g run * 0.00012 + 0.5 * (boosting [1.7] else [1])
  ran : g run + (speed * dt * 100)
  moved : g things collect [t | t with [z : t z - (speed * dt)]]
  arriving : moved keep [t | t z < 0.05]
  staying : bomb [[]] else [moved keep [t | t z >= 0.05]]
  spawned : (ran >= (g next-at)) [staying .. [spawn (g with [run : ran])]] else [staying]
  gap : 26 - (ran * 0.004) max 12
  g1 : g with [
    lane : to-lane, slide : to-lane - (g slide) * (dt * 14 min 1) + (g slide), run : ran, things : spawned, sfx : ""
    next-at : (ran >= (g next-at)) [ran + gap] else [g next-at]
    boost-until : boost [now + 1] else [g boost-until], jump-until : jump [now + 0.6] else [g jump-until]
    spin-until : spin [now + 0.5] else [g spin-until], ready-at : (boost or spin) [now + 1.6] else [g ready-at]
    bombs : bomb [g bombs - 1] else [g bombs], score : g score + (bomb [moved length * 5] else [0]) + (dt * speed * 20)
  ]
  g2 : bomb [g1 with [said : "BOOM", said-at : now, sfx : "bomb"]] else [cond [jump, g1 with [sfx : "jump"], spin, g1 with [sfx : "spin"], boost, g1 with [sfx : "boost"], any, g1]]
  met : bomb [g2] else [arriving fold [g2, [acc t | meet [acc, t, now]]]]
  (met shields <= 0) [met with [mode : "over", mode-at : now, song : "over", best : met score floor max (g best)]] else [met]
]

update : [game |
  g : game
  now : g clock
  dt : g dt min 0.05
  go : pad either (g input pressed)
  since : now - (g mode-at)
  after : cond [
    g mode = "title", go [begin [g, now]] else [g]
    g mode = "run", run-step [g, now, dt]
    (since > 1.5) and go, g with [mode : "title", mode-at : now, song : "title"]
    any, g
  ]
  after sfx = "orb"
    zzfx preset "coin"
  after sfx = "star"
    zzfx preset "power"
  after sfx = "clear"
    zzfx preset ["blip", 1.6]
  after sfx = "hit"
    zzfx preset "hurt"
    shake 7
  after sfx = "bomb"
    zzfx preset "explode"
    shake 10
  after sfx = "jump"
    zzfx preset "jump"
  after sfx = "spin"
    zzfx preset ["laser", 0.8]
  after sfx = "boost"
    hiss [0.4, 900]
  (g mode = "title") and go
    zzfx preset "select"
  after with [keep : [best : after best]]
]

-- ================================================================ drawing
sky : [now speed |
  retro bands [0, horizon, [#12062a, #2a0f4a, #4a1670, #7a2391, #b8389c, #ff5fa8]]
  retro sun [pair [240, horizon - 18], 44, #ffd21f, 6, #b8389c]
  range 24 each [i | rect [i * 53 % 480, i * 29 % 60 + 6, 1, 1, ((now * 3 + i) sin > 0) [#ffffff] else [#9fe8ff]]]
  retro grid-floor [horizon, #0b0420, #ff3fb4, 11, speed]
  [-165, -55, 55, 165] each [e | line [240, horizon, e * 1.243 + 240, 270, #38e8ff]]
]
thing : [t now |
  at : spot [t lane, t z]
  p : depth-of (t z)
  k : p * 3.2 + 0.3
  (t kind = "gate")
    rect [at x - (54 * p), at y - (70 * p), 8 * p + 1, 70 * p, #ff3fb4]
    rect [at x + (46 * p), at y - (70 * p), 8 * p + 1, 70 * p, #ff3fb4]
    rect [at x - (54 * p), at y - (74 * p), 108 * p, 8 * p + 1, #ffd21f]
  (t kind != "gate")
    sprite [art-of (t kind), at x - (4 * k), at y - (8 * k), ink, false, k, (t kind = "star") [0] else [now * 0.7]]
]
player : [g now |
  px : g slide * 110 + 240
  jumping : now < (g jump-until)
  spinning : now < (g spin-until)
  lift : jumping [(g jump-until - now / 0.6 * 3.14159) sin * 44] else [spinning [12] else [0]]
  rect [px - 22, near + 2, 44, 4, rgba [0, 0, 0, 0.45]]
  hurt : (now - (g hit-at)) < 0.6
  (hurt and (now * 20 floor % 2 = 0)) not
    sprite [surfer-art, px - 24, near - 46 - lift, ink, false, 3, spinning [(g spin-until - now) * 4] else [0]]
  now < (g boost-until)
    range 10 each [i | a : i * 0.628 + now, line [240 + (a cos * 30), horizon + 40 + (a sin * 20), 240 + (a cos * 260), horizon + 40 + (a sin * 160), #9fe8ff]]
]
hud : [g now |
  ui strip ["SCORE [g score floor]", "STARLANE 2025", "BEST [g best]", #ffffff, #2a0f4a]
  range (g shields) each [i | sprite [orb-art, i * 14 + 6, 18, ink, false, 1.4]]
  range (g bombs) each [i | sprite [star-art, 462 - (i * 14), 18, ink, false, 1.4]]
  ui meter [pair [180, 22], pair [120, 4], 1.6 - (g ready-at - now max 0), 1.6, #38e8ff, #2a0f4a]
  ui float [g said, pair [g slide * 110 + 240, near - 70], #ffd21f, g said-at, now]
]
draw : [game |
  g : game
  now : g clock
  clear #06030d
  sky [now, (g mode = "run") [g run * 0.05] else [now * 0.3]]
  (g mode = "run") or (g mode = "over")
    g things sort-by [t | 0 - (t z)] each [t | thing [t, now]]
    player [g, now]
    hud [g, now]
  g mode = "title"
    sprite [surfer-art, 216, 150 + ((now * 2) sin * 6), ink, false, 3, (now * 0.5) sin * 0.04]
    ui banner ["STARLANE", 40, 32, #ffffff]
    ui banner ["2025", 76, 16, #38e8ff]
    text ["1 BOOST   2 JUMP   3 SPIN   4 BOMB", 240, 226, 8, #d9c8ff]
    ui blink ["PRESS 1 TO SURF", 250, #ffd21f, now]
    g best > 0
      text ["BEST [g best]", 240, 104, 8, #ffc23a]
  g mode = "over"
    rect [120, 92, 240, 70, rgba [6, 3, 13, 0.82]]
    ui banner ["WIPEOUT", 112, 16, #ff3fb4]
    text ["SCORE [g score floor]   BEST [g best]", 240, 138, 8, #ffffff]
    ui blink ["PRESS 1", 154, #ffd21f, now]
]
