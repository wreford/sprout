-- Hop: set the lander down gently on the pad.
-- Hold a finger down to fire the engine; it pushes away from your finger, so hold left of the lander to drift right.
-- Keys: up or space to fire, left and right to lean. Land slower than 50 going down and 25 sideways.

gravity : 55
thrust : 140
ground : H - 40

start :
  ship : [x : 70, y : 70, vx : 40, vy : 0]
  fuel : 100
  phase : "flying"            -- "flying", "landed" or "crashed"
  burning : false
  pad-x : 220
  score : 0
  best : 0

-- one frame of flying
fly : [g |
  i : g input
  dt : g dt
  s : g ship

  burn : i touching or (i held "up") or (i held "space") and (g fuel > 0)
  lean : i touching [s x - (i touch-x) / 60 max -1 min 1] else [
    i held "left" [-1] else [i held "right" [1] else [0]]]
  push : burn [thrust] else [0]
  speed-x : s vx + (lean * push * 0.5 * dt)
  speed-y : s vy + (gravity - push * dt)
  moved : s with [x : s x + (speed-x * dt) max 10 min (W - 10), y : s y + (speed-y * dt), vx : speed-x, vy : speed-y]

  down : moved y > (ground - 12)
  on-pad : moved x > (g pad-x - 30) and (moved x < (g pad-x + 30))
  soft : speed-y < 50 and (speed-x abs < 25)
  landed : down and on-pad and soft
  crashed : down and (landed not)
  points : landed [g fuel round + 50] else [0]

  burn and (every [0.07, g clock, dt])
    beep [70 + (rand [0, 30]), 0.05]
  landed
    beep [660, 0.1]
    beep [880, 0.2]
  crashed
    shake 14
    beep [80, 0.5]

  g with
    ship : moved with [y : down [ground - 12] else [moved y]]
    fuel : burn [g fuel - (15 * dt) max 0] else [g fuel]
    phase : landed ["landed"] else [crashed ["crashed"] else ["flying"]]
    burning : burn
    score : g score + points
    best : g score + points max (g best)
]

-- after a landing or a crash, a tap sends the next lander; a crash starts the score again
again : [g |
  next : start with [pad-x : rand [50, W - 50], best : g best]
  g input tapped [g phase = "landed" [next with [score : g score]] else [next]] else [g]
]

update : [g | g phase = "flying" [fly g] else [again g]]

draw : [g |
  s : g ship
  sky : g phase = "crashed" ["#2a0f14"] else ["#0d1530"]
  clear sky
  circle [60, ground + 120, 160, "#1c2448"]
  circle [300, ground + 140, 190, "#18203f"]
  rect [0, ground, W, H - ground, "#2b2f45"]
  rect [g pad-x - 30, ground - 4, 60, 6, "#ffd166"]

  g burning
    line [s x, s y + 10, s x - (s vx * 0.05), s y + 26 + (rand [0, 8]), "#ff9e4a"]
  line [s x - 8, s y + 4, s x - 13, s y + 13, "#c8d0ea"]
  line [s x + 8, s y + 4, s x + 13, s y + 13, "#c8d0ea"]
  circle [s x, s y, 10, "#e8ecff"]
  circle [s x, s y - 2, 4, "#5fa8ff"]

  rect [12, 14, 100, 8, "#2b2f45"]
  rect [12, 14, g fuel, 8, g fuel > 25 ["#8ef08e"] else ["#ff6b6b"]]
  speed-ok : s vy < 50 and (s vx abs < 25)
  text ["down [s vy round]  side [s vx round]", W / 2, 44, 13, speed-ok ["#8ef08e"] else ["#ffb38a"]]
  text ["[g score]", W - 40, 20, 18, "#ffffff"]
  text ["best [g best]", W - 40, 40, 11, "#8a93b8"]

  g phase = "landed"
    text ["Landed! +[g fuel round + 50]", W / 2, H / 2 - 40, 24, "#8ef08e"]
    text ["tap for the next one", W / 2, H / 2 - 12, 14, "#c8d0ea"]
  g phase = "crashed"
    text ["Crashed", W / 2, H / 2 - 40, 26, "#ff6b6b"]
    text ["tap to try again", W / 2, H / 2 - 12, 14, "#c8d0ea"]
]
