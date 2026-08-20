const CACHE_NAME = 'quintasch-v5';
const ASSETS = [
  './',
  './index.html',
  './controller.html',
  './css/style.css',
  './fonts/fonts.css',
  './fonts/orbitron-400.ttf',
  './fonts/orbitron-700.ttf',
  './fonts/orbitron-900.ttf',
  './fonts/rajdhani-500.ttf',
  './fonts/rajdhani-600.ttf',
  './fonts/rajdhani-700.ttf',
  './js/app.js',
  './js/controller.js',
  './js/game.js',
  './js/audio.js',
  './js/config.js',
  './js/pocketbase-service.js',
  './js/lib/pocketbase.umd.js',
  './js/lib/qrcode.min.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install-Event - Cache befüllen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all static assets');
      // Verwende Map um Fehler bei einzelnen fehlenden Dateien zu überspringen (z.B. wenn Icons noch nicht da sind)
      return Promise.all(
        ASSETS.map(url => {
          return cache.add(url).catch(err => console.warn(`[Service Worker] Failed to cache: ${url}`, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate-Event - Alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch-Event - Network-First Strategie mit Cache-Fallback
self.addEventListener('fetch', (event) => {
  // Ignoriere PocketBase Realtime SSE (/api/realtime) oder externe API Aufrufe beim Caching
  const url = event.request.url;
  if (
    url.includes('/api/realtime') || 
    url.includes('chrome-extension') ||
    !url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache nur erfolgreiche GET-Anfragen der eigenen App
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        console.log('[Service Worker] Network request failed, serving from cache:', event.request.url, err);
        return caches.match(event.request);
      })
  );
});
