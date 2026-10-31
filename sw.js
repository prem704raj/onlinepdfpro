// OnlinePDFPro Service Worker (503f15fecc33a5fe)
// The build step replaces 503f15fecc33a5fe with a content hash of the generated
// site. This invalidates the entire cache whenever a static asset changes.
// Network-first for HTML/JS/CSS, and
// cache-first for images/fonts with offline fallback.

const CACHE_NAME = 'onlinepdfpro-cache-503f15fecc33a5fe';

const STATIC_ASSETS = [
    // Core pages
    '/',
    '/404',
    '/about',
    '/tools',
    '/study-materials',
    '/login',
    '/library',
    '/help',
    '/refund',
    '/dmca',
    '/privacy',
    '/terms',

    // CSS
    'css/style.css',
    'css/mobile-fix-v2.css',
    'css/tools-v2.css',

    // JS core
    'js/app.js',
    'js/auth.js',
    'js/store.js',
    'release.json',

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

const PAGE_ROUTES = {"/404.html":"/404","/404":"/404","/about.html":"/about","/about":"/about","/blog/best-practices-creating-accessible-pdfs/index.html":"/blog/best-practices-creating-accessible-pdfs/","/blog/best-practices-creating-accessible-pdfs/":"/blog/best-practices-creating-accessible-pdfs/","/blog/comparing-word-vs-pdf-when-to-use-which/index.html":"/blog/comparing-word-vs-pdf-when-to-use-which/","/blog/comparing-word-vs-pdf-when-to-use-which/":"/blog/comparing-word-vs-pdf-when-to-use-which/","/blog/compress-pdf-without-losing-quality/index.html":"/blog/compress-pdf-without-losing-quality/","/blog/compress-pdf-without-losing-quality/":"/blog/compress-pdf-without-losing-quality/","/blog/convert-jpg-to-pdf-online/index.html":"/blog/convert-jpg-to-pdf-online/","/blog/convert-jpg-to-pdf-online/":"/blog/convert-jpg-to-pdf-online/","/blog/easy-ways-rearrange-delete-pdf-pages/index.html":"/blog/easy-ways-rearrange-delete-pdf-pages/","/blog/easy-ways-rearrange-delete-pdf-pages/":"/blog/easy-ways-rearrange-delete-pdf-pages/","/blog/edit-pdf-text-online-free/index.html":"/blog/edit-pdf-text-online-free/","/blog/edit-pdf-text-online-free/":"/blog/edit-pdf-text-online-free/","/blog/future-of-document-management-ai-and-pdfs/index.html":"/blog/future-of-document-management-ai-and-pdfs/","/blog/future-of-document-management-ai-and-pdfs/":"/blog/future-of-document-management-ai-and-pdfs/","/blog/how-to-add-watermarks-to-your-pdf-documents/index.html":"/blog/how-to-add-watermarks-to-your-pdf-documents/","/blog/how-to-add-watermarks-to-your-pdf-documents/":"/blog/how-to-add-watermarks-to-your-pdf-documents/","/blog/how-to-convert-excel-spreadsheets-to-pdf/index.html":"/blog/how-to-convert-excel-spreadsheets-to-pdf/","/blog/how-to-convert-excel-spreadsheets-to-pdf/":"/blog/how-to-convert-excel-spreadsheets-to-pdf/","/blog/how-to-convert-powerpoint-presentations-to-pdf/index.html":"/blog/how-to-convert-powerpoint-presentations-to-pdf/","/blog/how-to-convert-powerpoint-presentations-to-pdf/":"/blog/how-to-convert-powerpoint-presentations-to-pdf/","/blog/how-to-extract-text-from-scanned-pdfs-ocr/index.html":"/blog/how-to-extract-text-from-scanned-pdfs-ocr/","/blog/how-to-extract-text-from-scanned-pdfs-ocr/":"/blog/how-to-extract-text-from-scanned-pdfs-ocr/","/blog/how-to-merge-pdf-files-free/index.html":"/blog/how-to-merge-pdf-files-free/","/blog/how-to-merge-pdf-files-free/":"/blog/how-to-merge-pdf-files-free/","/blog/how-to-reduce-pdf-file-size-for-email/index.html":"/blog/how-to-reduce-pdf-file-size-for-email/","/blog/how-to-reduce-pdf-file-size-for-email/":"/blog/how-to-reduce-pdf-file-size-for-email/","/blog/importance-of-pdfa-for-long-term-archiving/index.html":"/blog/importance-of-pdfa-for-long-term-archiving/","/blog/importance-of-pdfa-for-long-term-archiving/":"/blog/importance-of-pdfa-for-long-term-archiving/","/blog/step-by-step-guide-splitting-large-pdf-files/index.html":"/blog/step-by-step-guide-splitting-large-pdf-files/","/blog/step-by-step-guide-splitting-large-pdf-files/":"/blog/step-by-step-guide-splitting-large-pdf-files/","/blog/top-benefits-going-paperless-in-office/index.html":"/blog/top-benefits-going-paperless-in-office/","/blog/top-benefits-going-paperless-in-office/":"/blog/top-benefits-going-paperless-in-office/","/blog/ultimate-guide-digital-signatures-pdfs/index.html":"/blog/ultimate-guide-digital-signatures-pdfs/","/blog/ultimate-guide-digital-signatures-pdfs/":"/blog/ultimate-guide-digital-signatures-pdfs/","/blog/understanding-pdf-security-password-protect/index.html":"/blog/understanding-pdf-security-password-protect/","/blog/understanding-pdf-security-password-protect/":"/blog/understanding-pdf-security-password-protect/","/blog/why-your-resume-should-always-be-a-pdf/index.html":"/blog/why-your-resume-should-always-be-a-pdf/","/blog/why-your-resume-should-always-be-a-pdf/":"/blog/why-your-resume-should-always-be-a-pdf/","/blog.html":"/blog","/blog":"/blog","/changelog.html":"/changelog","/changelog":"/changelog","/compare-pdf.html":"/compare-pdf","/compare-pdf":"/compare-pdf","/contact.html":"/contact","/contact":"/contact","/disclaimer.html":"/disclaimer","/disclaimer":"/disclaimer","/dmca.html":"/dmca","/dmca":"/dmca","/flatten-pdf.html":"/flatten-pdf","/flatten-pdf":"/flatten-pdf","/google6ec5c9097526273f.html":"/google6ec5c9097526273f","/google6ec5c9097526273f":"/google6ec5c9097526273f","/help.html":"/help","/help":"/help","/history.html":"/history","/history":"/history","/index.html":"/","/":"/","/invoice-generator.html":"/invoice-generator","/invoice-generator":"/invoice-generator","/library.html":"/library","/library":"/library","/login.html":"/login","/login":"/login","/pdf-bookmark.html":"/pdf-bookmark","/pdf-bookmark":"/pdf-bookmark","/pdf-highlighter-extractor.html":"/pdf-highlighter-extractor","/pdf-highlighter-extractor":"/pdf-highlighter-extractor","/pdf-page-reorder.html":"/pdf-page-reorder","/pdf-page-reorder":"/pdf-page-reorder","/pdf-presentation-mode.html":"/pdf-presentation-mode","/pdf-presentation-mode":"/pdf-presentation-mode","/pdf-reader.html":"/pdf-reader","/pdf-reader":"/pdf-reader","/pdf-scratchpad.html":"/pdf-scratchpad","/pdf-scratchpad":"/pdf-scratchpad","/pdf-to-jpg.html":"/pdf-to-jpg","/pdf-to-jpg":"/pdf-to-jpg","/pdf-to-text-extractor.html":"/pdf-to-text-extractor","/pdf-to-text-extractor":"/pdf-to-text-extractor","/presentation-maker.html":"/presentation-maker","/presentation-maker":"/presentation-maker","/privacy.html":"/privacy","/privacy":"/privacy","/products/dbms-notes.html":"/products/dbms-notes","/products/dbms-notes":"/products/dbms-notes","/refund.html":"/refund","/refund":"/refund","/remove-background.html":"/remove-background","/remove-background":"/remove-background","/resume-cv-builder.html":"/resume-cv-builder","/resume-cv-builder":"/resume-cv-builder","/speech-to-text.html":"/speech-to-text","/speech-to-text":"/speech-to-text","/study-materials.html":"/study-materials","/study-materials":"/study-materials","/support.html":"/help","/support":"/help","/terms.html":"/terms","/terms":"/terms","/text-to-audio.html":"/text-to-speech","/text-to-audio":"/text-to-speech","/text-to-speech.html":"/text-to-speech","/text-to-speech":"/text-to-speech","/tools/add-page-numbers-to-pdf.html":"/tools/add-page-numbers-to-pdf","/tools/add-page-numbers-to-pdf":"/tools/add-page-numbers-to-pdf","/tools/add-page-numbers.html":"/tools/add-page-numbers-to-pdf","/tools/add-page-numbers":"/tools/add-page-numbers-to-pdf","/tools/chat-with-pdf.html":"/tools/chat-with-pdf","/tools/chat-with-pdf":"/tools/chat-with-pdf","/tools/compress-pdf.html":"/tools/compress-pdf","/tools/compress-pdf":"/tools/compress-pdf","/tools/crop-pdf.html":"/tools/crop-pdf","/tools/crop-pdf":"/tools/crop-pdf","/tools/csv-to-xlsx.html":"/tools","/tools/csv-to-xlsx":"/tools","/tools/delete-pages.html":"/tools/delete-pdf-pages","/tools/delete-pages":"/tools/delete-pdf-pages","/tools/delete-pdf-pages.html":"/tools/delete-pdf-pages","/tools/delete-pdf-pages":"/tools/delete-pdf-pages","/tools/heic-to-jpg.html":"/tools/heic-to-jpg","/tools/heic-to-jpg":"/tools/heic-to-jpg","/tools/html-to-pdf.html":"/tools/html-to-pdf","/tools/html-to-pdf":"/tools/html-to-pdf","/tools/image-compress.html":"/tools/image-compressor","/tools/image-compress":"/tools/image-compressor","/tools/image-compressor.html":"/tools/image-compressor","/tools/image-compressor":"/tools/image-compressor","/tools/image-crop.html":"/tools/image-crop","/tools/image-crop":"/tools/image-crop","/tools/image-format-converter.html":"/tools/image-format-converter","/tools/image-format-converter":"/tools/image-format-converter","/tools/image-resize.html":"/tools/image-resize","/tools/image-resize":"/tools/image-resize","/tools/image-to-text.html":"/tools/image-to-text","/tools/image-to-text":"/tools/image-to-text","/tools/jpg-to-pdf.html":"/tools/jpg-to-pdf","/tools/jpg-to-pdf":"/tools/jpg-to-pdf","/tools/merge-pdf.html":"/tools/merge-pdf","/tools/merge-pdf":"/tools/merge-pdf","/tools/ocr.html":"/tools/image-to-text","/tools/ocr":"/tools/image-to-text","/tools/passport-photo-maker.html":"/tools/passport-photo-maker","/tools/passport-photo-maker":"/tools/passport-photo-maker","/tools/password-protect-pdf.html":"/tools/password-protect-pdf","/tools/password-protect-pdf":"/tools/password-protect-pdf","/tools/pdf-editor.html":"/tools/pdf-editor","/tools/pdf-editor":"/tools/pdf-editor","/tools/pdf-page-counter.html":"/tools/pdf-page-counter","/tools/pdf-page-counter":"/tools/pdf-page-counter","/tools/pdf-summarizer.html":"/tools/pdf-summarizer","/tools/pdf-summarizer":"/tools/pdf-summarizer","/tools/pdf-to-flashcards.html":"/tools/pdf-to-flashcards","/tools/pdf-to-flashcards":"/tools/pdf-to-flashcards","/tools/pdf-to-word.html":"/tools/pdf-to-word","/tools/pdf-to-word":"/tools/pdf-to-word","/tools/pdf-unlock.html":"/tools/pdf-unlock","/tools/pdf-unlock":"/tools/pdf-unlock","/tools/pdf-watermark.html":"/tools/pdf-watermark","/tools/pdf-watermark":"/tools/pdf-watermark","/tools/qr-code-generator.html":"/tools/qr-code-generator","/tools/qr-code-generator":"/tools/qr-code-generator","/tools/qr-generator.html":"/tools/qr-code-generator","/tools/qr-generator":"/tools/qr-code-generator","/tools/redact-pdf.html":"/tools/redact-pdf","/tools/redact-pdf":"/tools/redact-pdf","/tools/rotate-pdf.html":"/tools/rotate-pdf","/tools/rotate-pdf":"/tools/rotate-pdf","/tools/sign-pdf.html":"/tools/sign-pdf","/tools/sign-pdf":"/tools/sign-pdf","/tools/split-pdf.html":"/tools/split-pdf","/tools/split-pdf":"/tools/split-pdf","/tools/webp-to-jpg.html":"/tools/webp-to-jpg","/tools/webp-to-jpg":"/tools/webp-to-jpg","/tools/word-to-pdf.html":"/tools/word-to-pdf","/tools/word-to-pdf":"/tools/word-to-pdf","/tools/xlsx-to-csv.html":"/tools","/tools/xlsx-to-csv":"/tools","/tools.html":"/tools","/tools":"/tools","/viewstudymaterials.html":"/viewstudymaterials","/viewstudymaterials":"/viewstudymaterials","/about/":"/about","/about-us":"/about","/about-us.html":"/about","/blog/ocr-technology-how-to-extract-text-from-images.html":"/blog/how-to-extract-text-from-scanned-pdfs-ocr/","/blog/how-to-convert-excel-to-pdf-online.html":"/blog/how-to-convert-excel-spreadsheets-to-pdf/","/support/":"/help","/changelog/":"/changelog"};
function pageCacheKey(url) {
    const pathname = PAGE_ROUTES[url.pathname] || url.pathname;
    return new Request(new URL(pathname, self.location.origin).href);
}

const STATIC_ASSET_PATHS = new Set(
    STATIC_ASSETS.map((asset) => new URL(asset, self.location.origin).pathname)
);
const STATIC_ASSET_PREFIXES = ['/assets/', '/css/', '/fonts/', '/icons/'];
const STATIC_ASSET_EXTENSIONS = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|woff2?|ttf|otf)$/i;

