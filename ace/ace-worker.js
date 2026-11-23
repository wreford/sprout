// Runs an ACE example that only prints, away from the page's main thread, and sends back what it printed.
// These are the playground's own Sprout files; kernels.js lets spork run ace-risk's million runs as one SIMD kernel,
// and ace-ledger's SQLite (sql.js) is loaded the first time a program uses db. The page's database is its own,
// named "ace-page" and kept in this browser, apart from the playground's.
"use strict";
const V = "20261123a", SP = "../sprout3/";
importScripts(...["sprout3.js", "words.js", "parse.js", "stdlib.js", "libs.js", "kernels.js"].map(f => SP + f + "?v=" + V));
const S = self.Sprout3;
const needsDb = src => /(^|[\s\[(])db\s+(query|run)\b/m.test(src);
let dbP = null;
const openDb = () => dbP || (dbP = (async () => {
  importScripts(SP + "vendor/sqljs/sql-wasm.js?v=" + V, SP + "sqlite-web.js?v=" + V);
  return S.globals.db = await self.SproutSqlite.openSqlite({ base: SP + "vendor/sqljs/", name: "ace-page" });
})().catch(e => { dbP = null; throw e; }));

async function run({ id, src, clear }) {
  const lines = [];
  S.setOut(s => lines.push({ s: String(s) }));
  S.setLog(m => lines.push({ s: String(m), note: true }));
  try {
    if (needsDb(src)) { const db = await openDb(); if (clear) await db.clear(); }
    if (S.sporkTally) S.sporkTally(true);
    const t0 = performance.now();
    S.load(src).run(S.BANG);
    postMessage({ id, ok: true, lines, ms: performance.now() - t0, sporks: S.sporkTally ? S.sporkTally().map(x => ({ n: x.n, how: x.how, ms: x.ms })) : [] });
  } catch (e) {
    postMessage({ id, ok: false, lines, error: String(e && e.message || e), line: e && e.line || 0 });
  }
}
// one program at a time, in the order they were asked for
let queue = Promise.resolve();
onmessage = e => { queue = queue.then(() => run(e.data)); };
