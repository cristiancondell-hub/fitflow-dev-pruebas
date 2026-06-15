const FITFLOW_CACHE = 'fitflow-prod-shell-2026-06-09-01';
const FITFLOW_CACHE_V2 = 'fitflow-prod-shell-2026-06-09-02';
const FITFLOW_CACHE_V3 = 'fitflow-prod-shell-2026-06-09-03';
const FITFLOW_CACHE_V6 = 'fitflow-prod-shell-2026-06-10-06';
const FITFLOW_CACHE_V7 = 'fitflow-prod-shell-2026-06-10-07';
const FITFLOW_CACHE_V8 = 'fitflow-prod-shell-2026-06-10-08';
const FITFLOW_CACHE_V9 = 'fitflow-prod-shell-2026-06-11-09';
const FITFLOW_APP_SHELL = [
  './fitflow.html',
  './fitflow_manifest.webmanifest'
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
    caches.open(FITFLOW_CACHE_V9)
      .then(cache => cache.addAll(FITFLOW_APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('fitflow-prod-shell-') && key !== FITFLOW_CACHE_V9)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(FITFLOW_CACHE_V9);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put('./fitflow.html', response.clone());
    return response;
  } catch (error) {
    return (await cache.match('./fitflow.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(FITFLOW_CACHE_V9);
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
