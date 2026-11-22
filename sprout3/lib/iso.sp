-- iso: isometric views, the diamond tiles of city builders and tactics games. A cell is a pair, across x down the map;
-- a tile is the size of its diamond on screen, such as 64x32. Turn cells into screen points and back, draw in the
-- right order and find a tile's corners.

-- the middle of a cell's tile on screen
-- e.g. iso to-screen [2x1, 64x32] → 32x48
to-screen : [cell tile | pair [cell x - (cell y) * (tile x / 2), cell x + (cell y) * (tile y / 2)]]

-- the cell under a point on screen
-- e.g. iso from-screen [32x48, 64x32] → 2x1
-- e.g. iso from-screen [40x52, 64x32] → 2x1
from-screen : [p tile | a : p x / (tile x / 2), b : p y / (tile y / 2), pair [a + b / 2 round, b - a / 2 round]]

-- how far back a cell is: draw smaller first
-- e.g. iso depth 2x1 → 3
depth : [cell | cell x + (cell y)]

-- cells in the order to draw them, back to front
-- e.g. iso order [3x3, 1x1, 2x1] → [1x1, 2x1, 3x3]
order : [cells | cells sort-by [c | depth c]]

-- the four corners of a cell's tile on screen: top, right, bottom, left
-- e.g. iso diamond [0x0, 64x32] → [0x-16, 32x0, 0x16, -32x0]
diamond : [cell tile |
  c : to-screen [cell, tile]
  [c - (pair [0, tile y / 2]), c + (pair [tile x / 2, 0]), c + (pair [0, tile y / 2]), c - (pair [tile x / 2, 0])]
]

-- a point raised above a cell's tile by height pixels, for walls, trees and stacked blocks
-- e.g. iso raised [2x1, 64x32, 10] → 32x38
raised : [cell tile height | to-screen [cell, tile] - (pair [0, height])]
