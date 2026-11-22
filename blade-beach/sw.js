// Blade Beach '90's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-blade-beach-20261122-ea4ba74";
const FILES = [
 "/blade-beach/",
 "/blade-beach/manifest.webmanifest",
 "/icons/blade-beach-180.png",
 "/icons/blade-beach-512.png",
 "/icons/blade-beach-64.png",
 "/blade-beach/sprout/eight.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/game.sp?v=20261122-ea4ba74",
 "/blade-beach/sprout/kernels.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/libs.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/live3.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/parse.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/skin.css?v=20261122-ea4ba74",
 "/blade-beach/sprout/sprout3.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/stdlib.js?v=20261122-ea4ba74",
 "/blade-beach/sprout/vendor/fonts/orbitron-900.woff2",
 "/blade-beach/sprout/vendor/fonts/press-start-2p.woff2",
 "/blade-beach/sprout/vendor/zzfx/zzfx.js",
 "/blade-beach/sprout/words.js?v=20261122-ea4ba74"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-blade-beach-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
