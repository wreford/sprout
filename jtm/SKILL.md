# jtm-vision -- media as editable, solvable text (JTM)

JTM (JavaScript Text Media) expresses images, animation, and 3D engineering
scenes as small JSON files of relationships and expressions. Pixels, positions,
and frames are derived by a decoder; the text is the source of truth -- diffable
in git, authorable by an LLM, a few KB per scene.

Use this skill to author or edit .jtm scenes, or to extend the decoders.

## The one rule

Never write a coordinate when a relationship exists. Objects are placed by
mates and expressions; if you find yourself typing a position a constraint
could derive, use the constraint. Raw "x 12" is the escape hatch, not the norm.

## Files

- index.html            landing page
- gtc-demo.html         2D codec: slice/classify/merge/refine pipeline, editable output
- gtc-core.js           2D codec core (encode/decode/refine/diff), runs in Node too
- scene3d-demo.html     keyframed 3D shots (positions, no solver) -- the simpler dialect
- constraints-demo.html the full dialect: solver, calcs, checks, GIS, overlay

## The constraints dialect (constraints-demo.html)

A scene is one JSON object:

{
  "desc":     "shown in the UI; keep it one or two sentences",
  "kind":     "scene3d-constraints",
  "sky":      ["#hex-top", "#hex-bottom"],   "sun": [x, y, z],
  "vars":     { "name": number, ... },        inputs; kebab-case names
  "ranges":   { "name": [min, max] },         only ranged vars get sliders
  "derived":  { "name": "expression" },       ordered; each may use earlier ones
  "units":    { "name": "m3/s" },
  "checks":   [ { "name", "expr", "max" or "min", "unit" } ],
  "objects":  [ ... up to 24 ... ],
  "site":     { "crs": "EPSG:269xx", "anchors": [ {"bim", "gis"} ] },
  "camera":   { "fov", "orbit": { "target", "radius", "height", "period", "phase" } },
  "timeline": [ { "var", "ease": "smooth", "keys": [ {"t", "v"} ] } ]
}

### Objects

{ "id": "beam", "shape": "box", "size": [...], "color": "#hex",
  "at": ["constraint", ...], "blend": 0.3, "sub": true }

Shapes and size semantics (axis-aligned only; there is no rotation):
- box    [w, h, d] full extents
- sphere [diameter]
- cyl    [diameter, height]        vertical axis
- cyl-x  [diameter, length]        axis along x (horizontal vessels)
- cyl-z  [diameter, length]        axis along z
- torus  [major-diameter, minor-diameter], in the xz plane
blend > 0 smooth-unions with the scene; sub: true subtracts.

### Constraints (the "at" list; each sets one or more axes)

on <id> | on ground          rest on top
above/below <id> [gap-expr]  vertical offset from top/bottom
left-of/right-of <id> [gap]  x from the side faces
behind/in-front <id> [gap]   z from the faces (negative gap embeds/straddles)
align-x|y|z <id>             copy a coordinate
concentric <id>              copy x and z
centered-x|z <idA> [idB]     midpoint
x|y|z <expression>           direct value -- escape hatch only

An object is "fully defined" when all three axes are set; the feature tree
flags under-defined axes amber and cycles/errors red.

### Expressions

Space-separated tokens: numbers, vars, + - * / and parens (parens may touch).
pi is built in. Object property refs create solve dependencies:
  id.x .y .z .w .h .d .top .bottom .left .right .front .back
Examples: "span / 2",  "jib.bottom - beam.top",  "-( tank-d + gap ) / 2"
Derived expressions may NOT reference objects; constraints may.

### Derived + checks

Derived entries evaluate in order and become vars, so geometry can be a
calculation (e.g. an intake screen sized by "flow / ( 0.15 * 6 )").
Checks evaluate against max/min; status warn inside 8 percent of the limit.
Put engineering limits in the file -- the model verifies itself every frame.

### Site (BIM |=| GIS)

Anchors mate local points to earth: {"bim": "mon-1" or [x,y,z], "gis": [E,N,elev]}.
2 anchors fix rotation; 3+ run a least-squares Helmert fit and the RMS residual
is survey health (green <= 15 mm, amber <= 60 mm). Solve stays in the local
frame; UTM appears only at readouts. The GIS -- LIVE panel converts the origin
to lat/lon and can query Open-Meteo and OSM Nominatim (free, keyless).

### Timeline + camera

Timelines animate VARS, never positions -- choreograph by changing numbers and
let constraints propagate (the calandria lift is two animated vars). Camera
orbits a target object; radius/height accept expressions.

### Limits worth respecting

- 24 objects per scene (shader uniform cap)
- keep scene extents within roughly 60 m of the camera (march limit 80)
- no rotation: compose axis-aligned primitives or restage the problem
- expressions have no min/max/conditionals -- restructure instead

## Authoring workflow for an LLM

1. Name the vars (the dimensions a human would put on a drawing).
2. Place objects by mates, root-first (ground/pad, then what rests on it).
3. Make every length that depends on a var an expression, not a number.
4. Add derived calcs and checks for whatever the scene must prove.
5. Animate the fewest vars that tell the story.
6. Read the feature tree: anything not green is a defect in your text.
