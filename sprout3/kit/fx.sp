-- fx: the juice that makes a game feel alive: a flash of the whole screen, blinds and an iris between scenes, sparks
-- and a ring that burst out of a hit, words that wave, numbers that count up, and the blink of something just hurt. A
-- kit (decision 122): it draws with the game's own words, so it comes along when a game names it. Each word takes the
-- moment its effect began and the clock now, so a game keeps nothing in its state but that moment.

-- the whole screen in one colour for a moment after began, as when something big is hit (keep it short and rare: a
-- screen that flashes often is hard on the eyes)
-- e.g. fx flash [#ffffff, 1, 1.05, 0.1] draws rect [0, 0, 256, 192, #ffffff]
-- e.g. fx flash [#ffffff, 1, 1.2, 0.1] draws nothing
flash : [colour began now seconds |
  since : now - began
  (since >= 0) and (since < seconds)
    rect [0, 0, W, H, colour]
]

-- blinds closing over the screen as amount goes from 0 to 1, a band of 24 rows at a time, for a change of scene
-- e.g. fx blinds [0.25, #000000] draws rect [0, 0, 256, 6, #000000], rect [0, 24, 256, 6, #000000], rect [0, 48, 256, 6, #000000], rect [0, 72, 256, 6, #000000], rect [0, 96, 256, 6, #000000], rect [0, 120, 256, 6, #000000], rect [0, 144, 256, 6, #000000], rect [0, 168, 256, 6, #000000]
-- e.g. fx blinds [0, #000000] draws nothing
blinds : [amount colour |
  shut : amount max 0 min 1 * 24 round
  shut > 0
    range (H / 24 ceil) each [band | rect [0, band - 1 * 24, W, shut, colour]]
]

-- a box closing in on a spot as amount goes from 0 to 1, the screen covered all round it, as an old cartoon closes in
-- on its hero at the end
-- e.g. fx iris [0.5, 128x96, #000000] draws rect [0, 0, 256, 48, #000000], rect [0, 144, 256, 48, #000000], rect [0, 48, 64, 96, #000000], rect [192, 48, 64, 96, #000000]
iris : [amount spot colour |
  open : 1 - (amount max 0 min 1)
  reach-across : spot x max (W - (spot x)) * open
  reach-down : spot y max (H - (spot y)) * open
  hole-left : spot x - reach-across max 0 round
  hole-right : spot x + reach-across min W round
  hole-top : spot y - reach-down max 0 round
  hole-bottom : spot y + reach-down min H round
  amount > 0
    rect [0, 0, W, hole-top, colour]
    rect [0, hole-bottom, W, H - hole-bottom, colour]
    rect [0, hole-top, hole-left, hole-bottom - hole-top, colour]
    rect [hole-right, hole-top, W - hole-right, hole-bottom - hole-top, colour]
]

-- sparks flying out from a spot for half a second after began, many of them evenly round, slowing as they go
-- e.g. fx sparks [100x80, 0, 0.2, #ffff55, 4] draws rect [115, 80, 2, 2, #ffff55], rect [100, 95, 2, 2, #ffff55], rect [85, 80, 2, 2, #ffff55], rect [100, 65, 2, 2, #ffff55]
-- e.g. fx sparks [100x80, 0, 0.25, #ffff55, 4] draws rect [118, 80, 1, 1, #ffff55], rect [100, 98, 1, 1, #ffff55], rect [82, 80, 1, 1, #ffff55], rect [100, 62, 1, 1, #ffff55]
-- e.g. fx sparks [100x80, 0, 0.6, #ffff55, 4] draws nothing
sparks : [spot began now colour many |
  t : now - began / 0.5
  still-to-go : 1 - t
  travel : 1 - (still-to-go * still-to-go) * 24
  bit : (t < 0.5) [2] else [1]
  (t >= 0) and (t < 1)
    range many each [i |
      angle : i - 1 / many * 6.283185307179586
      rect [spot x + (angle cos * travel round), spot y + (angle sin * travel round), bit, bit, colour]
    ]
]

-- a ring that grows from a spot out to reach in a third of a second after began, as a shock goes out from a blast
-- e.g. fx shockwave [100x80, 0, 0.1, #ffffff, 30] draws ring [100, 80, 10, #ffffff, 2]
-- e.g. fx shockwave [100x80, 0, 0.4, #ffffff, 30] draws nothing
shockwave : [spot began now colour reach |
  t : now - began / 0.3
  (t >= 0) and (t < 1)
    ring [spot x, spot y, t * reach round, colour, 2]
]

-- the number to show while a score counts up to value: 0 when it began, value once so many seconds have gone
-- e.g. fx count-up [200, 0, 0.5, 1] → 100
-- e.g. fx count-up [200, 0, 3, 1] → 200
count-up : [value began now seconds | value * (now - began / seconds max 0 min 1) floor]

-- words across the middle at across whose letters bob in a wave, each a little after the one before, for a title
-- e.g. fx wavy ["HI", 128, 40, #ffffff, 0] draws text [H, 124, 40, 8, #ffffff], text [I, 132, 42, 8, #ffffff]
wavy : [line across down colour now |
  first-x : across - (line length * 4) + 4
  line chars numbered each [[i, letter] |
    bob : now * 6 + (i - 1 * 0.6) sin * 3 round
    text [letter, i - 1 * 8 + first-x, down + bob, 8, colour]
  ]
]

-- whether something just hurt is drawn this frame: it blinks fifteen times a second for so many seconds after it was
-- hurt, and shows all the rest of the time
-- e.g. fx visible [2, 2.1, 1] → false
-- e.g. fx visible [2, 2.15, 1] → true
-- e.g. fx visible [2, 3.5, 1] → true
visible : [hurt-at now seconds |
  since : now - hurt-at
  (since < 0) or (since >= seconds) or (since * 15 floor % 2 = 0)
]
