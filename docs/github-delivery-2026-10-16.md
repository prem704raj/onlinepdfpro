# GitHub delivery validation — 2026-10-16

The original workspace had no Git metadata and its source predates current main. The refactor was reapplied to a fresh checkout of prem704raj/onlinepdfpro at 71f0fc503d7f9f96f5484d0fa041766bc2fb85a6, preserving the newer PDF editor font/background fixes, guides, product pages, and network-first CSS caching. No history was rewritten.

## Delivered behavior

- All 16 Sign Out controls in generated pages start hidden both semantically and visually; the shared listener requires an active verified user.
- All 96 HTML documents have one canonical. Google verification content is unchanged.
- Support navigation and sitemap use /help, with support aliases redirecting directly there. There are 107 explicit 301 routes for known pages and legacy aliases.
- Service Worker precaches and navigation cache keys use clean routes. Actual Chromium offline navigation was verified, including legacy URLs and previously visited tools. Existing cache activation, reload, asset lifetime, and network-first CSS improvements are preserved.
- Banner words have normal spelling and CSS spacing. Explore Tools and Try the Examples remain separate CTAs with a 16px gap and whitespace that survives minification. Hamburger icons retain aria-hidden wrappers through state changes. Every directory card has an h3.
- Processing/results UI on 27 tool pages carries snippet exclusions.
- Compression metadata specifies up to 100 MB per file, no signup. The helper explains approximation while preserving the newer structural-compression and explicit rasterization disclosures.
- Tool counts use 46 Free Tools.

## Preservation and validation

All 483 executable HTML/template script blocks from current main remain byte-identical. No PDF processing module, WebAssembly/vendor bundle, store implementation, service/Worker backend, dependency lockfile, or deployment workflow was edited. Root publication files were regenerated from the integrated source; 230 build outputs were synchronized.

Validation completed across the full suite in sequential runs: build, site checks, 11 audit checks, Worker contracts, isolated analytics, general regressions, PDF editor behavior and fidelity, PDF output preservation, AI document fixtures, mobile layouts and interactions, product details, every registered tool workflow, and all guide workflows.

Browser test servers now resolve clean URLs to physical HTML files rather than attempting directory reads. The mobile signed-in fixture supplies a complete synthetic verified session. The analytics fixture blocks production Service Worker registration. These fixture changes preserve the strengthened authentication and routing behavior in tests.

The initial inventory and local verification report are retained as historical records of the first workspace pass. This document describes the integrated GitHub delivery.
