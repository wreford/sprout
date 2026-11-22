-- wordplay: guessing games and letters: the marks a guess earns, anagrams, scrambles and hidden words. Distilled from
-- the TaskIAP word games (DECAWORDLE among them): 25 of the 319 have you guess words.

-- the marks a guess earns against the answer, letter by letter: G in the right place, Y in the word but elsewhere,
-- - not in it. Letters are counted, so two Es guessed against one E mark only one of them
-- e.g. wordplay marks ["SPEED", "ABIDE"] → --Y-Y
marks : [guess answer |
  g : guess upper chars
  a : answer upper chars
  exact : g zip a collect [[x, y] | x = y]
  pool : a zip exact keep [[ch, hit] | hit not] collect [[ch, hit] | ch]
  g numbered collect [[i, ch] |
    so-far : g take i zip (exact take i) count [[c, hit] | (c = ch) and (hit not)]
    cond [exact @ i, "G", so-far <= (pool count [c | c = ch]), "Y", any, "-"]
  ] join ""
]

-- are two words made of the same letters?
-- e.g. wordplay anagram ["listen", "silent"] → true
anagram : [a b | a lower chars sort = (b lower chars sort)]

-- a word with its letters mixed up by seed (and not left as it was, if another try can help it)
-- e.g. wordplay scramble ["planet", 7] → lnaetp
scramble : [word seed |
  mixed : seeded shuffle [word chars, seed] join ""
  (mixed = word) and (word length > 1) [seeded shuffle [word chars, seed + 1] join ""] else [mixed]
]

-- a word with the letters not yet guessed hidden
-- e.g. wordplay hide ["planet", "aep"] → p_a_e_
hide : [word guessed | word chars collect [ch | (guessed lower chars has (ch lower)) [ch] else ["_"]] join ""]

-- has every letter of the word been guessed?
-- e.g. wordplay solved ["planet", "planetx"] → true
solved : [word guessed | word lower chars all [ch | guessed lower chars has ch]]

-- how many vowels a word has
-- e.g. wordplay vowels "sprout" → 2
vowels : [word | word lower chars count [ch | "aeiou" chars has ch]]
