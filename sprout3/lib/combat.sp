-- combat: the numbers of a fight: damage through armour, critical hits, health, experience and levels, cooldowns and
-- damage over time. Distilled from the TaskIAP games: 57 of the 319 count hit points, 33 roll critical hits.

-- damage after armour: each point takes a share off and none takes it all (100 armour halves it)
-- e.g. combat damage [40, 100]
damage : [attack armour | 100 / (armour max 0 + 100) * attack]

-- a hit that may be critical: [amount, crit], critical with chance (0 to 1) and then times as hard
-- e.g. combat strike [10, 0.25, 2, 7]
strike : [amount odds times seed | lucky : seeded chance [odds, seed], [amount : lucky [amount * times] else [amount], crit : lucky]]

-- health after a change (less than 0 is damage), kept between 0 and most
-- e.g. combat health [40, -55, 100]
health : [now-health change most | now-health + change max 0 min most]

-- how many hits of each it takes to bring down hp
-- e.g. combat hits-to-down [100, 30]
hits-to-down : [hp each | hp / each ceil]

-- the experience it takes to reach level (each level asks a little more than the one before)
-- e.g. combat xp-for 5
xp-for : [level | level - 1 pow 1.5 * 100 round]

-- the level that experience has reached
-- e.g. combat level-of 900
level-of : [xp | xp / 100 pow (1 / 1.5) + 0.000001 floor + 1]

-- how far through its level experience is, from 0 to 1 (for an experience bar)
-- e.g. combat level-progress 900
level-progress : [xp | here : level-of xp, xp - (xp-for here) / (xp-for (here + 1) - (xp-for here))]

-- is something last used at last ready again at now, when it takes every seconds?
-- e.g. combat ready [2, 3.1, 1]
ready : [last now every | now - last >= every]

-- how much of a cooldown is left, from 1 (just used) to 0 (ready): for a cooldown dial
-- e.g. combat cooling [2, 2.5, 1]
cooling : [last now every | 1 - (now - last / every) max 0 min 1]

-- damage over time (poison, fire, bleeding): the total done by now, per-second for length seconds from start
-- e.g. combat over-time [5, 3, 10, 11.5]
over-time : [per-second length start now | now - start max 0 min length * per-second]

-- who goes first: fighters, fastest first, by their speed
-- e.g. combat turn-order [[name : "orc", speed : 3], [name : "elf", speed : 7]] @ 1 name
turn-order : [fighters | fighters sort-by [f | 0 - (f speed)]]
