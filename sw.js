// OnlinePDFPro Service Worker

// Monetag Push Notifications Adsterra script
self.options = {
    "domain": "5gvci.com",
    "zoneId": 11159628
}
self.lary = ""
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw')

// Modern PWA support with reliable caching strategy

const CACHE_NAME = 'onlinepdfpro-cache-v76'; 
const STATIC_ASSETS = [
    '.tmp_migrate_thirdparty.js',
    '404.html',
    'about.html',
    'apple-touch-icon.png',
    'blog.html',
    'blog/best-free-pdf-tools-2025.html',
    'blog/best-free-presentation-makers.html',
    'blog/how-to-compress-pdf-without-losing-quality.html',
    'blog/how-to-convert-images-to-pdf.html',
    'blog/how-to-edit-pdf-online-free.html',
    'blog/how-to-merge-pdf-online-free.html',
    'blog/how-to-protect-pdf-from-copying.html',
    'blog/how-to-reduce-pdf-size-for-email.html',
    'blog/how-to-split-pdf-online.html',
    'blog/introducing-pdf-scratchpad-online.html',
    'blog/ocr-technology-how-to-extract-text-from-images.html',
    'blog/pdf-vs-docx-which-format-should-you-use.html',
    'blog/why-client-side-processing-is-safer.html',
    'compare-pdf.html',
    'contact.html',
    'counter.js',
    'css/mobile-fix-v2.css',
    'css/mobile-fix.min.css',
    'css/pdf-editor-page.css',
    'css/style.css',
    'css/style.min.css',
    'css/tools-v2.css',
    'css/tools.min.css',
    'disclaimer.html',
    'dmca.html',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'flatten-pdf.html',
    'founder_avatar.png',
    'google6ec5c9097526273f.html',
    'help.html',
    'history.html',
    'icon-192.png',
    'icon-512.png',
    'index.html',
    'invoice-generator.html',
    'js/app.js',
    'js/cloud-convert.js',
    'js/pdf-editor.js',
    'js/pdf-encrypt-lite.js',
    'js/presentation-maker.js',
    'js/security-shield.js',
    'js/tts-engine.js',
    'js/vendor/html2canvas/html2canvas.min.js',
    'js/vendor/jspdf/jspdf.umd.min.js',
    'js/vendor/jszip/jszip.min.js',
    'js/vendor/pdfjs/pdf.min.js',
    'js/vendor/pdfjs/pdf.worker.min.js',
    'js/vendor/pdflib/pdf-lib.min.js',
    'logo.jpg',
    'logo.png',
    'logo.svg',
    'og-image.jpg',
    'pdf-bookmark.html',
    'pdf-highlighter-extractor.html',
    'pdf-page-reorder.html',
    'pdf-presentation-mode.html',
    'pdf-reader.html',
    'pdf-scratchpad.html',
    'pdf-to-jpg.html',
    'pdf-to-text-extractor.html',
    'presentation-maker.html',
    'privacy.html',
    'remove-background.html',
    'resume-cv-builder.html',
    'site.webmanifest',
    'speech-to-text.html',
    'terms.html',
    'text-to-audio.html',
    'text-to-speech.html',
    'tools.html',
    'tools/add-page-numbers-to-pdf.html',
    'tools/add-page-numbers.html',
    'tools/compress-pdf.html',
    'tools/crop-pdf.html',
    'tools/csv-to-xlsx.html',
    'tools/delete-pages.html',
    'tools/delete-pdf-pages.html',
    'tools/heic-to-jpg.html',
    'tools/html-to-pdf.html',
    'tools/image-compress.html',
    'tools/image-compressor.html',
    'tools/image-crop.html',
    'tools/image-format-converter.html',
    'tools/image-resize.html',
    'tools/image-to-text.html',
    'tools/jpg-to-pdf.html',
    'tools/merge-pdf.html',
    'tools/ocr.html',
    'tools/passport-photo-maker.html',
    'tools/password-protect-pdf.html',
    'tools/pdf-unlock.html',
    'tools/pdf-watermark.html',
    'tools/qr-code-generator.html',
    'tools/qr-generator.html',
    'tools/redact-pdf.html',
    'tools/rotate-pdf.html',
    'tools/sign-pdf.html',
    'tools/split-pdf.html',
    'tools/webp-to-jpg.html',
    'tools/xlsx-to-csv.html'
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
