-- FATHOM: a diving bell's slot machine, in 16 bits, upright. Dive by dive the bell goes down, and the ship up top
-- wants its air bill paid at the end of each dive. Pull the lever: lines of three or more alike pay, across, down,
-- slanting, in Vs and in zigzags. The reels are your own bag of symbols: coral lifts the fish beside it, jellyfish make
-- the lines beside them glow, anglers stand in for anything, anchors stick, chests pay from anywhere, and squid ink and
-- kraken eyes spoil the catch. Between dives a hermit crab sells salvage: relics that bend the rules, things to use
-- once, and symbols to add, scrap or gild. Every third dive something guards the way down. How deep can you go?
-- Tap the screen, or move with the arrows and press 1. 2 pulls the lever, and dives on from the shop. Tap a reel to
-- hold it for the next pull.

-- ================================================================ the art
ink : [k : #241212, p : #ff926d, q : #db6d49, c : #ffdbb6, w : #ffffff, b : #4992db, l : #b6dbff, d : #24496d, g : #92929b, v : #dbb6ff, u : #926db6, s : #926d49, n : #24246d, y : #ffdb49, o : #ff9224, f : #ffff92, m : #6d6d92, r : #ff6d6d, x : #db2449, h : #ff92db, i : #ffdbff, z : #24246d, a : #ffff92, j : #926d24, e : #ffb600, t : #000024]
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
coral-art : [
  "................"
  "...k......k....."
  "..krk....krk..k."
  "..krk.k..krk.krk"
  "..krkkrk.krkkrk."
  "...krrrk.krrrk.."
  "..k.krrkkrrrk..."
  ".krk.krrrrrk...."
  ".krrkkrrrrk....."
  "..krrrrxrrk....."
  "...krrxxrk......"
  "....krxxrk......"
  ".....kxxk......."
  ".....kxxk......."
  "....kssssk......"
  "...kkkkkkkk....."
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
jelly-art : [
  "................"
  ".....kkkkkk....."
  "...kkhhhhhhkk..."
  "..khhiihhhhhhk.."
  ".khiiihhhhhhhhk."
  ".khhihhhhhhhhhk."
  ".khhhhhhhhhhhhk."
  ".kkhkkhkkhkkhkk."
  "..h..h.h..h..h.."
  "..h..h..h.h..h.."
  "...h.h..h..h.h.."
  "..h..h.h...h..h."
  "..h...h.h..h.h.."
  "...h..h..h..h..."
  "..h....h..h....."
  "................"
]
angler-art : [
  ".....a.........."
  "....aaa........."
  ".....k.........."
  "......k........."
  "...kkkkkkkk....."
  "..kzzzzzzzzk..k."
  ".kzwzzzzzzzzkkzk"
  "kzzkzzzzzzzzzzzk"
  "kwkwkwzzzzzzzzk."
  "k.....kzzzzzzzzk"
  "kwkwkwzzzzzzzkzk"
  ".kzzzzzzzzzzk..k"
  "..kkkzzzzzkk...."
  ".....kkkkk......"
  "................"
  "................"
]
chest-art : [
  "................"
  "................"
  "..kkkkkkkkkkkk.."
  ".kjjjjjjjjjjjjk."
  "kjjyjjjjjjjjyjjk"
  "kyyyyyyyyyyyyyyk"
  "kjjjjjjkkjjjjjjk"
  "kkkkkkkyykkkkkkk"
  "kjjjjjjkkjjjjjjk"
  "kjyjjjjjjjjjjyjk"
  "kjyjjjjjjjjjjyjk"
  "kjyjjjjjjjjjjyjk"
  "kyyyyyyyyyyyyyyk"
  ".kkkkkkkkkkkkkk."
  "................"
  "................"
]
ink-art : [
  "................"
  ".....kkkkkk....."
  "...kkttttttkk..."
  "..ktttntttttk..."
  ".ktttnnttttttk.."
  ".kttttttttntttk."
  "kttttttttttnnttk"
  "kttttttttttttttk"
  "kttnttttttttttk."
  ".kttttttttttttk."
  "..kkttttttttkk.."
  "....kttkkttk...."
  "....ktk..ktk...."
  ".....k....k....."
  "................"
  "................"
]
eye-art : [
  "................"
  "................"
  "....kkkkkkkk...."
  "..kkreeeeeerkk.."
  ".kreeeeeeeeeerk."
  "kreeeeekkeeeeerk"
  "kreeeeekkeeeeerk"
  "kreeeeekkeeeeerk"
  ".kreeeekkeeeerk."
  "..kkreekkeerkk.."
  "....kkkkkkkk...."
  "................"
  "..r..........r.."
  "...r........r..."
  "....r......r...."
  "................"
]
bell-art : [
  "......kggk......"
  "......kggk......"
  ".....kkkkkk....."
  "....kyyyyyyk...."
  "...kyyyyyyyyk..."
  "..kyyykkkkyyyk.."
  "..kyykllllkyyk.."
  ".kyyklwlllkyyyk."
  ".kyykllllllkyyk."
  ".kyykllllllkyyk."
  ".kyyykllllkyyyk."
  ".kyyyykkkkyyyyk."
  "kyyyyyyyyyyyyyyk"
  "kssssssssssssssk"
  "kkkkkkkkkkkkkkkk"
  "..k..k....k..k.."
]
crab-art : [
  "....kkkk........"
  "...knnnnk......."
  "..kkkkkkkk......"
  "....k..k........"
  "...kwk.kwk......"
  "....k..k........"
  ".kk.krrrrk.kk..."
  "krrkrrrrrrkrrk.."
  "krrrrrrrrrrrrk.."
  ".kkrrrrrrrrkk..."
  "...krrrrrrk....."
  "..kkkkkkkkkk...."
  "..k.k.k.k.k.k..."
  ".k..k..k.k..k..."
  "................"
  "................"
]
fishlet-art : ["..mmmm...m", ".mmmmmmmmm", ".mmmmmmmmm", "..mmmm...m"]
symbol-art : [shell : shell-art, fish : fish-art, coral : coral-art, anchor : anchor-art, pearl : pearl-art, jelly : jelly-art, angler : angler-art, chest : chest-art, ink : ink-art, eye : eye-art]

-- ================================================================ the machine's rules
grid-size : 5x4
base-pulls : 9
blur-kinds : ["shell", "fish", "coral", "anchor", "pearl", "jelly", "angler", "chest"]
-- what three, four and five alike pay (anglers stand in for any of these)
pays : [shell : [0, 0, 2, 5, 12], fish : [0, 0, 3, 7, 16], coral : [0, 0, 3, 8, 18], anchor : [0, 0, 4, 10, 24], pearl : [0, 0, 6, 15, 36], jelly : [0, 0, 4, 10, 22], angler : [0, 0, 10, 25, 60]]
symbol-about : [
  shell : "SHELL: A STEADY LITTLE PAY", fish : "FISH: CORAL BESIDE IT PAYS +1", coral : "CORAL: +1 FOR EACH FISH BESIDE"
  anchor : "ANCHOR: STICKS FOR A PULL", pearl : "PEARL: RARE AND RICH", jelly : "JELLY: CELLS BESIDE IT GLOW +1"
  angler : "ANGLER: STANDS IN FOR ANY", chest : "CHEST: 3 ANYWHERE PAY 30", ink : "SQUID INK: SPOILS ITS CELL", eye : "KRAKEN EYE: EATS 2 COINS"
]
starting-bag : ["shell", "shell", "shell", "shell", "shell", "shell", "fish", "fish", "fish", "fish", "fish", "coral", "coral", "coral", "anchor", "anchor", "pearl", "jelly", "ink", "eye"]
first-grid : bag draw [starting-bag, grid-size, 1]
-- the paylines: the rows, the columns and the slants of the reels module, then four Vs and six zigzags
vee-rows : [[1, 2, 3, 2, 1], [2, 3, 4, 3, 2], [3, 2, 1, 2, 3], [4, 3, 2, 3, 4]]
zig-rows : [[1, 2, 1, 2, 1], [2, 1, 2, 1, 2], [2, 3, 2, 3, 2], [3, 2, 3, 2, 3], [3, 4, 3, 4, 3], [4, 3, 4, 3, 4]]
shaped : [shape-name rows-down | [kind : shape-name, places : rows-down numbered collect [[c, r] | pair [c, r]]]]
paylines : reels lines grid-size .. (vee-rows collect [rs | shaped ["vee", rs]]) .. (zig-rows collect [rs | shaped ["zigzag", rs]])

zone-names : ["SUNLIGHT", "TWILIGHT", "MIDNIGHT", "ABYSS", "TRENCH"]
zone-of : [dive | dive - 1 / 3 floor + 1 min 5]
boss-dive : [dive | dive % 3 = 0]
boss-book : [
  [name : "THE INKY SQUID", twist : "ink", about : "INK ON THREE CELLS A PULL"]
  [name : "THE RUSTED REEL", twist : "rust", about : "THE LAST REEL IS RUSTED SHUT"]
  [name : "THE UNDERTOW", twist : "undertow", about : "A PULL THAT WINS NOTHING COSTS AIR"]
  [name : "THE KRAKEN", twist : "kraken", about : "TWO EYES OPEN EVERY PULL"]
  [name : "THE TRENCH", twist : "trench", about : "THE BILL IS HALF AGAIN; INK FALLS"]
]
boss-of : [dive | boss-book @ (dive / 3 - 1 % 5 + 1)]
twist-of : [g | (boss-dive (g dive)) [boss-of (g dive) twist] else ["none"]]
pressure-names : ["NORMAL", "HIGH PRESSURE", "CRUSH DEPTH"]
pressure-rates : [1, 1.35, 1.7]
-- the ship's air bill at the end of a dive: 15, 31, 53, 81, 115, 155, 201...
bill-for : [dive pressure |
  base : dive * dive * 3 + (dive * 7) + 5
  heavy : (boss-dive dive) and (boss-of dive twist = "trench") [1.5] else [1]
  base * (pressure-rates @ (pressure + 1)) * heavy round
]

rarity-colours : [common : #b6b6b6, uncommon : #49db49, rare : #4992ff, legendary : #ffb649]
relic-book : [
  [name : "PEARL DIVER", tag : "PRL", rarity : "uncommon", cost : 14, zone : 1, about : "PEARL LINES PAY DOUBLE"]
  [name : "HERMIT", tag : "HRMT", rarity : "common", cost : 9, zone : 1, about : "SHELL LINES PAY +3"]
  [name : "SHOAL", tag : "SHOL", rarity : "common", cost : 10, zone : 1, about : "FISH LINES +1 A FISH SHOWN"]
  [name : "COMPASS", tag : "CMPS", rarity : "common", cost : 10, zone : 1, about : "ROWS PAY DOUBLE"]
  [name : "CORAL GARDEN", tag : "GRDN", rarity : "common", cost : 9, zone : 1, about : "CORAL LIFTS +2 A FISH"]
  [name : "INK SAC", tag : "INK", rarity : "common", cost : 8, zone : 1, about : "INK PAYS 2 INSTEAD OF 0"]
  [name : "SONAR", tag : "SNR", rarity : "common", cost : 8, zone : 1, about : "EVERY WIN PAYS +1"]
  [name : "TIDE CLOCK", tag : "CLCK", rarity : "uncommon", cost : 15, zone : 1, about : "ONE MORE PULL EACH DIVE"]
  [name : "DEEP POCKETS", tag : "PCKT", rarity : "common", cost : 8, zone : 1, about : "INTEREST UP TO 10, NOT 5"]
  [name : "BELL JAR", tag : "JAR", rarity : "common", cost : 8, zone : 1, about : "PAY EARLY: 8 A PULL, NOT 5"]
  [name : "SALVAGE RIGHTS", tag : "SLVG", rarity : "uncommon", cost : 12, zone : 1, about : "REROLLS -2; SELL AT FULL"]
  [name : "LUCKY LURE", tag : "LURE", rarity : "uncommon", cost : 14, zone : 1, about : "THE LUCKY ONE PAYS X3"]
  [name : "OLD MAP", tag : "MAP", rarity : "uncommon", cost : 14, zone : 2, about : "SLANTS AND VS PAY DOUBLE"]
  [name : "EEL CHARM", tag : "EEL", rarity : "uncommon", cost : 14, zone : 2, about : "ZIGZAGS PAY TRIPLE"]
  [name : "ANCHOR CHAIN", tag : "CHN", rarity : "uncommon", cost : 12, zone : 2, about : "ANCHORS STICK 2, PAY +4"]
  [name : "GLOW TANK", tag : "GLOW", rarity : "rare", cost : 20, zone : 2, about : "JELLY GLOW IS +2, NOT +1"]
  [name : "MERMAID COMB", tag : "COMB", rarity : "rare", cost : 20, zone : 2, about : "EVERY PEARL SHOWN PAYS 3"]
  [name : "GILDED HOOK", tag : "HOOK", rarity : "rare", cost : 22, zone : 3, about : "GILDED CELLS X3, NOT X2"]
  [name : "PRESSURE GAUGE", tag : "GAGE", rarity : "rare", cost : 22, zone : 3, about : "WINS +1 FOR EACH ZONE DOWN"]
  [name : "PRESSURE HULL", tag : "HULL", rarity : "rare", cost : 24, zone : 3, about : "2 MORE PULLS FROM MIDNIGHT"]
  [name : "TREASURE MAP", tag : "TMAP", rarity : "rare", cost : 20, zone : 3, about : "CHESTS PAY FROM TWO"]
  [name : "KRAKEN TOOTH", tag : "TTH", rarity : "rare", cost : 18, zone : 3, about : "EYES PAY 3, NOT EAT 2"]
  [name : "ECHO", tag : "ECHO", rarity : "legendary", cost : 34, zone : 4, about : "THE BEST WIN PAYS AGAIN"]
  [name : "DOUBLOON", tag : "DBLN", rarity : "legendary", cost : 36, zone : 4, about : "EVERY FOURTH PULL PAYS X2"]
  [name : "LEVIATHAN SCALE", tag : "LEVI", rarity : "legendary", cost : 38, zone : 4, about : "LINES WITH ANGLERS PAY X3"]
  [name : "KING'S CROWN", tag : "CRWN", rarity : "legendary", cost : 40, zone : 4, about : "FIVE ALIKE PAY X5"]
]
item-book : [
  [name : "AIR TANK", tag : "AIR", rarity : "common", cost : 7, about : "TWO MORE PULLS THIS DIVE"]
  [name : "HOLD LINE", tag : "HOLD", rarity : "common", cost : 5, about : "TWO MORE HOLDS THIS DIVE"]
  [name : "DOUBLER", tag : "X2", rarity : "uncommon", cost : 9, about : "THE NEXT PULL PAYS DOUBLE"]
  [name : "FLARE", tag : "FLRE", rarity : "common", cost : 6, about : "NEXT PULL: INK, EYES TURN SHELL"]
  [name : "GOLD LEAF", tag : "GOLD", rarity : "uncommon", cost : 8, about : "GILD A SYMBOL IN YOUR BAG"]
]
relic-named : [wanted-name | relic-book keep [r | r name = wanted-name] @ 1]
item-named : [wanted-name | item-book keep [r | r name = wanted-name] @ 1]
add-pool : [zone | ["shell", "fish", "coral", "anchor"] .. ((zone >= 2) [["pearl", "jelly"]] else [[]]) .. ((zone >= 3) [["angler"]] else [[]]) .. ((zone >= 4) [["chest"]] else [[]])]
add-cost : [dive | dive / 3 floor + 4]
scrap-cost : 5
gild-cost : 12

-- ================================================================ reading a grid
got : [g name | g relics has name]
grid-count : [grid-now name | grid-now collect [row | row count [s | bag kind s = name]] sum]
places-of : [grid-now name | grid-now numbered collect-flat [[r, row] | row numbered keep [[c, s] | bag kind s = name] collect [[c, s] | pair [c, r]]]]
next-to : [p q | (p x - (q x) abs) + (p y - (q y) abs) = 1]
lucky-for : [owned seed |
  kinds-in : owned collect [s | bag kind s] distinct keep [k | pays has-field k]
  (kinds-in length > 0) [seeded pick [kinds-in, seed]] else ["shell"]
]
-- one line's win, anglers wild: its first symbols alike, an angler standing in for the line's own symbol
line-win : [grid-now payline |
  marks : payline places collect [p | bag kind (grid-now @ (p y) @ (p x))]
  real : marks keep [m | m != "angler"]
  first-real : (real length > 0) [real @ 1] else ["angler"]
  lead : (pays has-field first-real) [first-real] else ["angler"]
  many : marks take-while [m | (m = lead) or (m = "angler")] length
  [shape : payline kind, symbol : lead, alike : many, places : payline places take many, wild : marks take many has "angler"]
]
find-wins : [grid-now | paylines collect [pl | line-win [grid-now, pl]] keep [w | (w alike >= 3) and (pays has-field (w symbol))]]
-- one win's coins, with the lucky symbol, gilded cells and the relics that touch it
win-pay : [w g |
  sym : w symbol
  base : pays get-in [sym] @ (w alike)
  lucky-x : (sym = (g lucky)) [(got [g, "LUCKY LURE"]) [3] else [2]] else [1]
  gilt : w places count [p | bag gilded (g grid @ (p y) @ (p x))]
  gilt-x : (got [g, "GILDED HOOK"]) [gilt * 2 + 1] else [gilt + 1]
  shape-x : cond [
    (w shape = "row") and (got [g, "COMPASS"]), 2
    ((w shape = "diagonal") or (w shape = "vee")) and (got [g, "OLD MAP"]), 2
    (w shape = "zigzag") and (got [g, "EEL CHARM"]), 3
    any, 1
  ]
  pearl-x : (sym = "pearl") and (got [g, "PEARL DIVER"]) [2] else [1]
  wild-x : (w wild) and (got [g, "LEVIATHAN SCALE"]) [3] else [1]
  five-x : (w alike = 5) and (got [g, "KING'S CROWN"]) [5] else [1]
  shell-plus : (sym = "shell") and (got [g, "HERMIT"]) [3] else [0]
  fish-plus : (sym = "fish") and (got [g, "SHOAL"]) [grid-count [g grid, "fish"]] else [0]
  anchor-plus : (sym = "anchor") and (got [g, "ANCHOR CHAIN"]) [4] else [0]
  sonar-plus : (got [g, "SONAR"]) [1] else [0]
  gauge-plus : (got [g, "PRESSURE GAUGE"]) [zone-of (g dive)] else [0]
  base * lucky-x * gilt-x * shape-x * pearl-x * wild-x * five-x + shell-plus + fish-plus + anchor-plus + sonar-plus + gauge-plus
]
jelly-glow : [g found |
  jellies : places-of [g grid, "jelly"]
  rate : (got [g, "GLOW TANK"]) [2] else [1]
  found collect [w | w places count [p | jellies any [jl | next-to [p, jl]]]] sum * rate
]
coral-lift : [g |
  corals : places-of [g grid, "coral"]
  fishes : places-of [g grid, "fish"]
  rate : (got [g, "CORAL GARDEN"]) [2] else [1]
  corals collect [cp | fishes count [fp | next-to [cp, fp]]] sum * rate
]
chest-pay : [g |
  chests : grid-count [g grid, "chest"]
  need : (got [g, "TREASURE MAP"]) [2] else [3]
  cond [chests < need, 0, chests = 2, 12, chests = 3, 30, chests = 4, 80, any, 200]
]
-- the patterns: four corners alike, a cross of five alike round a middle cell, and a whole column alike
pattern-pay : [grid-now |
  at-cell : [c r | bag kind (grid-now @ r @ c)]
  payable : [s | pays has-field s]
  alike : [marks | (payable (marks @ 1)) and (marks all [s | s = (marks @ 1)])]
  corner-marks : [at-cell [1, 1], at-cell [5, 1], at-cell [1, 4], at-cell [5, 4]]
  corners : (alike corner-marks) [20] else [0]
  crosses : [[3, 2], [3, 3]] count [[cx, cy] | marks5 : [at-cell [cx, cy], at-cell [cx - 1, cy], at-cell [cx + 1, cy], at-cell [cx, cy - 1], at-cell [cx, cy + 1]], alike marks5] * 25
  columns : range 5 count [c | alike (range 4 collect [r | at-cell [c, r]])] * 10
  corners + crosses + columns
]

-- ================================================================ songs
songs : [
  title : [
    bpm : 88, beats : 16
    lead : music track ["E5 . B4 . G4 . B4 . | E5 . G5 . F#5 - - . | D5 . A4 . F#4 . A4 . | D5 . F#5 . E5 - - .", 0.5]
    harmony : music track ["G4 - - - . . . . | B4 - - - . . . . | F#4 - - - . . . . | A4 - - - . . . .", 0.5]
    bass : music track ["E2 . . . B2 . . . | E2 . . . B2 . . . | D2 . . . A2 . . . | D2 . . . A2 . . .", 0.5]
    drums : music track ["kick . . . hat . . . | kick . . . snare . . . | kick . . . hat . . . | kick . . . snare . hat .", 0.5]
  ]
  shallow : [
    bpm : 100, beats : 16
    lead : music track ["G5 . D5 . B4 . D5 . | E5 . C5 . A4 - - . | F#5 . D5 . A4 . D5 . | G5 - - - . . . .", 0.5]
    harmony : music track ["B4 - - - . . . . | C5 - - - . . . . | A4 - - - . . . . | B4 - - - . . . .", 0.5]
    bass : music track ["G2 . D3 . G2 . D3 . | C3 . G2 . C3 . G2 . | D3 . A2 . D3 . A2 . | G2 . D3 . G2 . . .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat kick snare . crash .", 0.5]
  ]
  deep : [
    bpm : 66, beats : 16
    lead : music track ["D5 - - - . . A4 . | C5 - - - . . G4 . | A#4 - - - . . F4 . | A4 - - - - - . .", 0.5]
    harmony : music track ["F4 - - - - - - - | E4 - - - - - - - | D4 - - - - - - - | C#4 - - - - - - -", 0.5]
    bass : music track ["D2 - - - - - - - | C2 - - - - - - - | A#1 - - - - - - - | A1 - - - - - - -", 0.5]
    drums : music track ["kick . . . . . . . | kick . . . hat . . . | kick . . . . . . . | kick . . . hat . . .", 0.5]
  ]
  shop : [
    bpm : 120, beats : 16
    lead : music track ["C5 . E5 . G5 . E5 . | F5 . A5 . G5 - - . | E5 . C5 . D5 . B4 . | C5 - - - . . . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | F2 . C3 . G2 . D3 . | C3 . G2 . G2 . G2 . | C3 . G2 . C3 . . .", 0.5]
    drums : music track ["kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick snare crash .", 0.5]
  ]
  boss : [
    bpm : 138, beats : 16
    lead : music track ["A4 A4 C5 A4 D#5 . D5 . | A4 A4 C5 A4 E5 . D5 . | F5 . E5 . D#5 . D5 . | C5 . B4 . A4 - - .", 0.5]
    bass : music track ["A1 A2 A1 A2 A1 A2 A1 A2 | A1 A2 A1 A2 A1 A2 A1 A2 | F1 F2 F1 F2 E1 E2 E1 E2 | A1 A2 A1 A2 E1 E2 E1 E2", 0.5]
    drums : music track ["kick snare kick snare kick snare kick snare | kick snare kick snare kick snare kick snare | kick snare kick snare kick snare kick snare | kick kick snare kick snare snare crash .", 0.5]
  ]
  snap : [
    bpm : 70, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . B4 . | A4 - - - . . . .", 0.5]
    bass : music track ["A2 . G2 . F2 . E2 . | A1 - - - . . . .", 0.5]
  ]
]

-- ================================================================ a run
start :
  mode : "title"
  mode-at : 0
  deepest : saved deepest else 0
  unlocked : saved unlocked else 1
  pressure-max : saved pressure-max else 0
  keep : [deepest : saved deepest else 0, unlocked : saved unlocked else 1, pressure-max : saved pressure-max else 0]
  pressure : 0
  song : "title"
  dive : 1
  coins : 0
  shown : 0
  pulls : 8
  pull-count : 0
  holds : 1
  held : []
  bag : starting-bag
  grid : first-grid
  stuck : []
  spun-at : -10
  rolling : false
  wins : []
  breakdown : []
  paid : 0
  relics : []
  items : []
  doubled : false
  flare : false
  lucky : "shell"
  seed : 1
  offers : []
  con-offers : []
  add-offers : []
  rolls : 0
  pick-kind : 1
  focus : "pull"
  said : ""
  said-at : 0

start-dive : [g now |
  dive-now : g dive
  zone-now : zone-of dive-now
  extra : ((got [g, "TIDE CLOCK"]) [1] else [0]) + ((got [g, "PRESSURE HULL"]) and (zone-now >= 3) [2] else [0])
  boss : boss-dive dive-now
  words : boss ["[boss-of dive-now name]: [boss-of dive-now about]"] else ["DIVE [dive-now]: [zone-names @ zone-now]"]
  tune : boss ["boss"] else [(zone-now <= 2) ["shallow"] else ["deep"]]
  luck : lucky-for [g bag, g seed + (dive-now * 31)]
  opened : g unlocked max zone-now
  g with [mode : "dive", mode-at : now, pulls : base-pulls + extra, holds : 1, held : [], stuck : [], lucky : luck, song : tune, said : words, said-at : now, wins : [], breakdown : [], paid : 0, focus : "pull", unlocked : opened, doubled : false, flare : false]
]
begin-run : [g now |
  run-seed : now * 977 floor + 7
  fresh : g with [dive : 1, coins : 3, shown : 3, bag : starting-bag, grid : first-grid, relics : [], items : [], seed : run-seed, rolls : 0, pull-count : 0]
  start-dive [fresh, now]
]

-- a boss's twist on a freshly drawn grid
splash : [grid-now many symbol pull-seed |
  spots : seeded shuffle [range 20, pull-seed + 5] take many
  grid-now numbered collect [[r, row] | row numbered collect [[c, s] | (spots has (r - 1 * 5 + c)) [symbol] else [s]]]
]
twisted : [grid-now g pull-seed |
  kind-now : twist-of g
  cond [
    kind-now = "ink", splash [grid-now, 3, "ink", pull-seed]
    kind-now = "rust", grid-now collect [row | row numbered collect [[c, s] | (c = 5) ["ink"] else [s]]]
    kind-now = "kraken", splash [grid-now, 2, "eye", pull-seed]
    kind-now = "trench", splash [grid-now, 2, "ink", pull-seed]
    any, grid-now
  ]
]
-- anchors stuck from before stay where they were
stick-in : [grid-now stuck-list | grid-now numbered collect [[r, row] | row numbered collect [[c, s] |
  here : stuck-list keep [st | (st at x = c) and (st at y = r)]
  (here length > 0) [here @ 1 symbol] else [s]
]]]
next-stuck : [g grid-now |
  hold-on : (got [g, "ANCHOR CHAIN"]) [2] else [1]
  carried : g stuck collect [st | fewer : st stay - 1, st with [stay : fewer]] keep [st | st stay > 0]
  old-places : g stuck collect [st | st at]
  fresh-anchors : places-of [grid-now, "anchor"] keep [p | (old-places has p) not]
  carried .. (fresh-anchors collect [p | [at : p, symbol : grid-now @ (p y) @ (p x), stay : hold-on]])
]
pull-now : [g now |
  dive-now : g dive
  n : g pull-count + 1
  pull-seed : g seed * 101 + (dive-now * 17) + (n * 7)
  drawn : bag draw [g bag, grid-size, pull-seed]
  kept-cols : g held
  old : g grid
  with-holds : drawn numbered collect [[r, row] | row numbered collect [[c, s] | (kept-cols has c) [old @ r @ c] else [s]]]
  made : twisted [stick-in [with-holds, g stuck], g, pull-seed]
  flared : (g flare) [made collect [row | row collect [s | ((bag kind s = "ink") or (bag kind s = "eye")) ["shell"] else [s]]]] else [made]
  holds-left : g holds - (kept-cols length) max 0
  air : g pulls - 1
  g with [grid : flared, rolling : true, spun-at : now, pulls : air, pull-count : n, held : [], holds : holds-left, wins : [], breakdown : [], paid : 0, said : ""]
]
-- the pull's catch, once the reels have stopped
settle : [g |
  found : find-wins (g grid)
  per-win : found collect [w | win-pay [w, g]]
  lines-pay : per-win sum
  glow : jelly-glow [g, found]
  lift : coral-lift g
  chests : chest-pay g
  eyes : grid-count [g grid, "eye"]
  eye-pay : (got [g, "KRAKEN TOOTH"]) [eyes * 3] else [0 - (eyes * 2)]
  ink-pay : (got [g, "INK SAC"]) [grid-count [g grid, "ink"] * 2] else [0]
  comb : (got [g, "MERMAID COMB"]) [grid-count [g grid, "pearl"] * 3] else [0]
  patterns : pattern-pay (g grid)
  echo : (got [g, "ECHO"]) and (per-win length > 0) [per-win sort last] else [0]
  subtotal : lines-pay + glow + lift + chests + eye-pay + ink-pay + comb + patterns + echo
  doubling : (g doubled) or ((got [g, "DOUBLOON"]) and (g pull-count % 4 = 0))
  total : doubling [subtotal * 2] else [subtotal]
  parts : [["LINES", lines-pay], ["GLOW", glow], ["CORAL", lift], ["CHESTS", chests], ["EYES", eye-pay], ["INK", ink-pay], ["PEARLS", comb], ["PATTERN", patterns], ["ECHO", echo], ["DOUBLE", total - subtotal]] keep [pt | pt @ 2 != 0]
  purse : g coins + total max 0
  words : cond [total >= 60, "A HUGE HAUL! +[total]", total >= 25, "A FINE CATCH! +[total]", total > 0, "+[total]", total < 0, "THE KRAKEN BITES [total]", any, "NOTHING BITES"]
  stuck-now : next-stuck [g, g grid]
  lost-air : (twist-of g = "undertow") and (total <= 0) [1] else [0]
  air : g pulls - lost-air max 0
  g with [rolling : false, wins : found, breakdown : parts, paid : total, coins : purse, said : words, said-at : g clock, stuck : stuck-now, pulls : air, doubled : false, flare : false]
]

-- ================================================================ the end of a dive, the salvage shop
relic-pool : [g | relic-book keep [r | (r zone <= (g unlocked)) and ((g relics has (r name)) not)]]
restock : [g n |
  shop-seed : g seed * 13 + (g dive * 7) + (n * 101)
  zone-next : zone-of (g dive + 1)
  relic-offers : shop offers [relic-pool g, 3, shop-seed] collect [r | r name]
  item-offers : shop offers [item-book, 2, shop-seed + 1] collect [r | r name]
  adds : range 3 collect [k | seeded pick [add-pool zone-next, shop-seed + (k * 17)]]
  g with [offers : relic-offers, con-offers : item-offers, add-offers : adds]
]
open-shop : [g now |
  cap : (got [g, "DEEP POCKETS"]) [10] else [5]
  gain : shop interest [g coins, 10, cap]
  purse : g coins + gain
  words : (gain > 0) ["INTEREST +[gain]. HAVE A LOOK."] else ["SALVAGE, FRESH FROM THE DEEP."]
  restock [g with [mode : "shop", mode-at : now, coins : purse, rolls : 0, song : "shop", focus : "offer1", said : words, said-at : now, pick-kind : 1], 0]
]
reckon : [g now early |
  owed : bill-for [g dive, g pressure]
  rate : (got [g, "BELL JAR"]) [8] else [5]
  bonus : early [g pulls * rate] else [0]
  dive-now : g dive
  reached : g deepest max dive-now
  opened : g unlocked max (zone-of (dive-now + 1))
  harder : (dive-now >= 13) [g pressure-max max (g pressure + 1 min 2)] else [g pressure-max]
  marked : g with [deepest : reached, unlocked : opened, pressure-max : harder]
  left-over : g coins - owed + bonus
  (g coins >= owed) [open-shop [marked with [coins : left-over], now]] else [marked with [mode : "snapped", mode-at : now, song : "snap", said : "THE SHIP WANTED [owed]"]]
]
next-dive : [g now | deeper : g dive + 1, start-dive [g with [dive : deeper], now]]
-- buying, selling and the services
price-of : [g cost | shop price [cost, g dive, 0.08]]
buy-relic : [g n now |
  name : g offers @ n
  r : relic-named name
  cost : price-of [g, r cost]
  owned : g relics
  rest-offers : g offers numbered keep [[i, o] | i != n] collect [[i, o] | o]
  purse : g coins - cost
  cond [
    owned length >= 6, g with [said : "SIX RELICS AT MOST. SELL ONE.", said-at : now]
    g coins < cost, g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]
    any, g with [coins : purse, relics : owned .. [name], offers : rest-offers, said : "THE [name]! FINE CHOICE.", said-at : now, focus : "dive"]
  ]
]
sell-price : [g r | full : got [g, "SALVAGE RIGHTS"], cost : price-of [g, r cost], full [cost] else [shop sell cost]]
sell-relic : [g n now |
  r : relic-named (g relics @ n)
  back : sell-price [g, r]
  rest : g relics numbered keep [[i, o] | i != n] collect [[i, o] | o]
  purse : g coins + back
  g with [coins : purse, relics : rest, said : "SOLD FOR [back]. NO TAKEBACKS.", said-at : now, focus : "dive"]
]
buy-item : [g n now |
  name : g con-offers @ n
  it-now : item-named name
  cost : price-of [g, it-now cost]
  held-items : g items
  rest-offers : g con-offers numbered keep [[i, o] | i != n] collect [[i, o] | o]
  purse : g coins - cost
  cond [
    held-items length >= 3, g with [said : "THREE THINGS TO USE AT MOST.", said-at : now]
    g coins < cost, g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]
    any, g with [coins : purse, items : held-items .. [name], con-offers : rest-offers, said : "ONE [name]. USE IT WELL.", said-at : now, focus : "dive"]
  ]
]
buy-add : [g n now |
  symbol : g add-offers @ n
  cost : add-cost (g dive)
  rest-adds : g add-offers numbered keep [[i, o] | i != n] collect [[i, o] | o]
  grown : bag add [g bag, symbol]
  purse : g coins - cost
  (g coins >= cost) [g with [coins : purse, bag : grown, add-offers : rest-adds, said : "A [symbol upper] FOR YOUR BAG.", said-at : now, focus : "dive"]] else [g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]]
]
bag-kinds : [g | bag counts (g bag) keys]
picked-kind : [g | kinds-now : bag-kinds g, (kinds-now length > 0) [kinds-now @ (g pick-kind min (kinds-now length))] else ["shell"]]
scrap-kind : [g now |
  kind-now : picked-kind g
  smaller : bag scrap [g bag, kind-now]
  purse : g coins - scrap-cost
  cond [
    g bag length <= 10, g with [said : "KEEP TEN AT LEAST, DIVER.", said-at : now]
    g coins < scrap-cost, g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]
    any, g with [coins : purse, bag : smaller, said : "ONE [kind-now upper] OVERBOARD.", said-at : now]
  ]
]
gild-kind : [g now |
  kind-now : picked-kind g
  plain : g bag count [s | s = kind-now]
  shinier : bag gild [g bag, kind-now]
  purse : g coins - gild-cost
  cond [
    plain = 0, g with [said : "NONE LEFT TO GILD.", said-at : now]
    g coins < gild-cost, g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]
    any, g with [coins : purse, bag : shinier, said : "A GILDED [kind-now upper]. IT PAYS DOUBLE.", said-at : now]
  ]
]
reroll-cost : [g | shop reroll [3, g rolls, 2] - ((got [g, "SALVAGE RIGHTS"]) [2] else [0]) max 0]
reroll-shop : [g now |
  cost : reroll-cost g
  more : g rolls + 1
  purse : g coins - cost
  (g coins >= cost) [restock [g with [coins : purse, rolls : more, said : "NEW WARES, FRESH UP.", said-at : now], more]] else [g with [said : "NOT ENOUGH COIN FOR THAT.", said-at : now]]
]

