# OnlinePDFPro pre-edit inventory — 2026-10-16

This document records the initial workspace refactor. See [GitHub delivery validation](github-delivery-2026-10-16.md) for integration with the newer main branch.

Captured before implementation. Source files are authoritative; _site and root are generated copies. Historical docs/audit-evidence-* and .implementation-review are excluded.

## Sign Out markup (6)

- `src/404.html`
- `src/dmca.html`
- `src/library.html`
- `src/study-materials.html`
- `src/viewstudymaterials.html`
- `src/_includes/partials/header.njk`

## Support hrefs (6)

- `src/404.html`
- `src/dmca.html`
- `src/sitemap.njk`
- `src/study-materials.html`
- `src/viewstudymaterials.html`
- `src/_includes/partials/footer.njk`

## HTML navigation hrefs (91)

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
- `src/speech-to-text.html`
- `src/study-materials.html`
- `src/support.njk`
- `src/terms.njk`
- `src/text-to-audio.html`
- `src/text-to-speech.html`
- `src/viewstudymaterials.html`
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

## Missing canonical (HTML documents) (2)

- `src/404.html`
- `src/login.html`

## Progress, processing, and result containers (26)

- `src/tools/add-page-numbers-to-pdf.html — successBox, resultInfo`
- `src/tools/chat-with-pdf.html — loadingState, spinner, loadingText`
- `src/tools/compress-pdf.html — processingSection, progress-bar, overallProgress, processingList, resultsSection, results-section glass-card, success-message, results-stats, resultsList, download-section, autoClear`
- `src/tools/delete-pdf-pages.html — progressSection, progress-bar, progressFill`
- `src/tools/heic-to-jpg.html — loadingLibrary, processingSection, overallProgress, processingList, resultsSection, results-section glass-card, success-message, results-stats, resultsList, download-section, autoClear`
- `src/tools/image-compressor.html — processingSection, overallProgress, processingList, resultsSection, results-section glass-card, success-message, results-stats, resultsList, download-section, autoClear`
- `src/tools/image-crop.html — resultsSection, results-section glass-card, success-message, download-section, autoClear`
- `src/tools/image-format-converter.html — processingSection, overallProgress, processingList, resultsSection, results-section glass-card, success-message, results-stats, resultsList, download-section, autoClear`
- `src/tools/image-resize.html — processingSection, results-section glass-card, progress-bar, overallProgress, processingList, resultsSection, results-section glass-card, success-message, resultsList, download-section, autoClear`
- `src/tools/image-to-text.html — progress, result`
- `src/tools/jpg-to-pdf.html — progress`
- `src/tools/merge-pdf.html — progressSection, progressContainer, resultsSection, results-section glass-card, success-message, results-stats, download-section, autoClear`
- `src/tools/passport-photo-maker.html — resultsSection, results-section glass-card, success-message, autoClear`
- `src/tools/password-protect-pdf.html — successBox`
- `src/tools/pdf-page-counter.html — resultBox, result-header, loadingState, spinner`
- `src/tools/pdf-summarizer.html — loadingState, spinner, loadingText, summaryResult`
- `src/tools/pdf-to-flashcards.html — loadingState, spinner, loadingText, fc-progress, progressBar`
- `src/tools/pdf-to-word.html — processingSection, spinner, processingStatus, progress-bar-container, progressBar, resultsSection, resultPill`
- `src/tools/pdf-unlock.html — successBox`
- `src/tools/pdf-watermark.html — progressSection, results-section glass-card, progressContainer, resultsSection, results-section glass-card, success-message, download-section, autoClear`
- `src/tools/qr-code-generator.html — progressWrap, progress-bar, progressFill, statusMsg, qrOutput`
- `src/tools/redact-pdf.html — progressWrap, progress-bar, progressFill, progressText, resultsList, emptyResults`
- `src/tools/rotate-pdf.html — progressSection, progressContainer, resultsSection, results-section glass-card, success-message, download-section, autoClear`
- `src/tools/split-pdf.html — progressSection, progressContainer, resultsSection, results-section glass-card, success-message, results-stats, download-section, autoClear`
- `src/tools/webp-to-jpg.html — processingSection, overallProgress, processingList, resultsSection, results-section glass-card, success-message, results-stats, resultsList, download-section, autoClear`
- `src/tools/word-to-pdf.html — processingSection, spinner, processingStatus, progress-bar-container, progressBar, resultsSection, resultPill`

## Additional files

- Authentication: `src/js/auth.js`
- Routing/cache: `src/_redirects`, `src/sw.js`, `scripts/prepare-site.mjs`, `src/sitemap.njk`
- Typography/CTA spacing: `src/index.njk` (active CTA: Discover More; existing gap: 16px)
- Hamburger: `src/_includes/partials/header.njk`
- Card headings: `src/tools.njk` (including Resume Builder)
- Counts: `src/index.njk`, `src/about.njk`, `src/tools.njk`, `src/_includes/partials/meta.njk`
- Compression metadata/helper: `src/tools/compress-pdf.html`
- Google verification token: `src/google6ec5c9097526273f.html` is not an HTML document; preserve byte-for-byte.

## Generated Sign Out matches before rebuild

- `404.html`
- `about.html`
- `dmca.html`
- `index.html`
- `library.html`
- `privacy.html`
- `refund.html`
- `study-materials.html`
- `support.html`
- `terms.html`
- `tools.html`
- `viewstudymaterials.html`
- `tools/pdf-editor.html`

## Additional runtime/template matches discovered during browser verification

- `src/js/app.js`: MobileMenu replaced hamburger markup with text during menu state changes, removing the aria-hidden wrapper.
- `src/tools/pdf-editor.njk`: pdf-load-status, find-result-status, pdf-stage-status, pdf-export-notice, and pdf-mobile-status runtime containers.
