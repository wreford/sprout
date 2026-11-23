// Tide Machine's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-tide-machine-20261123-4a553b4";
const FILES = [
 "/tide-machine/",
 "/tide-machine/manifest.webmanifest",
 "/icons/tide-machine-180.png",
 "/icons/tide-machine-512.png",
 "/icons/tide-machine-64.png",
 "/tide-machine/sprout/eight.js?v=20261123-4a553b4",
 "/tide-machine/sprout/game.sp?v=20261123-4a553b4",
 "/tide-machine/sprout/kernels.js?v=20261123-4a553b4",
 "/tide-machine/sprout/libs.js?v=20261123-4a553b4",
 "/tide-machine/sprout/live3.js?v=20261123-4a553b4",
 "/tide-machine/sprout/parse.js?v=20261123-4a553b4",
 "/tide-machine/sprout/skin.css?v=20261123-4a553b4",
 "/tide-machine/sprout/sprout3.js?v=20261123-4a553b4",
 "/tide-machine/sprout/stdlib.js?v=20261123-4a553b4",
 "/tide-machine/sprout/vendor/fonts/cinzel-700.woff2",
 "/tide-machine/sprout/vendor/fonts/press-start-2p.woff2",
 "/tide-machine/sprout/vendor/zzfx/zzfx.js",
 "/tide-machine/sprout/words.js?v=20261123-4a553b4"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-tide-machine-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
