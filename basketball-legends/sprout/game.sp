-- BASKETBALL LEGENDS 8: one on one, from 1960 to forever. The 8-bit side of Basketball Legend: build your player, then
-- take on a legend of each decade on the playground, first to 11 by twos and threes.
-- On the ball: the arrows dribble, hold 1 to rise for a jump shot and let go at the top of the jump, 1 running at the
-- rim from close in dunks, and 2 crosses over and can shake your man. On defence: the arrows slide, 1 jumps to block,
-- and 2 reaches for a steal. After a miss or a steal, take the ball back past the arc before you can score.

-- ================================================================ the art
stand-art : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....khsssk....."
  ".....kssksk....."
  "......ksssk....."
  ".....kjjjjk....."
  "....kjjnjjjk...."
  "....kjjnjjsk...."
  "....kjjjjjsk...."
  "....ksjjjjksk..."
  ".....kddddk....."
  ".....kddddk....."
  ".....ks..sk....."
  ".....ks..sk....."
  "....kok..kok...."
]
run-art : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....khsssk....."
  ".....kssksk....."
  "......ksssk....."
  ".....kjjjjk....."
  "....kjjnjjjk...."
  "...ksjjnjjjsk..."
  "...ksjjjjjjsk..."
  "....kjjjjjjk...."
  ".....kddddk....."
  "....kdd..ddk...."
  "...ks.....sk...."
  "..kok......ks..."
  "..kk.......kok.."
]
jump-art : [
  "...kk......kk..."
  "...ks.kkkk.sk..."
  "...kskhhhhksk..."
  "...kskhssskks..."
  "...kskssksksk..."
  "...ks.ksssksk..."
  "...kkjjjjjjkk..."
  "....kjjnjjjk...."
  "....kjjnjjjk...."
  "....kjjjjjjk...."
  ".....kddddk....."
  ".....kddddk....."
  "....ks...ksk...."
  "...ks....ks....."
  "..kok...kok....."
  "..kk....kk......"
]
guard-art : [
  "................"
  "......kkkk......"
  ".....khhhhk....."
  ".....khsssk....."
  ".....kssksk....."
  "......ksssk....."
  "..kk.kjjjjk.kk.."
  "..kskjjnjjjksk.."
  "...kkjjnjjjkk..."
  "....kjjjjjjk...."
  ".....kddddk....."
  "....kddddddk...."
  "...ks......sk..."
  "..ks........sk.."
  ".kok........kok."
  ".kk..........kk."
]
ball-art : [
  "................"
  "................"
  "......kkkk......"
  "....kkookookk..."
  "...kookookooek.."
  "...kokkkkkkkok.."
  "..kokoookooooek."
  "..kkooookoooookk"
  "..koooookoooook."
  "..kkkkkkkkkkkkk."
  "..koooookoooook."
  "..kokoookooookk."
  "...koooookooek.."
  "...kkoookookk..."
  ".....kkkkkk....."
  "................"
]
ball-ink : [k : #000000, o : #ff5500, e : #ffaa00]
jerseys : [#ff0000, #0055ff, #00aa00, #aa00aa, #ffffff]
jersey-names : ["RED", "BLUE", "GREEN", "PURPLE", "WHITE"]
look-of : [skin hair jersey | [k : #000000, s : skin, h : hair, j : jersey, n : (jersey = #ffffff) [#ff0000] else [#ffffff], d : jersey, o : #ffffff]]
title-ink : look-of [#ffaa55, #550000, #ff0000]

-- ================================================================ the court
floor-y : 160
rim-x : 228
rim-y : 92
arc-x : 148
wall-l : 12
wall-r : 236
win-at : 11

-- ================================================================ the legends, one a decade
rivals : [
  [name : "TANK", year : "1960", style : "post", stats : [shot : 2, speed : 1, hops : 2, d : 4], skin : #aa5500, hair : #000000, jersey : #00aa00, says : "THE PAINT IS MINE, KID. IT ALWAYS WAS. CHECK IT UP."]
  [name : "JET", year : "1970", style : "slash", stats : [shot : 2, speed : 4, hops : 5, d : 2], skin : #550000, hair : #000000, jersey : #0055ff, says : "CATCH ME IF YOU CAN. NOBODY EVER HAS."]
  [name : "VELVET", year : "1980", style : "mid", stats : [shot : 4, speed : 3, hops : 2, d : 3], skin : #ffaa55, hair : #aa5500, jersey : #ffff55, says : "SMOOTH IS FAST. WATCH THE ELBOW, NOT THE BALL."]
  [name : "SPIDER", year : "1990", style : "lock", stats : [shot : 3, speed : 3, hops : 3, d : 5], skin : #aa5500, hair : #000000, jersey : #aa00aa, says : "EIGHT ARMS. EVERY BALL YOU BOUNCE IS MINE."]
  [name : "DAGGER", year : "2000", style : "all", stats : [shot : 4, speed : 4, hops : 3, d : 3], skin : #ffaa55, hair : #550000, jersey : #ff0000, says : "I LIVE FOR THE LAST SHOT. GO ON, TAKE IT."]
  [name : "TORCH", year : "2010", style : "three", stats : [shot : 5, speed : 3, hops : 2, d : 3], skin : #aa5500, hair : #000000, jersey : #ff5500, says : "FROM HERE? FROM ANYWHERE. THE ARC IS A SUGGESTION."]
  [name : "BUCKETS", year : "FOREVER", style : "all", stats : [shot : 5, speed : 5, hops : 5, d : 5], skin : #550000, hair : #000000, jersey : #ffffff, says : "EVERY LEGEND ENDS HERE. COME ON THEN."]
]
-- where each style likes to shoot from, one picked at random each time it has the ball
spots : [post : [200, 206, 190], slash : [214, 210, 176], mid : [176, 168, 188], lock : [172, 190, 140], all : [138, 178, 210], three : [136, 130, 172]]
legend : [g | rivals @ (g era)]
plan-for : [g | spots get-in [legend g style] @ (random * 3 floor + 1)]

-- ================================================================ the players
stats-of : [row | [shot : row @ 1, speed : row @ 2, hops : row @ 3, d : row @ 4]]
fresh-player : [stats look at | [x : at, h : 0, vh : 0, face : 1, stun : 0, burst : 0, rising : false, dunking : false, aim : 0, held-one : false, moving : false, stats : stats, look : look]]
leap-of : [p | p stats hops * 14 + 196]
-- a player moved for a tick: walking at their pace (faster in a burst), and up and back down to the floor
moved : [p way dt |
  pace : p stats speed * 14 + 56 * ((p burst > 0) [1.8] else [1])
  free : p stun <= 0
  walk : free [way * pace * dt] else [0]
  flying : (p h > 0) or (p vh > 0)
  rise-speed : flying [p vh - (560 * dt)] else [0]
  height : p h + (rise-speed * dt) max 0
  landed : flying and (height <= 0)
  p with [x : p x + walk max wall-l min wall-r, h : height, vh : landed [0] else [rise-speed], stun : p stun - dt max 0, burst : p burst - dt max 0, moving : free and (way != 0)]
]

-- ================================================================ the ball and who has it
ball-of : [kind who at speed | ax : at x, ay : at y, sx : speed x, sy : speed y, [mode : kind, by : who, x : ax, y : ay, vx : sx, vy : sy, began : 0, span : 1, good : false, worth : 2, src : at, dst : at, rise : 0]]
held-at : [p now | (p h > 0) [pair [p x + (p face * 3), floor-y - 42 - (p h)]] else [pair [p x + (p face * 9), floor-y - 4 - (now * 9 sin abs * 12)]]]
-- the ball is who's now: they must take it back past the arc unless cleared
own : [g who cleared now | g with [ball : ball-of ["held", who, 0x0, 0x0], offense : who, cleared : cleared, clock-left : 12, plan : plan-for g]]
-- the ball checked at the top to who, the other player back on defence
check-to : [g who now |
  them : (who = "me") ["foe"] else ["me"]
  holder : g get-in [who] with [x : 70, h : 0, vh : 0, rising : false, dunking : false, stun : 0, burst : 0, face : 1]
  guard : g get-in [them] with [x : 120, h : 0, vh : 0, rising : false, dunking : false, stun : 0, burst : 0, face : -1]
  own [g set-in [[who], holder] set-in [[them], guard] with [mode : "play", mode-at : now], who, true, now]
]

-- ================================================================ what happens to the ball
blocked : [g at now | g with [ball : ball-of ["loose", g ball by, at, pair [-90 - (random * 70), -60 - (random * 60)]] with [began : now], said : "BLOCKED!", said-at : now, said-x : at x, sfx : "block"]]
turnover : [g them why now | g with [mode : "point", mode-at : now, next-ball : them, said : why, said-at : now, said-x : 128, sfx : "whistle"]]
shake-off : [g them now | q : g get-in [them], g set-in [[them], q with [stun : 0.8]] with [said : "SHOOK!", said-at : now, said-x : q x, sfx : "shook"]]
swipe : [g who now |
  p : g get-in [who]
  them : (who = "me") ["foe"] else ["me"]
  q : g get-in [them]
  odds : p stats d - (q stats speed) * 0.08 + 0.22 max 0.06 min 0.6
  (random < odds) [own [g, who, false, now] with [said : "STEAL!", said-at : now, said-x : p x, sfx : "steal"]] else [g set-in [[who], p with [stun : 0.45]] with [said : "REACH!", said-at : now, said-x : p x, sfx : "whiff"]]
]
-- a jump shot let go: its chance from how far out, how near the top of the jump, how closely guarded, and SHOT
release : [g who now |
  p : g get-in [who]
  them : (who = "me") ["foe"] else ["me"]
  q : g get-in [them]
  timing : 1 - (p vh abs / (leap-of p)) max 0
  far : rim-x - (p x)
  worth : (p x < arc-x) [3] else [2]
  base : cond [far < 46, 0.7, far < 82, 0.54, far < 130, 0.4, any, 0.18]
  near : (q x - (p x) abs < 24) and (q x > (p x - 6))
  stuffed : near and (q h > 10) and (random < (q stats d * 0.07 + 0.2 - (p stats hops * 0.03)))
  contest : near [(q h > 10) [0.6] else [0.8]] else [1]
  odds : base * (p stats shot * 0.1 + 0.7) * (timing * timing * 0.65 + 0.35) * contest * ((timing > 0.92) [1.2] else [1]) min 0.95
  start-at : pair [p x + (p face * 4), floor-y - 40 - (p h)]
  done : g set-in [[who], p with [rising : false]]
  stuffed [blocked [done, start-at, now]] else [
    done with [ball : ball-of ["shot", who, start-at, 0x0] with [began : now, span : far / 260 + 0.45, good : random < odds, worth : worth, dst : pair [rim-x, rim-y - 4], rise : far * 0.3 + 26], said : (timing > 0.92) ["GREEN!"] else [""], said-at : now, said-x : p x, sfx : "shoot"]
  ]
]
-- at the top of a dunk: stuffed by a defender up there with you, else down it goes (a layup if you can't reach the rim)
slam : [g who now |
  p : g get-in [who]
  them : (who = "me") ["foe"] else ["me"]
  q : g get-in [them]
  near : (q x - (p x) abs < 18) and (q h > 14)
  stuffed : near and (random < (q stats d * 0.07 + 0.12))
  reach : p h + 34 >= (floor-y - rim-y - 6)
  odds : reach [0.95] else [0.7]
  start-at : pair [p x, floor-y - 40 - (p h)]
  done : g set-in [[who], p with [dunking : false]]
  stuffed [blocked [done, start-at, now]] else [
    done with [ball : ball-of ["shot", who, start-at, 0x0] with [began : now, span : 0.2, good : random < odds, worth : 2, dst : pair [rim-x, rim-y - 2], rise : 4], said : reach ["SLAM!"] else ["LAYUP"], said-at : now, said-x : p x, sfx : reach ["slam"] else ["shoot"]]
  ]
]

-- ================================================================ a player's tick: the same rules for both
-- one tick of one player from their buttons [way, one, one-now, one-up, two-now]: walking, jumping, rising to shoot or
-- to dunk, and crossing over. The same rules move you and the legend.
act : [g who bt now dt |
  p : g get-in [who]
  them : (who = "me") ["foe"] else ["me"]
  q : g get-in [them]
  b : g ball
  have : (b mode = "held") and (b by = who)
  standing : (p h <= 0) and (p vh <= 0)
  up-now : (bt one-now) and standing and (p stun <= 0)
  ready : have and (g cleared)
  dunk : up-now and ready and (rim-x - (p x) < 44) and (bt way = 1)
  shot-up : up-now and ready and (dunk not)
  hop : up-now and (have not)
  spread : 1.3 - (p stats shot * 0.2) * (leap-of p) * 0.7
  jumped : (dunk or shot-up or hop) [p with [vh : leap-of p, rising : shot-up, dunking : dunk, aim : random - 0.5 * spread]] else [p]
  crossed : (have and (bt two-now) and standing and (p burst <= 0)) [jumped with [burst : 0.35]] else [jumped]
  stuck : up-now and have and (g cleared not)
  stepped : moved [crossed, stuck [0] else [bt way], dt]
  facing : cond [bt way != 0, bt way, have, 1, any, (q x > (stepped x)) [1] else [-1]]
  done : g set-in [[who], stepped with [face : facing, held-one : bt one]]
  stuck [done with [said : "TAKE IT BACK", said-at : now, said-x : p x]] else [done]
]
-- what a player's buttons did to the ball this tick: a shot let go, a dunk at the top of the jump, a travel, a defender
-- shaken by a crossover, or a reach for a steal
outcomes : [g who bt now |
  p : g get-in [who]
  them : (who = "me") ["foe"] else ["me"]
  q : g get-in [them]
  b : g ball
  have : (b mode = "held") and (b by = who)
  guarding : (b mode = "held") and (b by = them)
  gap : q x - (p x) abs
  cond [
    have and (p rising) and (bt one-up), release [g, who, now]
    have and (p dunking) and (p vh <= 0), slam [g, who, now]
    have and (p rising) and (p h <= 0), turnover [g, them, "TRAVEL", now]
    have and (bt two-now) and (p burst > 0.3) and (gap < 22) and (q x > (p x)) and (random < (p stats speed - (q stats d) * 0.08 + 0.3)), shake-off [g, them, now]
    guarding and (bt two-now) and (gap < 16) and (q h <= 0) and (p stun <= 0), swipe [g, who, now]
    any, g
  ]
]

-- ================================================================ the ball in the air and on the floor
score : [g b now |
  plus-me : (b by = "me") [b worth] else [0]
  plus-foe : (b by = "foe") [b worth] else [0]
  m-score : g mine + plus-me
  f-score : g theirs + plus-foe
  other : (b by = "me") ["foe"] else ["me"]
  g with [mine : m-score, theirs : f-score, mode : "point", mode-at : now, next-ball : other, ball : b with [mode : "drop", began : now], said : "+[b worth]", said-at : now, said-x : rim-x - 12, sfx : "swish"]
]
rim-out : [g b now |
  side : (random < 0.75) [-1] else [1]
  speed : pair [side * (40 + (random * 90)), -110 - (random * 80)]
  g with [ball : ball-of ["loose", b by, pair [rim-x - 6, rim-y], speed] with [began : now], said : "CLANK", said-at : now, said-x : rim-x - 12, sfx : "rim"]
]
-- a loose ball is taken by whoever touches it first (a coin decides a tie); the shooter keeps it cleared
grab : [g b now |
  reach-of : [p | (p x - (b x) abs < 11) and (b y > (floor-y - 48 - (p h))) and (b y < (floor-y + 4 - (p h))) and (p stun <= 0)]
  live : now - (b began) > 0.25
  me-gets : live and (reach-of (g me))
  foe-gets : live and (reach-of (g foe))
  who : me-gets [(foe-gets and (random < 0.5)) ["foe"] else ["me"]] else [foe-gets ["foe"] else [""]]
  (who = "") [g] else [own [g, who, (who = (b by)) and (g cleared), now] with [said : (who = (b by)) [""] else ["BOARD!"], said-at : now, said-x : b x]]
]
bounce : [g b dt now |
  fall : b vy + (500 * dt)
  ny : b y + (fall * dt)
  nx : b x + (b vx * dt)
  floor-hit : ny > (floor-y - 3)
  wall-hit : (nx < 6) or (nx > 246)
  bx : wall-hit [0 - (b vx) * 0.7] else [b vx]
  by-speed : floor-hit [0 - fall * 0.6] else [fall]
  still : floor-hit and (by-speed abs < 40)
  rolled : b with [x : nx max 6 min 246, y : ny min (floor-y - 3), vx : floor-hit [bx * 0.85] else [bx], vy : still [0] else [by-speed]]
  grab [g with [ball : rolled, sfx : (floor-hit and (fall > 60)) ["bounce"] else [g sfx]], rolled, now]
]
fly : [g b now |
  t : arc progress [b span, b began, now]
  spot : arc point [b src, b dst, b rise, t]
  sx : spot x
  sy : spot y
  (t < 1) [g with [ball : b with [x : sx, y : sy]]] else [b good [score [g, b, now]] else [rim-out [g, b, now]]]
]
roll : [g now dt |
  b : g ball
  cond [
    b mode = "shot", fly [g, b, now]
    b mode = "loose", bounce [g, b, dt, now]
    any, g
  ]
]

-- ================================================================ the legend's mind: its buttons [way, one, two-now]
on-ball : [g f m st |
  goal : (g cleared) [g plan] else [arc-x - 30]
  gap : goal - (f x)
  there : gap abs < 6
  drive-in : (rim-x - (f x) < 44) and (g cleared) and (st hops >= 3) and (g plan > 196)
  go-up : (g cleared) and (there or (g clock-left < 2) or drive-in) and (f h <= 0) and (f vh <= 0)
  holding : (f rising) and (f vh > (f aim))
  cross : (m x - (f x) < 18) and (m x > (f x)) and (f burst <= 0) and (random < 0.02)
  [way : drive-in [1] else [there [0] else [gap sign]], one : go-up or holding or (f dunking), two-now : cross]
]
on-guard : [f m st |
  spot : m x + 24 min (rim-x - 6)
  gap : spot - (f x)
  near : (m x - (f x) abs) < 30
  leap : near and ((m rising) or (m dunking)) and (f h <= 0) and (random < (st d * 0.035 + 0.03))
  reach : (m x - (f x) abs < 16) and (m h <= 0) and (f stun <= 0) and (random < (st d * 0.004 + 0.002))
  [way : (gap abs < 4) [0] else [gap sign], one : leap, two-now : reach]
]
chase : [f b |
  spot : (b mode = "shot") [rim-x - 34] else [arc landing [pair [b x, b y], pair [b vx, b vy], 500, floor-y - 3] x]
  gap : spot - (f x)
  leap : (b mode = "loose") and (gap abs < 14) and (b y < (floor-y - 44)) and (f h <= 0) and (random < 0.1)
  [way : (gap abs < 3) [0] else [gap sign], one : leap, two-now : false]
]
brain : [g now |
  f : g foe
  m : g me
  b : g ball
  st : f stats
  cond [
    (b mode = "held") and (b by = "foe"), on-ball [g, f, m, st]
    (b mode = "held") and (b by = "me"), on-guard [f, m, st]
    any, chase [f, b]
  ]
]

-- ================================================================ a tick of play
buttons-of : [inp | [way : pad across (inp held), one : inp held "one", one-now : inp pressed "one", one-up : inp released "one", two-now : inp pressed "two"]]
think : [p want |
  w : want way
  o : want one
  t : want two-now
  was : p held-one
  [way : w, one : o, one-now : o and (was not), one-up : (o not) and was, two-now : t]
]
-- the shot clock runs while the ball is in hand, and the ball is cleared once it's taken back past the arc
rules : [g now dt |
  b : g ball
  in-hand : b mode = "held"
  behind : in-hand and ((g get-in [b by]) x < (arc-x - 4))
  time-left : in-hand [g clock-left - dt] else [g clock-left]
  later : g with [cleared : (g cleared) or behind, clock-left : time-left]
  (in-hand and (time-left <= 0)) [turnover [later, (b by = "me") ["foe"] else ["me"], "SHOT CLOCK", now]] else [later]
]
play-tick : [g inp now dt |
  mine-bt : buttons-of inp
  foe-bt : think [g foe, brain [g, now]]
  g1 : act [act [g, "me", mine-bt, now, dt], "foe", foe-bt, now, dt]
  g2 : outcomes [g1, "me", mine-bt, now]
  g3 : (g2 mode = "play") [outcomes [g2, "foe", foe-bt, now]] else [g2]
  g4 : (g3 mode = "play") [roll [g3, now, dt]] else [g3]
  (g4 mode = "play") [rules [g4, now, dt]] else [g4]
]

-- ================================================================ the run
talk-to : [g now | g with [mode : "talk", mode-at : now, song : "talk"]]
tip-off : [g now |
  r : legend g
  me-look : look-of [#ffaa55, #550000, jerseys @ (g jersey)]
  foe-look : look-of [r skin, r hair, r jersey]
  check-to [g with [mine : 0, theirs : 0, song : "game", said : "", said-at : -9, me : fresh-player [stats-of (g build), me-look, 70], foe : fresh-player [r stats, foe-look, 120]], "me", now]
]
finish : [g now |
  won : g mine >= win-at
  top : won [g era max (g best)] else [g best]
  g with [mode : won ["won"] else ["lost"], mode-at : now, song : won ["win"] else ["lose"], best : top, keep : [best : top]]
]
point-tick : [g now |
  since : now - (g mode-at)
  cond [
    since < 1.3, g
    (g mine >= win-at) or (g theirs >= win-at), finish [g, now]
    any, check-to [g, g next-ball, now]
  ]
]
spent : [g at change | s : menu spend [g build, at, change, g spare, 1, 5], g with [build : s values, spare : s spare]]
build-tick : [g nudge go cancel now |
  at : g cursor
  cond [
    nudge y != 0, g with [cursor : menu wrap [at, 6, nudge y]]
    (at <= 4) and (nudge x != 0), spent [g, at, nudge x]
    (at = 5) and (nudge x != 0), g with [jersey : menu wrap [g jersey, jerseys length, nudge x]]
    (at = 6) and go, talk-to [g, now]
    go, g with [cursor : 6]
    cancel, g with [mode : "title", mode-at : now]
    any, g
  ]
]
level-tick : [g nudge go now |
  s : menu spend [g build, g cursor, 1, 1, 1, 5]
  full : g build keep [v | v < 5] length = 0
  cond [
    nudge y != 0, g with [cursor : menu wrap [g cursor, 4, nudge y]]
    go and ((s spare = 0) or full), talk-to [g with [build : s values, era : g era + 1], now]
    any, g
  ]
]

-- ================================================================ the music
songs : [
  title : [
    bpm : 104, beats : 16
    lead : music track ["E5 . G5 . A5 . G5 E5 | D5 . E5 . G5 - - . | E5 . G5 . A5 . C6 A5 | G5 - E5 . D5 - - .", 0.5]
    bass : music track ["E2 . E3 . E2 . E3 . | A2 . A3 . A2 . A3 . | E2 . E3 . E2 . E3 . | B2 . B3 . D3 . D#3 .", 0.5]
    drums : music track ["kick . hat . snare . hat kick | kick . hat . snare . hat . | kick . hat . snare . hat kick | kick . snare . snare snare crash .", 0.5]
  ]
  game : [
    bpm : 126, beats : 16
    lead : music track ["A4 . . A4 C5 . A4 . | G4 . . G4 A4 . G4 E4 | A4 . . A4 C5 . D5 . | E5 . D5 . C5 . A4 .", 0.5]
    bass : music track ["A2 . A2 . A3 . A2 . | G2 . G2 . G3 . G2 . | F2 . F2 . F3 . F2 . | E2 . E2 . E3 . G#2 .", 0.5]
    drums : music track ["kick hat snare hat kick kick snare hat | kick hat snare hat kick kick snare hat | kick hat snare hat kick kick snare hat | kick hat snare hat snare snare crash .", 0.5]
  ]
  talk : [
    bpm : 84, beats : 8
    lead : music track ["E4 . . G4 . . A4 . | B4 - - . . . . .", 0.5]
    bass : music track ["E2 - - . E2 - - . | B1 - - . B1 - - .", 0.5]
  ]
  win : [
    bpm : 150, beats : 8, once : true
    lead : music track ["C5 E5 G5 C6 . G5 C6 . | E6 - - - . . . .", 0.5]
    bass : music track ["C3 . G2 . C3 . G2 . | C2 - - - . . . .", 0.5]
  ]
  lose : [
    bpm : 90, beats : 8, once : true
    lead : music track ["E5 . D5 . C5 . B4 . | A4 - - - . . . .", 0.5]
    bass : music track ["A2 . G2 . F2 . E2 . | A1 - - - . . . .", 0.5]
  ]
]

-- ================================================================ the game
start :
  mode : "title"
  mode-at : 0
  best : saved best else 0
  keep : [best : saved best else 0]
  song : "title"
  cursor : 1
  build : [2, 2, 2, 2]
  spare : 4
  jersey : 1
  era : 1
  mine : 0
  theirs : 0
  me : fresh-player [stats-of [2, 2, 2, 2], title-ink, 70]
  foe : fresh-player [stats-of [2, 2, 2, 2], title-ink, 120]
  ball : ball-of ["held", "me", 0x0, 0x0]
  offense : "me"
  cleared : true
  clock-left : 12
  plan : 190
  next-ball : "me"
  said : ""
  said-at : -9
  said-x : 128
  sfx : ""
update : [game |
  g : game with [sfx : ""]
  inp : g input
  now : g clock
  dt : g dt min 0.05
  go : inp pressed "one"
  cancel : inp pressed "two"
  nudge : pad way (inp pressed)
  since : now - (g mode-at)
  after : cond [
    g mode = "title", (go or cancel) [g with [mode : "build", mode-at : now, cursor : 1, build : [2, 2, 2, 2], spare : 4, era : 1]] else [g]
    g mode = "build", build-tick [g, nudge, go, cancel, now]
    g mode = "talk", (go and (since > 0.4)) [tip-off [g, now]] else [g]
    g mode = "play", play-tick [g, inp, now, dt]
    g mode = "point", point-tick [g, now]
    g mode = "won", (go and (since > 1.2)) [(g era >= (rivals length)) [g with [mode : "champ", mode-at : now, song : "win"]] else [g with [mode : "level", mode-at : now, cursor : 1, song : "title"]]] else [g]
    g mode = "level", level-tick [g, nudge, go, now]
    g mode = "lost", (go and (since > 1.2)) [talk-to [g, now]] else [((since > 1.2) and cancel) [g with [mode : "title", mode-at : now, song : "title"]] else [g]]
    g mode = "champ", (go and (since > 2)) [g with [mode : "title", mode-at : now, song : "title"]] else [g]
    any, g
  ]
  heard : after sfx
  heard = "swish"
    zzfx preset "coin"
    hiss [0.3, 6000]
  heard = "slam"
    zzfx preset "explode"
    shake 4
  heard = "rim"
    beep [196, 0.07]
  heard = "shoot"
    beep [660, 0.03]
  heard = "block"
    zzfx preset "hit"
    shake 2
  heard = "steal"
    zzfx preset "power"
  heard = "whiff"
    hiss [0.08, 1500]
  heard = "shook"
    zzfx preset "jump"
  heard = "whistle"
    beep [1568, 0.3]
  heard = "bounce"
    beep [98, 0.03]
  (after mode = "play") and (after ball mode = "held") and ((after get-in [after ball by]) h <= 0) and ((now * 9 / 3.14159 floor) != (now - dt * 9 / 3.14159 floor))
    beep [82, 0.02]
  (after mode != (g mode)) and (after mode != "point") and (after mode != "play") or ((after cursor) != (g cursor)) or ((after jersey) != (g jersey)) or ((after spare) != (g spare))
    zzfx preset "blip"
  after
]

-- ================================================================ drawing
crowd-ink : [#aa0000, #0055aa, #aaaa00, #00aa55, #aa55aa]
fan-skin : [#ffaa55, #aa5500, #550000]
stat-names : ["SHOT", "SPEED", "HOPS", "D"]
court : [g now |
  hype : (now - (g said-at) < 1.5) [3] else [1]
  clear #000055
  range 3 each [row |
    range 26 each [i |
      jump : ((now * 5 + (i * 1.9) + row) sin > 0.6) [hype] else [0]
      cx : i * 10 + (row % 2 * 5) - 14
      cy : row * 12 + 6 - jump
      rect [cx, cy + 4, 8, 7, crowd-ink @ (i + row % 5 + 1)]
      rect [cx + 2, cy, 4, 4, fan-skin @ (i * 7 + row % 3 + 1)]
    ]
  ]
  rect [0, 56, 256, 14, #550000]
  text [legend g year, 128, 63, 8, #ffaa00]
  rect [0, 70, 256, 122, #aa5500]
  range 15 each [k | rect [0, k * 8 + 70, 256, 1, #aa5555]]
  range 37 each [k | rect [186 - (k * 0.22 floor), k * 2 + 116, 60 + (k * 0.22 floor), 2, #aa5555]]
  line [186, 118, 246, 118, #ffffff]
  line [186, 118, 178, 192, #ffffff]
  line [arc-x + 12, 70, arc-x - 10, 192, #ffffff]
  rect [246, 36, 6, 136, #aaaaaa]
  rect [238, 52, 10, 3, #aaaaaa]
  rect [236, 48, 4, 52, #ffffff]
  rect [236, 66, 4, 14, #ff0000]
  rect [rim-x - 8, rim-y, 16, 2, #ff5500]
  line [rim-x - 8, rim-y + 2, rim-x - 5, rim-y + 14, #ffffff]
  line [rim-x + 7, rim-y + 2, rim-x + 4, rim-y + 14, #ffffff]
  line [rim-x - 3, rim-y + 2, rim-x - 1, rim-y + 14, #aaaaaa]
  line [rim-x + 2, rim-y + 2, rim-x, rim-y + 14, #aaaaaa]
]
player : [p defending now |
  art : cond [p h > 0, jump-art, defending, guard-art, p moving and ((now * 8 floor) % 2 = 0), run-art, any, stand-art]
  rect [p x - 9, floor-y - 1, 18, 3, #550000]
  sprite [art, p x - 16, floor-y - 32 - (p h), p look, p face < 0, 2]
  p stun > 0
    text ["?!", p x, floor-y - 44 - (p h), 8, #ffff55]
]
ball-dot : [g now |
  b : g ball
  spot : cond [
    b mode = "held", held-at [g get-in [b by], now]
    b mode = "drop", pair [rim-x, now - (b began) * 120 min 64 + rim-y]
    any, pair [b x, b y]
  ]
  circle [spot x, spot y, 3, #ff5500]
  rect [spot x - 1, spot y - 2, 1, 1, #ffaa55]
]
hud : [g now |
  m : g me
  b : g ball
  quality : 1 - (m vh abs / (leap-of m)) max 0
  middle : (b mode = "held") ["SHOT [g clock-left ceil]"] else [legend g year]
  ui strip ["YOU [g mine]", middle, "[legend g name] [g theirs]", #ffff55, #000000]
  (b mode = "held") and (b by = "me") and (g cleared not)
    ui blink ["TAKE IT BACK", 32, #ffff55, now]
  m rising
    ui meter [pair [m x - 12, floor-y - 54 - (m h)], 24x4, quality * 10, 10, (quality > 0.92) [#55ff55] else [#ffff55], #555555]
  ui float [g said, pair [g said-x, 116], #ffff55, g said-at, now]
]
pips : [values left-x top-y | values numbered each [[i, v] | range 5 each [k | rect [left-x + (k * 10), i - 1 * 12 + top-y, 8, 7, (k <= v) [#ffaa00] else [#555555]]]]]
title-screen : [g now |
  ui panel [pair [20, 26], pair [216, 90], #ffaa00, #000055]
  ui banner ["BASKETBALL", 48, 16, #ffffff]
  ui banner ["LEGENDS", 74, 16, #ffaa00]
  ui banner ["1960 TO FOREVER", 100, 8, #ffaa55]
  bob : now * 5 sin abs * 18
  sprite [jump-art, 112, 126, title-ink, false, 2]
  circle [128, 120 - bob, 3, #ff5500]
  rect [76, 171, 104, 14, #000000]
  ui blink ["PRESS 1", 178, #ffffff, now]
  g best > 0
    text ["DECADES BEATEN [g best]", 128, 166, 8, #ffff55]
]
build-screen : [g now |
  ui panel [pair [8, 16], pair [240, 156], #ffaa00, #000055]
  ui banner ["BUILD YOUR LEGEND", 28, 8, #ffaa00]
  ui choices [stat-names .. ["JERSEY", "PLAY"], g cursor, pair [30, 50], #ffff55, #aaaaaa]
  pips [g build, 92, 47]
  text [jersey-names @ (g jersey), 102, 98, 8, jerseys @ (g jersey), "left"]
  text ["POINTS TO SPEND [g spare]", 128, 136, 8, (g spare > 0) [#ffff55] else [#aaaaaa]]
  sprite [stand-art, 186, 62, look-of [#ffaa55, #550000, jerseys @ (g jersey)], false, 3]
  text ["ARROWS CHOOSE  1 PLAY", 128, 156, 8, #aaaaaa]
]
talk-screen : [g now |
  r : legend g
  ui panel [pair [8, 16], pair [240, 118], #ffaa00, #000055]
  text [r year, 128, 28, 8, #ffaa00]
  ui banner [r name, 46, 16, #ffffff]
  sprite [stand-art, 30, 64, look-of [r skin, r hair, r jersey], false, 4]
  pips [[r stats shot, r stats speed, r stats hops, r stats d], 150, 70]
  stat-names numbered each [[i, n] | text [n, 156, i - 1 * 12 + 73, 8, #aaaaaa, "right"]]
  ui talk [r says, g mode-at + 0.3, now]
  ui talked [r says, g mode-at + 0.3, now]
    ui blink ["1 PLAY", 138, #ffff55, now]
]
final-screen : [g now |
  won : g mode = "won"
  r : legend g
  ui panel [pair [28, 44], pair [200, 96], won [#ffaa00] else [#aa0000], #000055]
  ui banner [won ["YOU WIN"] else ["GAME OVER"], 62, 16, won [#ffff55] else [#ff5555]]
  ui banner ["[g mine] - [g theirs]", 88, 16, #ffffff]
  ui banner [won ["[r name] IS BEATEN"] else ["[r name] WINS"], 110, 8, #aaaaaa]
  now - (g mode-at) > 1.2
    ui blink [won ["1 NEXT DECADE"] else ["1 RUN IT BACK  2 TITLE"], 128, #ffff55, now]
]
level-screen : [g now |
  ui panel [pair [8, 16], pair [240, 156], #ffaa00, #000055]
  ui banner ["ONE MORE POINT", 30, 8, #ffff55]
  ui choices [stat-names, g cursor, pair [40, 60], #ffff55, #aaaaaa]
  pips [g build, 100, 57]
  ui banner ["NEXT: [rivals @ (g era + 1) name]", 126, 8, #aaaaaa]
  ui blink ["1 ADD IT", 150, #ffffff, now]
]
champ-screen : [g now |
  ui panel [pair [16, 30], pair [224, 116], #ffaa00, #000055]
  ui banner ["LEGEND", 56, 16, #ffaa00]
  ui banner ["FOREVER", 82, 16, #ffffff]
  ui banner ["YOU BEAT EVERY DECADE", 110, 8, #ffff55]
  ui blink ["PRESS 1", 134, #ffffff, now]
]
draw : [game |
  g : game
  now : g clock
  court [g, now]
  (g mode = "play") or (g mode = "point")
    player [g foe, (g ball mode = "held") and (g ball by = "me"), now]
    player [g me, (g ball mode = "held") and (g ball by = "foe"), now]
    ball-dot [g, now]
    hud [g, now]
  g mode = "title"
    title-screen [g, now]
  g mode = "build"
    build-screen [g, now]
  g mode = "talk"
    talk-screen [g, now]
  (g mode = "won") or (g mode = "lost")
    final-screen [g, now]
  g mode = "level"
    level-screen [g, now]
  g mode = "champ"
    champ-screen [g, now]
]
