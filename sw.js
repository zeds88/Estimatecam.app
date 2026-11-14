// Precache the required shell on the first visit. The build generates this list
// from static entry imports; optional AI/analytics downloads are not precached.
importScripts('./precache-manifest.js')
const SCOPE = self.registration.scope
const PREFIX = `jobcam:${SCOPE}:`
const CACHE = `${PREFIX}${self.__JOBCAM_PRECACHE.version}`
const SHELL = new URL('./', SCOPE).href

// Offline-capable without ever pinning users to an old build:
//  - page loads: network first (fresh deploys show up immediately), cache only as offline fallback
//  - hashed /assets/*: cache first (content-addressed, safe to keep forever)
//  - everything else same-origin: stale-while-revalidate
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(self.__JOBCAM_PRECACHE.files.map((file) => new URL(file, SCOPE).href)))
    .then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || !url.href.startsWith(SCOPE)) return
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    if (req.mode === 'navigate') {
      try { const res = await fetch(req); if (res.ok) await cache.put(req, res.clone()); return res } catch { return (await cache.match(req)) || (await cache.match(SHELL)) || Response.error() }
    }
    const hit = await cache.match(req)
    if (hit && url.pathname.includes('/assets/')) return hit
    const net = fetch(req).then(async (res) => { if (res.ok) await cache.put(req, res.clone()); return res }).catch(() => hit)
    e.waitUntil(net.then(() => {}))
    return hit || net
  })())
})
