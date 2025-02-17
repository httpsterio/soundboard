const CACHE_NAME = 'soundboard-cache-v1';
const staticAssets = [
  'index.html',
  'style.css',
  'main.js',
  'audio.json',
  'supply.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fetch audio.json and extract audio file URLs
      return fetch('audio.json')
        .then(response => response.json())
        .then(data => {
          // Extract audio file URLs from the JSON
          const audioFiles = data.audio.map(item => item.file);
          // Combine static assets and audio files
          const urlsToCache = staticAssets.concat(audioFiles);
          return cache.addAll(urlsToCache);
        })
        .catch(err => {
          console.error('FAIL! Error fetching or parsing audio.json:', err);
          // In case of error, cache only the static assets.
          return cache.addAll(staticAssets);
        });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});