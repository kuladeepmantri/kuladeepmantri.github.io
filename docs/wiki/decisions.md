# Decisions

The choices behind the rebuild, with the reasoning so a future build doesn't relitigate them. Dated 2026-07-03.

| # | Decision | Why |
|---|----------|-----|
| 1 | 3D-forward on every project page, engineered for speed | The site should feel visual, not text-heavy. Speed is protected by lazy-load, Draco compression, poster-first paint, and a static fallback. rune already ships React Three Fiber on a static export, so this is proven. |
| 2 | Rich in-site page for each project + a "live" callout for ones with a subdomain | The portfolio is the visual overview; the real product lives on its subdomain. It must not feel like a router that just bounces you to GitHub. |
| 3 | Readable ~740px prose column, visuals break full-bleed (900–1200px) | Fixes the wasted desktop margins without stretching text to an unreadable measure. The band pattern already exists in the kubereach page. |
| 4 | Soften the jargon: work / projects / notes instead of signals / log / lab / entries | The current framing confuses first-time visitors. Keep the handcrafted mono feel, drop the inside-baseball vocabulary. |
| 5 | Keep KM-YYYY-NNNN ids, rendered small and quiet | They make the site one of a kind. They just shouldn't shout or read as cryptic. Drop the provenance/verify baggage that justified them. |
| 6 | /now becomes a living workbench | The old page was sloppy. A first-person "what I'm on now / next / shipped / shelved" does the idea justice and is easy to maintain. |
| 7 | True status on every project, but lead with strengths | Genuine over inflated. Each page opens with what actually works or what was proven; the status (shelved, prototype) sits as a quieter note, not hidden. |
| 8 | Scale writing depth to substance | kubereach / rune / auris earn full narratives; kintsugi / shipcrew are medium; DeID is a short, honest "old prototype." Don't pad thin projects. |
| 9 | Warm ember/rose accent, subtle per-project tint | Retires the generic blue. One warm family holds the site together; a small tint gives each project identity without the patchwork look. |
| 10 | A genuine, narrative About page | Not a résumé. The life story in Kuladeep's own voice, humanized. See [about-story.md](about-story.md) and its tone guardrails. |
| 11 | Keep untilithappens, full treatment | It's a real shipped project with a live site. |
| 12 | Contact email: `kuladeepbmantri@gmail.com` | Replaces the old `mantrikuladeep@gmail.com` in the code. |

Extra: the home hero shows the full name **Kuladeep Bhushan Mantri** instead of the `kuladeepmantri.com` wordmark. Only there.

## Things removed
- `/verify` page — no purpose on a personal site.
- `/feed.xml` from the nav — it opened raw XML nobody used.
- The "KM / index" header links — redundant and confusing.
- `app/articles/kubereach.ts` — dead code, never rendered.
