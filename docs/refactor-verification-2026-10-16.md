# OnlinePDFPro refactor verification — 2026-10-16

This document records the initial workspace refactor. See [GitHub delivery validation](github-delivery-2026-10-16.md) for integration with the newer main branch.

Implemented in src, rebuilt into _site, and synchronized to the repository root. No production deployment was performed.

## Results

- 91 HTML documents each have one clean canonical URL. The Google Search Console verification token is preserved byte-for-byte; it is not an HTML document. Redirect aliases identify the final canonical destination.
- All 13 Sign Out controls have hidden and inline display: none. The header checks a nonexpired session and verifies the user through Supabase getUser. Auth changes invalidate pending verification and hide controls immediately on sign-out. Store profile menus use the same visibility logic.
- Support navigation and sitemap use /help. /support, /support.html, and /support/ redirect directly to /help.
- 105 explicit Cloudflare Pages 301 rules cover .html pages and legacy aliases without cycles or intermediate .html destinations. Physical HTML files remain available for native clean-URL serving.
- Service Worker precaching uses clean URLs; HTML cache keys use the same route/alias map as the site. The home page, legacy aliases, query strings, and visited tool pages work offline. Unknown uncached pages fall back to the cached 404 document. CSS, JavaScript, fonts, image, and vendor asset strategies are retained. Build hash: 2a59cf9fb0195dde.
- The five banner words use normal spelling, CSS letter-spacing: 0.3em and text-transform: uppercase, plus a coherent accessible SVG label. CTA whitespace survives minification; the existing 16px gap is retained.
- Hamburger spans remain aria-hidden through menu changes. All 46 tool cards, including Resume Builder, have matching h3 titles.
- 27 tool pages have data-nosnippet exclusions for processing, progress, completion, and output UI. Upload instructions and descriptions remain eligible for snippets. This controls snippet eligibility, not crawling or indexing.
- Compression description, Open Graph, and Twitter copy specify up to 100 MB per file, no signup. The size helper promises an approximation rather than an exact size. Homepage, About, and directory counts use 46 Free Tools.

## Validation

- npm run build — passed.
- npm run sync:root — passed; copied 190 generated files.
- npm test — passed in full, including site checks, the 11 new audit checks, Worker contract checks, analytics, lossless PDF merge, and existing regression/browser coverage.
- Real Chromium checked mobile/desktop cards, menu open/close accessibility, CTA spacing, banner text, and actual Service Worker navigation offline.
- Auth state changes, expiration, API rejection, and delayed verification after sign-out are tested with deterministic Supabase fixtures; no real account login was performed.
- Existing browser regressions cover encryption/decryption, OCR and consent, HTML sanitization, image conversion signatures, QR upload flows, study previews, and responsive layouts.
- All 475 executable source HTML/template script blocks remain byte-identical to the pre-edit snapshot. Only src/js/auth.js and src/js/app.js changed among shared application scripts. No PDF processing, WebAssembly, vendor library, or conversion-service implementation was edited.
- Root HTML matches generated HTML byte-for-byte.

## Test maintenance

- Added scripts/test-audit.mjs and test:audit; included the audit suite in npm test.
- Updated the study-detail navigation assertion to expect the clean route.
- Isolated the analytics browser fixture from production Service Worker registration, which previously bypassed page request interception. Preferences controls are scrolled into view before clicking.

## Scope notes

The active homepage uses Discover More as its secondary CTA. Try the Examples occurs only in the separate .implementation-review snapshot, which was preserved. Historical audit evidence was preserved. The workspace has no .git directory, so validation uses the pre-edit source snapshot and byte comparisons rather than a Git diff.

## Changed pre-existing source files

