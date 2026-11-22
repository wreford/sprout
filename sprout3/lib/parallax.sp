-- parallax: layers that scroll at their own speeds, as far things go by slowly and near things fast: where a layer is
-- for a camera, the copies of a repeating layer that cover the screen, where a thing in the world shows, and whether
-- it shows at all. A depth of 1 moves with the world, 0.5 at half its speed, 0 not at all.

-- how far a layer at depth has moved when the camera has moved so far
-- e.g. parallax offset [200, 0.5] → 100
offset : [camera depth | camera * depth]

-- where a thing in the world shows on the screen, on a layer at depth
-- e.g. parallax to-screen [300, 100, 1] → 200
-- e.g. parallax to-screen [300, 100, 0.5] → 250
to-screen : [world-x camera depth | world-x - (camera * depth)]

-- does a thing at world-x, so wide, show on a screen so wide for the camera?
-- e.g. parallax on-screen [300, 16, 100, 256] → true
-- e.g. parallax on-screen [90, 16, 100, 256] → true
-- e.g. parallax on-screen [70, 16, 100, 256] → false
on-screen : [world-x wide camera screen | spot : world-x - camera, (spot + wide > 0) and (spot < screen)]

-- the places across the screen of a layer drawn again every spacing pixels, one more at each side so nothing pops in
-- e.g. parallax copies [100, 0.5, 64, 256] → [-114, -50, 14, 78, 142, 206]
-- e.g. parallax copies [0, 1, 128, 256] → [-128, 0, 128, 256]
copies : [camera depth spacing screen | moved : camera * depth % spacing + spacing % spacing, range (screen / spacing ceil + 2) collect [k | k - 2 * spacing - moved]]

-- which piece of a stretch laid out in pieces so wide a place in the world falls in, counting from 1
-- e.g. parallax piece-at [70, 32] → 3
piece-at : [world-x size | world-x / size floor + 1]

-- the letter of a plan (a stretch written a letter a piece, like "..h.._..") under a place in the world, or "." past
-- its end
-- e.g. parallax letter-at ["..h_", 70, 32] → h
-- e.g. parallax letter-at ["..h_", 500, 32] → .
letter-at : [plan world-x size | k : piece-at [world-x, size], (k >= 1) and (k <= (plan length)) [plan chars @ k] else ["."]]
