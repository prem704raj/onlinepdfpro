// OnlinePDFPro Service Worker
// Modern PWA support with reliable caching strategy

const CACHE_NAME = 'onlinepdfpro-v33'; 
const STATIC_ASSETS = [
    'index.html',
    'tools.html',
    'pdf-editor.html',
    'about.html',
    'help.html',
    'tools/merge-pdf.html',
    'tools/compress-pdf.html',
    'tools/split-pdf.html',
    'css/style.css',
    'css/mobile-fix.css',
    'css/tools.css',
    'js/app.js',
    'site.webmanifest',
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'logo.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
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

    // Map root / to index.html for cache matching
    let cacheKey = request;
    if (url.origin === self.location.origin && url.pathname === '/') {
        cacheKey = new Request('index.html');
    }

    // Network-first for HTML, falling back to cache
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

    // Cache-first for static assets
    event.respondWith(
        caches.match(cacheKey, { ignoreSearch: true }).then((cached) => {
            return cached || fetch(request).then((response) => {
                const clone = response.clone();
                // Only cache valid responses and skip cross-origin resources unless necessary
                if (response.status === 200 && response.type === 'basic') {
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
