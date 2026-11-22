-- ui: the drawing a game does again and again: titles with a shadow, prompts that blink, boxes, meters, menus, a strip
-- of words along the top, talk typed out a letter at a time, words that rise from where something happened, and wipes
-- between scenes. A kit (decision 122): it draws with the game's own drawing words, so it comes along when a game
-- names it. The middle of the screen is W / 2, whatever the screen.

-- a line of words across the middle with a shadow one pixel down and right
-- e.g. ui banner ["GO", 40, 8, #ffffff] draws text [GO, 129, 41, 8, #000000], text [GO, 128, 40, 8, #ffffff]
banner : [line y size colour | text [line, W / 2 + 1, y + 1, size, #000000], text [line, W / 2, y, size, colour]]

-- a prompt across the middle that shows for half of every second, as on a title screen
-- e.g. ui blink ["PRESS 1", 180, #ffffff, 0.25] draws text [PRESS 1, 128, 180, 8, #ffffff]
-- e.g. ui blink ["PRESS 1", 180, #ffffff, 0.75] draws nothing
blink : [line y colour now |
  now * 2 floor % 2 = 0
    text [line, W / 2, y, 8, colour]
]

-- a box: an edge two pixels wide and a fill inside it
-- e.g. ui panel [10x20, 40x30, #ffffff, #000000] draws rect [10, 20, 40, 30, #ffffff], rect [12, 22, 36, 26, #000000]
panel : [at size edge fill | rect [at x, at y, size x, size y, edge], rect [at x + 2, at y + 2, size x - 4, size y - 4, fill]]

-- a bar filled as far as amount goes toward most, for life, time left or a shot's power
-- e.g. ui meter [10x10, 40x4, 3, 4, #ff0000, #555555] draws rect [10, 10, 40, 4, #555555], rect [10, 10, 30, 4, #ff0000]
meter : [at size amount most fill back | rect [at x, at y, size x, size y, back], rect [at x, at y, size x * (amount max 0 min most) / most floor, size y, fill]]

-- a list of choices down the screen from at, twelve pixels apart, the chosen one lit and pointed at
-- e.g. ui choices [["PLAY", "QUIT"], 1, 100x80, #ffff55, #aaaaaa] draws text [>, 92, 80, 8, #ffff55], text [PLAY, 100, 80, 8, #ffff55, left], text [QUIT, 100, 92, 8, #aaaaaa, left]
choices : [items picked at lit dim |
  items numbered each [[i, item] |
    y : i - 1 * 12 + (at y)
    i = picked
      text [">", at x - 8, y, 8, lit]
    text [item, at x, y, 8, (i = picked) [lit] else [dim], "left"]
  ]
]

-- a strip along the top of the screen, with words at the left, in the middle and at the right
-- e.g. ui strip ["HP 9", "FLOOR 2", "BEST 4", #000000, #ffffff] draws rect [0, 0, 256, 12, #ffffff], text [HP 9, 4, 6, 8, #000000, left], text [FLOOR 2, 128, 6, 8, #000000], text [BEST 4, 252, 6, 8, #000000, right]
strip : [start-words middle-words end-words ink back |
  rect [0, 0, W, 12, back]
  text [start-words, 4, 6, 8, ink, "left"]
  text [middle-words, W / 2, 6, 8, ink]
  text [end-words, W - 4, 6, 8, ink, "right"]
]

-- a line of talk in a box along the bottom, typed out at 24 letters a second from when it began, three rows at most
-- e.g. ui talk ["HELLO THERE", 0, 0.1] draws rect [4, 144, 248, 44, #ffffff], rect [6, 146, 244, 40, #000000], text [HE, 12, 154, 8, #ffffff, left]
talk : [line began now |
  typed : now - began * 24 floor
  rows : format wrap [line, 29] take 3
  panel [pair [4, H - 48], pair [W - 8, 44], #ffffff, #000000]
  rows numbered each [[i, row] |
    before : rows take (i - 1) collect [r | r length + 1] sum
    shown : row chars take (typed - before max 0) join ""
    shown != ""
      text [shown, 12, i - 1 * 12 + H - 38, 8, #ffffff, "left"]
  ]
]

-- has a line of talk that began then finished typing?
-- e.g. ui talked ["HELLO", 0, 1] → true
talked : [line began now | now - began * 24 >= (line length)]

-- words that rise from where something happened for a second, like +2 over a basket
-- e.g. ui float ["+2", 100x80, #ffff55, 1, 1.5] draws text [+2, 100, 70, 8, #ffff55]
float : [line at colour began now |
  t : now - began
  (t >= 0) and (t < 1)
    text [line, at x, at y - (t * 20 floor), 8, colour]
]

-- a wipe between scenes: bars close in from both sides as amount goes from 0 to 1, and open again from 1 to 2
-- e.g. ui wipe [0.5, #000000] draws rect [0, 0, 64, 192, #000000], rect [192, 0, 64, 192, #000000]
wipe : [amount colour |
  shut : (amount <= 1) [amount] else [2 - amount] max 0 min 1
  half : W / 2 * shut floor
  half > 0
    rect [0, 0, half, H, colour]
    rect [W - half, 0, half, H, colour]
]
