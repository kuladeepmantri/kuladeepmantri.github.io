# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repository.

**Read `DESIGN.md` before changing anything visual.** It is the source of truth
for layout, type, colour, motion, the line-art backgrounds (scenery), sound,
voice, and the checklist for adding a project. The `site-design` skill in
`.claude/skills/` points agents to it. The files under `docs/` describe earlier
designs of the site and are kept for history only.

## What this is

kuladeepmantri.com: Kuladeep Mantri's personal site. Next.js 15 (App Router,
React 19), exported as static files (`output: 'export'`) and deployed to GitHub
Pages. One page with panes: every route opens a glass pane beside the home pane,
over a line-art scene that changes per page.

## Commands

```bash
npm run dev      # predev fetches live data (scripts/fetch-live.ts), then next dev on :3000
npm run build    # prebuild fetches live data, static export to out/, postbuild adds the CSP
npm run lint     # eslint
```

There is no test suite. Quality checks are `npm run lint` and `npm run build`,
plus looking at the site at desktop, mid-size, and phone widths (DESIGN.md
section 10).

## Architecture

- `app/layout.tsx` wraps every route in `components/site/shell.tsx`: the
  scenery, the deck of panes, and the live-data provider.
- `app/<route>/page.tsx` renders only that pane's content. `lib/panes.ts` maps a
  path to its pane key and palette key.
- `components/site/deck.tsx` opens, closes, and switches panes. Only route
  changes animate; content refreshes update the open pane in place.
- `components/site/scenery/` draws the background: `index.tsx` (frame loop and
  scene changes), `printer.ts` (the line screen), `sky.ts` (cloud shader),
  `kit.ts` (painting helpers and types), `scenes/` (one file per scene,
  registered in `scenes/index.ts`).
- `lib/motion.ts` holds the durations and curves shared by panes, CSS, and
  scenery. `lib/still.ts` is the Motion switch. `lib/sound.ts` synthesizes the
  optional ambient sound.
- `app/signals.ts` is the single source of truth for projects (`SIGNALS`) and
  site constants (`EMAIL`, handles). Add or change project content there.

## Live data

`scripts/fetch-live.ts` runs before `dev` and `build`. It writes
`lib/generated/live.ts` (gitignored, never edit or commit) and
`public/live.json` (gitignored), the published snapshot that the next build
reads back from the live site as its cache. It never throws: without tokens or
network it keeps the cached data, so the build always succeeds.

- GitHub: `GH_PAT`, then `GITHUB_TOKEN` (a rejected token falls through to the
  next). X: `X_BEARER_TOKEN`; `X_FULL_REFRESH=1` refetches posts from scratch.
- The browser refresh (`lib/live-client.ts`) calls GitHub's public events API
  directly, unauthenticated, and caches for 10 minutes. It never reads
  `live.json`.
- Tokens live only in `.env.local` (gitignored) and GitHub Actions secrets.
  Never print, echo, or commit them.
- Private repositories are counted but never named in anything public. Only
  public repos go in a project's `repos` in `SIGNALS`.

## Conventions

- Import alias `@/*` maps to the repo root.
- One font: Geist (`--font-sans`). Styling is plain CSS in `app/globals.css`,
  including its own reset. No Tailwind, no PostCSS config.
- Prettier style: no semicolons, single quotes, width 100.
- Site URL is `WEBSITE_URL` in `lib/constants.ts`; do not hard-code the domain.
- Visitor-facing writing: first person, plain, no marketing words, no em dashes.

## Deployment

Pushing to `main` runs `.github/workflows/nextjs.yml` on Node 22: fetch live
data (the only step with secrets), `next build`, add the CSP, fail on any GPS
metadata in `out/`, then deploy `out/` to GitHub Pages. An hourly scheduled run
(`7 * * * *`) rebuilds so the live data stays fresh, and skips the deploy when
the commit and the data (ignoring `builtAt`) match the live `live.json`. The
build ID is the commit SHA. Do not push to `main` without the owner's go-ahead.
