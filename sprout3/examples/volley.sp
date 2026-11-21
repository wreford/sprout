-- Volley: a game for two phones. Press Two players (or More, then Play with a friend) and send the invite by text.
-- Each player drags their own paddle; each screen shows its player at the bottom. Alone, the top paddle plays itself.
-- Change the ball speed, the paddle size or the colours while you play: the change reaches both phones.

paddle-width : 80
paddle-y : 40              -- how far each paddle is from its own end
ball-speed : 260
speed-up : 1.04            -- the ball gets this much faster at each hit
mine : #e8a33d
theirs : #5fa8d3

start :
  ball : [x : 180, y : 240, vx : 120, vy : 220]
  near : 180               -- player 1's paddle, at the bottom of the court
  far : 180                -- player 2's paddle, at the top
  score : [near : 0, far : 0]

-- player 2 sees the court turned round, so their finger's x is flipped
update : [game |
  dt : game dt
  two-players : game has-field "input2"
  near-x : (game input touching) [game input touch-x] else [game near]
  far-x : cond [
    two-players and (game input2 touching), W - (game input2 touch-x)
    two-players, game far
    any, toward [game far, game ball x, 0.08]
  ]
  b : game ball
  moved : b with [x : b x + (b vx * dt), y : b y + (b vy * dt)]
  walls : (moved x < 8) or (moved x > (W - 8)) [moved with [vx : 0 - (moved vx)]] else [moved]
  hit-near : (walls vy > 0) and (walls y > (H - paddle-y - 8)) and ((walls x - near-x) abs < (paddle-width / 2))
  hit-far : (walls vy < 0) and (walls y < (paddle-y + 8)) and ((walls x - far-x) abs < (paddle-width / 2))
  bounced : cond [
    hit-near, walls with [vy : 0 - (walls vy) * speed-up, vx : walls x - near-x * 4]
    hit-far, walls with [vy : 0 - (walls vy) * speed-up, vx : walls x - far-x * 4]
    any, walls
  ]
  served : [towards | [x : W / 2, y : H / 2, vx : rand [-120, 120], vy : ball-speed * towards]]
  cond [
    bounced y > (H + 20), game with [near : near-x, far : far-x, ball : served -1, score : game score with [far : game score far + 1]]
    bounced y < -20, game with [near : near-x, far : far-x, ball : served 1, score : game score with [near : game score near + 1]]
    any, game with [near : near-x, far : far-x, ball : bounced]
  ]
]

-- each screen draws its own player at the bottom
flip : [y | me = 2 [H - y] else [y]]
flip-x : [x | me = 2 [W - x] else [x]]
draw : [game |
  clear "#101318"
  line [0, H / 2, W, H / 2, "#2a2f38"]
  rect [flip-x (game near) - (paddle-width / 2), flip (H - paddle-y) - 5, paddle-width, 10, me = 1 [mine] else [theirs]]
  rect [flip-x (game far) - (paddle-width / 2), flip paddle-y - 5, paddle-width, 10, me = 1 [theirs] else [mine]]
  circle [flip-x (game ball x), flip (game ball y), 8, "#f4f1ea"]
  mine-score : me = 1 [game score near] else [game score far]
  their-score : me = 1 [game score far] else [game score near]
  text ["[their-score]", W / 2, H / 2 - 30, 28, "#5a6270"]
  text ["[mine-score]", W / 2, H / 2 + 50, 28, "#f4f1ea"]
]
