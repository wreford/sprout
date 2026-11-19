-- ACE site: positions are never stored. Each building's place is an expression over a few named dimensions.
-- Drag left and right on the plan to change the reactor's diameter: everything that depends on it moves.
-- Every rule is a constraint, and the panel shows each one passing or failing.
-- "Must not" rules are clashes: two things can't share ground. "Must" rules are limits the design has to meet.
-- Try Tweak on gap, or on a building's size, while it runs.

gap : 15                  -- metres of road between buildings
site-w : 140              -- the site, in metres
site-h : 180
scale : 2                 -- pixels per metre
ox : 40
oy : 26

start :
  rb-d : 46               -- reactor building diameter, metres
  failing : 0

-- the whole plan, worked out from the reactor diameter d
plan : [d |
  rb : [x : 50, y : 55, r : d / 2]
  tb : [x : rb x + (rb r) + gap, y : 30, w : 46, h : 62]
  sb : [x : rb x - 24, y : rb y + (rb r) + gap, w : 48, h : 26]
  fb : [x : 60, y : 124, w : 34, h : 34]
  [reactor : rb, turbine : tb, service : sb, fuel : fb]
]

-- shapes
overlap : [a b | a x < (b x + (b w)) and (b x < (a x + (a w))) and (a y < (b y + (b h))) and (b y < (a y + (a h)))]
on-site : [a | a x >= 0 and (a y >= 0) and (a x + (a w) <= site-w) and (a y + (a h) <= site-h)]
round-overlap : [c b |
  nx : c x max (b x) min (b x + (b w))
  ny : c y max (b y) min (b y + (b h))
  dist [c x, c y, nx, ny] < (c r)
]
centre-gap : [c b | dist [c x, c y, b x + (b w / 2), b y + (b h / 2)]]

-- every rule is a constraint: a name, the buildings it's about, and whether it holds
constraints : [p |
  [
    [name : "reactor clear of the fuel bay", about : ["reactor", "fuel bay"], kind : "must not", holds : round-overlap [p reactor, p fuel] not]
    [name : "turbine hall clear of the fuel bay", about : ["turbine hall", "fuel bay"], kind : "must not", holds : overlap [p turbine, p fuel] not]
    [name : "service building clear of the fuel bay", about : ["service building", "fuel bay"], kind : "must not", holds : overlap [p service, p fuel] not]
    [name : "turbine hall inside the site", about : ["turbine hall"], kind : "must not", holds : on-site (p turbine)]
    [name : "cable run under 65 m", about : ["reactor", "turbine hall"], kind : "must", holds : centre-gap [p reactor, p turbine] < 65]
    [name : "fire road at least 12 m wide", about : [], kind : "must", holds : gap >= 12]
    [name : "reactor at least 36 m across", about : ["reactor"], kind : "must", holds : p reactor r * 2 >= 36]
  ]
]
fails : [p | constraints p keep [c | c holds not]]

update : [g |
  i : g input
  d : i touching [i touch-x / W * 40 + 25 round] else [g rb-d]
  n : fails (plan d) length
  n > (g failing)
    beep [140, 0.2]
    shake 4
  g with [rb-d : d, failing : n]
]

-- metres to pixels
px : [m | m * scale + ox]
py : [m | m * scale + oy]

draw : [g |
  p : plan (g rb-d)
  all : constraints p
  bad : fails p
  in-trouble : [name | bad keep [c | c about keep [x | x = name] length > 0] length > 0]
  fill : [name normal | in-trouble name ["#5a1f24"] else [normal]]
  box : [b name normal note |
    rect [px (b x), py (b y), b w * scale, b h * scale, in-trouble name ["#ff6b6b"] else ["#4a5a52"]]
    rect [px (b x) + 1, py (b y) + 1, b w * scale - 2, b h * scale - 2, fill [name, normal]]
    text [name, px (b x + (b w / 2)), py (b y + (b h / 2)) - 5, 10, "#e8f3e9"]
    text [note, px (b x + (b w / 2)), py (b y + (b h / 2)) + 7, 8, "#7d968a"]
  ]
  rb : p reactor
  tb : p turbine

  clear "#0b0f0d"
  text ["ACE site  ·  drag to resize the reactor", W / 2, 12, 12, "#e8f3e9"]
  rect [px 0, py 0, site-w * scale, site-h * scale, in-trouble "turbine hall" and (on-site tb not) ["#ff6b6b"] else ["#4a5a52"]]
  rect [px 0 + 1, py 0 + 1, site-w * scale - 2, site-h * scale - 2, "#101814"]

  -- the cable run: a line from the reactor's centre to the turbine hall's
  line [px (rb x), py (rb y), px (tb x + (tb w / 2)), py (tb y + (tb h / 2)), in-trouble "turbine hall" ["#ff6b6b"] else ["#2f6b3a"]]

  box [p fuel, "fuel bay", "#1d2a36", "existing, fixed"]
  box [tb, "turbine hall", "#1c2a22", "x = reactor + gap"]
  box [p service, "service building", "#1c2a22", "y = reactor + gap"]
  circle [px (rb x), py (rb y), rb r * scale, in-trouble "reactor" ["#ff6b6b"] else ["#6f9f80"]]
  circle [px (rb x), py (rb y), rb r * scale - 2, fill ["reactor", "#18301f"]]
  line [px (rb x - (rb r)), py (rb y), px (rb x + (rb r)), py (rb y), "#8ef08e"]
  text ["reactor Ø [g rb-d] m", px (rb x), py (rb y) - 9, 10, "#c8f5c8"]

  -- the constraint panel
  text ["[all length - (bad length)] of [all length] constraints hold", W / 2, 398, 11, bad length = 0 ["#8ef08e"] else ["#ff9e7a"]]
  range (all length) each [n |
    c : all @ n
    text [(c holds ["ok   "] else ["FAIL "]) .. (c kind) .. ": " .. (c name), W / 2, 404 + (n * 10), 9, c holds ["#6f9f80"] else ["#ff6b6b"]]
  ]
]
