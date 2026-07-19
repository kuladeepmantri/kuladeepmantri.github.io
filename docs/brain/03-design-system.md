# Design system

The look is a light-mode-first, mono "signal log": quiet, precise, editorial.
Never neon, never a template, never marketing gloss. `docs/design-language.md`
holds the full spec and the per-project-page checklist; this is the working
summary plus the conventions to keep consistent.

## Palette (OKLCH, `app/globals.css`)

Warm paper tones, not sterile white. Deep warm ink for text. One warm ember/rose
accent holds the site together; each project page layers a quiet `--signal-color`
tint on top. Full light and dark token sets are defined under `:root` and
`[data-theme='dark']`. Signal states have semantic colors (active green, shipped
slate-blue, paused amber, archived dim).

Theme is set by an anti-flash inline script in `app/layout.tsx` reading
`localStorage('km-theme')`, defaulting to light. The header toggle flips it.

## Type

- **IBM Plex Mono** (weight 500 on light for readability) is the default; the
  site leans mono. Tabular + slashed-zero features are on so ids and dates align
  like a ledger.
- **Inter** for long-form prose and large headlines (`--font-inter`).
- Reading column is `max-w-reading` (740px). Full-bleed visuals break out via the
  `<Band>` `w-screen` wrapper.

## Conventions to keep consistent

These are the "one product" rules. The UX audit found the site drifting on
several of them; keep new work aligned and pull old surfaces toward these.

- **Eyebrow labels:** 11px, `tracking-[0.2em]`, uppercase. The top-of-page eyebrow
  is accent-colored (or the project `--signal-color`); secondary/inline labels are
  muted at the same size/tracking.
- **Section rhythm:** aim for a single top-of-section margin (~`mt-16`) rather than
  the current spread of 10/12/14/20.
- **Prose:** route long-form text through `components/ui/prose.tsx` so density and
  column width match everywhere.
- **Page container:** `mx-auto max-w-reading px-5 pb-24`.

> These consistency items are partly done and partly deferred — see
> [06-ux-audit.md](06-ux-audit.md) §"deferred" for what still needs a human eye
> before it ships (typography reflows are visible changes).

## Motion

- Home project figures (`.kmf-*` in globals.css) draw themselves on hover, gated
  behind `prefers-reduced-motion`. A `@media (hover: none)` block shows them fully
  drawn on touch (phones have no hover).
- Project pages use lenis smooth scroll (`components/ui/smooth-scroll.tsx`), which
  no-ops under reduced-motion.
- All decorative animation must honor `prefers-reduced-motion`. One known gap: the
  globe pin SMIL `<animate>` in `inline-cards.tsx` is not yet gated (deferred).

## Accessibility baseline

- Skip-to-content link is the first focusable element; `<main>` has `id="main"`.
- Every route should have one `<h1>` and logical `<h2>`s (home section labels and
  whoami were made real headings).
- Focus-visible uses an inverted block cursor. Contrast is tuned for AAA/AA on
  light; the dark `--text-muted` is a known borderline (deferred, see audit).
