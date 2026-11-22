-- league: seasons of games between teams: who plays whom, the table, ratings and the chance of winning. Distilled from
-- the TaskIAP games: 48 of the 319 run a league or a schedule, 24 rate their players.

-- every team meets every other once, in rounds where each plays once (the circle method); with an odd number, one rests
-- e.g. league rounds ["A", "B", "C", "D"] → [[[A, D], [B, C]], [[A, B], [C, D]], [[A, C], [D, B]]]
rounds : [teams |
  all-in : (teams length % 2 = 0) [teams] else [teams .. [false]]
  n : all-in length
  others : all-in drop 1
  range (n - 1) collect [r |
    order : [all-in @ 1] .. (others drop (r - 1)) .. (others take (r - 1))
    range (n / 2) collect [i | [order @ i, order @ (n + 1 - i)]] keep [[a, b] | (a != false) and (b != false)]
  ]
]

-- the table from results, each [home, away, home goals, away goals]: 3 points a win and 1 a draw, best first
-- e.g. league table [["A", "B", 2, 1], ["B", "C", 0, 0], ["C", "A", 1, 3]] @ 1 → [team : A, played : 2, won : 2, drawn : 0, lost : 0, points : 6, difference : 3]
table : [results |
  teams : results collect-flat [[home, away, hg, ag] | [home, away]] distinct
  rows : teams collect [t |
    games : results keep [[home, away, hg, ag] | (home = t) or (away = t)] collect [[home, away, hg, ag] | (home = t) [[hg, ag]] else [[ag, hg]]]
    won : games count [[f, g] | f > g]
    drawn : games count [[f, g] | f = g]
    [team : t, played : games length, won : won, drawn : drawn, lost : games length - won - drawn, points : won * 3 + drawn, difference : games collect [[f, g] | f - g] sum]
  ]
  rows sort-by [row | 0 - (row points * 1000 + (row difference))]
]

-- the chance that a side rated a beats one rated b (400 points apart is ten to one)
-- e.g. league chance [1600, 1400] → 0.7597469266
chance : [a b | 1 / (10 pow (b - a / 400) + 1)]

-- both ratings after a game a scored result in (1 a win, 0.5 a draw, 0 a loss), moving by up to k
-- e.g. league rate [1600, 1400, 0, 32] collect [r | r round] → [1576, 1424]
rate : [a b result k | shift : result - (chance [a, b]) * k, [a + shift, b - shift]]

-- a knockout's first round for n seeds (a power of two): best against worst, the top two kept apart till the final
-- e.g. league bracket 8 → [[1, 8], [4, 5], [2, 7], [3, 6]]
bracket : [n |
  grow : [order | (order length >= n) [order] else [grow (order collect-flat [s | [s, order length * 2 + 1 - s]])]]
  grow [1] chunks 2
]
