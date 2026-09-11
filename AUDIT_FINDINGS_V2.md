# OnlinePDFPro Production Audit & Remediation Plan — V2

**Project:** OnlinePDFPro  
**Repository:** `prem704raj/onlinepdfpro`  
**Primary branch:** `main`  
**Audited main commit:** `6e9ff18841b0e0d810df05860a12558f6fc4da25`  
**Live site:** `https://onlinepdfpro.com`  
**Review date:** 2026-09-10  
**Status:** **Execution-safe replacement for the previous `AUDIT_FINDINGS.md`**

> This file supersedes the previous audit report for remediation work.
> Do **not** execute the older report blindly. Several findings in it were later retracted,
> became stale, or contained implementation guidance that should not be applied as written.

---

## 1. Executive Summary

The codebase has many good controls already implemented in `main`, but production is not reliably running that hardened code.

### Confirmed production blockers

| ID | Priority | Finding | Status |
|---|---:|---|---|
| P0-1 | P0 | Deployed Modal PDF conversion endpoints accepted incorrect bearer credentials during audit testing | **Production blocker** |
| P0-2 | P0 | Deployed Worker AI routes did not enforce the protections present in `main` during audit testing | **Production blocker** |
| P0-3 | P0 | Deployed Worker did not expose the `/convert/*` routes implemented in `main`, breaking PDF↔Word production flow | **Production blocker** |
| P0-4 | P0 | Latest `Build & Deploy` workflow could not deploy because GitHub Actions did not have `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` | **Confirmed deployment blocker** |

### Important P1 work

- Make production deployment reproducible and attributable to one release commit.
- Add safe per-route Worker rate-limit bindings using only Cloudflare-supported periods.
- Restrict selectable AI models to an explicit allowlist.
- Make conversion tickets route-bound; do not claim true single-use unless backed by durable atomic state.
- Put the full Supabase schema and policies under version control.
- Add Modal concurrency limits and sanitize internal conversion errors.
- Move important CSP directives to an HTTP response header without breaking microphone-dependent tools.
- Update CI to a Node version supported by the installed Puppeteer version.
- Protect `main` and require production checks before merging/deploying.

### Important corrections from the old report

The following are **not active production defects** and must not remain in the blocker list:

1. **Canonical URLs:** the previous “12 empty canonical URLs” finding was a false positive caused by an attribute-order-sensitive scan. Current source uses a valid canonical construction and the audit later retracted the issue.
2. **Supabase `orders` RLS:** live verification confirms RLS is enabled and authenticated reads are restricted by ownership.
3. **Modal `@modal.fastapi_endpoint`:** it is a current supported Modal API. Do not migrate to `@modal.web_server` merely because the older report called it legacy.
4. **Cloudflare rate limit `period = 300`:** invalid. Workers Rate Limiting bindings support only supported fixed periods such as 10 or 60 seconds.
5. **“Single-use” Worker `Map`:** a process-local `Map` cannot guarantee one-time use across Worker isolates.
6. **Service Worker “TTL” patch:** the old proposed code changed caching behavior but did not actually implement a TTL.
7. **Contrast calculation:** do not globally change the text token based on the old claimed ratio; measure the exact failing elements/backgrounds/opacity.

---

## 2. Source of Truth Rules

Use the following order of authority while fixing the project:

1. Current `main` source code.
2. Fresh local build from `main`.
3. Current GitHub Actions result for the same commit.
4. Current live Worker / Modal / website behavior.
5. Current Supabase database configuration.
6. Current official Cloudflare / Modal / Supabase documentation.
7. This audit.

If this file conflicts with verified current runtime behavior, **runtime evidence wins** and this file must be updated.

---

## 3. Current Verified Baseline

### Repository

- Default branch: `main`
- Audited SHA: `6e9ff18841b0e0d810df05860a12558f6fc4da25`
- `main` branch protection was not enabled when checked.
- `gh-pages` existed but was stale relative to `main` during the audit.
- The live site contained a mixture of content that did not cleanly correspond to one reproducible deployment path.

### Latest checked GitHub Actions run

Workflow run:

- Name: `Build & Deploy`
- Run ID: `34385284995`
- Commit: `6e9ff18841b0e0d810df05860a12558f6fc4da25`
- Result: **failure**

The following steps **passed**:

- `npm ci`
- Eleventy build
- performance budget
- `npm test`
- Worker syntax validation
- `wrangler deploy --dry-run`

The workflow then failed at:

- `Check Cloudflare deployment credentials`

because both were empty:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

As a result, the following were skipped:

- Worker deployment
- Worker smoke test
- frontend deployment

### CI environment issue also discovered

The workflow uses Node 20, while the installed Puppeteer 25.5 packages report an engine requirement of Node `>=22.12.0`.

Current behavior happens to pass tests, but this is an unsupported CI configuration and should be corrected.

---

## 4. Verified Good — Do Not Rebuild Without a Reason

These areas were checked and are currently good enough to preserve unless a regression is found.

### 4.1 QR DOM-XSS fix

- QR output no longer relies on unsafe `innerHTML` interpolation for user-controlled content.
- Regression tests cover hostile QR text payloads.
- Keep DOM-based rendering.

### 4.2 HTML-to-PDF sanitization

- The tool has an explicit sanitizer.
- Active tags, inline event handlers, and `javascript:` style active URLs are handled by the current sanitization path.
- Browser regression tests exist.

### 4.3 AES-256 PDF protection

