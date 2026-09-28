---
name: site-design
description: How kuladeepmantri.com is designed and built. Use before changing anything visual on the site, adding a project or page, designing a background scene, changing colours, type, motion, panes, or sound, or when asked to reproduce this site's design somewhere else.
---

# Site design

The full design system is in `DESIGN.md` at the repo root. Read it before
making changes; it is the source of truth for layout, type, colour, motion,
the scenery (line-art backgrounds), sound, content voice, and how to add a
project.

## Workflow

1. Read `DESIGN.md`. For a background, read section 6 (Scenery) in full,
   including "Designing a scene" and the scene recipes.
2. Look at the closest existing scene in `components/site/scenery/scenes/` and
   start from it. The ones that set the quality bar: `flamingos.ts`, `port.ts`,
   `ship.ts`, `lighthouse.ts`, `regatta.ts`, `moonrise.ts`, `pier.ts`.
3. Build it, then check it at 1440x900, 1024x700, and a phone, with the pane
   open and closed, and clicking between pages. Keep 60 fps.
4. Run `npm run lint` and `npm run build`.
5. Update `DESIGN.md` so it still describes the site: the scene table, any new
   tokens, timings, or rules.

## Rules that are easy to break

- Real data only; no placeholder content.
- No em dashes and no marketing language in anything visitors read.
- Scenes are places drawn in code: no emoji objects, no icons, no mascots.
- Sizes come from the stage (`unit`, `span`, `H`), never fixed pixels.
- Durations and curves come from `lib/motion.ts` and match the CSS keyframes.
- Only route changes animate panes; content refreshes update in place.
- Tokens (X, GitHub) stay in `.env.local`; never print or commit them.
