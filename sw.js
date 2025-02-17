const CACHE_NAME = 'soundboard-cache-v1';

// List of static assets to cache (besides the audio files)
const staticAssets = [
  '/',                // Root (if applicable)
  '/index.html',      // Main HTML file
  '/style.css',       // CSS file
  '/main.js',         // Main JavaScript file
  '/audio.json'       // JSON configuration file
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Fetch audio.json and extract audio file URLs
      return fetch('/audio.json')
        .then(response => response.json())
        .then(data => {
          // Assume your JSON has an "audio" array with objects that have a "file" property.
          const audioFiles = data.audio.map(item => item.file);
          // Combine static assets and audio files
          const urlsToCache = staticAssets.concat(audioFiles);
          return cache.addAll(urlsToCache);
        })
        .catch(err => {
          console.error('Error fetching or parsing audio.json:', err);
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
