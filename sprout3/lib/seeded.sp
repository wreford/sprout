-- seeded: random choices you can repeat. Each one takes a seed (any number): the same seed always gives the
-- same answer, on every machine, and a game that rewinds gets the same luck back. Use a different seed for each choice,
-- such as the frame number, or a thing's number times 10 plus which choice it is.

-- a number from 0 up to 1
-- e.g. seeded number 42 → 0.0565482103
number : [seed | noise [seed, 0.618]]

-- a number from low up to high
-- e.g. seeded between [10, 20, 42] → 10.5654821033
between : [low high seed | noise [seed, 0.618] * (high - low) + low]

-- a whole number from low to high, both included
-- e.g. seeded whole [1, 6, 42] → 1
whole : [low high seed | noise [seed, 0.618] * (high - low + 1) floor + low]

-- true with chance p (from 0 to 1)
-- e.g. seeded chance [0.5, 42] → false
chance : [p seed | noise [seed, 0.314] < p]

-- one item of a list
-- e.g. seeded pick [["rock", "paper", "scissors"], 42] → rock
pick : [items seed | items @ (whole [1, items length, seed])]

-- the list in a shuffled order
-- e.g. seeded shuffle [[1, 2, 3, 4, 5], 42] → [2, 3, 5, 4, 1]
shuffle : [items seed | items numbered sort-by [[k, item] | noise [seed, k]] collect [[k, item] | item]]

-- a number from a bell curve: usually near mean, spread out by spread
-- e.g. seeded bell [100, 15, 42] round → 99
bell : [mean spread seed |
  u : noise [seed, 0.271] max 0.000001
  v : noise [seed, 0.828]
  u log * -2 sqrt * (v * 6.283185307179586 cos) * spread + mean
]

-- a point inside a circle of radius r round 0x0, spread evenly
-- e.g. seeded in-circle [10, 42] x round → -2
in-circle : [r seed | angle : noise [seed, 0.11] * 6.283185307179586, far : noise [seed, 0.77] sqrt * r, pair [angle cos * far, angle sin * far]]

-- n choices from a list, by their weights: [items, weights, seed]
-- e.g. seeded weighted [["common", "rare"], [9, 1], 42] → common
weighted : [items weights seed |
  total : weights sum
  target : noise [seed, 0.5] * total
  marks : weights scan [0, [t w | t + w]] rest
  items @ (marks find-index [m | m > target])
]

-- a number from low to high, most often near likely: a three-point guess at how long a task will take
-- e.g. seeded triangle [2, 3, 8, 42] → 6.3817927252
-- e.g. seeded triangle [5, 5, 5, 42] → 5
triangle : [low likely high seed |
  u : noise [seed, 0.909]
  (high = low) [low] else [
    (u < (likely - low / (high - low))) [low + (u * (high - low) * (likely - low) sqrt)] else [high - (1 - u * (high - low) * (high - likely) sqrt)]
  ]
]
