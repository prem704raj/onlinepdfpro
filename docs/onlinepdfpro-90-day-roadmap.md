# OnlinePDFPro: 90-day launch and security roadmap
Updated: 18 October 2026. Owner: OnlinePDFPro. This is a working backlog, not an assertion about live webmaster metrics.

## Evidence and current state

- The local build generates 97 HTML pages and 80 canonical sitemap entries, including 19 blog posts. A sitemap URL is a discovery hint; it does not guarantee indexing.
- Ten selected tool URLs returned HTTP 200 with matching canonical URLs in prior checks. All ten were accepted by the IndexNow API (HTTP 200); Bing indexing has **not** been confirmed. Search Console's alleged 18 indexed pages requires a fresh dashboard export.
- Opt-in GA4 code targets measurement ID `G-RPDGMCZ97D`. It sends page views and sanitized tool events only after consent. Therefore GA4's zero-user number alone cannot establish that no visitors arrived. Cloudflare Web Analytics injection was blocked by the production CSP; a CSP fix is pending deployment and live validation.
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

- Actual GSC indexed count and coverage categories; Search Console–GA4 property link status.
- Bing Webmaster verified submission/index inspection beyond already accepted IndexNow pings.
- Cloudflare Web Analytics data after CSP fix is deployed; domain-level WAF, bot and TLS policy.
- GA4 Realtime test consent and sanitized event flow; marketing-attribution baseline.
- Production validation of both Worker and Pages release hashes after deployment.
