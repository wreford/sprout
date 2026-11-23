// Headstrong's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-headstrong-20261122-83af820";
const FILES = [
 "/headstrong/",
 "/headstrong/manifest.webmanifest",
 "/icons/headstrong-180.png",
 "/icons/headstrong-512.png",
 "/icons/headstrong-64.png",
 "/headstrong/sprout/eight.js?v=20261122-83af820",
 "/headstrong/sprout/game.sp?v=20261122-83af820",
 "/headstrong/sprout/kernels.js?v=20261122-83af820",
 "/headstrong/sprout/libs.js?v=20261122-83af820",
 "/headstrong/sprout/live3.js?v=20261122-83af820",
 "/headstrong/sprout/parse.js?v=20261122-83af820",
 "/headstrong/sprout/skin.css?v=20261122-83af820",
 "/headstrong/sprout/sprout3.js?v=20261122-83af820",
 "/headstrong/sprout/stdlib.js?v=20261122-83af820",
 "/headstrong/sprout/vendor/fonts/lilita-one-400.woff2",
 "/headstrong/sprout/vendor/fonts/press-start-2p.woff2",
 "/headstrong/sprout/vendor/zzfx/zzfx.js",
 "/headstrong/sprout/words.js?v=20261122-83af820"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-headstrong-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
