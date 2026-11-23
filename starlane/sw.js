// Starlane 2025's own service worker (decision 118): it keeps every file the game needs, so the game opens and plays
// with no connection, like an app on the phone. Written by sprout3/freeze.js; a new freezing gives it a new name.
const NAME = "sprout8-starlane-20261123-644d1d6";
const FILES = [
 "/starlane/",
 "/starlane/manifest.webmanifest",
 "/icons/starlane-180.png",
 "/icons/starlane-512.png",
 "/icons/starlane-64.png",
 "/starlane/sprout/eight.js?v=20261123-644d1d6",
 "/starlane/sprout/game.sp?v=20261123-644d1d6",
 "/starlane/sprout/kernels.js?v=20261123-644d1d6",
 "/starlane/sprout/libs.js?v=20261123-644d1d6",
 "/starlane/sprout/live3.js?v=20261123-644d1d6",
 "/starlane/sprout/parse.js?v=20261123-644d1d6",
 "/starlane/sprout/sprout3.js?v=20261123-644d1d6",
 "/starlane/sprout/stdlib.js?v=20261123-644d1d6",
 "/starlane/sprout/vendor/fonts/orbitron-900.woff2",
 "/starlane/sprout/vendor/fonts/press-start-2p.woff2",
 "/starlane/sprout/vendor/zzfx/zzfx.js",
 "/starlane/sprout/words.js?v=20261123-644d1d6"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(NAME).then(c => c.addAll(FILES))); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sprout8-starlane-") && k !== NAME) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(kept => kept || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(NAME).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
