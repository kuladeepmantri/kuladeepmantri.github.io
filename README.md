# kuladeepmantri.com

My personal site, all on one page: my projects, a short About, my latest post
on X, and my latest release and commit on GitHub. The posts, commits and
numbers come from GitHub and X when the site builds, and a new commit shows up
in the browser before the next build.

## Stack

- Next.js 15 (App Router, React 19), exported as static files
- Plain CSS in `app/globals.css`, with Geist and Geist Mono
- GitHub Pages, deployed by GitHub Actions and rebuilt every hour

Projects live in `app/signals.ts`. The page is `app/page.tsx`, built from the
components in `components/home/`. `DESIGN.md` explains how the site looks and
where its data comes from, with a checklist for adding a project.
`INSTALLATION.md` covers setup.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
