# OnlinePDFPro production-readiness report

Date: 2026-09-05  
Repository: `prem704raj/onlinepdfpro`  
Validated code through remediation commit: `3d6f53e` on `main`

The remediation work below is implemented in the checkout and covered by the
local build/regression gates listed at the end. The live site and live Worker
were not redeployed because required production secrets and external service
configuration are still missing; the exact actions are listed under
**External production actions**.

## Remediation ledger

| # | Issue / original severity | Files changed | Exact fix and evidence | Result / remaining limitation |
|---:|---|---|---|---|
| 1 | QR DOM-XSS — Critical | `src/tools/qr-code-generator.html` | Replaced user-controlled `innerHTML` with `textContent`, created nodes, and event listeners; filenames and archive entries are escaped through DOM APIs. Repository-wide audit found no unsafe QR interpolation. | Fixed. Malicious QR text is rendered as text in the browser regression suite. |
| 2 | QR CSP/upload architecture — High | `src/tools/qr-code-generator.html`, generated CSP | CSP permits only the actual upload providers (`tmpfiles.org`, `i.ibb.co`/ImgBB path) and required APIs; no broad wildcard was added. Text, image, file, folder, and video modes are covered by browser checks. | Fixed locally. A post-deploy smoke check is still required after the Worker/frontend release. |
| 3 | HTML-to-PDF XSS — Critical | `src/tools/html-to-pdf.html` | Pasted markup is parsed into an inert document, active elements/event attributes/dangerous URLs/styles are removed, and only the sanitized result is previewed/rendered. | Fixed. Script, handler, and `javascript:` payloads are blocked in browser tests. |
| 4 | PDF↔Word backend exposure — Critical | `cf-worker/pdf-api-proxy.js`, `services/gateway/app.py`, `services/pdf2docx/modal_app.py`, `services/docx2pdf/modal_app.py`, conversion pages | Production browsers use the Worker gateway; signed short-lived conversion tickets, JWT/HMAC checks, Turnstile, origin defense-in-depth, request/size/time limits, Modal bearer auth, and output validation prevent direct unauthenticated use. | Fixed in code. Requires production secrets, Modal secret/deploy, and live smoke tests. |
| 5 | Cloudflare Worker guard/Turnstile/rate limits — Critical | `cf-worker/pdf-api-proxy.js`, AI pages, `cf-worker/wrangler.toml` | Consolidated origin handling, server-side Turnstile verification, durable Rate Limiting binding, protected AI routes, and explicit widget render/reset/token handling. | Fixed in code. New Worker must be deployed with `TURNSTILE_SECRET_KEY`; live old Worker still accepts legacy behavior until release. |
| 6 | Deployment pipeline — High | `.github/workflows/deploy.yml` | Build, root sync, regression tests, ESM-aware Worker syntax validation, Wrangler dry-run, required-secret checks, Worker deploy, post-deploy `/health`/unknown-route/AI/CORS smoke tests, then frontend deploy; duplicate silent Worker workflow removed. | Fixed in pipeline. GitHub branch protection/required checks still need repository-admin configuration. |
| 7 | Repository cleanup/secrets — High | `.gitignore`, removed Wrangler cache/runtime files, history audit | Added `.wrangler/` ignore and removed committed runtime/cache artifacts. Current source has no private credential values. Historical commits contain a Razorpay live publishable key ID; history was not rewritten. | Code cleanup fixed. Revoke/rotate and audit the historical Razorpay key before release. |
| 8 | OCR privacy — High | `src/tools/image-to-text.html`, `src/tools/ocr.html` | Bundled local Tesseract is the default. Low-confidence output remains local unless the user checks an explicit cloud-OCR consent box; provider disclosure is shown at the decision point. | Fixed. Local, no-consent, and consent-gated cloud branches pass browser tests. |
| 9 | OCR language claims — Medium | OCR pages, language assets/copy | UI is restricted to the languages actually wired and uses matching local/cloud language codes; unsupported claims were removed. | Fixed for the advertised English path. Additional languages require bundled models and dedicated QA before advertising. |
| 10 | QR privacy disclosure — High | QR generator page | Disclosure distinguishes temporary `tmpfiles.org` retention from ImgBB hosting that may be persistent; provider and upload behavior are stated before upload. | Fixed. Provider retention policy can change and should be rechecked periodically. |
| 11 | Privacy policy — High | `src/privacy.njk`, generated `privacy.html` | Policy now names Cloudflare, GitHub, Supabase, Razorpay, Modal, OCR.space, tmpfiles.org, ImgBB, and the AI providers in use, and identifies tools that send file/document data externally. | Fixed in site copy. Legal review and provider-policy refresh remain advisable. |
| 12 | Legacy privacy claims/URLs — Medium | `src/privacy.njk`, `src/_redirects`, generated aliases | Removed obsolete “never leaves your device/no accounts/strictly local” claims and redirected legacy About paths; canonical/noindex aliases are intentional. | Fixed locally. www/non-www DNS/redirect behavior must be verified at the host after deploy. |
| 13 | Password Protect PDF — High | `src/tools/password-protect-pdf.html`, vendored encryption code, service tests | Replaced legacy RC4 with maintained AES-256 PDF encryption and removed unsupported print/copy/edit restriction claims. | Fixed. Independent `pdfinfo -upw` verification passes; crypto library should remain patched. |
| 14 | PDF Unlock — High | `src/tools/pdf-unlock.html`, service tests | Uses structural decryption instead of rasterizing pages, preserving text, links, vectors, bookmarks, and metadata where the parser supports them; wrong passwords fail. | Fixed for supported PDFs. Exotic malformed/encrypted PDFs may still be rejected rather than reconstructed. |
| 15 | Image format converter — High | `src/tools/image-format-converter.html` | Removed fake byte-renaming outputs; only genuine Canvas JPEG/PNG/WebP encoders remain and their MIME/magic bytes are tested. | Fixed. GIF/BMP/ICO are intentionally not advertised. |
| 16 | Speech-to-text PDF export — High | `src/speech-to-text.html`, font assets, fontkit shaping patch | Added Unicode-capable Noto Sans Devanagari/fontkit path and limited language claims to scripts verified by the exporter. | Fixed for English/Hindi fixtures. More complex scripts need separate shaping/font QA. |
| 17 | PDF-to-Word implementation mismatch — High | `src/tools/pdf-to-word.html`, `services/pdf2docx/*`, tests/copy | Product copy now describes the actual pdf2docx/Modal implementation (not Marker AI). Conversion validation covers single/multi-column, tables, scanned, Unicode, and large fixtures; annotations/forms are explicitly omitted. | Fixed and documented. Real Modal production runs and fidelity review remain pending external deployment. |
| 18 | Word-to-PDF validation/isolation — High | `src/tools/word-to-pdf.html`, `services/docx2pdf/*`, gateway/tests | Validates document signatures/content rather than trusting MIME, accepts only genuinely supported DOCX/DOC/ODT/RTF paths, and isolates LibreOffice with limits. | Fixed locally. Production-format matrix still needs live Modal/gateway smoke runs. |
| 19 | Mojibake/encoding corruption — Medium | affected templates/pages and generated output | Audited source and generated site, corrected corrupted strings, and verified no accidental mojibake remains (the replacement-character fixture in a test is intentional). | Fixed by static audit. |
| 20 | Literal entities displayed as text — Low | affected templates/pages | Corrected escaped entity strings so visible symbols such as `×` are rendered as characters, with `textContent` used where appropriate. | Fixed by static audit and browser smoke. |
| 21 | Icon migration — Medium | shared layout/registry and affected pages | Shared/new surfaces use the SVG icon system and registry-backed cards instead of inconsistent emoji. | Partially fixed: several specialized legacy pages still contain emoji; this is non-blocking visual debt for a later design pass. |
| 22 | Common layout consolidation — Medium | shared app/registry/related UI and templates | Common headers, upload/result behavior, related tools, and navigation now share infrastructure. | Partially fixed: some legacy tool pages retain bespoke shells; functionality/security are not blocked. |
| 23 | Single tool registry — Medium | `src/_data/tools.js`, `src/tools.njk`, `src/index.njk`, `src/sitemap.njk`, `src/_includes/partials/meta.njk`, `src/js/app.js`, generated registry | Registry now drives directory, sitemap, search, related links, navigation visibility, canonical URL resolution, homepage featured tools, and drag-and-drop recommendations. | Fixed locally; a new tool should be added to the registry and then built/synced. |
| 24 | Discoverability/link/canonical audit — Medium | registry/templates/generated pages/redirects | PDF Bookmark is present, broken PDF Editor link is absent, literal internal-link audit reports zero missing targets, and canonical variants are intentional/noindex where required. | Fixed locally. Final live crawl belongs after deployment. |
| 25 | Service-worker invalidation — High | `src/sw.js`, `scripts/version-sw.js`, generated `sw.js` | Build generates a content-derived version stamp; HTML/JS use network-first updates while CSS/media use controlled cache strategies. | Fixed locally. Verify one post-deploy browser receives the new stamp and no stale asset remains. |
| 26 | CSS/JS stale-cache behavior — High | service worker/build pipeline/generated assets | Build/sync and the revised cache strategy prevent indefinite stale CSS/JS; deployment gates rebuild before publishing. | Fixed in code/pipeline. CDN/browser verification is still required after release. |
| 27 | Regression/adversarial QA — High | `scripts/test-regression.mjs`, `services/tests/*` | Automated coverage includes QR XSS/text/file/all modes, HTML XSS, password protect/unlock, image signatures, OCR privacy branches, registry/links, responsive 390/910px layouts, page errors, authentication/entitlement wiring, duplicate-bundle guards, and service conversion fixtures. | Local gates pass. External AI/auth/purchase, live Modal, Razorpay Test Mode, and production performance measurements still require configured services. |

