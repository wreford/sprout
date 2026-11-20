-- ACE board: tap work to close it, and watch the graph work out the rest.
-- Leaves close with one tap. Verified atoms need two: the work, then the witness.
-- Gates and the rollup are never tapped: they close themselves when what they wait on is done.
-- Blocked work can't be closed. Red marks the critical path: the work that sets the finish.
-- The inspection needs a narrative too, and the narrative is structure: if it finds a problem,
-- new atoms join the graph and the pour waits for them.

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
  [id : "inspect", name : "inspection", kind : "verified", story : true, requires : ["place"], days : 1, x : 128, y : 266]
  [id : "pour", name : "pour", kind : "leaf", requires : ["inspect", "forms"], days : 1, x : 128, y : 336]
]
rollup : [name : "turbine pedestal", contains : ["dig", "forms", "place", "pour"], requires : ["basis"]]
finish-atom : "pour"

-- what the inspection can find, as typed outcomes, and the atoms each one adds
outcomes : ["nominal", "rework", "NCR"]
found : [story |
  match [story, [
    "rework", [[id : "rework", name : "rework splices", kind : "leaf", requires : ["inspect"], days : 2, x : 246, y : 266]]
    "NCR", [[id : "dispo", name : "engineer disposition", kind : "leaf", requires : ["inspect"], days : 3, x : 10, y : 266], [id : "ncr", name : "NCR closed", kind : "gate", requires : ["dispo"], days : 0, x : 10, y : 336]]
    any, []
  ]]
]
-- the graph for a given story: the pour also waits for whatever the inspection added
grown : [story |
  extra : found story
  adds : extra keep [e | e id = "rework" or (e id = "ncr")] collect [e | e id]
  atoms collect [a | a id = "pour" [a with [requires : a requires .. adds]] else [a]] .. extra
]

start :
  closed : ["permit", "survey"]
  signed : ["permit"]
  story : ""
  msg : "tap a box"

-- lists of ids
has : [xs want | xs keep [x | x = want] length > 0]
without : [xs v | xs keep [x | x != v]]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
find : [want graph | graph keep [a | a id = want] first]

-- derive: done is never stored. Close whatever the graph allows until nothing changes.
closes : [a ok g |
  k : a kind
  needs-met : a requires keep [r | has [ok, r] not] length = 0
  told : (a story else false) not or (g story != "")
  k = "trivial" or (needs-met and (k = "gate" or (has [g closed, a id] and told and (k = "leaf" or (has [g signed, a id])))))
]
settle : [graph ok g |
  more : graph keep [a | has [ok, a id] not and (closes [a, ok, g])] collect [a | a id]
  more length = 0 [ok] else [settle [graph, ok .. more, g]]
]

-- days of work left before an atom is finished, through everything it requires
to-go : [want ok graph |
  a : find [want, graph]
  own : has [ok, want] [0] else [a days]
  own + (a requires collect [r | to-go [r, ok, graph]] fold [0, [m x | m max x]])
]
-- the critical path: from the end, back through whichever requirement has the most work left
critical : [want ok graph |
  a : find [want, graph]
  todo : a requires keep [r | to-go [r, ok, graph] > 0]
  has [ok, want] [[]] else [
    todo length = 0 [[want]] else [
      worst : todo fold ["", [w r | w = "" or (to-go [r, ok, graph] > (to-go [w, ok, graph])) [r] else [w]]]
      critical [worst, ok, graph] .. [want]
    ]
  ]
]

inside : [a i | i touch-x > (a x) and (i touch-x < (a x + bw)) and (i touch-y > (a y)) and (i touch-y < (a y + bh))]
waiting-on : [a ok | a requires keep [r | has [ok, r] not]]
-- the outcome buttons, shown while the signed inspection waits for its write-up
button-x : [n | n - 1 * 115 + 10]
awaiting : [g | has [g closed, "inspect"] and (has [g signed, "inspect"]) and (g story = "")]

