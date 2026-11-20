-- ACE morning: the morning question.
-- Status meetings ask what happened. The job moves on a different question:
-- which constraints, killed today, release the most work?
-- That's a ranking, worked out here from the graph: for each open constraint, the hours of work
-- that would become workable if it were cleared this morning.

-- the constraints: material, drawings, RFIs, permits, access, crews, inspections
constraints : [
  [id : "permit-dig", name : "Excavation permit", open : false]
  [id : "mat-forms", name : "Formwork on site", open : false]
  [id : "mat-conduit", name : "Conduit delivered", open : false]
  [id : "rfi-112", name : "RFI 112: splice length", open : true]
  [id : "mat-rebar-n", name : "Rebar delivery, north", open : true]
  [id : "mat-rebar-s", name : "Rebar delivery, south", open : true]
  [id : "dwg-elec-c", name : "Electrical drawings rev C", open : true]
  [id : "rfi-118", name : "RFI 118: grounding depth", open : true]
  [id : "mat-bolts", name : "Anchor bolts", open : true]
  [id : "access-south", name : "South access road", open : true]
  [id : "insp-footings", name : "Footing inspection", open : true]
  [id : "permit-crane", name : "Crane lift permit", open : true]
  [id : "mat-steel", name : "Structural steel", open : true]
  [id : "crew-scaffold", name : "Scaffold crew booked", open : true]
  [id : "dwg-arch-b", name : "Architectural drawings rev B", open : true]
]

-- the work packages: hours, and everything each one requires (constraints and other work)
work : [
  [id : "iwp-01", name : "Excavate north footings", hours : 180, done : true, requires : ["permit-dig"]]
  [id : "iwp-02", name : "Form north footings", hours : 220, done : false, requires : ["iwp-01", "mat-forms"]]
  [id : "iwp-03", name : "Rebar north footings", hours : 260, done : false, requires : ["iwp-01", "mat-rebar-n", "rfi-112"]]
  [id : "iwp-04", name : "Pour north footings", hours : 120, done : false, requires : ["iwp-02", "iwp-03", "insp-footings"]]
  [id : "iwp-05", name : "Underground conduit", hours : 160, done : false, requires : ["iwp-01", "mat-conduit", "dwg-elec-c"]]
  [id : "iwp-06", name : "Grounding grid", hours : 140, done : false, requires : ["iwp-01", "rfi-118"]]
  [id : "iwp-07", name : "Set anchor bolts", hours : 90, done : false, requires : ["iwp-03", "mat-bolts"]]
  [id : "iwp-08", name : "Excavate south footings", hours : 180, done : false, requires : ["permit-dig", "access-south"]]
  [id : "iwp-09", name : "Form south footings", hours : 220, done : false, requires : ["iwp-08", "mat-forms"]]
  [id : "iwp-10", name : "Rebar south footings", hours : 260, done : false, requires : ["iwp-08", "mat-rebar-s", "rfi-112"]]
  [id : "iwp-11", name : "Lift steel columns", hours : 300, done : false, requires : ["iwp-04", "permit-crane", "mat-steel"]]
  [id : "iwp-12", name : "Scaffold the east wall", hours : 150, done : false, requires : ["crew-scaffold"]]
  [id : "iwp-13", name : "East wall forms", hours : 240, done : false, requires : ["iwp-12", "mat-forms", "dwg-arch-b"]]
  [id : "iwp-14", name : "Site drainage", hours : 130, done : false, requires : ["access-south", "dwg-elec-c"]]
]

-- yesterday, two things were still open that are closed today
yesterday-open : ["mat-conduit", "iwp-01"]

has : [xs want | xs keep [x | x = want] length > 0]
join : [xs | xs fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]]
pad : [s n | s length < n [pad [s .. " ", n]] else [s]]
sum : [xs | xs fold [0, [t x | t + x]]]
name-of : [want | (constraints .. work) keep [a | a id = want] first name]

-- what's done, given a list of extra ids to count as cleared
done-with : [extra | (constraints keep [c | c open not] collect [c | c id]) .. (work keep [w | w done] collect [w | w id]) .. extra]
-- work that can start: not done, and everything it requires is done
workable : [cleared | work keep [w | w done not and (w requires keep [r | has [cleared, r] not] length = 0)]]
-- the work an extra clearance would release: workable then, but not now
released : [extra | now : workable (done-with []) collect [w | w id], workable (done-with extra) keep [w | has [now, w id] not]]

open-ones : constraints keep [c | c open]
ranking : open-ones collect [c |
  r : released [c id]
  [id : c id, name : c name, packages : r, hours : sum (r collect [w | w hours])]
]
sort-by-hours : [xs |
  xs length < 2 [xs] else [
    p : xs @ 1
    rest : range (xs length - 1) collect [k | xs @ (k + 1)]
    sort-by-hours (rest keep [x | x hours > (p hours)]) .. [p] .. (sort-by-hours (rest keep [x | x hours <= (p hours)]))
  ]
]
ranked : sort-by-hours ranking

-- since yesterday
today-done : done-with []
yesterday-done : today-done keep [x | has [yesterday-open, x] not]
new-work : workable today-done keep [w | has [workable yesterday-done collect [x | x id], w id] not]
"== since yesterday ==" print
"cleared   " .. (join (yesterday-open collect name-of)) print
"can start " .. (join (new-work collect [w | w name])) print
ready-now : workable today-done
packages-word : ready-now length = 1 ["package"] else ["packages"]
"ready     [ready-now length] [packages-word], [sum (ready-now collect [w | w hours])] hours" print

"" print
"== which constraints, killed today, release the most work? ==" print
range (ranked length) each [n |
  c : ranked @ n
  c hours > 0
    first : n = 1 ["   <- this one first"] else [""]
    count : c packages length
    plural : count = 1 ["package"] else ["packages"]
    hrs : c hours .. " h"
    "[n]. [pad [c name, 30]] [pad [hrs, 7]] [count] [plural][first]" print
]

-- constraints that release nothing alone: the work behind them needs another constraint too
"" print
"== release nothing on their own ==" print
ranked keep [c | c hours = 0] each [c |
  -- only the work that needs both: what the pair releases, less what the partner releases alone
  both : [o | alone : released [o id] collect [w | w id], released [c id, o id] keep [w | has [alone, w id] not]]
  best : open-ones keep [o | o id != (c id)] collect [o | [name : o name, hours : sum (both o collect [w | w hours])]] fold [[name : "", hours : 0], [b x | x hours > (b hours) [x] else [b]]]
  best hours > 0
    "   [pad [c name, 30]] with [best name]: [best hours] h" print
  best hours = 0
    "   [pad [c name, 30]] waits on other work first" print
]
