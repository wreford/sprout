# jtm-vision -- deploy notes

Static files, no build, no dependencies. Upload the folder anywhere
(e.g. taskiap.com/jtm/) and it works.

Contents:
- index.html              landing page linking the three demos
- gtc-demo.html           2D codec bench (slice/classify/merge/refine, editable JTM)
- scene3d-demo.html       3D shot bench (SDF raymarcher, camera + timeline keyframes)
- constraints-demo.html   parametric assembly (SolidWorks-style mates, driven dimensions)
- gtc-core.js             codec core, also runs in Node (require and call encode/decode)
- SKILL.md                draft skill for the jtm-vision pipeline
- README.md               this file

Claude Code deploy prompt:
"Upload everything in jtm-vision/ to taskiap.com under /jtm/ using my usual
deploy method, preserving filenames. index.html is the entry point."

Notes:
- scene3d-demo.html and constraints-demo.html need WebGL2 (fine in any modern browser).
- All paths are relative; the folder can live at any subpath.
- gtc-demo.html accepts image uploads client-side; nothing is sent anywhere.
- constraints-demo.html: dragging a driven-dimension slider reshapes the whole scene
  in real time via iterative constraint solving.
