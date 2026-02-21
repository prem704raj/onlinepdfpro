// OnlinePDFPro Service Worker Kill Switch
// We are disabling offline caching temporarily to ensure all visual updates (SVGs/styles)
// are immediately fetched bypassing any aggressive local cache.

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => caches.delete(name))
            );
        }).then(() => {
            return self.registration.unregister();
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Completely bypass service worker, go straight to network
    return;
});
