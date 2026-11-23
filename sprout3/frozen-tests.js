// node frozen-tests.js: every published game (games.json) runs on its own frozen copy of Sprout (decision 114). Each
// is loaded in a Node of its own from its folder, played for twenty seconds with buttons pressed now and then, and
// drawn; it must not throw or say anything.
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const SITE = path.join(__dirname, ".."), games = require("./registry.js").games();
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
// the screen of the game's console: SPROUT·8's, or SPROUT·16's (decision 125)
const g = L.makeGame(fs.readFileSync(dir + "/game.sp", "utf8"), { W: +process.argv[2] || 256, H: +process.argv[3] || 192, host: { saved: S.valueCellOf([], new Map()), console8: true } });
const keys = ["left", "right", "up", "down", "one", "two"];
let drawn = 0;
for (let t = 0; t < 1200; t++) {
  const held = new Map(); if (t % 40 < 3) held.set("two", true); if (t % 50 < 3) held.set("one", true); held.set(keys[Math.floor(t / 90) % 4], true);
  g.tick(1 / 60, S.valueCellOf([], held));
  if (t % 10 === 0) drawn += g.draw().length;
}
console.log(JSON.stringify({ logs: logs.slice(0, 5), drawn }));
`;
const plays = [];
for (const name of Object.keys(games)) {
  const dir = path.join(SITE, name, "sprout");
  ok(name + ": has its own copy of Sprout", fs.existsSync(path.join(dir, "VERSION")) && fs.existsSync(path.join(dir, "game.sp")));
  ok(name + ": its page loads its own copy", fs.existsSync(path.join(SITE, name, "index.html")) && fs.readFileSync(path.join(SITE, name, "index.html"), "utf8").includes(`<base href="/${name}/sprout/">`));
  // a local web app (decision 118): its service worker keeps every file the page needs, and each one is there
  const swPath = path.join(SITE, name, "sw.js");
  const kept = fs.existsSync(swPath) ? JSON.parse(fs.readFileSync(swPath, "utf8").match(/const FILES = (\[[\s\S]*?\]);/)[1]) : [];
  const onDisk = u => { const rel = u.split("?")[0]; return fs.existsSync(path.join(SITE, rel.endsWith("/") ? rel + "index.html" : rel)); };
  ok(name + ": keeps every file it needs for playing with no connection", kept.length > 10 && kept.every(onDisk) && kept.includes(`/${name}/sprout/game.sp?v=` + kept.find(u => u.includes("game.sp")).split("?v=")[1]), kept.filter(u => !onDisk(u)));
  const manifest = JSON.parse(fs.readFileSync(path.join(SITE, name, "manifest.webmanifest"), "utf8"));
  ok(name + ": installs as an app of its own", manifest.display === "standalone" && manifest.scope === `/${name}/` && fs.readFileSync(path.join(SITE, name, "index.html"), "utf8").includes(`register("/${name}/sw.js"`));
  plays.push(name);
}
// each game plays in a Node of its own, four at a time
(async () => {
  const { execFile } = require("child_process"), queue = plays.slice();
  const one = async () => { for (let name; (name = queue.shift());) {
    const screen = Array.isArray(games[name].screen) ? games[name].screen.map(String) : games[name].bits === 256 ? ["480", "270"] : games[name].bits === 16 ? ["320", "224"] : ["256", "192"];
    const res = await new Promise(done => execFile("node", ["-e", PLAY, path.join(SITE, name, "sprout"), ...screen], { timeout: 120000 }, (e, out) => {
      if (e) return done({ error: String(e.message).slice(0, 300) });
      try { done(JSON.parse(String(out).trim().split("\n").pop())); } catch (err) { done({ error: String(out).slice(0, 300) }); } }));
    ok(name + ": plays twenty seconds on its own copy, quietly", res && !res.error && res.logs.length === 0 && res.drawn > 100, res);
  } };
  await Promise.all([one(), one(), one(), one()]);
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
