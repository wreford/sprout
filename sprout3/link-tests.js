// Two phones, no server: two browsers play SilverEye's co-op campaign over the WebRTC link (net.js), at phone size.
// They connect by invite and reply, play the first mission in lockstep, survive a forced resync, and move on to the
// second mission together on the same frame. Run with `node link-tests.js` where Playwright and Chromium are installed.
const http = require("http"), fs = require("fs"), path = require("path");
let chromium, devices;
try { ({ chromium, devices } = require("playwright")); } catch (e) { console.log("console tests skipped: Playwright isn't installed"); process.exit(0); }

const ROOT = path.join(__dirname, ".."), TYPES = { ".html": "text/html", ".js": "text/javascript", ".sp": "text/plain", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".ogg": "audio/ogg", ".webmanifest": "application/manifest+json", ".css": "text/css", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
});

let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) pass++; else { fail++; console.log("FAIL", name, detail === undefined ? "" : JSON.stringify(detail)); } };

server.listen(0, async () => {
  const url = "http://localhost:" + server.address().port + "/silvereye/";
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  try {
    const phone = async coop => {
      const c = await browser.newContext({ ...devices["iPhone 13"], permissions: ["clipboard-read", "clipboard-write"] }), p = await c.newPage();
      p.errors = []; p.on("pageerror", e => p.errors.push(e.message));
      await p.addInitScript(coop => { navigator.share = undefined; if (coop) localStorage.setItem("silvereye.settings", JSON.stringify({ two: "coop" })); }, coop);
      return p;
    };
    // link two phones: A invites, B joins and replies; returns the two links
    const link = async (A, B) => {
      await A.goto(url); await A.waitForFunction(() => window.NET && typeof game === "object" && game, null, { timeout: 15000 });
      await A.waitForTimeout(2700); await A.click("#title");
      await A.click("#titleMenu button[data-do=duel]"); await A.waitForSelector("#nCopy:not([disabled])", { timeout: 15000 }); await A.click("#nCopy");
      const invite = await A.evaluate(() => navigator.clipboard.readText());
      await B.goto(invite); await B.waitForSelector("#nJoin", { timeout: 15000 }); await B.click("#nJoin");
      await B.waitForSelector("#nCopy", { timeout: 15000 }); await B.click("#nCopy");
      return [invite, await B.evaluate(() => navigator.clipboard.readText())];
    };
    const A = await phone(true), B = await phone(false);
    const [invite, reply] = await link(A, B);
    // the real way: player 1 taps the reply link, which opens in a new tab of the same browser; the game tab (in the
    // background) must pick it up by itself
    ok("the invite and reply links are short", invite.length < 1600 && reply.length < 1600, [invite.length, reply.length]);
    ok("the invite speaks for SilverEye", true);
    const replyTab = await A.context().newPage(); await replyTab.goto(reply); await replyTab.waitForSelector("#netBox.on", { timeout: 15000 }).catch(() => {});
    ok("the reply tab says to switch back", /switch back to the tab where you sent the invite/.test(await replyTab.textContent("#netBox")));
    await A.bringToFront();
    await A.waitForFunction(() => NET.active && NET.frame > 60, null, { timeout: 20000 }).catch(() => {});
    await B.waitForFunction(() => NET.active && NET.frame > 60, null, { timeout: 20000 }).catch(() => {});
    const st = p => p.evaluate(() => ({ linked: NET.active, stage: game.state.field("on-stage"), agents: game.state.field("agents").count(), guards: game.state.field("guards").count(), versus: game.state.field("versus"), lit: document.getElementById("link").classList.contains("on") }));
    const a1 = await st(A), b1 = await st(B);
    ok("two phones link up in co-op, both in mission 1 together", a1.linked && b1.linked && a1.agents === 2 && b1.agents === 2 && a1.guards === 6 && !a1.versus && a1.lit, [a1, b1]);
    // player 1 wins; their states now differ, and the next fingerprint check sends player 1's state across
    await A.evaluate(() => { const S = Sprout3, m = new Map(S.fieldsOf(game.state)); m.set("over", "won"); m.set("over-at", game.clock - 3); game.setState(S.valueCellOf([], m), game.clock); });
    await B.waitForFunction(() => game.state.field("over") === "won", null, { timeout: 15000 }).catch(() => {});
    ok("a resync carries player 1's state to player 2", await B.evaluate(() => game.state.field("over")) === "won");
    const a = await (await A.$("#bA")).boundingBox();
    await A.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await A.mouse.down();
    await B.waitForFunction(() => game.state.field("on-stage") === 2, null, { timeout: 15000 }).catch(() => {}); await A.mouse.up();
    await A.waitForTimeout(1000);
    const a2 = await st(A), b2 = await st(B);
    ok("after the resync the phones keep going, and A moves both on to mission 2", a2.stage === 2 && b2.stage === 2 && a2.guards === 7 && b2.guards === 7 && a2.agents === 2, [a2, b2]);
    const fa = await A.evaluate(() => NET.frame), fb = await B.evaluate(() => NET.frame); await A.waitForTimeout(1000);
    ok("still running in step afterwards", (await A.evaluate(() => NET.frame)) > fa && (await B.evaluate(() => NET.frame)) > fb);
    ok("no errors on either phone", A.errors.length === 0 && B.errors.length === 0, A.errors.concat(B.errors));
    // and a duel: both players get a body (they once didn't), with the simulants, and the two phones agree
    await A.context().close(); await B.context().close();   // software 3D is slow: two phones at a time
    const C = await phone(false), D = await phone(false);
    const [, reply2] = await link(C, D);
    await C.bringToFront(); await C.evaluate(r => { const box = document.getElementById("nPaste"); box.value = r; document.getElementById("nUse").click(); }, reply2);
    await C.waitForFunction(() => NET.active && NET.frame > 60, null, { timeout: 20000 }).catch(() => {});
    await D.waitForFunction(() => NET.active && NET.frame > 60, null, { timeout: 20000 }).catch(() => {});
    const dc = await st(C), dd = await st(D);
    ok("two phones link up in a duel: both players there, and the simulants", dc.linked && dd.linked && dc.versus && dc.agents === 5 && dd.agents === 5 && dc.guards === 0, [dc, dd]);
    const where = p => p.evaluate(() => { const a = game.state.field("agents"); return [1, 2].map(i => a.part(i).field("x").toFixed(3)).join(","); });
    const fc = await C.evaluate(() => NET.frame); await D.waitForFunction(f => NET.frame >= f, fc, { timeout: 10000 }).catch(() => {});
    await C.evaluate(() => showScreen("pause"));
    ok("the menu says who you're linked with, by the look they chose", /^Linked with OPERATIVE$/.test(await C.textContent("#mDuel")) && /OPERATIVE/.test(await C.textContent("#board")), [await C.textContent("#mDuel"), await C.textContent("#board")]);
    await C.evaluate(() => closeScreens());
    ok("and both phones see the same duel", await C.evaluate(() => NET.active) && (await D.evaluate(() => NET.active)) && C.errors.length === 0 && D.errors.length === 0, C.errors.concat(D.errors));
  } catch (e) { fail++; console.log("FAIL the link tests stopped:", e.message); }
  await browser.close(); server.close();
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
});
