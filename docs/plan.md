# Portfolio rebuild — build plan

This is the build plan for a full redesign of kuladeepmantri.com, a Next.js 15 static-export personal portfolio. It's a website design and content project: layout, 3D/visuals, copy, and information architecture. The projects shown on the site are the subject matter; their existing writeups are the content source. Nothing here is a security task.

Read this first, then work from the linked docs.

> **Status: executed (2026-07-03).** This plan shipped, with deliberate divergences from the task list below. What actually shipped: the search / command palette and the `/apps` index and `/verify` routes were removed (not kept or fixed); the home project list became a figure-gallery of per-project SVG schematics rather than a dated list; all seven projects got immersive pages; and light mode is the default (dark is opt-in). Treat this file as the historical build record; `CLAUDE.md` and `design-language.md` describe the current system.

## Reading order
1. This file — scope, decisions, task list.
2. `design-language.md` — the visual/structural system and the "how to add a project page" checklist. This governs every page.
3. `wiki/decisions.md` — the choices and why, so you don't relitigate them.
4. `wiki/voice-guide.md` — the one voice for all copy.
5. `wiki/palette.md` — color.
6. `wiki/about-story.md` — the About page (has a gold-standard reference draft).
7. `blueprints/<project>.md` — one per project, with honest facts and page shape.
8. `wiki/references.md` — reusable prior art and source paths.

## The goal
Make the whole site feel like one intentional, handcrafted, visual-first product. Today it reads patched together: one project (kubereach) has a rich immersive page, the rest are bare text; the voice changes per project; desktop wastes space; the nav has confusing and dead surfaces; the command palette can't be clicked; the accent is a generic blue. Fix all of it, and give every project the kubereach-level treatment: a 3D-forward, diagram-heavy page in one honest first-person voice. Never neon, never cliche, never a template.

The kubereach page (`components/apps/kubereach/`) is the reference. Everything rises to match it.

## Locked decisions
See `wiki/decisions.md` for the full table. In short: 3D-forward but engineered fast; rich in-site pages with a "live" callout for projects that have a subdomain; ~740px prose with full-bleed visual bands; softened jargon (work/projects/notes); keep KM-YYYY-NNNN ids but quiet; /now becomes a workbench; honest statuses that lead with strengths; depth scaled to substance; warm ember/rose accent with per-project tints; a genuine narrative About page; keep untilithappens; contact email `kuladeepbmantri@gmail.com`; full name "Kuladeep Bhushan Mantri" in the home hero.

## Task list

### 1. Shared foundations (do first)
- Extract a reusable `<Band>` full-bleed wrapper into `components/ui/` from kubereach's `ml-[calc(-50vw+50%)] w-screen` pattern.
- Promote kubereach's `Reveal`, `SectionHeading`, and `SmoothScroll` (lenis) into shared `components/ui/`.
- Replace the hard-coded `max-w-[680px]` across ~9 files with a shared layout: ~740px reading column, bands for visuals.
- In `app/globals.css`: retire the blue `--accent`, make the site accent the warm ember/rose (`--kr-rose` family), and re-point every `--accent` use (selection, focus, signal-entry hover, cmdk selection, diagram tint). Add the per-project `--signal-color` convention. See `wiki/palette.md`.
- Standardize display/prose on Inter, keep mono for body/labels.

### 2. Shell, header, nav
- Remove the confusing "KM / index" links from `app/header.tsx`. New header: quiet wordmark to home, plus obvious search and theme controls.
- Softened nav: work (projects), notes (workbench), about, github. Remove `/verify`. Drop `/feed.xml` from the nav.
- Fix all back links from `[← log]` / `[← back to log]` to a clear `[← back]` / `[← all projects]`.
- Fix the command palette so mouse clicks work, not just keyboard (`components/command-palette.tsx` — items only wire `onSelect`; add click handling).

### 3. Home
- Identity block: full name "Kuladeep Bhushan Mantri" + one honest first-person line (from the About voice). Move nav out to the header; drop the bracket link cluster.
- Work list: keep the dated-list feel, soften the header wording, render the KM id small and quiet, and fix the crammed title row (name / status / note should be a clean hierarchy, not one jammed flex row).
- Per-entry buttons: `[read]` always; `[live]` only when a real distinct live URL exists; `[src]` only when a repo exists. Fix the kubereach dupe where live == repo. Calmer, obviously clickable.

### 4. Routes
- Remove `/verify`.
- Rework `/now` into the workbench: first-person NOW / NEXT / SHIPPED / SHELVED, updated manually, in voice.
- Add `/about` — the narrative page. Use `wiki/about-story.md`; the reference draft there is the quality bar. Run it through `humanizer`.
- Keep `/apps` (softened wording) and `/apps/[slug]`.

### 5. Project pages (the core work)
- Replace the bare generic `AppDetail` with the immersive template from `design-language.md` (page anatomy section). Every project gets: 3D hero (poster-first, lazy, Draco), narrative prose, wireframe diagrams, full-bleed bands, per-project tint, `[← back]`, and a "live" callout when it has a subdomain.
- Depth scales by project (see each blueprint). Don't pad thin projects.
- Move each project's copy/data into `app/apps/<slug>/content.ts` as the single source. Delete the dead `app/articles/kubereach.ts`.
- Build all seven from their blueprints: kubereach, rune, auris, shipcrew, kintsugi, deid, untilithappens.

### 6. Content pass
- Rewrite every project's copy into the one voice (`wiki/voice-guide.md`): first person, plain, honest, deep but not showing off. Lead with strengths, state true status.
- Notable: kubereach moves from "active/building" to "shelved" (lead with the two proven bets). shipcrew credits Abhishek Manyam explicitly. deid is honest about being a 2023 unmaintained prototype.
- Run every shipped prose block through `humanizer`.
- Update the contact email everywhere to `kuladeepbmantri@gmail.com`.

### 7. 3D performance (the balance)
- React Three Fiber + drei, `useGLTF` with Draco/meshopt.
- `next/dynamic({ ssr: false })` + IntersectionObserver so a scene mounts only when scrolled near.
- A sharp Blender-render poster paints first; reduced-motion and slow devices keep the static image.
- Per project: export a compressed glTF + a hero poster PNG. rune's existing R3F static-export setup is the template.

### 8. Mobile + polish
- Responsive pass on every screen. Full-bleed bands must not cause horizontal scroll. 3D on mobile: poster + tap-to-load. Every diagram ships a portrait SVG variant.

## Verification
- `npm run lint` and `npm run build` (static export) both pass.
- Every route renders under `output: 'export'`; 3D uses `ssr:false` dynamic imports.
- Manual visual pass on each screen (home, each project, workbench, about, index) at desktop and mobile. No horizontal scroll. Nav is obvious. Back button reads clearly.
- Command palette works by mouse and keyboard.
- First-load check on a 3D page: poster paints fast, scene lazy-loads, reduced-motion shows the static image.
- Grep for leftovers: blue `--accent`, `[← log]`, the `kuladeepmantri.com` wordmark, the old email, and any `articles/kubereach.ts` reference. All gone.
- One consistent voice across all projects; every shipped block passed through `humanizer`.

## Open items (non-blocking, decide during build)
- Per-project tints for shipcrew, deid, untilithappens.
- auris id-vs-git-date: the id says 2024, the first commit is Dec 2025. Reconcile.
