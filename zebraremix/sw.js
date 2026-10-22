/* Blended Zebra · offline service worker
   v2: the game shell updates network-first — installed players get new
   versions immediately when online, and the cache only serves offline. */
const CACHE = 'zebra-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './snd/shot1.wav', './snd/shot2.wav', './snd/key.wav', './snd/numkey.wav', './snd/pickup.wav',
  './snd/lazer.wav', './snd/squit.wav', './snd/explosion.mp3', './snd/blaster.mp3'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isShell = e.request.mode === 'navigate' ||
    (url.origin === location.origin && /\/(index\.html)?$/.test(url.pathname));
  if (isShell){
    /* network-first: fresh game when online, cached game when not */
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200){
          const copy = res.clone();
          caches.open(CACHE).then(c => { c.put('./index.html', copy.clone()); c.put('./', copy); });
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  /* static assets: cache-first, stash successes (incl. fonts + JTM art drops) */
  e.respondWith(
    caches.match(e.request, { ignoreSearch: url.origin === location.origin }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && (url.origin === location.origin || /gstatic|googleapis/.test(url.host))){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
