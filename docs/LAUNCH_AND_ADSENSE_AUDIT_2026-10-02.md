# OnlinePDFPro launch and AdSense audit — 2 October 2026

## Current decision

**The full application is not ready for production promotion.** The branch preview contains tested repairs; the main domain and API are still an older deployment. Local or controlled-provider tests are not proof that real AI, conversion, payment, microphone, speaker or background segmentation services work in production.

The 46-tool workflow evidence is in [TOOL_WORKFLOW_AUDIT_2026-10-02.md](TOOL_WORKFLOW_AUDIT_2026-10-02.md). This follow-up checks the rejection actually shown in the signed-in AdSense account, the public main domain, content claims and original example workflows.

## Findings and corrections

| Finding | Evidence | Correction / remaining action |
| --- | --- | --- |
| AdSense rejects the main site for **Low-value content** | Signed-in site detail says “Your site isn't ready to show ads”; the site table's last update is 16 June 2026 | Original guides with downloadable samples, corrected tool instructions and honest limitations are added to the preview. Publish the tested build and finish content review before requesting another review. No approval guarantee. |
| About page loops between two URLs | Public `/about` returns 301 to `/about.html`; `/about.html` returns 308 to `/about` | The branch already removes the bad alias and tests direct serving. Production must receive this corrected build. |
| Main domain is not the tested release | `/release.json` reports `local`; product `/products/dbms-notes` and new guides return 404 | Deploy the frontend and Worker from the same immutable revision through the gated workflow. |
| Analytics is not collecting on the current main homepage | Signed-in GA4 Home says “No data received”; measurement ID `G-RPDGMCZ97D` matches the branch. Main homepage has neither the analytics loader nor a Google tag; preview has the opt-in loader | Publish the loader, then verify a consented production session and task events in Realtime/DebugView. Zero dashboard data cannot be treated as a measured zero-traffic result for the old homepage. |
| Five tools contain a mistyped public security-widget key | Cloudflare's existing “OnlinePDFPro AI Tools” widget lists `0x4AAAAAAEh3z6dQZl38ae8E`; source used `...QZ138...` | Corrected Chat, Summarizer, Flashcards, PDF to Word and Word to PDF. This is a public site key, not a secret. Real server verification remains blocked by a missing secret. |
| Required backend deployment configuration is incomplete | Worker dashboard lacks `TURNSTILE_SECRET_KEY`, `CONVERSION_SIGNING_SECRET`, `MODAL_API_TOKEN`; GitHub Actions secret list is empty; Wrangler is signed out | Securely configure prerequisites, deploy both Modal apps and the matching Worker. Existing provider/payment secrets and R2 binding are present, but their presence is not a passing service test. |
| AdSense says ads.txt “Not found”, but the file now serves correctly | Main and preview `/ads.txt`: HTTP 200, `text/plain`, correct publisher record | Keep the existing file. Account status may need recrawling; no claim that adding more articles fixes an ads.txt crawler result. |
| Ownership metadata absent | Inspected public/preview HTML lacked the meta tag offered by the AdSense ownership panel | Add one `google-adsense-account` meta tag to every app page. It makes no advertising or tracking request. |
| Articles advertise unsupported features or guaranteed results | All 19 maintained articles inspected; examples include lossless JPG exports, OCR in the text extractor, instant compression presets, certificate signing, universal ATS compatibility and guaranteed archival survival | Corrected claims and instructions across all 19 existing URLs. Major task articles now explain supported controls and output checks. Institutional/academic expertise still needs attributed human review. |
| Homepage implies a reviewed, curated catalog | Paid catalog currently contains one 51-page ₹9 AI-assisted DBMS draft with academic review pending | Homepage and shared site metadata now reflect the actual product. No fabricated reviews, reviewer names or academic approval. |
| Empty advertisement gaps waste screen space | Standalone pages include empty `banner-ad-spacer` containers | Build preparation removes only empty spacers; populated content is preserved. |
| Background-model download can stall | Earlier live BEN2 attempts did not complete; successful real inference remains unverified | Labelled experimental and added “Stop and reload” for recovery. Controlled stalled-load and corrupt-input tests pass. Do not promote this feature as dependable until real desktop and phone inference is accepted. |

