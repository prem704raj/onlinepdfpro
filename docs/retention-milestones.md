# Distribution, Retention & Decision Thresholds (Phase 3: Days 14–90)

This operational guide formalizes the measurement protocol, decision thresholds, and distribution experiment playbook outlined in the [OnlinePDFPro 90-Day Roadmap](onlinepdfpro-90-day-roadmap.md).

---

## 1. Decision Thresholds & Milestones

These thresholds serve as learning targets rather than vanity forecasts. A user completes value when they successfully download a usable result, not when they merely land on the homepage.

| Milestone | Time Horizon | Leading Metric Goal | Product Completion Goal | Decision Gate |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | **Day 7** | Analytics & Search Console baselines verified with zero synthetic/bot pollution | 5 flagship workflows (`/tools/merge-pdf`, `/tools/compress-pdf`, `/tools/split-pdf`, `/tools/pdf-editor`, `/tools/jpg-to-pdf`) 100% verified error-free | Remove measurement blind spots and script errors first before driving traffic. |
| **M2** | **Day 30** | 100+ qualified landing visits across at least 2 distinct organic or community sources | 20+ verified successful file downloads from non-team users | **Fork:** If visit starts are high but downloads are few (&lt;20%), audit drop-off point and error logs; if visits are few, clarify page metadata and core search landing copy. |
| **M3** | **Day 60** | 300+ cumulative qualified landing visits | 75+ cumulative successful downloads | Identify the top 2 acquisition channels by completion rate; double down on those channels while curtailing poor converters. |
| **M4** | **Day 90** | 1,000+ cumulative qualified landing visits | 250+ cumulative successful downloads with evidence of repeat/returning usage | Pursue partnerships and broader SEO topics only after retention and completion baseline is proven. |

---

## 2. Weekly Owner Dashboard Schema

Every Monday, log the following metrics into the private operational log. Keep metric definitions strict and separate **unknown**, **not configured**, and **zero**.

### Acquisition & Traffic
1. **Total Visits & Traffic Source**: Separated by Organic Search, Direct, Referral, and Social.
2. **Top Landing URLs**: Track traffic to the 10 core search routes:
   - `/tools/merge-pdf`
   - `/tools/compress-pdf`
   - `/tools/split-pdf`
   - `/tools/pdf-editor`
   - `/tools/jpg-to-pdf`
   - `/pdf-to-jpg`
   - `/tools/sign-pdf`
   - `/tools/pdf-to-word`
   - `/tools/word-to-pdf`
   - `/tools/image-to-text`
3. **Consented GA4 Page Views & Cloudflare Web Analytics**: Record each separately with its collection scope. Edge requests, Web Analytics visits, and opted-in GA4 sessions have different denominators and cannot be divided to infer a consent rate.

### Conversion & Reliability Funnel
4. **File Selection**: Count `file_selected` separately from actual processing starts. A dropzone or button click is not a started job.
5. **Flagship Starts and Completions**: Count `tool_start` when processing begins and `tool_complete` when an output is created. Segment by `tool_id`; exclude owner and test traffic where possible.
6. **Download Initiations**: Count `tool_download` after the user confirms or starts an export. This is a proxy for completion, not proof that the browser saved or the user reopened a usable file. Do not mix it with legacy `file_download` click events.
7. **Start-to-Download Rate**: `(tool_download / tool_start) * 100%` for the same flagship tool and reporting window, with the number of consented starts shown alongside it. Validate actual usable outputs through tester feedback and file inspection; mark that outcome unknown when it has not been checked.
8. **Errors by Tool**: Aggregate `tool_error` codes and independently observed script or provider failures. A missing event is unknown, not a zero error rate.
9. **p75 Performance**: p75 page load and script initialization times across mobile and desktop.

### Search Engine Hygiene
10. **GSC & Bing Index Coverage**: Number of indexed URLs and reported exclusions, recording each dashboard's update date.
11. **Exclusion Reasons**: Track crawl anomalies, canonical mismatches, or soft 404s. Inspect the 10 priority routes; their indexing status is controlled by search engines and may remain discovered but not indexed.
12. **Impressions & Clicks**: Weekly Google Search Console impressions and organic click-through rate.

---

## 3. Distribution Channels & Experiment Playbook

All outreach must be high-utility, permission-based, and accompanied by reproducible fixtures. Never engage in bulk DMs, paid fake traffic, or automated backlink schemes.

| Channel | Specific Outreach Protocol | Success Metric |
| :--- | :--- | :--- |
| **Student & Academic Communities** | Share practical walkthroughs on Reddit (r/college, r/students) or campus forums where permitted. Offer the fictional [Downloadable Practice Pack](/assets/examples/onlinepdfpro-practice-pack.zip) and explain local client-side privacy tradeoffs. | Qualified visits, tool completions, community upvotes/feedback. |
| **Educators & Campus Offices** | Conduct 10 genuine, personalized outreach emails weekly to faculty coordinators or document offices demonstrating assignment splitting/merging. | Direct replies, institutional use cases, workflow feedback. |
| **YouTube Shorts & Video Guides** | Publish 2–3 concise 20–45 second screen captures demonstrating single tasks (e.g., "Split only page 1 from an exam hall ticket"). Deep-link directly to the specific tool. | View-through rate, clicks on deep links, completed jobs. |
| **Developer & Privacy Communities** | Publish technical write-ups on Hacker News, Dev.to, or GitHub detailing client-side WASM processing, Web Workers, and current CSP tradeoffs. | Developer backlinks, technical feedback, GitHub stars. |
| **Search Guides & Documentation** | Publish long-tail tutorials accompanied by real downloadable test fixtures (e.g., Admit Card Split Guide, University Upload Compression Guide). | Organic search impressions, landing clicks, practice pack downloads. |
| **PWA & Offline Distribution** | After two locally recorded export initiations, offer installation for quick access when the browser supports it. State offline support per tool; server conversions still require a connection. | Installed PWA sessions, repeat visits within 30 days. |

---

## 4. Engineering Backlog & Privacy Guardrails

1. **CSP Nonce Transition**: Continue progressive hardening from `unsafe-inline` toward strict cryptographic nonces for script execution across all standalone tools.
2. **Byte Budget Discipline**: Enforce the static deployment budget cap of 30,000,000 bytes and homepage budget of 100,000 bytes in CI on every commit.
3. **Zero Content Telemetry**: Error reporting and analytics must never collect, inspect, or log user document text, filenames, form data, or personal metadata.
