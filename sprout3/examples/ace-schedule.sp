-- ACE schedule: the critical path is a walk over requires, and the plan is a distribution, not a date.
-- Each piece of work has a duration triple in days: [fastest, likely, slowest].

atoms : [
  [id : "permit", requires : [], dur : [0, 0, 0]]
  [id : "survey", requires : [], dur : [1, 2, 3]]
  [id : "dig", requires : ["permit", "survey"], dur : [3, 4, 7]]
  [id : "rebar", requires : [], dur : [5, 8, 15]]
  [id : "rfi", requires : [], dur : [2, 5, 12]]
  [id : "formwork", requires : ["dig"], dur : [2, 3, 5]]
  [id : "place-rebar", requires : ["dig", "rebar", "rfi"], dur : [3, 4, 6]]
  [id : "inspect", requires : ["place-rebar"], dur : [1, 1, 2]]
  [id : "pour", requires : ["inspect", "formwork"], dur : [1, 1, 2]]
  [id : "cure", requires : ["pour"], dur : [7, 7, 10]]
]
last-atom : "cure"
runs : 400
seed : 1                   -- change it for a different set of runs; the same seed always gives the same answer

-- one shared risk, rolled once per run: wet weather delays the pour by 3 days, 3 times in 10
risk : [chance : 0.3, delay : 3, hits : "pour"]

find : [want ds | ds keep [a | a id = want] first]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
bar : [n | range n fold ["", [s k | s .. "#"]]]

-- earliest finish: the latest finish of everything required, plus this atom's own time
finish : [want ds |
  a : find [want, ds]
  (a requires collect [r | finish [r, ds]] fold [0, [m x | m max x]]) + (a days)
]
-- the critical path: walk back from the end, always through the requirement that finishes last
path : [want ds |
  a : find [want, ds]
  a requires length = 0 [[want]] else [
    worst : a requires fold ["", [w r | w = "" or (finish [r, ds] > (finish [w, ds])) [r] else [w]]]
    path [worst, ds] .. [want]
  ]
]

-- the plan on likely durations
likely : atoms collect [a | a with [days : a dur @ 2]]
critical : path [last-atom, likely]
"== critical path (likely durations) ==" print
likely each [a |
  on : critical keep [c | c = (a id)] length > 0 ["*"] else [" "]
  start : finish [a id, likely] - (a days)
  "[on] [pad [a id, 12]] day [pad [start str, 3]] to [pad [finish [a id, likely] str, 3]]" print
]
"finish on day [finish [last-atom, likely]], through " .. (critical fold ["", [s x | s = "" [x] else [s .. " > " .. x]]]) print

-- a time from a triangle, given u from 0 up to 1: most often near likely, never outside fastest..slowest
tri : [t u |
  lo : t @ 1, mode : t @ 2, hi : t @ 3
  hi = lo [lo] else [
    u < (mode - lo / (hi - lo)) [lo + (u * (hi - lo) * (mode - lo) sqrt)] else [hi - (1 - u * (hi - lo) * (hi - mode) sqrt)]
  ]
]
-- one run: sample every duration, roll the shared risk once, walk the graph
-- the draws come from noise [run, atom], not random, so the same seed gives the same histogram every time
one-run : [n |
  sampled : range (atoms length) collect [k | atoms @ k with [days : tri [atoms @ k dur, noise [n, k + (seed * 1000)]]]]
  wet : noise [n, seed * 1000 + 999] < (risk chance)
  ds : wet [sampled collect [a | a id = (risk hits) [a with [days : a days + (risk delay)]] else [a]]] else [sampled]
  finish [last-atom, ds]
]

sort : [xs |
  xs length < 2 [xs] else [
    p : xs @ 1
    rest : range (xs length - 1) collect [k | xs @ (k + 1)]
    sort (rest keep [v | v < p]) .. [p] .. (sort (rest keep [v | v >= p]))
  ]
]
finishes : sort (range runs collect one-run)
pct : [p | finishes @ (p * runs ceil)]

