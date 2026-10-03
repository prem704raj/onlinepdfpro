# PDF output reliability — implementation batch 2

Prepared on 1 October 2026. These changes are on the review branch; production application code has not been published.

## Changes

- Compression now resaves the full document in its default structural mode, instead of copying pages into a document that can lose catalog-level features. Image rendering requires explicit opt-in. Results report the actual output method and whether the target was reached. Size, quality and backend-processing promises have been corrected to match the implementation.
- Flattening now has two implemented modes. The default makes form appearances static while preserving searchable text and unrelated links/annotations. Image mode renders visible pages as JPEGs and requires acknowledgement that document features will be lost. Four previously ignored checkboxes have been replaced with these real choices.
- Form mode removes dangling widget references left by the bundled pdf-lib implementation. Image mode copies the original buffer before PDF.js transfers it, releases rendering resources, and bounds individual canvas sizes. Repeat processing retains the original data.
- The metadata option removes the standard Info dictionary, with an explicit explanation that this is not XMP/hidden-content sanitization. Neither mode is described as making documents impossible to edit or as secure redaction.
- The existing editor's true content-stream replacement remains intact. A persistent notice explains its fallback behavior, and export warnings now identify visual text/OCR overlays and whiteout that can leave underlying data recoverable.
- Known editor completion/failure events pass the analytics allowlist without accepting file names or document text.

## Verification

`npm run build`, `npm test`, `npm run perf:budget`, and `npm audit` passed locally after these changes. The suite includes real exported PDFs, not just DOM/source checks:

- Form flattening retains visible filled values, searchable text, links, author metadata when requested, page count and rotation, while removing interactive form fields.
- Image mode rejects an unacknowledged request, removes searchable text and links, preserves rendered rotated dimensions, and retains the visible page appearance within a JPEG tolerance. A subsequent form export from the same uploaded file succeeds.
- Default compression retains filled forms, links and searchable text when it cannot reach an unrealistic target. Explicit image compression reports its method and never returns a file larger than the original.
- The existing editor tests verify that supported replacement removes the old extracted text, preserves font resources and coordinates, and that the fallback warning is shown.

These fixtures do not establish support for every PDF, XFA form, damaged document, signed PDF, or non-Latin field without an existing appearance. Saving can invalidate digital signatures. Test representative customer files and review unsupported cases before declaring the tools production-ready.
