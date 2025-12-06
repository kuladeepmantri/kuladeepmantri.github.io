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

It trims each token and skips one that holds anything but printable ASCII,
with a warning that never prints the token. Without tokens or network it
reuses the snapshot published on the live site, so the build still succeeds.

## Where to edit

- Projects and site constants (`SIGNALS`, `EMAIL`, handles): `app/signals.ts`
- The page: `app/page.tsx`, which composes the sections in `components/home/`
- Tokens, type, and spacing: `app/globals.css` (read `DESIGN.md` first)
- The About text: `components/home/about.tsx` (the owner's own words; don't
  edit them)
- Metadata: `app/layout.tsx` and `lib/meta.ts`
- Live data: `scripts/fetch-live.ts` (build) and `lib/live-client.ts` (browser)
- Old URL redirects: `app/not-found.tsx`

## Quality checks

```bash
npm run lint
npm test
npm run build
```

`npm test` runs the 135 unit tests in `lib/*.test.ts`, which also cover the
helpers in `scripts/fetch-live.ts`. `npm run build` exports to `out/` and adds
a Content-Security-Policy to every page. To look at the export, run
`python3 -m http.server 4173 --directory out`. Check it in light and dark at
1280, 390 and 360 px wide, keyboard only, and with reduced motion
(`DESIGN.md`, section 11).

Prettier settings are in `.prettierrc`: no semicolons, single quotes, width
100.

## Deployment

Pushing to `main` runs `.github/workflows/nextjs.yml`, which lints, runs the
tests, builds on Node 22 and deploys `out/` to GitHub Pages. The build fails
if any shipped file carries GPS metadata or if an excluded repo name shows up
in `out/`. The workflow pins every Action to a commit SHA, and Dependabot
opens a weekly PR to update them. The workflow also runs every hour to refresh
the live data, and deploys only when something changed. Secrets: `GH_PAT` (optional, a
fine-grained read-only token) and `X_BEARER_TOKEN`.