The current password-protection implementation was independently validated as AES-256-style PDF encryption:

- `/V 5`
- `/R 6`
- `/CFM /AESV3`
- `/Length 256`

Do not reintroduce the older RC4-based implementation.

### 4.4 PDF Unlock

Current unlock flow uses the maintained decrypt bundle and preserves PDF structure rather than rasterizing every page.

### 4.5 Image format converter

Current advertised output formats are restricted to genuine Canvas-supported output:

- JPEG
- PNG
- WebP

Do not restore fake GIF/BMP/ICO options without real encoders.

### 4.6 Speech-to-Text PDF Unicode support

Current page advertises English and Hindi and embeds a bundled Noto Devanagari font with fontkit support.

Do not claim “100+ PDF export languages” unless matching fonts/shaping support are added.

### 4.7 Tool registry

`src/_data/tools.js` is the main registry for the public tool directory and sitemap.

Preserve registry-driven navigation and sitemap generation.

### 4.8 Supabase RLS

Live verification on 2026-09-10 confirmed:

- `public.orders` has RLS enabled.
- `public.products` has RLS enabled.
- `orders` has an authenticated SELECT policy requiring ownership.
- The policy predicate is effectively `auth.uid() = user_id`.
- Anonymous users cannot read or insert `orders`.

**Therefore: remove the old P0 “orders RLS might be missing” blocker.**

Important nuance:

- Table-level `GRANT SELECT TO authenticated` does not bypass RLS.
- With RLS enabled, applicable row policies still control visible rows.
- With RLS enabled and no applicable policy, PostgreSQL is default-deny.

### 4.9 Payment architecture

The current Worker keeps critical purchase decisions server-side:

- server-side product lookup
- server-authoritative price
- HMAC payment verification
- Razorpay object re-fetch
- captured-status verification
- user/order ownership check
- conditional transition from `created` to `paid`
- authenticated download authorization

Keep this architecture.

Do not phrase the audit as “payment spoofing is impossible.”
Preferred wording:

> No payment-verification bypass was found in the audited implementation; production integration and race tests must remain part of release verification.

### 4.10 Service Worker confidentiality boundary

The Service Worker exits early for non-GET requests.

Therefore POST-based:

- AI calls
- conversion uploads
- payments
- authenticated paid downloads

are not cached by the Service Worker.

---

## 5. P0 — Production Blockers

# P0-1 — Deploy protected Modal conversion endpoints

### Problem

Current `main` contains bearer-token checks in both Modal conversion services, but the deployed endpoints accepted incorrect credentials during audit testing.

This means the current production endpoint is older than or different from the source in `main`.

### Files

- `services/pdf2docx/modal_app.py`
- `services/docx2pdf/modal_app.py`

### Required implementation

Keep the existing source-side bearer verification:

```python
expected_token = os.getenv("MODAL_API_TOKEN", "")
authorization = request.headers.get("authorization", "")
provided_token = (
    authorization[7:].strip()
    if authorization.lower().startswith("bearer ")
    else ""
)

if (
    not expected_token
    or not provided_token
    or not hmac.compare_digest(provided_token, expected_token)
):
    return StarletteResponse(
        content=json.dumps({"error": "Unauthorized"}),
        status_code=401,
        media_type="application/json",
        headers={"Cache-Control": "no-store"},
    )
```

### External configuration

Create/verify Modal secret:

- secret name: `onlinepdfpro-conversion`
- variable: `MODAL_API_TOKEN`

Make sure the same logical secret is configured in the Cloudflare Worker.

### Verification

Both deployed services must return `401` for an incorrect bearer token.

A correct Worker-mediated conversion must still succeed.

---

# P0-2 — Deploy protected Worker AI routes

### Problem

`main` already includes:

- Turnstile verification
- Worker rate-limit binding usage
- strict CORS behavior
- production fail-closed behavior

But production testing showed older/unprotected AI behavior.

### Required action

Fix deployment credentials first, then deploy the Worker from the audited release commit.

### Verification

For `/ai/chat` and `/ai/vision`:

- missing/invalid Turnstile → `403`
- hostile Origin → no usable CORS authorization
- correctly verified request → normal response
- excessive requests → `429` according to the configured limiter

Do **not** reuse the same Turnstile token repeatedly during testing. Turnstile tokens are single-use.

---

# P0-3 — Restore the production PDF↔Word gateway

### Problem

Current `main` contains:

- `POST /convert/token`
- `POST /convert/pdf-to-word`
- `POST /convert/word-to-pdf`

The audited production Worker did not expose the same route set.

### Required action

Deploy the current Worker and current Modal services as one coordinated release.

### Verification

`GET /health` should list the expected current route set.

Unknown paths must return JSON `404`.

Real end-to-end fixtures must pass:

- PDF → DOCX
- DOCX → PDF
- invalid input
- oversized input
- wrong conversion token
- wrong Modal bearer token

---

# P0-4 — Fix GitHub Actions Cloudflare deployment credentials

### Confirmed blocker

The latest checked `Build & Deploy` run stopped because:

```text
CLOUDFLARE_API_TOKEN:
CLOUDFLARE_ACCOUNT_ID:
```

were empty.

### Required GitHub repository secrets

Create these in GitHub Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The API token should have only the permissions necessary to deploy/manage this Worker and required bindings.

### Verification

Re-run the pipeline and confirm:

1. `validate-worker` passes.
2. `deploy-worker` runs and passes.
3. `smoke-worker` runs and passes.
4. `build-and-deploy` runs and passes.
5. Live Worker `/health` corresponds to the release.
6. Live site assets correspond to the same release.

