// IronPulse Service Worker (Network-First PWA Engine)
// Version 2.1.0 - Ensures instant live updates on GitHub Pages with zero stale cache lock

const CACHE_NAME = 'ironpulse-v2.1.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css?v=2.1.0',
  './icons/icon.svg',
  './js/storage.js?v=2.1.0',
  './js/theme.js?v=2.1.0',
  './js/sound.js?v=2.1.0',
  './js/quotes.js?v=2.1.0',
  './js/streak.js?v=2.1.0',
  './js/workout.js?v=2.1.0',
  './js/timer.js?v=2.1.0',
  './js/tasks.js?v=2.1.0',
  './js/nutrition.js?v=2.1.0',
  './js/metrics.js?v=2.1.0',
  './js/charts.js?v=2.1.0',
  './js/app.js?v=2.1.0'
];

// Install: precache core assets and take over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up ALL old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[IronPulse SW] Purging old cache version:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Skip waiting on demand
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data === 'skipWaiting')) {
    self.skipWaiting();
  }
});

// Fetch: NETWORK-FIRST STRATEGY
// When online, always fetch fresh files from server so user sees updates immediately.
// If offline, seamlessly serve from cached assets.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
