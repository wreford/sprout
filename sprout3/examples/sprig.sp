-- SPRIG: a seedling's journey across three gardens. An 8-bit platform game for the SPROUT·8 console.
-- The D-pad runs, button 2 jumps (hold it to jump higher), button 1 spits a seed. Stomp the grubs, gather dew (a
-- hundred is a new life), find the three sun seeds hidden in each garden and reach the flower at the end.
-- Everything is in this file: the art as rows of letters, the levels as rows of tiles, the songs as notes.

-- ================================================================ how Sprig moves
tile : 16
run-top : 96
jump-speed : -330
pull : 900
fall-top : 270
hit-size : 10x14
foe-size : 12x10
solids : "#GDB"
platforms : "="

-- ================================================================ the art: rows of letters, and inks that colour them
sprite-ink : [k : #000000, w : #ffffff, g : #55aa00, l : #aaff55, d : #005500, o : #ff5500, y : #ffff00, r : #ff0000, b : #0055ff, c : #55ffff, p : #ff55aa, n : #aa5500, s : #aaaaaa]
flash-ink : sprite-ink with [g : #ffffff, l : #ffffff, d : #aaaaaa]
cave-foes : sprite-ink with [o : #aa00aa, y : #ff55ff, r : #5500aa]
dusk-foes : sprite-ink with [o : #aa0000, y : #ffaa00, r : #ff00aa]

sprig-stand : [
  ".....kk..kk....."
  "....klk..klk...."
  "....kllkkllk...."
  ".....kkddkk....."
  ".....kkkkkk....."
  "....kllggggk...."
  "...klgggwwgwk..."
  "...kggggwkgkk..."
  "...kggggwkgkk..."
  "...kgggggggggk.."
  "...kggggrrgggk.."
  "...kgggggggggk.."
  "....kgggggggk..."
  ".....kkkkkkk...."
  "....knnk.knnk..."
  "....kkkk.kkkk..."
]
sprig-run : [
  ".....kk..kk....."
  "....klk..klk...."
  "....kllkkllk...."
  ".....kkddkk....."
  ".....kkkkkk....."
  "....kllggggk...."
  "...klgggwwgwk..."
  "...kggggwkgkk..."
  "...kggggwkgkk..."
  "...kgggggggggk.."
  "...kggggrrgggk.."
  "...kgggggggggk.."
  "....kgggggggk..."
  ".....kkkkkkk...."
  "...knnk..knnk..."
  "...kkkk..kkkk..."
]
sprig-step : [
  "................"
  ".....kk..kk....."
  "....klk..klk...."
  "....kllkkllk...."
  ".....kkddkk....."
  ".....kkkkkk....."
  "....kllggggk...."
  "...klgggwwgwk..."
  "...kggggwkgkk..."
  "...kggggwkgkk..."
  "...kgggggggggk.."
  "...kggggrrgggk.."
  "....kgggggggk..."
  ".....kkkkkkk...."
  ".....knnnnk....."
  ".....kkkkkk....."
]
sprig-jump : [
  "....kk....kk...."
  "...klk....klk..."
  "...kllk..kllk..."
  "....kkkddkk....."
  ".....kkkkkk....."
  "....kllggggk...."
  "...klgggwwgwk..."
  "...kggggwkgkk..."
  "...kggggwkgkk..."
  "...kgggggggggk.."
  "...kggggrrgggk.."
  "...kgggggggggk.."
  "....kgggggggk..."
  ".....kkkkkkk...."
  ".....knk.knk...."
  "......k...k....."
]
grub-a : [
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  ".....kkkkk......"
  "...kkoooook....."
  "..koooyooook...."
  ".kooooooowkok..."
  ".koyooyoooooook."
  ".kooooooooooook."
  "..kkkkkkkkkkkk.."
  "..kn.kn.kn.kn..."
  "................"
  "................"
]
grub-b : [
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  ".....kkkkk......"
  "...kkoooook....."
  "..koooyoowkok..."
  ".koyooyoooooook."
  ".kooooooooooook."
  "..kkkkkkkkkkkk.."
  "...kn.kn.kn.kn.."
  "................"
  "................"
]
bee-a : [
  "................"
  "................"
  ".....ss..ss....."
  "....ssss.ssss..."
  "......kkkkk....."
  "....kkyykyykk..."
  "...kyyykyyykwk.."
  "..kkyyykyyykkk.."
  "...kyyykyyykk..."
  "....kkkkkkkk...."
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
]
bee-b : [
  "................"
  "................"
  "................"
  "....ssss.ssss..."
  "......kkkkk....."
  "....kkyykyykk..."
  "...kyyykyyykwk.."
  "..kkyyykyyykkk.."
  "...kyyykyyykk..."
  "....kkkkkkkk...."
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
]
cap-art : [
  "................"
  "................"
  ".....kkkkkk....."
  "...kkrrwrrrkk..."
  "..krrwwrrrwwrk.."
  ".krrrwrrrrrwrrk."
  ".krrrrrrrrrrrrk."
  "..kkkkkkkkkkkk.."
  "....kwwwwwwk...."
  "....kwkwwkwk...."
  "....kwkwwkwk...."
  "....kwwwwwwk...."
  "...kkwwwwwwkk..."
  "...knnk..knnk..."
  "...kkkk..kkkk..."
  "................"
]
dew-art : [
  "...kk..."
  "..kcbk.."
  "..kcbk.."
  ".kcbbbk."
  ".kcbbbk."
  "kcbbbbbk"
  "kcbbbbbk"
  "kbbbbbbk"
  ".kbbbbk."
  "..kkkk.."
]
sun-art : [
  ".....kk....."
  "..k..yy..k.."
  "...kyyyyk..."
  "..kyywwyyk.."
  "kyyywwwyyyyk"
  "kyyyywyyyyyk"
  ".kyyyyyyyyk."
  "..kyyyyyyk.."
  "...kyyyyk..."
  "..k..kk..k.."
]
seed-art : [
  ".kkk.."
  "knnnk."
  "knnnk."
  ".kkk.."
]
bud-art : [
  "......kkkk......"
  ".....kppppk....."
  "....kppwpppk...."
  "....kpppppk....."
  ".....kpppk......"
  "......kkk......."
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  "....klldk......."
  ".....kldk......."
  ".......kdk......"
  ".......kdk......"
  ".......kdllk...."
  ".......kdlk....."
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  "......kddk......"
  ".....kkkkkk....."
]
bloom-art : [
  "...kk..kk..kk..."
  "..kppkkppkkppk.."
  "..kpppkyykpppk.."
  "...kpkyyyykpk..."
  "..kppkyyyykppk.."
  "...kkkkkkkkkk..."
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  "....klldk......."
  ".....kldk......."
  ".......kdk......"
  ".......kdk......"
  ".......kdllk...."
  ".......kdlk....."
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  ".......kdk......"
  "......kddk......"
  ".....kkkkkk....."
]
flag-off : [
  "....kkkkkk......"
  "....kssssk......"
  "....ksssssk....."
  "....kssssk......"
  "....kkkkk......."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "...knnnk........"
  "..kkkkkkk......."
]
flag-on : [
  "....kkkkkk......"
  "....kllllk......"
  "....klllllk....."
  "....kllllk......"
  "....kkkkk......."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "....knk........."
  "...knnnk........"
  "..kkkkkkk......."
]
heart-full : [
  ".kk.kk.."
  "krrkrrk."
  "krrrrrk."
  ".krrrk.."
  "..krk..."
  "...k...."
]
heart-empty : [
  ".kk.kk.."
  "kssksk.."
  "ksssssk."
  ".ksssk.."
  "..ksk..."
  "...k...."
]
cloud-art : [
  ".........wwww..........."
  "......wwwwwwwww........."
  "....wwwwwwwwwwwww..ww..."
  "..wwwwwwwwwwwwwwwwwwwww."
  ".wwwwwwwwwwwwwwwwwwwwwww"
  "..wwwwwwwwwwwwwwwwwwwww."
]
puff-art : [
  "..kk.."
  ".kwwk."
  "kwwwwk"
  ".kwwk."
  "..kk.."
]

-- the tiles: each a 16x16 picture, in the letters of a garden's ink
grass-tile : [
  ".a...a....a...a."
  "aba.aba..aba.aba"
  "bbbabbbbabbbbabb"
  "aaaaaaaaaaaaaaaa"
  "adaaadaaaadaaada"
  "dddcdddddddcdddd"
  "ddddddeddddddddd"
  "dcddddddddcddddd"
  "ddddcdddddddeddd"
  "dddddddcdddddddd"
  "deddddddddddcddd"
  "ddddddcddddddddd"
  "dddcddddddeddddd"
  "dddddddddddddcdd"
  "ddeddddcdddddddd"
  "dddddddddddddddd"
]
dirt-tile : [
  "ddddddeddddddddd"
  "dcddddddddcddddd"
  "ddddcdddddddeddd"
  "dddddddcdddddddd"
  "deddddddddddcddd"
  "ddddddcddddddddd"
  "dddcddddddeddddd"
  "dddddddddddddcdd"
  "ddeddddcdddddddd"
  "dddddddddddddddd"
  "ddddcddddddedddd"
  "dcddddddddddddcd"
  "dddddddedddddddd"
  "ddcddddddddcdddd"
  "dddddedddddddddd"
  "dddddddddddddddd"
]
stone-tile : [
  "hhhhhhhkhhhhhhhk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "kkkkkkkkkkkkkkkk"
  "hhhkhhhhhhhkhhhh"
  "fffkhffffffkhfff"
  "fffkhffffffkhfff"
  "fffkhffffffkhfff"
  "kkkkkkkkkkkkkkkk"
  "hhhhhhhkhhhhhhhk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "hffffffkhffffffk"
  "kkkkkkkkkkkkkkkk"
  "hhhkhhhhhhhkhhhh"
]
plank-tile : [
  "kkkkkkkkkkkkkkkk"
  "iiiiiiiiiiiiiiii"
  "ijiiiiijiiiiiiji"
  "jjjjjjjjjjjjjjjj"
  "..jk......kj...."
  "..jk......kj...."
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
]
thorn-tile : [
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  "................"
  ".u...u...u...u.."
  ".u...u...u...u.."
  "tut.tut.tut.tut."
  "tut.tut.tut.tut."
  "tuuttuuttuuttuut"
  "tttttttttttttttt"
  "cccccccccccccccc"
  "cccccccccccccccc"
]
tile-set : [["G", grass-tile], ["D", dirt-tile], ["B", stone-tile], ["=", plank-tile], ["^", thorn-tile]]

meadow-ink : [k : #000000, a : #00aa00, b : #55ff55, c : #550000, d : #aa5500, e : #ffaa55, f : #555555, h : #aaaaaa, i : #ffaa00, j : #aa5500, t : #aa00aa, u : #ff55ff]
caves-ink : [k : #000000, a : #00aa55, b : #55ffaa, c : #000055, d : #550055, e : #aa00aa, f : #000055, h : #5555aa, i : #aa55aa, j : #550055, t : #00aaaa, u : #55ffff]
garden-ink : [k : #000000, a : #aa5500, b : #ffaa00, c : #550000, d : #aa0000, e : #ff5555, f : #550000, h : #aa5555, i : #ffff55, j : #aa5500, t : #55aa00, u : #aaff55]

-- ================================================================ the gardens
meadow-map : [
  "................................................................................................................"
  "................................................................................................................"
  "................................................................................................................"
  "......................................*........................................................................."
  "..................................................................*............................................."
  ".....................................ooo...z......................B........................z...................."
  "....................................=====..............................oooo.......oo.................*.........."
  "......oooo......o..........o........................oooo..............h...........==................BB.........."
  "...........................B.................................===############....................oooo............"
  "..P.....................g..B...###############.......^^..g.C....##############..........g.....g............F...."
  "###############...############################...############...#################....###########################"
  "###############...############################...############...#################....###########################"
]

caves-map : [
  "########################################################################################################################"
  "........#####................#####............................#########................................................."
  "........#####................#####............................#########................................................."
  ".............................#####............................#########.....*..........................................."
  "..............................................................#########................................................."
  "..................oooo................oo......z..ooo.............................z..................z..................."
  "..................====.........*.....====........BBB.......................===.....===........................*........."
  "..................................h......................................................................oooooB........."
  ".....oooo..................##########...............g..........ooooooo.===....................................B........."
  "..P................^^...g..##########^^^^##############.....C.....g................^^^..h........g.....g......B....F...."
  "#############..########################################..##############.......#############..###########################"
  "#############..########################################..##############.......#############..###########################"
]

garden-map : [
  ".................................................................................................................................."
  ".................................................................................................................................."
  ".................................................................................................................................."
  ".................*................................................................................................................"
  "..............................................ooo......................oooo......................................................."
  "................ooo...z.......................===............*...........h................z.........ooo.............z............."
  "................===.........................................===........####.........................===.................*........."
  ".....................................g....===.....===..................####..===.......................................BB........."
  "......ooo...===..................########..........................########.....................===.....===.....oooooo............"
  "..P.....................^^^..h...########...............C...^^^..g.########.........g..^^...h...................g............F...."
  "###########.........#####################.............#####################.......#############.............######################"
  "###########.........#####################.............#####################.......#############.............######################"
]


stages : [
  [name : "DAWN MEADOW", rows : meadow-map, tile-ink : meadow-ink, sky : #55aaff, hill-colours : [#00aa55, #55ffaa], tune : "meadow", foe-ink : sprite-ink, cloudy : true]
  [name : "ROOT CAVES", rows : caves-map, tile-ink : caves-ink, sky : #000055, hill-colours : [#000000, #550055], tune : "caves", foe-ink : cave-foes, cloudy : false]
  [name : "THORN GARDEN", rows : garden-map, tile-ink : garden-ink, sky : #ffaa55, hill-colours : [#aa5500, #ff5500], tune : "garden", foe-ink : dusk-foes, cloudy : true]
]

-- a map's ground dressed: grass where it meets the air, earth below it; the markers for things are cleared away
dress : [raw |
  raw numbered collect [[r, line] |
    above : (r > 1) [raw @ (r - 1)] else ["#" repeat (line length)]
    line chars numbered collect [[c, ch] |
      (ch = "#") [((above slice [c, c]) = "#") ["D"] else ["G"]] else [("ogzhCFP*" chars has ch) ["."] else [ch]]
    ] join ""
  ]
]
worlds : stages collect [s | dress (s rows)]
world-sizes : worlds collect [w | tilemap size-of [w, tile]]

-- where the markers for a character are, as the top left pixel of their tile
spots : [raw ch | tilemap find [raw, ch] collect [c | tilemap to-pixel [c, tile]]]

-- ================================================================ the songs (each line is eighth notes; music track reads it)
songs : [
  title : [
    bpm : 120, beats : 16
    lead : music track ["E5 . G5 . C6 - B5 . | A5 . G5 . E5 - - . | F5 . A5 . G5 - E5 . | D5 - - . G4 - - .", 0.5]
    bass : music track ["C3 - . . G3 - . . | A2 - . . E3 - . . | F2 - . . C3 - . . | G2 - . . G2 - . .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat hat | kick . hat . snare . hat . | kick . kick . snare . snare snare", 0.5]
  ]
  meadow : [
    bpm : 138, beats : 32
    lead : music track ["G4 . B4 . D5 . B4 . | C5 . E5 . D5 - . . | B4 . D5 . G5 . F#5 . | E5 . D5 . B4 - . . | C5 . C5 . E5 . G5 . | F#5 - E5 . D5 - B4 . | C5 . A4 . B4 . G4 . | A4 - - . D5 - - .", 0.5]
    bass : music track ["G2 - G3 . G2 - G3 . | C3 - C4 . C3 - C4 . | G2 - G3 . G2 - G3 . | E2 - E3 . D3 - D3 . | C3 - C4 . C3 - C4 . | D3 - D4 . D3 - D4 . | E2 - E3 . C3 - C3 . | D3 - D4 . D3 - D3 .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat kick | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . kick . snare snare snare snare", 0.5]
  ]
  caves : [
    bpm : 112, beats : 32
    lead : music track ["A4 . . C5 E5 . . D5 | C5 . B4 . A4 - - . | G4 . . B4 D5 . . C5 | B4 . A4 . G#4 - - . | A4 . . C5 E5 . . A5 | G5 . F5 . E5 - - . | F5 . E5 . D5 . C5 . | B4 - - . E4 - - .", 0.5]
    bass : music track ["A2 - - . A2 - - . | F2 - - . F2 - - . | G2 - - . G2 - - . | E2 - - . E2 - - . | A2 - - . A2 - - . | D2 - - . D2 - - . | F2 - - . G2 - - . | E2 - - . E2 - - .", 0.5]
    drums : music track ["kick . . . hat . . . | kick . . hat snare . . . | kick . . . hat . . . | kick . . hat snare . . . | kick . . . hat . . . | kick . . hat snare . . . | kick . . . hat . . . | kick . kick . snare . hat hat", 0.5]
  ]
  garden : [
    bpm : 150, beats : 32
    lead : music track ["D5 . F#5 . A5 . F#5 . | G5 . B5 . A5 - - . | F#5 . D5 . E5 . C#5 . | D5 - - . A4 - - . | B4 . D5 . G5 . B5 . | A5 . F#5 . D5 - - . | E5 . G5 . F#5 . E5 . | D5 - - . . . . .", 0.5]
    bass : music track ["D3 . D3 . A2 . A2 . | G2 . G2 . A2 . A2 . | D3 . D3 . A2 . A2 . | D3 . A2 . D3 . A2 . | G2 . G2 . G2 . G2 . | D3 . D3 . D3 . D3 . | A2 . A2 . A2 . A2 . | D3 . A2 . D2 - - .", 0.5]
    drums : music track ["kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat hat | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick kick snare snare snare snare crash .", 0.5]
  ]
  clear : [
    bpm : 150, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 - . G5 C6 | - - - - . . . .", 0.5]
    bass : music track ["C3 . G3 . C4 . . . | C3 - - - . . . .", 0.5]
    drums : music track ["kick . . . kick . . . | crash . . . . . . .", 0.5]
  ]
  over : [
    bpm : 100, beats : 8, once : true
    lead : music track ["G4 . F4 . E4 . D4 . | C4 - - - . . . .", 0.5]
    bass : music track ["C3 . B2 . A2 . G2 . | C2 - - - . . . .", 0.5]
  ]
]

-- ================================================================ things in a garden
sprig-at : [spot | [at : spot, speed : 0x0, ground : false, facing : 1, coyote : 0, buffer : 0, jumped : false, fall-speed : 0, hurt-until : -9, spit-wait : 0, landed : false]]
foe : [sort-of spot | [kind : sort-of, at : spot + 2x6, speed : 0x0, home : spot, dir : -1, alive : true, ground : false, wait : 1]]

-- a garden made fresh: Sprig at the start, its foes, dew and sun seeds where the map puts them
begin : [g n now |
  s : stages @ n
  raw : s rows
  home : spots [raw, "P"] @ 1 + 3x2
  foes : spots [raw, "g"] collect [p | foe ["grub", p]] .. (spots [raw, "z"] collect [p | foe ["bee", p]]) .. (spots [raw, "h"] collect [p | foe ["cap", p]])
  flags : spots [raw, "C"]
  g with [
    mode : "intro", mode-at : now, stage : n, hearts : 3, sprig : sprig-at home, spawn : home, foes : foes
    dews : spots [raw, "o"], suns : spots [raw, "*"], got-suns : 0, seeds : [], puffs : []
    cam : pair [home x max 128, 96], flag : (flags length > 0) [flags @ 1] else [99999x0], checked : false
    goal : spots [raw, "F"] @ 1, song : s tune
  ]
]

-- ================================================================ moving
keys-of : [inp | [
  to-left : inp held "left" else false, to-right : inp held "right" else false
  to-up : inp held "up" else false, to-down : inp held "down" else false
  one : inp held "one" else false, two : inp held "two" else false
]]

-- Sprig for one frame: running, jumping (a little late off a ledge still counts, and so does pressing a little early)
step-sprig : [p keys jump-now world dt |
  dir : (keys to-right [1] else [0]) - (keys to-left [1] else [0])
  vx0 : p speed x
  vx1 : (dir != 0) [vx0 + (dir * (p ground [760] else [480]) * dt) max (0 - run-top) min run-top] else [motion approach [vx0, 0, p ground [1000] else [300], dt]]
  buffered : jump-now [0.12] else [p buffer - dt max 0]
  jumping : (p coyote > 0) and (buffered > 0)
  vy0 : jumping [jump-speed] else [p speed y]
  vy1 : ((keys two) not) and (vy0 < -110) [-110] else [vy0]
  vy2 : vy1 + (pull * dt) min fall-top
  moved : tilemap move [[at : p at, speed : pair [vx1, vy2]], hit-size, world, tile, solids, platforms, dt]
  was-up : (p ground) not
  on-ground : moved ground
  new-coyote : on-ground [0.08] else [(jumping [0] else [p coyote]) - dt max 0]
  p with [
    at : moved at, speed : moved speed, ground : on-ground, facing : flipbook facing [vx1, p facing]
    coyote : new-coyote, buffer : jumping [0] else [buffered], jumped : jumping, fall-speed : vy2
    spit-wait : p spit-wait - dt max 0, landed : on-ground and was-up and (vy2 > 200)
  ]
]

walk-grub : [f world dt |
  moved : tilemap move [[at : f at, speed : pair [f dir * 28, f speed y + (pull * dt) min fall-top]], foe-size, world, tile, solids, platforms, dt]
  turn : (moved wall != 0) or (moved ground and (tilemap drop-ahead [world, moved at, foe-size, f dir, tile, "GDB="]))
  new-dir : turn [0 - (f dir)] else [f dir]
  f with [at : moved at, speed : moved speed, dir : new-dir]
]
fly-bee : [f now | phase : f home x / 37, swing : now * 1.3 + phase, f with [at : f home + (pair [swing sin * 26, now * 3.1 + phase sin * 7]), dir : swing cos sign]]
hop-cap : [f world sprig-x dt |
  waited : f wait - dt
  leap : (f ground) and (waited <= 0)
  aim-dir : (sprig-x > (f at x)) [1] else [-1]
  vx : leap [aim-dir * 45] else [(f ground) [0] else [f speed x]]
  vy : leap [-230] else [f speed y + (pull * dt) min fall-top]
  moved : tilemap move [[at : f at, speed : pair [vx, vy]], foe-size, world, tile, solids, platforms, dt]
  f with [at : moved at, speed : moved speed, ground : moved ground, wait : leap [1.4] else [waited], dir : aim-dir]
]
move-foe : [f world sprig-x cam-x now dt |
  near : (f at x - cam-x) abs < 190
  (f alive and near) [
    (f kind = "grub") [walk-grub [f, world, dt]] else [(f kind = "bee") [fly-bee [f, now]] else [hop-cap [f, world, sprig-x, dt]]]
  ] else [f]
]

-- a puff of bits where something happened
burst-at : [puffs spot colours now n | puffs .. (particles burst [spot, n, 70, 0.45, colours, now, now * 997 floor + n])]

-- one frame of play
play : [g keys one-now two-now dt now |
  s : stages @ (g stage)
  world : worlds @ (g stage)
  p : step-sprig [g sprig, keys, two-now, world, dt]
  sprig-box : [at : p at, size : hit-size]
  -- seeds: up to two in the air, each for under a second, stopped by walls
  spit : one-now and (p spit-wait <= 0) and (g seeds length < 2)
  nose : p at + (pair [(p facing > 0) [10] else [-6], 5])
  thrown : spit [g seeds .. [[at : nose, vx : p facing * 170, born : now]]] else [g seeds]
  flying : thrown collect [d | d with [at : d at + (pair [d vx * dt, 0])]] keep [d | (now - (d born) < 0.7) and ((tilemap solid [world, d at + 3x2, tile, solids]) not)]
  -- foes: walk, fly, hop; stomped from above, struck by a seed, or a hurt to Sprig
  moved : g foes collect [f | move-foe [f, world, p at x, g cam x, now, dt]]
  safe : now < (p hurt-until)
  judged : moved collect [f |
    foe-box : [at : f at, size : foe-size]
    contact : (f alive) and (collide boxes [sprig-box, foe-box])
    stomp : contact and (p fall-speed > 0) and (p at y + 14 - (f at y) < 10)
    shot : (f alive) and (flying count [d | collide boxes [[at : d at, size : 6x4], foe-box]] > 0)
    [f, contact and (stomp not), stomp, shot]
  ]
  stomps : judged count [j | j @ 3]
  shots : judged count [j | (j @ 4) and ((j @ 3) not)]
  bumped : (safe not) and (judged count [j | j @ 2] > 0)
  thorned : (safe not) and (tilemap touches [world, p at, hit-size, tile, "^"])
  foes-after : judged collect [j | ((j @ 3) or (j @ 4)) [j @ 1 with [alive : false]] else [j @ 1]]
  seeds-after : flying keep [d | moved count [f | (f alive) and (collide boxes [[at : d at, size : 6x4], [at : f at, size : foe-size]])] = 0]
  -- dew and sun seeds
  dew-hit : [d | collide boxes [sprig-box, [at : d + 4x3, size : 8x10]]]
  sun-hit : [d | collide boxes [sprig-box, [at : d + 2x2, size : 12x10]]]
  dew-taken : g dews count [d | dew-hit d]
  sun-taken : g suns count [d | sun-hit d]
  dew-total : g dew-count + dew-taken
  extra : dew-total >= 100
  -- hurt: a heart lost, a hop back and a moment of safety
  hurt : bumped or thorned
  hearts-left : hurt [g hearts - 1] else [g hearts]
  fell : p at y > 210
  bounce : (stomps > 0) [-230] else [hurt [-200] else [p speed y]]
  knock : hurt [(p facing > 0) [-70] else [70]] else [p speed x]
  p2 : p with [speed : pair [knock, bounce], hurt-until : hurt [now + 1.4] else [p hurt-until], spit-wait : spit [0.3] else [p spit-wait]]
  -- the flag and the flower
  reached-flag : (g checked not) and (p at x >= (g flag x))
  at-goal : collide boxes [sprig-box, [at : g goal + 4x0, size : 8x16]]
  points : dew-taken * 10 + (sun-taken * 1000) + (stomps * 100) + (shots * 100)
  dying : fell or (hearts-left <= 0)
  -- the camera keeps Sprig a little ahead of the middle
  aim : pair [p at x + 5 + (p facing * 24), 96]
  cam-next : camera keep-in [camera follow [g cam, aim, 0.95, 12, dt], 256x192, world-sizes @ (g stage)]
  suns-now : g got-suns + sun-taken
  struck : (stomps + shots > 0) [judged keep [j | (j @ 3) or (j @ 4)] collect-flat [j | particles burst [j @ 1 at + 6x5, 8, 80, 0.5, [#ffffff, #ffaa00], now, now * 991 floor]]] else [[]]
  sparkle : (dew-taken > 0) [particles burst [p at + 5x4, 6, 50, 0.4, [#55ffff, #ffffff], now, now * 983 floor]] else [[]]
  dust : p landed [particles burst [p at + 5x14, 4, 30, 0.3, [#aaaaaa], now, now * 977 floor]] else [[]]
  puffs-made : g puffs .. struck .. sparkle .. dust
  p jumped
    zzfx preset "jump"
  spit
    zzfx preset "laser"
  stomps + shots > 0
    zzfx preset "hit"
  dew-taken > 0
    zzfx preset "coin"
  sun-taken > 0
    zzfx preset "power"
  extra
    zzfx preset ["power", 2]
  hurt and (dying not)
    zzfx preset "hurt"
  dying
    zzfx preset "explode"
    shake 6
  reached-flag
    zzfx preset "select"
  at-goal
    zzfx preset "power"
  g with [
    sprig : p2, foes : foes-after, seeds : seeds-after, hearts : hearts-left, cam : cam-next
    dews : g dews keep [d | dew-hit d not], suns : g suns keep [d | sun-hit d not], got-suns : suns-now
    dew-count : extra [dew-total - 100] else [dew-total], lives : extra [g lives + 1] else [g lives]
    score : g score + points + (at-goal [suns-now * 500 + 1000] else [0])
    spawn : reached-flag [g flag + 3x2] else [g spawn], checked : (g checked) or reached-flag
    puffs : particles step [puffs-made, 260, dt, now]
    mode : dying ["dying"] else [at-goal ["clear"] else ["play"]], mode-at : (dying or at-goal) [now] else [g mode-at]
    song : dying ["quiet"] else [at-goal ["clear"] else [g song]]
  ]
]

-- after a fall: back to the last flag with a full set of hearts, or the end of the game
after-death : [g now |
  (g lives > 1) [
    s : stages @ (g stage)
    g with [mode : "play", mode-at : now, lives : g lives - 1, hearts : 3, sprig : sprig-at (g spawn), seeds : [], cam : pair [g spawn x max 128, 96], song : s tune]
  ] else [g with [mode : "over", mode-at : now, song : "over"]]
]
next-stage : [g now | (g stage < (stages length)) [begin [g, g stage + 1, now]] else [g with [mode : "end", mode-at : now, song : "title"]]]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  prev : [one : false, two : false]
  stage : 1
  score : 0
  lives : 3
  dew-count : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"

update : [game |
  g : game
  keys : keys-of (g input)
  one-now : (keys one) and ((g prev one) not)
  two-now : (keys two) and ((g prev two) not)
  pressed : one-now or two-now
  now : g clock
  dt : g dt
  since : now - (g mode-at)
  after : (g mode = "play") [play [g, keys, one-now, two-now, dt, now]] else [
    (g mode = "title") [pressed [begin [g with [score : 0, lives : 3, dew-count : 0], 1, now]] else [g]] else [
      (g mode = "intro") [(since > 2.2) [g with [mode : "play", mode-at : now]] else [g]] else [
        (g mode = "dying") [(since > 1.8) [after-death [g, now]] else [g]] else [
          (g mode = "clear") [(since > 4.6) [next-stage [g, now]] else [g]] else [
            ((since > 2) and pressed) or (since > 12) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
          ]
        ]
      ]
    ]
  ]
  (g mode = "title") and pressed
    zzfx preset "select"
  top : after score max (after best)
  after with [prev : keys, best : top, keep : [best : top]]
]

-- ================================================================ drawing
hills : [s left-edge |
  far : left-edge * 0.25 % 96
  near : left-edge * 0.5 % 128
  range 5 each [i | circle [i - 1 * 96 - far + 30, 200, 60 + (i % 2 * 16), s hill-colours @ 2]]
  range 4 each [i | circle [i - 1 * 128 - near + 64, 214, 54 + (i % 2 * 10), s hill-colours @ 1]]
]
clouds : [left-edge now |
  range 3 each [i | sprite [cloud-art, i - 1 * 110 - (left-edge * 0.15) - (now * 3) % 330 - 40, 22 + (i * 13 % 30), sprite-ink, false]]
]
draw-world : [g |
  s : stages @ (g stage)
  now : g clock
  left-edge : g cam x - 128
  on-screen : [x | (x - left-edge > -32) and (x - left-edge < 288)]
  p : g sprig
  clear (s sky)
  hills [s, left-edge]
  s cloudy
    clouds [left-edge, now]
  tiles [worlds @ (g stage), tile-set, s tile-ink, 0 - left-edge, 0]
  sprite [(g mode = "clear") [bloom-art] else [bud-art], g goal x - left-edge, g goal y - 8, sprite-ink, false]
  sprite [(g checked) [flag-on] else [flag-off], g flag x - left-edge + 2, g flag y, sprite-ink, false]
  g dews keep [d | on-screen (d x)] each [d | sprite [dew-art, d x + 4 - left-edge, d y + 3 + (motion bob [2, 0.8, now + (d x / 50)]), sprite-ink, false]]
  g suns keep [d | on-screen (d x)] each [d | sprite [sun-art, d x + 2 - left-edge, d y + 2 + (motion bob [3, 0.6, now]), sprite-ink, false]]
  g foes keep [f | (f alive) and (on-screen (f at x))] each [f |
    art : (f kind = "grub") [flipbook pick [[grub-a, grub-b], 6, now]] else [(f kind = "bee") [flipbook pick [[bee-a, bee-b], 14, now]] else [cap-art]]
    sprite [art, f at x - 2 - left-edge, f at y - 6, s foe-ink, f dir < 0]
  ]
  g seeds each [d | sprite [seed-art, d at x - left-edge, d at y, sprite-ink, false]]
  hidden : (now < (p hurt-until)) and (now * 12 floor % 2 = 0)
  art : (p ground not) [sprig-jump] else [(p speed x abs > 10) [flipbook pick [[sprig-run, sprig-step], 10, now]] else [sprig-stand]]
  hidden not
    sprite [art, p at x - 3 - left-edge, p at y - 2, (g mode = "dying") [flash-ink] else [sprite-ink], p facing < 0]
  g puffs each [q | circle [q at x - left-edge, q at y, particles fade [q, now] * 3 + 0.5, q colour]]
]
hud : [g |
  rect [0, 0, 256, 12, #000000]
  text ["SC " .. (g score str pad-left [6, "0"]), 4, 6, 8, #ffffff, "left"]
  range 3 each [i | sprite [(i <= (g hearts)) [heart-full] else [heart-empty], i - 1 * 9 + 96, 3, sprite-ink, false]]
  range 3 each [i | rect [i - 1 * 9 + 128, 3, 6, 6, (i <= (g got-suns)) [#ffff00] else [#555555]]]
  sprite [dew-art, 160, 1, sprite-ink, false]
  text ["[g dew-count]", 170, 6, 8, #55ffff, "left"]
  text ["x[g lives]", 252, 6, 8, #aaff55, "right"]
]
banner : [line y size colour | text [line, 129, y + 1, size, #000000], text [line, 128, y, size, colour]]
draw-title : [g |
  now : g clock
  clear #55aaff
  hills [stages @ 1, now * 40]
  clouds [now * 40, now]
  rect [0, 160, 256, 32, #00aa00]
  rect [0, 160, 256, 3, #55ff55]
  drop : ease out-bounce (now / 1.2 min 1)
  banner ["SPRIG", drop * 52 + 8, 32, #ffff55]
  banner ["A SEEDLING'S JOURNEY", 78, 8, #ffffff]
  (now * 2 floor % 2 = 0)
    banner ["PRESS 1 OR 2", 112, 8, #ffffff]
  best-text : g best str pad-left [6, "0"]
  banner ["BEST [best-text]", 132, 8, #aaff55]
  sprite [flipbook pick [[sprig-run, sprig-step], 10, now], now * 50 % 300 - 24, 144, sprite-ink, false]
  text ["D-PAD RUN  2 JUMP  1 SPIT", 128, 182, 8, #003300]
]
draw : [game |
  g : game
  now : g clock
  since : now - (g mode-at)
  g mode = "title"
    draw-title g
  g mode != "title"
    draw-world g
    hud g
  g mode = "intro"
    rect [0, 70, 256, 52, #000000]
    banner ["GARDEN [g stage]", 86, 16, #ffff55]
    banner [(stages @ (g stage)) name, 108, 8, #ffffff]
  g mode = "dying"
    banner ["OUCH!", 90, 16, #ff5555]
  g mode = "clear"
    rect [0, 64, 256, 64, #000000]
    banner ["GARDEN CLEAR!", 80, 16, #aaff55]
    banner ["SUN SEEDS [g got-suns] OF 3", 102, 8, #ffff55]
    banner ["BONUS [g got-suns * 500 + 1000]", 116, 8, #ffffff]
  g mode = "over"
    rect [0, 70, 256, 52, #000000]
    banner ["GAME OVER", 88, 16, #ff5555]
    banner ["SCORE [g score]", 110, 8, #ffffff]
  g mode = "end"
    rect [0, 40, 256, 112, #000000]
    banner ["THE GARDENS BLOOM", 64, 8, #ff55aa]
    banner ["SPRIG FOUND THE SUN", 84, 8, #aaff55]
    banner ["SCORE [g score]", 108, 8, #ffff55]
    banner ["THANK YOU FOR PLAYING", 132, 8, #ffffff]
]
