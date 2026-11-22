-- fuzzy: finding what someone meant from what they typed. A search matches a name when its letters appear in the
-- name in order; matches score higher for letters side by side and at the starts of words, as a command palette or a
-- file finder ranks them. And the closest spelling, for "did you mean?".

-- how well a search matches a name: 0 when its letters don't all appear in order, more for runs and word starts
-- e.g. fuzzy score ["sprt", "sprout"] → 11
-- e.g. fuzzy score ["xyz", "sprout"] → 0
score : [search name |
  q : search lower chars
  n : name lower chars
  done : n numbered fold [[at : 1, prev : -5, total : 0], [s [i, ch] |
    (s at <= (q length)) and (q @ (s at) = ch) [
      starts : (i = 1) or (" -_./" chars has (n @ (i - 1)))
      bonus : ((i = (s prev + 1)) [2] else [0]) + (starts [3] else [0])
      [at : s at + 1, prev : i, total : s total + 1 + bonus]
    ] else [s]
  ]]
  cond [q length = 0, 1, done at > (q length), done total, any, 0]
]

-- the names a search matches, best first
-- e.g. fuzzy best [["sprout", "spirit", "sport", "parrot"], "sprt"] → [sprout, sport, spirit]
best : [names search | names keep [n | score [search, n] > 0] sort-by [n | 0 - (score [search, n])]]

-- the names a search matches, in their own order
-- e.g. fuzzy matches [["sprout", "spirit", "sport", "parrot"], "pr"] → [sprout, spirit, sport, parrot]
matches : [names search | names keep [n | score [search, n] > 0]]

-- where in a name the letters of a search were found
-- e.g. fuzzy marks ["sprt", "sprout"] → [1, 2, 3, 6]
marks : [search name |
  q : search lower chars
  found : name lower chars numbered fold [[at : 1, spots : []], [s [i, ch] | (s at <= (q length)) and (q @ (s at) = ch) [[at : s at + 1, spots : s spots .. [i]]] else [s]]]
  (found at > (q length)) [found spots] else [[]]
]

-- a name with the letters a search matched in brackets, to show why it matched
-- e.g. fuzzy highlight ["sprt", "sprout"] → [spr]ou[t]
highlight : [search name |
  spots : marks [search, name]
  name chars numbered collect [[i, ch] |
    hit : spots has i
    (hit and ((spots has (i - 1)) not) ["\["] else [""]) .. ch .. (hit and ((spots has (i + 1)) not) ["]"] else [""])
  ] join ""
]

-- the name closest in spelling to a word, for "did you mean?", or false when none is within two changes
-- e.g. fuzzy closest [["apple", "banana", "cherry"], "bananna"] → banana
-- e.g. fuzzy closest [["apple", "banana", "cherry"], "kiwi"] → false
closest : [names word |
  nearest-name : names smallest-by [n | prose distance [n lower, word lower]]
  (prose distance [nearest-name lower, word lower] <= 2) [nearest-name] else [false]
]
