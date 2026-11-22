-- particles: sparks, dust and confetti as records [at, speed, born, life, colour] (at and speed are pairs), burst from a
-- point with a seed (so a replay bursts the same), moved a step at a time, faded and gone. Distilled from the TaskIAP
-- games: 29 of the 319 throw confetti, 18 more spray particles.

-- n particles bursting from a point at up to speed, living life seconds, coloured from colours, from now
-- e.g. particles burst [100x100, 3, 80, 1.5, [#ffd166, #ff7ab2], 12, 7] length → 3
burst : [from n speed life colours now seed |
  range n collect [k |
    heading : seeded number (seed * 97 + k) * 2 * pi
    pace : seeded between [speed / 3, speed, seed * 131 + k]
    [at : from, speed : pair [heading cos * pace, heading sin * pace], born : now, life : life, colour : seeded pick [colours, seed * 7 + k]]
  ]
]

-- the particles after dt seconds: moved, falling under gravity, and those past their life gone
-- e.g. particles step [particles burst [0x0, 4, 50, 1, [#ffd166], 0, 7], 200, 0.1, 0.5] length → 4
step : [ps gravity dt now | ps keep [p | now - (p born) < (p life)] collect [p | v : p speed + (pair [0, gravity * dt]), p with [at : v * dt + (p at), speed : v]]]

-- how much of a particle is left at now, from 1 (new) to 0 (gone): for its size, or how see-through it is
-- e.g. particles fade [[born : 1, life : 2], 2] → 0.5
fade : [p now | 1 - (now - (p born) / (p life)) max 0 min 1]
