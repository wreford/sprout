-- palette: colours made from hue, saturation and lightness, colours mixed along a line, and a few sets that go together.

-- a colour from hue (0 to 360), saturation and lightness (0 to 1)
-- e.g. palette hsl [30, 0.8, 0.55] → #e88c30
hsl : [hue sat light |
  chroma : 1 - ((2 * light - 1) abs) * sat
  h : hue / 60 % 6
  second : 1 - ((h % 2 - 1) abs) * chroma
  base : light - (chroma / 2)
  [r, g, b] : cond [h < 1, [chroma, second, 0], h < 2, [second, chroma, 0], h < 3, [0, chroma, second], h < 4, [0, second, chroma], h < 5, [second, 0, chroma], any, [chroma, 0, second]]
  colour [r + base * 255, g + base * 255, b + base * 255]
]

-- a colour part of the way along a list of colours: t of 0 is the first, 1 the last
-- e.g. palette along [[#000000, #ff0000, #ffffff], 0.75] → #ff8080
along : [stops t |
  steps : stops length - 1
  at : clamp [t, 0, 1] * steps
  k : at floor min (steps - 1)
  stops @ (k + 1) mix [stops @ (k + 2), at - k]
]

-- n colours evenly round the colour wheel
-- e.g. palette wheel [4, 0.7, 0.5] → [#d92626, #80d926, #26d9d9, #8026d9]
wheel : [n sat light | range n collect [k | hsl [k - 1 * 360 / n, sat, light]]]

-- a grey from 0 (black) to 1 (white)
-- e.g. palette grey 0.5 → #808080
grey : [level | v : clamp [level, 0, 1] * 255, colour [v, v, v]]

-- warm colours, for fire and sunsets
-- e.g. palette warm length → 5
warm : [#2b1d0e, #7a2e12, #d9531e, #f39c33, #ffe08a]

-- cool colours, for water and night
-- e.g. palette cool @ 3 → #1f6f8b
cool : [#0b1d2a, #12395a, #1f6f8b, #4fb0c6, #c8eef0]

-- soft colours that sit well together
-- e.g. palette soft @ 1 → #f4b6c2
soft : [#f4b6c2, #f6d5a6, #c9e4c5, #b5d8eb, #d4c1ec]
