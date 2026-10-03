# Tool workflow audit — 2 October 2026

Scope: all **46 registered tools**, tested from the generated Eleventy site in an isolated Chromium browser. Synthetic documents and images only; no customer documents, microphone recording, real payment, paid AI requests, or secret values were used.

This is a functional audit with fixes, not a certification that every document, browser, or external service will work. A page loading successfully is recorded separately from completing its workflow.

## Evidence and methods

- `scripts/test-tool-workflows.mjs`: 45 workflow/regression scenarios, including execution of all 46 tools. Tests inspect downloaded bytes, PDF pages/text/rotation, encryption, image dimensions/alpha, ZIP contents, Word/PowerPoint XML, and a decoded QR payload. Genuine bundled OCR and HEIC decoders run locally.
- `scripts/test-pdf-output.mjs`: compression and flattening with forms, links, metadata, rotated pages and feature-loss acknowledgements; rendered-pixel comparison checks image output fidelity.
- `scripts/test-pdf-editor.mjs`: actual edits, font replacement, exports, coordinate alignment and rotated-page behavior.
- `scripts/test-ai-document.mjs`: chat/summarizer coverage limits, OCR opt-in, bounded conversation context and provider error behavior. Provider responses are intercepted test fixtures.
- `scripts/test-mobile.mjs`: 84 content pages at 320, 390 and 768 CSS pixels; navigation, preview, cart, loaded editor and service-worker/offline behavior at four device sizes.
- `scripts/test-product-detail.mjs`: purchase/review UI at desktop, small phones and landscape widths.
- The new workflow suite can be repeated with `TOOL_MOBILE=1` for touch/mobile Chromium. It also checks page overflow after the loaded workflow. Emulation does not establish physical iOS/Safari, Android memory limits, native voices, microphone quality or virtual-keyboard behavior.
- Rendered output evidence is saved under `.tmp_tool_audit/`; selected checked images are included under `docs/assets/tool-audit/`.

## Per-tool coverage

“Local” means the stated workflow uses real browser libraries and real generated output. “Controlled” means an external or native-device response is supplied by the test; it does **not** establish live service acceptance.

