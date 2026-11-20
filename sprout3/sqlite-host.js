// SQLite as a host cell (decision 78), using the SQLite built into Node.
// Reads come back straight away as a cell of records; writes are effects, so inside update they are queued
// and carried out after it returns (decision 33), and they are dropped on replay.
//   db query "select * from atoms"
//   db query ["select * from atoms where zone = ?", [3]]
//   db run ["insert into log values (?, ?)", [t, msg]]
const S = require("./sprout3.js");

function sqliteCell(path) {
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(path || ":memory:");
  const split = a => {
    if (typeof a === "string") return [a, []];
    if (!S.isCell(a)) return [String(a), []];
    const ps = a.part(2);
    return [a.part(1), S.isCell(ps) ? S.partsOf(ps).map(v => v === true ? 1 : v === false ? 0 : v) : []];
  };
  const row = r => S.valueCellOf([], new Map(Object.entries(r)));
  const query = new S.Native("query", a => { const [sql, ps] = split(a); return new S.ValueCell(db.prepare(sql).all(...ps).map(row)); });
  const run = new S.Native("run", a => { const [sql, ps] = split(a); return S.effect(() => db.prepare(sql).run(...ps)); }, true);
  const cell = S.valueCellOf([], new Map([["query", query], ["run", run]]));
  cell.raw = db;
  return cell;
}
module.exports = { sqliteCell };
