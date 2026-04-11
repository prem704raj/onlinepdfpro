// OnlinePDFPro Service Worker
// Modern PWA support with reliable caching strategy

const CACHE_NAME = 'onlinepdfpro-v46'; 
const STATIC_ASSETS = [
    'about.html',
    'blog.html',
    'changelog.html',
    'compare-pdf.html',
    'contact.html',
    'disclaimer.html',
    'dmca.html',
    'flatten-pdf.html',
    'help.html',
    'history.html',
    'index.html',
    'pdf-bookmark.html',
    'pdf-editor.html',
    'pdf-reader.html',
    'pdf-summary.html',
    'pdf-translator.html',
    'privacy.html',
    'qr-pdf.html',
    'remove-background.html',
    'seo-tracker.html',
    'terms.html',
    'test-pdf.html',
    'text-to-audio.html',
    'tools.html',
    'voice-to-pdf.html',
    'blog/best-free-online-pdf-tools-in-2025-comparison.html',
    'blog/best-free-pdf-tools-2025.html',
    'blog/best-pdf-tools-for-students-in-india.html',
    'blog/how-to-add-page-numbers-to-pdf-online.html',
    'blog/how-to-add-watermark-to-pdf-online.html',
    'blog/how-to-compress-pdf-below-100kb.html',
    'blog/how-to-compress-pdf-files-without-losing-quality.html',
    'blog/how-to-compress-pdf-without-losing-quality.html',
    'blog/how-to-convert-aadhaar-pdf-to-jpg.html',
    'blog/how-to-convert-excel-to-pdf-online.html',
    'blog/how-to-convert-images-to-pdf-online.html',
    'blog/how-to-convert-images-to-pdf.html',
    'blog/how-to-convert-pdf-to-word-free.html',
    'blog/how-to-convert-pdf-to-word-online-free.html',
    'blog/how-to-convert-ppt-to-pdf-online.html',
    'blog/how-to-convert-scanned-pdf-to-word.html',
    'blog/how-to-convert-whatsapp-chat-to-pdf.html',
    'blog/how-to-edit-pdf-files-online-without-adobe-acrobat.html',
    'blog/how-to-edit-pdf-online-free.html',
    'blog/how-to-merge-pdf-files-online-for-free-2025-guide.html',
    'blog/how-to-merge-pdf-on-iphone-without-app.html',
    'blog/how-to-merge-pdf-online-free.html',
    'blog/how-to-reduce-pdf-file-size-for-email.html',
    'blog/how-to-reduce-pdf-size-for-email.html',
    'blog/how-to-remove-password-from-pdf-online.html',
    'blog/how-to-sign-pdf-documents-online-for-free.html',
    'blog/how-to-split-pdf-into-multiple-files.html',
    'blog/how-to-split-pdf-online.html',
    'blog/ocr-technology-how-to-extract-text-from-images.html',
    'blog/pdf-vs-docx-which-format-should-you-use.html',
    'tools/add-page-numbers.html',
    'tools/compress-pdf.html',
    'tools/crop-pdf.html',
    'tools/csv-to-xlsx.html',
    'tools/delete-pages.html',
    'tools/excel-to-pdf.html',
    'tools/html-to-pdf.html',
    'tools/image-compress.html',
    'tools/image-crop.html',
    'tools/image-resize.html',
    'tools/images-to-pdf.html',
    'tools/merge-pdf.html',
    'tools/ocr.html',
    'tools/pdf-lock.html',
    'tools/pdf-to-excel.html',
    'tools/pdf-to-images.html',
    'tools/pdf-to-ppt.html',
    'tools/pdf-to-word.html',
    'tools/pdf-unlock.html',
    'tools/pdf-watermark.html',
    'tools/ppt-to-pdf.html',
    'tools/qr-generator.html',
    'tools/repair-pdf.html',
    'tools/rotate-pdf-godmode.html',
    'tools/rotate-pdf.html',
    'tools/sign-pdf.html',
    'tools/split-pdf.html',
    'tools/word-to-pdf.html',
    'tools/xlsx-to-csv.html',
    'css/style.css',
    'css/mobile-fix-v2.css',
    'css/tools-v2.css',
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
