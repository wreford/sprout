const CACHE='giga-phone-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE)
    .then(c=>c.addAll(['./','icon-180.png','icon-512.png']))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{
      const cp=r.clone();caches.open(CACHE).then(c=>c.put('./',cp));
      return r;
    }).catch(()=>caches.match('./')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
    if(r.ok&&(u.hostname.endsWith('gstatic.com')||u.hostname.endsWith('googleapis.com')||u.origin===location.origin)){
      const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));
    }
    return r;
  })));
});