---

## 6. P1 — Security, Deployment, Cost, and Recovery

# P1-1 — Per-route rate limits using valid Cloudflare periods

### Problem

A single generic rate bucket is not ideal for workloads with very different cost profiles.

### Important correction

Do **not** configure:

```toml
period = 300
```

for Workers Rate Limiting bindings.

Use supported periods such as `10` or `60`.

### Recommended starting configuration

Exact limits should be tuned from real usage, but a safe starting shape is:

```toml
[[ratelimits]]
name = "API_RATE_LIMITER"
namespace_id = "20260904"
  [ratelimits.simple]
  limit = 50
  period = 60

[[ratelimits]]
name = "AI_CHAT_LIMITER"
namespace_id = "20260905"
  [ratelimits.simple]
  limit = 12
  period = 60

[[ratelimits]]
name = "AI_VISION_LIMITER"
namespace_id = "20260906"
  [ratelimits.simple]
  limit = 6
  period = 60

[[ratelimits]]
name = "CONVERSION_LIMITER"
namespace_id = "20260907"
  [ratelimits.simple]
  limit = 5
  period = 60
```

### Route selection

```js
function rateLimiterFor(env, pathname) {
    if (pathname === '/ai/chat') return env.AI_CHAT_LIMITER;
    if (pathname === '/ai/vision') return env.AI_VISION_LIMITER;

    if (
        CONVERSION_PATHS.has(pathname) ||
        pathname === '/convert/token'
    ) {
        return env.CONVERSION_LIMITER;
    }

    return env.API_RATE_LIMITER;
}
```

### Important semantics

Cloudflare Workers rate-limit bindings are useful abuse controls, but do not describe them as a perfectly precise global quota or billing cap.

Use provider-side budget alerts/limits as additional cost protection.

### Razorpay webhook

Do not casually put payment webhooks under an aggressive end-user IP rate limit.

Webhook traffic is server-to-server and should primarily be protected by:

- Razorpay webhook HMAC
- event allowlist
- idempotent processing
- reasonable dedicated abuse protection if needed

---

# P1-2 — AI model allowlist

### Problem

The client should not be able to make the Worker pay for arbitrary expensive OpenRouter models.

### Required change

Use a strict allowlist:

```js
const ALLOWED_VISION_MODELS = new Set([
    'openrouter/free',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-haiku'
]);

const model =
    typeof body.model === 'string' &&
    ALLOWED_VISION_MODELS.has(body.model)
        ? body.model
        : undefined;
```

Adjust the exact list to models you intentionally support and are willing to pay for.

### Verification

Unknown model strings must not be forwarded upstream.

---

# P1-3 — Route-bound conversion tickets

### Problem

Current ticket payload uses:

```js
path: '/convert/*'
```

A ticket should authorize exactly one conversion route.

### Required improvement

Issue a ticket for the requested target:

```js
const payload = {
    path: pathname,
    exp: Math.floor(Date.now() / 1000) + 300,
    ip: requestIp(request),
    jti: base64UrlEncode(nonceBytes)
};
```

Verify:

```js
if (payload.path !== pathname) return false;
if (!CONVERSION_PATHS.has(pathname)) return false;
if (payload.exp < Math.floor(Date.now() / 1000)) return false;
if (payload.ip !== requestIp(request)) return false;
```

### Do not implement fake single-use semantics

Do **not** claim that this makes the ticket globally single-use:

```js
const USED_TICKETS = new Map();
```

A Worker process-local map is not shared across isolates.

### Two valid designs

**Option A — recommended simple design**

Use:

- route binding
- short expiration
- Turnstile before issuance
- IP binding where acceptable
- conversion rate limiting
- protected Modal endpoints

Treat tickets as short-lived capability tokens, not globally one-use tokens.

**Option B — if true single-use is required**

Store and atomically consume `jti` in durable state designed for coordination, such as a Durable Object.

Do not use plain KV for atomic one-time consumption.

---

# P1-4 — Modal concurrency and sanitized errors

### Add a reasonable container ceiling

Example:

```python
@app.function(
    image=image,
    cpu=2,
    memory=2048,
    timeout=120,
    scaledown_window=180,
    max_containers=4,
    secrets=[conversion_secret],
)
```

Confirm the exact parameter against the installed/current Modal SDK before release.

### Sanitize production errors

Do not return raw parser/LibreOffice exception text.

Use:

```python
except Exception:
    logger.exception("[%s] Conversion failed", request_id)
    return StarletteResponse(
        content=json.dumps({
            "error": "Conversion failed. Please check the document and try again.",
            "request_id": request_id,
        }),
        status_code=500,
        media_type="application/json",
        headers=cors_headers,
    )
```

Keep detailed errors in server logs only.

### Important correction

`@modal.fastapi_endpoint` is a supported Modal endpoint API.

Do **not** migrate to `@modal.web_server` merely because an old audit called it legacy.

---

# P1-5 — Version the full Supabase schema

### Problem

The repository contains migrations for specific grants/indexes but does not contain a complete reproducible schema including all:

- table creation
- constraints
- RLS enablement
- RLS policies
- indexes
- relevant grants

The live security policy is currently good, but disaster recovery and reproducibility are incomplete.

### Required action

Use the current Supabase CLI workflow for an existing project.

Prefer a proper remote schema pull/reconciliation rather than manually inventing a baseline migration.

