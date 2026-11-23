// Fathom's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-fathom-20261123-ced2be4";
const FILES = [
 "/fathom/",
 "/fathom/manifest.webmanifest",
 "/icons/fathom-180.png",
 "/icons/fathom-512.png",
 "/icons/fathom-64.png",
 "/fathom/sprout/eight.js?v=20261123-ced2be4",
 "/fathom/sprout/game.sp?v=20261123-ced2be4",
 "/fathom/sprout/kernels.js?v=20261123-ced2be4",
 "/fathom/sprout/libs.js?v=20261123-ced2be4",
 "/fathom/sprout/live3.js?v=20261123-ced2be4",
 "/fathom/sprout/parse.js?v=20261123-ced2be4",
 "/fathom/sprout/skin.css?v=20261123-ced2be4",
 "/fathom/sprout/sprout3.js?v=20261123-ced2be4",
 "/fathom/sprout/stdlib.js?v=20261123-ced2be4",
 "/fathom/sprout/vendor/fonts/cinzel-700.woff2",
 "/fathom/sprout/vendor/fonts/press-start-2p.woff2",
 "/fathom/sprout/vendor/zzfx/zzfx.js",
 "/fathom/sprout/words.js?v=20261123-ced2be4"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-fathom-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
