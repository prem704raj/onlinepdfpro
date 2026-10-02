# Batch 7 — tool workflows and export reliability

Date: 2 October 2026. Branch: `codex/production-foundation`, draft PR #5.

The audit now covers all 46 registered tools, with workflow tests that inspect actual downloaded output rather than only checking whether the page loads. The complete per-tool evidence and limitations are in [TOOL_WORKFLOW_AUDIT_2026-10-02.md](TOOL_WORKFLOW_AUDIT_2026-10-02.md).

## Important repairs

- Merge moves a file once per tap. Split rejects malformed/out-of-range selections and fits loaded previews on phones. Rotate, Reorder and Crop keep usable source buffers after PDF.js previews; Crop respects rotation and existing CropBoxes. Page numbering uses the chosen start offset consistently.
- Signature placement uses normalized displayed coordinates, including hidden/rotated pages; repeated exports start from the original file, and repeated Apply to all does not multiply annotations. Unsupported type/upload and certificate-signing claims were removed.
- Redaction rebuilds raster pages at their original physical dimensions, requires a review acknowledgement, and recovers from scan errors. Bounds include ascenders, descenders and rotation with padding: rendered-pixel checks cover the descending parts of a detected synthetic email. Automatic detection still requires inspection for missed sensitive content.
- PDF to JPG now exports genuine JPEG bytes and names. Image cropping initializes visibly, respects aspect selection and exports the selected format. PNG compression retains transparency; all five batch image tools load the ZIP dependency and preserve files with identical names.
- Presentation Maker uses the bundled PowerPoint library's actual export API and correct background/font units. Resume export handles modern CSS colors, uses an A4 layout on phones, and keeps names visible. The thirteen resume template selectors now target their child elements correctly.
- Scratchpad preserves pending edits before switching/exporting. Flashcards validate AI JSON, report document coverage, reset verification before retry, protect spreadsheet formulas and paginate long Latin PDF answers. Unicode remains available through CSV.
- Conversion frontends validate the returned PDF/OOXML instead of downloading an HTML error as a document; requests time out and allow retry. These are controlled-provider tests, with live backend acceptance still outstanding.
- Speech recognition preserves words containing command-like substrings and recovers from service errors. Speech playback ignores stale completion events after Stop. Unreliable public-proxy MP3 export is unavailable with a clear explanation; device speech and TXT remain.
- Background-removal model downloads start after image selection. The security policy allows the Hugging Face CDN to which model weights actually redirect; corrupt image inputs show a recoverable error.
- Shared uploads reject empty/unsupported files and infer known image/PDF MIME types when mobile uploads omit them, preserving the original bytes.

## Verification and release

The new `npm run test:tools` suite is also part of `npm test`. It includes genuine local OCR and HEIC decoding, QR-payload decoding, encrypted PDF reopening, PDF text/rotation/annotation checks, image pixels/dimensions, and archive XML checks. Touch/mobile emulation repeats the workflow suite. Selected PDF renders are checked visually and retained in `docs/assets/tool-audit/`.

Final local checks passed: `npm test`; all 45 new workflow scenarios repeated with `TOOL_MOBILE=1`, including the loaded-page overflow checks; `npm run perf:budget`; `npm audit` (zero dependency vulnerabilities); and `git diff --check`. Existing responsive checks cover 84 pages at three widths. Provider mocks and synthetic native speech events are explicitly distinguished from live acceptance.

The separate live BEN2 model check reached 69% download in both attempts, then stopped progressing; the longer attempt ended after seven minutes. This is not a successful background-removal inference test. The tool now discloses its approximately 220MB initial BEN2 download and device memory requirement. Model delivery and successful segmentation remain acceptance work.

These changes are published to the [branch preview](https://codex-production-foundation.onlinepdfpro.pages.dev/tools). PR #5's checks identify the deployed commit and validation result; the preview's `/release.json` reports its release identity.

Production publication remains gated by deployment credentials/runtime secrets, a matching Worker release, live protected conversion/AI workflows, purchase/payment/delivery/recovery/refund acceptance, physical Android/iPhone checks, and the human DBMS-notes review. The public Worker route list and repository secret listing checked on 2 October do not establish that this branch's backend is deployed.
