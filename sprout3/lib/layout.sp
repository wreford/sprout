-- layout: placing boxes on a screen, for menus, cards, buttons and HUDs. A box is [at, size], where at is its top left
-- corner and size its width x height, both pairs, as in collide. Cut a box into columns, rows, a grid or shares, inset
-- it, centre or pin something inside it, fit a picture in it, letterbox a game in a window and find which box a tap
-- fell in.

-- a box from its top left corner and its size
-- e.g. layout box [0x0, 320x240] → [at : 0x0, size : 320x240]
box : [corner extent | [at : corner, size : extent]]

-- a box with a margin taken off every side
-- e.g. layout inset [layout box [0x0, 100x50], 10] → [at : 10x10, size : 80x30]
inset : [b margin | [at : b at + margin, size : b size - (margin * 2)]]

-- a box cut into n columns with gaps between
-- e.g. layout columns [layout box [0x0, 320x40], 3, 10] collect [c | c at x] → [0, 110, 220]
columns : [b n gap |
  w : b size x - (gap * (n - 1)) / n
  range n collect [k | [at : pair [b at x + (k - 1 * (w + gap)), b at y], size : pair [w, b size y]]]
]

-- a box cut into n rows with gaps between
-- e.g. layout rows [layout box [0x0, 100x100], 2, 10] @ 2 → [at : 0x55, size : 100x45]
rows : [b n gap |
  h : b size y - (gap * (n - 1)) / n
  range n collect [k | [at : pair [b at x, b at y + (k - 1 * (h + gap))], size : pair [b size x, h]]]
]

-- a box cut across into widths in proportion to shares, with gaps between
-- e.g. layout split [layout box [0x0, 400x50], [1, 2, 1], 0] collect [c | c size x] → [100, 200, 100]
split : [b shares gap |
  room : b size x - (gap * (shares length - 1))
  widths : shares collect [s | s / (shares sum) * room]
  starts : widths scan [b at x, [x0 w | x0 + w + gap]]
  widths numbered collect [[k, w] | [at : pair [starts @ k, b at y], size : pair [w, b size y]]]
]

-- a box stacked with rows of the given heights, from the top, with gaps between
-- e.g. layout stack [layout box [0x0, 200x300], [40, 100], 10] @ 2 → [at : 0x50, size : 200x100]
stack : [b heights gap |
  starts : heights scan [b at y, [y0 h | y0 + h + gap]]
  heights numbered collect [[k, h] | [at : pair [b at x, starts @ k], size : pair [b size x, h]]]
]

-- a box cut into a grid, counts across x down, row by row
-- e.g. layout cells [layout box [0x0, 300x200], 3x2, 0] @ 4 → [at : 0x100, size : 100x100]
cells : [b counts gap |
  w : b size x - (gap * (counts x - 1)) / (counts x)
  h : b size y - (gap * (counts y - 1)) / (counts y)
  range (counts y) collect-flat [r | range (counts x) collect [c | [at : pair [b at x + (c - 1 * (w + gap)), b at y + (r - 1 * (h + gap))], size : pair [w, h]]]]
]

-- n boxes for n things, in as square a grid as fits (cards, thumbnails, levels)
-- e.g. layout tiles [layout box [0x0, 300x300], 5, 0] collect [t | t at] → [0x0, 100x0, 200x0, 0x150, 100x150]
tiles : [b n gap | across : n sqrt ceil, cells [b, pair [across, n / across ceil], gap] take n]

-- a box of a size, centred in another
-- e.g. layout centre [layout box [0x0, 320x240], 100x50] → [at : 110x95, size : 100x50]
centre : [b inner | [at : b size - inner / 2 + (b at), size : inner]]

-- a box of a size pinned inside another: where says how far across x down, 0x0 the top left, 1x1 the bottom right
-- e.g. layout place [layout box [0x0, 320x240], 40x20, 1x0] → [at : 280x0, size : 40x20]
place : [b inner where | [at : b size - inner * where + (b at), size : inner]]

-- the biggest box of a shape that fits inside another, centred (a picture shown whole)
-- e.g. layout fit [16x9, layout box [0x0, 400x400]] → [at : 0x87.5, size : 400x225]
fit : [shape-size b | k : b size x / (shape-size x) min (b size y / (shape-size y)), centre [b, shape-size * k]]

-- the smallest box of a shape that covers another, centred (a picture filling it, cropped)
-- e.g. layout cover [16x9, layout box [0x0, 400x400]] size x round → 711
cover : [shape-size b | k : b size x / (shape-size x) max (b size y / (shape-size y)), centre [b, shape-size * k]]

-- how to show a game made for one screen size in a window of another: the scale and where its corner goes
-- e.g. layout letterbox [320x240, 1280x800] → [scale : 3.3333333333, at : 106.6666666667x0]
letterbox : [game window | k : window x / (game x) min (window y / (game y)), [scale : k, at : window - (game * k) / 2]]

-- which box a point falls in, by its place in the list, or false
-- e.g. layout hit [layout columns [layout box [0x0, 300x50], 3, 0], 150x25] → 2
hit : [boxes p | boxes find-index [b | collide in-box [p, b]]]