| Tool | Tested workflow and important fix | Boundary / remaining acceptance |
|---|---|---|
| Compress PDF | Local: feature-preserving compression, impossible target, opt-in image mode, smaller-file guard, retained forms/links/text and page count | A requested size is not guaranteed; image mode loses interactive features |
| Merge PDF | Local: two files, reorder, actual output order/page count/rotation; duplicate reorder listeners removed; cumulative file cap | Interactive form relationships and document-level outlines require representative acceptance files |
| Split PDF | Local: deduplicated ranges, malformed/out-of-bounds rejection, retained pages/rotation; manual selection clears stale validation and loaded thumbnails fit phones | Output follows source-page order, not the order of typed ranges |
| PDF Reader | Local: rendering, navigation and search | Very large documents and physical-device memory remain acceptance cases |
| PDF Editor | Local: real existing-text edits, annotations, export and rotated coordinates in dedicated suite | Unsupported fonts/backgrounds remain explicitly limited; verify complex PDFs before use |
| PDF Presentation | Local: enter presentation, navigate, drawing canvas, timer, exit/reset | Fullscreen availability depends on the browser |
| PDF to Word | Controlled: ticket flow, invalid output rejection, valid OOXML download and retry; response timeout and archive/XML validation added | Live conversion remains gated by Worker/conversion-service configuration; exact layout fidelity is not guaranteed |
| Word to PDF | Controlled: ticket flow, invalid output rejection, readable PDF download and retry; timeout and PDF parser validation added | Live conversion and representative DOC/DOCX/ODT/RTF files need provider acceptance |
| PDF to Text | Local: all-page extraction, literal hostile strings, replacement, TXT/Markdown exports | Image-only pages require OCR |
| HTML to PDF | Local: sanitized preview, hostile/protocol-relative URL removal and multi-page export | Raster PDF output; remote embedded content is intentionally removed |
| PDF Scratchpad | Local: immediate TXT export, pending-edit preservation across note switches, malformed stored data | Browser storage can be cleared by users or browser policy |
| JPG to PDF | Local: ordered PNG/JPEG inputs, A4 page output; duplicate drop processing and square-image scaling corrected | Output contains images; it does not create searchable text |
| PDF to JPG | Local: selected page and ZIP output with genuine JPEG encoding and expected dimensions | Raster export does not preserve text, links or forms |
| Image to Text (OCR) | Local: actual bundled OCR on synthetic text image, correct TXT output, no OCR.space request | Accuracy depends on language, resolution and handwriting; cloud fallback requires opt-in |
| HEIC to JPG | Local: genuine synthetic HEIC decoding, corrupt-file result and ZIP download | First image only for multi-image files; original camera metadata is not retained |
| Image Compressor | Local: PNG transparency retained at low quality, correct MIME/extension, original kept if smaller, ZIP download | PNG stays lossless; JPEG/WebP quality settings are lossy |
| Image Crop | Local: visible initial crop, working aspect ratio and genuine WebP output; pointer support and image-load errors corrected | Further physical touch-device acceptance remains necessary |
| Image Format Converter | Local: JPEG/PNG/WebP encoding and alpha behavior; ZIP loading and duplicate-name handling corrected | Supports the formats actually offered in the UI |
| Image Resize | Local: percentage sizing, actual source aspect ratio, bounded dimensions, duplicate ZIP entries; missing ZIP dependency fixed | Mixed-ratio batches preserve each image’s ratio when locked |
| WebP to JPG | Local: white compositing for transparency, JPEG output and ZIP download | JPEG cannot retain transparency |
| Crop PDF | Local: asymmetric crops on rotated pages and existing offset CropBoxes, MediaBox retained; source-buffer ownership fixed | Cropping hides content outside the box; it is not redaction |
| Delete PDF Pages | Local: actual selected deletion and retained text; failed-upload recovery and selection-state correction | At least one page must remain |
| Rotate PDF | Local: cumulative rotations and successful export after preview; detached source buffer fixed | Rotation changes page orientation, not document reading order |
| PDF Page Reorder | Local: reverse, duplicate, undo and actual output order; source-buffer ownership fixed | Document-level navigation structures need representative acceptance |
| PDF Bookmarks | Local: Unicode titles, destination pages and genuine outline output; import existing page bookmarks, clear old state and allow deleting all | Saving creates a flat page-destination outline; unsupported actions and custom zoom are disclosed |
| Add Page Numbers | Local: start offset, coherent Page N of total and retained source text; CropBox/rotation positioning and input validation corrected | Does not revise existing numbers already drawn into a PDF |
| PDF Watermark | Local: every-page text, unsupported-character recovery and retry; explicit errors and Latin/Devanagari font support added | Text watermarks only; other scripts/glyphs may be unsupported |
| PDF Page Counter | Local: valid/corrupt mixed batch and separate per-file errors | Password-protected files may require unlocking first |
| Compare PDFs | Local: two documents, text-layer rendering and burst navigation/zoom; overlapping render cancellation fixed | Highlights similar text; it is not a semantic or pixel-perfect document diff |
| Highlight Extractor | Local: genuine highlight annotations and source text exported as TXT/CSV | Does not recover ordinary coloured text or highlights baked into an image |
| Sign PDF | Local: repeated exports, apply-to-all idempotence, rotated/hidden pages, cleared signatures and mobile-normalized placement | Drawn signature annotation only; no certificate-backed signing or identity verification |
| Password Protect | Local: mismatched-password prevention, genuine encrypted output and password-assisted reopening | Keep the password; security acceptance should include intended PDF readers |
| PDF Unlock | Local: wrong-password error, retry and valid retained-text output | Requires the correct password; not a password-recovery service |
| Redact PDF | Local: actual synthetic-email detection, opaque pixel coverage including descending letters, raster rebuild, no text layer, review gate, retained physical dimensions; controlled scan-failure recovery | Detection can miss data; inspect every page. No security claim that every sensitive item was found |
| Flatten PDF | Local: static filled form values; explicit image-mode feature loss; repeated export and rendered fidelity | Form mode and image mode have different results and limitations |
| Chat with PDF | Controlled: OCR consent, coverage disclosure, bounded context and provider errors in dedicated suite | Live AI access, quotas and answer accuracy require acceptance |
| AI PDF Summarizer | Controlled: bounded document portion, coverage/truncation disclosure, string errors and retry | Live AI access and summary correctness require acceptance |
| PDF to Flashcards | Controlled: fenced JSON validation, coverage, service errors/retry, Unicode/formula-safe CSV and paginated Latin PDF | AI cards need accuracy review; PDF supports basic Latin, CSV preserves other scripts |
| QR Code Generator | Local: PNG decoded back to the intended URL; controlled upload-mode tests in existing suite | File QR modes upload to third-party hosts; live availability/retention remains external |
| Passport Photo Maker | Local: mobile pan/export consistency, pixel dimensions, single JPEG and sheet PNG; print-scale/DPI wording corrected | Verify the authority’s photo rules and physical print size; no acceptance guarantee |
| Resume Builder | Local: Unicode TXT/DOCX, XML escaping and PDF output; modern colour normalization fixes export failure, fixed A4 export on phones, visible name and corrected thirteen-template selectors | PDF is raster output; DOCX layout depends on the reader and installed fonts |
| Invoice Generator | Local: quantities, prices, tax/discount amounts, bounded discount and PDF/PNG export | Calculation currently applies tax and discount to the base amount; check requirements before issuing invoices |
| Speech to Text | Controlled native recognition events: preserved words, error recovery and TXT export; real English/Hindi PDF export in existing suite | Physical microphone, browser recognition service, permission and accuracy need acceptance |
| Text to Speech | Controlled native voice events: stop/restart safety; real PDF extraction, failed-file recovery and TXT | Device voices/playback need acceptance. Unreliable public-proxy MP3 export removed and marked unavailable |
| Remove Background | Local corrupt-image failure/retry; deferred model downloads, corrected Hugging Face CDN CSP, and upfront large-download/memory disclosure | Two live BEN2 attempts reached 69% download; the longer attempt timed out after seven minutes. Successful inference/segmentation quality and physical-device memory remain **unverified** |
| Presentation Maker | Local: actual PPTX archive/slide XML, Unicode text, dimensions, backgrounds/font units and multi-page PDF; incorrect library export API fixed | PPTX rendering depends on fonts/readers; PDF is raster output |

