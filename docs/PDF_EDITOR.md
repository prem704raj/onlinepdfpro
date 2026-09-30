# OnlinePDFPro PDF Editor

## Route and site integration

`/tools/pdf-editor.html` is generated from `src/tools/pdf-editor.njk`. It uses the site's base layout, navigation, theme controls, CSS variables, and shared tool discovery data. `src/_data/tools.js` supplies the featured PDF Editor registry entry. `/tools/pdf-editor` and `/tools/pdf-editor/` permanently redirect to the `.html` canonical route. The upload screen also provides a locally generated sample PDF so visitors can try existing-text editing without choosing a file.

The editor is implemented as small vanilla JavaScript modules in `src/js/pdf-editor/`. PDF.js, its worker, pdf-lib, fontkit, Tesseract.js, and local fallback fonts are site assets. Fontkit (plus its regenerator runtime) is loaded only when custom-font work requires it, and Tesseract is loaded only for OCR. The selected PDF, extracted text, OCR results, and edit state remain in browser memory. This editor does not upload a document or send its text, filename, or metadata to a service. Analytics events contain only product event names and `tool_name: pdf_editor`.

## Existing-text editing pipeline and invariants

The source PDF is rendered by PDF.js. `text-extractor.js` turns `getTextContent()` items into editor objects and stores the source transform, baseline, rotation, dimensions, and immutable source geometry (`originalX`, `originalY`, `originalWidth`, `originalHeight`). Screen placement is always derived from that document-space data through the active PDF.js viewport. Internal zoom may change viewport pixels, but it must never rewrite the source geometry used for export.

Existing-text edits have three distinct representations:

- **Source geometry** is the immutable position and size of the original PDF text run. It is used to locate the original operation and, for overlay fallback, the area that must be hidden.
- **Edited geometry** is the current text width/height after typing or restyling. Longer replacement text may grow this geometry without changing the source geometry.
- **Viewport geometry** is derived at render time from source/edited document coordinates and the active zoom. It is disposable display state.

The previous implementation blurred these layers in several places. `page-renderer.js` rendered the replacement background and replacement glyphs inside one DOM node, so setting text opacity also made the mask translucent and exposed the original glyphs. `text-editor.js` expanded `object.width` for replacement text while `page-renderer.js` positioned the replacement from the original location, which made it unclear whether a width described source content or reflowed display content. `font-resolver.js` could display families such as Arial, Calibri, Roboto, Montserrat, or Cambria while `exporter.js` silently wrote Helvetica or Times, so preview and export did not share one font choice. `editor.js` called the sidebar textarea an inline editor even though page-level editing did not exist. `exporter.js` always painted a cover rectangle and then drew new text, leaving the original text operator in the PDF content stream.

The repaired pipeline treats editing mode as explicit state on each existing-text object:

- `true-text-replacement` means the exporter can identify and replace a bounded, supported source text operator safely.
- `visual-overlay-fallback` means the source operator is preserved and the editor uses an opaque mask plus replacement text. This is a visual edit and may leave old text extractable.
- `OCR-overlay` means the source page is image based and OCR created an editable overlay rather than original PDF text.

Preview masking and preview glyph rendering are separate layers. A fallback mask stays fully opaque; text opacity affects replacement glyphs only. Complex backgrounds are classified instead of averaged into a misleading flat color. A contextual warning is shown only when an edit actually needs the visual-overlay fallback on a non-uniform background.

Font resolution also has one source of truth. Each text object owns a font descriptor containing the raw PDF name, normalized family, style, subset/embedded hints, preview font, export font, match quality, glyph coverage information when available, and a fallback reason. The browser preview and exported PDF should use the same chosen bytes whenever a bundled/custom font is selected. If newly typed characters are not encodable by the active font, the edit must stop at the font-replacement workflow instead of silently dropping or substituting glyphs.

## Modules

