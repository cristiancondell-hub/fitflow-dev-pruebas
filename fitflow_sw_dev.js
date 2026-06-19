const FITFLOW_CACHE_V13 = 'fitflow-dev-shell-2026-06-19-13';
const FITFLOW_APP_SHELL = [
  './fitflow_dev.html',
  './fitflow_manifest_dev.webmanifest',
  './icon-dev-192.png',
  './icon-dev-512.png',
  './apple-touch-icon-dev.png',
  './VALVE2.png'
];
const FITFLOW_STATIC_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'www.gstatic.com',
  'cdn.sheetjs.com',
  'cdnjs.cloudflare.com'
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(FITFLOW_CACHE_V13)
      .then(cache => cache.addAll(FITFLOW_APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('fitflow-dev-shell-') && key !== FITFLOW_CACHE_V13)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(FITFLOW_CACHE_V13);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put('./fitflow_dev.html', response.clone());
    return response;
  } catch (error) {
    return (await cache.match('./fitflow_dev.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FITFLOW_CACHE_V13);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (FITFLOW_STATIC_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
