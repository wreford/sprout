-- ACE risk: the same pedestal job as ace-schedule, run a million times with a risk register.
-- Each run samples every duration and rolls every risk, then walks the graph five times:
-- once with every risk, and once with each risk left out, so we can see what each one costs.
-- spork works one-run out ahead into a single kernel (decision 91), so the million runs take
-- milliseconds, on WebAssembly SIMD or on the GPU (decision 93). Swap spork for collect to compare.

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
runs : 1000000
seed : 7                   -- the same seed always gives the same answer

-- the risk register: what can go wrong, how often in a run, how many days it adds, and to what
risks : [
  [name : "wet weather on the pour", chance : 0.30, delay : 3, hits : "pour"]
  [name : "rebar delivered late", chance : 0.15, delay : 5, hits : "rebar"]
  [name : "slow answer to the RFI", chance : 0.20, delay : 4, hits : "rfi"]
  [name : "inspection fails, rework", chance : 0.10, delay : 3, hits : "inspect"]
]

find : [want ds | ds keep [a | a id = want] first]
-- earliest finish: the latest finish of everything required, plus this atom's own time
finish : [want ds |
  a : find [want, ds]
  (a requires collect [r | finish [r, ds]] fold [0, [m x | m max x]]) + (a days)
]
-- a time from a triangle, given u from 0 up to 1
tri : [t u |
  lo : t @ 1, mode : t @ 2, hi : t @ 3
  hi = lo [lo] else [
    u < (mode - lo / (hi - lo)) [lo + (u * (hi - lo) * (mode - lo) sqrt)] else [hi - (1 - u * (hi - lo) * (hi - mode) sqrt)]
  ]
]

-- one run: the draws come from noise [run, id], so they are the same whichever way the runs are done
one-run : [n |
  base : range (atoms length) collect [k | tri [atoms @ k dur, noise [n, k + (seed * 1000)]]]
  hit : range (risks length) collect [j | noise [n, 900 + j + (seed * 1000)] < (risks @ j chance)]
  -- the finish with every risk that happened, leaving out risk number off (0 leaves none out)
  finish-without : [off |
    ds : range (atoms length) collect [k |
      a : atoms @ k
      extra : range (risks length) fold [0, [t j | (j != off) and (hit @ j) and (risks @ j hits = (a id)) [t + (risks @ j delay)] else [t]]]
      a with [days : base @ k + extra]
    ]
    finish [last-atom, ds]
  ]
  [all : finish-without 0, weather : finish-without 1, rebar : finish-without 2, rfi : finish-without 3, inspection : finish-without 4]
]

results : range runs spork one-run
finishes : results collect [r | r all] sort
pct : [xs p | xs @ (p * runs ceil)]
-- how many runs finish before day d: a binary search in the sorted finishes
below : [d |
  go : [lo hi | lo >= hi [lo] else [
    mid : lo + hi / 2 floor
    finishes @ (mid + 1) < d [go [mid + 1, hi]] else [go [lo, mid]]
  ]]
  go [0, runs]
]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
bar : [n | range n fold ["", [s k | s .. "#"]]]
day : [x | x * 10 round / 10]

"== [runs] runs of the pedestal job ==" print
"P10 day [day (pct [finishes, 0.1])]   P50 day [day (pct [finishes, 0.5])]   P80 day [day (pct [finishes, 0.8])]   P90 day [day (pct [finishes, 0.9])]" print
"" print
first-day : finishes @ 1 floor
last-day : finishes @ runs ceil
range (last-day - first-day / 2 + 1 ceil) each [k |
  from : k - 1 * 2 + first-day
  n : below (from + 2) - (below from)
  share : (n * 100 / runs * 10 round / 10) str .. "%"
  "day [pad [from str, 3]] [pad [share, 6]] [bar (n * 300 / runs ceil)]" print
]
"" print
"chance of finishing by day 26: [below 26 * 100 / runs round]%" print

-- what each risk adds at P80: the P80 with it, take away the P80 without it
"" print
"== what each risk adds to P80 ==" print
p80 : pct [finishes, 0.8]
adds : [xs | p80 - (pct [xs sort, 0.8]) * 10 round / 10]
"[pad [risks @ 1 name, 26]] +[adds (results collect [r | r weather])] days" print
"[pad [risks @ 2 name, 26]] +[adds (results collect [r | r rebar])] days" print
"[pad [risks @ 3 name, 26]] +[adds (results collect [r | r rfi])] days" print
"[pad [risks @ 4 name, 26]] +[adds (results collect [r | r inspection])] days" print
