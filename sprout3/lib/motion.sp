-- motion: how things move and how a game feels: tweens, glides, shake, bobbing, gravity and bounces. Each is worked out
-- from the time or the step, so a game can rewind and replay. Distilled from the TaskIAP games: 112 of the 319 ease
-- things about, 57 have gravity, 55 shake the screen.

-- a value going from a to b, starting at start and taking length seconds, shaped by an easing curve: its value at now
-- e.g. motion tween [0, 100, 1, 2, 1.5, ease out-quad]
tween : [a b start length now curve | t : now - start / length max 0 min 1, curve t * (b - a) + a]

-- a value stepped toward target by at most rate a second, never past it
-- e.g. motion approach [0, 10, 4, 0.5]
approach : [value target rate dt | gap : target - value, (gap abs <= (rate * dt)) [target] else [gap sign * rate * dt + value]]

-- a value gliding toward target, closing share of the gap every second, whatever the frame rate (cameras, health bars)
-- e.g. motion glide [0, 100, 0.9, 0.1] round
glide : [value target share dt | still : 1 - share pow dt, target - value * (1 - still) + value]

-- screen shake from trauma (0 to 1): an offset of up to most pixels at time now, smooth rather than jittery
-- e.g. motion shake [0.5, 12, 3.2]
shake : [trauma most now | k : trauma * trauma * most, pair [noise [now * 14, 1.5] - 0.5 * 2 * k, noise [now * 14, 7.5] - 0.5 * 2 * k]]

-- trauma after dt seconds, falling away at rate a second
-- e.g. motion calm [0.8, 1.5, 0.2]
calm : [trauma rate dt | trauma - (rate * dt) max 0]

-- a gentle up and down, per-second times a second (pickups, idle characters, menus): the offset at now
-- e.g. motion bob [0.1, 1, 0.25]
bob : [height per-second now | now * per-second * 2 * pi sin * height]

-- a beat between 0 and 1, per-second times a second (blinking, glowing)
-- e.g. motion pulse [1, 0.25]
pulse : [per-second now | now * per-second * 2 * pi sin + 1 / 2]

-- a body [x, y, vx, vy] after falling for dt seconds under gravity g (y grows downward)
-- e.g. motion fall [[x : 0, y : 0, vx : 2, vy : 0], 10, 0.5]
fall : [body g dt | down : g * dt + (body vy), body with [x : body vx * dt + (body x), y : down * dt + (body y), vy : down]]

-- a body kept inside a w by h box, bouncing off its walls and keeping bounciness (0 to 1) of its speed
-- e.g. motion bounce [[x : 12, y : 5, vx : 3, vy : 0], 10, 10, 0.8]
bounce : [body w h bounciness |
  off-x : (body x < 0) or (body x > w)
  off-y : (body y < 0) or (body y > h)
  body with [x : body x max 0 min w, y : body y max 0 min h, vx : off-x [0 - (body vx) * bounciness] else [body vx], vy : off-y [0 - (body vy) * bounciness] else [body vy]]
]

-- a speed after dt seconds of friction, keeping share of itself every second
-- e.g. motion drag [10, 0.5, 1]
drag : [speed share dt | share pow dt * speed]

-- how fast to jump to rise to height under gravity g
-- e.g. motion jump-speed [2, 9.8] round
jump-speed : [height g | 2 * g * height sqrt]
