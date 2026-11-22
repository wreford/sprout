// The standard library (decision 105): node make-stdlib.js turns lib/*.sp into stdlib.js, which every page and Node
// load after words.js. Edit lib/, not stdlib.js; test.js checks the two agree.
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "lib");
const names = fs.readdirSync(dir).filter(f => f.endsWith(".sp")).map(f => f.slice(0, -3)).sort();
const sources = {};
for (const name of names) sources[name] = fs.readFileSync(path.join(dir, name + ".sp"), "utf8");
// kits (decision 122): modules that draw, in kit/; a game loads one with its own drawing words when it names it
const kitDir = path.join(__dirname, "kit"), kitNames = fs.readdirSync(kitDir).filter(f => f.endsWith(".sp")).map(f => f.slice(0, -3)).sort();
const kits = {};
for (const name of kitNames) kits[name] = fs.readFileSync(path.join(kitDir, name + ".sp"), "utf8");
const out = `// The standard library (decision 105), made by make-stdlib.js from lib/*.sp. Don't edit this file: edit lib/ and run
// node make-stdlib.js. Each module is a global cell whose fields are its words, written in Sprout; it is compiled the
// first time a program uses it.
(function (root) {
"use strict";
const S = root.Sprout3 || (typeof module !== "undefined" ? require("./sprout3.js") : null);
const SOURCES = ${JSON.stringify(sources, null, 1)};
// kits (decision 122): modules that draw; the game layer (live3.js) loads one with a game's own drawing words
const KITS = ${JSON.stringify(kits, null, 1)};
const loaded = {};
for (const name in SOURCES)
  Object.defineProperty(S.globals, name, { get: () => loaded[name] || (loaded[name] = S.load(SOURCES[name])), enumerable: true, configurable: true });
S.stdlib = { SOURCES, names: Object.keys(SOURCES), KITS, kitNames: Object.keys(KITS) };
})(typeof window !== "undefined" ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, "stdlib.js"), out);
console.log("stdlib.js:", names.join(", "), "| kits:", kitNames.join(", "));

// ---- library.html: the reference, made from each module's comments; every example is run and its answer shown
const S = require("./sprout3.js");
const logs = []; S.setLog(m => logs.push(m));
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// a module's own words: the comment lines above each top-level binding; "-- e.g." lines are examples
function wordsOf(src) {
  const lines = src.split("\n"), words = [], intro = [];
  let comments = [], seenWord = false;
  for (const line of lines) {
    if (line.startsWith("-- ")) { comments.push(line.slice(3)); continue; }
    const m = /^([a-z][\w-]*) : (.*)$/.exec(line);
    if (m && comments.length) {
      const inputs = /^\[([^|\[\]]*)\|/.exec(m[2]);
      words.push({ name: m[1], inputs: inputs ? inputs[1].trim() : "", about: comments.filter(c => !c.startsWith("e.g. ")), examples: comments.filter(c => c.startsWith("e.g. ")).map(c => c.slice(5)) });
      seenWord = true;
    } else if (!seenWord && !m && line.trim() === "" && comments.length) intro.push(...comments);
    comments = [];
  }
  return { intro, words };
}
const MODULES = names.map(name => ({ name, ...wordsOf(sources[name]) }));
const KIT_MODULES = kitNames.map(name => ({ name, kit: true, ...wordsOf(kits[name]) }));
// the modules distilled from the TaskIAP games: those whose opening says so
const GAME_MODULES = names.filter(name => /Distilled from/.test(sources[name].split("\n\n")[0].replace(/\n-- /g, " ")));
// json is written in JavaScript, in words.js; its entry is written here
MODULES.push({ name: "json", intro: ["json: JSON text read into records and lists, and written back. null reads as false; dates, money and other kinds are written as their text."], words: [
  { name: "read", inputs: "", about: ["records and lists from JSON text (put \\[ for a [ inside Sprout text)"], examples: ['json read "{\\"a\\": 1, \\"b\\": \\[true, null]}" → [a : 1, b : [true, false]]'] },
  { name: "write", inputs: "", about: ["a value as JSON text"], examples: ['json write [name : "Ada", due : 2026-11-20, tags : ["x"]] → {"name":"Ada","due":"2026-11-20","tags":["x"]}'] },
  { name: "pretty", inputs: "", about: ["the same, set out on several lines"], examples: ['json pretty [a : 1] → {\\n  "a": 1\\n}'] },
] });
// the modules by what you're making, each group in the order you'd reach for them
const GROUPS = [
  ["Words and numbers", ["format", "prose", "integers", "span", "measure", "stats"]],
  ["Apps and data", ["calendar", "finance", "tabular", "fuzzy", "validate", "undo", "csv", "json"]],
  ["Time and motion", ["ease", "motion", "spring", "keyframes", "flipbook", "steer", "daytime"]],
  ["Touch and sound", ["pad", "menu", "gesture", "music"]],
  ["Space", ["vec", "shape", "segment", "spline", "collide", "grid", "tilemap", "runs", "hex", "iso", "camera", "layout", "matrix", "geo"]],
  ["Chance", ["seeded", "dice", "cards", "piles"]],
  ["Play", ["combat", "waves", "particles", "rewards", "story", "wordplay", "league", "economy"]],
  ["Colour", ["palette"]],
];
const grouped = GROUPS.flatMap(([, ns]) => ns);
const rest = MODULES.map(m => m.name).filter(n => !grouped.includes(n)).sort();
if (rest.length) GROUPS.push(["More", rest]);
const byName = Object.fromEntries(MODULES.map(m => [m.name, m]));
MODULES.sort((a, b) => a.name < b.name ? -1 : 1);
// the wrapped libraries (decision 106): their words, as libs.js describes them
const LIBS = S.libraries.names.map(name => {
  const L = S.libraries.LIBRARIES[name], words = L.words(new Proxy(function () {}, { get: () => () => {}, apply: () => ({}) }));
  return { name, title: L.title, licence: L.licence, file: L.file, browserOnly: L.browserOnly, intro: [L.about],
    words: Object.entries(words).map(([w, [about, example]]) => ({ name: w, inputs: "", about: [about], examples: example ? [example] : [] })) };
});
let failures = 0;
// an example's answer as it reads on the page (a line break inside a text shows as \n, as it's written)
const shown = out => String(out).replace(/\n/g, "\\n");
let checked = 0;
const run = src => { logs.length = 0; let out; try { out = S.format(S.load("result : " + src).field("result")); } catch (e) { out = "error: " + e.message; } const bad = logs.filter(l => !l.startsWith("lint")); if (bad.length || out.startsWith("error")) { failures++; console.log("EXAMPLE FAILS:", src, "=>", out, bad.join(" | ")); } return out; };
// an example is "expression" or "expression → answer"; the stated answer must be what it gives
const example = (e, mustState) => {
  const [src, stated] = e.split(" → "), out = run(src);
  if (stated === undefined && mustState) { failures++; console.log("NO ANSWER STATED:", src); }
  if (stated !== undefined) { checked++; if (shown(out) !== stated.trim()) { failures++; console.log("WRONG ANSWER:", src, "gives", shown(out), "not", stated.trim()); } }
  return `<pre>${esc(src)}\n<span class="cm">-- ${esc(out).replace(/\n/g, "\n-- ")}</span></pre>`;
};
// a kit's example is "expression draws what": what it draws on a SPROUT·8 screen, checked like an answer; or "→ answer"
const L = require("./live3.js");
const kitExample = e => {
  const drawing = e.includes(" draws "), [src, stated] = e.split(drawing ? " draws " : " → ");
  logs.length = 0; let out; try { out = drawing ? L.drawsOf(src) : shown(L.answerOf(src)); } catch (err) { out = "error: " + err.message; }
  const bad = logs.filter(l => !l.startsWith("lint"));
  checked++; if (out !== stated.trim() || bad.length) { failures++; console.log("WRONG DRAWING:", src, "draws", out, "not", stated.trim(), bad.join(" | ")); }
  return `<pre>${esc(src)}\n<span class="cm">-- ${drawing ? "draws " : ""}${esc(out)}</span></pre>`;
};
const section = (mod, mustState) => {
  const plain = mod.intro.join(" ").replace(/^[\w-]+: /, ""), intro = plain.charAt(0).toUpperCase() + plain.slice(1);
  return `<section id="${mod.name}">
