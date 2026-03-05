const CACHE = 'beca-beca-bahasa-__BUILD_VERSION__';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/data.js',
  '/js/i18n.js',
  '/js/speech.js',
  '/js/exercises.js',
  '/js/app.js',
  '/icons/icon.svg',
];

// Install - cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - network-first for HTML, stale-while-revalidate for assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache the service worker itself
  if (url.pathname === '/sw.js') {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  // Network-first for HTML navigations
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(e.request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(e.request);
        return cached || caches.match('/index.html');
      }
    })());
    return;
  }

  // Stale-while-revalidate for everything else (CSS/JS/images)
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request);
    const networkFetch = fetch(e.request).then((res) => {
      if (res && res.status === 200) {
        cache.put(e.request, res.clone());
      }
      return res;
    }).catch(() => null);
    return cached || (await networkFetch);
  })());
});