-- LILY AND CHESTER: a week at the stable, small and 8-bit. Lily looks after Chester, her chestnut horse with the white
-- blaze: hay, an apple, water, a good brush, a mucked-out stall and a ride down the lane, then bed. His needs fade as the
-- day goes by. Keep him fed, watered, clean, happy and rested, and ride him to build his skill, for the county show on
-- the seventh day. The arrows choose and 1 does it. Brushing: rub with the arrows. Riding: 1 jumps.

-- ================================================================ the art
horse-ink : [k : #000000, c : #aa5500, d : #550000, w : #ffffff, h : #555555, p : #ffaaaa]
lily-ink : [k : #000000, b : #0000aa, y : #ffaa00, s : #ffaa55, p : #ff55aa, j : #ffffaa, d : #550000]
chester-art : [
  "..................k.k..."
  ".................kpkpk.."
  "................kddccck."
  "...............kddckccck"
  "..............kddcccwcck"
  ".............kddccccwwck"
  "....k.......kddccck.kwck"
  "...kdk.....kddccck..kppk"
  "..kddk....kddcccck...kk."
  "..kdk.kkkkkccccccck....."
  "..kdkkccccccccccccck...."
  "..kdkccccccccccccccck..."
  "...kkccccccccccccccck..."
  "....kcccccccccccccck...."
  ".....kcck.kk...kcck....."
  ".....kcck......kcck....."
  ".....kwwk......kwwk....."
  ".....khhk......khhk....."
]
chester-sad-art : [
  "........................"
  "........................"
  "........................"
  "................kk.kk..."
  "...............kddcdck.."
  "..............kddccccck."
  "....k........kddcckccck."
  "...kdk......kddccccwcck."
  "..kddk.....kddcccccwwck."
  "..kdk.kkkkkccccccck.kwck"
  "..kdkkcccccccccccck.kppk"
  "..kdkccccccccccccccck.kk"
  "...kkccccccccccccccck..."
  "....kcccccccccccccck...."
  ".....kcck.kk...kcck....."
  ".....kcck......kcck....."
  ".....kwwk......kwwk....."
  ".....khhk......khhk....."
]
chester-run-art : [
  "..................k.k..."
  ".................kpkpk.."
  "................kddccck."
  "...............kddckccck"
  "..............kddcccwcck"
  "..kk.........kddccccwwck"
  ".kddk.......kddccck.kwck"
  "kddddk.....kddccck..kppk"
  "kdkkdk....kddcccck...kk."
  ".k..kkkkkkccccccck......"
  "....kccccccccccccck....."
  "....kcccccccccccccck...."
  "....kcccccccccccccck...."
  "...kcckccccccccckcck...."
  "..kcck..kk...kk..kcck..."
  ".kcck.............kcck.."
  "kwwk...............kwwk."
  "khhk...............khhk."
]
face-art : [
  "...k........k..."
  "..kpk......kpk.."
  "..kcck....kcck.."
  "...kcckkkkcck..."
  "...kddddddddk..."
  "..kccdddddccck.."
  "..kckkccwwkkck.."
  "..kckkccwwkkck.."
  "..kcccccwwccck.."
  "...kcccwwwwck..."
  "...kccwwwwwck..."
  "....kcwwwwck...."
  "....kppppppk...."
  "....kpkppkpk...."
  ".....kppppk....."
  "......kkkk......"
]
lily-art : [
  "......kkkk......"
  ".....kbbbbk....."
  "....kbbbbbbk...."
  "....kbbbbbbbk..."
  "....kyysssk....."
  "...kyysskssk...."
  "...kyyssssk....."
  "..kyyk.kssk....."
  "..kyk.kppppk...."
  "..kyk.kpppppk..."
  "...kk.kppppsk..."
  "......kppppk...."
  "......kjjjjk...."
  "......kjjjjk...."
  "......kjkkjk...."
  "......kjk.kjk..."
  ".....kddk.kddk.."
  ".....kkkk.kkkk.."
]

-- ================================================================ the week
-- how much each need drops in an hour of the day, and overnight
hourly : [food : 9, water : 11, clean : 6, happy : 5, rest : 6]
overnight : [food : 16, water : 16, clean : 8, happy : 4]
deeds : ["HAY", "AN APPLE", "WATER", "BRUSH", "MUCK OUT", "RIDE", "SLEEP"]
deed-words : ["MUNCH, MUNCH. SWEET HAY.", "CRUNCH! HIS FAVOURITE.", "SLURP, SLURP. AHH.", "", "FRESH STRAW. LOVELY!", "", ""]
hours : ["MORNING", "MORNING", "NOON", "AFTERNOON", "EVENING", "NIGHT"]
skies : [#55aaff, #55aaff, #55ffff, #aaaaff, #ffaa55, #000055]
need-names : ["food", "water", "clean", "happy", "rest"]
need-colours : [#ffaa00, #55aaff, #ffffff, #ff55aa, #55ff55]
ribbons : ["A PAT ON THE NECK", "YELLOW RIBBON", "RED RIBBON", "BLUE RIBBON", "BEST IN SHOW!"]
ribbon-colours : [#55aa55, #ffff55, #ff5555, #5555ff, #ffaa00]
first-day : [food : 70, water : 65, clean : 60, happy : 70, rest : 90]

songs : [
  title : [
    bpm : 100, beats : 16
    lead : music track ["G4 . B4 . D5 . B4 . | C5 . E5 . D5 - - . | B4 . D5 . A4 . F#4 . | G4 - - . . . . .", 0.5]
    bass : music track ["G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 - - .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat .", 0.5]
  ]
  stable : [
    bpm : 92, beats : 32
    lead : music track ["D5 . B4 . G4 . B4 . | C5 . A4 . F#4 . A4 . | B4 . G4 . E4 . G4 . | A4 - - . . . . . | D5 . B4 . G4 . B4 . | E5 . C5 . A4 . C5 . | D5 . C5 . B4 . A4 . | G4 - - . . . . .", 0.5]
    bass : music track ["G2 . . . D3 . . . | D2 . . . A2 . . . | E2 . . . B2 . . . | D2 . . . A2 . . . | G2 . . . D3 . . . | C3 . . . G2 . . . | D2 . . . D3 . . . | G2 . . . G2 . . .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat .", 0.5]
  ]
  ride : [
    bpm : 150, beats : 16
    lead : music track ["G5 . G5 E5 D5 . B4 . | C5 . C5 A4 G4 . E4 . | D5 . D5 B4 A4 . F#4 . | G4 . B4 . D5 . G5 .", 0.5]
    bass : music track ["G2 G2 D3 . G2 G2 D3 . | C3 C3 G2 . C3 C3 G2 . | D3 D3 A2 . D3 D3 A2 . | G2 G2 D3 . G2 . . .", 0.5]
    drums : music track ["kick . kick kick snare . kick kick | kick . kick kick snare . kick kick | kick . kick kick snare . kick kick | kick . kick kick snare snare crash .", 0.5]
  ]
  night : [
    bpm : 70, beats : 8, once : true
    lead : music track ["B4 . G4 . D4 . G4 . | A4 . F#4 . G4 - - .", 0.5]
    bass : music track ["G2 - - - D2 - - - | G2 - - - . . . .", 0.5]
  ]
  show : [
    bpm : 120, beats : 8, once : true
    lead : music track ["G4 . B4 . D5 . G5 . | D5 . G5 - - . . .", 0.5]
    bass : music track ["G2 . D3 . G2 . D3 . | G2 . . . G2 . . .", 0.5]
    drums : music track ["kick . snare . kick . snare . | kick kick snare . crash . . .", 0.5]
  ]
]

-- ================================================================ a day at the stable
start :
  mode : "title"
  mode-at : 0
  song : "title"
  best : saved best else 0
  keep : [best : saved best else 0]
  cursor : 1
  day : 1
  part : 0
  levels : first-day
  skill : 0
  care-sum : 0
  said : ""
  said-at : -9
  rubs : 0
  ride : [dist : 0, hy : 0, vy : 0, shoes : 0, bumps : 0, hit : [], got : []]

new-week : [g now | g with [mode : "stable", mode-at : now, song : "stable", day : 1, part : 0, levels : first-day, skill : 0, care-sum : 0, cursor : 1, said : "GOOD MORNING, CHESTER!", said-at : now]]
-- an hour goes by: every need fades a little
hour : [g | faded : needs fade [g levels, hourly, 1], later : g part + 1, g with [levels : faded, part : later]]
deed : [g k now |
  h : hour g
  lv : h levels
  fed : cond [
    k = 1, needs fill [needs fill [lv, "food", 35], "happy", 3]
    k = 2, needs fill [needs fill [lv, "food", 12], "happy", 16]
    k = 3, needs fill [lv, "water", 50]
    any, needs fill [needs fill [lv, "clean", 40], "happy", 4]
  ]
  h with [levels : fed, said : deed-words @ k, said-at : now]
]
saddle-up : [g now | g with [mode : "ride", mode-at : now, song : "ride", ride : [dist : 0, hy : 0, vy : 0, shoes : 0, bumps : 0, hit : [], got : []]]]
sleep : [g now |
  today : needs care (g levels)
  rested : needs fill [needs fade [g levels, overnight, 1], "rest", 70]
  total : g care-sum + today
  tomorrow : g day + 1
  g with [mode : "night", mode-at : now, song : "night", day : tomorrow, part : 0, levels : rested, care-sum : total, cursor : 1, said : "", said-at : -9]
]
choose : [g now |
  k : g cursor
  cond [
    (g part >= 5) and (k != 7), g with [said : "IT'S LATE. BEDTIME!", said-at : now]
    k = 4, g with [mode : "brush", mode-at : now, rubs : 0]
    (k = 6) and ((g levels rest) < 25), g with [said : "CHESTER IS TOO TIRED.", said-at : now]
    k = 6, saddle-up [g, now]
    k = 7, sleep [g, now]
    any, deed [g, k, now]
  ]
]
stable-step : [g inp now |
  arrow : pad way (inp pressed)
  stepped : menu grid [g cursor, 2, 7, arrow]
  -- down from RIDE, where the grid has no square below, goes to SLEEP
  moved : g with [cursor : ((stepped = (g cursor)) and (arrow y > 0)) [7] else [stepped]]
  (inp pressed "one") [choose [moved, now]] else [moved]
]
brushed : [g now |
  h : hour g
  n : g rubs
  shiny : needs fill [needs fill [h levels, "clean", n * 3 min 45], "happy", n min 12]
  h with [mode : "stable", mode-at : now, levels : shiny, said : (n >= 12) ["WHAT A SHINE!"] else ["A QUICK BRUSH."], said-at : now]
]
brush-step : [g inp now |
  rubbed : (inp pressed "left") or (inp pressed "right") or (inp pressed "up") or (inp pressed "down")
  more : g with [rubs : g rubs + (rubbed [1] else [0])]
  (now - (g mode-at) > 4) [brushed [more, now]] else [more]
]
wake : [g now | (g day >= 7) [g with [mode : "show", mode-at : now, song : "show"]] else [g with [mode : "stable", mode-at : now, song : "stable", said : "GOOD MORNING, CHESTER!", said-at : now]]]

-- ================================================================ a ride down the lane
-- ten jumps a ride, a different lane each day; a horseshoe over every jump and one after it
course-for : [day-number | range 10 collect [i |
  sort-of : seeded pick [["FENCE", "FENCE", "LOG", "PUDDLE"], day-number * 17 + (i * 5)]
  spot : i * 130 + 320 + (seeded whole [0, 40, day-number * 31 + i])
  [at : spot, kind : sort-of, wide : cond [sort-of = "PUDDLE", 26, sort-of = "LOG", 20, any, 14], tall : cond [sort-of = "FENCE", 14, sort-of = "LOG", 10, any, 6]]
]]
shoes-for : [lane | lane collect [o | [at : o at + 4, high : true]] .. (lane collect [o | [at : o at + 64, high : false]])]
ride-end : 1640
rode : [g now |
  r : g ride
  h : hour g
  glad : needs fill [needs fill [needs fill [h levels, "happy", r shoes * 2 - (r bumps * 4)], "rest", -30], "clean", -12]
  better : g skill + (r shoes) min 100
  h with [mode : "rode", mode-at : now, song : "stable", levels : glad, skill : better]
]
ride-step : [g inp now dt |
  r : g ride
  lane : course-for (g day)
  jumped : (inp pressed "one") and (r hy <= 0)
  vy0 : jumped [260] else [r vy]
  aloft : (r hy > 0) or jumped
  vy1 : aloft [vy0 - (760 * dt)] else [0]
  hy1 : r hy + (vy1 * dt) max 0
  far : r dist + (112 * dt)
  bumped : lane numbered keep [[i, o] | sx : o at - far, ((r hit has i) not) and (sx < 80) and (sx + (o wide) > 56) and (hy1 < (o tall))] collect [[i, o] | i]
  grabbed : shoes-for lane numbered keep [[i, s] | sx : s at - far, sy : (s high) [110] else [156], ((r got has i) not) and (sx > 44) and (sx < 88) and (sy > (132 - hy1)) and (sy < (168 - hy1))] collect [[i, s] | i]
  vy-now : (hy1 <= 0) [0] else [vy1]
  shoe-count : r shoes + (grabbed length)
  bump-count : r bumps + (bumped length)
  hit-list : r hit .. bumped
  got-list : r got .. grabbed
  r1 : [dist : far, hy : hy1, vy : vy-now, shoes : shoe-count, bumps : bump-count, hit : hit-list, got : got-list]
  told : (bumped length > 0) [g with [said : "WHOA THERE!", said-at : now]] else [g]
  (far >= ride-end) [rode [told with [ride : r1], now]] else [told with [ride : r1]]
]

-- ================================================================ the county show
show-score : [g | g care-sum / 6 * 0.6 + (g skill * 0.4) round]
place-of : [score | cond [score >= 85, 4, score >= 70, 3, score >= 55, 2, score >= 40, 1, any, 0]]
finish : [g now | top : g best max (place-of (show-score g) + 1), g with [mode : "title", mode-at : now, song : "title", best : top]]

update : [game |
  g : game
  inp : g input
  now : g clock
  dt : g dt min 0.05
  since : now - (g mode-at)
  m : g mode
  any-button : pad either (inp pressed)
  after : cond [
    m = "title", any-button [new-week [g, now]] else [g]
    m = "stable", stable-step [g, inp, now]
    m = "brush", brush-step [g, inp, now]
    m = "ride", ride-step [g, inp, now, dt]
    m = "rode", ((since > 1.2) and any-button) [g with [mode : "stable", mode-at : now, said : "GOOD BOY, CHESTER.", said-at : now]] else [g]
    m = "night", (since > 2.5) [wake [g, now]] else [g]
    m = "show", ((since > 3.5) and any-button) [finish [g, now]] else [g]
    any, g
  ]
  (m = "title") and any-button
    zzfx preset "select"
  (m = "stable") and ((after cursor) != (g cursor))
    zzfx preset ["blip", 1.5]
  (m = "stable") and (inp pressed "one")
    zzfx preset "select"
  (m = "brush") and ((after rubs) > (g rubs))
    hiss [0.06, 3500]
  (m = "ride") and (inp pressed "one") and ((g ride hy) <= 0)
    zzfx preset "jump"
  (m = "ride") and ((after ride shoes) > (g ride shoes))
    zzfx preset "coin"
  (m = "ride") and ((after ride bumps) > (g ride bumps))
    zzfx preset "hit"
    shake 3
  (m = "ride") and (every [0.25, now, dt])
    beep [196, 0.02]
  (m = "show") and (since >= 2) and (since - dt < 2)
    zzfx preset "power"
  after with [keep : [best : after best]]
]

-- ================================================================ drawing
calm : [g | (needs care (g levels) >= 45) and ((needs mood (g levels) ends-with "?") not)]
draw-chester : [g x y scale | sprite [(calm g) [chester-art] else [chester-sad-art], x, y, horse-ink, false, scale]]
draw-title : [g |
  now : g clock
  clear #55aaff
  rect [0, 120, 256, 72, #55aa55]
  range 9 each [i | rect [i * 32, 128, 4, 30, #ffffff]]
  rect [0, 134, 256, 3, #ffffff]
  rect [0, 146, 256, 3, #ffffff]
  ui banner ["LILY", 26, 16, #ff55aa]
  ui banner ["AND CHESTER", 50, 16, #ffffff]
  sprite [chester-art, 104, 82 + ((now * 3) sin * 2), horse-ink, false, 3]
  sprite [lily-art, 52, 102, lily-ink, false, 3]
  ui blink ["PRESS 1", 176, #ffffff, now]
  g best > 0
    text ["BEST: [ribbons @ (g best)]", 128, 70, 8, ribbon-colours @ (g best)]
]
draw-stable : [g |
  now : g clock
  hour-now : g part + 1 min 6
  rect [0, 12, 256, 88, skies @ hour-now]
  circle [g part * 40 + 20, 32, 8, (g part >= 5) [#ffffaa] else [#ffff55]]
  rect [0, 60, 256, 40, #55aa55]
  rect [96, 38, 160, 62, #aa5500]
  range 10 each [i | rect [i * 16 + 96, 38, 1, 62, #550000]]
  rect [90, 30, 166, 9, #aa0000]
  rect [228, 76, 28, 22, #ffff55]
  rect [228, 84, 28, 2, #aaaa00]
  rect [198, 86, 28, 12, #555555]
  (g levels water) > 30
    rect [200, 87, 24, 3, #55aaff]
  rect [0, 98, 256, 2, #550000]
  draw-chester [g, 146, 62 + ((now * 2) sin), 2]
  sprite [lily-art, 100, 62, lily-ink, false, 2]
  mood : needs mood (g levels)
  ui panel [142x16, 84x20, #ffffff, #ffffff]
  rect [180, 36, 6, 4, #ffffff]
  rect [182, 40, 2, 3, #ffffff]
  sprite [face-art, 144, 18, horse-ink, false, 1]
  text [mood, 192, 26, 8, (mood ends-with "?") [#ff0000] else [#000000]]
  ui strip ["DAY [g day]", hours @ hour-now, "SKILL [g skill]", #000000, #ffaaaa]
  rect [0, 100, 256, 92, #550000]
  (now - (g said-at) < 3)
    text [g said, 128, 108, 8, #ffff55]
  deeds numbered each [[i, word] |
    lit : i = (g cursor)
    x : i - 1 % 2 * 74 + 14
    y : i - 1 / 2 floor * 16 + 124
    lit
      text [">", x - 8, y, 8, #ffff55]
    text [word, x, y, 8, lit [#ffff55] else [#ffaaaa], "left"]
  ]
  need-names numbered each [[i, name] |
    y : i - 1 * 14 + 122
    text [name upper, 162, y, 8, #ffffff, "left"]
    ui meter [pair [206, y - 3], 44x6, g levels get-in [name], 100, need-colours @ i, #000000]
  ]
  g mode = "brush"
    ui panel [40x40, 176x46, #ffffff, #000055]
    ui banner ["RUB RUB RUB!", 52, 8, #ffff55]
    text ["ARROWS TO BRUSH  [g rubs]", 128, 70, 8, #ffffff]
    range (g rubs min 14) each [k | rect [seeded whole [0, 40, k * 7] + 154, seeded whole [0, 22, k * 3] + 68, 2, 2, #ffffff]]
]
draw-ride : [g |
  r : g ride
  now : g clock
  lane : course-for (g day)
  clear #55aaff
  range 5 each [i | circle [i * 80 - (r dist * 0.2 % 80) + 20, 134, 44, #55aa55]]
  range 6 each [i | tx : i * 56 - (r dist * 0.5 % 56), rect [tx + 6, 104, 4, 28, #550000], circle [tx + 8, 100, 11, #00aa00]]
  rect [0, 132, 256, 60, #55aa55]
  rect [0, 164, 256, 10, #aa5500]
  lane numbered each [[i, o] |
    sx : o at - (r dist)
    (sx > -30) and (sx < 260) and (o kind = "FENCE")
      rect [sx, 152, 3, 16, #ffffff]
      rect [sx + 11, 152, 3, 16, #ffffff]
      rect [sx, 154, 14, 2, #ff0000]
      rect [sx, 160, 14, 2, #ff0000]
    (sx > -30) and (sx < 260) and (o kind = "LOG")
      rect [sx, 158, 20, 10, #aa5500]
      circle [sx + 19, 163, 5, #ffaa55]
    (sx > -30) and (sx < 260) and (o kind = "PUDDLE")
      rect [sx, 166, 26, 4, #55aaff]
  ]
  shoes-for lane numbered each [[i, s] |
    sx : s at - (r dist)
    sy : (s high) [110] else [156]
    ((r got has i) not) and (sx > -10) and (sx < 260)
      rect [sx - 4, sy - 4, 2, 8, #aaaaaa]
      rect [sx + 2, sy - 4, 2, 8, #aaaaaa]
      rect [sx - 4, sy + 2, 8, 2, #aaaaaa]
  ]
  sprite [(now * 8 floor % 2 = 0) [chester-run-art] else [chester-art], 40, 132 - (r hy), horse-ink, false, 2]
  sprite [lily-art, 56, 128 - (r hy), lily-ink, false, 1]
  ui strip ["SHOES [r shoes]", "DAY [g day] RIDE", "BUMPS [r bumps]", #000000, #ffff55]
  ui meter [pair [60, 16], 136x4, r dist, ride-end, #ff55aa, #555555]
  (now - (g said-at) < 1)
    ui float [g said, 64x100, #ffffff, g said-at, now]
  g mode = "rode"
    ui panel [32x50, 192x70, #ffffff, #ff55aa]
    ui banner ["WHAT A RIDE!", 66, 8, #ffffff]
    text ["[r shoes] HORSESHOES", 128, 84, 8, #ffff55]
    text ["SKILL +[r shoes]", 128, 98, 8, #ffffff]
    ui blink ["PRESS 1", 112, #ffffff, now]
]
draw-night : [g |
  now : g clock
  clear #000055
  range 30 each [i | rect [seeded whole [0, 255, i * 3], seeded whole [12, 110, i * 5], 1, 1, #ffffff]]
  circle [200, 40, 12, #ffffaa]
  circle [206, 36, 11, #000055]
  rect [0, 130, 256, 62, #000000]
  sprite [chester-sad-art, 104, 96, horse-ink, false, 2]
  text ["Z", 160 + ((now * 2) sin * 3), 90 - (now * 6 % 20), 8, #ffffff]
  ui banner ["SWEET DREAMS, CHESTER", 150, 8, #ffffff]
  text [((g day) >= 7) ["TOMORROW IS THE SHOW!"] else ["DAY [g day - 1] IS DONE"], 128, 170, 8, #aaaaff]
]
draw-show : [g |
  now : g clock
  since : now - (g mode-at)
  score : show-score g
  place : place-of score
  clear #55aaff
  range 32 each [i | rect [i * 8, 30 + ((now * 6 + i) sin > 0.7 [-2] else [0]), 6, 10, [#ff5555, #5555ff, #ffff55, #ffffff] @ (i % 4 + 1)]]
  rect [0, 44, 256, 148, #ffaa55]
  rect [0, 60, 256, 3, #ffffff]
  ui banner ["THE COUNTY SHOW", 18, 8, #ffffff]
  sprite [chester-art, (since * 50 min 104), 96, horse-ink, false, 2]
  sprite [lily-art, (since * 50 min 104) - 36, 96, lily-ink, false, 2]
  since > 2
    circle [128, 152, 12, ribbon-colours @ (place + 1)]
    rect [120, 162, 6, 18, ribbon-colours @ (place + 1)]
    rect [130, 162, 6, 18, ribbon-colours @ (place + 1)]
    ui banner [ribbons @ (place + 1), 76, 8, ribbon-colours @ (place + 1)]
    text ["CARE [g care-sum / 6 round]  SKILL [g skill]", 128, 136, 8, #000000]
  since > 3.5
    ui blink ["PRESS 1", 186, #000000, now]
]
draw : [game |
  g : game
  m : g mode
  clear #000000
  m = "title"
    draw-title g
  (m = "stable") or (m = "brush")
    draw-stable g
  (m = "ride") or (m = "rode")
    draw-ride g
  m = "night"
    draw-night g
  m = "show"
    draw-show g
]
