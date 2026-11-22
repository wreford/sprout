-- dice: rolls you can repeat with a seed, written the way tabletop games write them (2d6+3), and the odds of every
-- total. Distilled from the TaskIAP games: 66 of the 319 roll dice.

-- the faces of n dice with sides sides
-- e.g. dice rolls [3, 6, 7]
rolls : [n sides seed | range n collect [k | seeded whole [1, sides, seed * 31 + k]]]

-- the total of a roll written as 2d6+3, d20 or 3d8-1
-- e.g. dice roll ["2d6+3", 7]
roll : [notation seed |
  halves : notation split "d"
  how-many : (halves @ 1 = "") [1] else [halves @ 1 number]
  tail : halves @ 2
  plus : tail split "+"
  minus : tail split "-"
  sides : (plus length = 2) [plus @ 1 number] else [(minus length = 2) [minus @ 1 number] else [tail number]]
  extra : (plus length = 2) [plus @ 2 number] else [(minus length = 2) [0 - (minus @ 2 number)] else [0]]
  rolls [how-many, sides, seed] sum + extra
]

-- the chance of each total with n dice of sides sides, as [total, chance]
-- e.g. dice odds [2, 6] @ 6
odds : [n sides |
  ways : range n fold [[1], [before k | range (before length + sides) collect [i | range sides collect [f | (i - f >= 1) [before @ (i - f)] else [0]] sum]]]
  every-way : sides pow n
  ways numbered keep [[i, w] | w > 0] collect [[i, w] | [i - 1, w / every-way]]
]

-- the chance of rolling target or more with n dice of sides sides
-- e.g. dice at-least [2, 6, 10]
at-least : [n sides target | odds [n, sides] keep [[t, p] | t >= target] collect [[t, p] | p] sum]

-- a d20 rolled with advantage: two rolled, the higher kept
-- e.g. dice advantage 7
advantage : [seed | rolls [2, 20, seed] largest]
