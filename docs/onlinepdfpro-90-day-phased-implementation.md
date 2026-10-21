# OnlinePDFPro 90 Day Roadmap Implementation Status

Updated 21 October 2026. Source: [90 day launch and security roadmap](onlinepdfpro-90-day-roadmap.md).

This tracker records code delivery separately from production deployment and real-user outcomes. A local build or automated test does not verify a live provider, payment, download, search index, or acquisition target. On 21 October, the ordered production workflow passed for release `ab40b0c1ea19378dd8026e3200b55de2e15916c6`. Pages and Worker reported that same release. A read-only crawl found 85/85 public pages reachable, 83 sitemap URLs, all 10 priority URLs, and no metadata or crawler-rule errors or warnings. `/changelog`, the Word sample, practice ZIP, and guide illustrations were served live. Synthetic live exports passed for Merge, Split, Compress, JPG to PDF, and PDF Editor; the downloaded PDFs reopened and their tested page counts or edited text were correct. A consented Split run emitted sanitized start, complete, and download events in the browser after the Google loader was requested. This does not establish GA4 property ingestion, payment behavior, search indexing, or real-user outcomes. Recheck the hashes and smoke tests after later deployments.

| Phase | Code and content status | Remaining acceptance |
| --- | --- | --- |
| **0: Measurement and security** | Defensive PDF and Worker protections and the flagship consented funnel are deployed. Pages/Worker parity, defensive route probes, the public crawl, and browser-side consent/event behavior passed on the checked release. | Verify GA4 DebugView or Realtime ingestion and key-event configuration, a real owner sign-in, and sandbox purchase, entitled download, refund, and dispute behavior. Review refreshed GSC/Bing coverage and Cloudflare security trends. DMARC awaits a reporting mailbox and mail-provider review. |
| **1: Conversion and clarity** | Homepage priorities, five flagship workflow links, processing disclosures, separate study-material section, ad-gap cleanup, and responsive layout are deployed. All five flagship outputs passed synthetic live browser checks, including mobile-width compression and JPG conversion. | Review representative user files and failure/retry paths on physical desktop and mobile devices. Add task-specific screenshots where they materially help users; the current pages mainly provide text and sample links. |
| **2: Organic discovery** | Ten priority pages have live content improvements. The practice pack includes a real Word sample, the admit-card and university-upload guides have live diagrams, and `/changelog` is reachable. Routes and sitemap passed the public crawl. | Publish and evaluate further original guides and short real demonstrations on the roadmap cadence. Recheck search-engine indexing from the account; local crawlability does not establish indexing. |
| **3: Distribution and retention** | Milestones, dashboard definitions, outreach guidance, and the PWA prompt after two export initiations are deployed. Fabricated local usage totals and random growth have been removed. | Establish the private weekly log, configure and verify production funnel reporting, run permission-based outreach, and collect non-team starts, usable downloads, and repeat-use evidence. M1 through M4 are targets, not completed outcomes. |

## Measurement definitions

- `file_selected` records a chosen file, while `tool_start` records actual processing in instrumented flagship tools.
- `tool_complete` records output creation. `tool_download` records export initiation after confirmation. It does not prove that the browser saved a file or that the file was usable.
- Legacy `tool_interaction` and `file_download` are button-click events and must not be substituted for the flagship start-to-download funnel.
- GA4 events require consent. Cloudflare Web Analytics and edge requests have different collection scopes; report them separately.
- Use `unknown` when an account metric or real-user result has not been checked. Do not convert missing evidence to zero or to complete.

## Remaining operational acceptance

1. After each later release, confirm Worker/Pages hash parity and rerun the public crawl and exported-file samples. The production workflow checks the release hash and key routes automatically.
2. In the connected GA4 property, confirm that consented flagship start, complete, and download events arrived, configure the intended key events, and exclude owner/test traffic from growth reports. Browser-side events alone do not establish property reporting.
3. Have the owner run authenticated sandbox checkout, entitled download, refund, and dispute acceptance. Inspect current GSC/Bing indexing and Cloudflare security trends from their account dashboards.
4. Start the private weekly log and permission-based outreach. Judge retention and acquisition milestones from observed non-team traffic and usable outputs; leave unknown metrics unknown.