## Local validation completed

- `npm run build` — PASS; generated 10 files and refreshed the content-hashed service-worker stamp.
- `npm run sync:root` — PASS; synchronized 138 generated files.
- `npm run perf:budget` — PASS; homepage 33,134 bytes, core CSS 107,788 bytes, core JS 75,405 bytes, total artifact 28,364,785 bytes (all below checked-in budgets).
- `npm test` — PASS; browser/static regression suite completed and exited with code 0.
- `python -m compileall -q services` — PASS.
- `python services/tests/verify_local.py` — PASS, 105/105 checks.
- Worker ESM syntax validation — PASS.
- `npx wrangler deploy --config cf-worker/wrangler.toml --dry-run --outdir .wrangler-dry-run` — PASS.
- `npm audit --omit=dev` — PASS, 0 vulnerabilities.
- `git diff --check` — PASS after the build/sync cycle.
- Static encoding, literal-link, canonical, `innerHTML`, and generated-site audits — PASS (with the documented legacy emoji/layout debt).
- Generated-site asset audit — 138 files / 28,364,785 bytes after removing unused duplicate library copies (146 files / 31,797,634 bytes before; 3,432,849 bytes removed). The largest remaining asset is the local OCR language model, which is lazy-loaded by the OCR tool rather than the homepage. A static budget now guards homepage, core CSS/JS, and total artifact size in CI.

## External production actions / blockers

1. Provision Worker secrets `TURNSTILE_SECRET_KEY`, `CONVERSION_SIGNING_SECRET`, and `MODAL_API_TOKEN` using Wrangler or the secret manager. Do not paste values into chat. Remove the stale Adobe secret if it is no longer used.
2. Create the Modal secret `onlinepdfpro-conversion`, deploy/update both conversion apps, and verify their URLs match the Worker configuration.
3. Enable Supabase Auth leaked-password protection in the dashboard.
4. Revoke/rotate the historical Razorpay live publishable key ID and inspect payment logs/dashboard; no history rewrite was performed.
5. Protect `main` and require the build, regression, Worker validation, and post-deploy smoke checks.
6. Push the commits and run the workflow. Then verify the live Worker (`/health`, unknown route, AI without Turnstile, hostile CORS), representative browser/mobile flows, and Razorpay Test Mode journeys (buyer, second user, duplicate, failure, webhook/browser-close).

The live domain was intentionally not represented as fixed in this report: before deployment it still served the older homepage/Worker behavior. Core Web Vitals (LCP/CLS/INP), conversion cold/warm latency, and backend p50/p95 were not invented or marked complete because no DevTools performance run or production conversion environment was available in this checkout.
