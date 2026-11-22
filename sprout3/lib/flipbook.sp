-- flipbook: animation by frames, as sprites flick through a sheet of pictures: which frame shows now, looping, once,
-- back and forth, where a frame sits in a sprite sheet, which way to face and which row of a sheet to use for a
-- direction. Frames count from 1.

-- the frame showing now, looping through count frames at fps a second
-- e.g. flipbook frame [8, 12, 1.25] → 8
frame : [count fps now | now * fps floor % count + 1]

-- the frame showing now when played once from start, then held on the last
-- e.g. flipbook once [5, 10, 2, 2.35] → 4
once : [count fps start now | now - start * fps floor max 0 min (count - 1) + 1]

-- has playing once from start finished?
-- e.g. flipbook done [5, 10, 2, 2.6] → true
done : [count fps start now | now - start * fps >= count]

-- the frame showing now, playing forward then back (1, 2, 3, 4, 3, 2, 1, ...)
-- e.g. range 8 collect [k | flipbook swing [4, 1, k - 1]] → [1, 2, 3, 4, 3, 2, 1, 2]
swing : [count fps now | (count < 2) [1] else [k : now * fps floor % (count * 2 - 2), (k < count) [k + 1] else [count * 2 - 1 - k]]]

-- the frame showing now from a list of frames
-- e.g. flipbook pick [["walk1", "walk2", "walk3"], 8, 0.5] → walk2
pick : [frames fps now | frames @ (frame [frames length, fps, now])]

-- where a frame sits on a sprite sheet with some columns, across x down
-- e.g. flipbook sheet-cell [7, 4] → 3x2
sheet-cell : [index columns | pair [index - 1 % columns + 1, index - 1 / columns floor + 1]]

-- the box a frame takes on a sprite sheet, [at, size]
-- e.g. flipbook sheet-rect [7, 4, 32x32] → [at : 64x32, size : 32x32]
sheet-rect : [index columns frame-size | c : sheet-cell [index, columns], [at : c - 1 * frame-size, size : frame-size]]

-- which way to face from speed across: 1 right, -1 left, and the way it was when standing still
-- e.g. flipbook facing [-40, 1] → -1
facing : [speed-x was | cond [speed-x > 0, 1, speed-x < 0, -1, any, was]]

-- which of n directions an angle points (1 is right, then clockwise on screen), to pick a row of a sheet
-- e.g. flipbook direction [pi / 2, 4] → 2
direction : [angle n | angle / (pi * 2 / n) round % n + 1]
