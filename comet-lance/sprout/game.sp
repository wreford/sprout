-- COMET LANCE: a vertical shooter for the SPROUT·8 console. Fly the Lance up through the comet belt: the D-pad
-- steers, either button fires (hold it down). Waves of drones, darters and spinners come in, a boss every fifth wave;
-- catch the P capsules to widen your shot. Everything is in this file: the art, the waves and the songs.

-- ================================================================ the art
ink : [k : #000000, w : #ffffff, b : #0055ff, c : #55ffff, r : #ff0000, o : #ff5500, y : #ffff00, s : #aaaaaa, d : #555555, p : #ff55aa, m : #aa00aa, g : #55ff55, n : #000055]
hot-ink : ink with [y : #ff5500, o : #ffff00]
hit-ink : ink with [m : #ffffff, p : #ffffff, o : #ffffff, r : #ffffff, s : #ffffff, d : #ffffff, b : #ffffff]

ship-art : [
  ".......kk......."
  "......kwwk......"
  "......kcck......"
  ".....kccbck....."
  ".....kcbbck....."
  "....kscbbcsk...."
  "...kssbwwbssk..."
  "..kssbbwwbbssk.."
  ".kssbbbbbbbbssk."
  "kssbkkbbbbkkbssk"
  "ksbk..kbbk..kbsk"
  "kkk...kyyk...kkk"
  "......kook......"
  ".......kk......."
]
drone-art : [
  "....kkkk...."
  "..kkmmmmkk.."
  ".kmmppppmmk."
  ".kmpwwwwpmk."
  "kmmpwkkwpmmk"
  "kmmpwkkwpmmk"
  ".kmpwwwwpmk."
  ".kmmppppmmk."
  "..kkmmmmkk.."
  "...k....k..."
  "..k......k.."
]
darter-art : [
  "kk........kk"
  "kok......kok"
  "kook....kook"
  ".kook..kook."
  ".koookkoook."
  "..kooyyook.."
  "..koyyyyok.."
  "...koyyok..."
  "...kooook..."
  "....kook...."
  ".....kk....."
]
spinner-art : [
  ".....kk....."
  "....kggk...."
  "....kggk...."
  "..kkkggkkk.."
  ".kgggwwgggk."
  "kggggwwggggk"
  ".kgggwwgggk."
  "..kkkggkkk.."
  "....kggk...."
  "....kggk...."
  ".....kk....."
]
boss-art : [
  "...kkkk..................kkkk..."
  "..kssssk................kssssk.."
  "..ksddsk....kkkkkkkk....ksddsk.."
  "..ksddskkkkkssssssssskkkksddsk.."
  "..kssssssssssddddddssssssssssk.."
  ".kssddddddddddmmmmddddddddddssk."
  "kssdddmmmmmmmmppppmmmmmmmmdddssk"
  "ksddmmmppppppppwwppppppppmmmddsk"
  "ksddmmppwwwwwppkkppwwwwwppmmddsk"
  "ksddmmppwkkkwppkkppwkkkwppmmddsk"
  "ksddmmppwwwwwppppppwwwwwppmmddsk"
  "kssddmmmppppppppppppppppmmmddssk"
  ".kssdddmmmmmmmmmmmmmmmmmmdddssk."
  "..kssdddddrrrrrrrrrrrrdddddssk.."
  "...ksssdddrrooooooooorrdddsssk.."
  "....kkssssdrrooyyyyoorrdssssk..."
  "......kkkssdrrooyyoorrdsskkk...."
  "........kkkssdrroorrdssskk......"
  "...........kkssrrrrsskk........."
  ".............kksrrskk..........."
  "...............kkkk............."
]

-- ================================================================ the songs
songs : [
  title : [
    bpm : 126, beats : 16
    lead : music track ["E5 . B4 . E5 . G5 . | F#5 . D5 . B4 - - . | C5 . E5 . A5 . G5 . | F#5 - - . B4 - - .", 0.5]
    bass : music track ["E2 . E3 . E2 . E3 . | B1 . B2 . B1 . B2 . | A1 . A2 . A1 . A2 . | B1 . B2 . B1 . B2 .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick kick hat . snare . snare snare", 0.5]
  ]
  stage : [
    bpm : 160, beats : 32
    lead : music track ["E5 E5 . E5 G5 . E5 . | D5 D5 . D5 F#5 . D5 . | C5 C5 . C5 E5 . G5 . | B4 - - . . . . . | E5 E5 . E5 G5 . B5 . | A5 . G5 . F#5 . E5 . | D5 . E5 . F#5 . G5 . | F#5 - - . B4 - - .", 0.5]
    bass : music track ["E2 . E3 . E2 . E3 . | D2 . D3 . D2 . D3 . | C2 . C3 . C2 . C3 . | B1 . B2 . B1 . B2 . | E2 . E3 . E2 . E3 . | A1 . A2 . A1 . A2 . | B1 . B2 . B1 . B2 . | B1 . B2 . D2 . D#2 .", 0.5]
    drums : music track ["kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick kick snare snare | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick kick snare kick snare snare crash .", 0.5]
  ]
  boss : [
    bpm : 168, beats : 16
    lead : music track ["B4 . C5 . B4 . A#4 . | B4 . E5 . D#5 - - . | B4 . C5 . B4 . A#4 . | B4 . F#5 . E5 - - .", 0.5]
    bass : music track ["E2 E2 E3 E2 E2 E2 E3 E2 | E2 E2 E3 E2 D#2 D#2 D#3 D#2 | E2 E2 E3 E2 E2 E2 E3 E2 | C2 C2 C3 C2 B1 B1 B2 B1", 0.5]
    drums : music track ["kick . snare kick kick . snare . | kick . snare kick kick . snare snare | kick . snare kick kick . snare . | kick kick snare kick snare snare crash .", 0.5]
  ]
  over : [
    bpm : 96, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . B4 . | E4 - - - . . . .", 0.5]
    bass : music track ["E3 . D3 . C3 . B2 . | E2 - - - . . . .", 0.5]
  ]
]

-- ================================================================ waves
-- wave n: how many come, of which kind, entering in a staggered line from the top; every fifth wave, the boss
spawn-wave : [n now |
  (waves boss [n, 5]) [[[kind : "boss", at : 112x-30, home : 112x-30, hp : 30 + (n * 4), born : now, flash : 0, fired : now]]] else [
    count : waves size [n, 4, 1.15] min 12
    sort-of : ["drone", "darter", "spinner"] @ (n - 1 % 3 + 1)
    range count collect [k |
      x : k / (count + 1) * 224 + 16
      [kind : sort-of, at : pair [x, -14 - (k % 3 * 14)], home : pair [x, -14 - (k % 3 * 14)], hp : (sort-of = "spinner") [3] else [waves toughness n round], born : now, flash : 0, fired : now + (k * 0.3)]
    ]
  ]
]
foe-size : [f | (f kind = "boss") [32x21] else [12x11]]

-- one foe for one frame
fly : [f ship-x now dt |
  age : now - (f born)
  (f kind = "drone") [f with [at : pair [f home x + ((age * 2 + (f home x / 40)) sin * 30), f at y + (38 * dt)]]] else [
    (f kind = "darter") [f with [at : pair [f at x + ((ship-x - (f at x)) sign * 34 * dt), f at y + (72 * dt)]]] else [
      (f kind = "spinner") [mid : pair [f home x, f home y + (age * 26)], turn : age * 3 + (f home x / 30), f with [at : mid + (pair [turn cos * 22, turn sin * 22])]] else [
        f with [at : pair [112 + ((now * 0.8) sin * 88), f at y + (40 * dt) min 22]]
      ]
    ]
  ]
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

new-game : [g now |
  g with [
    mode : "play", mode-at : now, score : 0, lives : 3, ship : [at : 120x160, hurt-until : now + 2, cool : 0], shots : [], foes : [], bolts : []
    caps : [], power : 1, wave : 0, wave-at : now + 1, puffs : [], song : "stage"
  ]
]

play : [g fire up down to-left to-right dt now |
  s : g ship
  steer : pair [(to-right [1] else [0]) - (to-left [1] else [0]), (down [1] else [0]) - (up [1] else [0])]
  moved : s at + (steer * 110 * dt)
  spot : pair [moved x max 0 min 240, moved y max 16 min 176]
  -- firing: a stream while a button is held, wider with each P caught
  shooting : fire and (s cool <= 0)
  noses : (g power = 1) [[0]] else [(g power = 2) [[-4, 4]] else [[-6, 0, 6]]]
  fresh : shooting [noses collect [dx | [at : spot + (pair [6 + dx, -4]), drift : dx * 6]]] else [[]]
  shots : g shots .. fresh collect [b | b with [at : b at + (pair [b drift * dt, -260 * dt])]] keep [b | b at y > -8]
  -- foes and the boss
  flown : g foes collect [f | fly [f, spot x, now, dt]] keep [f | f at y < 200]
  struck : flown collect [f | box : [at : f at, size : foe-size f], hits : shots count [b | collide boxes [[at : b at, size : 3x6], box]], [f, hits]]
  hurt-foes : struck collect [[f, hits] | f with [hp : f hp - hits, flash : (hits > 0) [now] else [f flash]]]
  downed : hurt-foes keep [f | f hp <= 0]
  living : hurt-foes keep [f | f hp > 0]
  shots-left : shots keep [b | flown count [f | collide boxes [[at : b at, size : 3x6], [at : f at, size : foe-size f]]] = 0]
  -- foes fire: drones and the boss, aimed at the Lance
  firing : living keep [f | ((f kind = "drone") or (f kind = "boss")) and (now - (f fired) > ((f kind = "boss") [1.1] else [2.2])) and (f at y > 0)]
  new-bolts : firing collect-flat [f |
    from : f at + ((f kind = "boss") [16x18] else [6x10])
    (f kind = "boss") [vec fan [vec aim [from, spot + 8x8, 80], 3, 0.7] collect [v | [at : from, speed : v]]] else [[[at : from, speed : vec aim [from, spot + 8x8, 70]]]]
  ]
  fired-foes : living collect [f | (firing has f) [f with [fired : now]] else [f]]
  bolts : g bolts .. new-bolts collect [b | b with [at : b at + (b speed * dt)]] keep [b | (b at y < 200) and (b at y > -10) and (b at x > -10) and (b at x < 266)]
  -- capsules: some foes leave a P behind
  dropped : downed keep [f | seeded chance [0.12, now * 1000 floor + (f at x floor)]] collect [f | f at]
  caps : g caps .. dropped collect [c | c + (pair [0, 40 * dt])] keep [c | c y < 200]
  ship-box : [at : spot + 5x5, size : 6x6]
  caught : caps count [c | collide boxes [[at : spot, size : 16x14], [at : c, size : 10x10]]]
  safe : now < (s hurt-until)
  hit : (safe not) and ((bolts count [b | collide boxes [ship-box, [at : b at - 2, size : 4x4]]] > 0) or (fired-foes count [f | collide boxes [ship-box, [at : f at, size : foe-size f]]] > 0))
  lives-left : hit [g lives - 1] else [g lives]
  -- the next wave comes once the screen is clear
  clear-now : (fired-foes length = 0) and (now > (g wave-at))
  next-wave : g wave + 1
  foes-next : clear-now [spawn-wave [next-wave, now]] else [fired-foes]
  points : downed collect [f | (f kind = "boss") [5000] else [(f kind = "spinner") [150] else [100]]] sum
  booms : downed collect-flat [f | particles burst [f at + 6x5, (f kind = "boss") [30] else [10], (f kind = "boss") [120] else [70], 0.6, [#ffff00, #ff5500, #ffffff], now, now * 997 floor + (f at x floor)]]
  burn : hit [particles burst [spot + 8x8, 20, 90, 0.8, [#55ffff, #ffffff, #0055ff], now, now * 991 floor]] else [[]]
  boss-now : foes-next count [f | f kind = "boss"] > 0
  shooting
    zzfx preset ["laser", 1.6]
  downed length > 0
    zzfx preset "explode"
  (struck count [[f, h] | h > 0] > 0) and (downed length = 0)
    zzfx preset ["hit", 1.5]
  caught > 0
    zzfx preset "power"
  hit
    zzfx preset "hurt"
    shake 6
  g with [
    ship : [at : spot, hurt-until : hit [now + 2] else [s hurt-until], cool : shooting [0.11] else [s cool - dt]]
    shots : shots-left, foes : foes-next, bolts : hit [[]] else [bolts], caps : caps keep [c | collide boxes [[at : spot, size : 16x14], [at : c, size : 10x10]] not]
    power : hit [1] else [g power + caught min 3], lives : lives-left, score : g score + points, wave : clear-now [next-wave] else [g wave]
    wave-at : clear-now [now + 1.5] else [g wave-at], puffs : particles step [g puffs .. booms .. burn, 0, dt, now]
    mode : (lives-left <= 0) ["over"] else ["play"], mode-at : (lives-left <= 0) [now] else [g mode-at]
    song : (lives-left <= 0) ["over"] else [boss-now ["boss"] else ["stage"]]
  ]
]

update : [game |
  g : game
  inp : g input
  b1 : inp held "one" else false
  b2 : inp held "two" else false
  pressed : (b1 and ((g prev one) not)) or (b2 and ((g prev two) not))
  now : g clock
  since : now - (g mode-at)
  after : (g mode = "play") [play [g, b1 or b2, inp held "up" else false, inp held "down" else false, inp held "left" else false, inp held "right" else false, g dt, now]] else [
    (g mode = "title") [pressed [new-game [g, now]] else [g]] else [
      ((since > 2) and pressed) or (since > 10) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    ]
  ]
  (g mode = "title") and pressed
    zzfx preset "select"
  top : after score max (after best)
  after with [prev : [one : b1, two : b2], best : top, keep : [best : top]]
]

-- ================================================================ drawing
stars : [now |
  range 48 each [i |
    speed : i % 3 + 1 * 18
    y : seeded number i * 192 + (now * speed) % 192
    rect [seeded number (i + 100) * 256, y, i % 3 = 2 [2] else [1], 1, (i % 3 = 2) [#ffffff] else [(i % 3 = 1) [#aaaaaa] else [#555555]]]
  ]
]
banner : [line y size colour | text [line, 129, y + 1, size, #000000], text [line, 128, y, size, colour]]
draw-play : [g |
  now : g clock
  g caps each [c | circle [c x + 5, c y + 5, 5, #00aa00], text ["P", c x + 5, c y + 5, 8, #ffffff]]
  g foes each [f |
    art : (f kind = "drone") [drone-art] else [(f kind = "darter") [darter-art] else [(f kind = "spinner") [spinner-art] else [boss-art]]]
    sprite [art, f at x, f at y, (now - (f flash) < 0.06) [hit-ink] else [ink], false]
  ]
  g foes keep [f | f kind = "boss"] each [f | rect [64, 14, f hp * 4 min 128, 3, #ff0000]]
  g shots each [b | rect [b at x, b at y, 2, 6, #ffff55]]
  g bolts each [b | circle [b at x, b at y, 2, #ff55aa]]
  s : g ship
  blink : (now < (s hurt-until)) and (now * 14 floor % 2 = 0)
  (blink not) and (g mode = "play")
    sprite [ship-art, s at x, s at y, (now * 20 floor % 2 = 0) [ink] else [hot-ink], false]
  g puffs each [q | circle [q at x, q at y, particles fade [q, now] * 3 + 0.5, q colour]]
  rect [0, 0, 256, 11, #000000]
  text ["SC [g score]", 4, 6, 8, #ffffff, "left"]
  text ["WAVE [g wave]", 128, 6, 8, #55ffff]
  text ["x[g lives]", 252, 6, 8, #55ff55, "right"]
]
draw : [game |
  g : game
  now : g clock
  clear #000022
  stars now
  g mode = "title"
    banner ["COMET", 52, 32, #ffff55]
    banner ["LANCE", 88, 32, #55ffff]
    (now * 2 floor % 2 = 0)
      banner ["PRESS 1 OR 2", 130, 8, #ffffff]
    best-text : g best str pad-left [6, "0"]
    banner ["BEST [best-text]", 148, 8, #ff55aa]
    sprite [ship-art, 120, 166 + ((now * 3) sin * 3), ink, false]
  g mode != "title"
    draw-play g
  g mode = "over"
    banner ["GAME OVER", 86, 16, #ff5555]
    banner ["SCORE [g score]", 108, 8, #ffffff]
]
