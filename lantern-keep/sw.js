// Lantern Keep's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-lantern-keep-20261122-1580910";
const FILES = [
 "/lantern-keep/",
 "/lantern-keep/manifest.webmanifest",
 "/icons/lantern-keep-180.png",
 "/icons/lantern-keep-512.png",
 "/icons/lantern-keep-64.png",
 "/lantern-keep/sprout/eight.js?v=20261122-1580910",
 "/lantern-keep/sprout/game.sp?v=20261122-1580910",
 "/lantern-keep/sprout/kernels.js?v=20261122-1580910",
 "/lantern-keep/sprout/libs.js?v=20261122-1580910",
 "/lantern-keep/sprout/live3.js?v=20261122-1580910",
 "/lantern-keep/sprout/parse.js?v=20261122-1580910",
 "/lantern-keep/sprout/sprout3.js?v=20261122-1580910",
 "/lantern-keep/sprout/stdlib.js?v=20261122-1580910",
 "/lantern-keep/sprout/vendor/fonts/cinzel-700.woff2",
 "/lantern-keep/sprout/vendor/fonts/press-start-2p.woff2",
 "/lantern-keep/sprout/vendor/zzfx/zzfx.js",
 "/lantern-keep/sprout/words.js?v=20261122-1580910"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-lantern-keep-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