## Release gates checked on 2 October

The public Worker health endpoint responds, but its reported route list still lacks the conversion-ticket and conversion routes introduced by this branch. The repository’s `gh secret list` response is empty. Neither fact establishes that the branch’s backend is deployed.

Before production publication:

1. Configure repository deployment credentials and the required Worker/conversion-service secrets through their secure settings.
2. Deploy and confirm the intended frontend and Worker release IDs together, then exercise real protected conversion and AI workflows.
3. Complete test-mode purchase, payment verification, fulfilment, recovery, refund and webhook acceptance; the frontend tests use synthetic checkout responses.
4. Test the important journeys on physical Android and iPhone/Safari devices, including memory pressure, virtual keyboard, uploads and downloads.
5. Complete the attributed human DBMS-notes review described in `DBMS_REVIEW_BRIEF.md` before expanding paid content.

No claim of “all tools production certified” follows from these automated tests. Fixes and passing local evidence are ready for review; the outstanding provider/device checks are explicit.

The full local `npm test` suite passed after the source fixes. All 45 new scenarios also passed in the final mobile/touch run, including loaded-page overflow checks. Static performance budgets pass, and `npm audit` reports zero vulnerabilities in the package dependency graph. Selected rendered outputs were visually inspected: redaction coverage, rotated signature placement, mixed-page cropping, Hindi resume text, presentation text and a long flashcard answer ending on its continuation page. The model-download timeout above is a separate live-network result, not a passing inference test.
