-- ACE crews: two kinds of constraint, one link.
-- A sequence constraint points at an atom: pour requires rebar.
-- A capacity constraint points at a query: any idle crew of the right trade.
-- Each day, every idle crew takes the first ready work of its trade. Tap a crew to send it home,
-- or bring it back, and watch the work that needs it wait. Tap the top to start again.

work : [
  [id : "excavate", trade : "civil", days : 3, requires : []]
  [id : "piles", trade : "civil", days : 4, requires : ["excavate"]]
  [id : "conduit", trade : "elec", days : 3, requires : ["excavate"]]
  [id : "grounding", trade : "elec", days : 2, requires : ["excavate"]]
  [id : "formwork", trade : "civil", days : 3, requires : ["piles"]]
  [id : "rebar", trade : "iron", days : 4, requires : ["piles"]]
  [id : "embeds", trade : "elec", days : 2, requires : ["rebar"]]
  [id : "pour", trade : "civil", days : 1, requires : ["formwork", "rebar", "embeds"]]
  [id : "columns", trade : "iron", days : 5, requires : ["pour"]]
  [id : "cable-tray", trade : "elec", days : 3, requires : ["columns"]]
]
crews-at-start : [
  [id : "civil 1", trade : "civil", on : true]
  [id : "civil 2", trade : "civil", on : true]
  [id : "iron 1", trade : "iron", on : true]
  [id : "elec 1", trade : "elec", on : true]
]
day-length : 0.45          -- seconds per day
colours : [civil : "#c99a5b", iron : "#7aa2d6", elec : "#d9b84a"]

start :
  packages : work collect [w | w with [status : "waiting", crew : "", begun : 0, left : 0, ended : 0]]
  crews : crews-at-start
  day : 0

has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
an : [word | match [word @ 1, ["a", "an ", "e", "an ", "i", "an ", "o", "an ", "u", "an ", any, "a "]] .. word]

-- one day on site
step : [g |
  today : g day + 1
  -- work in hand moves on a day; anything with no days left is done
  worked : g packages collect [p |
    p status = "working" [p with [left : p left - 1]] else [p]
  ]
  finished : worked collect [p |
    p status = "working" and (p left <= 0) [p with [status : "done", ended : today]] else [p]
  ]
  done-ids : finished keep [p | p status = "done"] collect [p | p id]
  -- the capacity constraint: a crew is free when it's on site and holds no work
  busy : finished keep [p | p status = "working"] collect [p | p crew]
  free : g crews keep [c | c on and (has [busy, c id] not)]
  -- each free crew takes the first waiting work of its trade whose requirements are done
  ready : [p | p status = "waiting" and (p requires keep [r | has [done-ids, r] not] length = 0)]
  assigned : free fold [finished, [ps c |
    pick : ps keep [p | ready p and (p trade = (c trade))] first
    pick = false [ps] else [
      ps collect [p | p id = (pick id) [p with [status : "working", crew : c id, begun : today, left : p days]] else [p]]
    ]
  ]]
  g with [packages : assigned, day : today]
]

-- tapping a crew sends it home, or brings it back
chip-x : [n | n - 1 * 86 + 8]
toggle : [g i |
  hit : range (g crews length) keep [n | i touch-x > (chip-x n) and (i touch-x < (chip-x n + 80)) and (i touch-y > 420) and (i touch-y < 460)] first
  hit = false [g] else [
    g with [crews : range (g crews length) collect [n | n = hit [g crews @ n with [on : g crews @ n on not]] else [g crews @ n]]]
  ]
]

update : [g |
  i : g input
  all-done : g packages keep [p | p status != "done"] length = 0
  tapped-top : i tapped and (i touch-y < 50)
  tapped-crew : i tapped and (i touch-y > 410)
  tapped-crew
    beep [520, 0.05]
  cond [
    tapped-top, start
    tapped-crew, toggle [g, i]
    all-done not and (every [day-length, g clock, g dt]), step g
    any, g
  ]
]

px : [d | d * 8 + 100]
row-y : [n | n * 30 + 46]

draw : [g |
  ps : g packages
  done-ids : ps keep [p | p status = "done"] collect [p | p id]
  busy : ps keep [p | p status = "working"] collect [p | p crew]
  trade-on : [t | g crews keep [c | c trade = t and (c on)] length > 0]
  clear "#0e1311"
  text ["ACE crews · day [g day] · [done-ids length] of [ps length] done", W / 2, 20, 13, "#e8f3e9"]

  -- days along the top, and today
  range 8 each [k | text ["[k - 1 * 4]", px (k - 1 * 4), 40, 9, "#5f7a6c"]]
  line [px (g day), 44, px (g day), 360, rgba [255, 209, 102, 0.6]]

  range (ps length) each [n |
    p : ps @ n
    y : row-y n
    text [p id, 48, y + 10, 11, p status = "done" ["#8ef08e"] else ["#d6e2d9"]]
    waiting : p requires keep [r | has [done-ids, r] not]
    p status = "waiting"
      text [waiting length > 0 ["waits on " .. (join waiting)] else [trade-on (p trade) ["waiting for a free " .. (p trade) .. " crew"] else ["needs " .. (an (p trade)) .. " crew"]], 230, y + 10, 9, waiting length > 0 ["#5f7a6c"] else ["#ff9e7a"]]
    p status = "working"
      rect [px (p begun - 1), y + 3, p days - (p left) * 8 + 2, 14, colours (p trade)]
      rect [px (p begun - 1 + (p days - (p left))), y + 3, p left * 8, 14, rgba [255, 255, 255, 0.12]]
    p status = "done"
      rect [px (p begun - 1), y + 3, p days * 8, 14, colours (p trade)]
  ]

  -- the crews: tap one to send it home
  range (g crews length) each [n |
    c : g crews @ n
    job : ps keep [p | p status = "working" and (p crew = (c id))] collect [p | p id]
    rect [chip-x n, 420, 80, 40, c on [colours (c trade)] else ["#2a332e"]]
    rect [chip-x n + 2, 422, 76, 36, "#141b17"]
    text [c id, chip-x n + 40, 433, 11, c on ["#e8f3e9"] else ["#5f7a6c"]]
    text [c on [job length > 0 [job @ 1] else ["idle"]] else ["sent home"], chip-x n + 40, 448, 9, c on ["#a8b8ae"] else ["#5f7a6c"]]
  ]
  text ["tap a crew to send it home · tap the top to start again", W / 2, 472, 9, "#5f7a6c"]
]