The main site's older `.html` canonicals differ from the branch's clean URL convention. An alternative URL with a correct canonical is not inherently an indexing error or the reason Google gave for rejection. Redirect loops, missing destinations and inconsistencies between the deployed build and its sitemap need correction.

## What was added

- A `/guides` hub and three task-specific walkthroughs: assignment merge/split, compression tradeoffs and photographed-note PDF creation.
- An original fictional three-page A4 PDF and two rendered JPG examples. They contain no customer data. The PDF is supplied with its reproducible ReportLab generator; Python is not needed to build the website.
- Links to examples on four core tool pages and the relevant articles.
- A homepage focused on Merge, Split, JPG to PDF, Compress and PDF Editor. All 46 tools remain in the directory.
- A fix for simultaneous HTML-head insertions, with idempotence and exactly-once ownership/analytics checks.
- A reproducible read-only public audit and expanded deployment smoke checks for the product, guides, samples and publisher record.

## Validation evidence

- Build produces 97 HTML files; 88 non-alias public pages are included in responsive checks.
- Full local `npm test` passes after the fixes. The tool suite includes 46 scenarios, initial loading checks for every registered tool, and additional guide workflows. Provider workflows use controlled responses and are explicitly labelled in the tool audit.
- Mobile reflow passes at 320, 390 and 768px. Menu, signed-in header, previews, cart and loaded editor are exercised in portrait and landscape; returning-visitor/offline styling is checked.
- The original sample was split into a one-page cover and a two-page notes/checklist file, then merged back into the expected three-page order. Structural compression retains searchable text and accurately reports an unmet 1KB target. Both JPG examples produce two A4 image pages.
- Every page of the original PDF was rendered and visually inspected; image-PDF output and mobile guide screenshots were inspected.
- Performance budgets pass. Package dependency audit reports zero known vulnerabilities; this is not a whole-application security certification.
- A final public preview smoke check must match the committed frontend revision. A public application audit still fails its backend alignment checks until the Worker is deployed.

Run the read-only audit from the checkout:

```powershell
node scripts/audit-public-site.mjs --base https://onlinepdfpro.com --release <full-commit-sha> --output .tmp-public-audit.json
```

Its strict clean-URL comparison checks the intended release convention. It does not establish that an older `.html` canonical alone is invalid. The audit creates no orders, submits no files to providers and modifies no customer data.

## Setup for an owner unfamiliar with the services

