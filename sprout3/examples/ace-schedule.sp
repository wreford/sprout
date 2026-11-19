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

-- a random time from a triangle: most often near likely, never outside fastest..slowest
tri : [t |
  lo : t @ 1, mode : t @ 2, hi : t @ 3
  u : random
  hi = lo [lo] else [
    u < (mode - lo / (hi - lo)) [lo + (u * (hi - lo) * (mode - lo) sqrt)] else [hi - (1 - u * (hi - lo) * (hi - mode) sqrt)]
  ]
]
-- one run: sample every duration, roll the shared risk once, walk the graph
one-run : [n |
  sampled : atoms collect [a | a with [days : tri (a dur)]]
  wet : random < (risk chance)
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
