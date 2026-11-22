-- piles: the cards of a deckbuilder: the stock (the pile you draw from), a hand and a discard pile, kept as
-- [stock, hand, discard]. Draw cards (the discard pile is shuffled back into the stock by seed when it runs out), play
-- them, and put the hand away at the end of a turn. Any values can be cards.

-- a deck shuffled into the stock, with an empty hand and discard pile
-- e.g. piles fresh [["bite", "kick", "hide"], 7] stock length → 3
fresh : [deck seed | [stock : seeded shuffle [deck, seed], hand : [], discard : []]]

-- n cards drawn into the hand, the discard pile shuffled back into the stock when it runs out
-- e.g. piles draw [[stock : ["a", "b"], hand : [], discard : ["c"]], 3, 7] hand length → 3
-- e.g. piles draw [[stock : ["a", "b"], hand : [], discard : ["c"]], 2, 7] hand → [a, b]
draw : [p n seed |
  room : n min (p stock length + (p discard length))
  refill : p stock length < room
  pile : refill [p stock .. (seeded shuffle [p discard, seed])] else [p stock]
  thrown : refill [[]] else [p discard]
  [stock : pile drop room, hand : p hand .. (pile take room), discard : thrown]
]

-- the card at a place in the hand played: out of the hand and onto the discard pile
-- e.g. piles play [[stock : [], hand : ["a", "b"], discard : []], 2] → [stock : [], hand : [a], discard : [b]]
play : [p k | kept : p hand numbered keep [[i, c] | i != k] collect [[i, c] | c], card : p hand @ k, [stock : p stock, hand : kept, discard : p discard .. [card]]]

-- the card at a place in the hand removed for good (it goes to no pile)
-- e.g. piles exhaust [[stock : [], hand : ["a", "b"], discard : []], 1] hand → [b]
exhaust : [p k | p with [hand : p hand numbered keep [[i, c] | i != k] collect [[i, c] | c]]]

-- the whole hand put on the discard pile, at the end of a turn
-- e.g. piles end-turn [stock : [], hand : ["a", "b"], discard : ["c"]] → [stock : [], hand : [], discard : [c, a, b]]
end-turn : [p | held : p hand, [stock : p stock, hand : [], discard : p discard .. held]]

-- every card, whichever pile it is in
-- e.g. piles all-cards [stock : ["a"], hand : ["b"], discard : ["c"]] → [a, b, c]
all-cards : [p | p stock .. (p hand) .. (p discard)]
