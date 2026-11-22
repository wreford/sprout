-- idle: the arithmetic of incremental and tycoon games: prices that climb, how many you can afford, earnings while
-- away, wandering markets, starting over for a bonus, and numbers too big to read. Distilled from the TaskIAP games:
-- 45 of the 319 earn while you wait, 41 have prices and markets, 35 a shop of upgrades.

-- the price of the next one when owned are owned already and each costs growth times the one before (1.15 is usual)
-- e.g. idle price [10, 1.15, 5] round
price : [base growth owned | growth pow owned * base]

-- the price of the next n together
-- e.g. idle price-of-many [10, 1.15, 5, 10] round
price-of-many : [base growth owned n | price [base, growth, owned] * (growth pow n - 1) / (growth - 1)]

-- how many more cash can buy
-- e.g. idle how-many [500, 10, 1.15, 5]
how-many : [cash base growth owned | cash * (growth - 1) / (price [base, growth, owned]) + 1 log / (growth log) floor max 0]

-- what was earned while away: per-second for the seconds gone, but no more than cap-hours of it
-- e.g. idle away [2.5, 7200, 1]
away : [per-second seconds cap-hours | seconds min (cap-hours * 3600) * per-second]

-- the bonus for starting over, from everything ever earned: a square root, so each one comes slower
-- e.g. idle prestige 4000000
prestige : [lifetime | lifetime / 1000000 sqrt floor]

-- a market price's next step: wandering by up to swing (0.1 is 10%) and pulled gently back toward fair
-- e.g. idle wander [100, 100, 0.1, 7] round
wander : [now-price fair swing seed |
  step : seeded number seed - 0.5 * 2 * swing
  pull : fair - now-price / fair * 0.05
  now-price * (1 + step + pull) max 0.01
]

-- a number short enough to read: 1.2K, 3.4M, 5.6B, 7.8T
-- e.g. idle short 1234567
short : [n |
  steps : [[1000000000000, "T"], [1000000000, "B"], [1000000, "M"], [1000, "K"]]
  big : steps keep [[size, mark] | n abs >= size] @ 1 else false
  (big != false) ["[n / (big @ 1) fixed 1][big @ 2]"] else ["[n round]"]
]