-- ================================================================ things used in a dive
gold-leaf : [g now |
  plain : g bag keep [s | (bag gilded s) not]
  choice : (plain length > 0) [seeded pick [plain, g seed + (g pull-count * 7) + 3]] else ["shell"]
  shinier : bag gild [g bag, choice]
  g with [bag : shinier, said : "A GILDED [choice upper]!", said-at : now]
]
use-item : [g n now |
  name : g items @ n
  rest-items : g items numbered keep [[i, x] | i != n] collect [[i, x] | x]
  air : g pulls + 2
  grip : g holds + 2
  used : g with [items : rest-items, said : name, said-at : now, focus : "pull"]
  cond [
    name = "AIR TANK", used with [pulls : air]
    name = "HOLD LINE", used with [holds : grip]
    name = "DOUBLER", used with [doubled : true]
    name = "FLARE", used with [flare : true]
    name = "GOLD LEAF", gold-leaf [used, now]
    any, g
  ]
]
toggle-hold : [g col now |
  holding : g held
  cond [
    holding has col, g with [held : holding keep [c | c != col]]
    holding length < (g holds), g with [held : holding .. [col]]
    any, g with [said : "NO HOLDS LEFT. A HOLD LINE GIVES TWO.", said-at : now]
  ]
]
pull-or-surface : [g now | (g pulls > 0) [pull-now [g, now]] else [reckon [g, now, false]]]
pay-early : [g now |
  owed : bill-for [g dive, g pressure]
  (g coins >= owed) [reckon [g, now, true]] else [g with [said : "THE SHIP WANTS [owed] FIRST.", said-at : now]]
]