update : [g |
  i : g input
  graph : grown (g story)
  ok : settle [graph, [], g]
  choosing : awaiting g
  pick : choosing and (i tapped) and (i touch-y > 430) [range 3 keep [n | i touch-x > (button-x n) and (i touch-x < (button-x n + 105))] first] else [false]
  told : pick != false
  a : i tapped and (told not) [graph keep [b | inside [b, i]] first] else [false]
  hit : a != false
  manual : hit and (a kind = "leaf" or (a kind = "verified"))
  is-closed : manual and (has [g closed, a id])
  is-signed : manual and (has [g signed, a id])
  blocked : manual and (is-closed not) and (waiting-on [a, ok] length > 0)
  needs-story : manual and is-signed and ((a story else false) and (g story = ""))
  act : manual and (blocked not) and (needs-story not)

  -- what a tap does: leaf open -> closed -> open; verified open -> closed -> signed -> (written up) -> open
  step : act [a kind = "leaf" [is-closed ["reopen"] else ["close"]] else [is-closed not ["close"] else [is-signed not ["sign"] else ["reopen"]]]] else ["none"]
  closed : step = "close" [g closed .. [a id]] else [step = "reopen" [without [g closed, a id]] else [g closed]]
  signed : step = "sign" [g signed .. [a id]] else [step = "reopen" [without [g signed, a id]] else [g signed]]
  outcome : told [outcomes @ pick] else [step = "reopen" and (a story else false) [""] else [g story]]

  blocked
    shake 5
    beep [120, 0.15]
  act or told
    beep [step = "reopen" [330] else [660], 0.06]

  g with
    closed : closed
    signed : signed
    msg : cond [
      told and (outcome = "nominal"), "inspection written up: nominal"
      told, "inspection found " .. outcome .. ": new work joins the graph"
      blocked, "[a name] waits on " .. (join (waiting-on [a, ok]))
      needs-story, "write up the inspection first: choose below"
      step = "close", a kind = "verified" ["[a name] done: now tap again to sign"] else ["closed [a name]"]
      step = "sign", (a story else false) ["[a name] signed: now write it up"] else ["[a name] signed by the witness"]
      step = "reopen", "reopened [a name]"
      hit, "[a name] is a [a kind]: it closes by itself"
      any, g msg
    ]
    story : outcome
]

draw : [g |
  graph : grown (g story)
  ok : settle [graph, [], g]
  path : critical [finish-atom, ok, graph]
  bottom : [a | [x : a x + (bw / 2), y : a y + bh]]
  top : [a | [x : a x + (bw / 2), y : a y]]
  clear "#0b0f0d"

  -- requires: a line from each requirement to what needs it
  graph each [a |
    a requires each [r |
      b : find [r, graph]
      hot : has [path, r] and (has [path, a id])
      line [bottom b x, bottom b y, top a x, top a y, hot ["#ff6b6b"] else [has [ok, r] ["#2f6b3a"] else ["#3a4a40"]]]
    ]
  ]

  -- the atoms
  graph each [a |
    done : has [ok, a id]
    ready : done not and (waiting-on [a, ok] length = 0)
    edge : done ["#8ef08e"] else [has [path, a id] ["#ff6b6b"] else [ready ["#ffd166"] else ["#3a4a40"]]]
    half : a kind = "verified" and (has [g closed, a id]) and (done not)
    note : cond [
      half and (has [g signed, a id] not), "verified: needs a witness"
      half, "needs a write-up"
      (a story else false) and (g story != ""), "written up: " .. (g story)
      any, a kind .. " · " .. (a days) .. "d"
    ]
    rect [a x, a y, bw, bh, edge]
    rect [a x + 2, a y + 2, bw - 4, bh - 4, done ["#14301c"] else [half ["#3a3214"] else ["#101814"]]]
    text [a name, a x + (bw / 2), a y + 14, 11, done ["#c8f5c8"] else ["#d6e2d9"]]
    text [note, a x + (bw / 2), a y + 28, 9, "#7d968a"]
  ]

  -- the rollup: done when all its children are done
  parts : rollup contains keep [c | has [ok, c]] length
  all-in : parts = (rollup contains length) and (has [ok, "basis"])
  rect [10, 396, W - 20, 22, "#22302a"]
  rect [10, 396, W - 20 * parts / (rollup contains length), 22, all-in ["#8ef08e"] else ["#2f6b3a"]]
  text ["[rollup name]  [parts]/[rollup contains length]", W / 2, 407, 12, all-in ["#0b0f0d"] else ["#d6e2d9"]]

  text ["ACE  [ok length]/[graph length] done  ·  [to-go [finish-atom, ok, graph]]d of work left", W / 2, 22, 14, "#e8f3e9"]
  text ["green done   amber workable   red critical   grey blocked", W / 2, 40, 9, "#7d968a"]

  -- while the inspection waits for its write-up, the typed outcomes are buttons
  awaiting g
    range 3 each [n |
      rect [button-x n, 432, 105, 28, "#ffd166"]
      rect [button-x n + 2, 434, 101, 24, "#2a2410"]
      text [outcomes @ n, button-x n + 52, 446, 12, "#ffd166"]
    ]
    text ["what did the inspection find?", W / 2, 470, 11, "#c8b98a"]
  awaiting g not
    text [g msg, W / 2, 448, 13, "#ffd166"]
]
