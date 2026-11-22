-- waves: rounds of enemies that grow harder: how many come, how tough they are, how quickly, where from, and when the
-- boss comes. Distilled from the TaskIAP games: 33 of the 319 spawn enemies, 27 in waves, 25 with a boss.

-- how many come in wave n: first in wave 1, and growth times as many each wave after
-- e.g. waves size [5, 4, 1.3] → 11
size : [n first growth | growth pow (n - 1) * first round]

-- how tough each one is in wave n, as a share of the first wave's (it climbs gently)
-- e.g. waves toughness 10 → 2.08
toughness : [n | n - 1 * 0.12 + 1]

-- the seconds between arrivals in wave n: quicker each wave, never quicker than fastest
-- e.g. waves gap [20, 2, 0.4] → 0.4
gap : [n slowest fastest | 0.9 pow (n - 1) * slowest max fastest]

-- is wave n a boss wave (every every-th one)?
-- e.g. waves boss [10, 5] → true
boss : [n every | n % every = 0]

-- where the k-th of total arrives: spaced evenly round a ring of radius about centre, the ring turned by seed
-- e.g. vec round (waves spawn-point [1, 4, 160x120, 200, 7]) → 275x283
spawn-point : [k total centre radius seed | heading : k / total + (seeded number seed) * 2 * pi, pair [heading cos * radius, heading sin * radius] + centre]
