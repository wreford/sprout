-- economy: the arithmetic of shops, tycoons and incremental games: prices that climb, how many you can afford,
-- earnings while away, wandering markets, and starting over for a bonus. Distilled from the TaskIAP games: 45 of the
-- 319 earn while you wait, 41 have prices and markets, 35 a shop of upgrades.

-- the price of the next one when owned are owned already and each costs growth times the one before (1.15 is usual)
-- e.g. economy price [10, 1.15, 5] round → 20
price : [base growth owned | growth pow owned * base]

-- the price of the next n together
-- e.g. economy price-of-many [10, 1.15, 5, 10] round → 408
price-of-many : [base growth owned n | price [base, growth, owned] * (growth pow n - 1) / (growth - 1)]

-- how many more cash can buy
-- e.g. economy how-many [500, 10, 1.15, 5] → 11
how-many : [cash base growth owned | cash * (growth - 1) / (price [base, growth, owned]) + 1 log / (growth log) floor max 0]

-- what was earned while away: per-second for the seconds gone, but no more than cap-hours of it
-- e.g. economy away [2.5, 1, 7200] → 9000
away : [per-second cap-hours seconds | seconds min (cap-hours * 3600) * per-second]

-- the bonus for starting over, from everything ever earned: a square root, so each one comes slower
-- e.g. economy prestige 4000000 → 2
prestige : [lifetime | lifetime / 1000000 sqrt floor]

-- a market price's next step: wandering by up to swing (0.1 is 10%) and pulled gently back toward fair
-- e.g. economy wander [100, 100, 0.1, 7] round → 108
wander : [now-price fair swing seed |
  step : seeded number seed - 0.5 * 2 * swing
  pull : fair - now-price / fair * 0.05
  now-price * (1 + step + pull) max 0.01
]
