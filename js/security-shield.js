// ============================================
// security-shield.js — kept as a no-op guard
// ============================================
// Previously this file blocked right-click, copy/paste, DevTools, injected a
// `debugger` timing trap that wiped the entire page with "Access Denied", and
// silently stripped `<`, `>`, `onload=` etc. from every input/textarea.
//
// That code has been REMOVED because it:
//   1. Destroyed the page for legitimate users who opened DevTools or relied
//      on copy/paste / selection (PDF tools, resume builder, invoice editor).
//   2. Silently corrupted real user data (e.g. "Qty > 10" lost the ">").
//   3. Provided zero real security — client-side code is always viewable.
//
// Real protection (X-Frame-Options DENY, frame-ancestors 'none', CSP) is
// handled by `_headers` and each page's CSP meta tag.
(function () {
    'use strict';
    // Intentionally empty. Remove this file's <script> tags when convenient.
})();
