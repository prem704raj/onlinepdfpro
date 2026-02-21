// OnlinePDFPro Service Worker
// Provides offline support and caching

const CACHE_NAME = 'onlinepdfpro-v5';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/tools.html',
    '/about.html',
    '/help.html',
    '/privacy.html',
    '/terms.html',
    '/css/style.css',
    '/css/tools.css',
    '/js/app.js',
    '/manifest.json'
];

const TOOL_PAGES = [
    '/tools/compress-pdf.html',
    '/tools/merge-pdf.html',
    '/tools/split-pdf.html',
    '/tools/rotate-pdf.html',
    '/tools/pdf-to-images.html',
    '/tools/images-to-pdf.html',
    '/tools/pdf-watermark.html',
    '/tools/pdf-lock.html',
    '/tools/image-compress.html',
    '/tools/image-resize.html',
    '/tools/image-crop.html',
    '/tools/xlsx-to-csv.html',
    '/tools/csv-to-xlsx.html'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll([...STATIC_ASSETS, ...TOOL_PAGES]);
        }).catch((err) => {
            console.log('[SW] Cache install failed, continuing:', err);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip external requests (CDNs like unpkg, Google Fonts, etc.)
    if (url.origin !== location.origin) return;

    // HTML pages: Network-first strategy
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the fresh response
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('/index.html');
                    });
                })
        );
        return;
    }

    // CSS/JS: Cache-first strategy
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            });
        })
    );
});
