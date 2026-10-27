# OnlinePDFPro tool audit - 11 October 2026

Scope: all 46 tools listed in the live directory at https://onlinepdfpro.com. Tested release: `71f0fc503d7f9f96f5484d0fa041766bc2fb85a6`.

**Verdict: the representative core workflows passed, but every tool is not yet verified end to end.** Thirty-eight tools passed their representative main workflows; eight have specific end-to-end, hardware or quality gaps detailed below. These are sample-based functional checks, not a guarantee for every file or device.

## Evidence

- All 61 audited public pages, including all 46 tools, returned HTTP 200 with no route/metadata audit errors.
- Live frontend and API report the same release; API health is OK.
- Desktop workflow batch: 46/46 checks passed. The batch includes simulated provider and speech tests; this count is not a count of fully verified tools.
- Phone emulation (390 x 844) batch: 45/46 initially passed. Image Compressor timed out once, then passed two isolated retests. Original failed result retained in the evidence.
- Additional live compression/flattening checks passed; live PDF editor regression and source-font/background fidelity checks passed, including a phone edit/download.
- AI scope/consent/error and recovery tests passed with intercepted provider responses. Actual AI/conversion calls did not proceed because automated Turnstile verification was not obtained; protections were not bypassed.
- Real Remove Background inference completed with the default BEN2 model. Synthetic input does not establish portrait segmentation quality.
- Selected generated signing, presentation, crop, redaction and resume pages were rendered; signing, presentation and resume renders were visually inspected.
- Dependency audit reported zero known vulnerabilities. This is not a full security audit.

## Every tool

