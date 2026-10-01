# Batch 6 — purchase clarity and genuine reviews

Date: 2026-10-01. Implemented on `codex/production-foundation`, draft PR #5.

The DBMS purchase page now puts the title, 51-page count, ₹9 one-time price and AI-assisted draft disclosure ahead of purchase. Desktop uses a two-column layout with a sticky purchase summary; phones show the summary before the preview, with no fixed checkout bar. Five sample pages, topic coverage, course-fit limitations, delivery/library instructions, support and the actual refund policy help a reader decide before paying.

The existing checkout remains in place. While it opens, the Buy button is disabled and announces its busy state; an unexpected opening error leaves an inline message and a usable retry. This prevents duplicate taps during the pending opening call. It does not prove payment-provider acceptance or fulfilment.

## Review behavior

- Expert review and reader ratings have separate labels. The current expert status is pending and there are no published reader reviews. No credentials, testimonials, star averages or rating schema are invented.
- Share a review collects a public display name, 1–5 rating, review text and publication consent. It prepares an email to support, with an explicit statement that nothing has been sent or published. A user can open their email app or copy the text and send it themselves. This is an email moderation workflow, not a database submission service.
- Editing the form invalidates the prepared draft. The form does not send requests, store the draft in browser storage, or put private receipts in the public page. Closing restores focus to the opening button.
- Public reviews come from `content/product-reviews.json`. Build-time validation requires attribution, dates, rating bounds, consent, unique review IDs and explicit purchase-verification status. Public text is escaped. A rating average appears only when approved reviews exist.
- The owner must monitor the support mailbox, verify claimed purchases privately, obtain consent and publish approved entries manually. Negative feedback follows the same moderation rules as positive feedback. Do not label a purchase verified without checking it.

See `DBMS_REVIEW_BRIEF.md` for the human review and publication process. Building this section has not reviewed the academic correctness of the notes.

## Validation

`npm run test:product` is included in `npm test`. Isolated Chromium checks 1280×900, 390×844, 320×740 and 844×390: purchase ordering, current price/disclosure, FAQ expansion, required review fields and consent, negative ratings, escaped publication text, email-draft contents, no outbound review submission, copy, draft invalidation, close/focus restoration, pending checkout taps, unexpected checkout failures and retry. It also checks legacy product access and unavailable-product behavior. Provider requests are blocked and checkout calls are synthetic; no payment or real email is sent.

The existing suite separately checks all 84 content pages at three responsive widths, cart and preview interactions, loaded-editor mobile controls, exported PDF content, analytics privacy and Worker gates. Product CSS and review JavaScript have explicit static byte budgets. Emulation does not replace physical iPhone/Safari and Android acceptance testing.

## Release status

These changes are for the Cloudflare branch preview. Production remains unreleased pending the existing deployment credentials and Worker runtime secrets, real conversion/AI journeys, test-mode purchase/delivery/recovery/refund checks and operational acceptance. The notes still need an attributed human subject review before paid content expansion.