"" print
"== monte carlo, [runs] runs ==" print
"P10 day [pct 0.1 round]   P50 day [pct 0.5 round]   P80 day [pct 0.8 round]   P90 day [pct 0.9 round]" print
first-day : finishes @ 1 floor
last-day : finishes @ runs ceil
range (last-day - first-day / 2 + 1 ceil) each [k |
  from : k - 1 * 2 + first-day
  n : finishes keep [f | f >= from and (f < (from + 2))] length
  "day [pad [from str, 3]] [pad [n str, 4]] [bar (n / 4 ceil)]" print
]
"chance of finishing by day [finish [last-atom, likely]]: " .. (finishes keep [f | f <= (finish [last-atom, likely])] length * 100 / runs round) .. "%" print

-- ---------------------------------------------------------------------------------------------
-- Cost is a view, not a property: crews times rates times time, plus materials and equipment.

rate : 950                 -- dollars per person per day
indirect-share : 0.15      -- site overheads, as a share of labour
costs : [
  [id : "permit", crew : 0, materials : 0, equipment : 0]
  [id : "survey", crew : 2, materials : 0, equipment : 0]
  [id : "dig", crew : 3, materials : 0, equipment : 9000]
  [id : "rebar", crew : 0, materials : 38000, equipment : 0]
  [id : "rfi", crew : 0, materials : 0, equipment : 0]
  [id : "formwork", crew : 4, materials : 6500, equipment : 0]
  [id : "place-rebar", crew : 5, materials : 0, equipment : 2500]
  [id : "inspect", crew : 1, materials : 0, equipment : 0]
  [id : "pour", crew : 6, materials : 21000, equipment : 4000]
  [id : "cure", crew : 1, materials : 800, equipment : 0]
]

-- where the work actually stands on the status day, and what has been spent
status-day : 10
progress : [["permit", 1], ["survey", 1], ["dig", 1], ["rebar", 1], ["rfi", 1], ["formwork", 0.5], ["place-rebar", 0.25]]
actual-cost : 84000

sum : [xs | xs fold [0, [t x | t + x]]]
pad3 : [n | n < 10 ["00" .. n] else [n < 100 ["0" .. n] else [n str]]]
commas : [n | n < 1000 [n str] else [commas (n / 1000 floor) .. "," .. (pad3 (n % 1000))]]
money : [n | "$" .. (commas (n round))]
two : [r | r * 100 round / 100]

ids : atoms collect [a | a id]
cost-of : [want | costs keep [c | c id = want] first]
labour-of : [want | c : cost-of want, c crew * ((find [want, likely]) days) * rate]
budget-of : [want | c : cost-of want, labour-of want * (1 + indirect-share) + (c materials) + (c equipment)]

labour : sum (ids collect labour-of)
budget : sum (ids collect budget-of)
"" print
"== cost, worked out from the plan ==" print
"labour     [pad [money labour, 10]] crews x days x [money rate]" print
"indirect   [pad [money (labour * indirect-share), 10]] [indirect-share * 100]% of labour" print
"materials  " .. (money (sum (costs collect [c | c materials]))) print
"equipment  " .. (money (sum (costs collect [c | c equipment]))) print
"budget     " .. (money budget) print

-- planned value: how much of each atom's budget the likely plan says is earned by day d
planned-share : [want d |
  ef : finish [want, likely]
  es : ef - ((find [want, likely]) days)
  ef = es [d >= ef [1] else [0]] else [d - es / (ef - es) max 0 min 1]
]
planned-by : [d | sum (ids collect [x | planned-share [x, d] * (budget-of x)])]
pv : planned-by status-day
ev : sum (progress collect [p | p @ 2 * (budget-of (p @ 1))])
spi : ev / pv
cpi : ev / actual-cost

"" print
"== earned value on day [status-day] ==" print
"planned    [pad [money pv, 10]] what the likely plan has done by now" print
"earned     [pad [money ev, 10]] the budget of the work that is actually done" print
"actual     [pad [money actual-cost, 10]] what has been spent" print
"SPI [two spi]  " .. (spi < 1 ["behind schedule"] else ["on or ahead of schedule"]) print
"CPI [two cpi]  " .. (cpi < 1 ["over budget"] else ["on or under budget"]) print
"forecast at completion  " .. (money (budget / cpi)) .. "  (budget / CPI)" print

"" print
"== planned value over time, and where we are ==" print
range 12 each [k |
  d : k - 1 * 2
  share : planned-by d / budget
  here : d = status-day ["  < earned " .. (ev / budget * 100 round) .. "%"] else [""]
  pct : (share * 100 round) .. "%"
  "day [pad [d str, 3]] [pad [pct, 5]] [bar (share * 30 round)][here]" print
]