-- ================================================================ the spots a finger or the arrows can pick
spot : [label corner extent fast | [key : label, at : corner, size : extent, quick : fast]]
shelf-spots : [g prefix | g relics numbered collect [[i, r] | spot ["[prefix][i]", pair [i - 1 * 38 + 7, 14], 36x28, false]]]
dive-spots : [g |
  reels-row : range 5 collect [c | spot ["reel[c]", pair [c - 1 * 38 + 32, 86], 36x152, true]]
  item-row : g items numbered collect [[i, thing] | spot ["item[i]", pair [i - 1 * 78 + 8, 276], 72x28, false]]
  shelf-spots [g, "relic"] .. reels-row .. item-row .. [spot ["pull", 16x310, 120x40, true], spot ["pay", 144x310, 82x40, true]]
]
shop-spots : [g |
  offer-row : g offers numbered collect [[i, o] | spot ["offer[i]", pair [i - 1 * 78 + 6, 110], 72x68, false]]
  con-row : g con-offers numbered collect [[i, o] | spot ["con[i]", pair [i - 1 * 118 + 6, 190], 110x26, false]]
  add-row : g add-offers numbered collect [[i, o] | spot ["add[i]", pair [i - 1 * 78 + 6, 228], 72x34, false]]
  kind-row : bag-kinds g numbered collect [[i, k] | spot ["kind[i]", pair [i - 1 * 23 + 6, 274], 22x30, true]]
  services : [spot ["scrap", 6x310, 72x22, false], spot ["gild", 84x310, 72x22, false], spot ["reroll", 162x310, 72x22, true], spot ["dive", 6x340, 228x52, true]]
  shelf-spots [g, "own"] .. offer-row .. con-row .. add-row .. kind-row .. services
]
spots-for : [g | (g mode = "shop") [shop-spots g] else [dive-spots g]]
place-of : [spots wanted fallback |
  found : spots numbered keep [[i, s] | s key = wanted] collect [[i, s] | i]
  backup : spots numbered keep [[i, s] | s key = fallback] collect [[i, s] | i]
  cond [found length > 0, found @ 1, backup length > 0, backup @ 1, any, 1]
]
number-after : [label skip | label slice [skip + 1, -1] number]
dive-act : [g wanted now |
  cond [
    wanted = "pull", pull-or-surface [g, now]
    wanted = "pay", pay-early [g, now]
    wanted starts-with "reel", toggle-hold [g, number-after [wanted, 4], now]
    wanted starts-with "item", use-item [g, number-after [wanted, 4], now]
    any, g
  ]
]
shop-act : [g wanted now |
  cond [
    wanted = "dive", next-dive [g, now]
    wanted = "reroll", reroll-shop [g, now]
    wanted = "scrap", scrap-kind [g, now]
    wanted = "gild", gild-kind [g, now]
    wanted starts-with "offer", buy-relic [g, number-after [wanted, 5], now]
    wanted starts-with "con", buy-item [g, number-after [wanted, 3], now]
    wanted starts-with "add", buy-add [g, number-after [wanted, 3], now]
    wanted starts-with "kind", g with [pick-kind : number-after [wanted, 4]]
    wanted starts-with "own", sell-relic [g, number-after [wanted, 3], now]
    any, g
  ]
]
act-on : [g wanted now | (g mode = "shop") [shop-act [g, wanted, now]] else [dive-act [g, wanted, now]]]
-- a tap on a spot: a button or a reel acts at once; a card is read first and taken with a second tap
tap-spot : [g chosen focused now | (chosen quick) or focused [act-on [g with [focus : chosen key], chosen key, now]] else [g with [focus : chosen key]]]
pick-step : [g go touched point way fallback now |
  spots : spots-for g
  here : place-of [spots, g focus, fallback]
  hit-at : touched [focus hit [spots, point]] else [0]
  moved : (way x != 0) or (way y != 0)
  cond [
    hit-at > 0, tap-spot [g, spots @ hit-at, hit-at = here, now]
    go, act-on [g, (spots @ here) key, now]
    moved, g with [focus : (spots @ (focus step [spots, here, way])) key]
    any, g
  ]
]
dive-step : [g go back touched point way now |
  done : reels stopped [g spun-at, 5, 0.18, now]
  settled : (g rolling) and (done >= 5) and (now - (g spun-at) > 1.3)
  cond [
    settled, settle g
    g rolling, g
    back, pull-or-surface [g, now]
    any, pick-step [g, go, touched, point, way, "pull", now]
  ]
]
shop-step : [g go back touched point way now |
  settling : now - (g mode-at) < 0.6
  cond [
    settling, g
    back and (g focus = "dive"), next-dive [g, now]
    back, g with [focus : "dive"]
    any, pick-step [g, go, touched, point, way, "dive", now]
  ]
]
title-step : [g go touched way now |
  choose : g pressure + (way x) max 0 min (g pressure-max)
  (go or touched) [begin-run [g with [pressure : choose], now]] else [g with [pressure : choose]]
]