At minimum, the committed migration history must reproduce:

- `products`
- `orders`
- indexes
- grants
- RLS state
- ownership SELECT policy

### Verified live policy to preserve

`orders` authenticated SELECT must remain equivalent to:

```sql
to authenticated
using ((select auth.uid()) = user_id)
```

### Verification

On a clean development database:

1. apply migrations from scratch
2. compare schema/policies with production
3. run Supabase security advisor
4. run Supabase performance advisor

---

# P1-6 — Enable Supabase leaked-password protection

### Verified current advisor warning

Supabase security advisor reports:

> Leaked Password Protection Disabled

### Required action

Enable leaked-password protection in Supabase Auth settings unless there is a deliberate documented reason not to.

Reference:

`https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection`

### Verification

Re-run the Supabase security advisor and confirm the warning is gone.

---

# P1-7 — Fix CI Node/Puppeteer engine mismatch

### Verified current CI warning

The workflow uses Node 20.20.2.

Installed packages report:

- `puppeteer@25.5.0` → Node `>=22.12.0`
- `puppeteer-core@25.5.0` → Node `>=22.12.0`
- `@puppeteer/browsers@3.1.0` → Node `>=22.12.0`

### Required change

Update GitHub Actions to a supported Node version, for example:

```yaml
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

Also consider documenting the supported engine in `package.json`:

```json
{
  "engines": {
    "node": ">=22.12.0"
  }
}
```

### Verification

`npm ci`, build, regression tests, and Worker dry-run must all stay green.

---

# P1-8 — Make deployment attributable

### Problem

The audit observed:

- stale `gh-pages`
- current `main`
- live files that did not consistently match one branch/build
- older deployed Worker behavior

### Required objective

For every release, you must be able to answer:

> Which exact Git commit produced the live frontend, Worker, and Modal services?

### Recommended controls

- one release commit
- Worker deploy from that commit
- Modal deploy from that commit
- frontend deploy from that commit
- build ID embedded into frontend/SW
- `/health` returns release/build metadata
- post-deploy smoke verifies expected release ID
- preserve deployment logs

Do not simply say “production is 17 commits behind.”
The more accurate finding is:

> Production was a mixed/unattributable deployment during the audit.

---

# P1-9 — Protect `main`

### Verified status

`main` was unprotected when checked.

### Recommended required checks

Require successful checks before merge/release:

- build
- regression
- performance budget
- Worker syntax/config dry-run
- deployment validation
- production smoke where appropriate

Avoid requiring a deploy job as a PR merge check if that would deploy unmerged pull requests.

Design branch protection and deployment triggers separately.

---

## 7. P1/P2 — CSP and Browser Security

# CSP-1 — Serve a real HTTP CSP header

### Current state

The site contains meta CSPs on many pages, but an HTTP `Content-Security-Policy` response header was not present during the audit.

Therefore do **not** describe the current state as:

> No CSP exists anywhere.

Correct wording:

> No site-wide HTTP CSP response header was observed; pages rely on meta CSPs whose capabilities are more limited.

### Why the header still matters

Some policies, particularly `frame-ancestors`, are not effective from a CSP `<meta>` element.

### Rollout plan

1. Start with `Content-Security-Policy-Report-Only`.
2. Collect violations.
3. Verify all tool-specific external origins.
4. Enforce.
5. Later reduce/remove `'unsafe-inline'`.
6. Remove `'unsafe-eval'` only after confirming Tesseract/WASM/runtime needs.

### Do not copy `_headers` blindly

Current checked-in `_headers` contains:

```text
Permissions-Policy: geolocation=(), camera=(), microphone=(), ...
```

Speech-to-Text needs microphone access.

If security headers are moved to Cloudflare, use a policy that does not accidentally disable a supported feature.

Example baseline:

```text
Permissions-Policy: geolocation=(), camera=(), usb=(), bluetooth=()
```

Then explicitly decide whether microphone should be available site-wide or only on speech routes.

### CSP provider review

Before enforcing, confirm actual production dependencies including:

- self
- Supabase
- Worker API
- Turnstile
- Razorpay
- OCR.space
- ImgBB
- tmpfiles.org
- Google Fonts
- analytics actually enabled
- any required WASM/blob workers

Do not include origins merely because old code once referenced them.

---

## 8. P2 — Functional Correctness and Data Fidelity

# P2-1 — PDF→Word currently deletes annotations/widgets

### Verified source behavior

`services/pdf2docx/modal_app.py` preprocesses the PDF by deleting:

- annotations
- widgets/form fields

before conversion.

This may remove legitimate:

- comments
- stamps
- filled form content
- form controls

### Required decision

Choose one:

1. Preserve/flatten relevant visible form/annotation content before conversion.
2. Keep deletion behavior but clearly disclose that annotations/forms may not be preserved.

### Required regression fixtures

Add at least:

- PDF with a filled AcroForm
- PDF with comments
- PDF with highlights
- PDF with stamp annotation

---

# P2-2 — Word→PDF hostile-document resource controls

Current source performs basic format validation before LibreOffice.

Keep that, and additionally verify:

- hard timeout
- memory ceiling
- process cleanup
- output size ceiling
- no shell interpolation
- malformed ZIP behavior
- extremely large embedded images
- deeply nested/complex documents

Do not claim this is fully sandbox-safe until production load testing is complete.

---

# P2-3 — Product `r2_key` should not be exposed to anonymous catalogue reads

### Current state

The product row can expose storage metadata such as `r2_key` to anonymous readers.

This does not by itself make the private R2 object downloadable, but the field is unnecessary client exposure.

### Recommended change

Expose only public catalogue fields to anonymous/authenticated clients.

Example intended public columns:

- `id`
- `title`
- `description`
- `price_inr`
- `preview_url`
- `status`
- `created_at`

Keep storage object keys server-side.

### Verification

Anonymous:

```text
products?select=*
```

must not return `r2_key`.

---

# P2-4 — Verify R2 bucket privacy directly

Do not rely only on the website returning `404`.

Confirm in Cloudflare:

- no public bucket access
- no public development URL
- no public static website endpoint
- only the Worker binding provides access for paid downloads

---

# P2-5 — Refund / chargeback entitlement policy

Current fulfilment handles payment success events.

The product needs an explicit business rule for:

- refunded payment
- partial refund
- chargeback/dispute
- cancelled/failed payment
- restored entitlement

This is a business/product decision, not automatically a vulnerability.

Once the rule is chosen, implement and test it.

---

## 9. P2 — Performance

# P2-6 — Supabase JS render blocking

Current base template loads:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="/js/auth.js?v=96"></script>
```

