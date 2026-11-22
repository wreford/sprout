-- span: ranges written as pairs, low x high (0x10 runs from 0 to 10): keeping a value inside one, where a value sits
-- in one, carrying a value from one range to another, wrapping, snapping and fading. For sliders, health bars,
-- scrolling, volume and anything kept within bounds.

-- value kept inside bounds
-- e.g. span clamp [12, 0x10] → 10
clamp : [value bounds | value max (bounds x) min (bounds y)]

-- the value a share t of the way through bounds (0 is low, 1 is high)
-- e.g. span mix [0x10, 0.25] → 2.5
mix : [bounds t | bounds y - (bounds x) * t + (bounds x)]

-- how far through bounds value is: 0 at low, 1 at high
-- e.g. span where [2.5, 0x10] → 0.25
where : [value bounds | value - (bounds x) / (bounds y - (bounds x))]

-- value carried from one range to another: the same share of the way through
-- e.g. span remap [5, 0x10, 0x100] → 50
-- e.g. span remap [25, 0x100, 1x0] → 0.75
remap : [value from to | mix [to, where [value, from]]]

-- value wrapped round inside bounds, as an angle wraps round a circle
-- e.g. span wrap [12, 0x10] → 2
-- e.g. span wrap [-1, 0x10] → 9
wrap : [value bounds | width : bounds y - (bounds x), value - (bounds x) % width + (bounds x)]

-- value bounced back and forth between the ends of bounds
-- e.g. span bounce [12, 0x10] → 8
bounce : [value bounds | width : bounds y - (bounds x), k : value - (bounds x) % (width * 2), (k > width) [width * 2 - k + (bounds x)] else [k + (bounds x)]]

-- value moved to the nearest multiple of step
-- e.g. span snap [7.3, 0.5] → 7.5
snap : [value step | value / step round * step]

-- the choice nearest value
-- e.g. span nearest [12, [0, 10, 25]] → 10
nearest : [value choices | choices smallest-by [c | c - value abs]]

-- does bounds hold value, ends included?
-- e.g. span holds [0x10, 10] → true
holds : [bounds value | (value >= (bounds x)) and (value <= (bounds y))]

-- how wide bounds is
-- e.g. span width 2x7 → 5
width : [bounds | bounds y - (bounds x)]

-- the part two ranges share, or false if they don't meet
-- e.g. span overlap [0x5, 3x8] → 3x5
-- e.g. span overlap [0x2, 3x8] → false
overlap : [a b | low : a x max (b x), high : a y min (b y), (low <= high) [pair [low, high]] else [false]]

-- n + 1 evenly spaced values from low to high
-- e.g. span steps [0x10, 4] → [0, 2.5, 5, 7.5, 10]
steps : [bounds n | range (n + 1) collect [k | mix [bounds, k - 1 / n]]]

-- 0 below bounds, 1 above, and a smooth climb between (smoothstep)
-- e.g. span fade [2.5, 0x10] → 0.15625
fade : [value bounds | t : where [value, bounds] max 0 min 1, t * t * (3 - (t * 2))]
