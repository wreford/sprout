// The published games (decisions 114 and 124): games.json, and one file a game in games.d/, so that games made side by
// side never write the same file. node registry.js lists them.
const fs = require("fs"), path = require("path");
function games() {
  const all = JSON.parse(fs.readFileSync(path.join(__dirname, "games.json"), "utf8")), dir = path.join(__dirname, "games.d");
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) all[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  return all;
}
module.exports = { games };
if (require.main === module) console.log(Object.keys(games()).join("\n"));