<h2>${mod.name}</h2>
<p>${esc(intro)}</p>
<dl>
${mod.words.map(w => `<dt><code><b>${mod.name} ${w.name}</b>${w.inputs ? " [" + esc(w.inputs.split(/\s+/).join(", ")) + "]" : ""}</code></dt>
<dd><p>${esc(w.about.join(" "))}</p>${w.examples.map(e => mod.kit ? kitExample(e) : example(e, mustState)).join("")}</dd>`).join("\n")}
</dl>
</section>`;
};
const style = fs.readFileSync(path.join(__dirname, "index.html"), "utf8").match(/<style>[\s\S]*?<\/style>/)[0]
  .replace("</style>", "main{font-feature-settings:'calt' 0}dl{margin:0}dt{margin:22px 0 4px}dt b{font-weight:600}dd{margin:0}dd p{color:var(--fg2);margin:0 0 8px}pre{margin:0 0 6px}\n.toc{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 8px}\nsection h2{font-size:15px;text-transform:none;letter-spacing:0;color:var(--fg);margin:56px 0 6px}\n</style>");
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="The Sprout standard library: every module and word, with an example and its answer.">
<title>Sprout library</title>
${style}</head><body>
<main>
<h1><a href="./">Sprout</a></h1>
<p class="lede">The standard library: ${MODULES.length} modules, ${MODULES.reduce((n, m) => n + m.words.length, 0)} words, written in Sprout. And <a href="#kits">${KIT_MODULES.length} ${KIT_MODULES.length === 1 ? "kit" : "kits"}</a> that draw, and <a href="#libraries">${LIBS.length} wrapped libraries</a>.</p>
<p>Each module is a cell whose fields are its words, there in every program: <code>ease out-cubic 0.5</code>, <code>stats median xs</code>, <code>grid path [g, from, to, open]</code>. The source is in <code>lib/</code>, one file a module, and is worth reading: every word is a few lines.</p>
<p>One way of working runs through all of them. A point, a size, a cell of a grid and a hex are pairs, like <code>3x4</code>, read with <code>p x</code> and <code>p y</code>, and added and scaled like numbers. A word's inputs come in the same order: what it works on, then how, then the time or the seed. Randomness only ever comes from a seed, through <code>seeded</code>, so a game that rewinds, and a second phone playing along, get the same luck. And every example below shows its answer, which is worked out, and checked, each time the library is built.</p>
${GROUPS.map(([title, ns]) => `<p class="toc"><b>${title}</b> ${ns.filter(n => byName[n]).map(n => `<a href="#${n}">${n}</a>`).join(" ")}</p>`).join("\n")}
<p>Of these, ${GAME_MODULES.length} were distilled from the 319 TaskIAP games and apps: what they kept writing again and again, written once, small and well, in Sprout: ${GAME_MODULES.map(n => `<a href="#${n}">${n}</a>`).join(", ")}. A count in each one's opening says how many games needed it.</p>
<p>Built into every value as well: the list, record, text and number words, endless lists, the literals, <code>parse</code>, <code>quote</code> and <code>script</code>. They are in <a href="play.html#spec">the spec</a> (decisions 99 to 104).</p>
${GROUPS.map(([title, ns]) => `<h2 class="group">${title}</h2>\n` + ns.filter(n => byName[n]).map(n => section(byName[n], true)).join("\n")).join("\n")}
<h2 id="kits" style="margin-top:72px">Kits</h2>
<p>Modules that draw. A kit is written in Sprout like the modules above, but it draws with the game's own drawing words, so it comes along with a game that names it: <code>ui banner ["GO", 40, 8, #ffffff]</code>. Each example shows what it draws on a SPROUT·8 screen, 256 pixels across and 192 down, and that is checked each time the library is built too.</p>
<p class="toc">${KIT_MODULES.map(m => `<a href="#${m.name}">${m.name}</a>`).join(" ")}</p>
${KIT_MODULES.map(m => section(m)).join("\n")}
<h2 id="libraries" style="margin-top:72px">Wrapped libraries</h2>
<p>Popular JavaScript libraries, each a module like the ones above. A library is loaded only when a program names it, from this site, so nothing is fetched unless it is used.</p>
<p class="toc">${LIBS.map(m => `<a href="#${m.name}">${m.name}</a>`).join(" ")}</p>
${LIBS.map(m => section(m).replace(`<h2>${m.name}</h2>`, `<h2>${m.name} <span style="font-weight:400;color:var(--fg3)">· ${m.title}, ${m.licence} licence${m.browserOnly ? " · in the browser only" : ""}</span></h2>`)).join("\n")}
<footer>Sprout 3 &middot; the standard library (decisions 105, 111 and 112) &middot; <a href="./">home</a></footer>
</main>
</body></html>
`;
fs.writeFileSync(path.join(__dirname, "library.html"), page);
console.log("library.html:", LIBS.length, "libraries,", MODULES.length, "modules,", MODULES.reduce((n, m) => n + m.words.length, 0), "words,", checked, "answers checked,", failures, "failing examples");
if (failures) process.exitCode = 1;
