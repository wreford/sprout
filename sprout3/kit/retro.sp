-- retro: the look of a 1990 sunset: a sky in stacked bands, a sun cut by stripes, palm trees, a sea of moving waves, a
-- grid floor running off to the horizon and neon signs. A kit (decision 122): it draws with the game's own words, so it
-- comes along when a game names it. Pair it with parallax for layers that scroll at their own speeds.

-- a sky in stacked bands of colour, top to bottom, from top down height pixels, across the whole screen
-- e.g. retro bands [0, 30, [#000055, #550055, #aa0055]] draws rect [0, 0, 256, 10, #000055], rect [0, 10, 256, 10, #550055], rect [0, 20, 256, 10, #aa0055]
bands : [top height colours |
  each-high : height / (colours length) ceil
  colours numbered each [[i, colour] | rect [0, i - 1 * each-high + top, W, each-high, colour]]
]

-- a sun cut across its lower half by stripes of the sky behind it, each one wider than the one above
-- e.g. retro sun [100x50, 8, #ffff55, 2, #aa0055] draws circle [100, 50, 8, #ffff55], rect [92, 52, 16, 1, #aa0055], rect [92, 55, 16, 2, #aa0055]
sun : [at size colour stripes back |
  circle [at x, at y, size, colour]
  range stripes each [i | rect [at x - size, at y + (i * size / (stripes + 1) floor), size * 2, i, back]]
]

-- a palm tree standing on at, size pixels high: a trunk leaning as it rises and five fronds drooping from the top
-- e.g. retro palm [20x100, 16, #550000, #005500] draws rect [20, 96, 3, 5, #550000], rect [21, 92, 3, 5, #550000], rect [22, 88, 3, 5, #550000], rect [23, 84, 3, 5, #550000], line [25, 84, 15, 88, #005500], line [25, 85, 15, 89, #005500], line [25, 84, 17, 82, #005500], line [25, 85, 17, 83, #005500], line [25, 84, 26, 80, #005500], line [25, 85, 26, 81, #005500], line [25, 84, 33, 83, #005500], line [25, 85, 33, 84, #005500], line [25, 84, 34, 88, #005500], line [25, 85, 34, 89, #005500]
palm : [at size trunk leaves |
  rise : size / 4 floor
  range 4 each [i | rect [at x + i - 1, at y - (i * rise), 3, rise + 1, trunk]]
  top : pair [at x + 5, at y - size]
  [[-0.6, 0.25], [-0.45, -0.12], [0.12, -0.25], [0.5, -0.06], [0.62, 0.25]] each [[across, down] |
    tip : top + (pair [across * size floor, down * size floor])
    line [top x, top y, tip x, tip y, leaves]
    line [top x, top y + 1, tip x, tip y + 1, leaves]
  ]
]

-- a sea between top and top + height with lines of foam drifting along it, so many pixels a second, now
-- e.g. retro sea [100, 8, #0055aa, #55ffff, 10, 0] draws rect [0, 100, 256, 8, #0055aa], rect [37, 102, 6, 1, #55ffff], rect [101, 102, 6, 1, #55ffff], rect [165, 102, 6, 1, #55ffff], rect [229, 102, 6, 1, #55ffff], rect [10, 106, 6, 1, #55ffff], rect [74, 106, 6, 1, #55ffff], rect [138, 106, 6, 1, #55ffff], rect [202, 106, 6, 1, #55ffff]
sea : [top height deep foam speed now |
  rect [0, top, W, height, deep]
  range (height / 4 floor) each [row |
    drift : now * speed * (row % 2 * 2 - 1) + (row * 37) % 64 + 64 % 64
    range (W / 64 ceil) each [k | rect [k - 1 * 64 + drift, row - 1 * 4 + top + 2, 6, 1, foam]]
  ]
]

-- a grid floor from top to the bottom of the screen, lines rushing toward you as the floor moves along, now
-- e.g. retro grid-floor [180, #000055, #ff55aa, 3, 0] draws rect [0, 180, 256, 12, #000055], line [0, 180, 255, 180, #ff55aa], line [0, 181, 255, 181, #ff55aa], line [0, 185, 255, 185, #ff55aa], line [128, 180, -128, 192, #ff55aa], line [128, 180, 0, 192, #ff55aa], line [128, 180, 128, 192, #ff55aa], line [128, 180, 256, 192, #ff55aa], line [128, 180, 384, 192, #ff55aa]
grid-floor : [top back lines rows now |
  deep : H - top
  rect [0, top, W, deep, back]
  line [0, top, W - 1, top, lines]
  range rows each [k |
    t : k - 1 + (now * 2 % 1) / rows
    y : t * t * deep + top floor
    (y > top)
      line [0, y, W - 1, y, lines]
  ]
  range 5 each [k | line [W / 2, top, k - 3 * W / 2 + (W / 2), H, lines]]
]

-- a neon sign: a word lit in one colour inside a frame of another, flickering off now and then
-- e.g. retro neon ["OPEN", 40x30, #ff55aa, #55ffff, 0] draws rect [20, 22, 40, 16, #55ffff], rect [21, 23, 38, 14, #000000], text [OPEN, 40, 30, 8, #ff55aa]
neon : [word at glow frame now |
  wide : word length * 8 + 8
  lit : (now * 7 + (at x) sin) > -0.97
  rect [at x - (wide / 2), at y - 8, wide, 16, frame]
  rect [at x - (wide / 2) + 1, at y - 7, wide - 2, 14, #000000]
  lit
    text [word, at x, at y, 8, glow]
]
