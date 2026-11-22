-- tilemap: levels drawn as text, a character a tile, as platform and maze games build them. Read the tile at a
-- point, find where each kind of tile is, clear the markers once their things are made, and move a body through the
-- map without passing into walls, landing on one-way platforms from above. A map is a list of rows of text; cells are
-- pairs across x down from 1x1; tile is a tile's size in pixels; a body is [at, speed], at being the top left of a box.

-- the character at a pixel point, a space off the map
-- e.g. tilemap char-at [["..#", "###"], 40x20, 16] → #
-- e.g. tilemap char-at [["..#", "###"], 40x-5, 16] = " " → true
char-at : [map p tile |
  col : p x / tile floor + 1
  row : p y / tile floor + 1
  line : map @ row
  ch : ((row >= 1) and (col >= 1) and (line != false)) [line slice [col, col]] else [""]
  (ch = "") [" "] else [ch]
]

-- the cell a pixel point is in
-- e.g. tilemap to-cell [40x20, 16] → 3x2
to-cell : [p tile | pair [p x / tile floor + 1, p y / tile floor + 1]]

-- the top left pixel of a cell
-- e.g. tilemap to-pixel [3x2, 16] → 32x16
to-pixel : [cell tile | cell - 1 * tile]

-- how big a map is, in pixels
-- e.g. tilemap size-of [["....", "####"], 16] → 64x32
size-of : [map tile | pair [map @ 1 length * tile, map length * tile]]

-- every cell holding a character
-- e.g. tilemap find [[".o..", "#o##"], "o"] → [2x1, 2x2]
find : [map ch | map numbered collect-flat [[row, line] | line chars numbered keep [[col, c] | c = ch] collect [[col, c] | pair [col, row]]]]

-- the map with some characters turned to "." (the markers for things made from the map)
-- e.g. tilemap clear [[".o.g", "####"], "og"] → [...., ####]
clear : [map marks | map collect [line | line chars collect [c | (marks chars has c) ["."] else [c]] join ""]]

-- is a pixel point inside a tile whose character is one of chars?
-- e.g. tilemap solid [["....", "####"], 20x18, 16, "#"] → true
solid : [map p tile chars | chars chars has (char-at [map, p, tile])]

-- does a box at a point touch a tile whose character is one of chars (thorns, water, a door)?
-- e.g. tilemap touches [["..^.", "####"], 28x2, 12x12, 16, "^"] → true
touches : [map at size tile chars |
  inner : [at + 1, at + (pair [size x - 1, 1]), at + (pair [1, size y - 1]), at + size - 1, at + (size / 2)]
  inner count [p | chars chars has (char-at [map, p, tile])] > 0
]

-- a body moved for dt seconds through the map without passing into tiles whose characters are in solids, landing on
-- those in platforms only from above. Gives the body with ground (standing on something), wall (1 or -1 when it hit
-- one going right or left, else 0) and ceiling
-- e.g. tilemap move [[at : 0x10, speed : 0x60], 12x12, ["....", "####"], 16, "#", "=", 0.1] at → 0x4
-- e.g. tilemap move [[at : 18x0, speed : 100x0], 12x12, ["..#.", "####"], 16, "#", "=", 0.1] wall → 1
-- e.g. tilemap move [[at : 0x2, speed : 0x60], 12x12, ["....", "==..", "####"], 16, "#", "=", 0.1] ground → true
move : [body size map tile solids platforms dt |
  at : body at
  v : body speed
  hits : [points kinds | points count [q | kinds chars has (char-at [map, q, tile])] > 0]
  nx : at x + (v x * dt)
  ys : [at y + 1, at y + (size y / 2), at y + (size y) - 1]
  right-hit : (v x > 0) and (hits [ys collect [h | pair [nx + (size x) - 0.01, h]], solids])
  left-hit : (v x < 0) and (hits [ys collect [h | pair [nx, h]], solids])
  x2 : cond [right-hit, nx + (size x) - 0.01 / tile floor * tile - (size x), left-hit, nx / tile floor + 1 * tile, any, nx]
  ny : at y + (v y * dt)
  xs : [x2 + 1, x2 + (size x / 2), x2 + (size x) - 1]
  feet : ny + (size y) - 0.01
  under : xs collect [w | pair [w, feet]]
  was-above : at y + (size y) <= (feet / tile floor * tile + 0.01)
  down-hit : (v y >= 0) and ((hits [under, solids]) or (was-above and (hits [under, platforms])))
  up-hit : (v y < 0) and (hits [xs collect [w | pair [w, ny]], solids])
  y2 : cond [down-hit, feet / tile floor * tile - (size y), up-hit, ny / tile floor + 1 * tile, any, ny]
  [
    at : pair [x2, y2], speed : pair [(right-hit or left-hit) [0] else [v x], (down-hit or up-hit) [0] else [v y]]
    ground : down-hit, wall : cond [right-hit, 1, left-hit, -1, any, 0], ceiling : up-hit
  ]
]

-- would a box standing at a point walk off an edge going one way (1 right, -1 left)? For walkers that turn back
-- e.g. tilemap drop-ahead [["....", "##.."], 20x4, 12x12, 1, 16, "#="] → true
drop-ahead : [map at size dir tile ground |
  foot : pair [(dir > 0) [at x + (size x) + 1] else [at x - 1], at y + (size y) + 1]
  (ground chars has (char-at [map, foot, tile])) not
]
