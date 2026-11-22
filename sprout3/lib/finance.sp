-- finance: money over time: what a loan costs each month and how it's paid off, savings that compound, how long money
-- takes to double, changes in percent, tax, tips and fair shares, break-even points and what an investment is worth.
-- Rates are shares (0.05 is 5% a year); the answers are numbers, ready for format places.

-- the monthly payment that pays off a loan over a number of months
-- e.g. finance payment [200000, 0.06, 360] round → 1199
payment : [principal yearly-rate months |
  r : yearly-rate / 12
  (r = 0) [principal / months] else [principal * r / (1 - (1 + r pow (0 - months)))]
]

-- each month of a loan: the interest, what was paid off and what is still owed
-- e.g. finance schedule [1000, 0.12, 3] collect [row | row owed round] → [670, 337, 0]
schedule : [principal yearly-rate months |
  r : yearly-rate / 12
  instalment : payment [principal, yearly-rate, months]
  range months fold [[owed : principal, rows : []], [s k |
    interest : s owed * r
    still-owed : s owed - (instalment - interest) max 0
    [owed : still-owed, rows : s rows .. [[month : k, interest : interest, paid-off : instalment - interest, owed : still-owed]]]
  ]] rows
]

-- what a sum grows to, compounded times-a-year, after a number of years
-- e.g. finance grow [1000, 0.05, 12, 10] round → 1647
grow : [principal yearly-rate times-a-year years | principal * (yearly-rate / times-a-year + 1 pow (times-a-year * years))]

-- what saving the same each month comes to after a number of months
-- e.g. finance saved [100, 0.06, 120] round → 16388
saved : [monthly yearly-rate months | r : yearly-rate / 12, (r = 0) [monthly * months] else [monthly * (1 + r pow months - 1) / r]]

-- how many years money takes to double at a yearly rate
-- e.g. finance doubling 0.07 * 10 round / 10 → 10.2
doubling : [yearly-rate | 2 log / (1 + yearly-rate log)]

-- the change from old to new, as a share of old
-- e.g. finance change [80, 100] → 0.25
change : [old new | new - old / old]

-- an amount with tax added
-- e.g. finance with-tax [100, 0.1] → 110
with-tax : [amount rate | amount * (1 + rate)]

-- an amount with tax taken out
-- e.g. finance before-tax [110, 0.1] → 100
before-tax : [amount rate | amount / (1 + rate)]

-- what each person pays of a bill with a tip
-- e.g. finance tip [84, 0.15, 3] → 32.2
tip : [bill share people | bill * (1 + share) / people]

-- a total shared fairly to the cent, the odd cents going to the first shares
-- e.g. finance split [100, 3] → [33.34, 33.33, 33.33]
split : [total people |
  cents : total * 100 round
  base : cents / people floor
  extra : cents - (base * people)
  range people collect [k | (k <= extra) [base + 1] else [base] / 100]
]

-- what an amount some years away is worth now
-- e.g. finance present [1000, 0.05, 10] round → 614
present : [amount yearly-rate years | amount / (1 + yearly-rate pow years)]

-- how many must be sold to cover fixed costs, at a price, when each costs something to make
-- e.g. finance break-even [5000, 25, 15] → 500
break-even : [fixed price cost | fixed / (price - cost) ceil]

-- the share of a price that is profit
-- e.g. finance margin [25, 15] → 0.4
margin : [price cost | price - cost / price]

-- what a run of yearly amounts (the first one now) is worth now (net present value)
-- e.g. finance npv [[-1000, 500, 500, 500], 0.1] round → 243
npv : [flows rate | flows numbered collect [[t, f] | f / (1 + rate pow (t - 1))] sum]

-- the yearly rate at which a run of amounts is worth nothing now (internal rate of return)
-- e.g. finance irr [-1000, 500, 500, 500] * 1000 round / 1000 → 0.234
irr : [flows |
  found : range 100 fold [-0.99x10, [b k | mid : b x + (b y) / 2, (npv [flows, mid] > 0) [pair [mid, b y]] else [pair [b x, mid]]]]
  found x + (found y) / 2
]
