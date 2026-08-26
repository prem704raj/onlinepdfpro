// OnlinePDFPro Service Worker v90
// Dramatically reduced precache list — only essential core assets.
// Individual tool pages and their scripts are runtime-cached on first use.

const CACHE_NAME = 'onlinepdfpro-cache-v90';

const STATIC_ASSETS = [
    // Core pages
    'index.html',
    '404.html',
    'about.html',
    'tools.html',
    'study-materials.html',
    'login.html',
    'support.html',
    'refund.html',
    'dmca.html',
    'privacy.html',
    'terms.html',

    // CSS
    'css/style.css',
    'css/mobile-fix-v2.css',
    'css/tools-v2.css',

    // JS core
    'js/app.js',
    'js/auth.js',
    'js/store.js',

    // Images & manifest
    'apple-touch-icon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'icon-192.png',
    'icon-512.png',
    'logo.png',
    'logo.svg',
    'og-image.jpg',
    'site.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use allSettled so one failed asset doesn't kill the entire install
            return Promise.allSettled(
                STATIC_ASSETS.map(asset =>
                    cache.add(asset).catch(err => console.warn('[SW] Failed to cache:', asset, err))
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.protocol === 'blob:') return;

    let cacheKey = request;
    if (url.origin === self.location.origin && url.pathname === '/') {
        cacheKey = new Request('index.html');
    }

    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(cacheKey, { ignoreSearch: true }))
        );
        return;
    }

    event.respondWith(
        caches.match(cacheKey, { ignoreSearch: true }).then((cached) => {
            return cached || fetch(request).then((response) => {
                const clone = response.clone();
                if (response.status === 200 || response.type === 'opaque' || response.type === 'cors') {
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
