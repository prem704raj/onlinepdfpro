# OnlinePDFPro: 90-day launch and security roadmap
Updated: 20 October 2026. Owner: OnlinePDFPro. This is a working backlog, not an assertion about live webmaster metrics.

## Sitemap crawler-rule follow-up — 20 October 2026

- The local read-only audit now evaluates Googlebot and Bingbot rules against **every sitemap path**, including partial restrictions such as `Disallow: /tools/`, and checks user-agent specificity, wildcard patterns and more-specific `Allow` exceptions. Deterministic regression cases cover these combinations. This is a pre-release audit improvement proposed in draft PR #14, not a deployed change.
- A fresh production crawl at **00:34 IST, 20 October** returned HTTP 200 for **82/82** public routes, covering **80** sitemap URLs and **10/10** priority search URLs, with zero reported crawler, canonical, noindex or metadata errors/warnings. Pages and Worker both still identify release `20ba1feee2322fb81b351e89475616a34bc753a0`, so flagship analytics from PR #14 are **not yet verified in production**. Evidence: `P:/Projects/onlinepdfpro/.audit/evidence/public-audit-2026-10-20-crawlers.json`.
- After PR #14 is reviewed, merged and deployed through the ordered Worker/Pages workflow, rerun the public audit and release-parity checks; only then use a consented browser export and GA4 DebugView/Realtime to confirm successful tool events. Google Search Console indexing decisions, its historic 404/noindex examples, and authenticated purchase/refund acceptance still require separate account-level checks.

## Public indexability follow-up — 19 October 2026

- The expanded read-only production audit checked **82/82** distinct public routes successfully, covering all **80** live sitemap URLs and all **10** priority search URLs. Sitemap destinations, canonical tags, heading presence, declared robots sitemap, and HTML/HTTP noindex signals passed; Pages and Worker still agree on release `20ba1feee2322fb81b351e89475616a34bc753a0`. Evidence: `P:/Projects/onlinepdfpro/.audit/evidence/public-audit-2026-10-19-indexability.json`.
- The audit now includes all discoverable sitemap routes, including blog posts, and fails on missing priority paths, duplicate/legacy sitemap URLs, blocked root crawling or a noindex directive on a sitemap URL. These checks establish public crawlability signals; **actual Google indexing and GSC's historical 404/noindex examples still require Search Console inspection**.
- The five flagship analytics workflows were committed locally in `1fdf8d9` and their existing regression suite noted in `344eab2`. The observed production release predates these changes; a reviewed deployment is still needed before live conversion measurement can be verified.

## Continued audit and measurement implementation — 18 October, approximately 22:33 IST

