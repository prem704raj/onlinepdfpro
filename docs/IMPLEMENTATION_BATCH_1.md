# Production foundation — implementation batch 1

Prepared on 1 October 2026. Code is locally implemented; this document does not claim a live production release.

Cloudflare Pages automatic production deployments have been disabled. Its build output has been changed from repository root to `_site`, with the production build command gated separately from previews. The existing live deployment remains online; application changes require review and the credentials below.

## Implemented

- Production publication now requires Cloudflare credentials, a deployed Worker with the same source revision, and passing live API probes. Missing credentials stop publication.
- The frontend workflow publishes `_site` directly to the existing Cloudflare Pages project `onlinepdfpro`. It no longer publishes an unrelated GitHub Pages branch.
- Safe probes require the conversion routes, missing-token rejection, login protection, allowed preflight, hostile-origin rejection, JSON errors, and exact release attribution. They never send customer files, create orders, or invoke AI.
- `npm run build:production` performs the same API preflight when building outside GitHub Actions. Cloudflare's commit revision can stamp release metadata. CI cannot silently stamp a `local` release.
- All 19 existing blog posts, the blog directory, feed, and four existing support/history pages now live under `src` and survive clean builds.
- Tool directory data, generated links, canonical metadata, and structured data use the clean URLs served by Cloudflare. The sitemap includes the preserved blog and excludes the empty generic product-detail route.
- About redirects no longer point back to `.html`. Alias redirects use supported Cloudflare syntax; two relevant historical blog URLs have permanent replacements.
- One generated HTML preparation step aligns meta CSP with the existing enforcing HTTP policy, pins/defer-loads legacy Supabase scripts, and installs the shared analytics entry point. Google verification content stays byte-identical.
- GA4 `G-RPDGMCZ97D` loads only after an optional analytics choice. Our events filter personal data and URLs; login, library, and local history pages do not load measurement. Privacy choices are persistent and reversible.
- Added runtime API and browser analytics tests, whole-site metadata/redirect tests, PR validation, and public post-deployment frontend checks. Patched two vulnerable build dependencies.

## Verification

Run from the project root:

```powershell
npm run build
npm test
npm run perf:budget
npm audit
npx --yes wrangler@4.36.0 deploy --dry-run --config cf-worker/wrangler.toml
```

Fresh-checkout verification passed the whole-site, Worker, analytics, application regression, and existing PDF editor export checks. The dependency audit reported zero vulnerabilities. Performance budgets passed, including the preserved separate budget for optional editor fonts. Editor route assertions were updated for Cloudflare's clean canonical URLs; its true text replacement and font tests remain enabled.

Production probes are intentionally separate from local tests:

```powershell
node scripts/smoke-worker.mjs --release SOURCE_REVISION
node scripts/smoke-site.mjs --release SOURCE_REVISION
```

An API smoke pass establishes route availability and defensive behavior. It does not establish successful document conversion, successful AI inference, payment fulfilment, or refund handling. Those require representative documents and authorized test-mode customer journeys.

## Deployment prerequisites

The signed-in Cloudflare dashboard showed production Pages publishing the repository root with no build command. It also showed an old API Worker with only the generic rate limiter. The Worker lacked these required runtime secrets:

- `TURNSTILE_SECRET_KEY`: the existing widget's server verification secret.
- `CONVERSION_SIGNING_SECRET`: a strong random signing value stored only as a Worker secret.
- `MODAL_API_TOKEN`: the same shared bearer token enforced by both deployed Modal services.

Supply these through the secret controls or Wrangler, never through source files or chat. Existing secrets and the private R2 binding must be preserved. Deploying `cf-worker/wrangler.toml` provisions the three route-specific limiter bindings.

The repository owner must configure Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The token needs access to the existing Worker, its secret-name listing, R2 binding configuration, and Pages project publication. Do not grant unrelated account or zone permissions. Browser sign-in alone does not authenticate Wrangler or GitHub Actions.

Before enabling the new production workflow:

1. Keep automatic production deployments disabled in Cloudflare Pages → `onlinepdfpro` → Settings → Branch control. This was verified in the signed-in dashboard on 1 October 2026. The production branch remains `main`.
2. Use `_site` as the Pages build output. The branch-aware build command is `if [ "$CF_PAGES_BRANCH" = "main" ]; then npm run build:production; else npm run build; fi`. It gates manually triggered production builds and allows preview builds, where analytics remains disabled on `pages.dev`.
3. Provide runtime secrets and repository Actions credentials, then merge the reviewed changes.
4. Let the workflow validate → deploy Worker → probe Worker → build/publish Pages → probe the public site. A failing stage must stop later stages.
5. Verify `/release.json` and API `/health` contain the merged revision. Verify About and an article serve directly, aliases redirect once, and the sitemap lists final routes.
6. Verify the GA tag in an opted-in production visit using Tag Assistant and GA4 Realtime. Check stream enhanced-measurement settings for unwanted form/download data collection; this change validates our own sanitized events but does not change the private Google stream configuration.
7. Run real conversion/AI test cases and the Razorpay test-mode purchase, restored-library, unauthorized-download, browser-closed-payment, and refund journeys before declaring those features production-ready.

`www` → apex must be a Cloudflare zone redirect. A host-based source rule in Pages `_redirects` is unsupported and has been removed. Preserve path and query when configuring the zone rule, then verify it on the live domain.

## Next implementation batches

1. Correct compression, flattening, and PDF editor behavior/disclosures; make destructive output choices explicit and test exported documents.
2. Publish a static product route with accurate DBMS content, price, sample pages, AI assistance disclosure, and product metadata. Keep legacy access working.
3. Improve AI document scope reporting, consistent errors, and conversation context; test scanned and long PDFs.
4. Complete keyboard/mobile task flows, payment/support recovery, and production monitoring.
5. Build useful study workflows and original guides, then measure acquisition → tool completion → return usage. Notes expansion needs human content review and demand evidence; avoid fabricated expertise, testimonials, or sales claims.
