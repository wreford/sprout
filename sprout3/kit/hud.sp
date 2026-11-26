-- hud: what a game shows over its play: hearts (halves too), coins, a score with its zeros in front, a timer that
-- warns, a meter in cells, a minimap and an arrow toward something off the screen. A kit (decision 122): it draws with
-- the game's own words, so it comes along when a game names it. A game with a cell of its own called hud keeps its
-- own, so call that one draw-hud to use these.

-- one heart, eight pixels across: l is its left half and r its right, so a half heart is two colours
heart-art : [
  ".ll..rr."
  "llllrrrr"
  "llllrrrr"
  ".lllrrr."
  "..llrr.."
  "...lr..."
]

-- a row of hearts ten pixels apart, have of most of them full, and half a heart for a half
-- e.g. hud hearts [10x10, 1.5, 2, #ff0000, #555555] draws sprite [[.ll..rr., llllrrrr, llllrrrr, .lllrrr., ..llrr.., ...lr...], 10, 10, [l : #ff0000, r : #ff0000]], sprite [[.ll..rr., llllrrrr, llllrrrr, .lllrrr., ..llrr.., ...lr...], 20, 10, [l : #ff0000, r : #555555]]
hearts : [at have most full empty |
  range most each [i |
    left-half : (i - 0.5 <= have) [full] else [empty]
    right-half : (i <= have) [full] else [empty]
    sprite [heart-art, i - 1 * 10 + (at x), at y, [l : left-half, r : right-half]]
  ]
]

-- a coin and how many: a disc with a glint, and the number beside it
-- e.g. hud coins [10x10, 12, #ffaa00] draws circle [14, 14, 4, #ffaa00], rect [13, 12, 1, 4, #ffffff], text [12, 22, 14, 8, #ffaa00, left]
coins : [at many colour |
  circle [at x + 4, at y + 4, 4, colour]
  rect [at x + 3, at y + 2, 1, 4, #ffffff]
  text ["[many]", at x + 12, at y + 4, 8, colour, "left"]
]

-- a whole number as text with zeros in front, so many digits wide, the way an arcade shows a score
-- e.g. hud padded [120, 6] → 000120
-- e.g. hud padded [1234567, 6] → 1234567
padded : [value digits |
  shown : "[value floor]"
  "0" repeat (digits - (shown length) max 0) .. shown
]

-- the score with its zeros in front, from its top-left corner
-- e.g. hud score [4x4, 120, 6, #ffffff] draws text [000120, 4, 8, 8, #ffffff, left]
score : [at value digits colour | text [padded [value, digits], at x, at y + 4, 8, colour, "left"]]

-- time left as minutes and seconds, centred on at, in the warning colour every other half second in the last ten
-- e.g. hud timer [128x4, 65, #ffffff, #ff5555] draws text [1:05, 128, 8, 8, #ffffff]
-- e.g. hud timer [128x4, 9.2, #ffffff, #ff5555] draws text [0:10, 128, 8, 8, #ff5555]
-- e.g. hud timer [128x4, 9.7, #ffffff, #ff5555] draws text [0:10, 128, 8, 8, #ffffff]
timer : [at seconds colour warn |
  whole : seconds ceil max 0
  minutes : whole / 60 floor
  urgent : (seconds < 10) and (seconds * 2 floor % 2 = 0)
  text ["[minutes]:[padded [whole % 60, 2]]", at x, at y + 4, 8, urgent [warn] else [colour]]
]

-- a meter in cells four pixels wide with a gap between them, have of most lit, as a hero's energy
-- e.g. hud segments [10x10, 2, 3, #55ff55, #555555] draws rect [10, 10, 4, 6, #55ff55], rect [15, 10, 4, 6, #55ff55], rect [20, 10, 4, 6, #555555]
segments : [at have most colour back |
  range most each [i | rect [i - 1 * 5 + (at x), at y, 4, 6, (i <= have) [colour] else [back]]]
]

-- a small map of the whole world in a box at at, size big: each of dots is a [spot, colour] in the world's own units,
-- shown where it is
-- e.g. hud minimap [200x10, 40x30, 400x300, [[100x150, #ffff55]], #ffffff, #000000] draws rect [200, 10, 40, 30, #ffffff], rect [201, 11, 38, 28, #000000], rect [210, 25, 2, 2, #ffff55]
minimap : [at size world dots edge back |
  rect [at x, at y, size x, size y, edge]
  rect [at x + 1, at y + 1, size x - 2, size y - 2, back]
  dots each [[spot, colour] |
    across : spot x * (size x) / (world x) floor max 1 min (size x - 3)
    down : spot y * (size y) / (world y) floor max 1 min (size y - 3)
    rect [at x + across, at y + down, 2, 2, colour]
  ]
]

-- an arrowhead at the edge of the screen, so far in from it, pointing at a spot off the screen; nothing while the spot
-- is on it
-- e.g. hud pointer [300x96, 6, #ffff55] draws line [250, 96, 245, 93, #ffff55], line [250, 96, 245, 99, #ffff55]
-- e.g. hud pointer [100x96, 6, #ffff55] draws nothing
pointer : [target margin colour |
  tip-x : target x max margin min (W - margin)
  tip-y : target y max margin min (H - margin)
  across : target x - tip-x
  down : target y - tip-y
  far : (across * across + (down * down)) sqrt max 0.001
  ahead-x : across / far * 6
  ahead-y : down / far * 6
  wing-one : pair [tip-x - (ahead-x * 0.866) + (ahead-y * 0.5), tip-y - (ahead-x * 0.5) - (ahead-y * 0.866)]
  wing-two : pair [tip-x - (ahead-x * 0.866) - (ahead-y * 0.5), tip-y + (ahead-x * 0.5) - (ahead-y * 0.866)]
  (across != 0) or (down != 0)
    line [tip-x round, tip-y round, wing-one x round, wing-one y round, colour]
    line [tip-x round, tip-y round, wing-two x round, wing-two y round, colour]
]
