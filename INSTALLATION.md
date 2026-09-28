# Installation

## Prerequisites

- Node.js 22 or later
- npm

## Local development

```bash
git clone https://github.com/kuladeepmantri/kuladeepmantri.github.io.git
cd kuladeepmantri.github.io
npm install
npm run dev
```

Open http://localhost:3000.

`npm run dev` and `npm run build` first run `scripts/fetch-live.ts`, which
fetches GitHub and X data into `lib/generated/live.ts` and `public/live.json`
(both gitignored). It reads tokens from `.env.local`:

- `GH_PAT` or `GITHUB_TOKEN` for GitHub. Without either, it uses a logged-in
  `gh` CLI session if there is one.
- `X_BEARER_TOKEN` for X.

Without tokens or network it reuses the snapshot published on the live site,
so the build still succeeds.

## Where to edit

- Projects and site constants (`SIGNALS`, `EMAIL`, handles): `app/signals.ts`
- A pane's content: `app/<route>/page.tsx`
- The home pane: `components/site/home-pane.tsx`
- Metadata shared by every page: `app/layout.tsx` and `lib/meta.ts`
- Look, motion, scenery, and sound: read `DESIGN.md` first

## Quality checks

```bash
npm run lint
npm run build
```

`npm run build` exports to `out/` and adds a Content-Security-Policy to every
page. There is no test suite, so check the site by eye at desktop, mid-size,
and phone widths (`DESIGN.md`, section 10).

## Deployment

Pushing to `main` runs `.github/workflows/nextjs.yml`, which builds on Node 22
and deploys `out/` to GitHub Pages. It also runs every hour to refresh the live
data, and deploys only when something changed. Secrets: `GH_PAT` (optional, a
fine-grained read-only token) and `X_BEARER_TOKEN`.