function isKnownStaticAsset(url) {
    if (url.origin !== self.location.origin) {
        return false;
    }
    if (STATIC_ASSET_PATHS.has(url.pathname)) return true;
    return STATIC_ASSET_EXTENSIONS.test(url.pathname) &&
        STATIC_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function cacheSuccessfulResponse(cacheKey, response) {
    if (response.status !== 200) return Promise.resolve();
    const clone = response.clone();
    return caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, clone));
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use allSettled so one failed asset doesn't kill the entire install
            return Promise.allSettled(
                STATIC_ASSETS.map(asset =>
                    cache.add(new Request(asset, { cache: 'reload' })).catch(err => console.warn('[SW] Failed to cache:', asset, err))
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
                    if (cacheName.startsWith('onlinepdfpro-cache-') && cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignore blob: and chrome-extension: URLs
    if (url.protocol === 'blob:' || url.protocol === 'chrome-extension:') return;

    // Ignore non-GET requests
    if (request.method !== 'GET') return;

    const cacheKey = request;

    // --- Strategy 1: Network-first for HTML ---
    if (url.origin === self.location.origin && (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html'))) {
        const htmlKey = pageCacheKey(url);
        event.respondWith(
            fetch(request)
                .then((response) => {
                    event.waitUntil(cacheSuccessfulResponse(htmlKey, response));
                    return response;
                })
                .catch(async () => (await caches.match(htmlKey, { ignoreSearch: true })) || (await caches.match('/404', { ignoreSearch: true })) || Response.error())
        );
        return;
    }

    // --- Strategy 2: Network-first for JavaScript files ---
    // This prevents stale JS (auth.js, store.js, app.js etc.) from being served
    // after deployments that add new features like Razorpay checkout.
    const isJavaScript = url.pathname.endsWith('.js') && url.origin === self.location.origin;
    if (isJavaScript) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    event.waitUntil(cacheSuccessfulResponse(cacheKey, response));
                    return response;
                })
                .catch(() => {
                    // Offline fallback: serve cached JS if network is unavailable
                    return caches.match(cacheKey, { ignoreSearch: true });
                })
        );
        return;
    }

    // --- Strategy 3: Network-first for same-origin CSS ---
    // New HTML and JavaScript must not be paired with a previous layout.
    // Cached styles remain available when the visitor is offline.
    if (url.origin === self.location.origin && url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(request, { cache: 'no-cache' })
                .then((response) => {
                    event.waitUntil(cacheSuccessfulResponse(cacheKey, response));
                    return response;
                })
                .catch(() => caches.match(cacheKey, { ignoreSearch: true }))
        );
        return;
    }

    // --- Strategy 4: Cache-first for same-origin static assets (images, fonts) ---
    // Restrict caching to known same-origin assets with valid 200 responses.
    if (url.origin !== self.location.origin) {
        event.respondWith(fetch(request));
        return;
    }

    // Never turn arbitrary same-origin GET responses (API payloads, user
    // documents, error pages, or future dynamic routes) into long-lived cache
    // entries. Only the known static asset set and static asset directories
    // use the cache-first strategy below.
    if (!isKnownStaticAsset(url)) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        caches.match(cacheKey, { ignoreSearch: true }).then((cached) => {
            return cached || fetch(request).then((response) => {
                event.waitUntil(cacheSuccessfulResponse(request, response));
                return response;
            });
        })
    );
});