- `state.js` owns the PDF bytes and handles, page layout, document-space objects, selection, mode, zoom, dirty state, and page-layout change tracking.
- `pdf-loader.js` checks the PDF header and opens files with the local PDF.js worker. Password prompts stay in the page.
- `text-extractor.js` reads PDF.js text items and style/color hints. It creates word-level hit targets while retaining their source transforms and baselines.
- `font-resolver.js` normalizes PDF and subset font names and produces one preview/export descriptor, including bundled metric-compatible substitutions where needed.
- `font-runtime.js` lazy-loads local font bytes, Fontkit, and glyph-coverage checks.
- `vendor-loader.js` lazy-loads Fontkit, its regenerator runtime, and Tesseract when the relevant workflow needs them.
- `color-extractor.js` associates supported PDF fill-color operators with text, samples page pixels, and labels uncertain colors as estimated.
- `page-renderer.js` builds the lazy page canvas, thumbnails, selectable text layer, independent mask/glyph previews, and blank-page viewport.
- `inline-text-editor.js` mounts the page-level contenteditable editor with caret, Enter/blur commit, and Escape cancel behavior.
- `content-stream-replacer.js` performs bounded source-stream replacement for supported standard-font text runs and declines unsafe cases.
- `text-editor.js` updates text and object properties in PDF page coordinates.
- `object-editor.js` creates editable text, image, drawing, highlight, shape, whiteout, and copied objects.
- `page-manager.js` rotates, reorders, duplicates, deletes, and inserts pages while keeping page identity and associated edits together.
- `history.js` holds bounded undo/redo snapshots for objects and page layout.
- `ocr-editor.js` runs the bundled English OCR engine locally and creates approximate OCR word objects.
- `exporter.js` attempts true text replacement first, falls back to an opaque sampled-color overlay plus searchable replacement text when required, exports other vector/image edits, and validates the saved file locally with both PDF libraries.
- `editor.js` wires UI actions, keyboard shortcuts, page rendering, object selection, history, and export together.

## Coordinates and text hit targets

The editor keeps permanent object geometry in PDF page coordinates. PDF.js `PageViewport` converts between page and screen positions. Zoom changes the viewport and rendered canvas, not the object's stored coordinates.

PDF text runs can contain multiple words. The editor divides runs into word-level hit boxes by measuring browser text and proportionally mapping those measurements to the PDF.js run width. This makes values inside a sentence clickable, but word boundaries and widths are estimates. Text split among separate PDF objects is not joined into a single selectable phrase.

## Font and color matching

Internal names such as `g_d0_f1` are not treated as browser font names. The font resolver uses PDF.js style metadata when it provides a family name, strips subset prefixes, and maps common families to a close pdf-lib standard face.

The editor does not extract arbitrary embedded font programs from the source content stream. Supported PDF standard-font runs can keep their existing resource during true replacement. Arimo, Carlito, and Caladea are bundled for Arial-, Calibri-, and Cambria-like fallback workflows, and Noto Sans Devanagari is bundled for Devanagari. Preview and overlay export use the same chosen local font bytes when possible. Unsupported characters stop the edit/export path instead of being silently dropped. Complex scripts rely on Fontkit shaping and still need visual review; unsupported emoji are rejected when no usable font is available.

Text fill color is read from supported PDF.js operator-list color state when it can be aligned with text runs. Otherwise the UI labels the value as estimated. Original text alpha and all non-RGB PDF color spaces are not guaranteed to be retained exactly.

## Existing-text export and background handling

For supported straightforward standard-font runs, the exporter rewrites the matching text-show operand inside the existing content stream and leaves the surrounding graphics operators and original font resource intact. This is recorded as `true-text-replacement`, and extraction checks verify that the old string is gone. The engine deliberately refuses ambiguous, non-ASCII, restyled, moved, or structurally unsupported runs.

When a safe source-stream rewrite is unavailable, the editor uses `visual-overlay-fallback`: an opaque background mask hides the original glyphs and pdf-lib writes searchable replacement text at the saved baseline, position, size, color, rotation, and text opacity. The page is not rasterized. In this fallback mode the original text stream may remain searchable or extractable, so the operation is not secure redaction.

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
