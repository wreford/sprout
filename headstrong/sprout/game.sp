-- HEADSTRONG: a 16-bit platform game for SPROUT·16. You are a head: a big one, with tiny arms and tiny feet, and a bath
-- to get through. Three rooms of a bubbly bathroom: soap bars sliding over the water, bubbles to bounce on, rubber ducks
-- and dripping taps to dodge, shampoo to collect, and a warm towel at the end of each room.
-- The arrows run, 1 jumps (hold it to go higher), 2 is a head-butt dash: it breaks cracked tiles and bonks ducks.

-- ================================================================ how the head moves (the platform module does the feel)
tile : 16
head-feel : platform feel with [size : 18x28, solids : "#%", top : 118, accel : 900, air : 620, brake : 1200, jump : 360, pull : 980, cut : -130, fall-top : 320]
dash-speed : 290

-- ================================================================ the art: rows of letters, and inks that colour them
head-ink : [k : #242424, h : #6d4924, H : #926d49, g : #929292, G : #b6b6b6, s : #ffdbb6, S : #dbb692, r : #ffb692, t : #b6926d, w : #ffffff, b : #6d4924, u : #6d92b6, p : #000000, m : #924949]
feet-ink : head-ink with [r : #db2424]
head-stand : [
  ".....khkkhkkhkkhkkhk.k...."
  "...kkhhkhhhhhhhhhkhkkhk..."
  "..khkkhhhhhHhhhhhHhkkhk..."
  "...kkhhhHhhhhhHhhhhhkk...."
  "...khhhhhhHhhhhhHhhhhk...."
  "..khhhhHhhhhhhhhhhhhhhk..."
  ".khhhhhhhssssssshhhhhhhk.."
  ".kgGshhssssssssssshhSgGk.."
  "kgGgsssssssssssssssssggGk."
  "kgggssshhhhsssshhhhssgggk."
  "kgGsssssssssssssssssssgGk."
  "kggsssswwbbsssswwuusssggk."
  "kggsssswwbpsssswwupsssggk."
  "ksssssswwwwsSsswwwwsssSSk."
  "ksssssssssssSssssssssSSSk."
  "ksstssrrsssSSSssssrrstSSk."
  ".ktsstssssssssssstsstSSk.."
  ".ksstsstsmsssssmssstSStk.."
  "..ktsstsssmmmmmssstSStk..."
  "...kstsstsstsstsstSStk...."
  "....ksstsstsstsStSStk....."
  ".....ktsstsstSStSStk......"
  "......kktsstsStSSkk......."
  "........kkkkkkkkk........."
]
head-blink : [
  ".....khkkhkkhkkhkkhk.k...."
  "...kkhhkhhhhhhhhhkhkkhk..."
  "..khkkhhhhhHhhhhhHhkkhk..."
  "...kkhhhHhhhhhHhhhhhkk...."
  "...khhhhhhHhhhhhHhhhhk...."
  "..khhhhHhhhhhhhhhhhhhhk..."
  ".khhhhhhhssssssshhhhhhhk.."
  ".kgGshhssssssssssshhSgGk.."
  "kgGgsssssssssssssssssggGk."
  "kgggssshhhhsssshhhhssgggk."
  "kgGsssssssssssssssssssgGk."
  "kggsssssssssssssssssssggk."
  "kggsssskkkksssskkkksssggk."
  "ksssssssssssSsssssssssSSk."
  "ksssssssssssSssssssssSSSk."
  "ksstssrrsssSSSssssrrstSSk."
  ".ktsstssssssssssstsstSSk.."
  ".ksstsstsmsssssmssstSStk.."
  "..ktsstsssmmmmmssstSStk..."
  "...kstsstsstsstsstSStk...."
  "....ksstsstsstsStSStk....."
  ".....ktsstsstSStSStk......"
  "......kktsstsStSSkk......."
  "........kkkkkkkkk........."
]
head-air : [
  ".....khkkhkkhkkhkkhk.k...."
  "...kkhhkhhhhhhhhhkhkkhk..."
  "..khkkhhhhhHhhhhhHhkkhk..."
  "...kkhhhHhhhhhHhhhhhkk...."
  "...khhhhhhHhhhhhHhhhhk...."
  "..khhhhHhhhhhhhhhhhhhhk..."
  ".khhhhhhhssssssshhhhhhhk.."
  ".kgGshhssssssssssshhSgGk.."
  "kgGgssshhhsssssshhhssggGk."
  "kgggsssssssssssssssssgggk."
  "kgGsssssssssssssssssssgGk."
  "kggsssswwwwsssswwwwsssggk."
  "kggsssswbpwsssswupwsssggk."
  "ksssssswwwwsSsswwwwsssSSk."
  "ksssssssssssSssssssssSSSk."
  "ksstssrrsssSSSssssrrstSSk."
  ".ktsstssssssssssstsstSSk.."
  ".ksstsstsssmmmssssstSStk.."
  "..ktsstsssmkkkmssstSStk..."
  "...kstsstssmmmtsstSStk...."
  "....ksstsstsstsStSStk....."
  ".....ktsstsstSStSStk......"
  "......kktsstsStSSkk......."
  "........kkkkkkkkk........."
]
head-grin : [
  ".....khkkhkkhkkhkkhk.k...."
  "...kkhhkhhhhhhhhhkhkkhk..."
  "..khkkhhhhhHhhhhhHhkkhk..."
  "...kkhhhHhhhhhHhhhhhkk...."
  "...khhhhhhHhhhhhHhhhhk...."
  "..khhhhHhhhhhhhhhhhhhhk..."
  ".khhhhhhhssssssshhhhhhhk.."
  ".kgGshhssssssssssshhSgGk.."
  "kgGgsssssssssssssssssggGk."
  "kgggssshhhhsssshhhhssgggk."
  "kgGsssssssssssssssssssgGk."
  "kggsssswwbbsssswwuusssggk."
  "kggsssswwbpsssswwupsssggk."
  "ksssssswwwwsSsswwwwsssSSk."
  "ksssssssssssSssssssssSSSk."
  "ksstssrrsssSSSssssrrstSSk."
  ".ktsstssmsssssssmtsstSSk.."
  ".ksstsstsmwwwwwmssstSStk.."
  "..ktsstsssmmmmmssstSStk..."
  "...kstsstsstsstsstSStk...."
  "....ksstsstsstsStSStk....."
  ".....ktsstsstSStSStk......"
  "......kktsstsStSSkk......."
  "........kkkkkkkkk........."
]
feet-stand : ["..k.....k...", "..s.....s...", ".krrk..krrk.", ".kwwk..kwwk."]
feet-step : [".k.......k..", ".s........s.", "krrk....krrk", "kwwk....kwwk"]
feet-air : ["...k...k....", "..krk.krk...", "..kwk.kwk...", "............"]
arm-down : ["k...", "sk..", ".sk.", ".ss."]
arm-up : [".ss.", ".sk.", "sk..", "k..."]

-- the bathroom: glazed tiles (each room its own colour), cracked ones, glass shelves and the bath water
room-inks : [
  [w : #ffffff, h : #dbffff, s : #b6dbff, g : #6d92db, c : #496d92, a : #dbffff, b : #6db6ff, d : #2449b6, q : #b6dbff, e : #92b6ff]
  [w : #ffffff, h : #dbffdb, s : #b6ffdb, g : #49b692, c : #246d49, a : #dbffff, b : #49b6db, d : #24496d, q : #b6ffdb, e : #6ddbb6]
  [w : #ffffff, h : #ffdbff, s : #ffb6db, g : #db6db6, c : #922449, a : #ffdbff, b : #b66ddb, d : #492492, q : #ffdbff, e : #ff92db]
]
wall-art : [
  "hhhhhhhhhhhhhhhg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg"
  "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg"
  "hwwwwwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "ssssssssssssssgg", "gggggggggggggggg"
]
crack-art : [
  "hhhhhhhhhhhhhhhg", "hwwwwwwcwwwwwwsg", "hwwwwwcwwwwwwwsg", "hwwwwwcwwwwwwwsg", "hwwwwwwccwwwwwsg", "hwwwwwwwwcwwwwsg"
  "hwwccwwwwcwwwwsg", "hwwwwccwcwwwwwsg", "hwwwwwwcwwwwwwsg", "hwwwwwwcwwwccwsg", "hwwwwwcwccccwwsg", "hwwwwcwwwwwwwwsg"
  "hwwwcwwwwwwwwwsg", "hwwwwwwwwwwwwwsg", "ssssssssssssssgg", "gggggggggggggggg"
]
shelf-art : ["aaaaaaaaaaaaaaaa", "bbbbbbbbbbbbbbbb", "dddddddddddddddd"]
water-art : [
  "aa......aa......", "bbaa..aabbaa..aa", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb"
  "bbbbbbbbbbbbbbbb", "bbbbbbbbbbbbbbbb", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd"
  "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd", "dddddddddddddddd"
]
back-art : [
  "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe"
  "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe"
  "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "qqqqqqqqqqqqqqqe", "eeeeeeeeeeeeeeee"
]
block-set : [["#", wall-art], ["%", crack-art], ["=", shelf-art], ["~", water-art]]
back-set : [["q", back-art]]
backdrop : range 15 collect [r | "q" repeat 22]

-- things in the rooms
thing-ink : [k : #242424, y : #ffdb24, Y : #dbb600, o : #ff9224, w : #ffffff, p : #ff6db6, P : #db2492, c : #6d6dff, m : #92ffdb, n : #49db92, M : #dbffff, G : #dbdbdb, g : #929292, b : #b6dbff, B : #6db6ff, r : #db2424]
duck-art : [
  "....kkkk........", "...kyyyyk.......", "..kyyyykyk......", "kkkyyyyyyyk.....", "koooyyyyyyk.....", ".kkkyyyyyyk..kk."
  "...kyyyyyyykkyyk", "..kyyyyyyyyyyyyk", ".kyyyyyyyyyyyyyk", ".kyyyyyyyyyyyyk.", ".kyyyyYYYYyyyyk.", "..kyyyyyyyyyyk.."
  "...kkkkkkkkkk...", "................"
]
bottle-art : ["..kkkk..", "..kcck..", ".kkkkkk.", "kppppppk", "kpwppPpk", "kpwppPpk", "kpwwwwpk", "kpwwwwpk", "kppppPpk", "kppppPpk", ".kkkkkk."]
soap-art : [
  "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".kmmmmmmmmmmmmmmmmmmmmmmmmmmmmk.", "kmMMMMMMmmmmmmmmmmmmmmmmmmmmmmmk", "kmMmmmmmmmmmmmmmmmmmmmmmmmmmmmnk"
  "kmmmmmmmmmmmmmmmmmmmmmmmmmmmmnnk", "knmmmmmmmmmmmmmmmmmmmmmmmmmmnnnk", ".knnnnnnnnnnnnnnnnnnnnnnnnnnnnk.", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkk.."
]
bubble-art : ["....kkkkkk....", "..kkbbbbbbkk..", ".kbw......bbk.", ".kw........bk.", "kbw.........bk", "kb..........bk", "kb..........bk", "kb..........bk", "kb..........bk", ".kb........bk.", ".kbb......bbk.", "..kkbbbbbbkk..", "....kkkkkk...."]
tap-art : ["..kkkkkkkk..", "..kGGGGGGk..", "kkkGggggGkkk", "kGGGggggGGGk", "kkkkkGGkkkkk", ".....kGk....", ".....kgk...."]
towel-art : [
  "kkkkkkkkkkkkkkkkkkkk", "kGGGGGGGGGGGGGGGGGGk", "kkkkkkkkkkkkkkkkkkkk", "..kwwwwwwwwwwwwwwk..", "..kwwwwwwwwwwwwwwk..", "..krrrrrrrrrrrrrrk.."
  "..kwwwwwwwwwwwwwwk..", "..kwwwwwwwwwwwwwwk..", "..kwwwwwwwwwwwwwwk..", "..kwwwwwwwwwwwwwwk..", "..krrrrrrrrrrrrrrk..", "..kwwwwwwwwwwwwwwk.."
  "..kwwwwwwwwwwwwwwk..", "..kwwwwwwwwwwwwwwk..", "..krrrrrrrrrrrrrrk..", "..kwkwkwkwkwkwkwkk..", "..k.k.k.k.k.k.k.k..."
]

-- ================================================================ the rooms: @ you, o shampoo, d a duck, t a tap, b a bubble, s a soap bar, T the towel
rooms : [
  [name : "THE TUB", rows : [
    "#############################################################"
    "#...........................................................#"
    "#...........................................................#"
    "#.......................o.o.o...............................#"
    "#......................=======..............................#"
    "#...........................................................#"
    "#...............o.o..........................o.o.o..........#"
    "#..............=====...................b.......%............#"
    "#..............................................%............#"
    "#.......o.o.o.......................=====......%............#"
    "#......=======.................................%............#"
    "#@...........................d...........d.....%........T...#"
    "##############...############################################"
    "##############~~~############################################"
  ]]
  [name : "THE SINK", rows : [
    "#############################################################"
    "#.......t..............t...............t....................#"
    "#...........................................................#"
    "#...........................................................#"
    "#...............o.o.o.................o.o...................#"
    "#...........................................................#"
    "#..................................b........................#"
    "#.......................o...............=====...............#"
    "#...........................................................#"
    "#..........=====............................................#"
    "#...........................................d..........%....#"
    "#@..........s.....s.....s.....s.............o.o........%..T.#"
    "########............................#########################"
    "########~~~~~~~~~~~~~~~~~~~~~~~~~~~~#########################"
  ]]
  [name : "THE SHOWER", rows : [
    "#############################################################"
    "#...t.......t........t.......t..........t........t..........#"
    "#.........................................o.o.............T.#"
    "#...........................o.o.o........======....=========#"
    "#..........................=======..........................#"
    "#....................................b......................#"
    "#...........o.o.......b.....................................#"
    "#..........=====..................d.........................#"
    "#.............................=========.................b...#"
    "#.....=====......................................%%.........#"
    "#...............d................................%%.........#"
    "#@..........................................o.o..%%.........#"
    "########################....#################################"
    "########################~~~~#################################"
  ]]
]

-- ================================================================ the music
songs : [
  title : [
    bpm : 132, beats : 16
    lead : music track ["C5 . E5 G5 . E5 C5 . | D5 . F5 A5 . F5 D5 . | E5 . G5 C6 . B5 A5 G5 | F5 - E5 - D5 - . .", 0.5]
    harmony : music track ["E4 - - . G4 - - . | F4 - - . A4 - - . | G4 - - . E4 - - . | A4 - G4 - F4 - . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | E3 . B2 . E3 . B2 . | F3 . C3 . G2 . G2 .", 0.5]
    drums : music track ["kick . hat . snare . hat hat | kick . hat . snare . hat . | kick . hat . snare . hat hat | kick kick hat . snare snare crash .", 0.5]
  ]
  play : [
    bpm : 148, beats : 32
    lead : music track ["G5 . E5 . C5 . E5 G5 | A5 . G5 . E5 - . . | F5 . D5 . B4 . D5 F5 | G5 . F5 . D5 - . . | E5 . G5 . C6 . G5 . | A5 . F5 . D5 . F5 . | G5 . E5 . D5 . B4 . | C5 - - . . . . .", 0.5]
    harmony : music track ["C5 - . . G4 - . . | C5 - . . E4 - . . | B4 - . . G4 - . . | B4 - . . D4 - . . | C5 - . . E5 - . . | D5 - . . A4 - . . | B4 - . . G4 - . . | E4 - - . . . . .", 0.5]
    bass : music track ["C3 . C4 . G2 . C4 . | A2 . A3 . E2 . A3 . | G2 . G3 . D3 . G3 . | G2 . B2 . D3 . G3 . | C3 . C4 . E3 . C4 . | F2 . F3 . A2 . F3 . | G2 . G3 . G2 . B2 . | C3 . G2 . C3 . . .", 0.5]
    drums : music track ["kick . hat kick snare . hat . | kick . hat kick snare . hat hat | kick . hat kick snare . hat . | kick . hat kick snare . hat hat | kick . hat kick snare . hat . | kick . hat kick snare . hat hat | kick . hat kick snare . hat . | kick kick snare kick snare snare crash .", 0.5]
  ]
  clean : [
    bpm : 120, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 - - E6 - | C6 - - - . . . .", 0.5]
    harmony : music track ["E4 G4 C5 E5 - - G5 - | E5 - - - . . . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | C3 - - - . . . .", 0.5]
  ]
  over : [
    bpm : 96, beats : 8, once : true
    lead : music track ["G4 . F4 . E4 . D4 . | C4 - - - . . . .", 0.5]
    bass : music track ["C3 . B2 . A2 . G2 . | C2 - - - . . . .", 0.5]
  ]
]

-- ================================================================ a room: made from its plan, then played
put-tile : [world cell ch | world numbered collect [[r, line] | (r = (cell y)) [line chars numbered collect [[c, letter] | (c = (cell x)) [ch] else [letter]] join ""] else [line]]]
cells-of : [plan ch | tilemap find [plan, ch] collect [c | tilemap to-pixel [c, tile]]]
enter : [g n now |
  plan : rooms @ n rows
  spot : cells-of [plan, "@"] @ 1
  hero : [at : spot, speed : 0x0, ground : false, coyote-left : 0, buffer-left : 0, jumped : false, face : 1, dash-left : 0, dash-ready : true]
  g with [
    mode : "play", mode-at : now, started : now, room : n, room-score : g score, song : "play", fx : ["start"]
    world : tilemap clear [plan, "@odtbsT"], player : hero, camera : 0
    bottles : cells-of [plan, "o"] collect [p | p + 8x8], taps : cells-of [plan, "t"], soaps : cells-of [plan, "s"]
    ducks : cells-of [plan, "d"] collect [p | [at : p + 0x2, speed : 0x0, way : -1, bonked : -9]]
    bubbles : cells-of [plan, "b"] collect [p | [home : p + 8x8, popped : -9]]
    towel : cells-of [plan, "T"] @ 1
  ]
]
soap-at : [home i t | pair [home x - 8 + ((t * 1.3 + (i * 1.9)) sin * 26), home y + 6]]
bubble-at : [b i now | b home + (pair [0, (now * 2.2 + i) sin * 3])]
drip-at : [tap i t | pair [tap x + 7, t + (i * 0.7) % 1.9 * 150 + (tap y) + 12]]
overlaps : [a a-size b b-size | (a x < (b x + (b-size x))) and (b x < (a x + (a-size x))) and (a y < (b y + (b-size y))) and (b y < (a y + (a-size y)))]

-- the dash: straight ahead, breaking cracked tiles in front of the head
crack : [world at face |
  front : at x + ((face > 0) [22] else [-5])
  spots : [4, 14, 24] collect [dy | tilemap to-cell [pair [front, at y + dy], tile]]
  spots fold [world, [w c | (tilemap char-at [w, tilemap to-pixel [c, tile], tile] = "%") [put-tile [w, c, "."]] else [w]]]
]
dash-step : [h face world fresh dt |
  moved : tilemap move [[at : h at, speed : pair [face * dash-speed, 0]], head-feel size, world, tile, head-feel solids, head-feel platforms, dt]
  left-over : (fresh [0.22] else [h dash-left]) - dt max 0
  h with [at : moved at, speed : pair [face * 60, 0], ground : moved ground, dash-left : left-over, dash-ready : false, face : face, jumped : false]
]
-- standing on a soap bar: carried along with it
ride : [h soaps t dt |
  under : soaps numbered keep [[i, s] |
    p : soap-at [s, i, t]
    feet : h at y + 28
    (h speed y >= 0) and (feet >= (p y - 3)) and (feet <= (p y + 8)) and (h at x + 18 > (p x)) and (h at x < (p x + 32))
  ]
  (under length > 0) [
    hit : under @ 1
    p : soap-at [hit @ 2, hit @ 1, t]
    was : soap-at [hit @ 2, hit @ 1, t - dt]
    h with [at : pair [h at x + (p x - (was x)), p y - 28], speed : pair [h speed x, 0], ground : true, coyote-left : head-feel coyote-time, dash-ready : true]
  ] else [h]
]
walk-duck : [d world dt |
  moved : tilemap move [[at : d at, speed : pair [d way * 34, d speed y + (980 * dt) min 320]], 16x12, world, tile, "#%", "=", dt]
  turn : (moved wall != 0) or ((moved ground) and (tilemap drop-ahead [world, moved at, 16x12, d way, tile, "#%="]))
  d with [at : moved at, speed : moved speed, way : turn [0 - (d way)] else [d way]]
]
ouch : [g now | g with [mode : "ouch", mode-at : now, lives : g lives - 1, fx : ["ouch"], song : "quiet"]]

play : [g inp now dt |
  h : g player
  t : now - (g started)
  way : pad across (inp held)
  dashing : h dash-left > 0
  fresh : (inp pressed "two") and (h dash-ready) and (dashing not)
  face : (way != 0) [way] else [h face]
  level : (dashing or fresh) [crack [g world, h at, face]] else [g world]
  stepped : (dashing or fresh) [dash-step [h, face, level, fresh, dt]] else [platform step [h, way, inp pressed "one", inp held "one", level, head-feel, dt] with [face : face]]
  rode : ride [stepped with [dash-ready : (stepped ground) or (stepped dash-ready)], g soaps, t, dt]
  -- bubbles bounce a falling head up high
  popped : g bubbles numbered keep [[i, b] | (now - (b popped) > 3) and (rode speed y > 0) and (overlaps [rode at - 6, 30x40, bubble-at [b, i, now], 1x1])] collect [[i, b] | i]
  bounced : (popped length > 0) [rode with [speed : pair [rode speed x, -470], ground : false, coyote-left : 0, dash-ready : true]] else [rode]
  bubbles : g bubbles numbered collect [[i, b] | (popped has i) [b with [popped : now]] else [b]]
  -- shampoo, ducks, drips, water and the towel
  got : g bottles keep [b | overlaps [bounced at - 4, 26x36, b, 1x1]]
  ducks : g ducks keep [d | now - (d bonked) < 1.2 or (d bonked < 0)] collect [d | (d bonked > 0) [d] else [walk-duck [d, level, dt]]]
  touched : ducks keep [d | (d bonked < 0) and (overlaps [bounced at, 18x28, d at, 16x12])]
  stomp : (bounced speed y > 0) and (touched all [d | bounced at y + 20 < (d at y)])
  bonks : (touched length > 0) and ((bounced dash-left > 0) or stomp)
  hurt-duck : (touched length > 0) and (bonks not)
  after-ducks : ducks collect [d | (bonks and (touched has d)) [d with [bonked : now]] else [d]]
  hero : stomp and bonks [bounced with [speed : pair [bounced speed x, -280]]] else [bounced]
  dripped : g taps numbered keep [[i, p] | overlaps [hero at, 18x28, drip-at [p, i, t], 3x6]] length > 0
  sunk : (tilemap touches [level, hero at, 18x28, tile, "~"]) or (hero at y > H)
  dried : overlaps [hero at, 18x28, g towel, 16x24]
  wide : level @ 1 length * tile
  score : g score + (got length * 100) + (bonks [touched length * 200] else [0]) + ((level != (g world)) [10] else [0])
  sounds : [
    (hero jumped) ["jump"] else [""], (fresh) ["dash"] else [""], (got length > 0) ["coin"] else [""], (popped length > 0) ["bubble"] else [""]
    (bonks) ["bonk"] else [""], (level != (g world)) ["crack"] else [""]
  ] keep [s | s != ""]
  moved : g with [
    player : hero, world : level, bubbles : bubbles, ducks : after-ducks, score : score, fx : sounds
    bottles : g bottles keep [b | (got has b) not], camera : hero at x + 9 - (W / 2) max 0 min (wide - W)
  ]
  cond [
    dried, moved with [mode : "dry", mode-at : now, score : score + (60 - t max 0 * 10 floor), fx : ["towel"], song : "clean"]
    hurt-duck or dripped or sunk, ouch [moved, now]
    any, moved
  ]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  room : 1
  lives : 3
  score : 0
  room-score : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  fx : []

update : [game |
  g : game
  now : g clock
  dt : g dt min 0.05
  inp : g input
  go : pad either (inp pressed)
  since : now - (g mode-at)
  after : cond [
    g mode = "play", play [g, inp, now, dt]
    g mode = "title", go [enter [g with [lives : 3, score : 0], 1, now]] else [g]
    g mode = "ouch", (since > 1.4) [(g lives > 0) [enter [g with [score : g room-score], g room, now]] else [g with [mode : "over", mode-at : now, song : "over"]]] else [g]
    g mode = "dry", (since > 2.4) [(g room < (rooms length)) [enter [g, g room + 1, now]] else [g with [mode : "clean", mode-at : now, song : "clean"]]] else [g]
    any, ((since > 1.5) and go) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
  ]
  heard : after fx else []
  heard has "jump"
    zzfx preset "jump"
  heard has "dash"
    zzfx preset ["laser", 0.6]
  heard has "coin"
    zzfx preset "coin"
  heard has "bubble"
    beep [988, 0.06]
    zzfx preset ["blip", 1.6]
  heard has "bonk"
    zzfx preset "hit"
  heard has "crack"
    hiss [0.2, 900]
    shake 3
  heard has "ouch"
    zzfx preset "hurt"
    shake 5
  heard has "towel"
    zzfx preset "power"
  heard has "start"
    zzfx preset "select"
  top : after score max (g best)
  after with [fx : [], best : top, keep : [best : top]]
]

-- ================================================================ drawing
draw-hero : [g h now |
  hx : h at x - (g camera)
  hy : h at y
  flip : h face < 0
  happy : (g mode = "dry") or (g mode = "clean")
  air : (h ground) not
  face-art : cond [happy, head-grin, (g mode = "ouch") or air, head-air, now % 3.1 < 0.14, head-blink, any, head-stand]
  feet : cond [air, feet-air, h speed x abs > 20, flipbook pick [[feet-stand, feet-step], 12, now], any, feet-stand]
  arm : (air or happy) [arm-up] else [arm-down]
  swing : ((h speed x abs > 20) and (air not)) [now * 14 sin * 1.5 round] else [0]
  sprite [arm, hx - 6, hy + 13 + swing, head-ink, false, 1]
  sprite [arm, hx + 20, hy + 13 - swing, head-ink, true, 1]
  sprite [feet, hx + 3, hy + 24, feet-ink, flip, 1]
  sprite [face-art, hx - 4, hy, head-ink, flip, 1]
]
draw-room : [g |
  now : g clock
  cam : g camera
  t : now - (g started)
  ink : room-inks @ (g room)
  tiles [backdrop, back-set, ink, 0 - (cam / 2 % 16), 0]
  rect [0, 120, W, 10, ink "g"]
  rect [0, 120, W, 2, ink "h"]
  range 21 each [i | rect [i * 16 - (cam / 2 % 16) + 6, 123, 4, 4, ink "w"]]
  tiles [g world, block-set, ink, 0 - cam, 0]
  g taps numbered each [[i, p] |
    sprite [tap-art, p x + 2 - cam, p y, thing-ink, false, 1]
    d : drip-at [p, i, t]
    rect [d x - cam, d y, 3, 6, #6db6ff]
    rect [d x - cam, d y, 1, 2, #ffffff]
  ]
  g soaps numbered each [[i, s] | p : soap-at [s, i, t], sprite [soap-art, p x - cam, p y, thing-ink, false, 1]]
  g bubbles numbered each [[i, b] |
    p : bubble-at [b, i, now]
    now - (b popped) > 3
      sprite [bubble-art, p x - 7 - cam, p y - 7, thing-ink, false, 1]
  ]
  g bottles each [b | sprite [bottle-art, b x - 4 - cam, b y - 6 + ((now * 3 + (b x)) sin * 2 round), thing-ink, false, 1]]
  g ducks each [d |
    gone : d bonked > 0
    rise : gone [now - (d bonked) * 140] else [0]
    sprite [duck-art, d at x - cam, d at y - 2 - rise, thing-ink, d way > 0, 1]
  ]
  sprite [towel-art, g towel x - 2 - cam, g towel y - 4, thing-ink, false, 1]
  draw-hero [g, g player, now]
  ui strip ["LIVES [g lives]", "[rooms @ (g room) name]", "SCORE [g score]", #ffffff, #244992]
  g mode = "ouch"
    ui banner ["OUCH!", 96, 16, #ff6d6d]
  g mode = "dry"
    ui banner ["SQUEAKY!", 90, 16, #ffdb24]
    ui banner ["TIME BONUS", 116, 8, #ffffff]
  t < 1.4
    ui banner [rooms @ (g room) name, 70, 16, #ffffff]
]
draw-title : [g |
  now : g clock
  tiles [backdrop, back-set, room-inks @ 1, 0 - (now * 8 % 16), 0]
  rect [0, 150, W, 74, #6db6ff]
  rect [0, 150, W, 4, #dbffff]
  range 6 each [i | sprite [bubble-art, i * 57 + 10, 140 - (now * 30 + (i * 37) % 160), thing-ink, false, 1]]
  ui banner ["HEADSTRONG", 34, 16, #ffdb24]
  ui banner ["A BIG HEAD. TINY FEET. ONE BATH.", 56, 8, #244992]
  bob : now * 5 sin abs * -10 round
  sprite [head-stand, 134, 80 + bob, head-ink, false, 2]
  sprite [feet-stand, 148, 128 + bob, feet-ink, false, 2]
  sprite [arm-up, 120, 104 + bob, head-ink, false, 2]
  sprite [arm-up, 192, 104 + bob, head-ink, true, 2]
  ui blink ["PRESS 1 TO HOP IN", 176, #ffffff, now]
  g best > 0
    ui banner ["BEST [g best]", 200, 8, #244992]
]
draw : [game |
  g : game
  clear #244992
  g mode = "title"
    draw-title g
  (g mode = "play") or (g mode = "ouch") or (g mode = "dry")
    draw-room g
  g mode = "clean"
    draw-title g
    rect [40, 64, 240, 96, #244992]
    ui banner ["SQUEAKY CLEAN!", 84, 16, #ffdb24]
    ui banner ["SCORE [g score]", 112, 8, #ffffff]
    ui banner ["BEST [g best]", 128, 8, #b6dbff]
    sprite [head-grin, 147, 140, head-ink, false, 1]
  g mode = "over"
    clear #242449
    ui banner ["BACK TO THE BATH", 88, 16, #ff6d6d]
    ui banner ["SCORE [g score]", 120, 8, #ffffff]
    sprite [head-air, 147, 140, head-ink, false, 1]
]