-- ================================================================ every tick
update : [game |
  g : game
  inp : g input
  now : g clock
  touched : inp tapped
  point : pair [inp touch-x, inp touch-y]
  go : inp pressed "one"
  back : inp pressed "two"
  way : pad way (inp repeated)
  after : cond [
    g mode = "title", title-step [g, go, touched, way, now]
    g mode = "dive", dive-step [g, go, back, touched, point, way, now]
    g mode = "shop", shop-step [g, go, back, touched, point, way, now]
    g mode = "snapped", ((go or touched) and (now - (g mode-at) > 1.5)) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    any, g
  ]
  stops-before : reels stopped [g spun-at, 5, 0.18, now - (g dt)]
  stops-now : reels stopped [after spun-at, 5, 0.18, now]
  settled-now : (g rolling) and (after rolling not)
  (after rolling) and (g rolling not)
    hiss [0.25, 600]
    beep [120, 0.08]
  (after rolling) and (stops-now > stops-before)
    beep [180 + (stops-now * 50), 0.04]
  settled-now and (after paid > 0)
    zzfx preset "coin"
  settled-now and (after paid >= 25)
    zzfx preset "power"
    shake 3
  settled-now and (after paid < 0)
    hiss [0.5, 200]
  (after mode = "snapped") and (g mode != "snapped")
    zzfx preset "explode"
    shake 6
  (after mode = "shop") and (g mode != "shop")
    zzfx preset "select"
  (after mode = "dive") and (after mode-at = now) and (boss-dive (after dive))
    hiss [1.2, 120]
    beep [62, 0.5]
  (after mode = "dive") and (zone-of (after dive) >= 3) and (now % 5 < (g dt))
    beep [1320, 0.05]
  (after said-at = now) and (after said starts-with "NOT ENOUGH")
    beep [90, 0.15]
  (after relics length > (g relics length)) or (after items length > (g items length)) or (after bag length > (g bag length))
    zzfx preset "coin"
  after focus != (g focus)
    beep [880, 0.02]
  after held length != (g held length)
    beep [520, 0.05]
  gap : after coins - (after shown)
  shown-now : (gap > 0) [after shown + (gap / 6 ceil)] else [after coins]
  deep-now : after deepest
  open-now : after unlocked
  hard-now : after pressure-max
  after with [shown : shown-now, keep : [deepest : deep-now, unlocked : open-now, pressure-max : hard-now]]
]