- `src/404.html`
- `src/about.njk`
- `src/blog.html`
- `src/compare-pdf.html`
- `src/contact.html`
- `src/disclaimer.html`
- `src/dmca.html`
- `src/flatten-pdf.html`
- `src/help.html`
- `src/history.html`
- `src/index.njk`
- `src/invoice-generator.html`
- `src/library.html`
- `src/login.html`
- `src/pdf-bookmark.html`
- `src/pdf-highlighter-extractor.html`
- `src/pdf-page-reorder.html`
- `src/pdf-presentation-mode.html`
- `src/pdf-reader.html`
- `src/pdf-scratchpad.html`
- `src/pdf-to-jpg.html`
- `src/pdf-to-text-extractor.html`
- `src/presentation-maker.html`
- `src/refund.njk`
- `src/remove-background.html`
- `src/resume-cv-builder.html`
- `src/sitemap.njk`
- `src/speech-to-text.html`
- `src/study-materials.html`
- `src/support.njk`
- `src/sw.js`
- `src/terms.njk`
- `src/text-to-audio.html`
- `src/text-to-speech.html`
- `src/tools.njk`
- `src/viewstudymaterials.html`
- `src/js/app.js`
- `src/js/auth.js`
- `src/tools/add-page-numbers-to-pdf.html`
- `src/tools/add-page-numbers.html`
- `src/tools/chat-with-pdf.html`
- `src/tools/compress-pdf.html`
- `src/tools/crop-pdf.html`
- `src/tools/csv-to-xlsx.html`
- `src/tools/delete-pages.html`
- `src/tools/delete-pdf-pages.html`
- `src/tools/heic-to-jpg.html`
- `src/tools/html-to-pdf.html`
- `src/tools/image-compress.html`
- `src/tools/image-compressor.html`
- `src/tools/image-crop.html`
- `src/tools/image-format-converter.html`
- `src/tools/image-resize.html`
- `src/tools/image-to-text.html`
- `src/tools/jpg-to-pdf.html`
- `src/tools/merge-pdf.html`
- `src/tools/ocr.html`
- `src/tools/passport-photo-maker.html`
- `src/tools/password-protect-pdf.html`
- `src/tools/pdf-editor.njk`
- `src/tools/pdf-page-counter.html`
- `src/tools/pdf-summarizer.html`
- `src/tools/pdf-to-flashcards.html`
- `src/tools/pdf-to-word.html`
- `src/tools/pdf-unlock.html`
- `src/tools/pdf-watermark.html`
- `src/tools/qr-code-generator.html`
- `src/tools/qr-generator.html`
- `src/tools/redact-pdf.html`
- `src/tools/rotate-pdf.html`
- `src/tools/sign-pdf.html`
- `src/tools/split-pdf.html`
- `src/tools/webp-to-jpg.html`
- `src/tools/word-to-pdf.html`
- `src/tools/xlsx-to-csv.html`
- `src/blog/best-practices-creating-accessible-pdfs/index.html`
- `src/blog/comparing-word-vs-pdf-when-to-use-which/index.html`
- `src/blog/compress-pdf-without-losing-quality/index.html`
- `src/blog/convert-jpg-to-pdf-online/index.html`
- `src/blog/easy-ways-rearrange-delete-pdf-pages/index.html`
- `src/blog/edit-pdf-text-online-free/index.html`
- `src/blog/future-of-document-management-ai-and-pdfs/index.html`
- `src/blog/how-to-add-watermarks-to-your-pdf-documents/index.html`
- `src/blog/how-to-convert-excel-spreadsheets-to-pdf/index.html`
- `src/blog/how-to-convert-powerpoint-presentations-to-pdf/index.html`
- `src/blog/how-to-extract-text-from-scanned-pdfs-ocr/index.html`
- `src/blog/how-to-merge-pdf-files-free/index.html`
- `src/blog/how-to-reduce-pdf-file-size-for-email/index.html`
- `src/blog/importance-of-pdfa-for-long-term-archiving/index.html`
- `src/blog/step-by-step-guide-splitting-large-pdf-files/index.html`
- `src/blog/top-benefits-going-paperless-in-office/index.html`
- `src/blog/ultimate-guide-digital-signatures-pdfs/index.html`
- `src/blog/understanding-pdf-security-password-protect/index.html`
- `src/blog/why-your-resume-should-always-be-a-pdf/index.html`
- `src/_includes/partials/footer-minimal.njk`
- `src/_includes/partials/footer.njk`
- `src/_includes/partials/header.njk`
- `src/_includes/partials/meta.njk`
- `scripts/prepare-site.mjs`
- `scripts/test-analytics.mjs`
- `scripts/test-regression.mjs`
- `src/_redirects`

Additional files: `package.json`, `scripts/test-audit.mjs`, this report, and `docs/refactor-inventory-2026-10-16.md`. Root and _site changes are generated from source.
