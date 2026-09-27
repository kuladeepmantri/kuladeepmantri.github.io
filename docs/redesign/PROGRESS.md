# Redesign progress (handoff)

Read `docs/redesign/PLAN.md` first. This file records what is done and what Kuladeep decided after the plan was written. Where this file and the plan disagree, this file wins.

## Decisions made after the plan
- **Copy:** the plan's copy was mockup wording. Rewrite everything in a genuine, plain, professional voice: how a real engineer talks, curiosity visible but not performed. No marketing, no cliche, no show-off, no em dashes. Drafts are in `app/signals.ts` (project lines and bodies, `NOW`). Treat them as drafts for Kuladeep to review. Sentence one, About, and Contact copy still need drafting in the same voice.
- **Now line:** the plan's line was rejected as cliche. A draft is in `NOW`; confirm with Kuladeep.
- **Instagram:** `kuladeep.mantri` (https://www.instagram.com/kuladeep.mantri/) confirmed.
- **No sample or stub data.** Build against real GitHub and X data only. Tokens go in `.env.local` locally (`GH_PAT`, `X_BEARER_TOKEN`) and as repo secrets in CI.
- **Preview:** use `npm run dev` on localhost. Push to `main` (deploys the live site) once the shell looks right.

## Done
- Phase 1: old immersive site, 3D, and unused deps removed (commit `chore(site): remove the old immersive site`).
- Avatar: `public/images/avatar.jpg` and `.webp` (256px, EXIF stripped); the source photo was removed from `public/`.
- `app/signals.ts` rewritten to the plan's section 8 shape, with draft copy.
- `lib/constants.ts` (`TIMEZONE`), `lib/panes.ts` (`PHONE_PATTERN`), `lib/live.ts` (snapshot types, `ago`, `shortAgo`, `clock`, `mood`, `lastCommit`, `orderProjects`, `latestProject`, `mostActive`).
- `scripts/fetch-live.ts` (GitHub GraphQL + X, never throws, cache from the deployed `live.json`, reads `.env.local`), wired as `predev`/`prebuild`. `public/live.json` and `lib/generated/` are gitignored.
- Routes are still Phase 1 placeholders.

## Next
1. Phase 2: `app/globals.css` (tokens, layout, motion from PLAN sections 5 and 7), Mona Sans in `app/layout.tsx`, anti-flash theme script, theme toggle.
2. Phases 4 and 5: `components/site/*`, all routes, phone sheet/push/inline.
3. Phase 6 remainder: `.github/workflows/nextjs.yml` triggers (hourly cron, repository_dispatch, env for `GH_PAT` and `X_BEARER_TOKEN`).
4. Phase 7: `lib/live-client.ts`, `lib/live-store.tsx`, `useNow`.
5. Phases 8 and 9: SEO, `CLAUDE.md` rewrite, superseded notes on old docs, Playwright screenshots, then push to `main`.
