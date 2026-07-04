# Kuladeep Mantri Portfolio

Personal portfolio for Kuladeep Mantri, cybersecurity engineer. A minimal, mono-first site where every project has its own immersive read page, built as a static export.

## Stack

- **Framework**: Next.js 15 (App Router, React 19), static export (`output: 'export'`)
- **Styling**: Tailwind CSS v4
- **Animation**: Motion (formerly Framer Motion)
- **3D**: react-three-fiber + drei
- **Hosting**: GitHub Pages

Project content is defined in one place, `app/signals.ts`, and the pages fan out from it. See `INSTALLATION.md` for setup and where to edit content.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the site.
