# jtm-vision -- deploy notes

Static files, no build, no dependencies. Upload the folder anywhere
(e.g. taskiap.com/jtm/) and it works.

Contents:
- index.html          landing page linking the two demos
- gtc-demo.html       2D codec bench (slice/classify/merge/refine, editable JTM)
- scene3d-demo.html   3D shot bench (SDF raymarcher, camera + timeline keyframes)
- gtc-core.js         codec core, also runs in Node (require and call encode/decode)
- SKILL.md            draft skill for the jtm-vision pipeline

Claude Code deploy prompt:
"Upload everything in jtm-vision/ to taskiap.com under /jtm/ using my usual
deploy method, preserving filenames. index.html is the entry point."

Notes:
- scene3d-demo.html needs WebGL2 (fine in any modern browser).
- All paths are relative; the folder can live at any subpath.
- gtc-demo.html accepts image uploads client-side; nothing is sent anywhere.
