-- keyframes: values set at moments, and everything between worked out: the timelines of cutscenes, title screens,
-- moving platforms and lighting. Keys are [time, value] pairs in time order; values can be numbers or pairs, or any
-- value for held and crossed.

blend : [track t curve |
  final : track @ (track length)
  (t <= (track @ 1 @ 1)) [track @ 1 @ 2] else [
    (t >= (final @ 1)) [final @ 2] else [
      k : range (track length - 1) find [i | t < (track @ (i + 1) @ 1)]
      a : track @ k
      b : track @ (k + 1)
      b @ 2 - (a @ 2) * (curve (t - (a @ 1) / (b @ 1 - (a @ 1)))) + (a @ 2)
    ]
  ]
]

-- the value at time t, straight between track, held before the first and after the last
-- e.g. keyframes at [[[0, 0], [1, 10], [3, 50]], 2] → 30
-- e.g. keyframes at [[[0, 0x0], [2, 10x20]], 1] → 5x10
at : [track t | blend [track, t, [u | u]]]

-- the value at time t, shaped between track by an easing curve
-- e.g. keyframes eased [[[0, 0], [1, 100]], ease in-quad, 0.5] → 25
eased : [track curve t | blend [track, t, curve]]

-- the time of the last key
-- e.g. keyframes duration [[0, 0], [1, 10], [3, 50]] → 3
duration : [track | track @ (track length) @ 1]

-- the value at time t, starting over at the end
-- e.g. keyframes looped [[[0, 0], [2, 10]], 3] → 5
looped : [track t | at [track, t % (duration track)]]

-- the value at time t, playing forward then back
-- e.g. keyframes ping-pong [[[0, 0], [2, 10]], 3] → 5
ping-pong : [track t | d : duration track, u : t / d % 2, at [track, ((u > 1) [2 - u] else [u]) * d]]

-- the value of the last key at or before time t, with nothing between (states, sprites, lines of text)
-- e.g. keyframes held [[[0, "idle"], [1, "run"], [2, "jump"]], 1.5] → run
held : [track t | passed : track keep [k | k @ 1 <= t], (passed length > 0) [passed @ (passed length) @ 2] else [track @ 1 @ 2]]

-- the values of track passed from one time to another, for sounds and events on a timeline
-- e.g. keyframes crossed [[[1, "boom"], [2, "flash"]], 0.9, 1.5] → [boom]
crossed : [track from to | track keep [k | (k @ 1 > from) and (k @ 1 <= to)] collect [k | k @ 2]]
