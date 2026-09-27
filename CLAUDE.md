# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **A full redesign is approved and pending: read `docs/redesign/PLAN.md` first.** It replaces the immersive site described below (the living-sentence split layout, Mona Sans, Paper and Graphite themes, live GitHub and X data). Until it is implemented, the rest of this file describes the current code; once implemented, rewrite this file per section 11 of the plan.

## What this is

Personal portfolio / "public lab" for Kuladeep Mantri, built as a Next.js 15 (App Router, React 19) static export deployed to GitHub Pages. Styled with Tailwind v4, animated with Motion, 3D via react-three-fiber/drei. The visual concept is a light-mode, mono-first "signal log".

## Design & content system

The visual + content system is documented in `docs/` (the spec and decision record from the rebuild):
- `docs/plan.md` — the master build plan (read first).
- `docs/design-language.md` — the visual/structural system and the **checklist for adding a new project page**. Adding a project follows this doc.
- `docs/blueprints/<slug>.md` — one per project (honest facts, status, tint, depth, page shape, 3D/diagram spec, links).
- `docs/wiki/` — decisions, palette, voice guide, the About story, and references.

When adding or reworking a project or its page, follow `docs/design-language.md` and write/update its blueprint first.

## Commands

```bash
npm run dev      # predev runs fetch-github.ts, then next dev on :3000
npm run build    # prebuild runs fetch-github.ts, then static export to out/
npm run lint     # eslint (next + prettier config)
```

There is no test suite. "Quality checks" = `npm run lint` and `npm run build`.

`output: 'export'` (next.config.mjs) means everything must be statically renderable — no runtime server, no SSR, no API routes that run on request. Route handlers under `app/` are force-static and emitted as files at build time.

## Architecture

### Single source of truth: `app/signals.ts`

Every piece of portfolio content lives in the `SIGNALS: Signal[]` array. A "Signal" is a dated, versioned record (project, finding, thought, or ship) with a stable permalink id (`KM-YYYY-NNNN`), a url `slug`, a lifecycle `state`, and optional GitHub `repos`. To add or change content, edit this array — not the components.

Consumers fan out from this one file:
- `app/page.tsx` → home: `Masthead` + `LabTimeline` (the "the work, over time" Gantt figure) + the project figure-gallery (`SignalLog` → `SignalEntry`, each project drawn as a small SVG schematic from `components/home/project-schematics.tsx`), sorted by `sortedByStart`
- `app/apps/[slug]/page.tsx` → per-signal detail; `generateStaticParams` enumerates every slug (see "Per-signal immersive detail override" below)
- `app/sitemap.ts`, `app/robots.ts` → SEO
- `app/feed.xml/route.ts` → RSS, `app/api/signals.json/route.ts` → JSON Feed

Standalone routes outside the signal fan-out: `app/now/` (the /now page, labelled "notes" in the nav) and `app/about/` (the "whoami" page; its inline hover-cards are in `components/gist/inline-cards.tsx`). The search / command palette, the old `/apps` index, `/verify`, and `app/articles/` were all removed in the redesign.

Helpers to use instead of re-implementing: `findSignalById`, `findSignalBySlug`, `sortedByStart`.

### Per-signal immersive detail override

`app/apps/[slug]/page.tsx` keeps an `IMMERSIVE` registry mapping each slug to a hand-built immersive scroll experience; every slug currently has one (`KubereachExperience`, `RuneExperience`, `AurisExperience`, `ShipcrewExperience`, `KintsugiExperience`, `DeidExperience`, `UntilExperience`), so the generic `AppDetail` is now only a fallback. Each experience lives under `components/apps/<slug>/` with its copy in `app/apps/<slug>/content.ts` and its own hand-authored SVG diagrams. The six non-kubereach pages share `components/apps/project-shell.tsx` (the nav + smooth-scroll scaffold); kubereach has its own inline shell. Smooth scroll is `components/ui/smooth-scroll.tsx`, the only consumer of `lenis`. To add a project, add its slug to `IMMERSIVE` and keep its components under `components/apps/<slug>/` so the animation stays out of the mono-first rest of the site.

### Backward-compat aliases are load-bearing — do not "clean up"

The Signal type was migrated from an older shape and the old surface is intentionally kept so unmigrated consumers keep compiling. Leave these unless you migrate all callers in the same pass:
- `state` (new lifecycle) coexists with legacy `status` (drives `STATUS_DOT` / `STATUS_LABEL`).
- Field names are `name`/`tagline`/`description` (the plan called for `title`/`summary`/`body`; rename deferred).
- `PROJECTS = SIGNALS`, `type AppProject = Signal`, `sortedByRecency = sortedByStart` are aliases.

Signal `id`s are assigned in chronological order of `dateFirst` (note: ids are not strictly sequential with the array order — see the Kintsugi/Rune 0004/0005 comment).

### Build-time GitHub data (the only "backend")

`scripts/fetch-github.ts` runs as `predev`/`prebuild`. It collects every unique repo referenced by `SIGNALS`, makes one batched GraphQL call (aliased per repo) for commit counts / open PRs, and writes `lib/generated/github.ts`. Components read it synchronously via `lib/github.ts` (`getRepoData`, `activitySummary`).

Key invariants:
- `lib/generated/github.ts` is **gitignored and auto-generated** — never edit or commit it.
- The script **never throws**: no `GITHUB_TOKEN`/`GH_TOKEN` → stub data with `error: true`; fetch failure with a prior generated file → keeps the stale file; worst case → stub. The build always succeeds.
- A daily `schedule` cron in `.github/workflows/nextjs.yml` rebuilds the site so these stats refresh even with no code changes. CI passes `GITHUB_TOKEN` (read-only) for live data.

### Client interaction shell

`components/layout-shell.tsx` (wraps everything in `app/layout.tsx`) owns the global client state: keyboard help (`?`) and arrow-key / vim-key focus nav (`hooks/use-arrow-nav.ts`). This is the boundary where `'use client'` interactivity lives; most page/content components stay server components.

### Paths & conventions

- Import alias `@/*` → repo root (e.g. `@/lib/github`, `@/app/signals`).
- Two fonts via `next/font`: Inter (`--font-inter`) and IBM Plex Mono (`--font-mono`); design leans mono.
- Site URL constant is `WEBSITE_URL` in `lib/constants.ts` (`https://kuladeepmantri.com`). Do not hardcode the domain; feeds/sitemap/metadata all read this.
- `metadataBase` is set but a global `canonical` is intentionally omitted in `app/layout.tsx` so sub-pages can self-canonicalize.

## Deployment

Push to `main` → `.github/workflows/nextjs.yml` builds the static export and deploys `out/` to GitHub Pages. Static export means images are unoptimized (`images.unoptimized`) and there is no incremental/runtime rendering.