near the bottom but without `defer`.

Improve by:

- pinning a reviewed Supabase JS version
- using `defer` for ordered execution
- optionally loading auth only on pages that need it

Example:

```html
<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<PINNED_VERSION>"></script>
<script defer src="/js/auth.js?v=96"></script>
```

Do not hardcode an old version from the previous audit without checking the currently intended version first.

### Auth initialization

Keep `getSupabaseClient()` lazy and safe.

Avoid exposing a stale snapshot through:

```js
window.supabaseClient = supabaseClient;
```

Prefer consumers to call:

```js
window.getSupabaseClient()
```

or expose a getter if compatibility requires it.

### Verification

Measure before/after Lighthouse and browser traces.

Do not state a guaranteed LCP improvement before measuring it.

---

# P2-7 — Dead assets and root duplicate output

The repository contains duplicated built output outside the intended source tree.

The old report proposed a large `git rm --cached` command.

### Correction

`git rm --cached` only removes files from Git tracking while leaving local files present.

That is not a complete cleanup strategy by itself.

### Safe cleanup procedure

1. Confirm GitHub Pages source.
2. Confirm no deployment process needs root build copies.
3. Confirm `.eleventy.js` passthrough dependencies.
4. Build clean `_site`.
5. Compare root output with `_site`.
6. Remove obsolete tracked generated files.
7. Update `.gitignore` if local generated copies will continue to exist.
8. Remove `sync:root` only after all consumers are migrated.
9. Rebuild/test/deploy.
10. Confirm live pages and assets.

Do not delete verification files such as Google/Bing verification assets unless intentionally replacing them.

---

## 10. P2 — PWA / Service Worker

# P2-8 — Stop caching arbitrary opaque cross-origin responses

Current Strategy 4 can cache responses beyond the intended static same-origin asset set.

Restrict long-lived cache-first behavior to known same-origin static assets.

### Important correction

The old proposed code was titled “add a TTL” but did not implement any TTL.

Choose one:

**Simple approach**

- cache only versioned same-origin static assets
- rely on build-ID cache invalidation
- never cache arbitrary cross-origin opaque responses

**True TTL approach**

Store response timestamps/metadata and expire entries based on actual age, or use a Workbox expiration strategy.

Do not call a cache strategy “TTL” unless it really expires entries based on time.

---

# P2-9 — Manifest accuracy

Remove:

- broken screenshot references
- misleading “100% Free” wording if the site sells paid study materials

Use wording that distinguishes:

- free browser tools
- optional paid study materials
- internet-dependent AI/conversion tools

Verify every icon/screenshot referenced in the final manifest returns `200`.

---

## 11. P2 — Accessibility

Do not apply a global text-color change based solely on the old contrast calculation.

### Required process

For each Lighthouse/axe contrast failure record:

- foreground color
- background color
- opacity
- font size/weight
- measured contrast ratio
- exact selector

Then fix the real failing token/component.

### Known useful checks

- file input has an accessible name
- interactive canvas alternatives
- keyboard reachability
- visible focus
- icon button labels
- screen-reader status announcements
- dialog focus trap/return
- form labels
- sufficient contrast in both themes

### Merge PDF input example

```html
<label for="pdfFileInput" class="sr-only">Choose PDF files to merge</label>
<input
  type="file"
  id="pdfFileInput"
  accept=".pdf,application/pdf"
  multiple
  aria-describedby="mergeHint"
/>
<p id="mergeHint" class="sr-only">
  Select two or more PDF files.
</p>
```

Do not promise “never uploaded” in a generic shared component unless that specific tool is verified local.

---

## 12. P2 — Privacy and Transparency

### Current privacy copy is substantially improved

It already names:

- Cloudflare
- GitHub
- Supabase
- Razorpay
- Modal
- OCR.space
- tmpfiles.org
- ImgBB
- Groq
- OpenRouter
- Google

### Add R2 explicitly

Recommended section:

```html
<h3>Purchased study materials</h3>
<p>
Purchased files are stored in a private Cloudflare R2 bucket.
When you request a download, the server verifies your authenticated account
and purchase entitlement before streaming the file.
</p>
```

Do not claim the bucket is private in policy text until the Cloudflare configuration has been verified.

### Cloud tools

Each cloud tool should disclose before transfer:

- what leaves the browser
- destination/provider
- purpose
- likely retention model where known
- whether consent is optional or required

