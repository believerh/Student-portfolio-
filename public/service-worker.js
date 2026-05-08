const CACHE_NAME = 'student-portfolio-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/offline.html',
];

const RUNTIME_ASSETS = [
  // Cached on first fetch
  `${process.env.PUBLIC_URL}/static/css/main.css`,
  `${process.env.PUBLIC_URL}/static/js/main.js`,
];

// Install: cache static + runtime assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for documents (ensure fresh UI)
// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Supabase requests
  if (request.method !== 'GET' || url.origin.includes('supabase.co')) return;

  // Static assets: cache-first
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Other requests: try network, fall back to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Background sync placeholder (for future offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-uploads') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Future: queue and flush offline uploads when back online
  console.log('Background sync triggered');
}

// Push notification handling
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Student Portfolio';
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    ...data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
