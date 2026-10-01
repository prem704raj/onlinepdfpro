# DBMS notes: review and publication brief

The current 51-page DBMS PDF is an AI-assisted draft. The website review section is a place to publish evidence; it is not evidence that the PDF has already been reviewed.

## Subject review

Ask a DBMS lecturer, teaching assistant, or practitioner with relevant teaching/review experience to inspect the actual downloadable PDF, not just the five preview pages. Provide the exact PDF version, intended student level, topic list, and any syllabus it claims to cover. Record the reviewer’s identity, qualifications, consent to attribution, review date, version and scope privately before publication.

Check definitions and diagrams, relational keys and constraints, ER mappings, functional dependencies and normalization, runnable SQL examples and dialect assumptions, transactions/ACID, isolation and concurrency, recovery, indexes and performance claims. Verify worked examples and answers against reliable course references; identify missing prerequisites, ambiguous explanations and unsupported exam claims. Check originality, citations and rights to included material.

Return page-specific corrections with severity and evidence. Correct the PDF, regenerate affected previews, and have the reviewer recheck substantive corrections. Resolve serious factual or licensing issues before promoting the product. Review does not establish coverage of every university syllabus.

After the human has approved publication, change `expertReview.status` in `content/product-reviews.json` from `pending` to `published` and supply these real fields:

| Field | Published content |
| --- | --- |
| `name` | Reviewer’s agreed public name |
| `qualifications` | Relevant, verifiable DBMS experience |
| `reviewedOn` | Actual date in YYYY-MM-DD format |
| `scope` | Exact PDF version, topics/pages checked, and exclusions |
| `summary` | Agreed findings, corrected issues and remaining limitations |

Keep the draft disclosure until the product’s status actually changes. Do not imply institutional endorsement, comprehensive verification or guaranteed exam results from a limited review.

## Reader feedback

Monitor `support@onlinepdfpro.com`. The page only prepares an email draft; the reader must send it. If a reader uses Copy review text, they can paste it into their own email. No ratings appear until genuine feedback is approved and published.

Before publication, confirm consent and the requested public display name. Remove private information with the writer’s agreement, and check for spam, unrelated material and abuse. Apply the same rules regardless of rating. Preserve relevant criticism; ask for correction details when useful. Purchase verification requires checking an actual paid entitlement privately. Sample-reader feedback can be published with `verifiedPurchase: false`.

Add each approved review to the product’s `reviews` array with a unique string `id`, `displayName`, integer `rating` from 1 to 5, original agreed `text`, real `publishedOn` date, boolean `verifiedPurchase`, and `publicationConsent: true`. Never put email addresses, payment references, receipts or moderation correspondence in this Git file. Keep the supporting evidence privately with restricted access. Honour removal requests.

Run `npm run build`, `npm run test:product` and `npm run perf:budget`, inspect the page, then publish through the normal reviewed deployment. The build calculates the displayed count and average from these entries. Do not seed the production file with sample reviews.
