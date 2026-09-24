# OnlinePDFPro PDF Editor

## Route and site integration

`/tools/pdf-editor.html` is generated from `src/tools/pdf-editor.njk`. It uses the site's base layout, navigation, theme controls, CSS variables, and shared tool discovery data. `src/_data/tools.js` supplies the featured PDF Editor registry entry.

The editor is implemented as small vanilla JavaScript modules in `src/js/pdf-editor/`. PDF.js, its worker, pdf-lib, fontkit, Tesseract.js, and the Devanagari fallback font are local site assets. The selected PDF, extracted text, OCR results, and edit state remain in browser memory. This editor does not upload a document or send its text, filename, or metadata to a service.

## Modules

- `state.js` owns the PDF bytes and handles, page layout, document-space objects, selection, mode, zoom, dirty state, and page-layout change tracking.
- `pdf-loader.js` checks the PDF header and opens files with the local PDF.js worker. Password prompts stay in the page.
- `text-extractor.js` reads PDF.js text items and style/color hints. It creates word-level hit targets while retaining their source transforms and baselines.
- `font-resolver.js` normalizes PDF and subset font names and maps recognized families to the closest available standard face.
- `color-extractor.js` associates supported PDF fill-color operators with text, samples page pixels, and labels uncertain colors as estimated.
- `page-renderer.js` builds the lazy page canvas, thumbnails, selectable text layer, object previews, and blank-page viewport.
- `text-editor.js` updates text and object properties in PDF page coordinates.
- `object-editor.js` creates editable text, image, drawing, highlight, shape, whiteout, and copied objects.
- `page-manager.js` rotates, reorders, duplicates, deletes, and inserts pages while keeping page identity and associated edits together.
- `history.js` holds bounded undo/redo snapshots for objects and page layout.
- `ocr-editor.js` runs the bundled English OCR engine locally and creates approximate OCR word objects.
- `exporter.js` covers changed source text with a sampled-color overlay, draws searchable replacement text and vector overlays with pdf-lib, and validates the saved file locally with both PDF libraries.
- `editor.js` wires UI actions, keyboard shortcuts, page rendering, object selection, history, and export together.

## Coordinates and text hit targets

The editor keeps permanent object geometry in PDF page coordinates. PDF.js `PageViewport` converts between page and screen positions. Zoom changes the viewport and rendered canvas, not the object's stored coordinates.

PDF text runs can contain multiple words. The editor divides runs into word-level hit boxes by measuring browser text and proportionally mapping those measurements to the PDF.js run width. This makes values inside a sentence clickable, but word boundaries and widths are estimates. Text split among separate PDF objects is not joined into a single selectable phrase.

## Font and color matching

Internal names such as `g_d0_f1` are not treated as browser font names. The font resolver uses PDF.js style metadata when it provides a family name, strips subset prefixes, and maps common families to a close pdf-lib standard face.

The editor does not extract arbitrary embedded font programs from the source content stream. Helvetica, Times, and Courier map to pdf-lib's standard faces; common system and web fonts such as Arial, Calibri, Cambria, Roboto, and Montserrat are mapped to a substitute and reported that way. Noto Sans Devanagari is bundled for Devanagari text when fontkit can embed it. Unsupported characters stop export with an error instead of being silently replaced. Devanagari fallback was checked for PDF validity; complex script shaping still needs a visual check, and unsupported emoji are rejected when no usable font is available.

Text fill color is read from supported PDF.js operator-list color state when it can be aligned with text runs. Otherwise the UI labels the value as estimated. Original text alpha and all non-RGB PDF color spaces are not guaranteed to be retained exactly.

## Existing-text export and background handling

Simple edits preserve the original PDF pages and draw a cover rectangle plus real PDF text at the saved baseline, position, size, color, and rotation. Unchanged page content stays vector; the page is not rasterized. The original text stream is not removed, so a visual replacement is not secure redaction and hidden text may remain searchable or extractable.

Before covering a changed text item, the editor renders the source page locally and samples the pixels around its bounds. Similar samples are used as a likely solid background. Varied samples produce a complex-background warning. Gradients, nearby graphics, images, transparency, textures, and long replacement text can still leave a seam or overlap nearby content. Inspect the downloaded PDF before relying on the visual edit.

For page-order or page-count changes, pdf-lib copies source pages in the editor's page order, applies page rotation, then draws edits on the copied pages. The exporter warns users to review forms, annotations, bookmarks, and links after page operations because copying pages can affect viewer-specific features.

Every export is reopened locally with pdf-lib and PDF.js and checked for a valid page count before download. Simple text edits avoid page-copying and preserve the loaded PDF structure as far as pdf-lib's incremental overlay approach allows. Encrypted files can be opened in PDF.js with their password, but pdf-lib cannot export an encrypted input; the user must remove protection first.

## Added content and page operations

The editor exports added text as real PDF text, images as embedded PNG/JPEG content, and drawing, highlights, and shapes as vector paths. PNG, JPEG, and browser-supported WebP uploads are decoded locally and normalized to PNG before placement. Typed or drawn signatures are placed as a transparent image. Whiteout is a visual cover and is explicitly not secure redaction.

The page panel supports clockwise rotation, moving the current page earlier/later, duplication, deletion, and insertion of an A4-size blank page. Undo/redo includes page layout and object edits. The final output is checked for the resulting page count.

## OCR

Pages with little or no selectable PDF text show a local OCR action. This release bundles English Tesseract data. OCR returns word boxes and confidence values; the editor labels those objects as OCR-assisted and uses approximate size, position, and Helvetica fallback styling. OCR is not presented as original PDF text or an exact font match. Other OCR languages are not bundled.

## Performance and mobile behavior

Page sizes are analyzed in small batches. Page canvases render as they approach the scroll viewport; distant canvas pixels are released. Thumbnail canvases render lazily and separately. Device-pixel ratio is capped to bound memory use. Very large files show a local loading status.

On narrow screens the page list opens as a drawer, text properties open as a bottom panel, and the editor toolbar scrolls horizontally. The page viewport supports touch scrolling and browser pinch zoom. Object drag uses pointer events and stores the result in document coordinates.

## Known limitations

- Font-family and exact glyph reuse is limited because the editor does not extract arbitrary embedded subset fonts from the PDF.
- Text geometry inside a multi-word run is approximated. Long replacements may overlap nearby content.
- Cover-and-overlay replacement keeps the source text stream in the file and cannot securely remove it.
- Complex page backgrounds may show an imperfect cover; the UI warns when page sampling suggests this case.
- OCR is English-only here and its overlays are approximate.
- Copying, rotating, or reordering pages can affect PDF forms, annotations, bookmarks, or links; the export notice asks users to review those features.
- Manual browser checks used synthetic 20-page and 121-page PDFs, a password-protected sample, and a one-page English scan. They covered direct navigation to page 121 with three nearby canvases rendered, invoice text replacement, 20-match replace-all, undo/redo, added text, image placement, typed signatures, page rotation/reorder/duplicate/delete/blank-page operations, local OCR and edited OCR export, Devanagari fallback export, and explicit rejection of unsupported emoji. A 390px mobile viewport showed the page drawer, bottom properties panel, and horizontally scrollable toolbar without document-width overflow; the existing Sign PDF route also loaded. The regression suite completed successfully. Complex embedded subset fonts, broader language scans, the full Android/iOS and cross-browser matrix, and visual review of every PDF variety remain untested.
