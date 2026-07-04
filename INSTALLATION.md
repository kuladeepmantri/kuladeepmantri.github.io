# Kuladeep Portfolio - Installation Guide

## Prerequisites

- Node.js 20.x or later
- npm

## Local Development

1. **Clone the repository**

```bash
git clone https://github.com/kuladeepmantri/kuladeepmantri.github.io.git
cd kuladeepmantri.github.io
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Open the site**

Visit `http://localhost:3000`.

## Update Content

- Signals (projects/findings — single source of truth): `app/signals.ts`
- Home page layout/content: `app/page.tsx`
- Now page updates: `app/now/page.tsx`
- Site metadata: `app/layout.tsx`

Repo stats shown on the site are fetched at build time by `scripts/fetch-github.ts`
(runs automatically as a `predev`/`prebuild` step). Set `GITHUB_TOKEN` for live data;
without it the build still succeeds with stub data.

## Quality Checks

```bash
npm run lint
npm run build
```

## Deployment

This repository is configured for static export (`next build`) and GitHub Pages deployment via `.github/workflows/nextjs.yml`.
