-- automata: worlds of cells that all change at once by simple rules: Life and its cousins, caves grown from noise, and
-- the one-row patterns of rule 30 and rule 90. A world is a grid, a list of rows, of true (alive, or rock) and false.

-- the next turn of a world: an empty cell comes alive when its count of live neighbours is in born, and a live one
-- lives on when its count is in stay (Life is born [3], stay [2, 3]); beyond the edge counts as empty
-- e.g. automata step [[[false, true, false], [false, true, false], [false, true, false]], [3], [2, 3]] → [[false, false, false], [true, true, true], [false, false, false]]
step : [world born stay |
  world numbered collect [[y, cells] | cells numbered collect [[x, alive] |
    neighbours : grid count-around [world, pair [x, y], true]
    (alive and (stay has neighbours)) or ((alive not) and (born has neighbours))
  ]]
]

-- a cave map of size grown from noise: each cell starts as rock (true) by the chance fill, then each turn a cell is
-- rock when 5 of the 8 round it are rock (4 if it is rock already); beyond the edge counts as rock, and the border
-- stays rock (the caves of a roguelike)
-- e.g. automata caves [10x7, 0.42, 2, 7] collect [cells | cells collect [rock | rock ["#"] else ["."]] join ""] → [##########, ###.....##, ##......##, ##......##, ##......##, ##.###..##, ##########]
caves : [size fill turns seed |
  first-world : range (size y) collect [y | range (size x) collect [x | seeded chance [fill, seed * 1000003 + (y * 1009) + x]]]
  smooth : [world |
    world numbered collect [[y, cells] | cells numbered collect [[x, rock] |
      border : (x = 1) or (y = 1) or (x = (size x)) or (y = (size y))
      off-edge : 8 - (grid around [world, pair [x, y]] length)
      rock-round : grid count-around [world, pair [x, y], true] + off-edge
      border or (rock-round >= 5) or (rock and (rock-round >= 4))
    ]]
  ]
  range turns fold [first-world, [world k | smooth world]]
]

-- the next row of a one-row world by an elementary rule from 0 to 255: each cell looks at itself and the cells either
-- side (beyond the ends counts as empty); rule 90 draws Sierpinski's triangle, and rule 30 looks random
-- e.g. automata next-row [[false, false, true, false, false], 90] → [false, true, false, true, false]
-- e.g. automata next-row [[false, false, true, false, false], 30] → [false, true, true, true, false]
next-row : [cells rule |
  cells numbered collect [[k, alive] |
    before-it : (k > 1) and (cells @ (k - 1) = true)
    after-it : (k < (cells length)) and (cells @ (k + 1) = true)
    pattern : (before-it [4] else [0]) + (alive [2] else [0]) + (after-it [1] else [0])
    rule / (2 pow pattern) floor % 2 = 1
  ]
]