---

## 13. P3 — SEO and Redirects

### Canonicals

**No canonical bug is currently open based on the corrected audit.**

Keep a regression test, but do not “fix” `meta.njk` unless a fresh build proves an actual failure.

### Correct regression test

Parse the whole canonical `<link>` element without assuming attribute order.

Do not use this broken pattern as proof:

```bash
grep 'rel="canonical" href="..."'
```

because a valid tag may put `href` before `rel`.

### `www` → apex

If both hosts return `200`, configure a permanent redirect:

```text
https://www.onlinepdfpro.com/* → https://onlinepdfpro.com/$1
```

Retain apex canonical URLs.

### Legacy aliases

Replace meta-refresh redirect pages with real edge/server `301` redirects where possible.

---

## 14. P3 — Dependency and Supply-Chain Work

### npm vulnerability

The latest CI install reported:

- 1 high-severity vulnerability
- deprecated `crypto-js@4.2.0`

Do not blindly run:

```bash
npm audit fix --force
```

First identify:

- exact advisory
- dev vs production dependency
- reachability
- safe upgrade path

### GitHub Actions

Current workflow uses tag references such as:

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `cloudflare/wrangler-action@v3`
- `peaceiris/actions-gh-pages@v4`

For stronger supply-chain control, pin release actions to reviewed commit SHAs and update them deliberately.

### Vendored browser libraries

Do not mass-upgrade PDF/image libraries without fixtures.

Create an inventory with:

- package/library name
- version
- source URL
- hash
- license
- update date
- regression fixtures covering that library

---

## 15. Testing Plan

Keep the existing regression suite. It is valuable.

### Existing strong coverage

The audited CI run passed tests covering:

- QR XSS
- QR upload flows with stubs
- HTML sanitizer
- OCR consent
- AI/Turnstile source wiring
- encryption/decryption
- genuine image signatures
- registry/sitemap
- responsive layout
- no uncaught browser errors
- dark mode
- study-material UI

### Add these tests

#### Deployment / Worker

- `/health` exact expected routes
- unknown route → 404
- invalid Turnstile → 403
- fresh valid Turnstile + normal AI request
- per-route 429 behavior
- hostile CORS
- conversion ticket wrong route
- expired ticket
- malformed ticket
- Worker release ID

#### Modal

- wrong bearer → 401
- no bearer → 401
- valid bearer + valid PDF/DOCX → success
- corrupt input
- encrypted PDF
- oversized input
- timeout fixture
- internal exception does not leak stack/library details

#### Conversion fidelity

- Hindi/Unicode
- images
- tables
- headers/footers
- hyperlinks
- filled forms
- comments
- highlights
- stamps
- scanned PDF

#### Payments

Use Razorpay test mode only for automated E2E scenarios:

- correct purchase
- tampered signature
- wrong product
- already purchased
- webhook before browser callback
- browser callback before webhook
- duplicate webhook
- simultaneous processing
- User B cannot access User A entitlement
- refund behavior after the business rule is implemented

#### Supabase

- anon products allowed
- anon orders denied
- authenticated User A sees only User A orders
- authenticated User B sees only User B orders
- no anonymous `r2_key`
- advisors clean except documented accepted findings

#### Performance / memory

Test large files on:

- low-memory Android device
- desktop Chrome
- Firefox
- Safari/iPhone where available

Measure:

- peak memory
- time to first UI response
- main-thread blocking
- crashes
- OOM
- output size
- cancellation behavior

---

## 16. CI/CD Target Pipeline

Recommended release chain:

```text
checkout
→ supported Node setup
→ npm ci
→ build
→ static performance budget
→ regression tests
→ Worker syntax
→ Wrangler dry-run
→ secret/config validation
→ deploy Worker
→ Worker smoke
→ deploy Modal services / verify release
→ deploy frontend
→ frontend smoke
→ full production smoke
```

### Frontend production smoke

At minimum verify:

- `/` → 200
- expected release/build ID
- core CSS → 200
- core JS → 200
- tool registry → valid JSON
- one local PDF tool loads
- one cloud tool reaches the current Worker
- canonical is valid
- no obvious console error

---

## 17. External Configuration Checklist

### GitHub

- [ ] Add `CLOUDFLARE_API_TOKEN`
- [ ] Add `CLOUDFLARE_ACCOUNT_ID`
- [ ] Protect `main`
- [ ] Require build/test/validation checks
- [ ] Upgrade CI Node version
- [ ] Consider SHA pinning third-party Actions

### Cloudflare Worker

- [ ] Verify all Worker secrets
- [ ] Verify R2 binding
- [ ] Verify rate-limit bindings
- [ ] Deploy current Worker
- [ ] Confirm `/health`
- [ ] Confirm unknown route = 404
- [ ] Confirm AI protection
- [ ] Confirm conversion routes
- [ ] Add release ID to health response

### Cloudflare DNS / edge

- [ ] Configure `www` → apex 301
- [ ] Replace legacy meta-refresh aliases with 301 rules
- [ ] Add/report-only CSP header
- [ ] Review/remove unnecessary `Access-Control-Allow-Origin: *` on document responses
- [ ] Verify Permissions-Policy does not disable Speech-to-Text microphone access

### Modal

- [ ] Create/verify `onlinepdfpro-conversion`
- [ ] Set `MODAL_API_TOKEN`
- [ ] Deploy both conversion apps from the release commit
- [ ] Verify wrong bearer = 401
- [ ] Add concurrency cap
- [ ] Sanitize internal errors

