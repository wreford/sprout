// Sprig's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-sprig-20261122-1580910";
const FILES = [
 "/sprig/",
 "/sprig/manifest.webmanifest",
 "/icons/sprig-180.png",
 "/icons/sprig-512.png",
 "/icons/sprig-64.png",
 "/sprig/sprout/eight.js?v=20261122-1580910",
 "/sprig/sprout/game.sp?v=20261122-1580910",
 "/sprig/sprout/kernels.js?v=20261122-1580910",
 "/sprig/sprout/libs.js?v=20261122-1580910",
 "/sprig/sprout/live3.js?v=20261122-1580910",
 "/sprig/sprout/parse.js?v=20261122-1580910",
 "/sprig/sprout/sprout3.js?v=20261122-1580910",
 "/sprig/sprout/stdlib.js?v=20261122-1580910",
 "/sprig/sprout/vendor/fonts/fredoka-600.woff2",
 "/sprig/sprout/vendor/fonts/press-start-2p.woff2",
 "/sprig/sprout/vendor/zzfx/zzfx.js",
 "/sprig/sprout/words.js?v=20261122-1580910"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-sprig-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
