// Blended Zebra 8's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-blended-zebra-20261122-cb3cf4a";
const FILES = [
 "/blended-zebra/",
 "/blended-zebra/manifest.webmanifest",
 "/icons/blended-zebra-180.png",
 "/icons/blended-zebra-512.png",
 "/icons/blended-zebra-64.png",
 "/blended-zebra/sprout/eight.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/game.sp?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/kernels.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/libs.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/live3.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/parse.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/sprout3.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/stdlib.js?v=20261122-cb3cf4a",
 "/blended-zebra/sprout/vendor/fonts/press-start-2p.woff2",
 "/blended-zebra/sprout/vendor/fonts/sora-800.woff2",
 "/blended-zebra/sprout/vendor/zzfx/zzfx.js",
 "/blended-zebra/sprout/words.js?v=20261122-cb3cf4a"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-blended-zebra-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
