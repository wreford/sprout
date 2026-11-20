// SQLite in the browser as a host cell (decision 78), using sql.js (SQLite compiled to WebAssembly, in vendor/sqljs).
// It is the same cell sqlite-host.js gives Node: reads come back straight away as a cell of records;
// writes are effects, so inside update they are queued, carried out after it, and dropped on replay (decision 33).
//   db query "select * from atoms"
//   db query ["select * from atoms where zone = ?", [3]]
//   db run ["insert into log values (?, ?)", [t, msg]]
// The database is kept in this browser (IndexedDB), saved shortly after each write.
(function (root) {
"use strict";
const S = root.Sprout3;
const IDB = "sprout3-sqlite", STORE = "files";

function idb() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
async function loadBytes(name) {
  try { const d = await idb(); return await new Promise(ok => { const t = d.transaction(STORE).objectStore(STORE).get(name); t.onsuccess = () => ok(t.result || null); t.onerror = () => ok(null); }); }
  catch (e) { return null; }
}
async function saveBytes(name, bytes) {
  try { const d = await idb(); await new Promise(ok => { const t = d.transaction(STORE, "readwrite"); if (bytes) t.objectStore(STORE).put(bytes, name); else t.objectStore(STORE).delete(name); t.oncomplete = ok; t.onerror = ok; }); }
  catch (e) {}
}

// SQL values into Sprout values: there is no null in Sprout, so null is false (decision 21)
const fromSql = v => v === null || v === undefined ? false : v instanceof Uint8Array ? "[" + v.length + " bytes]" : v;
// Sprout values into SQL values: true and false are 1 and 0, anything else that isn't a number or text is its printed form
const toSql = v => v === true ? 1 : v === false ? 0 : typeof v === "number" || typeof v === "string" ? v : S.fmt(v);
// the argument of query and run: "sql", or ["sql", [params]]
function split(a) {
  if (typeof a === "string") return [a, []];
  if (!S.isCell(a)) return [String(a), []];
  const ps = a.part(2);
  return [String(a.part(1)), S.isCell(ps) ? S.partsOf(ps).map(toSql) : []];
}

let SQLP = null;
function sqljs(base) { return SQLP || (SQLP = root.initSqlJs({ locateFile: f => base + f })); }

async function openSqlite(opts) {
  opts = opts || {};
  const SQL = await sqljs(opts.base || "vendor/sqljs/");
  const name = opts.name || "sprout3";
  const bytes = opts.fresh ? null : await loadBytes(name);
  let db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  let saveT = 0, writes = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => saveBytes(name, db.export()), 300); };

  // every row of one query shares one field shape, so the records are cheap to make and to read
  const query = new S.Native("query", a => {
    const [sql, ps] = split(a), st = db.prepare(sql), out = [];
    try {
      st.bind(ps); let keys = null;
      while (st.step()) { if (!keys) keys = st.getColumnNames(); const vals = st.get(); out.push(S.VFM([], new Map(keys.map((k, i) => [k, fromSql(vals[i])])))); }
    } finally { st.free(); }
    return new S.VCell(out);
  });
  const run = new S.Native("run", a => {
    const [sql, ps] = split(a);
    return S.effect(() => { db.run(sql, ps); writes++; save(); if (opts.onWrite) opts.onWrite(sql); });
  }, true);

  const cell = S.VFM([], new Map([["query", query], ["run", run]]));
  cell.raw = () => db;
  cell.writes = () => writes;
  // what's in it: each table and how many rows it has
  cell.tables = () => {
    const t = db.exec("select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name");
    return t.length ? t[0].values.map(([n]) => [n, db.exec("select count(*) from \"" + String(n).replace(/"/g, '""') + "\"")[0].values[0][0]]) : [];
  };
  // start again with an empty database
  cell.clear = async () => { clearTimeout(saveT); db.close(); db = new SQL.Database(); await saveBytes(name, null); };
  return cell;
}

root.SproutSqlite = { openSqlite, fromSql, toSql };
})(typeof window !== "undefined" ? window : globalThis);
