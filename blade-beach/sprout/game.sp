-- BLADE BEACH '90: a rollerblade warrior skates the boardwalk at sunset, 1990. The skater rolls on by himself: the
-- arrows speed up and slow down, 1 jumps (hold it to go higher), 2 kicks. Jump the hydrants, benches and gaps, land on a
-- rail to grind it for points, kick the masked gang skaters out of the way and grab the cassette tapes. Three stretches,
-- the beach, the pier and the neon strip, then the roller-derby giant: jump him as he charges, kick him while he reels.
-- Three lives; every lap after the giant rolls faster.

-- ================================================================ the art
ink : [k : #000000, h : #550000, s : #ffaa55, p : #ff55aa, c : #55ffff, w : #ffffff, g : #55ffff, v : #aa00aa, y : #ffff55, d : #555555, r : #ff0000]
white-ink : ink with [h : #ffffff, s : #ffffff, p : #ffffff, c : #ffffff, v : #ffffff, y : #ffffff, d : #ffffff]
roll-a : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....kppppkp...."
  ".....kssksk.p..."
  "......ksssk....."
  ".....kcccck....."
  "....kccccccks..."
  "...kscccccckk..."
  "...ks.kwwwwk...."
  "......kwwwwk...."
  ".....kss.kssk..."
  "....kss...kssk.."
  "...kkkkk...kkkkk"
  "...kgkgk...kgkgk"
  "................"
]
roll-b : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....kppppkp...."
  ".....kssksk.p..."
  "......ksssk....."
  ".....kcccck....."
  "....kccccccks..."
  "...kscccccckk..."
  "...ks.kwwwwk...."
  "......kwwwwk...."
  "......kssssk...."
  "......kss.ssk..."
  ".....kkkkkkkkk.."
  ".....kgkgkkgkg.."
  "................"
]
jump-up : [
  "......kkkk......"
  ".....khhhhk....."
  ".....kppppkp...."
  ".....kssksk.p..."
  "..ks..ksssk..sk."
  "...ksckcccckcsk."
  "....kccccccck..."
  ".....kccccck...."
  ".....kwwwwwk...."
  "....kwwkkwwk...."
  "...kssk..kssk..."
  "...ksk....ksk..."
  "..kkkkk..kkkkk.."
  "..kgkgk..kgkgk.."
  "................"
  "................"
]
kick : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....kppppkp...."
  ".....kssksk.p..."
  "......ksssk....."
  "....kccccck....."
  "...kscccccck...."
  "..ks.kcccck....."
  ".....kwwwwkkkkkk"
  ".....kwwwwsssssk"
  "....ksskkkkkkkgk"
  "...kss.....kkkg."
  "..kkkkk........."
  "..kgkgk........."
  "................"
]
punk-a : [
  "................"
  "......kkkk......"
  ".....kwwwwk....."
  ".....kwkwkwk...."
  ".....kwwwwwk...."
  ".....kwkkwk....."
  "....kvvvvvvk...."
  "...kvvyvvvvvk..."
  "...ksvvvvvvsk..."
  "....kkkkkkkk...."
  "....kddddddk...."
  "....kdd..ddk...."
  "...kdd....ddk..."
  "..kkkkk..kkkkk.."
  "..kgkgk..kgkgk.."
  "................"
]
boss-art : [
  ".....kkkkkk....."
  "....kpppyppk...."
  "...kppyyyyppk..."
  "...kkkkkkkkkk..."
  "...kssskssssk..."
  "....kssssssk...."
  "..kkppppppppkk.."
  ".kspppwwwwpppsk."
  ".ksppppwwppppsk."
  ".kskppppppppksk."
  "..k.kddddddk.k.."
  "....kwwkkwwk...."
  "...kddk..kddk..."
  "..kkkkk..kkkkk.."
  "..kgkgk..kgkgk.."
  "................"
]
hydrant-art : [
  "...kkk.."
  "..krrrk."
  "..kyyyk."
  ".kkrrrkk"
  ".krrrrrk"
  ".kkrrrkk"
  "..krrrk."
  "..krrrk."
  ".kkkkkkk"
  ".krrrrrk"
]
tape-art : [
  "kkkkkkkkkk"
  "kwwwwwwwwk"
  "kwppppppwk"
  "kwkwwwwkwk"
  "kwwwwwwwwk"
  "kkkkkkkkkk"
]

