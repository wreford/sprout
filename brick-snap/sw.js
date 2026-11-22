// Brick Snap's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-brick-snap-20261122-51196ab";
const FILES = [
 "/brick-snap/",
 "/brick-snap/manifest.webmanifest",
 "/icons/brick-snap-180.png",
 "/icons/brick-snap-512.png",
 "/icons/brick-snap-64.png",
 "/brick-snap/sprout/eight.js?v=20261122-51196ab",
 "/brick-snap/sprout/game.sp?v=20261122-51196ab",
 "/brick-snap/sprout/kernels.js?v=20261122-51196ab",
 "/brick-snap/sprout/libs.js?v=20261122-51196ab",
 "/brick-snap/sprout/live3.js?v=20261122-51196ab",
 "/brick-snap/sprout/parse.js?v=20261122-51196ab",
 "/brick-snap/sprout/skin.css?v=20261122-51196ab",
 "/brick-snap/sprout/sprout3.js?v=20261122-51196ab",
 "/brick-snap/sprout/stdlib.js?v=20261122-51196ab",
 "/brick-snap/sprout/vendor/fonts/lilita-one-400.woff2",
 "/brick-snap/sprout/vendor/fonts/press-start-2p.woff2",
 "/brick-snap/sprout/vendor/zzfx/zzfx.js",
 "/brick-snap/sprout/words.js?v=20261122-51196ab"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-brick-snap-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
