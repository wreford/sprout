-- shop: the shop between the rounds of a roguelike. Offers are drawn from a pool by rarity with a seed, none twice;
-- prices grow with depth, rerolls cost more each time, things sell back for half, and coins held earn interest. An
-- offer is a record with a rarity: "common", "uncommon", "rare" or "legendary".

-- how often a rarity comes up against the others
-- e.g. shop weight "rare" → 10
-- e.g. shop weight "junk" → 0
weight : [rarity | match [rarity, ["common", 60, "uncommon", 28, "rare", 10, "legendary", 2, any, 0]]]

-- one offer from a pool, drawn by its rarity's weight from the seed
-- e.g. shop draw [[[name : "a", rarity : "legendary"]], 4] name → a
draw : [pool seed | seeded weighted [pool, pool collect [o | weight (o rarity)], seed]]

-- some offers from a pool, none twice, each drawn by its rarity's weight from the seed
-- e.g. shop offers [[[name : "a", rarity : "common"], [name : "b", rarity : "rare"]], 2, 5] length → 2
-- e.g. shop offers [[[name : "a", rarity : "common"]], 3, 5] length → 1
-- e.g. shop offers [[[name : "a", rarity : "common"], [name : "b", rarity : "common"]], 2, 5] collect [o | o name] sort → [a, b]
offers : [pool many seed |
  pick-from : [rest-pool n s found |
    (n <= 0) or (rest-pool length = 0) [found] else [
      chosen : draw [rest-pool, s]
      pick-from [rest-pool keep [o | o != chosen], n - 1, s * 7 + 3, found .. [chosen]]
    ]
  ]
  pick-from [pool, many, seed, []]
]

-- a price grown with depth: the base cost and a share more for each level down, rounded
-- e.g. shop price [10, 5, 0.1] → 15
price : [cost level rate | cost * (1 + (level * rate)) round]

-- what the next reroll costs: the base, and step more for each reroll already bought
-- e.g. shop reroll [3, 2, 2] → 7
reroll : [base rolls step | base + (rolls * step)]

-- what a thing bought for a price sells back for: half, rounded down
-- e.g. shop sell 25 → 12
sell : [cost | cost / 2 floor]

-- interest on coins held: one for each so many, up to a cap
-- e.g. shop interest [47, 10, 5] → 4
-- e.g. shop interest [470, 10, 5] → 5
interest : [coins per cap | coins / per floor min cap max 0]

-- the rarer of two rarities
-- e.g. shop rarer ["common", "rare"] → rare
rarer : [a b | (weight a < (weight b)) [a] else [b]]