### Supabase

- [x] RLS enabled on `orders`
- [x] RLS enabled on `products`
- [x] owner-only authenticated `orders` SELECT policy verified
- [ ] Enable leaked-password protection
- [ ] Commit reproducible complete schema/policies
- [ ] Remove `r2_key` from public product projection
- [ ] Run security advisor after changes
- [ ] Run performance advisor after changes

### R2

- [ ] Confirm bucket has no public access path
- [ ] Confirm no public development URL
- [ ] Confirm Worker entitlement path is the only intended paid-file path

### Razorpay

- [ ] Confirm current test/live mode
- [ ] Confirm webhook URL
- [ ] Confirm webhook secret matches Worker secret
- [ ] Decide refund/chargeback entitlement policy
- [ ] Run non-destructive test-mode E2E

---

## 18. Corrected Priority Backlog

| ID | Pri | Area | Finding / Task | Action |
|---|---|---|---|---|
| P0-1 | P0 | Modal | Production endpoint did not enforce bearer auth | Deploy protected services and verify 401 |
| P0-2 | P0 | AI | Production Worker protections did not match `main` | Fix deployment and deploy Worker |
| P0-3 | P0 | Conversion | Production Worker lacked current conversion routes | Deploy Worker + Modal together |
| P0-4 | P0 | CI/CD | Missing Cloudflare GitHub Actions deployment credentials | Add GitHub secrets |
| P1-1 | P1 | Cost/Security | One generic rate bucket | Valid per-route 60s/10s limiters |
| P1-2 | P1 | AI | Arbitrary model selection risk | Model allowlist |
| P1-3 | P1 | Conversion | Ticket wildcard route | Exact route-bound tickets |
| P1-4 | P1 | Modal | No explicit parallel cost ceiling; raw errors | Cap containers + sanitize |
| P1-5 | P1 | Database | Full schema/policies not reproducible from repo | Pull/reconcile schema into migrations |
| P1-6 | P1 | Auth | Supabase leaked-password protection disabled | Enable |
| P1-7 | P1 | CI | Node 20 outside Puppeteer 25.5 supported engines | Move to Node >=22.12 |
| P1-8 | P1 | Deployment | Live deployment not attributable to one release | Release IDs + coordinated pipeline |
| P1-9 | P1 | GitHub | `main` unprotected | Branch/ruleset protection |
| P1-10 | P1 | Browser security | No site-wide HTTP CSP header | Report-only → enforce |
| P2-1 | P2 | Fidelity | PDF→Word deletes annotations/widgets | Preserve/flatten or disclose |
| P2-2 | P2 | Conversion | Resource-abuse behavior needs stronger verification | limits + hostile fixtures |
| P2-3 | P2 | Privacy | Public product response exposes `r2_key` | remove from public projection |
| P2-4 | P2 | R2 | Bucket privacy not directly verified | dashboard verify |
| P2-5 | P2 | Payments | Refund/chargeback entitlement undefined | product decision + implementation |
| P2-6 | P2 | Performance | Supabase JS can be loaded more efficiently | pin/defer/lazy load |
| P2-7 | P2 | Repo | duplicate root build output | staged cleanup |
| P2-8 | P2 | PWA | arbitrary opaque GET caching | restrict caching; real TTL if desired |
| P2-9 | P2 | PWA | manifest overclaims/broken screenshot | correct manifest |
| P2-10 | P2 | A11y | verified screen-reader/contrast issues need exact fixes | audit exact selectors |
| P2-11 | P2 | Privacy | R2 absent from provider disclosure | add after privacy verification |
| P3-1 | P3 | SEO | `www` duplicate host | 301 to apex |
| P3-2 | P3 | SEO | meta-refresh aliases | edge 301 |
| P3-3 | P3 | Cleanup | orphan assets/dead files | remove after reference proof |
| P3-4 | P3 | Supply chain | Actions tag-pinned | optional SHA pin |
| P3-5 | P3 | Product | off-brand tool grouping | navigation/product decision |

---

## 19. Findings Explicitly Closed / Retracted

These must not appear as open remediation tasks unless a fresh test proves regression.

### CLOSED-1 — “12 empty canonical URLs”

**Status:** Retracted false positive.

Cause:

- earlier scan assumed `rel` appeared before `href`

Current canonical template:

```njk
<link href="https://onlinepdfpro.com{{ canonicalPath }}" rel="canonical"/>
```

is valid.

Action:

- keep an order-independent regression test
- do not change working canonical logic

### CLOSED-2 — “orders RLS may be missing”

**Status:** Verified good on live database.

Live checks confirmed:

- RLS enabled
- owner-only authenticated SELECT policy
- anon denied

Action:

- version the policy in migrations
- do not treat it as an active P0 vulnerability

### CLOSED-3 — “Modal fastapi_endpoint is legacy”

**Status:** Incorrect.

Action:

- keep `@modal.fastapi_endpoint`
- change only if current Modal docs or runtime requirements justify a migration

### CLOSED-4 — “Use a Worker Map for guaranteed one-time tickets”

**Status:** Rejected design.

Action:

- route-bind short-lived tickets
- use a Durable Object if true atomic one-time consumption is required

### CLOSED-5 — “Cloudflare conversion limiter period=300”

**Status:** Invalid config.

Action:

- use Cloudflare-supported periods only

---

## 20. Production Release Checklist

### Must pass before calling the deployment production-ready

