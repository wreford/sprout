// Fizz Jar's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-fizz-jar-20261122-03e23a2";
const FILES = [
 "/fizz-jar/",
 "/fizz-jar/manifest.webmanifest",
 "/icons/fizz-jar-180.png",
 "/icons/fizz-jar-512.png",
 "/icons/fizz-jar-64.png",
 "/fizz-jar/sprout/eight.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/game.sp?v=20261122-03e23a2",
 "/fizz-jar/sprout/kernels.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/libs.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/live3.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/parse.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/skin.css?v=20261122-03e23a2",
 "/fizz-jar/sprout/sprout3.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/stdlib.js?v=20261122-03e23a2",
 "/fizz-jar/sprout/vendor/fonts/fredoka-600.woff2",
 "/fizz-jar/sprout/vendor/fonts/press-start-2p.woff2",
 "/fizz-jar/sprout/vendor/zzfx/zzfx.js",
 "/fizz-jar/sprout/words.js?v=20261122-03e23a2"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-fizz-jar-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
