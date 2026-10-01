# Batch 5 — mobile usability and regression coverage

Date: 2026-10-01. Implemented on `codex/production-foundation`, draft PR #5.

## Problems corrected

- Shared mobile rules fixed every `header` element to the top, including the PDF editor's own heading. Restrict the navigation positioning and theme surface to `.header`.
- Blanket width rules moved the login theme button outside the screen. Apply full-page width only to the main and footer containers.
- Speech-to-text settings used grid tracks sized by their contents. Use shrinkable tracks and full-width inputs so long select options cannot push controls off a 320px phone.
- Tool descriptions were limited to three lines, hiding limitations. Display the full description on phones. Remove page-level overflow hiding from the mobile reset so real layout errors remain observable.
- Navigation now scrolls within the available viewport; Escape closes it and restores focus, with accurate button labels after every closing path.
- Cart and backdrop were below the fixed mobile header, which obscured the close button. Raise their layers, use dynamic viewport height, preserve a scrollable items area and safe-area padding, and remove the generic mobile rule that forced drawers and editor panels to automatic height.
- Closed carts are inert and excluded from assistive technology. Opening a cart moves focus inside and makes background content inert; Tab remains inside, Escape closes it, and closing restores the previous overflow, inert state and opening control's focus.
- Preview close and next/previous controls have 44px targets. Preview dialogs scroll inside the viewport and images use a dynamic viewport limit.
- Enlarge small editor controls on phones. Exempt PDF text hit regions from generic button sizing and the rendered PDF canvas from generic image resizing, preserving document geometry and zoom alignment.
- Add an explicit `Edit text` control to the selected-text toolbar, enabling editing with a single tap instead of requiring a double-click gesture. Keep the editor free of the automatic installation banner; manual installation remains in navigation.
- Give the blog landing page a proper primary heading.

## Validation

`npm run test:mobile` is included in `npm test`, so PR validation repeats these checks:

- Build and inspect all 84 content pages at 320, 390 and 768 CSS pixels (252 page/viewport combinations). Redirect aliases and Google's verification document are not content pages.
- Check actual visible element bounds, viewport metadata, primary headings and page overflow. Intentional local horizontal scroll regions, such as PDF canvases and toolbars, may scroll; hiding overflow does not excuse off-screen elements.
- Exercise touch navigation, a synthetic signed-in header, five-page preview controls, adding the public sample product to an isolated browser cart, cart focus/background isolation, and a loaded sample PDF editor at 320×740, 390×844, 768×1024 and 844×390.
- Check drawer height, control hit testing, editor page/settings panels, single-tap text editing and enabling export, and canvas/text-layer alignment after zoom.

All external provider requests are blocked in this mobile test. The sample document and account are synthetic; no customer files, real purchases or paid AI requests are involved. Optional evidence screenshots can be captured with `MOBILE_CAPTURE_DIR` set to a local directory. The full existing suite separately verifies exported PDF content, form/link retention, AI request boundaries, analytics privacy, canonical metadata and Worker gates.

These checks use isolated Chromium with touch and viewport emulation. They do not establish physical iPhone/Safari or Android memory limits, virtual-keyboard behavior, screen-reader conformance, or real payment/provider acceptance. Those remain release acceptance checks.

## Release status

This batch is reviewable in the Cloudflare branch preview; production remains unreleased. At the last check, repository Actions secrets were still empty. Production requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and the Worker needs `TURNSTILE_SECRET_KEY`, `CONVERSION_SIGNING_SECRET` and `MODAL_API_TOKEN`. Enter credentials through their secure settings, never through a chat message.

After those prerequisites, verify actual conversion and AI journeys, a test-mode purchase with delivery/recovery/refund behavior, production measurement, rollback, and the accuracy/licensing of the paid notes. Mobile layout improvements alone are not a full production-readiness certification.
