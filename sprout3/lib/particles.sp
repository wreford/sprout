-- particles: sparks, dust and confetti as plain records [x, y, vx, vy, born, life, colour], burst from a point with a
-- seed (so a replay bursts the same), moved a step at a time, faded and gone. Distilled from the TaskIAP games: 29 of
-- the 319 throw confetti, 18 more spray particles.

-- n particles bursting from px, py at up to speed, living life seconds from now, coloured from colours
-- e.g. particles burst [100, 100, 3, 80, 1.5, 12, 7, [#ffd166, #ff7ab2]] length
burst : [px py n speed life now seed colours |
  range n collect [k |
    heading : seeded number (seed * 97 + k) * 2 * pi
    pace : seeded between [speed / 3, speed, seed * 131 + k]
    [x : px, y : py, vx : heading cos * pace, vy : heading sin * pace, born : now, life : life, colour : seeded pick [colours, seed * 7 + k]]
  ]
]

-- the particles after dt seconds: moved, falling under gravity, and those past their life gone
-- e.g. particles step [particles burst [0, 0, 4, 50, 1, 0, 7, [#ffd166]], 0.1, 200, 0.5] length
step : [ps dt gravity now | ps keep [p | now - (p born) < (p life)] collect [p | p with [x : p vx * dt + (p x), y : p vy * dt + (p y), vy : gravity * dt + (p vy)]]]

-- how much of a particle is left at now, from 1 (new) to 0 (gone): for its size or how see-through it is
-- e.g. particles fade [[born : 1, life : 2], 2]
fade : [p now | 1 - (now - (p born) / (p life)) max 0 min 1]
