# UX audit and coherence

Goal from the owner: the whole site should feel like **one coherent product**, not
seven pages stapled together. Named pain points: the nav differed between project
pages, no easy return-to-top on long pages, rough mobile responsiveness, and
back-navigation that didn't feel fluent. A whole-site audit produced ~33 findings
across shell/nav, scroll, mobile, visual coherence, a11y, and states/transitions.

## Shipped (done and verified)

- **Kubereach migrated onto `ProjectShell`.** It had a hand-copied duplicate of
  the shared shell; now all seven project pages use one component. This was the #1
  "each page is its own thing" root cause. The migration also gave kubereach the
  standard footer with the `[src]` link it was missing (→ `getnullpkg/kubereach`).
- **Return-to-top on project pages.** The floating section-nav wordmark is now a
  `#top` anchor (lenis smooth-scrolls it), covering all seven pages in one edit.
- **Return-to-top on standalone pages.** A quiet global pill
  (`components/ui/scroll-top.tsx`), mounted in `layout-shell`, appears after
  ~480px of scroll on home/notes/whoami and hides on `/apps/*` (they have the
  wordmark). Respects reduced-motion.
- **Mobile home figures.** Added a `@media (hover: none)` fallback so the `.kmf-*`
  figures render fully drawn on touch (deid was rendering as a blank document on
  every phone).
- **Header touch targets.** Nav links and the theme toggle grew to a ~44px hit
  area (`py-2 -my-2`, toggle `h-9 w-9`) with no baseline shift.
- **Accessibility.** Skip-to-content link + `<main id="main">`; whoami is now an
  `<h1>`; the home section labels ("every project", "the work, over time") are now
  `<h2>`s.
- **404 page.** `app/not-found.tsx` in the mono/paper aesthetic (regenerates
  `404.html` for GitHub Pages) instead of Next's default.
- **Honesty polish.** The Rune 3D hint said "drag to rotate" but the camera
  auto-orbits with no drag → now "auto-orbiting". Timeline hint "click to open" →
  "tap to open" (touch-honest).

## Deferred (need a human eye or are felt/visible changes)

Do these with review, not blind while shipping to a live site:

- **Diagram legibility on phones.** The auris (`SyscallStream`), kintsugi
  (`OnDeviceFlow`), and deid (`MaskVisual`) hero diagrams use wide viewBoxes that
  shrink their labels to ~4px on a 375px screen. Fix: add `block md:hidden`
  portrait variants (copy the `PtraceLoop` / `PtraceLoopPortrait` pattern already
  in `AurisDiagrams.tsx`). Real SVG work; verify visually.
- **Hoist lenis site-wide.** Smooth scroll only runs on project pages, so scroll
  physics change home→project. Correct fix is moving `SmoothScroll` into
  `layout-shell`, but it's a *felt* change to the two most-visited pages — confirm
  by feel first.
- **Route view-transitions.** The `@view-transition` CSS only fires on
  cross-document nav; this is an App-Router SPA, so it never fires. Enabling it
  needs `experimental.viewTransition` in `next.config.mjs` + a React
  experimental API. Touches build config under static export — verify it builds.
- **Typography + rhythm standardization.** Eyebrow sizes/tracking, hero header
  structure, section margins, and prose specs drift per page. Unifying them is
  correct but visibly reflows whoami and shifts spacing site-wide — show before/
  after.
- **Arrow-key focus nav.** `use-arrow-nav.ts` hijacks the plain arrow keys
  (preventDefault + move focus), so ArrowDown steals focus instead of scrolling —
  the "scrolling isn't fluent" complaint. Fix is to drop the arrows (keep vim
  `j/k/l/h`, `gg`, `G`), but it's a deliberate keyboard feature — confirm before
  removing.
- **Dark `--text-muted` contrast.** ~3.5:1 in dark mode (fails AA) for pervasive
  small labels. Lighten slightly — a palette nudge, verify it still reads warm.
- **Doubled footer divider** on project pages, **kintsugi video poster**, and
  **mobile theme-color sync** — small, low-priority.
