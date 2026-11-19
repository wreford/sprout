-- ACE: the Atomic Constraint Engine, in Sprout. One primitive: the atom.
-- An atom has an id, a name, a kind and two links: requires (what must finish first)
-- and contains (its children). Done is never stored. It is derived from the graph.
--
-- Five kinds, by who says an atom is done:
--   trivial   born done: a fact other atoms can rely on
--   leaf      a person closes it
--   verified  closed AND signed by a witness: two locks
--   gate      done when everything it requires is done (RFIs, constraints)
--   rollup    done when all its children are done (areas, work packages)

atoms : [
  [id : "basis", name : "Design basis issued", kind : "trivial", requires : [], contains : []]
  [id : "permit", name : "Excavation permit", kind : "verified", closed : true, signed : true, requires : [], contains : []]
  [id : "survey", name : "Survey and layout", kind : "leaf", closed : true, requires : [], contains : []]
  [id : "dig", name : "Excavate pedestal", kind : "leaf", closed : true, requires : ["permit", "survey"], contains : []]
  [id : "rebar-on-site", name : "Rebar delivered", kind : "leaf", closed : false, requires : [], contains : []]
  [id : "eng-reply", name : "Engineer answers splice RFI", kind : "leaf", closed : false, requires : [], contains : []]
  [id : "rfi-splice", name : "RFI: splice length", kind : "gate", requires : ["eng-reply"], contains : []]
  [id : "place-rebar", name : "Place rebar", kind : "leaf", closed : false, requires : ["dig", "rebar-on-site", "rfi-splice"], contains : []]
  [id : "inspect", name : "Pre-pour inspection", kind : "verified", closed : false, signed : false, requires : ["place-rebar"], contains : []]
  [id : "pour", name : "Pour concrete", kind : "leaf", closed : false, requires : ["inspect"], contains : []]
  [id : "pedestal", name : "Turbine pedestal", kind : "rollup", requires : ["basis"], contains : ["dig", "place-rebar", "pour"]]
]

-- the atom with this id
find : [want atoms-in | atoms-in keep [a | a id = want] first]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
has : [xs want | xs keep [x | x = want] length > 0]

-- derive: start from nothing and close whatever the graph allows, until nothing changes (a fixed point)
-- (written with and/or, not match: a case that gives false would fall through to the next one, decision 74)
closes : [a ok |
  k : a kind
  manual : k = "leaf" or (k = "verified")
  links-done : a requires .. (a contains) keep [x | has [ok, x] not] length = 0
  k = "trivial" or (manual and (a closed) and (k = "leaf" or (a signed))) or (manual not and links-done)
]
settle : [atoms-in ok |
  more : atoms-in keep [a | has [ok, a id] not and (closes [a, ok])] collect [a | a id]
  more length = 0 [ok] else [settle [atoms-in, ok .. more]]
]

-- a short report: done, workable now, and what each blocked atom waits on
report : [atoms-in title |
  done : settle [atoms-in, []]
  open : atoms-in keep [a | has [done, a id] not]
  workable : open keep [a | a requires keep [x | has [done, x] not] length = 0 and (a kind = "leaf" or (a kind = "verified"))]
  "== [title] ==" print
  "done      [done length] of [atoms-in length]" print
  atoms-in each [a |
    mark : has [done, a id] ["\[x]"] else [has [workable collect [w | w id], a id] ["\[>]"] else ["\[ ]"]]
    waits : a requires .. (a contains) keep [x | has [done, x] not]
    note : waits length > 0 ["waits on " .. (waits fold ["", [s x | s = "" [x] else [s .. ", " .. x]]])] else [""]
    "[mark] [pad [a kind, 9]] [pad [a name, 28]] [note]" print
  ]
  "workable  " .. (workable collect [a | a id] fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]) print
  "pedestal  " .. (has [done, "pedestal"] ["done"] else ["open"]) print
]

report [atoms, "today"]

-- what if the rebar arrives and the engineer answers the RFI? Change two leaves, derive again.
arrived : atoms collect [a | has [["rebar-on-site", "eng-reply"], a id] [a with [closed : true]] else [a]]
report [arrived, "rebar in, RFI answered"]
