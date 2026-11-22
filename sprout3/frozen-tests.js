// node frozen-tests.js: every published game (games.json) runs on its own frozen copy of Sprout (decision 114). Each
// is loaded in a Node of its own from its folder, played for twenty seconds with buttons pressed now and then, and
// drawn; it must not throw or say anything.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const SITE = path.join(__dirname, ".."), games = JSON.parse(fs.readFileSync(path.join(__dirname, "games.json"), "utf8"));
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log("FAIL", name, extra === undefined ? "" : extra); } };
const PLAY = `
const dir = process.argv[1], S = require(dir + "/sprout3.js"); require(dir + "/words.js"); require(dir + "/parse.js"); require(dir + "/stdlib.js"); require(dir + "/libs.js");
const L = require(dir + "/live3.js"), fs = require("fs");
{ let seed = 4242; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const logs = []; S.setLog(m => logs.push(m));
// wrapped libraries that only work in a browser get quiet stand-ins with the same words
for (const name of S.libraries.mentions(fs.readFileSync(dir + "/game.sp", "utf8"))) {
  if (!S.libraries.LIBRARIES[name].browserOnly) continue;
  const quiet = w => new S.Native(w, () => S.effect(() => {}), true);
  const words = Object.keys(S.libraries.LIBRARIES[name].words({}));
  Object.defineProperty(S.globals, name, { value: S.valueCellOf([], new Map(words.map(w => [w, quiet(w)]))), configurable: true, writable: true, enumerable: true });
}
const g = L.makeGame(fs.readFileSync(dir + "/game.sp", "utf8"), { W: 256, H: 192, host: { saved: S.valueCellOf([], new Map()), console8: true } });
const keys = ["left", "right", "up", "down", "one", "two"];
let drawn = 0;
for (let t = 0; t < 1200; t++) {
  const held = new Map(); if (t % 40 < 3) held.set("two", true); if (t % 50 < 3) held.set("one", true); held.set(keys[Math.floor(t / 90) % 4], true);
  g.tick(1 / 60, S.valueCellOf([], held));
  if (t % 10 === 0) drawn += g.draw().length;
}
console.log(JSON.stringify({ logs: logs.slice(0, 5), drawn }));
`;
for (const name of Object.keys(games)) {
  const dir = path.join(SITE, name, "sprout");
  ok(name + ": has its own copy of Sprout", fs.existsSync(path.join(dir, "VERSION")) && fs.existsSync(path.join(dir, "game.sp")));
  ok(name + ": its page loads its own copy", fs.existsSync(path.join(SITE, name, "index.html")) && fs.readFileSync(path.join(SITE, name, "index.html"), "utf8").includes(`<base href="/${name}/sprout/">`));
  let res = null;
  try { res = JSON.parse(execFileSync("node", ["-e", PLAY, dir], { timeout: 120000 }).toString().trim().split("\n").pop()); } catch (e) { res = { error: String(e.message).slice(0, 300) }; }
  ok(name + ": plays twenty seconds on its own copy, quietly", res && !res.error && res.logs.length === 0 && res.drawn > 100, res);
}
console.log(pass + " passed, " + fail + " failed");