1. **Cloudflare Turnstile already exists.** Use the existing “OnlinePDFPro AI Tools” widget. Its private server-verification secret belongs in the Worker secret named `TURNSTILE_SECRET_KEY`. Do not paste the public site key into that secret, and do not send any secret in chat.
2. **Conversion signing needs a separate random secret.** Store a strong generated value as Worker `CONVERSION_SIGNING_SECRET`; it signs short-lived conversion tickets. It is not an Adobe, Razorpay or Turnstile key.
3. **Modal runs the converters.** Authenticate the Modal account, create a secret named `onlinepdfpro-conversion` containing `MODAL_API_TOKEN`, and deploy `services/pdf2docx/modal_app.py` and `services/docx2pdf/modal_app.py`. The same bearer value must be stored as Worker `MODAL_API_TOKEN`. Follow [services/README.md](../services/README.md). Confirm actual endpoint URLs match `cf-worker/wrangler.toml`.
4. **GitHub needs its own deployment credentials.** An owner/admin must put `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in repository Actions secrets. Browser sign-in does not populate them. Use only permissions needed for the existing Pages project and Worker; keep private values out of source and logs.
5. **Deploy through the existing workflow.** Keep automatic main-branch Pages publication disabled so it cannot bypass the API gate. Review and merge the branch, then let validation, Worker publication, Worker probes, frontend publication and public probes finish. See [IMPLEMENTATION_BATCH_1.md](IMPLEMENTATION_BATCH_1.md).

Credential entry and any new account/paid-service authorization require the account owner's secure participation. Nothing in this audit creates or expands credentials, purchases service capacity or accepts service agreements.

Both configured Modal conversion URLs responded to a read-only GET with HTTP 405 (`Method Not Allowed`). This confirms reachable endpoints, not authenticated conversion success, the deployed converter version or correct shared secrets. Reuse the existing account/services where appropriate instead of assuming a new service must be purchased.

## Launch gates, in order

1. Matching production frontend/API revision; direct About page; no missing promoted destinations.
2. Successful representative PDF↔Word conversions and real protected AI calls; test provider errors, retry and quotas as well as the happy path.
3. Authorized Razorpay **test-mode** checkout, verification, webhook delivery, library restoration, download protection and refund/recovery acceptance. A mocked checkout test is insufficient. Never use real payments to infer test-mode behavior.
4. Physical Android and iPhone/Safari acceptance for the promoted five tools: upload, virtual keyboard, download/reopening and memory pressure. Automated viewport emulation does not certify those devices.
5. Attributed knowledgeable review of DBMS notes, with corrections and disclosed scope. Use [DBMS_REVIEW_BRIEF.md](DBMS_REVIEW_BRIEF.md); do not expand or advertise academic approval before it is real.
6. Verify an opted-in production visit in GA4 Realtime/DebugView and sanitized task start/completion/error events. Preview-host analytics intentionally remains off. The signed-in property confirms no collection, and the live homepage is missing the loader; deploy and validate before using GA4 to judge promotion results.
7. Have an editor review all revised content and validate promised steps against the promoted tools. Add future examples based on actual user questions; do not mass-produce generic posts to reach an arbitrary count.
8. Recheck main-domain `/ads.txt`, public navigation, original guides, mobile pages and AdSense's current status. Only then submit another review; the rejection checkbox was left unchecked in this audit.

If the server services cannot be configured, a smaller launch with only verified local tools is possible, but requires an explicit product decision and a proper deployment profile that hides unavailable services and checkout. The current full-app gate must not simply be disabled to force a release.

## Promotion after those gates

Start with three specific tasks: assignment cover/notes merging, application upload-size reduction and phone-photo notes to PDF. Share a short demonstration with a link to the matching original guide. Use permitted student/community channels and referrals from people who actually complete a task. Track landing → upload → successful export and genuine errors before spending on ads. Search impressions and clicks are useful, but completion and repeat use show whether the tool is helping.

Paid notes should be a small, reviewed experiment rather than a remedy for absent tool traffic. A content catalog adds editorial responsibility and purchase-support costs. Validate course fit and the sample with real learners before creating more paid products. AdSense revenue or approval is not a prerequisite for a useful local-tool launch.

## Primary references consulted

- [Google AdSense: Make sure your site's pages are ready](https://support.google.com/adsense/answer/10015918): useful original content and usable navigation matter; it does not prescribe a fixed article length or guarantee approval.
- [Google Publisher Policies: Inventory value](https://support.google.com/publisherpolicies/answer/11112688?hl=en): restrictions on low-value, absent and unreviewed automatically generated content.
- [Google: ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) and [ads.txt crawl updates](https://support.google.com/adsense/answer/12171244?hl=en): correct root file and recrawl delays.
- [Greenhouse: Unsuccessful resume parse](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse): image/complex-layout parsing limitations; no universal ATS guarantee.
- [Library of Congress: PDF/A-1](https://www.loc.gov/preservation/digital/formats/fdd/fdd000125.shtml): profile-specific requirements and preservation constraints.
