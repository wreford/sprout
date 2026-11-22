-- runs: a well of cells for falling-block and matching games, kept as rows of text, one letter a cell and "." for an
-- empty one: ["..r.", "rrgg"]. Find the runs of one letter long enough to pop, empty them, and let what is loose fall,
-- while the letters named as fixed stay where they are. Places are pairs, across then down, counting from 1x1 at the
-- top left.

-- the cell at a place, "." past the edges
-- e.g. runs cell-at [["ab", "cd"], 2x1] → b
-- e.g. runs cell-at [["ab", "cd"], 3x1] → .
cell-at : [rows place | (place x < 1) or (place y < 1) or (place y > (rows length)) or (place x > (rows @ 1 length)) ["."] else [rows @ (place y) chars @ (place x)]]

-- the rows with one cell put at a place
-- e.g. runs put [["ab", "cd"], 1x2, "x"] → [ab, xd]
put : [rows place cell | rows numbered collect [[row, line] | (row = (place y)) [line chars numbered collect [[col, c] | (col = (place x)) [cell] else [c]] join ""] else [line]]]

-- are all these places inside the rows and empty? (can a piece go there)
-- e.g. runs open [["..", "r."], [1x1, 2x2]] → true
-- e.g. runs open [["..", "r."], [1x2]] → false
-- e.g. runs open [["..", "r."], [0x1]] → false
open : [rows places | places all [p | (p x >= 1) and (p y >= 1) and (p y <= (rows length)) and (p x <= (rows @ 1 length)) and (cell-at [rows, p] = ".")]]

-- the places in runs of at least least cells of the same letter, across or down, each place once, row by row
-- e.g. runs find [["rrrr", "g..."], 4] → [1x1, 2x1, 3x1, 4x1]
-- e.g. runs find [["r.", "r.", "r."], 3] → [1x1, 1x2, 1x3]
-- e.g. runs find [["rr.r", "...."], 3] → []
find : [rows least |
  height : rows length
  width : rows @ 1 length
  look : [col row | cell-at [rows, pair [col, row]]]
  reach : [col row dx dy | c : look [col, row], step : [k | (look [col + (dx * k), row + (dy * k)] = c) [step (k + 1)] else [k]], step 1 - 1]
  in-run : [col row | (look [col, row] != ".") and ((reach [col, row, -1, 0] + 1 + (reach [col, row, 1, 0]) >= least) or (reach [col, row, 0, -1] + 1 + (reach [col, row, 0, 1]) >= least))]
  range (width * height) collect [i | pair [i - 1 % width + 1, i - 1 / width floor + 1]] keep [p | in-run [p x, p y]]
]

-- the rows with these places emptied
-- e.g. runs clear [["ab", "cd"], [1x1, 2x2]] → [.b, c.]
clear : [rows places | rows numbered collect [[row, line] | line chars numbered collect [[col, c] | (places has (pair [col, row])) ["."] else [c]] join ""]]

-- one column of cells, top to bottom, with every loose cell dropped onto whatever holds it up: the bottom, another
-- cell, or a fixed letter, which stays where it is
-- e.g. runs settle [["a", ".", "R", "b", "."], "R"] → [., a, R, ., b]
settle : [cells fixed |
  held : fixed chars
  kind : [c | (held has c) [0] else [(c = ".") [1] else [2]]]
  cells numbered sort-by [[i, c] | cells take i keep [d | held has d] length * 3 + (kind c)] collect [[i, c] | c]
]

-- the rows with every loose cell fallen as far as it goes; the letters in fixed stay put
-- e.g. runs fall [["a.", "..", ".b"], ""] → [.., .., ab]
-- e.g. runs fall [["a.", "R.", ".."], "R"] → [a., R., ..]
-- e.g. runs fall [[".a", "b.", "R.", ".."], "R"] → [.., b., R., .a]
fall : [rows fixed |
  height : rows length
  width : rows @ 1 length
  columns : range width collect [col | settle [range height collect [row | rows @ row chars @ col], fixed]]
  range height collect [row | range width collect [col | columns @ col @ row] join ""]
]

-- how many cells in the rows are one of these letters
-- e.g. runs count [["R.r", "G.."], "RGB"] → 2
count : [rows letters | held : letters chars, rows collect [line | line chars keep [c | held has c] length] fold [0, [a b | a + b]]]
