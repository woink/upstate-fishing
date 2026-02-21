// Service Worker for Upstate Fishing PWA
// Strategy: cache-first for static assets, network-first for pages/API

const CACHE_NAME = 'upstate-fishing-v1';

const PRECACHE_URLS = [
  '/',
  '/styles.css',
  '/leaflet/leaflet.js',
  '/leaflet/leaflet.css',
  '/leaflet/marker-icon.png',
  '/leaflet/marker-icon-2x.png',
  '/leaflet/marker-shadow.png',
  '/leaflet/layers.png',
  '/leaflet/layers-2x.png',
  '/icons/icon-192.png',
  '/manifest.json',
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      )
    ),
  );
  self.clients.claim();
});

// Fetch: route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API routes: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Static assets (CSS, JS, images): cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML pages: network-first for fresh SSR content
  event.respondWith(networkFirst(event.request));
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/leaflet/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.ico')
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return new Response(OFFLINE_HTML, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Offline', { status: 503 });
  }
}

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upstate Fishing - Offline</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; }
    nav { background: #15803d; color: white; padding: 12px 16px; }
    nav a { color: white; text-decoration: none; font-weight: bold; font-size: 1.25rem; }
    .content { max-width: 600px; margin: 80px auto; text-align: center; padding: 0 16px; }
    h1 { color: #1e293b; font-size: 1.5rem; }
    p { color: #64748b; line-height: 1.6; }
    button { background: #15803d; color: white; border: none; padding: 12px 24px;
             border-radius: 6px; font-size: 1rem; cursor: pointer; margin-top: 16px; }
    button:hover { background: #166534; }
  </style>
</head>
<body>
  <nav><a href="/">🎣 Upstate Fishing</a></nav>
  <div class="content">
    <h1>You're offline</h1>
    <p>The last-known conditions will load when you're back online.
       Check your connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>`;