- **Fresh public audit:** the read-only `scripts/audit-public-site.mjs` crawl found 61/61 expected routes returning HTTP 200, with zero reported errors or metadata warnings. The production Pages release and Worker health both identify `20ba1feee2322fb81b351e89475616a34bc753a0` (merged PR #13), a newer release than the PR #12 snapshot below. Worker health advertised all ten protected routes. HTTP/metadata and health checks do not establish that real file exports or payments succeed.
- **Audit evidence:** `P:/Projects/onlinepdfpro/.audit/evidence/public-audit-2026-10-18-2233.json` contains the complete route-by-route report. Rerun using `node scripts/audit-public-site.mjs --output <report-path>` after the next deployment.
- **Implemented locally, not deployed:** the five flagship tools (Merge, Split, Compress, JPG to PDF, PDF Editor) now emit opt-in, sanitized `tool_start` and `tool_complete` events for successful operations; failures emit `tool_error`. The shared rename-and-download flow emits `tool_download` only after confirmation, and ignores its programmatic anchor clicks to avoid double counting. The editor also marks successful export download initiation. Events contain only permitted actions/counts/error codes, never document text or filenames.
- **Coverage added:** automation checks start/completion cardinality for Merge, Split, JPG to PDF and Compress, verifies PDF Editor successful exports, and exercises both cancellation and confirmation for the shared downloader. Live GA4 confirmation awaits production rollout and consented manual exports.
- **Next operational steps:** after releasing the validated change, explicitly opt in during a real browser export, inspect GA4 DebugView/Realtime for `tool_start`, `tool_complete`, `tool_download` and check counts. Configure `tool_complete` (and `tool_download` if useful) as GA4 key events in the property. Exclude owner/test traffic when assessing organic conversion. Finish the existing Google URL inspections and 404/noindex review, then owner authentication and sandbox purchase/refund acceptance; the code-only measurement work does not resolve those account tasks.

## Verified production progress — 18 October, approximately 21:30 IST

- **Deployed:** PR #12 (`https://github.com/prem704raj/onlinepdfpro/pull/12`) merged and all four production jobs passed. Frontend and Worker both report release `efac97ad1a612bcaaf8aa15a10e617806defdd08`. The release contains PDF.js evaluation protection, escaped history metadata, bounded Worker bodies/timeouts, refund/dispute retry protection, Cloudflare Analytics CSP allowances and corrected converter descriptions.
- **Live validation:** 61 public pages return HTTP 200 with expected canonical destinations, including the intentional `/support` → `/help` redirect. Worker smoke checks pass for all ten protected routes. These are HTTP/defensive checks, not proof that every real provider or checkout succeeds.
- **Analytics:** a fresh live browser recorded Cloudflare beacon script HTTP 200, collection HTTP 204, and opted-in GA4 collection HTTP 204, with no page errors during the Merge/Split page check. This test itself adds analytics traffic.
- **Actual GA4 baseline:** the dashboard showed 3 active users, 10 views and 32 events for 11–17 October, with 7 Direct sessions and 0 key events. These may include owner/test visits. A zero realtime count does not mean zero historical users. Search Console association is verified in both products: OnlinePDFPro stream `15381435747`, linked 18 October 2026.
- **Google baseline:** the Pages report last updated 12 October shows 18 indexed and 43 excluded: 12 canonical alternatives, 9 noindex, 5 redirects, 3 missing URLs, 14 crawled but not indexed. The displayed crawled examples include old `.html` URLs last crawled June–August. Individual canonical URL inspection shows Compress PDF and Split PDF already indexed; Merge PDF and PDF Editor were discovered but not indexed, and both received confirmed priority crawl requests. Requesting a crawl does not guarantee indexing.
- **Bing:** sitemap `https://onlinepdfpro.com/sitemap.xml` was successful, last crawled 17 October with 78 discovered URLs in its row. URL inspection confirms Merge PDF, Compress PDF and JPG-to-PDF indexed successfully. Search Performance shows 0 clicks and impressions for the displayed July–October period. Ten updated priority URLs were submitted through Webmaster Tools after deployment; the UI confirms 10 submitted today and 90 quota remaining.
- **Recovered authentication:** the configured Supabase project was inactive and its public hostname failed DNS resolution. It subsequently moved through COMING_UP to ACTIVE_HEALTHY. Database queries now succeed; public auth settings return HTTP 200 with Google/email providers enabled and signup allowed. An actual end-user sign-in is still required for full journey acceptance.
- **Database security:** products/orders both have RLS enabled. Public roles have SELECT only; users can read only their own orders; active products are publicly readable. The one public SECURITY DEFINER function is an event trigger with no anonymous execute permission. Security advisor's remaining warning is leaked-password protection disabled; check plan availability before enabling or purchasing an upgrade. Aggregates show 5 accounts, 6 orders and 1 paid order; these are records, not verified independent customers or revenue.
- **Cloudflare:** root and www are proxied CNAMEs to `onlinepdfpro.pages.dev`. TLS changed from Full to Full (strict), persisted after navigation, and both HTTPS hosts remain HTTP 200. HTTP redirects to HTTPS. The managed-rules setting is always active. One zone rate rule matches `/services/`; it does not cover the separate workers.dev host. Worker-specific AI/conversion rate bindings remain the relevant API protection. SPF and DKIM exist; DMARC is absent.

### Exact remaining order

1. Finish Google URL inspection for the remaining priority canonical pages and request indexing only for missing/improved pages. Record confirmations and quota limits; do not promise ten additional indexed pages or repeatedly resubmit accepted URLs.
2. Audit Google's three 404 examples and nine noindex examples against intended routes before changing exclusions. Inspect current sitemap processing and manual actions separately. Keep intentional account/redirect exclusions.
3. Verify a real owner sign-in, sandbox purchase/refund and entitled download after Supabase recovery. Review pause notifications; do not silently upgrade a paid plan or create artificial keepalive activity.
4. Configure meaningful GA4 key events for actual successful exports/downloads, verify Realtime, and separate owner/test traffic from acquisition. Preserve consent and event sanitization.
5. Add an appropriate DMARC policy after confirming mail providers and a reporting mailbox. Check TLS edge settings and security-event trends. Evaluate the legacy `/services/` rate rule against actual traffic before repurposing it.
6. Execute the growth work below: recruit five real testers for the five flagship workflows, publish demonstrations with tracked campaign links, and measure completed outputs and returning visitors before adding more tools or buying ads.

Screenshots are saved locally under `P:/Projects/onlinepdfpro/.audit/evidence/`: Google Merge/PDF Editor request confirmations, Bing submissions, GA4 association and strict TLS.

## Evidence and current state

- The local build generates 97 HTML pages and 80 canonical sitemap entries, including 19 blog posts. A sitemap URL is a discovery hint; it does not guarantee indexing.
- Ten selected tool URLs returned HTTP 200 with matching canonical URLs. Earlier IndexNow pings were accepted; subsequent Bing and Google account findings are recorded in the verified progress section above.
- Opt-in GA4 targets measurement ID `G-RPDGMCZ97D` and sends sanitized events after consent. The Cloudflare Web Analytics CSP defect is deployed and collection has been verified live; GA4 historical activity and the existing property association are confirmed above.
- The site advertises 46 tools. Its primary product direction should emphasize five: Merge PDF, Compress PDF, Split PDF, JPG to PDF, PDF Editor. Conversion directions PDF to JPG / Word are useful secondary journeys.
- The production deployment workflow runs validation, Worker deployment and smoke tests, then Pages deployment. Cloudflare account rules and dashboard access have not been audited from this checkout.
- The source contains optional AI functions, externally processed conversions, Supabase authentication and Razorpay digital-products checkout. Assess privacy and operational costs separately from purely local PDF tools.

## Priority 0: trustworthy production measurements and security (days 0–7)

1. Release the validated PDF.js `isEvalSupported:false` protections, safe history rendering, bounded Worker request/response reads, webhook retry/entitlement handling, and CSP allowance for Cloudflare Web Analytics. Verify GitHub Actions, Worker `/health` release hash, Pages `/release.json` hash, and effective production CSP.
2. Confirm Cloudflare Web Analytics beacons actually load in a fresh browser and are visible in the dashboard. Confirm GA4 Realtime after explicit consent, with one test page view and one conversion event. Compare GA4 opted-in counts with Cloudflare aggregate traffic; do not collect filenames, PDF contents, or auth secrets.
3. In Google Search Console inspect **Pages → Why pages aren't indexed** and export reasons and example URLs. Verify whether 18 means indexed, discovered, crawled, excluded, or an old time range. Confirm `https://onlinepdfpro.com/sitemap.xml` status and inspect a priority page's live URL. Request indexing sparingly for genuinely improved pages.
4. In Bing Webmaster verify domain ownership and `sitemap.xml`, inspect the same ten priority URLs, and check the IndexNow submission report. Accepted IndexNow pings are not proof of indexing. Submit a URL manually only when justified by a page update and if the account supports it.
5. Inspect Cloudflare DNS, proxy status, HTTPS-only, TLS mode, bot controls, WAF managed rules, custom rate limits, and security events. Verify Worker bindings and secrets without printing their values. Maintain separate quotas for costly AI/chat/vision/conversion endpoints.
6. Confirm payment webhook signatures and replay/idempotency handling in production; exercise sandbox checkout including refund and dispute. Review R2 private bucket access, Supabase Row Level Security, callback allowlists, and logs for authorization errors. Do not run a real paid charge as an automated test.
7. Check all top user journeys on desktop and 320/390px mobile: first visit → choose tool → select file → preview → complete → download → re-open output. Record time to first result and failures. Test offline/reload/consent states.
8. Record a clean baseline of search impressions, unique visits, activated sessions (upload/start), successful output downloads, and error rates. Treat missing data as **unknown**, not as zero.

**Release gate:** No exposed secrets; no failed automated tests; live release hashes match; no critical page/Worker runtime errors; analytics collection verifies with consent.

## Priority 1: conversion, clarity and usefulness (days 7–21)

- Make the homepage's first screen answer: **Free PDF tools for simple document tasks; choose a file and download a result.** Present the five flagship workflows above the full directory, with a clear privacy explanation distinguishing local processing from server conversions.
- Keep the 46-tool directory searchable, but use distinct task categories and avoid visually giving every tool equal priority. Do not delete working tools solely to reduce count; remove misleading claims and broken tools first.
- Improve the five priority pages with task-specific screenshots, a small test example, realistic limits, clear input and output formats, useful troubleshooting, and one relevant next-step link. Reuse the original guide pages already present.
- Consolidate incompatible claims such as “all processing stays on your device” when some Word/AI conversions require external services, and “no signup” when a particular operation is protected or paid. Disclose which tools contact a server at the point of upload.
- Separate study-material purchase messaging from the primary PDF-tool journey (e.g. a distinct nav/footer section), so users looking for a quick merge don't see a storefront before the action they wanted.
- Add useful first-run feedback: selected filename preview (local only), progress, success state, accessible errors, retry, and unambiguous output download. Test using realistic scanned, multi-page and rotated PDFs.
- Simplify advertising slots and avoid empty reserved ad space, especially in mobile first viewport; don't let monetization impair completion.

## Priority 2: organic discovery that serves real searches (days 14–45)

### Core search pages, in order

1. /tools/merge-pdf — combine assignment pages in a chosen order.
2. /tools/compress-pdf — file-size targets and what quality may change.
3. /tools/split-pdf — retain selected page ranges and verify the output.
4. /tools/pdf-editor — change existing text vs overlay, limitations, privacy.
5. /tools/jpg-to-pdf — phone note photos to one correctly ordered A4 PDF.
6. /pdf-to-jpg — export selected PDF pages as JPG or ZIP.
7. /tools/sign-pdf — visual signature vs cryptographic signature.
8. /tools/pdf-to-word — conversion fidelity, server processing and access gates.
9. /tools/word-to-pdf — formatting expectations, external processing.
10. /tools/image-to-text — OCR language/accuracy and handwritten limitations.

**Indexing workflow:** canonical self-links, 200 responses, relevant title and H1, substantial accurate page-specific instructions, real tool that works, internal links from a hub and example guide, sitemap inclusion, then search-engine inspection. Avoid arbitrary “index ten more” promises and duplicate keyword variants. Review reported Google indexing data weekly.

### Content production

- Publish 1–2 genuinely useful illustrated workflow guides each week with a sample document and tested output; prioritize “merge a scanned assignment,” “compress a university upload,” “split admit-card pages,” and “turn photos into a searchable or printable PDF” (be explicit where OCR is needed).
- Record short real screen captures demonstrating each task in under 45 seconds. Include exact route in descriptions, captions, and a clear before/after example.
- Build one original downloadable practice pack with non-sensitive sample PDFs/images and a checklist. Useful reusable samples are a stronger link magnet than generic SEO prose.
- Create a lightweight changelog and feedback entry point. Collect opt-in qualitative reports of failed operations; never upload source documents automatically.
- Do not mass-produce thin city pages, spinner copy or hundreds of nearly identical conversion pages. Measure impressions, clicks, rankings and completed jobs before expanding scope.

## Priority 3: distribution and repeat use (days 14–90)

### Channels and weekly experiments

| Channel | Specific outreach | Measurement |
| --- | --- | --- |
| Student communities | Share a helpful assignment-file walkthrough where rules allow; offer a test fixture and outcome; ask permission before posting | Qualified visits, tool completions |
| Educators/campus offices | Demo merging/splitting assignment PDFs; 10 genuine personal outreach messages weekly | Replies, actual use cases |
| YouTube Shorts/Reels | Real 20–45 second demos of one task, 2–3 per week | Clicks to deep-linked tool, completions |
| Developer/design communities | Write a technical post on browser-side PDF processing, accessibility and privacy tradeoffs | Referrals and links |
| Documentation/blog | Original long-tail tutorial with downloadable example and output | Search impressions and clicks |
| Helpful integrations | Explore an easy share link or installed PWA instruction after a successful result | Returning sessions, repeat downloads |

Avoid unsolicited bulk DMs, purchased traffic, artificial backlinks or indexing services that claim guaranteed Google placement. For each outreach batch, record time spent and qualified outcomes.

### Decision thresholds (targets to learn from, not forecasts)

| Date | Leading goal | Product goal | Decision |
| --- | --- | --- | --- |
| Day 7 | Analytics and Search Console baseline verified | 5 flagship workflows error-free | Remove measurement blind spots first |
| Day 30 | First 100 qualified landing visits, tracked from more than one source | 20 successful exports from non-team users | If few starts, clarify page/value proposition; if many failures, fix the workflow |
| Day 60 | 300+ cumulative qualified landing visits | 75 cumulative successful exports | Expand the two channels with highest successful-export rate |
| Day 90 | 1,000+ cumulative qualified landing visits | 250 cumulative successful exports, evidence of repeats | Pursue SEO scale/partnerships only after retention and completion improve |

Keep targets flexible; Google indexing and ranking can take time. A user completes value when they successfully download a usable file, not when they merely load the homepage.

## Further engineering backlog

- Gradually replace CSP `unsafe-inline`/`unsafe-eval` and broad third-party allowlists with vetted scripts, hashes/nonces and strict isolation; introduce enforced policy only after report-only violations have been reconciled across every tool.
- Establish dependency-upgrade cadence, locked runtime/package versions, minimum permission GitHub Actions, automated secrets scanning, upload size/content limits, MIME/signature checks and no long-term storage for local conversions.
- Measure p75 real-device Core Web Vitals by page family; optimize heavy fonts and lazy-loaded PDF libraries, and avoid increasing the current roughly 30 MB static build.
- Set up private uptime/synthetic checks for homepage, top routes, Worker health and conversion failure boundaries. Alert on sustained 5xx and rate-limit saturation.
- Keep test fixtures for malicious filenames, invalid PDFs, untrusted PDFs with JavaScript, oversized inputs, stalled provider streams, refunds/disputes, keyboard/mobile usability and offline cache.
- Add a security/contact page or scoped vulnerability-reporting channel and maintain a simple internal incident process (disable compromised API keys, roll back, assess impact, disclose if required).
- Test each new tool against the same quality bar as flagship tools before linking it publicly; quarantine placeholder or unreliable workflows from discovery.

## What not to do yet

- Spend on broad paid ads while success events and the first-run funnel are unmeasured.
- Build 20 more generic tools or AI functions before proving flagship workflows solve common problems.
- Treat a successful sitemap or IndexNow submission as guaranteed Google/Bing indexing.
- Claim “100% local/private” sitewide while any tool calls external conversion or AI providers.
- Remove working content just because it currently ranks poorly, without seeing impressions, engagement, and search intent.
- Optimize AdSense or paid study-material sales ahead of the basic PDF tool completion experience.

## Weekly owner dashboard

Record (with explicit collection/consent scope): total visits, traffic source, landing URL, opted-in GA4 page views, Cloudflare aggregate requests, upload/start events, successful exports, upload-to-export completion %, errors by tool, p75 load time, GSC/Bing indexed counts and exclusion reasons, search impressions, organic clicks, backlinks earned through actual contributions, support requests and repeat visits. Separate **unknown**, **not configured** and **zero**. Pick one blocker per week and finish it before increasing feature scope.

## Still requiring account access / live confirmation

- Refresh GSC's indexed/excluded coverage data after its 12 October report; inspect the remaining priority canonical URLs, three 404s and nine noindex examples. The GA4 property association was already confirmed on 18 October.
- Recheck Bing's impressions/clicks and crawl reports after the ten confirmed submissions. Existing sitemap/index observations are recorded above.
- Inspect actual Cloudflare Web Analytics dashboard trends and security events. Beacon delivery, strict TLS and the relevant current API bindings have been checked, but trend analysis remains outstanding.
- Deploy the local funnel instrumentation, then verify each consented GA4 event in Realtime/DebugView and configure appropriate key events. Separate owner/test activity from user conversion rates.
- Following any future release, confirm Pages and Worker hashes match and recheck protected route behavior. The 18 October live audit already confirmed matching PR #13 hashes.