-- ================================================================ the boardwalk
floor-y : 152
hero-x : 72
piece : 32
rail-up : 24
-- each stretch is written a letter a piece of boardwalk 32 pixels long: h a hydrant, b a bench, r a rail, _ a gap,
-- p a gang skater, t a tape on the boards, T a tape up high
legs : [
  [title : "THE BEACH", plan : "........t...h......t.t...h.....T.....p......rrrr......h...t..p.......b.....T...rrrrr.....p..t...h..........", sky : [#5555aa, #aa55aa, #ff55aa, #ffaaaa, #ffaa55], sun : #ffff55, sea : #00aaaa, sand : #ffaa55, trees : #aa0055, deck : #aa5500, seam : #ffaa55]
  [title : "THE PIER", plan : "......t...__......p.....rrrr.....__...T...h......p....__..t..t...rrrrr....p...__.....b...T..p.....__.......", sky : [#000055, #550055, #aa00aa, #ff55aa, #ffaa55], sun : #ffaa55, sea : #0055aa, sand : #aa5555, trees : #550055, deck : #aa5555, seam : #ffaaaa]
  [title : "NEON STRIP", plan : "....p.....t...h....pp.....rrrrrr.....T..__....p...b.....p..t...h....rrr...p..pp.....T....h...p............", sky : [#000000, #000055, #550055, #aa0055, #ff0055], sun : #ff55aa, sea : #000055, sand : #000000, trees : #000000, deck : #000055, seam : #ff55aa]
]
signs : ["OPEN", "VHS", "ARCADE", "TAPES", "NEON"]

-- a gang skater sets off toward you once you're in sight
punk-at : [n hero-at |
  home : n - 0.5 * piece
  closing : 220 - (home - hero-at) max 0
  home - (closing * 0.4)
]

-- ================================================================ the music
songs : [
  title : [
    bpm : 112, beats : 16
    lead : music track ["A4 . C5 . E5 . A5 - | G5 . E5 . C5 - - . | F4 . A4 . C5 . F5 - | E5 - - . . . . .", 0.5]
    bass : music track ["A2 . A2 . A2 . A2 . | E2 . E2 . E2 . E2 . | F2 . F2 . F2 . F2 . | E2 . E2 . G2 . G2 .", 0.5]
    drums : music track ["kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat . snare . hat . | kick . hat kick snare . snare snare", 0.5]
  ]
  ride : [
    bpm : 124, beats : 32
    lead : music track ["E5 . G5 . A5 . G5 E5 | D5 . E5 . C5 - - . | E5 . G5 . A5 . C6 . | B5 - A5 - G5 - - . | A5 . G5 . E5 . D5 . | E5 - - . C5 . D5 . | E5 . G5 . A5 . G5 . | A5 - - - . . . .", 0.5]
    bass : music track ["A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | C3 C4 C3 C4 C3 C4 C3 C4 | G2 G3 G2 G3 G2 G3 G2 G3 | A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | C3 C4 C3 C4 G2 G3 G2 G3 | A2 A3 A2 A3 A2 . . .", 0.5]
    drums : music track ["kick . hat . snare . hat kick | kick . hat . snare . hat hat | kick . hat . snare . hat kick | kick . hat . snare . hat hat | kick . hat . snare . hat kick | kick . hat . snare . hat hat | kick . hat . snare . hat kick | kick kick snare kick snare snare crash .", 0.5]
  ]
  boss : [
    bpm : 150, beats : 16
    lead : music track ["E5 E5 G5 E5 A5 . G5 . | E5 E5 G5 E5 B5 . A5 . | E5 E5 G5 E5 A5 . G5 . | D5 . C5 . B4 - - .", 0.5]
    bass : music track ["E2 E3 E2 E3 E2 E3 E2 E3 | E2 E3 E2 E3 E2 E3 E2 E3 | C2 C3 C2 C3 C2 C3 C2 C3 | D2 D3 D2 D3 B1 B2 B1 B2", 0.5]
    drums : music track ["kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick hat snare hat kick hat snare hat | kick kick snare kick snare snare crash .", 0.5]
  ]
  over : [
    bpm : 90, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . A4 . | B4 - - - . . . .", 0.5]
    bass : music track ["A2 . G2 . F2 . E2 . | E2 - - - . . . .", 0.5]
  ]
  clear : [
    bpm : 120, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 . G5 C6 . | E6 - - - . . . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | C3 - - - . . . .", 0.5]
  ]
]

-- ================================================================ riding
fresh-boss : [now | [x : 214, dir : -1, state : "wait", until : now + 1.4, hits : 0, struck : false]]
new-run : [g now | g with [mode : "ride", mode-at : now, score : 0, lives : 3, lap : 1, leg : 1, leg-at : now, at : 0, gone : [], flings : [], speed : 100, lift : 0, rise : 0, grinding : false, safe-until : 0, boss : false, song : "ride", sfx : "start"]]
next-lap : [g now | g with [mode : "ride", mode-at : now, lap : g lap + 1, leg : 1, leg-at : now, at : 0, gone : [], flings : [], speed : 100, lift : 0, rise : 0, grinding : false, boss : false, song : "ride", sfx : "start"]]

-- one frame along a stretch: rolling, jumping (higher while 1 is held), grinding rails, kicking, and what gets hit
ride : [g inp now dt |
  course : legs @ (g leg)
  plan : course plan
  cells : plan chars
  fast : g lap - 1 * 0.15 + 1
  way : pad across (inp held)
  aim : cond [way > 0, 150, way < 0, 60, any, 100] * fast
  pace : motion approach [g speed, aim, 160, dt]
  ahead : g at + (pace * dt)
  under : parallax letter-at [plan, ahead, piece]
  k : parallax piece-at [ahead, piece]
  hold : inp held "one"
  sunk : g lift < 0
  standing : (sunk not) and ((g grinding) or ((g lift <= 0) and (under != "_")))
  jump : (inp pressed "one") and standing
  on-rail : (g grinding) and (under = "r") and (jump not)
  fall-pull : ((hold and (g rise > 0)) [520] else [1100]) * dt
  rise1 : cond [jump, 300, on-rail, 0, any, g rise - fall-pull]
  lift1 : on-rail [rail-up] else [g lift + (rise1 * dt)]
  land-floor : (sunk not) and (under != "_") and (lift1 <= 0)
  land-rail : (under = "r") and (rise1 < 0) and (g lift >= rail-up) and (lift1 <= rail-up) and (on-rail not)
  lift2 : cond [land-floor, 0, land-rail, rail-up, any, lift1]
  rise2 : (land-floor or land-rail) [0] else [rise1]
  grind-now : on-rail or land-rail
  -- what's near: the pieces either side
  near : [k - 1, k, k + 1] keep [n | (n >= 1) and (n <= (cells length))]
  centre : [n | n - 0.5 * piece]
  bumped : near count [n |
    l : cells @ n
    d : ahead - (centre n) abs
    ((l = "h") and (d < 10) and (lift2 < 18)) or ((l = "b") and (d < 16) and (lift2 < 12))
  ] > 0
  grabbed : near keep [n |
    l : cells @ n
    d : ahead - (centre n) abs
    ((g gone has n) not) and (d < 12) and (((l = "t") and (lift2 < 26)) or ((l = "T") and (lift2 > 30)))
  ]
  kick-now : (inp pressed "two") and (now >= (g kick-ready))
  kicking : kick-now or (now < (g kick-until))
  punks : range 9 collect [i | k - 4 + i] keep [n | (n >= 1) and (n <= (cells length)) and ((cells @ n) = "p") and ((g gone has n) not)]
  kicked : punks keep [n | d : punk-at [n, ahead] - ahead, kicking and (d > -6) and (d < 34) and (lift2 < 40)]
  stomped : punks keep [n | d : punk-at [n, ahead] - ahead abs, ((kicked has n) not) and (d < 12) and (rise2 < 0) and (lift2 > 12)]
  rammed : punks count [n | d : punk-at [n, ahead] - ahead abs, ((kicked has n) not) and ((stomped has n) not) and (d < 11) and (lift2 <= 12)] > 0
  safe : now < (g safe-until)
  hurt : (safe not) and (bumped or rammed)
  fell : lift2 < -48
  lost : hurt or fell
  -- after a fall, back on the boards past the gap
  dry : range 6 collect [i | k + i - 1] find [n | (cells @ n) != "_"]
  back-at : (dry else [k + 1]) - 1 * piece + 4
  points : grabbed length * 50 + (kicked length * 100) + (stomped length * 100) + (grind-now [60 * dt] else [0]) + (pace * dt / 10)
  lives-left : lost [g lives - 1] else [g lives]
  end-of-leg : ahead > (cells length * piece)
  flung : kicked .. stomped collect [n | [wx : punk-at [n, ahead], t0 : now]]
  ridden : g with [
    at : fell [back-at] else [ahead], speed : hurt [40] else [pace], lift : fell [0] else [lift2]
    rise : fell [0] else [(stomped length > 0) [220] else [rise2]], grinding : grind-now and (fell not)
    kick-until : kick-now [now + 0.28] else [g kick-until], kick-ready : kick-now [now + 0.32] else [g kick-ready]
    safe-until : lost [now + 1.6] else [g safe-until], lives : lives-left
    gone : g gone .. grabbed .. kicked .. stomped, flings : g flings .. flung keep [f | now - (f t0) < 1.2]
    score : g score + points
    sfx : cond [lives-left <= 0, "over", lost, "hurt", kicked length + (stomped length) > 0, "hit", grabbed length > 0, "tape", jump, "jump", kick-now, "kick", land-rail, "rail", any, ""]
  ]
  cond [
    lives-left <= 0, ridden with [mode : "over", mode-at : now, song : "over"]
    end-of-leg and (g leg < 3), ridden with [leg : g leg + 1, leg-at : now, at : 0, gone : [], score : ridden score + 500, sfx : "clear"]
    end-of-leg, ridden with [mode : "boss", mode-at : now, song : "boss", boss : fresh-boss now, bx : 72, facing : 1, at : 0, gone : [], score : ridden score + 500, sfx : "clear"]
    any, ridden
  ]
]

-- one frame against the giant: he waits, charges to a wall, reels there, turns and charges back. Jump him as he
-- comes; kick him while he reels. Four kicks and he's down.
duel : [g inp now dt |
  b : g boss
  fast : g lap - 1 * 0.15 + 1
  way : pad across (inp held)
  hold : inp held "one"
  jump : (inp pressed "one") and (g lift <= 0)
  fall-pull : ((hold and (g rise > 0)) [520] else [1100]) * dt
  rise1 : jump [300] else [g rise - fall-pull]
  lift1 : g lift + (rise1 * dt) max 0
  rise2 : ((lift1 <= 0) and (jump not)) [0] else [rise1]
  spot : g bx + (way * 110 * dt) max 16 min 240
  face : (way = 0) [g facing] else [way]
  kick-now : (inp pressed "two") and (now >= (g kick-ready))
  kicking : kick-now or (now < (g kick-until))
  moved : cond [
    b state = "wait", (now > (b until)) [b with [state : "charge"]] else [b]
    b state = "charge", (
      nx : b dir * 150 * fast * dt + (b x)
      walled : (nx < 30) or (nx > 226)
      walled [b with [x : nx max 30 min 226, state : "dizzy", until : now + 1.5, struck : false]] else [b with [x : nx]]
    )
    b state = "dizzy", (now > (b until)) [b with [state : "wait", until : now + 0.7, dir : 0 - (b dir)]] else [b]
    any, b
  ]
  gap : moved x - spot
  hit : kicking and (moved state = "dizzy") and ((moved struck) not) and (gap abs < 34) and (gap * face > 0)
  after-hit : hit [moved with [struck : true, hits : moved hits + 1, until : moved until min (now + 0.5)]] else [moved]
  rammed : (moved state = "charge") and (gap * (moved dir) < 0) and (gap abs < 22) and (lift1 < 40) and (now >= (g safe-until))
  lives-left : rammed [g lives - 1] else [g lives]
  fought : g with [
    bx : rammed [spot - (gap sign * 40) max 16 min 240] else [spot], facing : face, lift : lift1, rise : rise2, boss : after-hit
    kick-until : kick-now [now + 0.28] else [g kick-until], kick-ready : kick-now [now + 0.32] else [g kick-ready]
    safe-until : rammed [now + 1.6] else [g safe-until], lives : lives-left, score : g score + (hit [250] else [0])
    sfx : cond [lives-left <= 0, "over", rammed, "hurt", hit, "hit", jump, "jump", kick-now, "kick", any, ""]
  ]
  cond [
    lives-left <= 0, fought with [mode : "over", mode-at : now, song : "over"]
    after-hit hits >= 4, fought with [mode : "cleared", mode-at : now, song : "clear", score : fought score + 2000, sfx : "beaten"]
    any, fought
  ]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  score : 0
  lives : 3
  lap : 1
  leg : 1
  leg-at : 0
  at : 0
  speed : 100
  lift : 0
  rise : 0
  grinding : false
  kick-until : -9
  kick-ready : 0
  safe-until : 0
  gone : []
  flings : []
  boss : false
  bx : 72
  facing : 1
  sfx : ""

update : [game |
  g : game
  inp : g input
  now : g clock
  dt : g dt min 0.05
  any-now : pad either (inp pressed)
  since : now - (g mode-at)
  after : cond [
    g mode = "title", any-now [new-run [g, now]] else [g with [sfx : ""]]
    g mode = "over", ((since > 1.5) and any-now) [g with [mode : "title", mode-at : now, song : "title", sfx : ""]] else [g with [sfx : ""]]
    g mode = "cleared", (since > 3.5) [next-lap [g, now]] else [g with [sfx : ""]]
    g mode = "boss", duel [g, inp, now, dt]
    any, ride [g, inp, now, dt]
  ]
  s : after sfx
  s = "jump"
    zzfx preset "jump"
  s = "kick"
    hiss [0.06, 3000]
  s = "hit"
    zzfx preset "hit"
    shake 3
  s = "tape"
    zzfx preset "coin"
  s = "rail"
    beep [880, 0.05]
  s = "hurt"
    zzfx preset "hurt"
    shake 5
  s = "over"
    zzfx preset "explode"
    shake 8
  s = "clear"
    zzfx preset "power"
  s = "beaten"
    zzfx preset "explode"
    shake 10
  s = "start"
    zzfx preset "select"
  (after mode = "ride") and (after grinding) and (now * 20 floor % 3 = 0)
    hiss [0.03, 6000]
  top : after score floor max (after best)
  after with [best : top, keep : [best : top]]
]

-- ================================================================ drawing
-- the sky, the sun, the sea, palms or signs at half speed, the railing, and the boards
scene : [course cam now which |
  retro bands [0, 100, course sky]
  retro sun [176x72, 26, course sun, 4, course sky @ 4]
  retro sea [100, 24, course sea, #55ffff, 12, now]
  rect [0, 124, 256, 28, course sand]
  which < 3
    parallax copies [cam, 0.5, 72, 256] each [px | retro palm [pair [px, 132], 34, course trees, course trees]]
  which = 3
    parallax copies [cam, 0.5, 96, 256] numbered each [[i, px] | retro neon [signs @ (i % 5 + 1), pair [px + 40, 112], #ff55aa, #55ffff, now]]
  rect [0, 138, 256, 2, #ffffff]
  parallax copies [cam, 0.85, 24, 256] each [px | rect [px, 138, 2, 14, #ffffff]]
  rect [0, floor-y, 256, 40, course deck]
  rect [0, floor-y, 256, 2, course seam]
  parallax copies [cam, 1, 16, 256] each [px | rect [px, floor-y + 2, 1, 38, course seam]]
]

-- a thing on the boards, its centre at sx on the screen
thing : [l sx taken course now |
  bob : now * 5 sin * 2 floor
  l = "h"
    sprite [hydrant-art, sx - 8, floor-y - 20, ink, false, 2]
  l = "b"
    rect [sx - 14, floor-y - 20, 28, 3, #55ffff]
    rect [sx - 14, floor-y - 12, 28, 4, #ff55aa]
    rect [sx - 12, floor-y - 8, 3, 8, #ffffff]
    rect [sx + 9, floor-y - 8, 3, 8, #ffffff]
  l = "r"
    rect [sx - 16, floor-y - rail-up - 3, 32, 3, #55ffff]
    rect [sx - 1, floor-y - rail-up, 2, rail-up, #aaaaaa]
  l = "_"
    rect [sx - 16, floor-y, 32, 40, course sea]
    rect [sx - 16, floor-y + 10, 32, 1, #55ffff]
  (l = "t") and (taken not)
    sprite [tape-art, sx - 10, floor-y - 20 + bob, ink, false, 2]
  (l = "T") and (taken not)
    sprite [tape-art, sx - 10, floor-y - 68 + bob, ink, false, 2]
]

skater : [g sx now kicking |
  pose : cond [kicking, kick, g lift > 2, jump-up, g grinding, roll-b, any, (now * 6 floor % 2 = 0) [roll-a] else [roll-b]]
  shown : (now >= (g safe-until)) or (now * 12 floor % 2 = 0)
  shown
    sprite [pose, sx - 16, floor-y - 32 - (g lift), ink, g facing < 0, 2]
  g grinding
    range 3 each [i | rect [sx - 10 - (i * 5) - (now * 60 % 5), floor-y - rail-up - 4 + (i % 2), 2, 2, #ffff55]]
]

draw-ride : [g now |
  course : legs @ (g leg)
  cam : g at - hero-x
  cells : course plan chars
  scene [course, cam, now, g leg]
  low : parallax piece-at [cam - 40, piece] max 1
  range 12 each [i |
    n : low + i - 1
    n <= (cells length)
      thing [cells @ n, n - 0.5 * piece - cam, g gone has n, course, now]
    (n <= (cells length)) and ((cells @ n) = "p") and ((g gone has n) not)
      sprite [(now * 5 floor % 2 = 0) [punk-a] else [punk-a], punk-at [n, g at] - cam - 16, floor-y - 32, ink, true, 2]
  ]
  g flings each [fl |
    t : now - (fl t0)
    sprite [punk-a, fl wx - cam + (t * 140) - 16, t * t * 500 - (t * 260) + floor-y - 32, ink, t * 8 floor % 2 = 0, 2]
  ]
  skater [g, hero-x, now, now < (g kick-until)]
  ui strip ["[g score floor]", "LAP [g lap]  [course title]", "x[g lives]", #ffffff, #aa0055]
  now - (g leg-at) < 2
    ui banner [course title, 64, 16, #ffffff]
]

draw-boss : [g now |
  b : g boss
  retro bands [0, 128, [#000000, #000055, #550055, #aa0055, #ff0055]]
  retro sun [128x92, 34, #ffaa55, 5, #aa0055]
  range 9 each [i | rect [i * 30 - 6, 104 - (i * 37 % 23), 22, 30, #000000]]
  retro grid-floor [128, #000055, #ff55aa, 6, now]
  dazed : b state = "dizzy"
  flash : now < (b until) and (b struck) and (now * 14 floor % 2 = 0)
  sprite [boss-art, b x - 24, floor-y - 48, flash [white-ink] else [ink], b dir > 0, 3]
  dazed
    range 3 each [i | a : now * 6 + (i * 2.1), text ["*", b x + (a cos * 14), floor-y - 54 + (a sin * 3), 8, #ffff55]]
  (b state = "wait") and (now * 8 floor % 2 = 0)
    text ["!", b x, floor-y - 58, 16, #ff55aa]
  skater [g, g bx, now, now < (g kick-until)]
  ui strip ["[g score floor]", "THE BRICK", "x[g lives]", #ffffff, #aa0055]
  ui meter [78x20, 100x5, 4 - (b hits), 4, #ff55aa, #555555]
  since : now - (g mode-at)
  since < 2
    ui banner ["THE BRICK ROLLS IN", 64, 8, #ffffff]
    ui banner ["JUMP HIM. KICK HIM DIZZY.", 80, 8, #55ffff]
]

draw-title : [g now |
  retro bands [0, 120, [#5555aa, #aa55aa, #ff55aa, #ffaaaa, #ffaa55, #ffff55]]
  retro sun [128x100, 44, #ffff55, 6, #ff55aa]
  retro sea [120, 32, #00aaaa, #55ffff, 14, now]
  retro palm [18x160, 64, #550055, #550055]
  retro palm [228x160, 56, #550055, #550055]
  rect [0, 152, 256, 40, #aa5500]
  rect [0, 152, 256, 2, #ffaa55]
  ui banner ["BLADE", 30, 16, #ffffff]
  ui banner ["BEACH '90", 52, 16, #55ffff]
  ui banner ["A ROLLERBLADE WARRIOR AT SUNSET", 74, 8, #ffffff]
  sprite [(now * 6 floor % 2 = 0) [roll-a] else [roll-b], now * 70 % 300 - 30, floor-y - 32 + 6, ink, false, 2]
  ui blink ["PRESS 1 TO ROLL", 182, #ffffff, now]
  g best > 0
    text ["BEST [g best]", 128, 92, 8, #ffffff]
]

draw : [game |
  g : game
  now : g clock else 0
  clear #000000
  g mode = "title"
    draw-title [g, now]
  (g mode = "ride") or (g mode = "over")
    draw-ride [g, now]
  g mode = "boss"
    draw-boss [g, now]
  g mode = "cleared"
    draw-boss [g, now]
    ui banner ["THE BRICK IS DOWN", 70, 16, #ffff55]
    ui banner ["LAP [g lap] CLEARED", 96, 8, #ffffff]
    ui banner ["THE NEXT LAP ROLLS FASTER", 112, 8, #55ffff]
  g mode = "over"
    ui panel [40x60, 176x70, #ff55aa, #000000]
    ui banner ["WIPEOUT", 80, 16, #ff55aa]
    text ["SCORE [g score floor]", 128, 104, 8, #ffffff]
    text ["BEST [g best]", 128, 116, 8, #55ffff]
    ui blink ["PRESS 1", 150, #ffffff, now]
]
