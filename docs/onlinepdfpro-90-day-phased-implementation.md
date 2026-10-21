# OnlinePDFPro 90 Day Roadmap Implementation Status

Updated 21 October 2026. Source: [90 day launch and security roadmap](onlinepdfpro-90-day-roadmap.md).

This tracker records code delivery separately from production deployment and real-user outcomes. A local build or automated test does not verify a live provider, payment, download, search index, or acquisition target. The last production release observed during the 21 October review was `20ba1feee2322fb81b351e89475616a34bc753a0`; `/changelog` returned 404. Recheck production after any deployment before changing the live status below.

| Phase | Code and content status | Remaining acceptance |
| --- | --- | --- |
| **0: Measurement and security** | Defensive PDF and Worker protections, consented GA4 code, account follow-up records, and edge configuration are documented in the source roadmap. Flagship funnel events and crawler audit are present in the current checkout. | Merge and deploy the funnel release; verify Worker and Pages hashes, consented export events, GA4 key-event configuration, a real owner sign-in, and sandbox purchase, entitled download, refund, and dispute behavior. Review refreshed GSC/Bing coverage and Cloudflare security trends. DMARC awaits a reporting mailbox and mail-provider review. |
| **1: Conversion and clarity** | Homepage priorities, five flagship workflow links, processing disclosures, separate study-material section, ad-gap cleanup, and responsive layout build locally. | Confirm the new release live. Review all five flagship journeys with real files on desktop and mobile, including downloaded outputs, errors, retry, and privacy boundaries. Add task-specific screenshots where they materially help users; the current pages mainly provide text and sample links. |
| **2: Organic discovery** | Ten priority pages have local content improvements. The original practice pack now includes an accepted Word sample. The admit-card and university-upload guides include diagrams; the guide workflow test checks exported samples. Changelog and privacy-safe feedback copy build locally. | Confirm routes, examples, redirects, and sitemap after deployment. Publish and evaluate further original guides and short real demonstrations on the roadmap cadence. Recheck search-engine indexing from the account; local crawlability does not establish indexing. |
| **3: Distribution and retention** | Milestones, dashboard definitions, and outreach guidance are documented. The local PWA prompt now waits for two export initiations after generated outputs. Fabricated local usage totals and random growth have been removed. | Establish the private weekly log, configure and verify production funnel reporting, run permission-based outreach, and collect non-team starts, usable downloads, and repeat-use evidence. M1 through M4 are targets, not completed outcomes. |

## Measurement definitions

- `file_selected` records a chosen file, while `tool_start` records actual processing in instrumented flagship tools.
- `tool_complete` records output creation. `tool_download` records export initiation after confirmation. It does not prove that the browser saved a file or that the file was usable.
- Legacy `tool_interaction` and `file_download` are button-click events and must not be substituted for the flagship start-to-download funnel.
- GA4 events require consent. Cloudflare Web Analytics and edge requests have different collection scopes; report them separately.
- Use `unknown` when an account metric or real-user result has not been checked. Do not convert missing evidence to zero or to complete.

## Next release gate

1. Review the branch diff and run `npm run build`, `npm test`, and `npm run perf:budget` after the final edit.
2. Merge and deploy through the ordered Worker then Pages workflow. Confirm matching live release hashes and inspect the 10 priority routes and new `/changelog` route.
3. With explicit analytics consent, export each flagship output and inspect GA4 DebugView or Realtime for sanitized start, complete, and download events. Exclude owner and test traffic from growth reports.
4. Have the owner run authenticated sandbox checkout and refund acceptance, then review actual user file quality and search coverage as their reports update.
