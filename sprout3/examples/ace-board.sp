-- ACE board: tap work to close it, and watch the graph work out the rest.
-- Leaves close with one tap. Verified atoms need two: the work, then the witness.
-- Gates and the rollup are never tapped: they close themselves when what they wait on is done.
-- Blocked work can't be closed. Red marks the critical path: the work that sets the finish.

bw : 104
bh : 36

atoms : [
  [id : "basis", name : "design basis", kind : "trivial", requires : [], days : 0, x : 10, y : 56]
  [id : "permit", name : "permit", kind : "verified", requires : [], days : 1, x : 128, y : 56]
  [id : "survey", name : "survey", kind : "leaf", requires : [], days : 2, x : 246, y : 56]
  [id : "rebar", name : "rebar on site", kind : "leaf", requires : [], days : 8, x : 10, y : 126]
  [id : "dig", name : "excavate", kind : "leaf", requires : ["permit", "survey"], days : 4, x : 128, y : 126]
  [id : "reply", name : "engineer reply", kind : "leaf", requires : [], days : 5, x : 246, y : 126]
  [id : "forms", name : "formwork", kind : "leaf", requires : ["dig"], days : 3, x : 10, y : 196]
  [id : "place", name : "place rebar", kind : "leaf", requires : ["dig", "rebar", "rfi"], days : 4, x : 128, y : 196]
  [id : "rfi", name : "RFI: splice", kind : "gate", requires : ["reply"], days : 0, x : 246, y : 196]
  [id : "inspect", name : "inspection", kind : "verified", requires : ["place"], days : 1, x : 128, y : 266]
  [id : "pour", name : "pour", kind : "leaf", requires : ["inspect", "forms"], days : 1, x : 128, y : 336]
]
rollup : [name : "turbine pedestal", contains : ["dig", "forms", "place", "pour"], requires : ["basis"]]
finish-atom : "pour"

start :
  closed : ["permit", "survey"]
  signed : ["permit"]
  msg : "tap a box"

-- lists of ids
has : [xs want | xs keep [x | x = want] length > 0]
without : [xs v | xs keep [x | x != v]]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
find : [want | atoms keep [a | a id = want] first]

-- derive: done is never stored. Close whatever the graph allows until nothing changes.
closes : [a ok closed signed |
  k : a kind
  needs-met : a requires keep [r | has [ok, r] not] length = 0
  k = "trivial" or (needs-met and (k = "gate" or (has [closed, a id] and (k = "leaf" or (has [signed, a id])))))
]
settle : [ok closed signed |
  more : atoms keep [a | has [ok, a id] not and (closes [a, ok, closed, signed])] collect [a | a id]
  more length = 0 [ok] else [settle [ok .. more, closed, signed]]
]

-- days of work left before an atom is finished, through everything it requires
to-go : [want ok |
  a : find want
  own : has [ok, want] [0] else [a days]
  own + (a requires collect [r | to-go [r, ok]] fold [0, [m x | m max x]])
]
-- the critical path: from the end, back through whichever requirement has the most work left
critical : [want ok |
  a : find want
  todo : a requires keep [r | to-go [r, ok] > 0]
  has [ok, want] [[]] else [
    todo length = 0 [[want]] else [
      worst : todo fold ["", [w r | w = "" or (to-go [r, ok] > (to-go [w, ok])) [r] else [w]]]
      critical [worst, ok] .. [want]
    ]
  ]
]

inside : [a i | i touch-x > (a x) and (i touch-x < (a x + bw)) and (i touch-y > (a y)) and (i touch-y < (a y + bh))]
waiting-on : [a ok | a requires keep [r | has [ok, r] not]]

update : [g |
  i : g input
  ok : settle [[], g closed, g signed]
  a : i tapped [atoms keep [b | inside [b, i]] first] else [false]
  hit : a != false
  manual : hit and (a kind = "leaf" or (a kind = "verified"))
  is-closed : manual and (has [g closed, a id])
  is-signed : manual and (has [g signed, a id])
  blocked : manual and (is-closed not) and (waiting-on [a, ok] length > 0)
  act : manual and (blocked not)

  -- what a tap does: leaf open -> closed -> open; verified open -> closed -> signed -> open
  step : act [a kind = "leaf" [is-closed ["reopen"] else ["close"]] else [is-closed not ["close"] else [is-signed not ["sign"] else ["reopen"]]]] else ["none"]
  closed : step = "close" [g closed .. [a id]] else [step = "reopen" [without [g closed, a id]] else [g closed]]
  signed : step = "sign" [g signed .. [a id]] else [step = "reopen" [without [g signed, a id]] else [g signed]]

  blocked
    shake 5
    beep [120, 0.15]
  act
    beep [step = "reopen" [330] else [660], 0.06]

  g with
    closed : closed
    signed : signed
    msg : cond [
      blocked, "[a name] waits on " .. (join (waiting-on [a, ok]))
      step = "close", a kind = "verified" ["[a name] done: now tap again to sign"] else ["closed [a name]"]
      step = "sign", "[a name] signed by the witness"
      step = "reopen", "reopened [a name]"
      hit, "[a name] is a [a kind]: it closes by itself"
      any, g msg
    ]
]

draw : [g |
  ok : settle [[], g closed, g signed]
  path : critical [finish-atom, ok]
  bottom : [a | [x : a x + (bw / 2), y : a y + bh]]
  top : [a | [x : a x + (bw / 2), y : a y]]
  clear "#0b0f0d"

  -- requires: a line from each requirement down to what needs it
  atoms each [a |
    a requires each [r |
      b : find r
      hot : has [path, r] and (has [path, a id])
      line [bottom b x, bottom b y, top a x, top a y, hot ["#ff6b6b"] else [has [ok, r] ["#2f6b3a"] else ["#3a4a40"]]]
    ]
  ]

  -- the atoms
  atoms each [a |
    done : has [ok, a id]
    ready : done not and (waiting-on [a, ok] length = 0)
    edge : done ["#8ef08e"] else [has [path, a id] ["#ff6b6b"] else [ready ["#ffd166"] else ["#3a4a40"]]]
    half : a kind = "verified" and (has [g closed, a id]) and (has [g signed, a id] not)
    rect [a x, a y, bw, bh, edge]
    rect [a x + 2, a y + 2, bw - 4, bh - 4, done ["#14301c"] else [half ["#3a3214"] else ["#101814"]]]
    text [a name, a x + (bw / 2), a y + 14, 12, done ["#c8f5c8"] else ["#d6e2d9"]]
    text [half ["verified: needs a witness"] else [a kind .. " · " .. (a days) .. "d"], a x + (bw / 2), a y + 28, 9, "#7d968a"]
  ]

  -- the rollup: done when all its children are done
  parts : rollup contains keep [c | has [ok, c]] length
  all-in : parts = (rollup contains length) and (has [ok, "basis"])
  rect [10, 400, W - 20, 22, "#22302a"]
  rect [10, 400, W - 20 * parts / (rollup contains length), 22, all-in ["#8ef08e"] else ["#2f6b3a"]]
  text ["[rollup name]  [parts]/[rollup contains length]", W / 2, 411, 12, all-in ["#0b0f0d"] else ["#d6e2d9"]]

  text ["ACE  [ok length]/[atoms length] done  ·  [to-go [finish-atom, ok]]d of work left", W / 2, 22, 14, "#e8f3e9"]
  text ["green done   amber workable   red critical   grey blocked", W / 2, 40, 9, "#7d968a"]
  text [g msg, W / 2, 448, 13, "#ffd166"]
]
