# Blueprint: shipcrew

- **id:** KM-2025-0003
- **status:** prototype, built with Abhishek Manyam (https://www.abhishekmanyam.com/)
- **tint:** TBD (pick a warm-family tint during build)
- **depth:** medium
- **links:** src only (kuladeepmantri/shipcrew)
- **subdomain:** none

## What it actually is (honest)
An "AI dev team in a box." Several specialized Claude-powered agents (PM, frontend, backend, reviewer) collaborate in a Slack-like chat to build software together. TypeScript monorepo: Next.js 15 + React 19 frontend, Express + Prisma backend, Socket.io for live streaming, Claude Agent SDK for the agents, Docker sandboxes per project.

Honest scope: a two-day prototype (2026-03-01/02, 13 commits). Real and interesting, not a finished product.

## Collaboration credit (make this explicit and generous)
Built with Abhishek Manyam. He owned auth (JWT), the switch off Docker to SQLite for local dev and the follow-up SQLite fixes, the login/register split and welcome-screen onboarding, and the glassmorphic dark frontend redesign. Kuladeep laid down the core agent platform: the orchestration pipeline, router, and executor. Link Abhishek's site.

## Page shape
1. Eyebrow: shipcrew · prototype · with Abhishek Manyam.
2. Hero: 3D of the agent pipeline — a message flowing through router → agents → Claude → back (poster-first).
3. How it works: user message → Socket.io → pipeline → router picks agents (mentions/channel/autonomy) → executor calls Claude with each agent's prompt → response.
4. Band: the agent-collaboration diagram (agents talking to each other, creating tasks, sandboxed Docker execution).
5. Honest note: two-day build, what works, what a real version would need.
6. Clear "built with Abhishek" credit block.

## 3D + diagrams
- Hero 3D: the message-through-pipeline flow.
- Wireframe: router/executor architecture (desktop + portrait).

## Copy notes
- First-person, but careful to share credit. "We built" where it was joint, "Abhishek did X" where it was his.
- Don't oversell the autonomy. It's a prototype of an idea.
