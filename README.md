# kuladeepmantri.com

My personal site: one page of glass panes over a line-art scene that changes
with each page. Projects, GitHub activity, and my latest post on X come from
GitHub and X, fetched when the site is built.

## Stack

- Next.js 15 (App Router, React 19), exported as static files
- Plain CSS in `app/globals.css`, one font (Geist)
- Canvas 2D and one WebGL shader for the scenery, Web Audio for the optional sound
- GitHub Pages, deployed by GitHub Actions

Projects live in `app/signals.ts`. `DESIGN.md` describes how the site looks,
moves, and is built, and how to add a project. `INSTALLATION.md` covers setup.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
