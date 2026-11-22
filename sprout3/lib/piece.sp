-- piece: the pieces of a block puzzle and the board they go on. A board is a grid (rows of values, 0 for an empty
-- square); a piece is its cells, pairs counted from 0x0 at its top left, written as rows of text with # for a cell.
-- See where a piece fits, put it on, find the rows and columns that are full and clear them. Places on the board
-- count from 1, as in grid.

-- a piece's cells from rows of text, # for a cell and anything else for none
-- e.g. piece cells ["##", "#."] → [0x0, 1x0, 0x1]
cells : [lines | lines numbered collect-flat [[r, line] | line chars numbered keep [[c, ch] | ch = "#"] collect [[c, ch] | pair [c - 1, r - 1]]]]

-- how many columns across and rows down a piece takes
-- e.g. piece size [0x0, 1x0, 0x1] → 2x2
size : [bits | pair [bits collect [b | b x] largest + 1, bits collect [b | b y] largest + 1]]

-- does the piece go on the board with its top left at a place: all inside, all on empty squares?
-- e.g. piece fits [grid make [3x3, 0], [0x0, 1x0], 2x1] → true
-- e.g. piece fits [grid make [3x3, 0], [0x0, 1x0], 3x1] → false
-- e.g. piece fits [[[0, 5, 0]], [0x0], 2x1] → false
fits : [board bits at | bits all [b | spot : at + b, (grid inside [board, spot]) and (grid at [board, spot] = 0)]]

-- the board with the piece put on at a place, its squares set to value
-- e.g. piece put [grid make [3x2, 0], [0x0, 1x0, 1x1], 1x1, 7] → [[7, 7, 0], [0, 7, 0]]
put : [board bits at value | bits fold [board, [done b | grid put [done, at + b, value]]]]

-- every place where the piece fits, row by row
-- e.g. piece spots [grid make [2x2, 0], [0x0, 1x0]] → [1x1, 1x2]
spots : [board bits | room : grid size board, range (room y) collect-flat [r | range (room x) collect [c | pair [c, r]]] keep [p | fits [board, bits, p]]]

-- does the piece fit anywhere on the board?
-- e.g. piece anywhere [[[1, 0], [0, 1]], [0x0, 1x0]] → false
-- e.g. piece anywhere [[[1, 0], [0, 0]], [0x0, 1x0]] → true
anywhere : [board bits | spots [board, bits] length > 0]

-- the rows and the columns with no empty square left
-- e.g. piece full-lines [[1, 1], [0, 1]] → [rows : [1], columns : [2]]
full-lines : [board |
  across : board numbered keep [[i, row] | row all [v | v != 0]] collect [[i, row] | i]
  down : range (board @ 1 length) keep [c | board all [row | row @ c != 0]]
  [rows : across, columns : down]
]

-- how many lines are full, rows and columns together
-- e.g. piece full-count [[1, 1], [1, 0]] → 2
full-count : [board | lines : full-lines board, lines rows length + (lines columns length)]

-- the board with some rows and columns emptied, as full-lines gives them
-- e.g. piece clear [[[1, 1], [0, 1]], [rows : [1], columns : [2]]] → [[0, 0], [0, 0]]
clear : [board lines | board numbered collect [[r, row] | row numbered collect [[c, v] | ((lines rows has r) or (lines columns has c)) [0] else [v]]]]

-- the squares a clear empties, as places, each once
-- e.g. piece cleared [[[1, 1], [0, 1]], [rows : [1], columns : [2]]] → [1x1, 2x1, 2x2]
cleared : [board lines | grid cells board keep [[p, v] | (v != 0) and ((lines rows has (p y)) or (lines columns has (p x)))] collect [[p, v] | p]]

-- the piece turned a quarter round clockwise, still counted from 0x0
-- e.g. piece turn [0x0, 1x0, 2x0] → [0x0, 0x1, 0x2]
-- e.g. piece turn [0x0, 0x1, 1x1] → [1x0, 0x0, 0x1]
turn : [bits | tall : bits collect [b | b y] largest, bits collect [b | pair [tall - (b y), b x]]]

-- how many squares of the board are filled
-- e.g. piece filled [[1, 0], [0, 3]] → 2
filled : [board | board collect [row | row count [v | v != 0]] sum]
