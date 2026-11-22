// Lily and Chester's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-lily-and-chester-20261122-92f7c60";
const FILES = [
 "/lily-and-chester/",
 "/lily-and-chester/manifest.webmanifest",
 "/icons/lily-and-chester-180.png",
 "/icons/lily-and-chester-512.png",
 "/icons/lily-and-chester-64.png",
 "/lily-and-chester/sprout/eight.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/game.sp?v=20261122-92f7c60",
 "/lily-and-chester/sprout/kernels.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/libs.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/live3.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/parse.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/skin.css?v=20261122-92f7c60",
 "/lily-and-chester/sprout/sprout3.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/stdlib.js?v=20261122-92f7c60",
 "/lily-and-chester/sprout/vendor/fonts/pacifico-400.woff2",
 "/lily-and-chester/sprout/vendor/fonts/press-start-2p.woff2",
 "/lily-and-chester/sprout/vendor/zzfx/zzfx.js",
 "/lily-and-chester/sprout/words.js?v=20261122-92f7c60"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-lily-and-chester-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