- [ ] GitHub Actions has valid Cloudflare deployment credentials
- [ ] full pipeline passes on the release commit
- [ ] production Worker matches release commit
- [ ] deployed Modal apps match release commit
- [ ] wrong Modal bearer → 401
- [ ] `/health` lists expected current routes
- [ ] unknown Worker path → 404
- [ ] AI without valid Turnstile → 403
- [ ] rate-limit behavior verified with valid test methodology
- [ ] PDF→Word real fixture succeeds
- [ ] Word→PDF real fixture succeeds
- [ ] conversion errors do not leak internal exception text
- [ ] production R2 access path verified private
- [ ] `orders` owner-only RLS still verified
- [ ] leaked-password protection decision completed
- [ ] build/test/performance budget green
- [ ] CI uses a Node version supported by Puppeteer
- [ ] release/build ID visible in production
- [ ] frontend smoke passes
- [ ] Worker smoke passes

### High priority after deployment is stable

- [ ] AI model allowlist
- [ ] per-route rate limit bindings
- [ ] route-bound conversion tickets
- [ ] Modal concurrency ceiling
- [ ] complete Supabase schema migrations
- [ ] remove `r2_key` from public product response
- [ ] HTTP CSP rollout
- [ ] branch protection
- [ ] `www` 301
- [ ] refund/chargeback policy

### Quality improvements

- [ ] PDF form/annotation fidelity fixtures
- [ ] accessibility exact-selector fixes
- [ ] manifest cleanup
- [ ] Service Worker opaque-cache cleanup
- [ ] root duplicate build cleanup
- [ ] orphan asset cleanup
- [ ] Action SHA pinning
- [ ] large-file mobile testing

---

## 21. Instructions for ChatGPT Work / Coding Agent

Use this section as the execution instruction.

> Work from `main` and treat the current code as source of truth.  
> Do not blindly reproduce changes from the older `AUDIT_FINDINGS.md`.  
> This V2 file supersedes it.
>
> Fix work in priority order:
>
> 1. P0 deployment blockers.
> 2. Verify production behavior.
> 3. P1 security/cost/deployment/recovery.
> 4. P2 correctness/privacy/performance/accessibility.
> 5. P3 cleanup/SEO/product work.
>
> For every task:
>
> - inspect current source before editing
> - confirm the issue still exists
> - make the smallest safe change
> - add/extend regression coverage
> - run build/tests
> - verify production when deployment-related
> - record external configuration separately
> - do not mark a finding fixed until verification passes
>
> Preserve verified-good behavior:
>
> - QR DOM-XSS protection
> - HTML-to-PDF sanitizer
> - AES-256 PDF encryption
> - structural PDF unlock
> - genuine JPEG/PNG/WebP conversion
> - Unicode Hindi speech PDF support
> - registry-driven tools/sitemap
> - payment server-authoritative checks
> - Supabase owner-only orders RLS
> - Service Worker non-GET exclusion
> - existing regression suite
>
> Do not:
>
> - “fix” canonical URLs without fresh proof
> - replace Supabase RLS that is already correct
> - use `period = 300` in Cloudflare Worker rate-limit bindings
> - claim a process-local Worker `Map` makes tickets globally single-use
> - migrate away from `@modal.fastapi_endpoint` only because the old audit called it legacy
> - globally change design colors based on the old incorrect contrast calculation
> - call a Service Worker change “TTL” unless real time-based expiration is implemented
> - deploy a frontend that depends on Worker routes that have not passed smoke tests

---

## 22. Definition of Done

OnlinePDFPro can be called production-ready only when:

1. one exact release commit can be mapped to the live frontend, Worker, and Modal services;
2. the release pipeline passes from validation through post-deploy smoke;
3. AI and conversion compute cannot be freely abused through the previously observed production paths;
4. both PDF↔Word conversion directions work through the protected gateway;
5. Supabase policies remain owner-safe and are reproducible from migrations;
6. R2 paid files are confirmed private outside the authenticated entitlement path;
7. production errors do not expose backend internals;
8. payment E2E test-mode scenarios pass;
9. accessibility and large-file limitations are documented or fixed;
10. no retracted finding from the older audit is being treated as an active bug.

---

## 23. Current Overall Verdict

### Codebase

**Generally strong but still needs P1 hardening and cleanup.**

A large amount of security/correctness remediation already exists in `main`.

### Production

**Not yet ready for confidential/business-critical document processing until the deployment blockers are fixed and re-verified.**

The largest immediate risk is not that all protections are missing from source code.

The largest immediate risk is that **the protected source code has not been consistently deployed to all production components**.

### Next action

The first operational step is:

1. configure the missing GitHub Cloudflare deployment credentials;
2. deploy the current hardened Worker;
3. deploy both current protected Modal services;
4. run production smoke tests;
5. only then continue with P1/P2 improvements.

---

## 24. Reference Documentation for Corrected Guidance

Cloudflare Workers Rate Limiting bindings:  
`https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/`

Cloudflare Turnstile server-side validation:  
`https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`

Modal FastAPI endpoints:  
`https://modal.com/docs/guide/webhooks`

Supabase database migrations:  
`https://supabase.com/docs/guides/deployment/database-migrations`

Supabase password security:  
`https://supabase.com/docs/guides/auth/password-security`

PostgreSQL Row Security Policies:  
`https://www.postgresql.org/docs/current/ddl-rowsecurity.html`

---

**End of `AUDIT_FINDINGS_V2.md`**
