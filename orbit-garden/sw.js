// Orbit Garden's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-orbit-garden-20261123-5853af8";
const FILES = [
 "/orbit-garden/",
 "/orbit-garden/manifest.webmanifest",
 "/icons/orbit-garden-180.png",
 "/icons/orbit-garden-512.png",
 "/icons/orbit-garden-64.png",
 "/orbit-garden/sprout/eight.js?v=20261123-5853af8",
 "/orbit-garden/sprout/game.sp?v=20261123-5853af8",
 "/orbit-garden/sprout/kernels.js?v=20261123-5853af8",
 "/orbit-garden/sprout/libs.js?v=20261123-5853af8",
 "/orbit-garden/sprout/live3.js?v=20261123-5853af8",
 "/orbit-garden/sprout/parse.js?v=20261123-5853af8",
 "/orbit-garden/sprout/sprout3.js?v=20261123-5853af8",
 "/orbit-garden/sprout/stdlib.js?v=20261123-5853af8",
 "/orbit-garden/sprout/vendor/fonts/press-start-2p.woff2",
 "/orbit-garden/sprout/vendor/fonts/sora-800.woff2",
 "/orbit-garden/sprout/words.js?v=20261123-5853af8"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-orbit-garden-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
