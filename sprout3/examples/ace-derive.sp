-- ACE: the Atomic Constraint Engine, in Sprout. One primitive: the atom.
-- An atom has an id, a name, a kind, tags and two links: requires (what must finish first)
-- and contains (its children). Done is never stored. It is derived from the graph.
--
-- Five kinds, by who says an atom is done:
--   trivial   born done: a fact other atoms can rely on
--   leaf      a person closes it
--   verified  closed AND signed by a witness: two locks
--   gate      done when everything it requires is done (RFIs, constraints)
--   rollup    done when all its children are done (areas, work packages)
--
-- A tag carries no math, except one: narrative-required. An atom with it isn't done,
-- however it was closed, until someone writes down what happened.

atoms : [
  [id : "basis", name : "Design basis issued", kind : "trivial", tags : [], requires : [], contains : []]
  [id : "permit", name : "Excavation permit", kind : "verified", closed : true, signed : true, tags : ["regulatory"], requires : [], contains : []]
  [id : "survey", name : "Survey and layout", kind : "leaf", closed : true, tags : [], requires : [], contains : []]
  [id : "dig", name : "Excavate pedestal", kind : "leaf", closed : true, tags : [], requires : ["permit", "survey"], contains : []]
  [id : "rebar-on-site", name : "Rebar delivered", kind : "leaf", closed : false, tags : ["material"], requires : [], contains : []]
  [id : "eng-reply", name : "Engineer answers splice RFI", kind : "leaf", closed : false, tags : [], requires : [], contains : []]
  [id : "rfi-splice", name : "RFI: splice length", kind : "gate", tags : ["rfi"], requires : ["eng-reply"], contains : []]
  [id : "place-rebar", name : "Place rebar", kind : "leaf", closed : false, tags : [], requires : ["dig", "rebar-on-site", "rfi-splice"], contains : []]
  [id : "inspect", name : "Pre-pour inspection", kind : "verified", closed : false, signed : false, tags : ["narrative-required"], requires : ["place-rebar"], contains : []]
  [id : "pour", name : "Pour concrete", kind : "leaf", closed : false, tags : ["narrative-required"], requires : ["inspect"], contains : []]
  [id : "pedestal", name : "Turbine pedestal", kind : "rollup", tags : [], requires : ["basis"], contains : ["dig", "place-rebar", "pour"]]
]

-- small helpers
find : [want atoms-in | atoms-in keep [a | a id = want] first]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]

-- the narrative an atom still owes, if it has the tag and nothing written yet
owes-story : [a | has [a tags, "narrative-required"] and ((a narrative else "") = "")]

-- does this atom close, given the ids already done?
closes : [a ok |
  links-done : a requires .. (a contains) keep [x | has [ok, x] not] length = 0
  match [a kind, [
    "trivial", true
    "leaf", a closed and (owes-story a not)
    "verified", a closed and (a signed) and (owes-story a not)
    any, links-done
  ]]
]
-- derive: start from nothing and close whatever the graph allows, until nothing changes (a fixed point)
settle : [atoms-in ok |
  more : atoms-in keep [a | has [ok, a id] not and (closes [a, ok])] collect [a | a id]
  more length = 0 [ok] else [settle [atoms-in, ok .. more]]
]

-- a short report: done, workable now, and what each open atom is waiting for
report : [atoms-in title |
  done : settle [atoms-in, []]
  open : atoms-in keep [a | has [done, a id] not]
  manual : [a | a kind = "leaf" or (a kind = "verified")]
  workable : open keep [a | manual a and (a requires keep [x | has [done, x] not] length = 0) and (a closed not)]
  "== [title] ==" print
  "done      [done length] of [atoms-in length]" print
  atoms-in each [a |
    waits : a requires .. (a contains) keep [x | has [done, x] not]
    stuck : manual a and (a closed) and (has [done, a id] not)
    mark : match [true, [
      has [done, a id], "\[x]"
      stuck, "\[!]"
      has [workable collect [w | w id], a id], "\[>]"
      any, "\[ ]"
    ]]
    note : cond [
      stuck and (owes-story a), "closed, but needs a narrative"
      stuck, "closed, but waiting for a witness to sign"
      waits length > 0, "waits on " .. (join waits)
      (a narrative else "") != "", "narrative: " .. (a narrative)
      any, ""
    ]
    "[mark] [pad [a kind, 9]] [pad [a name, 28]] [note]" print
  ]
  "workable  " .. (join (workable collect [a | a id])) print
  "pedestal  " .. (has [done, "pedestal"] ["done"] else ["open"]) print
  "" print
]

-- change some atoms by id, and derive again
update-atoms : [atoms-in ids change | atoms-in collect [a | has [ids, a id] [a with change] else [a]]]

report [atoms, "today"]

arrived : update-atoms [atoms, ["rebar-on-site", "eng-reply"], [closed : true]]
report [arrived, "rebar in, RFI answered"]

-- the rebar is placed and the inspector signs, but nobody has written up the inspection yet
signed : update-atoms [update-atoms [arrived, ["place-rebar"], [closed : true]], ["inspect"], [closed : true, signed : true]]
report [signed, "inspected and signed, no write-up"]

-- the write-up: a typed outcome first, then the detail
written : update-atoms [signed, ["inspect"], [narrative : "nominal · splice lengths checked against the RFI answer"]]
report [written, "inspection written up"]
