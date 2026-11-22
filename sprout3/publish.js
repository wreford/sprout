// node publish.js <game>: a game from the registry onto taskiap.com in one go (decision 124): frozen on its own copy of
// Sprout (freeze.js), a row at the top of the site's home page and a line on Sprout's own page, unless they are there
// already. Its icons must be in icons/ first (<game>-64.png, -180.png and -512.png).
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const SITE = path.join(__dirname, ".."), name = process.argv[2], meta = require("./registry.js").games()[name];
if (!meta) { console.error("usage: node publish.js <game>, one of: " + Object.keys(require("./registry.js").games()).join(", ")); process.exit(1); }
const missing = [64, 180, 512].map(n => `icons/${name}-${n}.png`).filter(f => !fs.existsSync(path.join(SITE, f)));
if (missing.length) { console.error("draw the icons first: " + missing.join(", ")); process.exit(1); }
console.log(execFileSync("node", [path.join(__dirname, "freeze.js"), name]).toString().trim());
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const put = (file, mark, line) => {
  const page = fs.readFileSync(file, "utf8");
  if (page.includes(`href="/${name}/"`)) return console.log(path.relative(SITE, file) + ": already there");
  const at = page.indexOf(mark); if (at < 0) throw new Error("no place for the row in " + file);
  fs.writeFileSync(file, page.slice(0, at) + line + "\n" + page.slice(at)); console.log(path.relative(SITE, file) + ": added");
};
const day = new Date().toLocaleString("en-US", { month: "short", day: "numeric" });
put(path.join(SITE, "index.html"), '<a class="row"', `<a class="row" href="/${name}/"><span class="nm">${esc(meta.title)}</span><span class="dt">${day}</span></a>`);
put(path.join(__dirname, "index.html"), '<li><a href="/', `<li><a href="/${name}/">${esc(meta.title)}</a><span>${esc(meta.line || meta.about)}</span></li>`);
