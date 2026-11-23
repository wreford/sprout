-- ORBIT GARDEN: a seed of light rides a ring that turns. Tap (or press 1) to let go: the seed flies straight out from
-- its ring and lands on whatever ring it meets. Climb as high as you can and gather light on the way. On some rings a
-- stone rolls round the other way: go before it reaches you. The sky turns from dawn to day, dusk and night as you
-- climb. Written in Sprout for SPROUT·NOW, the modern style (decision 145): smooth shapes, soft light, one thumb.

-- ================================================================ the garden
speed-out : 540
tops : [#f2665a, #2f86d8, #4a4cc0, #251a5c, #070b26, #f2665a]
bottoms : [#ffb07a, #8fd0ff, #ea8cb4, #5a3a92, #1a2252, #ffb07a]

-- ring n of a run, its centre at a height: a radius, a spin (turns a second, either way), and on some a stone that
-- rolls round the other way
ring-of : [n run height |
  s : run * 997 + (n * 17)
  radius : seeded between [38, 62, s] - (n * 0.12 min 12)
  across : seeded between [radius + 36, W - radius - 36, s + 1]
  way : (seeded chance [0.5, s + 2]) [1] else [-1]
  rate : n * 0.005 + 0.15 min 0.38
  rolling : (n > 3) and (seeded chance [n * 0.01 + 0.2 min 0.5, s + 3])
  [x : across, y : height, r : radius, spin : rate * way, stone : rolling, stone-turn : seeded number (s + 4), k : n]
]

-- the rings of a run, upward from low on the screen, a gap apart
rings-for : [run |
  range 150 fold [[], [made n |
    height : (made length = 0) [H * 0.7] else [made last y - (seeded between [150, 205, run * 991 + n])]
    made .. [ring-of [n, run, height]]
  ]]
]

-- light to gather: a mote between most pairs of rings
motes-for : [run ring-list |
  ring-list numbered keep [[n, rg] | (n < (ring-list length)) and (seeded chance [0.75, run * 37 + n])] collect [[n, rg] |
    above : ring-list @ (n + 1)
    [x : seeded between [44, W - 44, run * 53 + n], y : rg y + (above y) / 2, taken : false]
  ]
]

-- where a stone has rolled to by now, turning against its ring
stone-turn-at : [rg now | orbit spun [rg stone-turn, rg spin * -1.6, now]]
-- the turn of the seed on its ring now
seed-turn : [g now | rg : g rings @ (g on), orbit spun [g turn0, rg spin, now - (g on-at)]]
-- where the seed is now: on its ring, turning with it, or in flight
seed-at : [g now |
  rg : g rings @ (g on)
  (g flying) [g pos] else [orbit point [pair [rg x, rg y], rg r, seed-turn [g, now]]]
]

-- ================================================================ a climb
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "calm"
  run : 1
  rings : rings-for 1
  motes : []
  on : 1
  turn0 : 0.75
  on-at : 0
  flying : false
  pos : 0x0
  vel : 0x0
  from-ring : 1
  fly-at : 0
  cam : H * 0.7 - (H * 0.62)
  score : 0
  light : 0
  trail : []
  fx : ""
  fx-at : -9
  pulse-at : -9

begin : [g now |
  next-run : g run + 1
  made : rings-for next-run
  bloom : motes-for [next-run, made]
  view : made @ 1 y - (H * 0.62)
  g with [mode : "play", mode-at : now, run : next-run, rings : made, motes : bloom, on : 1, turn0 : 0.75, on-at : now, flying : false, pos : 0x0, vel : 0x0, from-ring : 1, fly-at : now, cam : view, score : 0, light : 0, trail : [], fx : "start", fx-at : now, pulse-at : now, song : "calm"]
]

lose : [g now | top : g best max (g score), g with [mode : "over", mode-at : now, best : top, keep : [best : top], fx : "lose", fx-at : now, song : "rest", flying : false]]

-- riding a ring: let go when asked, unless a rolling stone gets there first
ride : [g go now |
  rg : g rings @ (g on)
  centre : pair [rg x, rg y]
  turn : seed-turn [g, now]
  here : orbit point [centre, rg r, turn]
  crushed : (rg stone) and (orbit apart [turn, stone-turn-at [rg, now], rg r] < 15)
  heading : orbit outward [centre, here] * speed-out
  cond [
    crushed, lose [g, now]
    go, g with [flying : true, pos : here, vel : heading, from-ring : g on, fly-at : now, trail : [], fx : "launch", fx-at : now]
    any, g
  ]
]

-- landing on ring n where the seed met it
land : [g hit p2 now motes-now gathered |
  n : hit @ 1
  rg : hit @ 2
  turn : orbit turn-of [pair [rg x, rg y], p2]
  climbed : n - 1 max (g score)
  lit : g light + gathered
  g with [flying : false, on : n, turn0 : turn, on-at : now, pos : p2, motes : motes-now, light : lit, score : climbed, trail : [], fx : "land", fx-at : now, pulse-at : now]
]

-- in flight: straight on, gathering light, until a ring catches the seed, a stone stops it or it leaves the sky
fly : [g now dt |
  p2 : g pos + (g vel * dt)
  base : g from-ring
  nearby : g rings numbered keep [[n, rg] | (n >= (base - 2)) and (n <= (base + 4))]
  landing : nearby keep [[n, rg] | ((n != base) or (now - (g fly-at) > 0.3)) and (orbit near [p2, pair [rg x, rg y], rg r, 9])]
  stones : nearby keep [[n, rg] | rg stone] collect [[n, rg] | orbit point [pair [rg x, rg y], rg r, stone-turn-at [rg, now]]]
  struck : stones any [s | vec distance [s, p2] < 15]
  high : p2 y - (g cam)
  gone : (p2 x < -30) or (p2 x > (W + 30)) or (high < -80) or (high > (H + 60))
  got : g motes numbered keep [[n, m] | (m taken not) and (vec distance [p2, pair [m x, m y]] < 22)] collect [[n, m] | n]
  motes-now : g motes numbered collect [[n, m] | (got has n) [m with [taken : true]] else [m]]
  path : g trail .. [p2]
  kept-path : path drop ((path length - 14) max 0)
  gathered : got length
  lit : g light + gathered
  sparkle : (gathered > 0) ["mote"] else [g fx]
  sparkle-at : (gathered > 0) [now] else [g fx-at]
  cond [
    struck or gone, lose [g, now]
    landing length > 0, land [g, landing @ 1, p2, now, motes-now, gathered]
    any, g with [pos : p2, motes : motes-now, light : lit, trail : kept-path, fx : sparkle, fx-at : sparkle-at]
  ]
]

play : [g go now dt | (g flying) [fly [g, now, dt]] else [ride [g, go, now]]]

update : [game |
  g : game
  inp : g input
  now : g clock
  dt : g dt min 0.05
  go : (inp tapped) or (inp pressed "one") or (inp pressed "two") or (inp pressed "up")
  since : now - (g mode-at)
  stepped : cond [
    g mode = "title", go [begin [g, now]] else [g]
    g mode = "play", play [g, go, now, dt]
    g mode = "over", ((since > 0.8) and go) [begin [g, now]] else [g]
    any, g
  ]
  aim : stepped rings @ (stepped on) y - (H * 0.62)
  eased : stepped cam + (aim - (stepped cam) * (dt * 2.6 min 1))
  after : stepped with [cam : eased]
  fresh : after fx-at = now
  fresh and (after fx = "launch")
    buzz 8
    beep [523, 0.1]
  fresh and (after fx = "land")
    buzz 16
    beep [after score * 22 + 660 min 1500, 0.18]
  fresh and (after fx = "mote")
    beep [1318, 0.08]
  fresh and (after fx = "lose")
    buzz 60
    beep [196, 0.5]
    shake 5
  fresh and (after fx = "start")
    buzz 10
    beep [392, 0.12]
  after
]

songs : [
  calm : [
    bpm : 84, beats : 16
    lead : music track ["E5 . G5 . B5 - . . | A5 . G5 . E5 - . . | D5 . E5 . G5 - . . | E5 - - . . . . .", 0.5]
    harmony : music track ["E4 - - - G4 - - - | C4 - - - E4 - - - | B3 - - - D4 - - - | C4 - - - . . . .", 0.5]
    bass : music track ["E2 - - - - - - - | C2 - - - - - - - | G2 - - - - - - - | A2 - - - - - - -", 0.5]
  ]
  rest : [bpm : 70, beats : 8, once : true, lead : music track ["B4 . G4 . E4 - - - | . . . . . . . .", 0.5]]
]

-- ================================================================ drawing
sky-phase : [g | g score / 30 % 1]

draw-sky : [g now view |
  phase : sky-phase g
  gradient [0, 0, W, H, palette along [tops, phase], palette along [bottoms, phase]]
  dark : 1 - ((phase - 0.72) abs * 5) max 0 min 1
  dark > 0
    range 44 each [i | glow [seeded between [0, W, i * 7], seeded between [0, H, i * 13], 3 + ((now * 2 + i) sin + 1), rgba [255, 255, 255, dark * 0.75]]]
  range 3 each [i | glow [W * (i * 0.33 + 0.12) + ((now * 0.15 + i) sin * 30), (i * 260 - (view * 0.15)) % (H + 300) - 150, 170, rgba [255, 255, 255, 0.07]]]
  range 18 each [i | circle [seeded between [0, W, i * 29] + ((now * 0.4 + i) sin * 12), H + 20 - ((now * (seeded between [8, 22, i * 3]) + (seeded between [0, H, i * 41]) - (view * 0.3)) % (H + 40)), seeded between [1, 2.4, i * 5], rgba [255, 255, 255, 0.35]]]
]

draw-rings : [g now view |
  playing : g mode != "title"
  g rings keep [rg | (rg y - view > -120) and (rg y - view < (H + 120)) and (playing or (rg k = 1))] each [rg |
    sx : rg x
    sy : rg y - view
    is-on : rg k = (g on)
    since-land : now - (g pulse-at)
    bump : (is-on and (since-land < 0.35)) [since-land / 0.35 * 3.14159 sin * 7] else [0]
    rock : orbit point [pair [sx, sy], rg r, stone-turn-at [rg, now]]
    is-on
      glow [sx, sy, rg r + 46, rgba [255, 255, 255, 0.16]]
    circle [sx, sy, rg r, rgba [255, 255, 255, is-on [0.14] else [0.07]]]
    ring [sx, sy, rg r + bump, rgba [255, 255, 255, is-on [1] else [0.72]], is-on [4] else [2.5]]
    rg stone
      glow [rock x, rock y, 26, rgba [40, 20, 60, 0.35]]
      circle [rock x, rock y, 11, #3a3150]
      circle [rock x - 3, rock y - 3, 4, rgba [255, 255, 255, 0.28]]
  ]
]

draw-motes : [g now view |
  g motes keep [m | (m taken not) and (m y - view > -40) and (m y - view < (H + 40))] each [m |
    twinkle : (now * 3 + (m x)) sin * 1.5
    glow [m x, m y - view, 18 + twinkle, rgba [255, 226, 140, 0.6]]
    circle [m x, m y - view, 3.5 + (twinkle / 3), #fff7da]
  ]
]

draw-seed : [g now view |
  seed : seed-at [g, now]
  g trail numbered each [[i, p] | circle [p x, p y - view, i / 14 * 7, rgba [255, 255, 255, i / 14 * 0.45]]]
  glow [seed x, seed y - view, 40, rgba [255, 238, 200, 0.6]]
  circle [seed x, seed y - view, 9, #ffffff]
  ((g fx = "land") and (now - (g fx-at) < 0.7))
    text ["+1", seed x, seed y - view - 30 - ((now - (g fx-at)) * 40), 20, rgba [255, 255, 255, 1 - ((now - (g fx-at)) / 0.7)]]
]

draw-hud : [g now |
  pop : ((g fx = "land") and (now - (g fx-at) < 0.3)) [now - (g fx-at) / 0.3 * 3.14159 sin * 10] else [0]
  g mode = "play"
    text ["[g score]", W / 2, 96, 56 + pop, #ffffff]
    text ["BEST [g best]", W / 2, 134, 12, rgba [255, 255, 255, 0.72]]
    glow [36, 64, 16, rgba [255, 226, 140, 0.7]]
    circle [36, 64, 4, #fff7da]
    text ["[g light]", 52, 64, 16, #ffffff, "left"]
  g mode = "title"
    text ["Orbit", W / 2, H * 0.17, 50, #ffffff]
    text ["Garden", W / 2, H * 0.17 + 52, 50, #ffffff]
    text ["Hop from orbit to orbit.", W / 2, H * 0.17 + 104, 15, rgba [255, 255, 255, 0.85]]
    text ["Gather the light. Mind the stones.", W / 2, H * 0.17 + 128, 15, rgba [255, 255, 255, 0.85]]
    text ["Tap to begin", W / 2, H * 0.9, 17, rgba [255, 255, 255, (now * 2.4) sin * 0.3 + 0.7]]
  (g mode = "title") and (g best > 0)
    text ["Best [g best]", W / 2, H * 0.9 + 30, 13, rgba [255, 255, 255, 0.7]]
  g mode = "over"
    rect [36, H * 0.3, W - 72, 236, rgba [255, 255, 255, 0.16], 30]
    rect [37, H * 0.3 + 1, W - 74, 234, rgba [20, 10, 40, 0.18], 29]
    text ["Score", W / 2, H * 0.3 + 40, 14, rgba [255, 255, 255, 0.75]]
    text ["[g score]", W / 2, H * 0.3 + 92, 64, #ffffff]
    text ["Best [g best]   ·   Light [g light]", W / 2, H * 0.3 + 150, 14, rgba [255, 255, 255, 0.85]]
  (g mode = "over") and (now - (g mode-at) > 0.8)
    rect [W / 2 - 96, H * 0.3 + 176, 192, 42, rgba [255, 255, 255, 0.92], 21]
    text ["Play again", W / 2, H * 0.3 + 197, 15, #2a1d5e]
]

draw : [game |
  g : game
  now : g clock
  view : g cam
  draw-sky [g, now, view]
  draw-rings [g, now, view]
  draw-motes [g, now, view]
  draw-seed [g, now, view]
  draw-hud [g, now]
]
