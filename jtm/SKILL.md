# jtm-vision -- re-author images and animation as editable text (JTM)

Use this skill when converting an image, animation frame, or screen capture into JTM
(JavaScript Text Media): a JSON envelope of vector ops, gradient bands, and small
palette-keyed raster blocks. The output is diffable, git-friendly text that renders
back to pixels with the bundled decoder.

## The one rule

Never emit a coordinate, color, or size that did not come from tool output.
The tools measure; you decide. Your job is the art-director pass: merging, naming,
simplifying, styling -- never freehand geometry.

## Pipeline (run in order)

1. slice -- cut the source into a grid (8/16/32 px cells) and measure each cell:
   mean color, luma variance, edge energy, gradient trends, dominant-color coverage.
2. classify -- label each cell flat / gradient / edge / texture from the measurements.
3. merge -- fuse compatible neighbors: flat cells into maximal rects, gradient cells
   into bands. This is what turns a mosaic into an illustration.
4. emit -- ops for merged regions, palette-keyed raster blocks (RLE rows) for
   edge/texture cells.
5. render + diff -- decode the JTM, score every cell against the source.
6. refine -- re-rasterize cells above the error threshold at higher resolution.
   Loop 5-6 until the worst cell is acceptable or the byte budget is spent.

## Your art-director pass (after step 4, before final refine)

- Merge cells that are one object ("these six cells are the boat -- one path").
- Collapse near-duplicate palette entries; name the palette semantically if asked.
- Replace repeating raster blocks with a shared tile referenced by position.
- Promote tunable values to vars (sun-y, ridge-jaggedness, palette) when the user
  wants a parametric result.
- Choose the style vocabulary if restyling: flat-geometric, blueprint, cutout, 8-bit.

## Honesty about scope

This is re-authoring, not signal compression. Structure converts beautifully
(landscapes, icons, diagrams, UI, animation); texture does not (faces, photographs
whose essence is grain). For stubborn regions, emit a raster block and move on --
the format is designed for the hybrid.

## Tools

- gtc-core.js -- encode / decode / refine / diffScore / jtmToText. Pure functions
  over { data: Uint8ClampedArray, w, h }. Runs in Node and the browser unchanged.
- gtc-demo.html -- the visual bench: scenes, upload, knobs, editable JTM round trip.

- scene3d-demo.html -- kind: scene3d. SDF raymarcher decoder; objects, lights,
  camera spline, timeline keyframes. Two scenes: construction lift sequence,
  tank farm orbit. The video is the text.
