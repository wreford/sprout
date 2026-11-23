-- bag: the symbols a player owns in a slot game whose reels they build. A bag is a list of symbol names; a pull draws
-- a grid from it by seed, each symbol as likely as its share of the bag. Symbols are added, scrapped and gilded; a
-- gilded symbol is its name with "+" after it ("pearl+") and still counts as its kind.

-- a symbol's kind, gilded or not
-- e.g. bag kind "pearl+" → pearl
-- e.g. bag kind "fish" → fish
kind : [symbol | (symbol ends-with "+") [symbol slice [1, -2]] else [symbol]]

-- is a symbol gilded?
-- e.g. bag gilded "pearl+" → true
gilded : [symbol | symbol ends-with "+"]

-- a grid of symbols, size across and down, each drawn from the bag by the seed
-- e.g. bag draw [["a"], 3x2, 7] → [[a, a, a], [a, a, a]]
-- e.g. bag draw [["a", "b", "c"], 4x2, 9] collect [r | r length] → [4, 4]
draw : [owned size seed | range (size y) collect [r | range (size x) collect [c | seeded pick [owned, seed * 97 + (r * 13) + c]]]]

-- the bag with a symbol added
-- e.g. bag add [["a"], "b"] → [a, b]
add : [owned symbol | owned .. [symbol]]

-- the bag with one symbol of a kind taken out, a plain one before a gilded one
-- e.g. bag scrap [["a", "b", "a+"], "a"] → [b, a+]
-- e.g. bag scrap [["b", "a+"], "a"] → [b]
-- e.g. bag scrap [["b"], "a"] → [b]
scrap : [owned name |
  plain-at : owned numbered keep [[i, s] | s = name] collect [[i, s] | i]
  gilt-at : owned numbered keep [[i, s] | s = (name .. "+")] collect [[i, s] | i]
  gone : (plain-at length > 0) [plain-at @ 1] else [(gilt-at length > 0) [gilt-at @ 1] else [0]]
  owned numbered keep [[i, s] | i != gone] collect [[i, s] | s]
]

-- the bag with one plain symbol of a kind gilded
-- e.g. bag gild [["a", "b", "a"], "a"] → [a+, b, a]
-- e.g. bag gild [["a+"], "a"] → [a+]
gild : [owned name |
  plain-at : owned numbered keep [[i, s] | s = name] collect [[i, s] | i]
  chosen : (plain-at length > 0) [plain-at @ 1] else [0]
  owned numbered collect [[i, s] | (i = chosen) [s .. "+"] else [s]]
]

-- how many of each kind the bag holds, gilded ones with their kind
-- e.g. bag counts ["a", "b", "a+"] → [a : 2, b : 1]
counts : [owned | owned collect [s | kind s] frequencies]

-- the share of the bag that is a kind, from 0 to 1
-- e.g. bag odds [["a", "b", "a+", "c"], "a"] → 0.5
-- e.g. bag odds [[], "a"] → 0
odds : [owned name | (owned length = 0) [0] else [owned count [s | kind s = name] / (owned length)]]

-- how many of a kind are gilded
-- e.g. bag gilt-count [["a+", "a", "a+"], "a"] → 2
gilt-count : [owned name | owned count [s | s = (name .. "+")]]
