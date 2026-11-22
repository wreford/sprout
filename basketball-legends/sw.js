// Basketball Legends 8's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-basketball-legends-20261122-439a9b7";
const FILES = [
 "/basketball-legends/",
 "/basketball-legends/manifest.webmanifest",
 "/icons/basketball-legends-180.png",
 "/icons/basketball-legends-512.png",
 "/icons/basketball-legends-64.png",
 "/basketball-legends/sprout/eight.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/game.sp?v=20261122-439a9b7",
 "/basketball-legends/sprout/kernels.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/libs.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/live3.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/parse.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/sprout3.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/stdlib.js?v=20261122-439a9b7",
 "/basketball-legends/sprout/vendor/fonts/press-start-2p.woff2",
 "/basketball-legends/sprout/vendor/zzfx/zzfx.js",
 "/basketball-legends/sprout/words.js?v=20261122-439a9b7"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-basketball-legends-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
