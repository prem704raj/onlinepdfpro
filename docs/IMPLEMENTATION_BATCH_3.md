# Static notes product page — implementation batch 3

Prepared on 1 October 2026. The reviewed branch adds `/products/dbms-notes` with initial HTML containing the existing product's title, ₹9 price, 51-page count, coverage, five preview images and AI-assisted draft disclosure. Product/Offer JSON-LD uses the same checked-in registry as browser checkout; no author credentials, reviews, ratings or syllabus guarantees have been invented.

The catalog and cart product links point to this route, and the sitemap includes it. The old `/viewstudymaterials?product=dbms-notes` entry remains usable through the shared detail template, but its generic shell is `noindex`. The existing preview dialog and checkout continue to use the original product ID and protected API.

Local build, initial-HTML/schema/sitemap checks, existing application browser checks (preview, cart and signed-out recovery), mobile/desktop layout checks and performance budgets passed. This verifies the landing experience, not successful payment fulfilment or the academic accuracy of the paid PDF.

Before expanding paid notes, have a knowledgeable human review the material against the intended course, correct the PDF and its previews, and collect demand evidence from that audience. Secure checkout and test-mode fulfilment still need the production deployment prerequisites in batch 1.
