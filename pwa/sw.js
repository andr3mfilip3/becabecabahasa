const CACHE = 'beca-beca-bahasa-v22';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/data.js',
  'js/i18n.js',
  'js/speech.js',
  'js/exercises.js',
  'js/app.js',
  'icons/icon.svg',
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

// Fetch - serve from cache instantly, update cache in background
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const networkFetch = fetch(e.request).then(response => {
          cache.put(e.request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});
