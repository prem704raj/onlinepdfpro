# OnlinePDFPro Product Design Specification

## Overview
A minimal, aesthetic, conversion-first redesign emphasizing privacy (100% client-side processing), fast performance, and robust accessibility.

## 1. Hero Specs (Primary Conversion Driver)

**Typography Rules**
- **H1 Headline**: `clamp(36px, 5vw, 64px)`, leading `1.2`, weight `bold`. Max 2 lines.
- **Subhead**: `16px` to `18px`, max 12–16 words.

**Responsive Visual Variants** *(See `mockups/` folder for visual references)*
1. **Centered Hero**: Best for focused, direct messaging. H1 centered, subhead centered underneath, primary CTA centered. Trust strip directly below.
2. **Left-aligned Product + Copy**: H1 and CTAs left-aligned. On the right, a minimal illustration or UI card depicting document conversion.
3. **Split Image/Text**: A hard 50/50 split viewport. High visual impact layout where the left holds the messaging/conversion block and the right is an aesthetic graphic.

**Copy Snippets & Conversion Rationale**
- **Headline**: "The Bespoke Way to Handle Your Documents." *(Clean, premium, scan-friendly)*
- **Subhead Option A**: "Professional PDF tools that run in your browser — no uploads, no tracking." *(Highlights the core privacy benefit immediately)*
- **Primary CTA Options**:
  1. "Get Started — It's Free" *(Rationale: Low friction, highlights free tier)*
  2. "Compress a PDF — No Uploads" *(Rationale: Action-oriented, highlights privacy value)*
  3. "Open Tools — Try Now" *(Rationale: Directs users instantly to core functionality)*

**Accessibility Notes**
- The primary CTA must use `:focus-visible` to present a 2px offset focus ring using `--color-primary`.

---

## 2. Tools Grid & Product Cards

**Grid System (Responsive snippet in `tokens.css`)**
- **Desktop (≥1024px)**: `repeat(auto-fit, minmax(280px, 1fr))` (Typically 3–4 columns format)
- **Tablet (≥640px)**: `repeat(2, 1fr)` (2 columns)
- **Phone (<640px)**: `1fr` (1 column list)

**Card Anatomy & Affordances**
- **Icon Slot**: 32x32px top-left SVG icon.
- **Title**: Uses `<h3 class="text-h3">`
- **Description**: 1-line to 3-line max summary. Light grey text (`--neutral-500`).
- **Affordance**: On `:hover` and `:focus-within`, border turns to `--color-primary`, elevates 2px on the Y-axis with a deeper `--shadow-md`.
- **Microcopy Example**:
  - Title: "Compress PDF"
  - Summary: "Radically reduce file sizes without sacrificing quality."

---

## 3. Conversion Module & Trust Strip

**Composition**
Nested neatly beneath the Hero CTAs, combining a trust statement and visual badges.
- **Trust Statement**: "Trusted by professionals worldwide."
- **Badges**: 
  - 🛡️ "100% client-side"
  - ⚡ "Always free — no signups"

**CTA A/B Tests & Experiments**
1. **Hypothesis 1 (Copy)**: "Get Started" vs "Compress a PDF"
   - *Expected Impact*: Action-oriented button drives +10% higher CTR.
2. **Hypothesis 2 (Trust)**: Presenting Badges vs Hiding Badges
   - *Expected Impact*: Badges will lower bounce rates by validating privacy concerns.
3. **Hypothesis 3 (Color)**: Blue (`--color-primary`) vs Green (`--color-accent`)
   - *Expected Impact*: Green provides a stronger "GO" psychological cue, potentially yielding higher conversions on mobile.

---

## 4. Header & Footer Simplification

**Header Constraints**
- **Left**: Minimal Logo (SVG)
- **Center**: Just 2 top-level links ("All Tools", "Privacy")
- **Right**: Single Primary CTA ("Compress PDF" in button format)
- **Mobile (≤1024px)**: Menu collapses into a Hamburger button. Keep the primary CTA visible next to the hamburger if viewport space allows.

**Footer Structure**
- Stripped back to 3 link groups (Platform, Legal, Help).
- Utilize a micro-FAQ deep-link: "How client-side works".
- Colors kept extremely low contrast relative to background (`--neutral-500`).

---

## 5. Mobile-first Responsive Pass

- **Hero Strategy**: H1 drops to `36px`. Primary and Secondary CTAs stack vertically, stretching to 100% width. This strictly keeps the primary conversion path above the screen fold on average phones (e.g., iPhone 13/14/15 size).
- **Images**: Any decorative hero images utilize `loading="lazy"` and `decoding="async"`. If they push the CTAs below the fold, they should be scaling down significantly or hiding dynamically.

---

## 6. Minimal Design System / Style Tokens
Delivered via `tokens.css`.
- **Colors**: 6 strict tokens (`--color-primary`, `--color-accent`, and limited `--neutral-100`...`900`).
- **Typography**: Fluid `clamp()` equations for headings. Hard `16px` body string.
- **Spacing Scale**: 4, 8, 16, 24, 32, 48, 64px.
- Includes Tailwind-styled ready-to-use CSS utilities (`.rounded-lg`, `.bg-primary`, `.shadow-md`).

---

## 7. Accessibility & Performance Checklist

**Accessibility**
- [ ] Ensure WCAG AA contrast for text (use neutral-600+ on white).
- [ ] Clear keyboard focus ring (`:focus-visible`) for CTAs and Cards.
- [ ] Provide `aria-label` for hamburger buttons and any icon-only links.
- [ ] Focus ordering relies on native DOM order (Left-to-Right, Top-to-Bottom).
- [ ] Disable transform affordances when `@media (prefers-reduced-motion: reduce)` is active.

**Performance**
- [ ] Preload hero LCP elements (Bold Fonts, any critical icons).
- [ ] Prefer 100% SVG usage for icons (No PNG/JPG).
- [ ] Inline critical CSS classes into `<head>`.
- [ ] Lazy load everything below the fold grid.

---

## 8. Implementation & Experiment Roadmap

**Two-Week Sprint Plan**

*Week 1: Implementation*
- **Day 1**: Map base CSS variables (`tokens.css`). Build Header & Footer.
- **Day 2**: Develop the responsive Grid and Tool Card structures.
- **Day 3**: Build Hero Components (Variant 1 initially), including Trust Strip.
- **Day 4**: Perform Mobile viewport optimization pass and A11y manual check.
- **Day 5**: Setup Analytics & Instrumentation tracking.

*Week 2: Testing & Optimization*
- **Day 6**: Launch. Measure Baseline.
- **Day 7-9**: Activate A/B Test 1 (CTA Copy: "Get Started" vs "Compress PDF").
- **Day 10-12**: Create Hero Variant 2 (Left-aligned) and Launch A/B Test 2.
- **Day 13-14**: Analyze findings, cement permanent winners.

**Measurement / Analytics Events**
- `hero_cta_click` (label: variant_name)
- `tools_page_view`
- `tool_start_<toolname>`
- `install_prompt_shown`

---

## Developer Handoff Notes
**Files Handed Over**: 
- `tokens.css` (Base theme and grid utility specs)
- `spec.md`
- `/mockups` folder containing PNG hero variants

**Suggested Branches**:
- `feature/design-refresh-core`
- `experiment/hero-cta-copy`

**Staging Checklist**:
- ✅ Validate Desktop/Tablet/Phone CTAs stay above visual fold.
- ✅ Validate LCP is entirely text elements and SVGs.
- ✅ Confirm Tab-navigation fires focus outlines.
- ✅ Ensure instrumented events echo in network tab.
