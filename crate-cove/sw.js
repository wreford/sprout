// Crate Cove's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-crate-cove-20261122-1580910";
const FILES = [
 "/crate-cove/",
 "/crate-cove/manifest.webmanifest",
 "/icons/crate-cove-180.png",
 "/icons/crate-cove-512.png",
 "/icons/crate-cove-64.png",
 "/crate-cove/sprout/eight.js?v=20261122-1580910",
 "/crate-cove/sprout/game.sp?v=20261122-1580910",
 "/crate-cove/sprout/kernels.js?v=20261122-1580910",
 "/crate-cove/sprout/libs.js?v=20261122-1580910",
 "/crate-cove/sprout/live3.js?v=20261122-1580910",
 "/crate-cove/sprout/parse.js?v=20261122-1580910",
 "/crate-cove/sprout/sprout3.js?v=20261122-1580910",
 "/crate-cove/sprout/stdlib.js?v=20261122-1580910",
 "/crate-cove/sprout/vendor/fonts/lilita-one-400.woff2",
 "/crate-cove/sprout/vendor/fonts/press-start-2p.woff2",
 "/crate-cove/sprout/vendor/zzfx/zzfx.js",
 "/crate-cove/sprout/words.js?v=20261122-1580910"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-crate-cove-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
