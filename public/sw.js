const CACHE_NAME = 'checkin-v2';
const OFFLINE_URL = '/offline';

// App shell — pages that should work offline
const APP_SHELL = [
  '/',
  '/login',
  '/offline',
  '/athlete/dashboard',
  '/athlete/checkin',
  '/athlete/journal',
  '/athlete/trends',
  '/athlete/resources',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // Don't fail install if some dynamic routes aren't pre-cacheable
        console.warn('[SW] Pre-cache partial failure (expected):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Navigation requests: network-first, fall back to cache, then offline page
// - Static assets: cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip Supabase API calls — always go to network
  if (url.hostname.includes('supabase')) return;

  if (request.mode === 'navigate') {
    // Network-first for navigation
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache successful navigation responses
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        });
      })
    );
  }
});
