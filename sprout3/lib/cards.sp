-- cards: a deck of playing cards, shuffled with a seed, dealt and scored. A card is [rank : 1 to 13, suit : "♠"],
-- an ace being 1 and a king 13. Distilled from the TaskIAP games: 96 of the 319 deal cards of some kind.

-- the four suits
-- e.g. cards suits → [♠, ♥, ♦, ♣]
suits : ["♠", "♥", "♦", "♣"]

-- the 52 cards, in order
-- e.g. cards deck length → 52
deck : suits collect-flat [s | range 13 collect [r | [rank : r, suit : s]]]

-- the 52 cards in an order set by seed (the same seed, the same order)
-- e.g. cards shuffled 7 take 2 → [[rank : 13, suit : ♦], [rank : 10, suit : ♠]]
shuffled : [seed | seeded shuffle [deck, seed]]

-- the first n cards dealt off a pile, and the pile that's left: [hand, pile]
-- e.g. cards deal [cards deck, 2] hand → [[rank : 1, suit : ♠], [rank : 2, suit : ♠]]
deal : [cards-in n | [hand : cards-in take n, pile : cards-in drop n]]

-- the ranks as they're written, ace to king
-- e.g. cards faces @ 12 → Q
faces : ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

-- how a card is written: A♠, 10♥, Q♦
-- e.g. cards name [rank : 12, suit : "♥"] → Q♥
name : [card | face : faces @ (card rank), "[face][card suit]"]

-- is the card red?
-- e.g. cards red [rank : 1, suit : "♦"] → true
red : [card | (card suit = "♥") or (card suit = "♦")]

-- a blackjack hand's best total: an ace counts 11 unless that would go over 21
-- e.g. cards blackjack [[rank : 1, suit : "♠"], [rank : 13, suit : "♥"]] → 21
blackjack : [hand |
  hard : hand collect [c | c rank min 10] sum
  aces : hand count [c | c rank = 1]
  (aces > 0) and (hard + 10 <= 21) [hard + 10] else [hard]
]

-- the poker hand five cards make, by name
-- e.g. cards poker [[rank : 3, suit : "♠"], [rank : 3, suit : "♥"], [rank : 9, suit : "♦"], [rank : 9, suit : "♣"], [rank : 9, suit : "♠"]] → full house
poker : [hand |
  counts : hand collect [c | c rank] frequencies values sort reverse
  ranks : hand collect [c | c rank] sort
  flush : hand all [c | c suit = (hand @ 1 suit)]
  run : (ranks distinct length = 5) and ((ranks last - (ranks first) = 4) or (ranks = [1, 10, 11, 12, 13]))
  cond [
    run and flush, "straight flush"
    counts @ 1 = 4, "four of a kind"
    counts = [3, 2], "full house"
    flush, "flush"
    run, "straight"
    counts @ 1 = 3, "three of a kind"
    counts = [2, 2, 1], "two pair"
    counts @ 1 = 2, "pair"
    any, "high card"
  ]
]
