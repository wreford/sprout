// node freeze.js <game>: publish a game from games.json with its own copy of Sprout (decision 114). The game's folder
// at the top of the site gets the runtime as it is today (sprout/), the vendor files it needs (the pixel font, and
// any wrapped library its program names), its program (sprout/game.sp), a VERSION stamp, its page and its manifest.
// Sprout can then change without breaking a published game; freezing it again is a deliberate update.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const HERE = __dirname, SITE = path.join(HERE, "..");
const RUNTIME = ["sprout3.js", "words.js", "parse.js", "stdlib.js", "libs.js", "kernels.js", "live3.js", "eight.js"];
const games = JSON.parse(fs.readFileSync(path.join(HERE, "games.json"), "utf8"));
const name = process.argv[2], meta = games[name];
if (!meta) { console.error("usage: node freeze.js <game>, one of: " + Object.keys(games).join(", ")); process.exit(1); }

const S = require("./sprout3.js"); require("./words.js"); require("./stdlib.js"); require("./libs.js");
const src = fs.readFileSync(path.join(HERE, meta.file), "utf8");
const dir = path.join(SITE, name), out = path.join(dir, "sprout");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
const copyDir = (from, to) => { for (const f of fs.readdirSync(from)) { const a = path.join(from, f), b = path.join(to, f); if (fs.statSync(a).isDirectory()) copyDir(a, b); else copy(a, b); } };
for (const f of RUNTIME) copy(path.join(HERE, f), path.join(out, f));
copyDir(path.join(HERE, "vendor/fonts"), path.join(out, "vendor/fonts"));
const libs = S.libraries.mentions(src);
for (const lib of libs) copyDir(path.join(HERE, path.dirname(S.libraries.LIBRARIES[lib].file)), path.join(out, path.dirname(S.libraries.LIBRARIES[lib].file)));
fs.writeFileSync(path.join(out, "game.sp"), src);
let commit = "unknown"; try { commit = execFileSync("git", ["-C", SITE, "rev-parse", "--short", "HEAD"]).toString().trim(); } catch (e) {}
const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + commit;
fs.writeFileSync(path.join(out, "VERSION"), `Sprout as it was at commit ${commit}, frozen for ${meta.title} on ${new Date().toISOString().slice(0, 10)}.\nThis copy belongs to this game alone: changes to /sprout3/ don't reach it. node sprout3/freeze.js ${name} updates it.\nLibraries: ${libs.join(", ") || "none"}.\n`);
const esc = t => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="description" content="${esc(meta.about)}">
<meta name="theme-color" content="#09090c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${esc(meta.title)}">
<title>${esc(meta.title)} · SPROUT·8</title>
<link rel="apple-touch-icon" href="/icons/${name}-180.png">
<link rel="manifest" href="/${name}/manifest.webmanifest">
<link rel="icon" type="image/png" href="/icons/${name}-64.png">
<!-- written in Sprout, on its own frozen copy of Sprout (sprout/, see sprout/VERSION), so later changes can't break it -->
<base href="/${name}/sprout/">
</head><body>
${RUNTIME.map(f => `<script src="${f}?v=${stamp}"></script>`).join("\n")}
<script>Eight.start({ game: "game.sp?v=${stamp}", title: ${JSON.stringify(meta.title)}, key: ${JSON.stringify(name)} });</script>
</body></html>
`);
fs.writeFileSync(path.join(dir, "manifest.webmanifest"), JSON.stringify({
  name: meta.title, short_name: meta.title, start_url: `/${name}/`, scope: `/${name}/`, display: "fullscreen", orientation: "any",
  background_color: "#09090c", theme_color: "#09090c",
  icons: [{ src: `/icons/${name}-180.png`, sizes: "180x180", type: "image/png" }, { src: `/icons/${name}-512.png`, sizes: "512x512", type: "image/png" }],
}, null, 1) + "\n");
console.log(`${name}: frozen at ${stamp}, libraries: ${libs.join(", ") || "none"}`);
