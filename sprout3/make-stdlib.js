// The standard library (decision 105): node make-stdlib.js turns lib/*.sp into stdlib.js, which every page and Node
// load after words.js. Edit lib/, not stdlib.js; test.js checks the two agree.
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "lib");
const names = fs.readdirSync(dir).filter(f => f.endsWith(".sp")).map(f => f.slice(0, -3)).sort();
const sources = {};
for (const name of names) sources[name] = fs.readFileSync(path.join(dir, name + ".sp"), "utf8");
const out = `// The standard library (decision 105), made by make-stdlib.js from lib/*.sp. Don't edit this file: edit lib/ and run
// node make-stdlib.js. Each module is a global cell whose fields are its words, written in Sprout; it is compiled the
// first time a program uses it.
(function (root) {
"use strict";
const S = root.Sprout3 || (typeof module !== "undefined" ? require("./sprout3.js") : null);
const SOURCES = ${JSON.stringify(sources, null, 1)};
const loaded = {};
for (const name in SOURCES)
  Object.defineProperty(S.globals, name, { get: () => loaded[name] || (loaded[name] = S.load(SOURCES[name])), enumerable: true, configurable: true });
S.stdlib = { SOURCES, names: Object.keys(SOURCES) };
})(typeof window !== "undefined" ? window : globalThis);
`;
fs.writeFileSync(path.join(__dirname, "stdlib.js"), out);
console.log("stdlib.js:", names.join(", "));

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
// json is written in JavaScript, in words.js; its entry is written here
MODULES.push({ name: "json", intro: ["json: JSON text read into records and lists, and written back. null reads as false; dates, money and other kinds are written as their text."], words: [
  { name: "read", inputs: "", about: ["records and lists from JSON text (put \\[ for a [ inside Sprout text)"], examples: ['json read "{\\"a\\": 1, \\"b\\": \\[true, null]}"'] },
  { name: "write", inputs: "", about: ["a value as JSON text"], examples: ['json write [name : "Ada", due : 2026-11-20, tags : ["x"]]'] },
  { name: "pretty", inputs: "", about: ["the same, set out on several lines"], examples: ["json pretty [a : 1]"] },
] });
MODULES.sort((a, b) => a.name < b.name ? -1 : 1);
let failures = 0;
const run = src => { logs.length = 0; let out; try { out = S.format(S.load("result : " + src).field("result")); } catch (e) { out = "error: " + e.message; } const bad = logs.filter(l => !l.startsWith("lint")); if (bad.length || out.startsWith("error")) { failures++; console.log("EXAMPLE FAILS:", src, "=>", out, bad.join(" | ")); } return out; };
const section = mod => {
  const plain = mod.intro.join(" ").replace(/^[\w-]+: /, ""), intro = plain.charAt(0).toUpperCase() + plain.slice(1);
  return `<section id="${mod.name}">
<h2>${mod.name}</h2>
<p>${esc(intro)}</p>
<dl>
${mod.words.map(w => `<dt><code><b>${mod.name} ${w.name}</b>${w.inputs ? " [" + esc(w.inputs.split(/\s+/).join(", ")) + "]" : ""}</code></dt>
<dd><p>${esc(w.about.join(" "))}</p>${w.examples.map(e => `<pre>${esc(e)}\n<span class="cm">-- ${esc(run(e)).replace(/\n/g, "\n-- ")}</span></pre>`).join("")}</dd>`).join("\n")}
</dl>
</section>`;
};
const style = fs.readFileSync(path.join(__dirname, "index.html"), "utf8").match(/<style>[\s\S]*?<\/style>/)[0]
  .replace("</style>", "dl{margin:0}dt{margin:22px 0 4px}dt b{font-weight:600}dd{margin:0}dd p{color:var(--fg2);margin:0 0 8px}pre{margin:0 0 6px}\n.toc{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 8px}\nsection h2{font-size:15px;text-transform:none;letter-spacing:0;color:var(--fg);margin:56px 0 6px}\n</style>");
const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="The Sprout standard library: every module and word, with an example and its answer.">
<title>Sprout library</title>
${style}</head><body>
<main>
<h1><a href="./">Sprout</a></h1>
<p class="lede">The standard library: ${MODULES.length} modules, ${MODULES.reduce((n, m) => n + m.words.length, 0)} words, written in Sprout.</p>
<p>Each module is a cell whose fields are its words, there in every program: <code>ease out-cubic 0.5</code>, <code>stats median xs</code>, <code>grid path [g, start, goal, open]</code>. The source is in <code>lib/</code>, one file a module, and is worth reading: every word is a few lines. Every example below was run, and the comment under it is what it gave.</p>
<p class="toc">${MODULES.map(m => `<a href="#${m.name}">${m.name}</a>`).join(" ")}</p>
<p>Built into every value as well: the list, record, text and number words, endless lists, the literals, <code>parse</code>, <code>quote</code> and <code>script</code>. They are in <a href="play.html#spec">the spec</a> (decisions 99 to 104).</p>
${MODULES.map(section).join("\n")}
<footer>Sprout 3 &middot; the standard library (decision 105) &middot; <a href="./">home</a></footer>
</main>
</body></html>
`;
fs.writeFileSync(path.join(__dirname, "library.html"), page);
console.log("library.html:", MODULES.length, "modules,", MODULES.reduce((n, m) => n + m.words.length, 0), "words,", failures, "failing examples");
if (failures) process.exitCode = 1;
