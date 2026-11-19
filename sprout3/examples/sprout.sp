-- Sprout: catch the rain, dodge the bugs
-- Written to the design-decisions section of the spec (on paper; not yet runnable).
-- The host runs it as:  events fold [start, frame update]  and calls  draw  after each tick.

-- the game as it begins, and as it begins again after a restart
start :
  x : W / 2
  height : 40
  drops : []
  bugs : []
  sparks : []
  score : 0
  over : false

-- something new falling from the top
drop-at : [x | [x : x, y : -10]]

-- three sparks fly off a caught drop
spark : [d | [x : d x, y : d y, vx : rand [-80, 80], vy : rand [-120, 0], life : 0.5]]

-- one frame of play: takes the game, gives the next game
play : [g |
  i : g input
  dt : g dt

  -- move the sprout
  aim : i touching [toward [g x, i touch-x, 0.2]] else [g x]
  moved : i held "left" [aim - 5] else [i held "right" [aim + 5] else [aim]]
  x : clamp [moved, 20, W - 20]

  -- new rain and bugs on a beat
  beat : every [0.3, g clock, dt]
  new-drops : [drop-at (rand [20, W - 20])] keep [beat]
  new-bugs : [drop-at (rand [20, W - 20])] keep [beat and (random < 0.3)]

  -- everything falls
  speed : 160 + (g score * 4) * dt
  top : H - 40 - (g height)
  falling : g drops .. new-drops collect [d | d with [y : d y + speed]]
  crawling : g bugs .. new-bugs collect [b | b with [y : b y + (speed * 0.8)]]

  -- what hit the sprout
  near : [d | dist [d x, d y, x, top] < 24]
  bitten-by : [b | b x - x abs < 14 and (b y > top)]
  caught : falling keep near
  bitten : crawling keep bitten-by

  -- sparks: three per caught drop, then they drift and fade
  new-sparks : caught fold [[], [all d | all .. (range 3 collect [spark d])]]
  drift : [s |
    s with
      x : s x + (s vx * dt)
      y : s y + (s vy * dt)
      life : s life - dt
  ]
  sparks : g sparks .. new-sparks collect drift keep [s | s life > 0]

  -- growing and wilting
  height : clamp [g height + (caught length * 8) - (bitten length * 30), 0, H - 140]

  -- sound and shake (queued; they happen after update returns)
  caught length > 0
    beep [880, 0.06]
  bitten length > 0
    shake 12
    beep [110, 0.25]

  g with
    x : x
    height : height
    drops : falling keep [d | near d not and (d y < H)]
    bugs : crawling keep [b | bitten-by b not and (b y < H)]
    sparks : sparks
    score : g score + (caught length)
    over : height < 20
]

-- the game's update: play, or wait for a tap to grow again
update : [g |
  g over [g input tapped [start] else [g]] else [play g]
]

draw : [g |
  top : H - 40 - (g height)
  cloud : g clock * 12 % (W + 120) - 60
  leaves : H - 80 - top / 28 ceil

  clear "#ffb38a"
  circle [300, 70, 34 + (wave [3, g clock] * 3), "#ff6b4a"]
  circle [cloud, 120, 20, "#ffffff"]
  circle [cloud + 24, 112, 26, "#ffffff"]
  circle [cloud + 50, 120, 18, "#ffffff"]
  rect [0, H - 40, W, 40, "#7a4b2a"]

  rect [g x - 3, top, 6, g height, "#3c9d3c"]
  range leaves each [n | circle [g x + (n % 2 = 1 [8] else -8), H - 60 - (n - 1 * 28), 6, "#4fb04f"]]
  circle [g x - 9, top, 9, "#5cc85c"]
  circle [g x + 9, top, 9, "#5cc85c"]

  g drops each [d | circle [d x, d y, 6, "#2f7fe0"]]
  g bugs each [b |
    circle [b x, b y, 10, "#d62828"]
    circle [b x, b y - 8, 5, "#222222"]
  ]
  g sparks each [s | circle [s x, s y, 3, "#e8f7ff"]]
  text ["[g score] drops", W / 2, 30, 22, "#5a2a1a"]

  g over
    rect [0, 0, W, H, rgba [0, 0, 0, 0.5]]
    text ["Your sprout wilted", W / 2, H / 2 - 20, 28, "#ffffff"]
    text ["Tap to grow again", W / 2, H / 2 + 20, 18, "#ffe066"]
]
