# Overview

## What this is

The personal site of Kuladeep Mantri, live at **kuladeepmantri.com**. It started
as a "public lab": a portfolio built like a dated, versioned research log rather
than a marketing page. It presents real projects (security, systems, and AI work)
as an honest record of what was built and how it works.

## Current mission

The site is being repositioned to support an application to **SPAR (Supervised
Program for Alignment Research), Fall 2026**, as a mentee. SPAR is a part-time,
remote AI-safety research fellowship run by Kairos. The target is the **AI
Security** track ("hardware-enabled governance and preventing the theft of model
weights") and adjacent **AI control / runtime agent monitoring**.

A SPAR mentor is the primary reader now. They click the site from an application,
skim for 60-90 seconds, and decide whether this person can do real research. So
the bar for everything on the site is: **would a skeptical researcher at
Anthropic / Redwood / RAND / DeepMind believe it, and not catch a bluff.**

Key dates for the round: mentee applications open **July 28, 2026**, close
**Aug 18**, decisions **Sept 4**, research runs Sept 14 - Dec 14.

## Who Kuladeep is (for positioning)

A **cybersecurity engineer** who also builds AI. Both sides are real and carry
equal weight. Security/systems: Kubernetes-to-cloud, low-level systems (C/C++,
ptrace, ARM64), cloud security, offensive and defensive work. AI: NLP / language
models, local LLMs (Ollama, fine-tuning, RAG), and multi-agent systems.

The positioning is "cybersecurity engineer, and AI lives in the work" — not "AI
guy," not "GRC/compliance guy." AI security is where the two halves are the same
field. See [04-spar-positioning.md](04-spar-positioning.md) for the full framing
and the honesty rules that govern the copy.

## Stack

- **Next.js 15** (App Router, React 19), **static export** (`output: 'export'`),
  deployed to **GitHub Pages**.
- **Tailwind v4** for styling; **Motion** for animation; **lenis** for smooth
  scroll on project pages; **react-three-fiber / drei** for the 3D moments.
- Two fonts via `next/font`: **IBM Plex Mono** (the site leans mono) and
  **Inter** for long-form prose.
- The only "backend" is a build-time GitHub fetch that annotates repos with
  commit counts and open PRs (see [01-architecture.md](01-architecture.md)).

## Deploy

Push to `main` → `.github/workflows/nextjs.yml` builds the static export and
deploys `out/` to GitHub Pages. A daily cron rebuild refreshes the GitHub stats
even with no code changes. Static export means: no runtime server, no SSR, no
request-time API routes; everything is rendered at build time.

## Quality gates

There is no test suite. "Quality checks" are `npm run lint` and `npm run build`
(the static export must succeed). For anything with a runtime surface, also run
`npm run dev` and look at it in the browser, in both themes and at a phone width.
