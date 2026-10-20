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
3. **Consented GA4 Page Views & Cloudflare Requests**: Contrast raw Cloudflare edge requests with consented analytics sessions to measure client consent rates.

### Conversion & Reliability Funnel
4. **Tool Start Events**: Number of files selected / dropzone activations (`tool_interaction`).
5. **Successful Exports**: Number of successful downloads (`file_download`).
6. **Start-to-Export Completion Rate**: `(Successful Exports / Tool Start Events) * 100%`. Healthy benchmark: &gt; 65%.
7. **Errors by Tool**: Aggregate count of recoverable errors (e.g., password-locked file, oversized input) versus unhandled script rejections.
8. **p75 Performance**: p75 page load and script initialization times across mobile and desktop.

### Search Engine Hygiene
9. **GSC & Bing Index Coverage**: Number of valid indexed URLs versus excluded URLs.
10. **Exclusion Reasons**: Track crawl anomalies, canonical mismatches, or soft 404s. Ensure all 10 priority routes maintain `Indexed, not submitted` or `Submitted and indexed`.
11. **Impressions & Clicks**: Weekly Google Search Console impressions and organic click-through rate.

---

## 3. Distribution Channels & Experiment Playbook

All outreach must be high-utility, permission-based, and accompanied by reproducible fixtures. Never engage in bulk DMs, paid fake traffic, or automated backlink schemes.

| Channel | Specific Outreach Protocol | Success Metric |
| :--- | :--- | :--- |
| **Student & Academic Communities** | Share practical walkthroughs on Reddit (r/college, r/students) or campus forums where permitted. Offer the fictional [Downloadable Practice Pack](/guides) and explain local client-side privacy tradeoffs. | Qualified visits, tool completions, community upvotes/feedback. |
| **Educators & Campus Offices** | Conduct 10 genuine, personalized outreach emails weekly to faculty coordinators or document offices demonstrating assignment splitting/merging. | Direct replies, institutional use cases, workflow feedback. |
| **YouTube Shorts & Video Guides** | Publish 2–3 concise 20–45 second screen captures demonstrating single tasks (e.g., "Split only page 1 from an exam hall ticket"). Deep-link directly to the specific tool. | View-through rate, clicks on deep links, completed jobs. |
| **Developer & Privacy Communities** | Publish technical write-ups on Hacker News, Dev.to, or GitHub detailing client-side WASM processing, Web Workers, and strict CSP nonce enforcement. | Developer backlinks, technical feedback, GitHub stars. |
| **Search Guides & Documentation** | Publish long-tail tutorials accompanied by real downloadable test fixtures (e.g., Admit Card Split Guide, University Upload Compression Guide). | Organic search impressions, landing clicks, practice pack downloads. |
| **PWA & Offline Distribution** | Prompt users who have completed 2+ successful exports to install the Progressive Web App for offline access. | Installed PWA sessions, repeat visits within 30 days. |

---

## 4. Engineering Backlog & Privacy Guardrails

1. **CSP Nonce Transition**: Continue progressive hardening from `unsafe-inline` toward strict cryptographic nonces for script execution across all standalone tools.
2. **Byte Budget Discipline**: Enforce the static deployment budget cap of 30,000,000 bytes and homepage budget of 100,000 bytes in CI on every commit.
3. **Zero Content Telemetry**: Error reporting and analytics must never collect, inspect, or log user document text, filenames, form data, or personal metadata.
