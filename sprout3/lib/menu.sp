-- menu: a cursor over a list of choices, a row of cards or a grid of squares: moving it, keeping it in bounds or
-- wrapping it round, scrolling a long list, and spending points along a row of values, as when building a player.
-- Places count from 1. Step it with pad way of the buttons just pressed.

-- the cursor moved by step, wrapping round from the end to the start
-- e.g. menu wrap [3, 3, 1] → 1
-- e.g. menu wrap [1, 3, -1] → 3
wrap : [cursor count step | cursor - 1 + step % count + count % count + 1]

-- the cursor moved by step, kept between 1 and count
-- e.g. menu clamp [3, 3, 1] → 3
-- e.g. menu clamp [2, 3, -1] → 1
clamp : [cursor count step | cursor + step max 1 min count]

-- the cursor in a grid with some columns moved by a pair, staying put where it would leave the grid or pass the last of
-- count
-- e.g. menu grid [2, 4, 10, 0x1] → 6
-- e.g. menu grid [8, 4, 10, 0x1] → 8
-- e.g. menu grid [4, 4, 10, 1x0] → 4
grid : [cursor columns count step |
  column : cursor - 1 % columns + (step x)
  row : cursor - 1 / columns floor + (step y)
  place : row * columns + column + 1
  (column >= 0) and (column < columns) and (row >= 0) and (place <= count) [place] else [cursor]
]

-- the first place to show of a long list, shown at a time, so that the cursor stays in sight near the middle
-- e.g. menu top [7, 4, 10] → 5
-- e.g. menu top [2, 4, 10] → 1
-- e.g. menu top [10, 4, 10] → 7
top : [cursor shown count | cursor - (shown / 2 floor) max 1 min (count - shown + 1 max 1)]

-- the choices to show of a long list, each with its place
-- e.g. menu window [["a", "b", "c", "d", "e"], 4, 3] → [[3, c], [4, d], [5, e]]
window : [items cursor shown | first : top [cursor, shown, items length], items numbered keep [[i, item] | (i >= first) and (i < (first + shown))]]

-- points spent along a row of values: the one at the cursor raised (or lowered, giving points back) by step, kept
-- between low and high, while there are points to spend; gives the values and the points to spare
-- e.g. menu spend [[2, 2, 2], 3, 1, 2, 1, 5] → [values : [2, 2, 3], spare : 1]
-- e.g. menu spend [[2, 2, 2], 1, 1, 0, 1, 5] → [values : [2, 2, 2], spare : 0]
-- e.g. menu spend [[2, 5, 2], 2, -1, 0, 1, 5] → [values : [2, 4, 2], spare : 1]
spend : [row cursor step points low high |
  was : row @ cursor
  raised : was + step max low min high
  cost : raised - was
  (cost <= points) [[values : row numbered collect [[i, v] | (i = cursor) [raised] else [v]], spare : points - cost]] else [[values : row, spare : points]]
]