| Tool | Result | Evidence / limit |
| --- | --- | --- |
| [Compress PDF](https://onlinepdfpro.com/tools/compress-pdf) | Passed tested workflow | Structural and image-based modes tested; output reopens; page count retained; default mode keeps searchable text, forms and links. Target size is not guaranteed. Optional rasterization loses searchability/forms/links. |
| [Merge PDF](https://onlinepdfpro.com/tools/merge-pdf) | Passed tested workflow | Reordered two files; downloaded output has the selected page order and retained rotation. |
| [Split PDF](https://onlinepdfpro.com/tools/split-pdf) | Passed tested workflow | Valid, repeated and malformed ranges checked; downloaded page count/order and rotation verified. |
| [PDF Reader](https://onlinepdfpro.com/pdf-reader) | Passed tested workflow | Page rendering, navigation, search and zoom passed. |
| [PDF Editor](https://onlinepdfpro.com/tools/pdf-editor) | Passed tested workflow | Existing-text editing, source-font reuse, white/solid-color backgrounds, missing glyphs, undo/redo, zoom, opacity and downloaded PDF verified. Phone tap/edit/download passed. Complex backgrounds and unavailable font glyphs remain fidelity limitations. |
| [PDF Presentation](https://onlinepdfpro.com/pdf-presentation-mode) | Passed tested workflow | Page navigation, draw canvas, timer and reset passed; physical-device fullscreen behavior was not tested. |
| [PDF to Word](https://onlinepdfpro.com/tools/pdf-to-word) | Partially verified | Client validation, rejection of invalid output and retry passed. A real conversion through the protected gateway remains unverified: the automated browser did not obtain a Turnstile response. |
| [Word to PDF](https://onlinepdfpro.com/tools/word-to-pdf) | Partially verified | Client validation, rejection of invalid output and retry passed. A real conversion through the protected gateway remains unverified: the automated browser did not obtain a Turnstile response. |
| [PDF to Text](https://onlinepdfpro.com/pdf-to-text-extractor) | Passed tested workflow | All-page TXT/Markdown extraction and literal text handling passed. |
| [HTML to PDF](https://onlinepdfpro.com/tools/html-to-pdf) | Passed tested workflow | Sanitized HTML and multi-page PDF output passed. |
| [PDF Scratchpad](https://onlinepdfpro.com/pdf-scratchpad) | Passed tested workflow | Immediate PDF export and switching notes retain pending edits. |
| [JPG to PDF](https://onlinepdfpro.com/tools/jpg-to-pdf) | Passed tested workflow | JPEG/transparent PNG produce ordered A4 PDF pages. |
| [PDF to JPG](https://onlinepdfpro.com/pdf-to-jpg) | Passed tested workflow | Selected pages export valid JPEG images and ZIP entries. |
| [Image to Text (OCR)](https://onlinepdfpro.com/tools/image-to-text) | Passed tested workflow | Genuine local OCR recognized the synthetic image and exported TXT. Optional third-party cloud retry not verified with the real service. |
| [HEIC to JPG](https://onlinepdfpro.com/tools/heic-to-jpg) | Passed tested workflow | Genuine synthetic HEIC decodes and exports; corrupt input gives a recoverable error. |
| [Image Compressor](https://onlinepdfpro.com/tools/image-compressor) | Passed tested workflow | Output dimensions/PNG transparency and ZIP export passed on desktop. Initial mobile batch timed out once; two isolated mobile retests passed. Keep this intermittent observation open for monitoring. |
| [Image Crop](https://onlinepdfpro.com/tools/image-crop) | Passed tested workflow | Initial crop, square aspect ratio, dimensions and genuine WebP output passed. |
| [Image Format Converter](https://onlinepdfpro.com/tools/image-format-converter) | Passed tested workflow | Chosen format, dimensions, PNG transparency and ZIP output passed. |
| [Image Resize](https://onlinepdfpro.com/tools/image-resize) | Passed tested workflow | Dimensions, aspect locking, PNG transparency and duplicate ZIP filenames passed. |
| [WebP to JPG](https://onlinepdfpro.com/tools/webp-to-jpg) | Passed tested workflow | Valid JPEG output, expected dimensions and white backing for transparency passed. |
| [Crop PDF](https://onlinepdfpro.com/tools/crop-pdf) | Passed tested workflow | Rotated/cropped page coordinates, retained source bytes and saved PDF dimensions passed. |
| [Delete PDF Pages](https://onlinepdfpro.com/tools/delete-pdf-pages) | Passed tested workflow | Selected deletion exports retained pages and text. |
| [Rotate PDF](https://onlinepdfpro.com/tools/rotate-pdf) | Passed tested workflow | Accumulated rotation values and retained text verified in saved output. |
| [PDF Page Reorder](https://onlinepdfpro.com/pdf-page-reorder) | Passed tested workflow | Reverse, duplicate, undo and actual exported page order passed. |
| [PDF Bookmarks](https://onlinepdfpro.com/pdf-bookmark) | Passed tested workflow | Unicode outline labels and bookmark destinations verified in saved PDF. |
| [Add Page Numbers](https://onlinepdfpro.com/tools/add-page-numbers-to-pdf) | Passed tested workflow | Offset numbering, totals and retained content verified in saved output. |
| [PDF Watermark](https://onlinepdfpro.com/tools/pdf-watermark) | Passed tested workflow | Text appears on every page including mixed rotation; retry handling passed. |
| [PDF Page Counter](https://onlinepdfpro.com/tools/pdf-page-counter) | Passed tested workflow | Valid and corrupt batch files report separate correct results. |
| [Compare PDFs](https://onlinepdfpro.com/compare-pdf) | Passed tested workflow | Both documents render; navigation and rapid-change recovery passed. |
| [Highlight Extractor](https://onlinepdfpro.com/pdf-highlighter-extractor) | Passed tested workflow | Genuine highlight annotations export page references, TXT and CSV. |
| [Sign PDF](https://onlinepdfpro.com/tools/sign-pdf) | Passed tested workflow | Visual signature/image placement, repeated exports, page rotation and cleared signatures passed. This check does not validate certificate-based digital signing. |
| [Password Protect](https://onlinepdfpro.com/tools/password-protect-pdf) | Passed tested workflow | Downloaded PDF is encrypted and opens with the chosen password; contents retained. |
| [PDF Unlock](https://onlinepdfpro.com/tools/pdf-unlock) | Passed tested workflow | Wrong-password recovery and successful decrypted retained-text export passed. |
| [Redact PDF](https://onlinepdfpro.com/tools/redact-pdf) | Passed tested workflow | Text scan, manual-review gate, opaque masks, retry and rasterized PDF export passed for the synthetic fixtures. A full confidential-document security audit was outside this test. |
| [Flatten PDF](https://onlinepdfpro.com/flatten-pdf) | Passed tested workflow | Filled values export statically; default mode preserves text, links, metadata and rotation. Image mode/repeated export also passed. |
| [Chat with PDF](https://onlinepdfpro.com/tools/chat-with-pdf) | Partially verified | Document extraction, context limits, OCR consent, scope disclosure and simulated-provider error recovery passed. A real AI response remains unverified behind Turnstile. |
| [AI PDF Summarizer](https://onlinepdfpro.com/tools/pdf-summarizer) | Partially verified | Text limits, partial-document disclosure, simulated response and retry passed. A real AI response remains unverified behind Turnstile. |
| [PDF to Flashcards](https://onlinepdfpro.com/tools/pdf-to-flashcards) | Partially verified | Simulated AI output parsing, Unicode CSV/PDF downloads, long answers and retry passed. A real AI response remains unverified behind Turnstile. |
| [QR Code Generator](https://onlinepdfpro.com/tools/qr-code-generator) | Passed tested workflow | Downloaded PNG decodes to the entered URL. |
| [Passport Photo Maker](https://onlinepdfpro.com/tools/passport-photo-maker) | Passed tested workflow | Pan/crop consistency, chosen physical dimensions and image/sheet output passed at phone width. Government acceptance was not assessed. |
| [Resume Builder](https://onlinepdfpro.com/resume-cv-builder) | Passed tested workflow | Unicode TXT/DOCX/PDF export and escaped markup handling passed; generated PDF visually inspected. |
| [Invoice Generator](https://onlinepdfpro.com/invoice-generator) | Passed tested workflow | Calculations, bounded discounts, PDF and PNG exports passed. |
| [Speech to Text](https://onlinepdfpro.com/speech-to-text) | Partially verified | Recognition-event handling and error recovery passed with a simulated browser recognition API. Actual microphone permission, recognition accuracy and browser/device compatibility remain unverified. |
| [Text to Speech](https://onlinepdfpro.com/text-to-speech) | Partially verified | Playback-state handling, stop/cancel and bad-PDF recovery passed with simulated speech APIs. Actual audible playback and installed voices remain unverified. |
| [Remove Background](https://onlinepdfpro.com/remove-background) | Partially verified | The real BEN2 model downloaded and processed a synthetic image into a 240 x 120 PNG on desktop. Corrupt-image and stalled-load recovery checks passed. Portrait/hair quality, an actual download-button workflow, and physical-phone performance remain unverified; first-use model download is about 220 MB. |
| [Presentation Maker](https://onlinepdfpro.com/presentation-maker) | Passed tested workflow | Generated PPTX slide contents and two-page PDF verified; output visually inspected. |

## Remaining acceptance work

1. In a normal browser, complete Turnstile and verify PDF to Word and Word to PDF with genuine output downloads. For the three AI tools, verify actual answers and generated flashcards against a known document.
2. Test speech recognition with real microphone permission and speech playback with real audio/voices on supported browsers.
3. Test default background removal on representative portraits, hair and complex edges; check download buttons and physical Android/iPhone memory, loading and quality.
4. Repeat larger/real file workflows on Android Chrome and iPhone Safari. The automated phone-width results are not physical-device tests.
5. Monitor the initial Image Compressor timeout with the same inputs and on slower devices. Two isolated passes did not reproduce a persistent failure.

This audit covers the tools. Paid-note checkout, payment capture, webhook delivery, authentication, purchases, content correctness, analytics collection and AdSense approval were not certified by this run.

## Raw local evidence

Evidence directory: P:\onlinepdfpro\.implementation-review\.tmp_tool_audit\audit-20261011

Main files: public-routes.json, desktop/results.json, mobile-full-results.json, mobile-image-retry.log, mobile-image-retry-2.log, live-pdf-output.log, live-ai-client.log, live-editor.log, live-editor-fidelity.log, real-services.json and background-real.json.
