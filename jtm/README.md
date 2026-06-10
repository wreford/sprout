# jtm-vision -- deploy notes

Static files, no build, no dependencies. Upload the folder anywhere
(e.g. taskiap.com/jtm/) and it works. WebGL2 needed for the 3D pages;
HTTPS needed for the camera overlay.

Contents:
- index.html            landing page linking the three benches
- gtc-demo.html         2D Generative Text Codec: measure -> classify -> merge
                        -> emit -> refine; the JTM output is editable text
- scene3d-demo.html     keyframed 3D shots rendered by one SDF shader
- constraints-demo.html the flagship: five scenes (parametric lift, calandria
                        marine lift, once-through cooling, tandem crane lift,
                        tank pad), constraint solver, driven dimensions,
                        feature tree, survey control with Helmert fit,
                        derived process calcs with pass/warn/fail checks,
                        live GIS via free APIs, device-camera site overlay
- gtc-core.js           2D codec core, also runs in Node
- SKILL.md              the authoring reference for writing new scenes

Claude Code deploy prompt:
"Upload everything in jtm-vision/ to taskiap.com under /jtm/ using my usual
deploy method, preserving filenames. index.html is the entry point."

Notes:
- All paths relative; the folder can live at any subpath.
- Nothing leaves the browser except the optional GIS -- LIVE queries
  (Open-Meteo, OSM Nominatim; free, keyless) triggered by a button.
- Spacebar toggles play/pause in constraints-demo.
