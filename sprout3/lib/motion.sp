-- motion: how things move and how a game feels: how far through something is, tweens, glides, shake, bobbing,
-- gravity and bounces. A body is [at, speed], both pairs (where it is, and how far it goes a second). Each word works
-- from the time or the step, so a game can rewind and replay. Distilled from the TaskIAP games: 112 of the 319 ease
-- things about, 57 have gravity, 55 shake the screen.

-- how far through something length seconds long is, from 0 to 1, elapsed seconds in
-- e.g. motion progress [2, 1.5] → 0.75
progress : [length elapsed | elapsed / length max 0 min 1]

-- a value (or a point) going from a to b over length seconds from start, shaped by an easing curve: where it is at now
-- e.g. motion tween [0, 100, 1, 2, ease out-quad, 1.5] → 43.75
-- e.g. motion tween [0x0, 10x20, 0, 2, ease linear, 1] → 5x10
tween : [a b start length curve now | b - a * (curve (progress [length, now - start])) + a]

-- a value stepped toward target by at most rate a second, never past it
-- e.g. motion approach [0, 10, 4, 0.5] → 2
approach : [value target rate dt | gap : target - value, (gap abs <= (rate * dt)) [target] else [gap sign * rate * dt + value]]

-- a value (or a point) gliding toward target, closing share of the gap every second, whatever the frame rate: for
-- cameras and health bars
-- e.g. motion glide [0, 100, 0.9, 0.1] round → 21
-- e.g. vec round (motion glide [0x0, 100x50, 0.9, 0.1]) → 21x10
glide : [value target share dt | still : 1 - share pow dt, target - value * (1 - still) + value]

-- screen shake from trauma (0 to 1): an offset of up to most pixels at time now, smooth rather than jittery
-- e.g. vec round (motion shake [0.5, 12, 3.2]) → 0x-2
shake : [trauma most now | k : trauma * trauma * most, pair [noise [now * 14, 1.5] - 0.5 * 2 * k, noise [now * 14, 7.5] - 0.5 * 2 * k]]

-- trauma after dt seconds, falling away at rate a second
-- e.g. motion calm [0.8, 1.5, 0.2] → 0.5
calm : [trauma rate dt | trauma - (rate * dt) max 0]

-- a gentle up and down of height, per-second times a second (pickups, idle characters, menus): the offset at now
-- e.g. motion bob [0.1, 1, 0.25] → 0.1
bob : [height per-second now | now * per-second * 2 * pi sin * height]

-- a beat between 0 and 1, per-second times a second (blinking, glowing)
-- e.g. motion pulse [1, 0.25] → 1
pulse : [per-second now | now * per-second * 2 * pi sin + 1 / 2]

-- a body after falling for dt seconds under gravity g (down is y growing)
-- e.g. motion fall [[at : 0x0, speed : 2x0], 10, 0.5] → [at : 1x2.5, speed : 2x5]
fall : [body g dt | v : body speed + (pair [0, g * dt]), body with [at : v * dt + (body at), speed : v]]

-- a body kept inside a box of size, bouncing off its walls and keeping bounciness (0 to 1) of its speed
-- e.g. motion bounce [[at : 12x5, speed : 3x0], 10x10, 0.8] → [at : 10x5, speed : -2.4x0]
bounce : [body size bounciness |
  p : body at
  v : body speed
  off-x : (p x < 0) or (p x > (size x))
  off-y : (p y < 0) or (p y > (size y))
  body with [at : pair [p x max 0 min (size x), p y max 0 min (size y)], speed : pair [off-x [0 - (v x) * bounciness] else [v x], off-y [0 - (v y) * bounciness] else [v y]]]
]

-- a speed after dt seconds of friction, keeping share of itself every second
-- e.g. motion drag [10, 0.5, 1] → 5
drag : [speed share dt | share pow dt * speed]

-- how fast to jump to rise to height under gravity g
-- e.g. motion jump-speed [2, 9.8] round → 6
jump-speed : [height g | 2 * g * height sqrt]
