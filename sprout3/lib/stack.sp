-- stack: an app as a stack of cards, after HyperCard: each card a record with a name and its fields, and the stack
-- [cards : [...], at : 1] knows which card is showing. Go to the next or the previous card (round the ends), the first,
-- the last or one by name; find words on any card after this one; put a value into a field of the card showing; and
-- add a card after it. For address books, quizzes, recipes and little databases.

-- the card showing
-- e.g. stack card [cards : [[name : "home"], [name : "map"]], at : 2] name → map
card : [book | book cards @ (book at)]

-- the stack moved to the "next", "previous", "first" or "last" card, or to the card of that name
-- e.g. stack go [[cards : [[name : "a"], [name : "b"]], at : 2], "next"] at → 1
-- e.g. stack go [[cards : [[name : "a"], [name : "b"], [name : "c"]], at : 1], "previous"] at → 3
-- e.g. stack go [[cards : [[name : "a"], [name : "b"], [name : "c"]], at : 1], "c"] at → 3
go : [book where |
  n-cards : book cards length
  here : book at
  named : book cards numbered keep [[i, c] | c name = where] collect [[i, c] | i]
  place : cond [where = "next", here % n-cards + 1, where = "previous", here + n-cards - 2 % n-cards + 1, where = "first", 1, where = "last", n-cards, any, (named length > 0) [named @ 1] else [here]]
  book with [at : place]
]

-- the stack moved to the first card after this one, going round, with the words in any of its fields; where it was if
-- none has them
-- e.g. stack find [[cards : [[name : "a", note : "milk"], [name : "b", note : "eggs and ham"]], at : 1], "ham"] at → 2
find : [book words |
  n-cards : book cards length
  here : book at
  order : range n-cards collect [k | here + k - 1 % n-cards + 1]
  hits : order keep [i | (book cards @ i) keys any [k | ((book cards @ i) get-in [k]) str has words]]
  book with [at : (hits length > 0) [hits @ 1] else [here]]
]

-- the stack with a value put into a field of the card showing
-- e.g. stack card (stack put [[cards : [[name : "a"]], at : 1], "note", "hi"]) note → hi
put : [book field value | book with [cards : book cards numbered collect [[i, c] | (i = (book at)) [c set-in [[field], value]] else [c]]]]

-- the stack with a card added after the one showing, which it then shows
-- e.g. stack add [[cards : [[name : "a"], [name : "c"]], at : 1], [name : "b"]] cards collect [c | c name] → [a, b, c]
add : [book new-card | here : book at, [cards : book cards take here .. [new-card] .. (book cards drop here), at : here + 1]]
