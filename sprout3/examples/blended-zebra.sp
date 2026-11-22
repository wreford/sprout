-- BLENDED ZEBRA 8: the endless black, white and red deckbuilder, made small for an 8-bit handheld. You are a zebra
-- walking up a savanna that never ends. Each floor, pick a door. In a fight you get five cards and three energy a
-- turn: attacks hurt the foe, blocks keep you safe for this turn, and the foe always shows what it will do next. At an
-- OASIS, blend two of your cards into one that does both. Every fifth floor is a boss. How far can you climb?
-- The D-pad chooses, button 1 plays or picks, button 2 ends the turn or goes back.

-- ================================================================ the art
ink : [k : #000000, w : #ffffff, r : #ff0000, g : #aaaaaa, d : #555555, o : #ffaa00, y : #ffff55, s : #ffaa55, c : #00aa00, e : #55ff55]
hurt-ink : ink with [w : #ff5555, g : #ff5555, s : #ff5555, c : #ff5555]
zebra-art : [
  "..........kk...."
  ".........kwwk..."
  "........kwkwk..."
  ".......kwkwwwk.."
  "......kwkwkrwk.."
  ".....kwkwkwwwwk."
  "....kwkwkwkkkkk."
  "...kwkwkwkwk...."
  "..kwkwkwkwkwk..."
  ".kwkwkwkwkwkwk.."
  ".kwkwkwkwkwkwk.."
  ".kwkwkwkwkwkwk.."
  "..kkwkkkkkwkk..."
  "..kwk....kwk...."
  "..kwk....kwk...."
  "..kkk....kkk...."
]
hyena-art : [
  "..kk........kk.."
  ".kgdk......kdgk."
  ".kgddk....kddgk."
  "..kggkkkkkkggk.."
  "..kgggdggdgggk.."
  ".kggdggggggdggk."
  ".kgrrggggggrrgk."
  ".kgkrggggggrkgk."
  "..kgggkkkkgggk.."
  "..kggkwwwwkggk.."
  "...kgkwkkwkgk..."
  "...kggggggggk..."
  "....kkggggkk...."
  ".....kkkkkk....."
  "................"
  "................"
]
vulture-art : [
  "................"
  "...kkkkkkkkkk..."
  "..krrrrrrrrrrk.."
  ".krrrrrrrrrrrrk."
  ".krkkrrrrrrkkrk."
  ".krkwrrrrrrwkrk."
  "..krrrrkkrrrrk.."
  "...kkkkkkkkkk..."
  "......kook......"
  ".....kooook....."
  "..kkk.kook.kkk.."
  ".kwwwkkkkkkwwwk."
  "kwwwwwwwwwwwwwwk"
  "kwkwkwkwwkwkwkwk"
  ".kkkkkkkkkkkkkk."
  "................"
]
warthog-art : [
  "................"
  "..kk........kk.."
  ".kddk......kddk."
  ".kdddkkkkkkdddk."
  "..kddddddddddk.."
  "..kdkddddddkdk.."
  "..kddddddddddk.."
  ".kwddddddddddwk."
  ".kwkddddddddkwk."
  "..kkdkkkkkkdkk.."
  "...kdggggggdk..."
  "...kdgkggkgdk..."
  "....kggggggk...."
  ".....kkkkkk....."
  "................"
  "................"
]
croc-art : [
  "................"
  "................"
  "..kk........kk.."
  ".kcwk......kwck."
  ".kckkkkkkkkkkck."
  ".kcccccccccccck."
  "kcccccccccccccck"
  "kcecccceecccceck"
  "kcccccccccccccck"
  "kwkwkwkwwkwkwkwk"
  "kkkkkkkkkkkkkkkk"
  "kwkwkwkwwkwkwkwk"
  "kcccccccccccccck"
  ".kkkkkkkkkkkkkk."
  "................"
  "................"
]
lion-art : [
  "..oooooooooooo.."
  ".ooyyyyyyyyyyoo."
  "ooyykkkkkkkkyyoo"
  "oyyksssssssskyyo"
  "oykssss..sssskyo"
  "oyksrksssskrskyo"
  "oyksssssssssskyo"
  "oyksssskksssskyo"
  "oyyksskssksskyyo"
  "ooyksssssssskyoo"
  ".ooykksssskkyoo."
  "..ooyykkkkyyoo.."
  "...oooyyyyooo..."
  ".....oooooo....."
  "................"
  "................"
]

-- ================================================================ the cards: what each costs and does; a blend does both
card-book : [
  bite : [name : "BITE", cost : 1, hit : 6, times : 1, block : 0, heal : 0, more : 0, level : 0]
  kick : [name : "KICK", cost : 2, hit : 11, times : 1, block : 0, heal : 0, more : 0, level : 0]
  hide : [name : "HIDE", cost : 1, hit : 0, times : 1, block : 6, heal : 0, more : 0, level : 0]
  stomp : [name : "STOMP", cost : 1, hit : 3, times : 2, block : 0, heal : 0, more : 0, level : 0]
  graze : [name : "GRAZE", cost : 1, hit : 0, times : 1, block : 0, heal : 4, more : 1, level : 0]
  bray : [name : "BRAY", cost : 0, hit : 0, times : 1, block : 0, heal : 0, more : 2, level : 0]
  dash : [name : "DASH", cost : 1, hit : 4, times : 1, block : 4, heal : 0, more : 0, level : 0]
  ram : [name : "RAM", cost : 2, hit : 7, times : 1, block : 7, heal : 0, more : 0, level : 0]
  hooves : [name : "HOOF", cost : 3, hit : 6, times : 4, block : 0, heal : 0, more : 0, level : 0]
]
-- an ancestral recipe: BITE blended with KICK makes CRUSH, stronger than any plain blend
crush : [name : "CRUSH", cost : 2, hit : 20, times : 1, block : 0, heal : 0, more : 0, level : 2]
starter : ["bite", "bite", "bite", "bite", "hide", "hide", "hide", "kick"] collect [n | card-book get-in [n]]
reward-names : ["stomp", "graze", "bray", "dash", "ram", "hooves", "bite", "kick", "hide"]

-- two cards blended into one: the cost of the dearer, everything both do, and a name made of both
blend-of : [a b |
  recipe : ((a name = "BITE") and (b name = "KICK")) or ((a name = "KICK") and (b name = "BITE"))
  recipe [crush] else [
    [
      name : prose blend [a name lower, b name lower] upper, cost : a cost max (b cost), hit : a hit + (b hit), times : a times max (b times)
      block : a block + (b block), heal : a heal + (b heal), more : a more + (b more), level : a level max (b level) + 1
    ]
  ]
]
-- what a card does, in two short lines
card-lines : [c |
  said : [
    (c hit > 0) [(c times > 1) ["[c hit]x[c times]"] else ["[c hit]DMG"]] else [""]
    (c block > 0) ["[c block]BLK"] else [""]
    (c heal > 0) ["+[c heal]HP"] else [""]
    (c more > 0) ["+[c more]CRD"] else [""]
  ]
  said keep [t | t != ""] take 2
]

-- ================================================================ the foes: their faces, and the moves they take in turn
foe-book : [
  hyena : [title : "HYENA", face : hyena-art, life : 22, moves : [["hit", 6, 1], ["hit", 3, 2], ["hit", 8, 1]]]
  vulture : [title : "VULTURE", face : vulture-art, life : 18, moves : [["hit", 9, 1], ["guard", 6, 1], ["hit", 5, 2]]]
  warthog : [title : "WARTHOG", face : warthog-art, life : 30, moves : [["hit", 7, 1], ["guard", 8, 1], ["hit", 14, 1]]]
  croc : [title : "CROC", face : croc-art, life : 38, moves : [["guard", 10, 1], ["hit", 13, 1], ["hit", 4, 3]]]
  lion : [title : "OLD LION", face : lion-art, life : 60, moves : [["roar", 3, 1], ["hit", 11, 1], ["hit", 4, 3], ["guard", 12, 1], ["hit", 18, 1]]]
]
foe-for : [floor | cond [floor % 5 = 0, "lion", floor < 3, seeded pick [["hyena", "vulture"], floor * 31], any, seeded pick [["hyena", "vulture", "warthog", "croc"], floor * 31]]]
doors-for : [floor | cond [floor % 5 = 0, ["BOSS"], floor % 3 = 0, ["FIGHT", "OASIS"], any, ["FIGHT"]]]

-- ================================================================ the songs
songs : [
  title : [
    bpm : 112, beats : 16
    lead : music track ["A4 . E5 . A5 - G5 . | F5 . E5 . D5 - - . | C5 . E5 . A5 . G5 . | E5 - - . . . . .", 0.5]
    bass : music track ["A2 - . A2 E2 - . . | D2 - . D2 A2 - . . | F2 - . F2 C2 - . . | E2 - . E2 E2 - . .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick kick hat . snare . snare .", 0.5]
  ]
  climb : [
    bpm : 128, beats : 32
    lead : music track ["E5 . A5 . E5 . C5 . | D5 . E5 . C5 - - . | B4 . E5 . B4 . G4 . | A4 - - . . . . . | E5 . A5 . C6 . B5 . | A5 . G5 . E5 - - . | F5 . E5 . D5 . B4 . | A4 - - . E4 - - .", 0.5]
    bass : music track ["A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | G2 . G3 . G2 . G3 . | A2 . A3 . E2 . E3 . | A2 . A3 . A2 . A3 . | F2 . F3 . F2 . F3 . | D2 . D3 . E2 . E3 . | A2 . E2 . A2 . . .", 0.5]
    drums : music track ["kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat hat | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick . hat kick snare . hat . | kick kick snare kick snare snare crash .", 0.5]
  ]
  boss : [
    bpm : 150, beats : 16
    lead : music track ["A4 A4 C5 A4 D#5 . D5 . | A4 A4 C5 A4 F5 . E5 . | A4 A4 C5 A4 D#5 . D5 . | C5 . B4 . G#4 - - .", 0.5]
    bass : music track ["A1 A2 A1 A2 A1 A2 A1 A2 | A1 A2 A1 A2 A1 A2 A1 A2 | D2 D3 D2 D3 D2 D3 D2 D3 | E2 E3 E2 E3 E2 E3 E2 E3", 0.5]
    drums : music track ["kick snare kick snare kick snare kick snare | kick snare kick snare kick snare kick snare | kick snare kick snare kick snare kick snare | kick kick snare kick snare snare crash .", 0.5]
  ]
  fallen : [
    bpm : 90, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . B4 . | A4 - - - . . . .", 0.5]
    bass : music track ["A2 . G2 . F2 . E2 . | A1 - - - . . . .", 0.5]
  ]
]

-- ================================================================ a fight
begin-fight : [g now |
  kind : foe-for (g floor)
  f : foe-book get-in [kind]
  grow : g floor * 0.07 + 1
  full : f life * grow round
  dealt : piles draw [piles fresh [g deck, g floor * 977], 5, g floor * 13]
  g with [
    mode : "fight", mode-at : now, cursor : 1, song : (kind = "lion") ["boss"] else ["climb"]
    fight : [kind : kind, title : f title, face : f face, life : full, most-life : full, guard : 0, power : g floor / 4 floor, step : 1, moves : f moves, pile : dealt, energy : 3, shield : 0, turn : 1, said : ""]
  ]
]

-- the foe's move this turn, as words for the intent line
intent : [fi | m : fi moves @ (fi step - 1 % (fi moves length) + 1), n : m @ 2 + ((m @ 1 = "hit") [fi power] else [0]), cond [m @ 1 = "hit", (m @ 3 > 1) ["ATTACK [n]x[m @ 3]"] else ["ATTACK [n]"], m @ 1 = "guard", "GUARD [n]", any, "ROAR +[n]"]]

-- play the card at k: its cost paid, its hits through the foe's guard, its block, heal and extra cards
play-card : [g k now |
  fi : g fight
  c : fi pile hand @ k
  can : (c != false) and (fi energy >= (c cost))
  can [
    total : c hit * (c times)
    soaked : total min (fi guard)
    pile-after : piles draw [piles play [fi pile, k], c more, now * 1000 floor]
    g with [
      hp : g hp + (c heal) min (g most)
      fight : fi with [life : fi life - (total - soaked), guard : fi guard - soaked, energy : fi energy - (c cost), shield : fi shield + (c block), pile : pile-after, said : c name]
      cursor : 1
    ]
  ] else [g]
]

-- the end of the turn: the foe makes its move, then a fresh hand
end-turn : [g now |
  fi : g fight
  m : fi moves @ (fi step - 1 % (fi moves length) + 1)
  hits : (m @ 1 = "hit") [m @ 2 + (fi power) * (m @ 3)] else [0]
  through : hits - (fi shield) max 0
  dealt : piles draw [piles end-turn (fi pile), 5, fi turn * 101 + (g floor * 7)]
  g with [
    hp : g hp - through, cursor : 1
    fight : fi with [
      guard : (m @ 1 = "guard") [m @ 2] else [0], power : fi power + ((m @ 1 = "roar") [m @ 2] else [0]), step : fi step + 1
      pile : dealt, energy : 3, shield : 0, turn : fi turn + 1, said : (through > 0) ["-[through] HP"] else ["BLOCKED"]
    ]
  ]
]

-- three cards to choose from after a win
offers-for : [floor | range 3 collect [k | card-book get-in [seeded pick [reward-names, floor * 53 + (k * 7)]]]]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  prev : [one : false, two : false, go-left : false, go-right : false, go-up : false, go-down : false]
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  floor : 1
  cursor : 1

keys-of : [inp | [
  one : inp held "one" else false, two : inp held "two" else false, go-left : inp held "left" else false
  go-right : inp held "right" else false, go-up : inp held "up" else false, go-down : inp held "down" else false
]]

new-run : [g now | g with [mode : "map", mode-at : now, floor : 1, hp : 50, most : 50, deck : starter, cursor : 1, song : "climb", picks : []]]
next-floor : [g now | g with [mode : "map", mode-at : now, floor : g floor + 1, cursor : 1, song : "climb", picks : []]]

update : [game |
  g : game
  k : keys-of (g input)
  now-of : [name | (k get-in [name]) and ((g prev get-in [name]) not)]
  b1 : now-of "one"
  b2 : now-of "two"
  step-x : (now-of "go-right" [1] else [0]) - (now-of "go-left" [1] else [0])
  step-y : (now-of "go-down" [1] else [0]) - (now-of "go-up" [1] else [0])
  now : g clock
  since : now - (g mode-at)
  -- the title, and a fall
  after : cond [
    g mode = "title", b1 or b2 [new-run [g, now]] else [g]
    g mode = "fallen", ((since > 2) and (b1 or b2)) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    -- the road: pick a door
    g mode = "map", (
      doors : doors-for (g floor)
      pick : g cursor + step-x max 1 min (doors length)
      chosen : doors @ pick
      b1 [cond [chosen = "OASIS", g with [mode : "oasis", mode-at : now, cursor : 1], any, begin-fight [g, now]]] else [g with [cursor : pick]]
    )
    -- a fight: choose a card, play it, end the turn
    g mode = "fight", (
      fi : g fight
      hand-size : fi pile hand length
      pick : g cursor + step-x max 1 min (hand-size max 1)
      played : b1 [play-card [g with [cursor : pick], pick, now]] else [g with [cursor : pick]]
      ended : (b2 and (b1 not)) [end-turn [played, now]] else [played]
      cond [
        ended fight life <= 0, ended with [mode : "won", mode-at : now]
        ended hp <= 0, ended with [mode : "fallen", mode-at : now, song : "fallen"]
        any, ended
      ]
    )
    g mode = "won", (since > 1.2) [g with [mode : "reward", mode-at : now, offer : offers-for (g floor), cursor : 1]] else [g]
    -- after a win: take one of three cards, or none
    g mode = "reward", (
      pick : g cursor + step-x max 1 min 4
      b1 [next-floor [(pick <= 3) [g with [deck : g deck .. [g offer @ pick]]] else [g], now]] else [g with [cursor : pick]]
    )
    -- the oasis: rest, or blend two cards
    g mode = "oasis", (
      pick : g cursor + step-x max 1 min 2
      b1 [(pick = 1) [g with [mode : "blend", mode-at : now, cursor : 1, picks : []]] else [next-floor [g with [hp : g most * 0.3 + (g hp) round min (g most)], now]]] else [g with [cursor : pick]]
    )
    g mode = "blend", (
      n : g deck length
      pick : g cursor + step-x + (step-y * 4) max 1 min n
      chosen : g deck @ pick
      ready : g picks length = 2
      cond [
        ready and b1, (
          a : g deck @ (g picks @ 1)
          b : g deck @ (g picks @ 2)
          rest : g deck numbered keep [[i, c] | (g picks has i) not] collect [[i, c] | c]
          next-floor [g with [deck : rest .. [blend-of [a, b]]], now]
        )
        b2, (g picks length > 0) [g with [picks : g picks take (g picks length - 1)]] else [g with [mode : "oasis", mode-at : now, cursor : 1]]
        b1 and (chosen level < 2) and ((g picks has pick) not), g with [picks : g picks .. [pick], cursor : pick]
        any, g with [cursor : pick]
      ]
    )
    any, g
  ]
  b1 or b2 or (step-x != 0) or (step-y != 0)
    zzfx preset ["blip", 1.4]
  (g mode = "fight") and (after mode = "fight") and (after fight life < (g fight life))
    zzfx preset "hit"
  (g mode = "fight") and (after hp < (g hp))
    zzfx preset "hurt"
    shake 4
  (g mode = "fight") and (after mode = "won")
    zzfx preset "explode"
  (g mode = "blend") and (after deck length < (g deck length))
    zzfx preset "power"
  top : after floor max (after best)
  after with [prev : k, best : top, keep : [best : top]]
]

-- ================================================================ drawing
banner : [line y size colour | text [line, 129, y + 1, size, #000000], text [line, 128, y, size, colour]]
hud : [g | rect [0, 0, 256, 12, #ffffff], text ["FLOOR [g floor]", 4, 6, 8, #000000, "left"], text ["HP [g hp]/[g most]", 128, 6, 8, #ff0000], text ["BEST [g best]", 252, 6, 8, #000000, "right"]]
card : [c x y lit dim |
  lines : card-lines c
  top-line : (lines length > 0) [lines @ 1] else [""]
  low-line : (lines length > 1) [lines @ 2] else [""]
  rect [x, y, 46, 58, lit [#ff0000] else [#000000]]
  rect [x + 2, y + 2, 42, 54, dim [#aaaaaa] else [#ffffff]]
  rect [x + 2, y + 42, 42, 14, #aa0000]
  circle [x + 8, y + 8, 6, #ff0000]
  text ["[c cost]", x + 8, y + 9, 8, #ffffff]
  range (c level) each [i | rect [x + 41 - (i * 6), y + 5, 4, 4, #ff0000]]
  text [c name chars take 5 join "", x + 23, y + 22, 8, #000000]
  text [low-line, x + 23, y + 34, 8, #555555]
  text [top-line, x + 23, y + 49, 8, #ffffff]
]
draw-title : [g |
  now : g clock
  clear #ffffff
  range 10 each [i | rect [i * 28 - 8 + ((now * 2 + i) sin * 3), 0, 12, 192, #000000]]
  rect [20, 22, 216, 104, #000000]
  banner ["BLENDED", 48, 24, #ffffff]
  banner ["ZEBRA", 78, 24, #ff0000]
  banner ["THE ENDLESS CLIMB", 108, 8, #aaaaaa]
  sprite [zebra-art, 104, 134 + ((now * 3) sin * 2), ink, false, 3]
  rect [56, 182, 144, 10, #000000]
  (now * 2 floor % 2 = 0)
    text ["PRESS 1 OR 2", 128, 187, 8, #ffffff]
  g best > 1
    text ["BEST FLOOR [g best]", 128, 14, 8, #ff0000]
]
draw-map : [g |
  now : g clock
  doors : doors-for (g floor)
  n : doors length
  rect [0, 150, 256, 42, #aa0000]
  range 8 each [i | rect [i * 40 - (now * 12 % 40), 156, 24, 3, #550000]]
  banner ["FLOOR [g floor]", 34, 16, #ffffff]
  doors numbered each [[i, d] |
    x : i - (n + 1 / 2) * 80 + 104
    colour : cond [d = "OASIS", #0055aa, d = "BOSS", #550000, any, #aa0000]
    picked : i = (g cursor)
    rect [x - 2, 62, 52, 70, picked [#ffffff] else [#555555]]
    rect [x, 64, 48, 66, colour]
    rect [x + 6, 72, 36, 58, #000000]
    text [d, x + 24, 142, 8, picked [#ffffff] else [#aaaaaa]]
    picked
      text ["V", x + 24, 54 + ((now * 6) sin * 2), 8, #ff0000]
  ]
  sprite [zebra-art, 8, 122 + ((now * 8) sin abs * -2), ink, false, 2]
  text ["1 OPEN THE DOOR", 128, 172, 8, #ffffff]
]
draw-fight : [g |
  fi : g fight
  now : g clock
  struck : (fi said != "") and (now - (g mode-at) < 0)
  said-at : fi turn
  banner [fi title, 22, 8, #ffffff]
  words : intent fi
  text [words, 128, 34, 8, (words starts-with "ATTACK") [#ff5555] else [#55ffff]]
  sprite [fi face, 104, 42, (g mode = "won") [hurt-ink] else [ink], false, 3]
  rect [88, 94, 80, 5, #555555]
  rect [88, 94, 80 * (fi life max 0) / (fi most-life), 5, #ff0000]
  text ["[fi life max 0]/[fi most-life]", 128, 106, 8, #ffffff]
  fi guard > 0
    text ["GUARD [fi guard]", 214, 66, 8, #55ffff]
  sprite [zebra-art, 12, 64, ink, false, 2]
  fi shield > 0
    text ["BLK [fi shield]", 28, 104, 8, #aaaaaa]
  text ["ENERGY [fi energy]", 4, 118, 8, #ffff55, "left"]
  text [fi said, 252, 118, 8, #ffffff, "right"]
  fi pile hand numbered each [[i, c] |
    picked : i = (g cursor)
    card [c, i - 1 * 50 + 4, picked [124] else [130], picked, c cost > (fi energy)]
  ]
  g mode = "won"
    banner ["VICTORY", 70, 16, #ff0000]
]
draw-reward : [g |
  banner ["TAKE A CARD", 30, 16, #ffffff]
  g offer numbered each [[i, c] | card [c, i - 1 * 56 + 34, 62 - ((i = (g cursor)) [6] else [0]), i = (g cursor), false]]
  skip-lit : g cursor = 4
  rect [204, 80, 44, 20, skip-lit [#ff0000] else [#555555]]
  text ["SKIP", 226, 90, 8, #ffffff]
  text ["1 TAKE IT", 128, 150, 8, #aaaaaa]
]
draw-oasis : [g |
  banner ["OASIS", 30, 16, #55ffff]
  rect [0, 120, 256, 30, #0055aa]
  [["BLEND", "TWO CARDS INTO ONE"], ["REST", "HEAL A THIRD"]] numbered each [[i, [word, line]] |
    x : i - 1 * 124 + 10
    lit : i = (g cursor)
    rect [x, 52, 112, 52, lit [#ffffff] else [#555555]]
    rect [x + 2, 54, 108, 48, #000000]
    text [word, x + 56, 68, 16, lit [#ff0000] else [#ffffff]]
    text [line, x + 56, 90, 8, #aaaaaa]
  ]
]
draw-blend : [g |
  banner ["PICK TWO TO BLEND", 22, 8, #ffffff]
  first-row : g cursor - 1 / 4 floor - 2 max 0
  g deck numbered keep [[i, c] | (i - 1 / 4 floor >= first-row) and (i - 1 / 4 floor < (first-row + 4))] each [[i, c] |
    x : i - 1 % 4 * 62 + 4
    y : i - 1 / 4 floor - first-row * 30 + 34
    taken : g picks has i
    lit : i = (g cursor)
    rect [x, y, 58, 26, lit [#ffffff] else [(c level >= 2) [#333333] else [#555555]]]
    rect [x + 1, y + 1, 56, 24, taken [#aa0000] else [#000000]]
    text [c name chars take 5 join "", x + 30, y + 9, 8, #ffffff]
    text ["[c cost]", x + 8, y + 19, 8, #ff5555]
    range (c level) each [k | rect [x + 52 - (k * 6), y + 17, 4, 4, #ff0000]]
  ]
  ready : g picks length = 2
  ready
    made : blend-of [g deck @ (g picks @ 1), g deck @ (g picks @ 2)]
    rect [0, 158, 256, 34, #000000]
    does : card-lines made join " "
    text ["= [made name]  [does]", 128, 168, 8, #ffff55]
    text ["1 BLEND  2 BACK", 128, 182, 8, #ffffff]
  ready not
    text ["1 PICK  2 BACK  (MAX CANNOT)", 128, 178, 8, #aaaaaa]
]
draw : [game |
  g : game
  clear #000000
  g mode = "title"
    draw-title g
  g mode = "map"
    draw-map g
  (g mode = "fight") or (g mode = "won")
    draw-fight g
  g mode = "reward"
    draw-reward g
  g mode = "oasis"
    draw-oasis g
  g mode = "blend"
    draw-blend g
  g mode = "fallen"
    banner ["THE HERD REMEMBERS", 66, 8, #ffffff]
    banner ["FLOOR [g floor]", 92, 16, #ff0000]
    banner ["BEST FLOOR [g best]", 122, 8, #aaaaaa]
  (g mode != "title") and (g mode != "fallen")
    hud g
]
