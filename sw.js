// Service worker for "مدیریت نانوایی"
// مناسب برای GitHub Pages: نسخه آنلاین همیشه از شبکه بررسی می‌شود
// و در صورت قطع اینترنت، آخرین نسخه ذخیره‌شده از کش استفاده می‌شود.
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
    // نسخه جدید بدون نیاز به بستن برنامه آماده فعال شدن می‌شود.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key.startsWith('bakery-app-cache-') && key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const request = event.request;
    const isNavigation = request.mode === 'navigate' ||
        request.destination === 'document';

    if (isNavigation) {
        // برای صفحه اصلی همیشه نسخه جدید GitHub را بررسی می‌کنیم.
        // اگر اینترنت در دسترس نباشد، آخرین نسخه کش‌شده باز می‌شود.
        event.respondWith(
            fetch(request, { cache: 'no-store' })
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put('./index.html', copy);
                        }).catch(() => {});
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(request).then((cached) =>
                        cached || caches.match('./index.html')
                    )
                )
        );
        return;
    }

    // فایل‌های ثابت: اگر در کش باشند سریع نمایش داده می‌شوند؛
    // در غیر این صورت از شبکه گرفته و برای استفاده آفلاین ذخیره می‌شوند.
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, copy);
                    }).catch(() => {});
                }
                return response;
            });
        })
    );
});
