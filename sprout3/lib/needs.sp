-- needs: what a pet, a plant or a person in a care game needs, as levels from 0 to 100 that fade as time goes by and are
-- filled by looking after them. The levels are a record ([food : 80, water : 60]); the rates say how much each one
-- drops a second. For virtual pets, farm animals, gardens and survival games.

-- each level dropped by its rate for dt seconds, kept between 0 and 100 (a level with no rate keeps still)
-- e.g. needs fade [[food : 80, water : 60], [food : 2, water : 4], 5] → [food : 70, water : 40]
-- e.g. needs fade [[food : 3, water : 60], [food : 2], 5] → [food : 0, water : 60]
fade : [levels rates dt |
  levels keys fold [levels, [out name |
    rate : rates get-in [name]
    drop : (rate = false) [0] else [rate * dt]
    out set-in [[name], (levels get-in [name]) - drop max 0 min 100]
  ]]
]

-- one level filled by an amount (or emptied by a negative one), kept between 0 and 100
-- e.g. needs fill [[food : 80, water : 60], "food", 30] → [food : 100, water : 60]
-- e.g. needs fill [[food : 80, water : 60], "water", -25] → [food : 80, water : 35]
fill : [levels name amount | levels set-in [[name], (levels get-in [name]) + amount max 0 min 100]]

-- the most urgent need: the name of the lowest level
-- e.g. needs lowest [food : 80, water : 60, clean : 70] → water
lowest : [levels | levels keys sort-by [name | levels get-in [name]] @ 1]

-- the names of the levels under a line, lowest first, to warn about
-- e.g. needs under [[food : 80, water : 20, clean : 35], 40] → [water, clean]
under : [levels line | levels keys keep [name | (levels get-in [name]) < line] sort-by [name | levels get-in [name]]]

-- how well looked after, all told: the average of the levels, rounded
-- e.g. needs care [food : 90, water : 60, clean : 71] → 74
care : [levels | levels values sum / (levels values length) round]

-- a word for how it feels: HAPPY, OK or SAD from the average, or what it needs most when one level is very low
-- e.g. needs mood [food : 90, water : 80] → HAPPY
-- e.g. needs mood [food : 50, water : 45] → OK
-- e.g. needs mood [food : 90, water : 10] → WATER?
mood : [levels |
  worst : lowest levels
  cond [(levels get-in [worst]) < 20, worst upper .. "?", care levels >= 70, "HAPPY", care levels >= 40, "OK", any, "SAD"]
]
