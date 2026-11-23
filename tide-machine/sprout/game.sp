-- TIDE MACHINE: a lighthouse keeper's slot machine on a stormy night, in 16 bits. Each tide the sea wants its coins:
-- pull the lever a few times, and lines of three or more alike pay, across, down and slanting. Storm clouds eat a coin
-- each. When the tide turns, pay the sea, or the light goes out. Between tides a gull in a captain's hat sells charms
-- that bend the rules. How many tides can you keep the light burning?
-- Button 1 pulls the lever, pays the sea and buys; 2 pays the sea early (5 coins for each pull saved) and sails on.

-- ================================================================ the art
ink : [k : #241212, p : #ff926d, q : #db6d49, c : #ffdbb6, w : #ffffff, b : #4992db, l : #b6dbff, d : #24496d, g : #92929b, v : #dbb6ff, u : #926db6, s : #926d49, n : #24246d, y : #ffdb49, o : #ff9224, f : #ffff92, m : #6d6d92]
shell-art : [
  "................"
  "......kkkk......"
  "....kkcpcpkk...."
  "...kcpcpcpcpk..."
  "..kpcpcpcpcpck.."
  ".kcpcpcpcpcpcpk."
  ".kpcpcpcpcpcpck."
  ".kcpcpcpcpcpcpk."
  ".kqcqcqcqcqcqck."
  "..kqcqcqcqcqck.."
  "...kqqcqcqcqk..."
  "....kkqqqqkk...."
  ".....kpqqpk....."
  "....kqpkkpqk...."
  "....kkk..kkk...."
  "................"
]
fish-art : [
  "................"
  "................"
  "......kkkkk....."
  "....kkbbbbbkk..."
  "k..kbbbbbbwwbk.."
  "kk.kbbbbbbwkbk.."
  "kbkkbbbbbbbbbbk."
  "kbbkbbdbbbbbbbbk"
  "kbbklllllllllbk."
  "kbkkllllllllllk."
  "kk.kllldllllkk.."
  "k...kllllllkk..."
  ".....kkkkkk....."
  "................"
  "................"
  "................"
]
anchor-art : [
  "......kkkk......"
  ".....kgllgk....."
  ".....kg..gk....."
  "......kggk......"
  "...kkkkggkkkk..."
  "...kllllllllk..."
  "...kkkkggkkkk..."
  ".......gg......."
  "......kglk......"
  "......kglk......"
  "......kglk......"
  ".kk...kglk...kk."
  ".kgk..kglk..kgk."
  "..kgkkkglkkkgk.."
  "...kgggglggggk.."
  "....kkkkkkkkk..."
]
pearl-art : [
  "................"
  "................"
  ".....kkkkkk....."
  "....kwwwllvk...."
  "...kwwwllvvvk..."
  "...kwwllvvvvk..."
  "...kwllvvvvuk..."
  "...klvvvvvuuk..."
  "....kvvvvuuk...."
  "..kkkkkkkkkkkk.."
  ".kssssssssssssk."
  ".ksnsnsnsnsnssk."
  "..ksnsnsnsnssk.."
  "...kkssssssk...."
  ".....kkkkkk....."
  "................"
]
lantern-art : [
  "......kkkk......"
  ".....k....k....."
  "....kkkkkkkk...."
  "...kyyyyyyyyk..."
  "....kkkkkkkk...."
  "....kofffffk...."
  "....koffwffk...."
  "....kofwwffk...."
  "....koffwffk...."
  "....koffffok...."
  "....kooooook...."
  "....kkkkkkkk...."
  "...kyyyyyyyyk..."
  "....kddddddk...."
  ".....kkkkkk....."
  "................"
]
storm-art : [
  "................"
  ".....kkkk......."
  "...kkmmmmkkk...."
  "..kmmmllmmmmk..."
  ".kmmllllllmmmk.."
  "kmmmlllllllmmmk."
  "kdmmmmmmmmmmmdk."
  ".kddddddddddk..."
  "..kkkkyykkkk...."
  ".....kyyk......."
  "....kyyk........"
  "...kyyyyyk......"
  ".....kyyk......."
  "....kyk........."
  "....kk.........."
  "................"
]
gull-art : [
  "................"
  "......kkkk......"
  ".....knnnnk....."
  "....kkyyyykk...."
  ".....kwwwwk....."
  "....kwwkwwwk...."
  "....kwwwwwwooo.."
  "....kwwwwwkkk..."
  "...kwwwwwwk....."
  "..kgwwwwwwwk...."
  ".kggwwwwwwwk...."
  ".kgggwwwwwk....."
  "..kgggggkk......"
  "....kk.kk......."
  "....ok.ok......."
  "...oo..oo......."
]

symbol-art : [shell : shell-art, fish : fish-art, anchor : anchor-art, pearl : pearl-art, lantern : lantern-art, storm : storm-art]

-- ================================================================ the machine's rules
symbols : ["shell", "fish", "anchor", "pearl", "lantern", "storm"]
lucky-pool : ["shell", "fish", "anchor", "pearl", "lantern"]
-- what three, four and five alike pay
pays : [shell : [0, 0, 3, 7, 15], fish : [0, 0, 4, 9, 20], anchor : [0, 0, 8, 18, 40], pearl : [0, 0, 14, 30, 70], lantern : [0, 0, 25, 60, 150]]
paylines : reels lines 5x3
target-for : [tide-number | tide-number * tide-number * 3 + (tide-number * 9)]
charm-book : [
  [name : "PEARL DIVER", tag : "PRL", cost : 15, about : "PEARLS PAY DOUBLE"]
  [name : "SPARE TIDE", tag : "SPIN", cost : 25, about : "ONE MORE PULL A TIDE"]
  [name : "STORM GLASS", tag : "GLAS", cost : 10, about : "STORMS PAY 2, NOT EAT 1"]
  [name : "CROSSED OARS", tag : "OARS", cost : 20, about : "SLANTS PAY TWICE"]
  [name : "OLD COMPASS", tag : "ROWS", cost : 20, about : "ROWS PAY DOUBLE"]
  [name : "LUCKY STAR", tag : "STAR", cost : 20, about : "THE LUCKY ONE PAYS X3"]
  [name : "LANTERN OIL", tag : "OIL", cost : 15, about : "TWICE THE LANTERNS"]
  [name : "SEA SALT", tag : "SALT", cost : 10, about : "HALF THE STORMS"]
  [name : "BRASS BELL", tag : "BELL", cost : 15, about : "EVERY WIN PAYS +1 EACH"]
  [name : "FISH NET", tag : "NET", cost : 15, about : "FISH PAY TRIPLE"]
]
weights-for : [owned |
  oil : (owned has "LANTERN OIL") [2] else [1]
  salt : (owned has "SEA SALT") [0.5] else [1]
  [42, 32, 12, 7, 4 * oil, 6 * salt]
]
-- one win's coins, with the charms that touch it
win-pay : [w owned lucky |
  base : reels pay [[w], pays]
  diver : (w symbol = "pearl") and (owned has "PEARL DIVER") [2] else [1]
  oars : (w kind = "diagonal") and (owned has "CROSSED OARS") [2] else [1]
  compass : (w kind = "row") and (owned has "OLD COMPASS") [2] else [1]
  star : (w symbol = lucky) [(owned has "LUCKY STAR") [3] else [2]] else [1]
  net : (w symbol = "fish") and (owned has "FISH NET") [3] else [1]
  bell : (owned has "BRASS BELL") [w alike] else [0]
  base * diver * oars * compass * star * net + bell
]

-- ================================================================ songs: a sea shanty in D minor
songs : [
  title : [
    bpm : 100, beats : 24
    lead : music track ["D5 . . A4 . . | C5 . . G4 . . | A#4 . A4 G4 . F4 | A4 - - - . . | D5 . . F5 . . | E5 . . C5 . . | D5 . C5 A#4 . A4 | D5 - - - . .", 0.5]
    harmony : music track ["F4 . . F4 . . | E4 . . E4 . . | D4 . . D4 . . | C#4 - - - . . | F4 . . A4 . . | G4 . . E4 . . | F4 . . E4 . . | F4 - - - . .", 0.5]
    bass : music track ["D3 . . A2 . . | C3 . . G2 . . | A#2 . . F2 . . | A2 . . E2 . . | D3 . . A2 . . | C3 . . G2 . . | A#2 . . A2 . . | D2 . . . . .", 0.5]
    drums : music track ["kick . hat snare . hat | kick . hat snare . hat | kick . hat snare . hat | kick . hat snare . hat | kick . hat snare . hat | kick . hat snare . hat | kick . hat snare . hat | kick . snare kick snare crash", 0.5]
  ]
  tide : [
    bpm : 84, beats : 24
    lead : music track ["A4 . . . . . | G4 . F4 . E4 . | F4 . . D4 . . | E4 - - - . . | A4 . . C5 . . | A#4 . A4 . G4 . | A4 . . F4 . . | D4 - - - . .", 0.5]
    bass : music track ["D2 . . A2 . . | D2 . . A2 . . | A#1 . . F2 . . | A1 . . E2 . . | D2 . . A2 . . | G1 . . D2 . . | A1 . . E2 . . | D2 . . . . .", 0.5]
    drums : music track ["kick . . hat . . | kick . . snare . . | kick . . hat . . | kick . . snare . . | kick . . hat . . | kick . . snare . . | kick . . hat . . | kick . snare . . crash", 0.5]
  ]
  gull : [
    bpm : 132, beats : 16
    lead : music track ["G5 . E5 . C5 . E5 . | F5 . D5 . B4 . D5 . | E5 . C5 . G4 . C5 . | D5 . . . G4 . . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | G2 . D3 . G2 . D3 . | C3 . G2 . E2 . G2 . | G2 . . . G2 . . .", 0.5]
    drums : music track ["kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick snare crash .", 0.5]
  ]
  dark : [
    bpm : 70, beats : 8, once : true
    lead : music track ["D5 . C5 . A#4 . A4 . | F4 . . . D4 - - -", 0.5]
    bass : music track ["D3 . . . A#2 . . . | A2 . . . D2 - - -", 0.5]
  ]
]

-- ================================================================ a run
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  tide : 1
  kept : 0
  coins : 5
  shown : 5
  spins : 6
  grid : [["shell", "fish", "pearl", "fish", "shell"], ["anchor", "lantern", "lantern", "lantern", "anchor"], ["fish", "shell", "storm", "shell", "fish"]]
  spun-at : -10
  rolling : false
  wins : []
  paid : 0
  weather : 0
  charms : []
  offers : []
  cursor : 1
  seed : 1
  lucky : "pearl"
  said : ""
  said-at : 0

begin-run : [g now |
  seed-now : now * 977 floor + 3
  g with [mode : "tide", mode-at : now, tide : 1, kept : 0, coins : 5, shown : 5, spins : 6, charms : [], seed : seed-now, lucky : seeded pick [lucky-pool, seed-now + 31], song : "tide", wins : [], paid : 0, weather : 0, said : "", rolling : false]
]
spin-now : [g now |
  turn : g spins
  dealt : reels spin [symbols, weights-for (g charms), 5x3, g seed * 101 + (g tide * 17) + turn]
  g with [grid : dealt, rolling : true, spun-at : now, spins : turn - 1, wins : [], paid : 0, weather : 0, said : ""]
]
settle : [g |
  owned : g charms
  found : reels wins [g grid, paylines, 3] keep [w | w symbol != "storm"]
  won : found collect [w | win-pay [w, owned, g lucky]] sum
  clouds : reels tally [g grid, "storm"]
  rain : (owned has "STORM GLASS") [clouds * 2] else [0 - clouds]
  purse : g coins + won + rain max 0
  words : cond [won >= 30, "A GREAT CATCH!", won > 0, "+[won]", rain < 0, "THE STORM BITES", any, "NOTHING"]
  g with [rolling : false, wins : found, paid : won, weather : rain, coins : purse, said : words]
]
open-shop : [g now |
  pool : charm-book keep [c | (g charms has (c name)) not]
  picks : seeded shuffle [pool, g seed * 7 + (g tide)] take 3
  g with [mode : "shop", mode-at : now, offers : picks, cursor : 1, song : "gull"]
]
-- the end of a tide: pay the sea, or the light goes out
reckon : [g now early |
  owed : target-for (g tide)
  bonus : early [g spins * 5] else [0]
  purse : g coins + bonus
  (purse >= owed) [open-shop [g with [coins : purse - owed, kept : g tide, said : "THE SEA TAKES [owed]"], now]] else [g with [mode : "dark", mode-at : now, song : "dark"]]
]
next-tide : [g now |
  tide-now : g tide + 1
  spare : (g charms has "SPARE TIDE") [1] else [0]
  g with [mode : "tide", mode-at : now, tide : tide-now, spins : 6 + spare, lucky : seeded pick [lucky-pool, g seed + (tide-now * 31)], song : "tide", wins : [], paid : 0, weather : 0, said : ""]
]
buy : [g pick now |
  offer : g offers @ pick
  affordable : (g coins >= (offer cost)) and (g charms length < 5)
  affordable [g with [coins : g coins - (offer cost), charms : g charms .. [offer name], offers : g offers numbered keep [[i, o] | i != pick] collect [[i, o] | o], cursor : 1, said : "A FINE [offer tag]", said-at : now]] else [g with [said : "NOT ENOUGH COIN", said-at : now]]
]
tide-step : [g go back now |
  done : reels stopped [g spun-at, 5, 0.22, now]
  settled : (g rolling) and (done >= 5) and (now - (g spun-at) > 1.6)
  can-pay : (g rolling not) and (g coins >= (target-for (g tide)))
  cond [
    settled, settle g
    g rolling, g
    back and can-pay, reckon [g, now, true]
    go not, g
    g spins > 0, spin-now [g, now]
    any, reckon [g, now, false]
  ]
]
shop-step : [g go back step now |
  all-of : g offers length + 1
  pick : g cursor
  cond [
    back or (go and (pick = all-of)), next-tide [g, now]
    go, buy [g, pick, now]
    any, g with [cursor : menu wrap [pick, all-of, step x]]
  ]
]

update : [game |
  g : game
  inp : g input
  now : g clock
  go : inp pressed "one"
  back : inp pressed "two"
  step : pad way (inp pressed)
  after : cond [
    g mode = "title", go [begin-run [g, now]] else [g]
    g mode = "tide", tide-step [g, go, back, now]
    g mode = "shop", shop-step [g, go, back, step, now]
    g mode = "dark", (go and (now - (g mode-at) > 1.2)) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    any, g
  ]
  stops-before : reels stopped [g spun-at, 5, 0.22, now - (g dt)]
  stops-now : reels stopped [after spun-at, 5, 0.22, now]
  settled-now : (g rolling) and (after rolling not)
  (after rolling) and (g rolling not)
    hiss [0.3, 700]
    beep [110, 0.08]
  (after rolling) and (stops-now > stops-before)
    beep [180 + (stops-now * 40), 0.04]
  settled-now and (after paid > 0)
    zzfx preset "coin"
  settled-now and (after paid >= 30)
    zzfx preset "power"
    shake 3
  settled-now and (after weather < 0)
    hiss [0.6, 220]
  seeded chance [0.004, now * 60 floor]
    hiss [1.1, 140]
  (after mode = "dark") and (g mode != "dark")
    zzfx preset "explode"
  (after mode = "shop") and (g mode != "shop")
    zzfx preset "blip"
  (after charms length) > (g charms length)
    zzfx preset "coin"
  (after said-at = now) and (after said = "NOT ENOUGH COIN")
    beep [90, 0.15]
  (after mode = "shop") and (step x != 0)
    beep [660, 0.03]
  top : g best max (after kept)
  gap : after coins - (after shown)
  shown-now : (gap > 0) [after shown + (gap / 6 ceil)] else [after coins]
  after with [best : top, keep : [best : top], shown : shown-now]
]

-- ================================================================ drawing: the night, the lighthouse, the machine
sky-bands : [#000024, #000024, #000049, #002449, #00246d, #00496d, #004992, #24496d]
sky : [now flashing | sky-bands numbered each [[i, c] | rect [0, i - 1 * 18, W, 18, flashing [#92b6db] else [c]]]]
sea : [now |
  rect [0, 150, W, H - 150, #002449]
  range 3 each [row | range 42 each [i | rect [i * 8 - 8 + (now * (row + 1) * 6 % 8), 150 + (row * 18) + ((now * 2 + (i * 0.8) + row) sin * 3 floor), 6, 2, (row = 1) [#6d92b6] else [#24496d]]]]
]
draw-rain : [now |
  range 40 each [i |
    rx : i * 47 + (now * 90) % (W + 40) - 20
    ry : i * 29 + (now * 260) % (H + 20) - 20
    line [rx, ry, rx - 3, ry + 9, #6d92b6]
  ]
]
beam : [now |
  turn : now * 1.3
  range 7 each [k | a : turn + (k - 4 * 0.035), line [28, 57, a cos * 300 + 28, a sin * 80 + 57, (k % 2 = 0) [#ffff92] else [#dbdb92]]]
]
tower : [lit now |
  lit
    beam now
  rect [0, 196, 56, 28, #242424]
  rect [4, 188, 48, 10, #494949]
  range 6 each [i | wide : 34 - (i * 2), rect [28 - (wide / 2 floor), 172 - (i * 18), wide, 18, (i % 2 = 0) [#dbdbdb] else [#db2424]]]
  rect [16, 62, 24, 4, #242424]
  rect [18, 50, 20, 12, lit [#ffdb49] else [#242424]]
  rect [21, 52, 14, 8, lit [#ffff92] else [#494949]]
  rect [16, 44, 24, 6, #6d2424]
  rect [21, 38, 14, 6, #6d2424]
  rect [26, 33, 4, 5, #241212]
]
outline : [ox oy w h colour | rect [ox, oy, w, 2, colour], rect [ox, oy + h - 2, w, 2, colour], rect [ox, oy, 2, h, colour], rect [ox + w - 2, oy, 2, h, colour]]
cell-x : [c | c - 1 * 38 + 66]
cell-y : [r | r - 1 * 38 + 64]
plate : [g |
  rect [60, 18, 200, 44, #dbb649]
  rect [64, 22, 192, 36, #004949]
  rect [64, 22, 192, 2, #006d6d]
  text ["TIDE [g tide]", 70, 32, 8, #ffdb92, "left"]
  text ["LUCKY", 70, 47, 8, #b6dbdb, "left"]
  sprite [symbol-art get-in [g lucky], 112, 39, ink, false, 1]
  text ["THE SEA WANTS", 250, 32, 8, #b6dbdb, "right"]
  text ["[target-for (g tide)] COINS", 250, 47, 8, #ffffff, "right"]
]
tray : [g |
  rect [60, 176, 200, 40, #dbb649]
  rect [64, 180, 192, 32, #004949]
  text ["COINS", 70, 188, 8, #b6dbdb, "left"]
  text ["[g shown]", 70, 202, 8, #ffdb49, "left"]
  text ["PULLS", 140, 188, 8, #b6dbdb]
  range 7 each [i | circle [i * 9 + 104, 202, 3, (i <= (g spins)) [#ff9224] else [#492424]]]
  can-pay : (g rolling not) and (g coins >= (target-for (g tide))) and (g spins > 0)
  can-pay
    text ["2 PAY NOW", 250, 188, 8, #92dbb6, "right"]
  text [cond [g rolling, "", g spins > 0, "1 PULL", any, "1 PAY"], 250, 202, 8, #ffffff, "right"]
]
lever : [g now |
  ball-y : (now - (g spun-at) < 0.35) [170] else [80]
  rect [268, ball-y min 128, 4, (128 - ball-y) abs, #b6b6b6]
  rect [264, 124, 12, 10, #6d4924]
  circle [270, ball-y, 6, #db2424]
  circle [268, ball-y - 2, 2, #ff9292]
]
draw-machine : [g now |
  rect [56, 14, 208, 204, #492412]
  rect [58, 16, 204, 200, #b69249]
  rect [60, 18, 200, 196, #dbb649]
  roll : now * 520 % 38
  done : reels stopped [g spun-at, 5, 0.22, now]
  range 5 each [c |
    rx : cell-x c
    spinning : (g rolling) and (done < c)
    rect [rx - 1, 63, 38, 114, #6d4924]
    rect [rx, 64, 36, 112, #dbdbb6]
    rect [rx, 74, 36, 92, #ffffdb]
    spinning
      range 4 each [k | sprite [symbol-art get-in [reels blur [symbols, c, k, now]], rx + 2, k - 2 * 38 + 66 + roll, ink, false, 2]]
    spinning not
      range 3 each [r | sprite [symbol-art get-in [g grid @ r @ c], rx + 2, cell-y r + 2, ink, false, 2]]
  ]
  plate g
  tray g
  (g rolling not) and (now * 6 floor % 2 = 0)
    g wins each [w | w places each [p | outline [cell-x (p x), cell-y (p y), 36, 36, #ffffff]]]
  lever [g, now]
]
result-banner : [g now |
  (g rolling not) and (g said != "") and (now - (g spun-at) < 3.1)
    rect [60, 110, 200, 24, #002449]
    ui banner [g said, 122, (g said length <= 10) [16] else [8], (g paid > 0) [#ffdb49] else [#b6dbdb]]
]
charm-strip : [g |
  g charms numbered each [[i, owned-name] |
    c : charm-book keep [b | b name = owned-name] @ 1
    rect [282, i * 30 - 8, 36, 26, #6d4924]
    rect [284, i * 30 - 6, 32, 22, #004949]
    text [c tag, 300, i * 30 + 5, 8, #ffdb49]
  ]
]
draw-title : [g now |
  ui banner ["TIDE MACHINE", 70, 16, #ffdb49]
  ui banner ["A KEEPER'S SLOT MACHINE", 92, 8, #b6dbdb]
  symbols numbered each [[i, s] | sprite [symbol-art get-in [s], i * 36 + 28, (now * 3 + i) sin * 3 floor + 112, ink, false, 2]]
  ui blink ["PRESS 1 TO LIGHT THE LAMP", 168, #ffffff, now]
  g best > 0
    text ["BEST: [g best] TIDES KEPT", W / 2, 186, 8, #ffdb92]
]
draw-shop : [g now |
  ui strip ["TIDE [g kept] KEPT", "THE GULL", "COINS [g coins]", #002449, #dbb649]
  rect [26, 118, 8, 78, #6d4924]
  rect [20, 114, 20, 6, #492412]
  sprite [gull-art, 6, 68 + ((now * 2) sin * 2 floor), ink, false, 3]
  all-of : g offers length + 1
  g offers numbered each [[i, o] |
    px : i - 1 * 82 + 70
    lit : i = (g cursor)
    ui panel [pair [px, 24], 76x100, lit [#ffdb49] else [#6d4924], #002449]
    format wrap [o name, 8] numbered each [[k, words] | text [words, px + 38, k * 10 + 30, 8, #ffffff]]
    format wrap [o about, 8] numbered each [[k, words] | text [words, px + 38, k * 10 + 58, 8, #b6dbdb]]
    text ["[o cost] C", px + 38, 112, 8, (g coins >= (o cost)) [#ffdb49] else [#db6d49]]
  ]
  sail : (g cursor) = all-of
  ui panel [70x130, 240x20, sail [#ffdb49] else [#6d4924], #002449]
  text ["SAIL ON TO TIDE [g tide + 1]", 190, 140, 8, sail [#ffffff] else [#92b6b6]]
  tags : g charms collect [n | (charm-book keep [b | b name = n] @ 1) tag] join " "
  text ["YOURS: [tags]", 70, 162, 8, #92dbb6, "left"]
  (g said-at > (g mode-at)) [ui talk [g said, g said-at, now]] else [ui talk ["FINE CHARMS FOR A KEEPER. COIN FIRST, MIND. 1 BUYS, 2 SAILS ON.", g mode-at, now]]
]
draw-dark : [g now |
  ui banner ["THE LIGHT GOES OUT", 80, 16, #db6d49]
  ui banner ["YOU KEPT [g kept] TIDES", 108, 8, #ffffff]
  ui banner ["BEST: [g best]", 124, 8, #ffdb92]
  now - (g mode-at) > 1.2
    ui blink ["PRESS 1", 160, #ffffff, now]
]
draw : [game |
  g : game
  now : g clock
  flashing : range 5 count [k | seeded chance [0.004, now * 60 floor - k]] > 0
  clear #000024
  sky [now, flashing]
  sea now
  g mode != "shop"
    tower [g mode != "dark", now]
  draw-rain now
  g mode = "title"
    draw-title [g, now]
  g mode = "tide"
    draw-machine [g, now]
    charm-strip g
    result-banner [g, now]
  g mode = "shop"
    draw-shop [g, now]
  g mode = "dark"
    draw-dark [g, now]
]
