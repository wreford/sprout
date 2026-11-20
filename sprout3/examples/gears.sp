-- Gears: a parametric tool. Two gears that mesh, worked out from the numbers below.
-- Change any number while it runs (or press the tweak button and drag one): the teeth, the mesh
-- and the readouts follow at once, and the gears keep turning through every change.

teeth-a : 16              -- teeth on the driving gear
teeth-b : 28              -- teeth on the driven gear
module : 5                -- tooth size in mm: a gear's pitch diameter is its teeth times this
rpm : 20                  -- how fast the driving gear turns
colour-a : #e8a33d
colour-b : #5fa8d3

pitch-radius : [teeth | teeth * module / 2]
centre-distance : pitch-radius teeth-a + (pitch-radius teeth-b)
ratio : teeth-b / teeth-a
-- millimetres to pixels, so both gears fit across the display
scale : 330 / (centre-distance + (pitch-radius teeth-a) + (pitch-radius teeth-b) + (module * 2))

-- a gear's outline, as [angle, radius] points: each tooth is a trapezoid standing on the root circle
outline : [teeth turn |
  pitch : pitch-radius teeth
  root : pitch - (module * 1.25)
  tip : pitch + module
  step : 6.283185307179586 / teeth
  half : step / 4
  range teeth collect-flat [k |
    a : k * step + turn
    [[a - (half * 1.3), root], [a - (half * 0.6), tip], [a + (half * 0.6), tip], [a + (half * 1.3), root]]
  ]
]

-- a gear drawn round its centre: each pair of neighbouring points is one edge
draw-gear : [teeth turn cx cy colour |
  points : outline [teeth, turn] collect [[a, r] | [a cos * r * scale + cx, a sin * r * scale + cy]]
  points .. [points first] windows 2 each [[[x1, y1], [x2, y2]] | line [x1, y1, x2, y2, colour]]
  circle [cx, cy, pitch-radius teeth * scale * 0.18, colour]
  circle [cx, cy, 3, "#14161a"]
]

round2 : [n | n * 100 round / 100]

start :
  turn : 0

update : [game | game with [turn : game turn + (rpm / 60 * 6.283185307179586 * (game dt))]]

draw : [game |
  clear "#14161a"
  cx-a : 15 + (pitch-radius teeth-a + module * scale)
  cx-b : cx-a + (centre-distance * scale)
  -- the driven gear turns the other way, slower by the ratio, with a gap where the driver's tooth meets it
  turn-b : 3.141592653589793 - (3.141592653589793 / teeth-b) - (game turn / ratio)
  draw-gear [teeth-a, game turn, cx-a, 190, colour-a]
  draw-gear [teeth-b, turn-b, cx-b, 190, colour-b]
  text ["[teeth-a] : [teeth-b] teeth    ratio [round2 ratio] : 1", W / 2, 360, 14, "#e9e6dc"]
  text ["pitch [teeth-a * module] mm and [teeth-b * module] mm", W / 2, 384, 12, "#9a978d"]
  text ["centres [centre-distance] mm apart    module [module]", W / 2, 404, 12, "#9a978d"]
  text ["[rpm] rpm in, [round2 (rpm / ratio)] rpm out", W / 2, 424, 12, "#9a978d"]
]
