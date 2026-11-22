self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    // the games keep their own caches for playing with no connection (sprout8-...): those are theirs, not ours to clear
    await Promise.all(keys.filter(function (k) { return k.indexOf('sprout8-') !== 0; }).map(function (k) { return caches.delete(k); }));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(function (c) { c.navigate(c.url); });
  })());
});
