# Design language

The visual and structural system for kuladeepmantri.com. This is the source of truth for how the site looks and how a new project page gets built. When you add a project, follow the checklist at the bottom instead of reinventing the layout.

The one-line idea: a handcrafted, mono-first "workbench" where every project is a visual story (3D + wireframe diagrams) told in one honest first-person voice. Never neon, never cliche, never a template.

## Foundations

### Layout
- Reading column: ~740px, centered. Comfortable prose measure.
- Visuals break out full-bleed into wide bands (900–1200px) using the `ml-[calc(-50vw+50%)] w-screen` pattern. Extract this into a reusable `<Band>` component in `components/ui/`.
- The rhythm is: narrow prose, wide visual band, narrow prose, wide band. The margins fill with visuals, not stretched text.
- No page should ever scroll horizontally. Wide content (tables, diagrams) scrolls inside its own container.

### Type
- Body default: IBM Plex Mono (`--font-mono`), the site's core aesthetic.
- Display and prose: Inter (`--font-inter`). Headings, section titles, and long reading text use Inter.
- Labels, eyebrows, ids, and figures: mono, uppercase, letter-spaced (`tracking-[0.2em]`, ~10–11px).

### Color
See [wiki/palette.md](wiki/palette.md). Warm paper background, ink text, one warm ember/rose site accent, a quiet per-project tint. Retire the blue `--accent`. All colors in OKLCH so light and dark stay balanced. Light mode is the default (dark is opt-in).

### Motion
- Reveal-on-scroll (fade + rise) and lenis smooth scroll, in shared `components/ui/` (`Reveal`, `SectionHeading`, `SmoothScroll`). `SectionHeading` renders a static section number (an earlier count-up was removed for reliability).
- Everything respects `prefers-reduced-motion`: no smooth scroll, no 3D auto-motion, static poster images instead.

### 3D
- React Three Fiber + drei. Each project page has a 3D hero and may have 3D insets in bands.
- Performance is non-negotiable (see the checklist). Poster image paints first; the scene lazy-loads on scroll; reduced-motion and slow devices keep the static render.

### Wireframe diagrams
- Hand-authored inline SVG, like kubereach's cluster diagram. Not screenshots, not canvas.
- Every diagram ships a desktop `viewBox` and a portrait `viewBox` for mobile.
- Mono labels, dot-grid background, the project's tint for highlights.

## Page anatomy (a project [read] page)
1. `[← back]` link (not "back to log").
2. Eyebrow: project name + quiet `KM-YYYY-NNNN` id + status note.
3. Hero: headline in Inter + one-line sub, with the 3D hero (poster-first).
4. If it has a live subdomain: a clear "open live site" callout near the top.
5. Narrative sections in the unified voice, each opening with a `SectionHeading`.
6. Full-bleed bands for diagrams, 3D insets, comparisons, interactive widgets.
7. Honest status/limits section — what works, what doesn't, what's next or why it stopped.
8. Footer `[← back]` + `[src]` / `[live]` as earned.

## Content model
- Every project's copy and data live in `app/apps/<slug>/content.ts`. One source per project. No duplicate article files.
- The signal record in `app/signals.ts` stays the single source for metadata (id, slug, name, dates, status, repos, link).

## Checklist: adding a new project
When a new project goes on the site:
1. Write its blueprint in `docs/blueprints/<slug>.md` (copy an existing one). Nail the honest facts, status, tint, depth, and links first.
2. Add the signal record to `app/signals.ts`.
3. Create `app/apps/<slug>/content.ts` with the copy (first-person, run through `humanizer`) and diagram/section data.
4. Build the page from the anatomy above, reusing the shared `ui/` components (`Band`, `Reveal`, `SectionHeading`, `SmoothScroll`).
5. Pick a quiet per-project tint in the warm family; add it as `--signal-color`.
6. 3D: export a compressed glTF + a hero poster PNG from Blender. Lazy-load with `next/dynamic({ ssr: false })` + IntersectionObserver. Add the reduced-motion static fallback.
7. Wireframe diagrams: desktop + portrait SVG.
8. Set depth by substance: flagship gets a full narrative, a small project gets a short honest page.
9. Verify: `npm run lint` and `npm run build` pass; page renders under static export; no horizontal scroll on mobile; poster paints fast.
