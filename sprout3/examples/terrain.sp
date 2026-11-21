-- Terrain: a map made of smooth noise (the simplex module) and coloured by scales (the chroma module),
-- flying slowly east. Change the sea level, the layers, the zoom or the colours while it flies.

cell : 12                 -- the size of one square, in pixels
zoom : 0.004              -- smaller is a wider view
layers : 4                -- more layers, more small detail
sea : 0.05                -- heights below this are water
speed : 30                -- how fast it flies, in pixels a second
land : chroma steps [[#2f6b2f, #8fbf5a, #d8c88a, #8a6d4b, #ffffff], 16]
water : chroma steps [[#0b2545, #1f6f8b, #6fc3d9], 8]

-- the colour for a height from -1 to 1
shade : [h |
  h < sea [water @ (clamp [h + 1 / (sea + 1) * 8 ceil, 1, 8])] else [land @ (clamp [h - sea / (1 - sea) * 16 ceil, 1, 16])]
]

start :
  flown : 0

update : [game | game with [flown : game flown + (speed * (game dt))]]

draw : [game |
  clear "#0b2545"
  range (H / cell ceil) each [row |
    range (W / cell ceil) each [column |
      x : column - 1 * cell
      y : row - 1 * cell
      rect [x, y, cell, cell, shade (simplex fractal [x + (game flown) * zoom, y * zoom, layers])]
    ]
  ]
  text ["simplex + chroma", W / 2, H - 14, 12, "#ffffffaa"]
]
