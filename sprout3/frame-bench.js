// ms per frame (update + draw) for each example game: node frame-bench.js
const S = require("./sprout3.js"), L = require("./live3.js"), fs = require("fs");
S.setLog(() => {});
const games = ["sprout", "bounce", "snake", "breakout", "particles", "fireflies", "orbit", "life", "hop", "galaxy"];
const rows = [];
for (const name of games) {
  const g = L.makeGame(fs.readFileSync(__dirname + "/examples/" + name + ".sp", "utf8"));
  const play = n => { for (let t = 0; t < n; t++) { if (t % 50 === 0) g.down(100 + (t % 160), 300); if (t % 50 === 25) g.up(); g.tick(1 / 60); g.draw(); } };
  play(300);
  let best = 1e9;
  for (let r = 0; r < 7; r++) { const t0 = performance.now(); play(300); best = Math.min(best, (performance.now() - t0) / 300); }
  const st = g.state, size = name === "particles" ? st.field("sparks").count() : "";
  rows.push([name, best.toFixed(4), size]);
}
console.log("game        ms/frame   (16.7 ms budget)");
for (const r of rows) console.log(r[0].padEnd(11), r[1].padStart(8), r[2] ? "  " + r[2] + " particles" : "");
