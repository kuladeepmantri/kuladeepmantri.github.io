# Content model

## The Signal type

Each entry in `SIGNALS` (in `app/signals.ts`) has:
- **Identity:** `id` (`KM-YYYY-NNNN`, assigned in chronological order of
  `dateFirst`), `slug`, `type`, `name`, `tagline`, `description`.
- **Lifecycle:** `state` (`active` / `shipped` / `paused` / `archived`), legacy
  `status`, optional `statusNote`, `dateFirst`, `dateLast`.
- **Ordering:** optional `featureRank` (lower = earlier in the home project log;
  absent falls back to date order). The timeline ignores it and stays
  chronological.
- **Provenance:** `repos[]`, `signatureRef`.
- **Presentation:** `link`, `image`, `video`, `embedUrl`, `accentColor`, `tags`,
  `deviceType`, `collaborator`, optional long-form `article[]`, optional
  `advisory` (for security findings).

## The seven projects

Home project-log order is set by `featureRank` (currently: kubereach 1, auris 3,
shipcrew 4, rune 6, kintsugi 7, deid 8, untilithappens 9 — with 2 and 5 left open
for future AI entries). Interleaving security and AI, rarest-true-things first.

| id | slug | what it is | state | AI / security |
|----|------|-----------|-------|---------------|
| KM-2026-0006 | kubereach | Kubernetes foothold-to-cloud recon; SSRR under-reports reachable access; off-box IRSA→STS pivot proven in a lab | active | security (maps to weight-security threat model) |
| KM-2026-0005 | rune | Real-time vehicle diagnostics (Raspberry Pi, OBD-II, 3-layer anomaly/forecast) on a 2026 Honda Accord | active | ML (streaming anomaly detection) + safety gate |
| KM-2026-0004 | kintsugi | On-device iOS app: local-first, Keychain-persistent, SHA256-verified backups, on-device NLP sentiment | active | security architecture + on-device NLP |
| KM-2025-0003 | shipcrew | Multi-agent Claude system (router, per-agent memory/budgets, agents review each other), with Abhishek Manyam | active | AI (multi-agent), maps to oversight |
| KM-2024-0002 | auris | ARM64 ptrace syscall tracer/enforcer (allow/log/block at the boundary) + offensive toolkit | shipped | security (maps to runtime agent monitoring) |
| KM-2024-0001 | untilithappens | untilithappens.org, plain-language cyber-safety education, official-source-backed | shipped | security education, no AI |
| KM-2023-0001 | deid | PII de-identification service (FastAPI + queue + storage; regex today, NER scaffolded) | archived | NLP/NER pipeline, privacy |

Notes:
- Kubereach's id stays `0006` even though it is newest by start; ids track
  `dateFirst`, and Kintsugi predates Rune by a few days (hence 0004 vs 0005).
- ShipCrew is co-authored. The page splits who built what: Kuladeep owns the
  agent platform (orchestration, router, executor over the Claude Agent SDK, MCP
  tools, streaming); Abhishek owns auth, the Docker→SQLite move, login/onboarding,
  and the frontend redesign. Keep that split honest for interviews.

## Adding a project

1. Add a Signal to `SIGNALS` (choose the `KM-YYYY-NNNN` id by `dateFirst`
   chronology; set `featureRank` for its home-log position).
2. Fastest path to a real page: fill the `article[]` block array on the Signal and
   let the fallback `AppDetail` render it. No new component needed.
3. Full immersive page: add the slug to the `IMMERSIVE` registry in
   `app/apps/[slug]/page.tsx`, create `components/apps/<slug>/`, and put copy in
   `app/apps/<slug>/content.ts`. Follow the checklist in `docs/design-language.md`.
   Add a homepage figure in `components/home/project-schematics.tsx` (optional;
   missing is handled gracefully).

## Standalone pages and other exports

- `app/about/page.tsx` — the "whoami" narrative (first person; inline hover-cards
  in `components/gist/inline-cards.tsx`).
- `app/now/page.tsx` — the "notes" / now page (what is being built, next, shipped,
  shelved).
- `components/home/direction.tsx` — the home "focus" block: one confident line on
  the current research focus (AI security). This is the single place the AI-security
  direction is stated on the home page.
- `signals.ts` also exports `CERTIFICATIONS` (CEH), `SOCIAL_LINKS` (GitHub,
  Instagram), and `EMAIL`.
