# Architecture

## The single source of truth: `app/signals.ts`

Every piece of portfolio content is a **Signal**: a dated, versioned record with a
stable id (`KM-YYYY-NNNN`), a URL `slug`, a lifecycle `state`, and optional GitHub
`repos`. All content lives in the `SIGNALS: Signal[]` array. To add or change a
project, edit that array, not the components.

Everything fans out from this one file:
- `app/page.tsx` → the home page.
- `app/apps/[slug]/page.tsx` → per-project detail pages (`generateStaticParams`
  enumerates every slug).
- `app/sitemap.ts`, `app/robots.ts` → SEO.
- `app/feed.xml/route.ts` → RSS; `app/api/signals.json/route.ts` → JSON Feed.

Helpers to reuse instead of re-implementing: `findSignalById`,
`findSignalBySlug`, `sortedByStart` (chronological, newest `dateFirst` first),
and `sortedByRelevance` (by the optional `featureRank`, for the home project log).

## Home page composition (`app/page.tsx`)

In order: `Masthead` → `Direction` (the "focus" block) → `LabTimeline`
(full-bleed Gantt-style figure) → `SignalLog` (the project grid).

Two orderings are deliberately decoupled from the one dataset:
- **`LabTimeline`** uses `sortedByStart()` — a timeline must be chronological.
- **`SignalLog`** uses `sortedByRelevance()` — the project grid leads with the
  most role-relevant work via `featureRank`, independent of date. Do not hack
  `dateFirst` to reorder; set `featureRank`.

## Project pages: one shared shell

All seven project pages now render through **`components/apps/project-shell.tsx`**
(`ProjectShell`). It provides: the smooth-scroll wrapper, the floating section
nav (scroll-spy, appears after ~480px of scroll, the wordmark is a return-to-top
anchor), the back link, the hero (eyebrow / headline / sub / meta / optional live
callout), and the footer (`[back] [live] [src]`).

Each page supplies:
- its copy in `app/apps/<slug>/content.ts` (one source per project),
- its section bodies (diagrams, bands, prose) as children of `ProjectShell`,
- its own `--signal-color` tint.

> Historically kubereach had its own inline copy of the shell. It was migrated
> onto `ProjectShell` (see [06-ux-audit.md](06-ux-audit.md)); do not reintroduce a
> per-page shell.

Section headings, band captions, and aside labels are hard-coded in each
experience component, not in `content.ts`. Short body/closing text lives in
`content.ts` (e.g. `CLOSE.paragraphs[]`).

The generic `AppDetail` (`components/apps/app-detail.tsx`) is the **fallback** for
any slug not in the `IMMERSIVE` registry. It renders a solid page from the Signal
alone, including an optional long-form `article` block array — which is how a new
project can get a substantial page without a hand-built immersive component.

## Client interaction boundary

`components/layout-shell.tsx` (wrapping everything in `app/layout.tsx`) owns the
global client state: the keyboard-help overlay (`?`), the arrow/vim-key focus nav
(`hooks/use-arrow-nav.ts`), and the global return-to-top pill
(`components/ui/scroll-top.tsx`, shown on the standalone pages). Most page and
content components stay server components.

## Build-time GitHub data (the only "backend")

`scripts/fetch-github.ts` runs as `predev` / `prebuild`. It collects every repo
referenced by `SIGNALS`, makes one batched GraphQL call for commit counts and
open PRs, and writes `lib/generated/github.ts`. Components read it synchronously
via `lib/github.ts`.

Invariants:
- `lib/generated/github.ts` is gitignored and auto-generated — never edit or
  commit it.
- The script **never throws**: no token → stub data; fetch failure with a prior
  file → keep the stale file. The build always succeeds.
- A daily cron in the deploy workflow rebuilds so stats refresh with no code
  changes. CI passes a read-only `GITHUB_TOKEN` for live data.

## Conventions

- Import alias `@/*` → repo root.
- Site URL is `WEBSITE_URL` in `lib/constants.ts`. Do not hardcode the domain.
- `metadataBase` is set; a global canonical is intentionally omitted so sub-pages
  self-canonicalize.
- Contact email is the single `EMAIL` constant in `signals.ts`
  (`mantrikuladeep@gmail.com`), interpolated by the footer.

## Backward-compat aliases (do not "clean up")

The Signal type was migrated from an older shape; the old surface is kept so
unmigrated callers keep compiling: legacy `status` coexists with `state`; field
names are `name`/`tagline`/`description`; `PROJECTS = SIGNALS`,
`type AppProject = Signal`, `sortedByRecency = sortedByStart`. Leave these unless
you migrate all callers in the same pass.
