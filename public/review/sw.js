/* Offline image review for Kuladeep Mantri. Each mode has its own cache. */
'use strict';
importScripts('./assets/cache-list.js');
const MODE = new URL(self.location.href).searchParams.get('mode');
const FILES = self.CACHE_FILES_BY_MODE[MODE];
const CACHE = 'kmr-review-' + self.CACHE_VERSION + '-' + MODE;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (!FILES) throw new Error('Unknown mode');
    const cache = await caches.open(CACHE);
    const urls = FILES.map(file => new URL(file,self.registration.scope).href);
    for (let i = 0; i < urls.length; i += 6) {
      await cache.addAll(urls.slice(i,i+6));
      const clients = await self.clients.matchAll({includeUncontrolled:true});
      clients.forEach(client => client.postMessage({type:'cache-progress',mode:MODE,done:Math.min(i+6,urls.length),total:urls.length}));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => { const cache = await caches.open(CACHE); const hit = await cache.match(event.request,{ignoreSearch:true}); return hit || fetch(event.request); })());
});
