# JTM media format · Blended Zebra art drop zone

Drop images in this folder and they appear in the game — no code changes needed
for the simple case.

## The simple case

Name the file after the art key and it just works:

- `card-bite.png` → art for the Bite card
- `card-stampede.png`, `card-hide.png`, `card-zoomies.png`, … (every card id: `card-<id>`)
- `foe-hyena.png`, `foe-lion.png`, `foe-croc.png`, `foe-alpha.png`, `foe-blender.png`, … (`foe-<id>`)

Accepted: `.png`, `.jpg`, `.webp` (tried in that order). Images are forced
grayscale + high contrast by default so anything from Grok lands on the
black/white/red palette automatically.

## Card ids (for `card-<id>` filenames)

bite, kick, tailwhip, headbutt, stampede, charge, frenzy, muzzle,
hide, herd, dust, zoomies, graze, bray, stripes, thickhide, blend

## Foe ids (for `foe-<id>` filenames)

hyena, vulture, jackal, croc, baboon, lioness — bosses: alpha, lion, crocking, blender

## The full manifest (optional fine-tuning)

In `index.html`, the `JTM.manifest` object accepts per-key options:

```js
JTM.manifest['card-bite'] = {
  src: 'art/whatever-name.png', // optional — else auto-tries art/<key>.png/.jpg/.webp
  fit: 'cover',                 // or 'contain'
  px: 0.5, py: 0.3,             // focus point 0..1 (crop centering)
  mono: true,                   // false = keep original colours (off-palette, your call)
};
```

Missing art falls back to procedural zebra stripes, so partial drops are fine.
Send images in any batch size.
