// Service worker for "مدیریت نانوایی" — lets the app open instantly and work
// offline once it has been visited at least once over a proper https connection.
// Bump CACHE_NAME whenever you upload a new version of index.html so
// visitors get the fresh copy instead of a stale cached one.
const CACHE_NAME = 'bakery-app-cache-v11';
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // config.json is the small file the owner updates on the server (ads, short
    // messages, etc). The app itself only checks it once a day (see index.html),
    // but if we let the service worker cache-first it here too, the browser would
    // keep serving day-1's copy forever even after a real update is uploaded. So
    // this one file always goes straight to the network — no caching, no stale copy.
    if (event.request.url.indexOf('config.json') !== -1) {
        event.respondWith(fetch(event.request, { cache: 'no-store' }));
        return;
    }

    // Everything else (the app itself): cache-first, so it opens instantly and
    // works fully offline once it has been loaded successfully one time.
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);
        })
    );
});