-- ================================================================ drawing: the water
zone-tops : [#24b6db, #006d92, #002449, #000024, #000000]
zone-bottoms : [#006d92, #002449, #000024, #000012, #240000]
water : [zone-now now |
  top : zone-tops @ zone-now
  bottom : zone-bottoms @ zone-now
  range 10 each [i | rect [0, i - 1 * 40, W, 40, top mix [bottom, i - 1 / 9]]]
  zone-now <= 2
    range 4 each [i | sx : i * 70 - 30 + ((now * 0.3 + i) sin * 8), line [sx, 0, sx - 60, H, (zone-now = 1) [#49b6db] else [#004992]], line [sx + 1, 0, sx - 59, H, (zone-now = 1) [#49b6db] else [#004992]]]
  range 3 each [i |
    fx : now * (8 + (i * 5)) + (i * 97) % (W + 40) - 20
    sprite [fishlet-art, fx, i * 111 + 60, [m : (zone-now <= 2) [#004992] else [#000049]], false, 2]
  ]
  zone-now >= 3
    range 24 each [i | rect [i * 37 % W, now * (6 + (i % 4)) + (i * 53) % H, 1, 1, #6d6d92]]
  range 14 each [i |
    bx : i * 53 % 228 + 6 + ((now * 2 + i) sin * 3)
    by : H - (now * (14 + (i % 5 * 4)) + (i * 41) % (H + 20))
    circle [bx, by, 1 + (i % 3), (zone-now <= 2) [#b6dbff] else [#496d92]]
  ]
]
gauge : [g now |
  rect [2, 80, 10, 270, #000000]
  range 5 each [z | rect [3, z - 1 * 54 + 81, 8, 52, zone-tops @ z]]
  mark-y : g dive - 1 * 18 + 81 min 340
  rect [1, mark-y, 12, 6, #ffdb49]
  rect [3, mark-y + 1, 8, 4, (now * 4 floor % 2 = 0) [#ffffff] else [#ffdb49]]
]

-- ================================================================ drawing: the dive
cell-x : [c | c - 1 * 38 + 32]
cell-y : [r | r - 1 * 38 + 86]
outline : [ox oy w h colour | rect [ox, oy, w, 2, colour], rect [ox, oy + h - 2, w, 2, colour], rect [ox, oy, 2, h, colour], rect [ox + w - 2, oy, 2, h, colour]]
shelf : [g |
  range 6 each [i |
    sx : i - 1 * 38 + 7
    filled : i <= (g relics length)
    r : filled [relic-named (g relics @ i)] else [relic-book @ 1]
    filled
      rect [sx, 14, 36, 28, rarity-colours get-in [r rarity]]
      rect [sx + 2, 16, 32, 24, #121224]
      text [r tag, sx + 18, 28, 8, #ffffff]
    filled not
      outline [sx, 14, 36, 28, #24496d]
  ]
]
relic-lines : [g n | r : relic-named (g relics @ n), [r name, r about]]
sell-lines : [g n | r : relic-named (g relics @ n), back : sell-price [g, r], [r name, "SELLS FOR [back]: PICK AGAIN"]]
reel-lines : [g n | ["HOLD REEL [n]: [g holds] HOLDS LEFT", "A HELD REEL KEEPS ITS SYMBOLS"]]
item-lines : [label | it-now : item-named label, [it-now name, it-now about]]
offer-lines : [g label | r : relic-named label, cost : price-of [g, r cost], ["[r name]: [cost]C", r about]]
con-lines : [g label | it-now : item-named label, cost : price-of [g, it-now cost], ["[it-now name]: [cost]C", it-now about]]
add-lines : [g sym | cost : add-cost (g dive), [symbol-about get-in [sym], "ADD ONE TO YOUR BAG: [cost]C"]]
kind-lines : [g | k : picked-kind g, n : bag counts (g bag) get-in [k], [symbol-about get-in [k], "IN YOUR BAG: [n]"]]
scrap-lines : [g | k : picked-kind g upper, ["SCRAP ONE [k]: [scrap-cost]C", "FEWER OF IT IN YOUR BAG"]]
gild-lines : [g | k : picked-kind g upper, ["GILD ONE [k]: [gild-cost]C", "A GILDED CELL PAYS DOUBLE"]]
reroll-lines : [g | cost : reroll-cost g, ["NEW WARES: [cost]C", "THE CRAB DIGS DEEPER"]]
dive-lines : [g | deeper : g dive + 1, owed : bill-for [deeper, g pressure], ["DIVE TO [deeper]", "THE BILL DOWN THERE: [owed]"]]
pay-lines : [g | owed : bill-for [g dive, g pressure], rate : (got [g, "BELL JAR"]) [8] else [5], ["PAY [owed] NOW AND GO ON", "EACH PULL LEFT PAYS [rate]"]]
pull-lines : [g | ["[g pulls] PULLS OF AIR LEFT", "TAP A REEL TO HOLD IT"]]
info-lines : [g spot-key |
  cond [
    spot-key starts-with "relic", relic-lines [g, number-after [spot-key, 5]]
    spot-key starts-with "own", sell-lines [g, number-after [spot-key, 3]]
    spot-key starts-with "reel", reel-lines [g, number-after [spot-key, 4]]
    spot-key starts-with "item", item-lines (g items @ (number-after [spot-key, 4]))
    spot-key starts-with "offer", offer-lines [g, g offers @ (number-after [spot-key, 5])]
    spot-key starts-with "con", con-lines [g, g con-offers @ (number-after [spot-key, 3])]
    spot-key starts-with "add", add-lines [g, g add-offers @ (number-after [spot-key, 3])]
    spot-key starts-with "kind", kind-lines g
    spot-key = "scrap", scrap-lines g
    spot-key = "gild", gild-lines g
    spot-key = "reroll", reroll-lines g
    spot-key = "dive", dive-lines g
    spot-key = "pay", pay-lines g
    any, pull-lines g
  ]
]
info : [g |
  spots : spots-for g
  here : place-of [spots, g focus, (g mode = "shop") ["dive"] else ["pull"]]
  words : info-lines [g, spots @ here key]
  rect [0, 44, W, 22, #000024]
  text [words @ 1, W / 2, 50, 8, #ffdb92]
  text [words @ 2, W / 2, 60, 8, #92b6db]
]
focus-ring : [g now |
  spots : spots-for g
  here : place-of [spots, g focus, (g mode = "shop") ["dive"] else ["pull"]]
  ring : focus ring [spots, here, 2]
  now * 3 floor % 2 = 0
    outline [ring at x, ring at y, ring size x, ring size y, #ffffff]
]
machine : [g now |
  rect [26, 80, 204, 164, #6d4924]
  rect [28, 82, 200, 160, #b69249]
  rect [30, 84, 196, 156, #492412]
  done : reels stopped [g spun-at, 5, 0.18, now]
  roll : now * 600 % 38
  range 5 each [c |
    rx : cell-x c
    holding : g held has c
    spinning : (g rolling) and (done < c)
    rect [rx, 86, 36, 152, holding [#ffdb92] else [#dbdbb6]]
    spinning
      range 5 each [k | sprite [symbol-art get-in [reels blur [blur-kinds, c, k, now]], rx + 2, k - 2 * 38 + 88 + roll, ink, false, 2]]
    spinning not
      range 4 each [r |
        s : g grid @ r @ c
        sprite [symbol-art get-in [bag kind s], rx + 2, cell-y r + 2, ink, false, 2]
        bag gilded s
          rect [rx + 1, cell-y r + 1, 6, 2, #ffdb49]
          rect [rx + 1, cell-y r + 1, 2, 6, #ffdb49]
          rect [rx + 29, cell-y r + 33, 6, 2, #ffdb49]
          rect [rx + 33, cell-y r + 29, 2, 6, #ffdb49]
      ]
  ]
  rect [0, 66, W, 20, #000024]
  rect [26, 80, 204, 6, #6d4924]
  rect [26, 238, 204, 6, #6d4924]
  rect [0, 244, W, 30, #000024]
  range 12 each [i | circle [i * 17 + 34, 83, 1, #ffdb92], circle [i * 17 + 34, 241, 1, #ffdb92]]
  (g rolling not) and (now * 5 floor % 2 = 0)
    g wins each [w |
      w places each [p | outline [cell-x (p x), cell-y (p y), 36, 36, #ffffff]]
      w places numbered each [[i, p] |
        prev : w places @ (i - 1 max 1)
        i > 1
          line [cell-x (prev x) + 18, cell-y (prev y) + 18, cell-x (p x) + 18, cell-y (p y) + 18, #ff2449]
          line [cell-x (prev x) + 19, cell-y (prev y) + 18, cell-x (p x) + 19, cell-y (p y) + 18, #ff2449]
      ]
    ]
  range 5 each [c | lit : g held has c, rect [cell-x c + 2, 246, 32, 8, lit [#ffdb49] else [#242424]], text ["HOLD", cell-x c + 18, 250, 8, lit [#241212] else [#494949]]]
]
bill-line : [g |
  owed : bill-for [g dive, g pressure]
  text ["SHIP WANTS [owed]", 16, 72, 8, (g coins >= owed) [#92ff92] else [#ffdb92], "left"]
  range (g pulls min 12) each [i | circle [226 - (i - 1 * 7), 72, 2, #ff9224]]
]
buttons : [g now |
  owed : bill-for [g dive, g pressure]
  can-pay : (g rolling not) and (g coins >= owed) and (g pulls > 0)
  surfacing : g pulls = 0
  rect [16, 310, 120, 40, #6d4924]
  rect [18, 312, 116, 36, (g rolling) [#492412] else [#b62424]]
  text [surfacing ["SURFACE"] else ["PULL"], 76, 326, 16, #ffffff]
  text [surfacing ["PAY OR SNAP"] else ["[g pulls] OF AIR"], 76, 342, 8, #ffdb92]
  rect [144, 310, 82, 40, #6d4924]
  rect [146, 312, 78, 36, can-pay [#246d24] else [#242424]]
  text ["PAY", 185, 324, 8, can-pay [#ffffff] else [#6d6d6d]]
  text ["[owed]", 185, 338, 8, can-pay [#ffdb49] else [#6d6d6d]]
]
items-row : [g |
  range 3 each [i |
    ix : i - 1 * 78 + 8
    has-it : i <= (g items length)
    it-now : has-it [item-named (g items @ i)] else [item-book @ 1]
    has-it
      rect [ix, 276, 72, 28, #4992db]
      rect [ix + 2, 278, 68, 24, #00244a]
      text [it-now tag, ix + 36, 285, 8, #ffffff]
      text ["USE", ix + 36, 296, 8, #92b6db]
    has-it not
      outline [ix, 276, 72, 28, #24496d]
  ]
  g doubled
    text ["X2 READY", 120, 268, 8, #ffdb49]
  g flare
    text ["FLARE LIT", 120, 268, 8, #ff9224]
]
bottom : [g now |
  rect [0, 354, W, 46, #000024]
  text ["LUCKY", 22, 364, 8, #92b6db]
  sprite [symbol-art get-in [g lucky], 10, 372, ink, false, 1]
  g breakdown take 4 numbered each [[i, pt] |
    amount : pt @ 2
    sign : (amount > 0) ["+"] else [""]
    text ["[pt @ 1] [sign][amount]", 46, i * 10 + 354, 8, (amount > 0) [#92ff92] else [#ff6d6d], "left"]
  ]
  text ["[g shown]", 230, 372, 16, #ffdb49, "right"]
  text ["COINS", 230, 390, 8, #92b6db, "right"]
]
said-banner : [g now |
  (g said != "") and (now - (g said-at) < 3)
    rect [0, 256, W, 14, #000000]
    text [g said, W / 2, 263, 8, (g paid < 0) [#ff6d6d] else [#ffdb49]]
]
draw-dive : [g now |
  machine [g, now]
  shelf g
  info g
  bill-line g
  items-row g
  buttons [g, now]
  bottom [g, now]
  said-banner [g, now]
  gauge [g, now]
  focus-ring [g, now]
  ui strip ["DIVE [g dive]", zone-names @ (zone-of (g dive)), "[g shown]C", #ffdb92, #241200]
]

-- ================================================================ drawing: the shop
card : [sx sy w h edge | rect [sx, sy, w, h, edge], rect [sx + 2, sy + 2, w - 4, h - 4, #121224]]
draw-shop : [g now |
  rect [0, 0, W, H, #000024]
  shelf g
  info g
  sprite [crab-art, 4, 70 + ((now * 2) sin * 2 floor), ink, false, 2]
  format wrap [g said, 23] take 2 numbered each [[i, words] | text [words, 44, i * 11 + 70, 8, #ffffff, "left"]]
  text ["RELICS", 6, 104, 8, #92b6db, "left"]
  g offers numbered each [[i, rn] |
    r : relic-named rn
    sx : i - 1 * 78 + 6
    cost : price-of [g, r cost]
    card [sx, 110, 72, 68, rarity-colours get-in [r rarity]]
    text [r tag, sx + 36, 124, 16, #ffffff]
    format wrap [r name, 8] take 2 numbered each [[k, words] | text [words, sx + 36, k * 10 + 134, 8, #dbdbdb]]
    text ["[cost]C", sx + 36, 168, 8, (g coins >= cost) [#ffdb49] else [#ff6d6d]]
  ]
  text ["TO USE ONCE", 6, 184, 8, #92b6db, "left"]
  g con-offers numbered each [[i, iname] |
    it-now : item-named iname
    sx : i - 1 * 118 + 6
    cost : price-of [g, it-now cost]
    card [sx, 190, 110, 26, #4992db]
    text [it-now name, sx + 6, 198, 8, #ffffff, "left"]
    text ["[cost]C", sx + 104, 208, 8, (g coins >= cost) [#ffdb49] else [#ff6d6d], "right"]
  ]
  text ["SYMBOLS", 6, 222, 8, #92b6db, "left"]
  g add-offers numbered each [[i, sym] |
    sx : i - 1 * 78 + 6
    card [sx, 228, 72, 34, #49db92]
    sprite [symbol-art get-in [sym], sx + 6, 237, ink, false, 1]
    text ["+1", sx + 40, 241, 8, #ffffff]
    text ["[add-cost (g dive)]C", sx + 40, 252, 8, #ffdb49]
  ]
  text ["YOUR BAG: [g bag length]", 6, 268, 8, #92b6db, "left"]
  counts-now : bag counts (g bag)
  bag-kinds g numbered each [[i, k] |
    sx : i - 1 * 23 + 6
    chosen : i = (g pick-kind)
    rect [sx, 274, 22, 30, chosen [#ffdb49] else [#24496d]]
    rect [sx + 1, 275, 20, 28, #121224]
    sprite [symbol-art get-in [k], sx + 3, 276, ink, false, 1]
    n-of : counts-now get-in [k]
    text ["[n-of]", sx + 11, 298, 8, #ffffff]
  ]
  card [6, 310, 72, 22, #db6d49]
  text ["SCRAP [scrap-cost]", 42, 321, 8, #ffffff]
  card [84, 310, 72, 22, #ffdb49]
  text ["GILD [gild-cost]", 120, 321, 8, #ffffff]
  card [162, 310, 72, 22, #92b6db]
  text ["NEW [reroll-cost g]", 198, 321, 8, #ffffff]
  rect [6, 340, 228, 52, #6d4924]
  rect [8, 342, 224, 48, #246d6d]
  text ["DIVE TO [g dive + 1]", 120, 358, 16, #ffffff]
  owed-next : bill-for [g dive + 1, g pressure]
  text ["NEXT BILL [owed-next]. 2 DIVES TOO.", 120, 378, 8, #ffdb92]
  focus-ring [g, now]
  ui strip ["SALVAGE", "DIVE [g dive] PAID", "[g shown]C", #ffdb92, #241200]
]

-- ================================================================ drawing: the title and the end
draw-title : [g now |
  range 10 each [i | rect [0, i - 1 * 40, W, 40, #24b6db mix [#000012, i - 1 / 9]]]
  range 16 each [i | circle [i * 53 % 228 + 6, H - (now * (12 + (i % 4 * 5)) + (i * 41) % (H + 20)), 1 + (i % 3), #b6dbff]]
  ui banner ["FATHOM", 54, 32, #ffdb49]
  ui banner ["A DIVING BELL'S SLOT MACHINE", 84, 8, #dbf6ff]
  bob : (now * 1.5) sin * 4 floor
  line [120, 96, 120, 136 + bob, #dbdbdb]
  sprite [bell-art, 88, 136 + bob, ink, false, 4]
  blur-kinds numbered each [[i, s] | sprite [symbol-art get-in [s], i - 1 * 28 + 10, 230 + ((now * 2 + i) sin * 3 floor), ink, false, 1]]
  text ["DEEPEST: DIVE [g deepest]", W / 2, 266, 8, #ffdb92]
  found-count : relic-book count [r | r zone <= (g unlocked)]
  total-relics : relic-book length
  text ["RELICS FOUND: [found-count] OF [total-relics]", W / 2, 280, 8, #92b6db]
  g pressure-max > 0
    text ["< [pressure-names @ (g pressure + 1)] >", W / 2, 300, 8, (g pressure > 0) [#ff6d6d] else [#ffffff]]
  ui blink ["TAP OR PRESS 1 TO DIVE", 330, #ffffff, now]
  text ["2 PULLS IN A DIVE", W / 2, 352, 8, #6d92b6]
]
draw-snapped : [g now |
  since : now - (g mode-at)
  rect [0, 0, W, H, #000012]
  sprite [bell-art, 88, since * 30 + 150 min 330, ink, false, 4]
  ui banner ["THE LINE SNAPS", 70, 16, #ff6d6d]
  ui banner [g said, 96, 8, #ffffff]
  ui banner ["YOU REACHED DIVE [g dive]", 116, 8, #ffdb92]
  ui banner ["[zone-names @ (zone-of (g dive))]", 132, 8, #92b6db]
  ui banner ["DEEPEST: DIVE [g deepest]", 150, 8, #ffdb49]
  since > 1.5
    ui blink ["TAP OR PRESS 1", 380, #ffffff, now]
]
draw : [game |
  g : game
  now : g clock
  clear #000000
  g mode = "title"
    draw-title [g, now]
  g mode = "dive"
    water [zone-of (g dive), now]
    draw-dive [g, now]
  g mode = "shop"
    draw-shop [g, now]
  g mode = "snapped"
    draw-snapped [g, now]
]
