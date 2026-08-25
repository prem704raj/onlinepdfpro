// OnlinePDFPro Service Worker
// NOTE: the previous version imported Monetag's push-notification script
// (5gvci.com) and cached directory-style URLs (about/index.html, blog/<slug>/index.html)
// that 404 on the live site. Both have been removed/fixed.

const CACHE_NAME = 'onlinepdfpro-cache-v86';

const STATIC_ASSETS = [
    // Core pages (flat URLs — matches the live site)
    'index.html',
    '404.html',
    'about.html',
    'blog.html',
    'dmca.html',
    'history.html',
    'privacy.html',
    'terms.html',
    'tools.html',

    // Blog posts (flat .html — matches blog.html links)
    'blog/best-practices-creating-accessible-pdfs.html',
    'blog/comparing-word-vs-pdf-when-to-use-which.html',
    'blog/compress-pdf-without-losing-quality.html',
    'blog/convert-jpg-to-pdf-online.html',
    'blog/easy-ways-rearrange-delete-pdf-pages.html',
    'blog/edit-pdf-text-online-free.html',
    'blog/future-of-document-management-ai-and-pdfs.html',
    'blog/how-to-add-watermarks-to-your-pdf-documents.html',
    'blog/how-to-convert-excel-spreadsheets-to-pdf.html',
    'blog/how-to-convert-powerpoint-presentations-to-pdf.html',
    'blog/how-to-extract-text-from-scanned-pdfs-ocr.html',
    'blog/how-to-merge-pdf-files-free.html',
    'blog/how-to-reduce-pdf-file-size-for-email.html',
    'blog/importance-of-pdfa-for-long-term-archiving.html',
    'blog/step-by-step-guide-splitting-large-pdf-files.html',
    'blog/top-benefits-going-paperless-in-office.html',
    'blog/ultimate-guide-digital-signatures-pdfs.html',
    'blog/understanding-pdf-security-password-protect.html',
    'blog/why-your-resume-should-always-be-a-pdf.html',

    // Standalone tool pages (root level)
    'compare-pdf.html',
    'flatten-pdf.html',
    'invoice-generator.html',
    'pdf-bookmark.html',
    'pdf-highlighter-extractor.html',
    'pdf-page-reorder.html',
    'pdf-presentation-mode.html',
    'pdf-reader.html',
    'pdf-scratchpad.html',
    'pdf-to-jpg.html',
    'pdf-to-text-extractor.html',
    'presentation-maker.html',
    'remove-background.html',
    'resume-cv-builder.html',
    'speech-to-text.html',
    'study-materials.html',
    'text-to-audio.html',
    'text-to-speech.html',

    // Tools directory
    'tools/index.html',
    'tools/add-page-numbers-to-pdf.html',
    'tools/add-page-numbers.html',
    'tools/chat-with-pdf.html',
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
    'tools/pdf-page-counter.html',
    'tools/pdf-summarizer.html',
    'tools/pdf-to-flashcards.html',
    'tools/pdf-to-word.html',
    'tools/pdf-unlock.html',
    'tools/pdf-watermark.html',
    'tools/qr-code-generator.html',
    'tools/qr-generator.html',
    'tools/redact-pdf.html',
    'tools/rotate-pdf.html',
    'tools/sign-pdf.html',
    'tools/split-pdf.html',
    'tools/webp-to-jpg.html',
    'tools/word-to-pdf.html',
    'tools/xlsx-to-csv.html',

    // CSS
    'css/mobile-fix-v2.css',
    'css/pdf-editor-page.css',
    'css/style.css',
    'css/tools-v2.css',

    // JS core
    'counter.js',
    'js/app.js',
    'js/cloud-convert.js',
    'js/pdf-editor.js',
    'js/pdf-encrypt-lite.js',
    'js/presentation-maker.js',
    'js/security-shield.js',
    'js/tts-engine.js',

    // JS vendor (local copies of CDN scripts)
    'js/vendor/docx/index.umd.min.js',
    'js/vendor/download/download.min.js',
    'js/vendor/file-saver/FileSaver.min.js',
    'js/vendor/heic2any/heic2any.min.js',
    'js/vendor/html2canvas/html2canvas.min.js',
    'js/vendor/jspdf/jspdf.umd.min.js',
    'js/vendor/jszip/jszip.min.js',
    'js/vendor/marked/marked.min.js',
    'js/vendor/pdf-lib-plus-encrypt/pdf-lib-plus-encrypt.min.js',
    'js/vendor/pdfjs/pdf.min.js',
    'js/vendor/pdfjs/pdf.worker.min.js',
    'js/vendor/pdflib/pdf-lib.min.js',
    'js/vendor/pptxgenjs/pptxgen.bundle.js',
    'js/vendor/qr-code-styling/qr-code-styling.js',
    'js/vendor/tesseract/tesseract.min.js',
    'js/vendor/tesseract/worker.min.js',
    'js/vendor/tesseract/tesseract-core.wasm.js',
    'js/vendor/tesseract/tesseract-core.wasm',
    'js/vendor/tesseract/eng.traineddata.gz',

    // Images & manifest
    'apple-touch-icon.png',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'icon-192.png',
    'icon-512.png',
    'logo.jpg',
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
