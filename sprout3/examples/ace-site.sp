-- ACE site: positions are never stored. Each building's place is an expression over a few named dimensions.
-- Drag left and right on the plan to change the reactor's diameter: everything that depends on it moves.
-- Two things can't share ground. An overlap is a clash, a negative constraint, shown in red.
-- Try changing gap, or a building's size, while it runs.

gap : 15                  -- metres of road between buildings
site-w : 140              -- the site, in metres
site-h : 180
scale : 2.4               -- pixels per metre
ox : 12
oy : 24

start :
  rb-d : 46               -- reactor building diameter, metres
  clashes : 0

-- the whole plan, worked out from the reactor diameter d
plan : [d |
  rb : [x : 50, y : 55, r : d / 2]
  tb : [x : rb x + (rb r) + gap, y : 30, w : 46, h : 62]
  sb : [x : rb x - 24, y : rb y + (rb r) + gap, w : 48, h : 26]
  fb : [x : 60, y : 124, w : 34, h : 34]
  [reactor : rb, turbine : tb, service : sb, fuel : fb]
]

-- the negative constraints
overlap : [a b | a x < (b x + (b w)) and (b x < (a x + (a w))) and (a y < (b y + (b h))) and (b y < (a y + (a h)))]
off-site : [a | a x < 0 or (a y < 0) or (a x + (a w) > site-w) or (a y + (a h) > site-h)]
round-overlap : [c b |
  nx : c x max (b x) min (b x + (b w))
  ny : c y max (b y) min (b y + (b h))
  dist [c x, c y, nx, ny] < (c r)
]
clash-list : [p |
  [
    ["turbine hall", "fuel bay", overlap [p turbine, p fuel]]
    ["service building", "fuel bay", overlap [p service, p fuel]]
    ["reactor", "fuel bay", round-overlap [p reactor, p fuel]]
    ["turbine hall", "site edge", off-site (p turbine)]
    ["service building", "site edge", off-site (p service)]
  ] keep [c | c @ 3]
]

update : [g |
  i : g input
  d : i touching [i touch-x / W * 40 + 30 round] else [g rb-d]
  n : clash-list (plan d) length
  n > (g clashes)
    beep [140, 0.2]
    shake 4
  g with [rb-d : d, clashes : n]
]

-- metres to pixels
px : [m | m * scale + ox]
py : [m | m * scale + oy]

draw : [g |
  p : plan (g rb-d)
  hits : clash-list p
  in-clash : [name | hits keep [c | c @ 1 = name or (c @ 2 = name)] length > 0]
  fill : [name normal | in-clash name ["#5a1f24"] else [normal]]
  box : [b name normal note |
    rect [px (b x), py (b y), b w * scale, b h * scale, in-clash name ["#ff6b6b"] else ["#4a5a52"]]
    rect [px (b x) + 1, py (b y) + 1, b w * scale - 2, b h * scale - 2, fill [name, normal]]
    text [name, px (b x + (b w / 2)), py (b y + (b h / 2)) - 6, 11, "#e8f3e9"]
    text [note, px (b x + (b w / 2)), py (b y + (b h / 2)) + 8, 9, "#7d968a"]
  ]
  rb : p reactor

  clear "#0b0f0d"
  rect [px 0, py 0, site-w * scale, site-h * scale, "#4a5a52"]
  rect [px 0 + 1, py 0 + 1, site-w * scale - 2, site-h * scale - 2, "#101814"]

  box [p fuel, "fuel bay", "#1d2a36", "existing, fixed"]
  box [p turbine, "turbine hall", "#1c2a22", "x = reactor + gap"]
  box [p service, "service building", "#1c2a22", "y = reactor + gap"]
  circle [px (rb x), py (rb y), rb r * scale, in-clash "reactor" ["#ff6b6b"] else ["#6f9f80"]]
  circle [px (rb x), py (rb y), rb r * scale - 2, fill ["reactor", "#18301f"]]
  line [px (rb x - (rb r)), py (rb y), px (rb x + (rb r)), py (rb y), "#8ef08e"]
  text ["reactor  Ø [g rb-d] m", px (rb x), py (rb y) - 10, 12, "#c8f5c8"]

  text ["ACE site  ·  drag to resize the reactor", W / 2, 12, 13, "#e8f3e9"]
  hits length = 0
    text ["no clashes", W / 2, H - 10, 13, "#8ef08e"]
  hits length > 0
    text ["clash: " .. (hits collect [c | c @ 1 .. " / " .. (c @ 2)] fold ["", [s x | s = "" [x] else [s .. ", " .. x]]]), W / 2, H - 10, 11, "#ff6b6b"]
]
