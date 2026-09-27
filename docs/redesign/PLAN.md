# kuladeepmantri.com redesign: the living sentence

Status: **approved design, ready to implement.** This file is the single source of truth for the rebuild. It supersedes `docs/plan.md`, `docs/design-language.md`, the per-project `docs/blueprints/`, and the design sections of `docs/brain/`. Where anything in the repo disagrees with this file, this file wins.

Written 2026-09-27 at the end of the design session. The implementer (a fresh session) should read this whole file once before touching code, then work phase by phase (section 13), committing after each phase.

House rule for all copy and code comments on this site: **no em dashes, ever.** Use a comma, a colon, a period, or a middle dot `·`.

---

## 0. Where the design lives

1. **Design canvas (interactive mockups):** https://claude.ai/artifact/F9p99S8yaBAdX7u1L6VUBi
   Open the page **"Round 6 · L2 polished"**. The boards that matter:
   | Board | What it shows |
   |---|---|
   | `Paper · warm white` (`Site.dc.html`) | **Desktop, light mode. The primary reference.** |
   | `Graphite · dark` (`SiteGraphite.dc.html`) | **Desktop, dark mode.** |
   | `Phone A · bottom sheet` (`Mobile.dc.html`) | Phone, token opens a bottom sheet |
   | `Phone B · push page` (`MobilePush.dc.html`) | Phone, full screen page with Back |
   | `Phone C · opens inline` (`MobileInline.dc.html`) | Phone, content opens under the sentence |
   | `Phone A · Graphite` (`MobileDark.dc.html`) | Phone, dark |
   Snow and Sage were explored and **rejected**. Earlier pages (Rounds 1 to 5) are history; ignore them except as context.
   Every board is clickable. Click every underlined word and every project row before building.
2. **Exact reference markup, committed in this repo:**
   - `docs/redesign/reference/desktop.dc.html` (source of `Site.dc.html`)
   - `docs/redesign/reference/phone.dc.html` (source of `Mobile.dc.html`)
   These are the ground truth for spacing, sizes, colors (the `.p-paper` and `.p-graphite` CSS variable blocks), copy, and motion. They are written in a mockup format (`<x-dc>`, `{{holes}}`, `<sc-for>`), not React. Port the *values*, not the markup. The avatar there points at `/_blob/...`, a canvas asset; in the site use `public/images/avatar.jpg` (section 6.4).
3. **Screenshots:** the canvas is the visual reference. For a static image of any board, open the canvas, select the board, and use the canvas Share › Export, or take a browser screenshot of the board in focused view. Phase 8 generates screenshots of the real build for side by side comparison (section 12).

---

## 1. What we decided (the short version)

| Topic | Decision |
|---|---|
| Concept | **The living sentence.** A two-column page. Left: who I am in two sentences; the second one is live ("I pushed to kubereach on GitHub 2 hours ago, posted on X yesterday, and it's 2:14 PM here, so I'm probably at my desk."). Right: a pane. **Every underlined word in the sentence is navigation** and opens something in the right pane. |
| Layout | Split, light, two columns on desktop. Single column on phone. |
| Right pane contents | `Work` (default), a page per project, `GitHub`, `X`, `About`, `Contact`. |
| Font | **Mona Sans** (GitHub's open source variable grotesque), one family for everything. Loaded with `next/font/google`. |
| Color | **Paper** (warm white) for light mode, **Graphite** for dark mode. Follows the system by default; a toggle overrides and persists. |
| Phone | All three patterns approved. Mapping in section 7.3: quick cards (GitHub, X, Contact) open as a **bottom sheet**; long reads (a project, About) open as a **push page**; **inline** is kept as a supported pattern selectable per route by one constant. |
| Live data | Build-time snapshot (GitHub GraphQL + X API) rebuilt **hourly**, **on every push to a project repo** (repository_dispatch), and on push to this repo. In the browser, a light refresh from GitHub's public API makes new pushes appear within seconds. Relative times tick. |
| Cost | $0 for GitHub, Actions, Pages. X is pay-per-use; with the caching rules in section 9.3 it should stay around $1 a month or less. |
| Removed | The 3D car, all immersive project pages, the Gantt timeline, SVG schematics, smooth scroll, command palette remnants, keyboard help overlay, arrow-key nav, `/now` as a separate page, Instagram as a primary link (it stays in Contact). |
| Kept | Domain and deploy (GitHub Pages, static export), `app/signals.ts` as the content source (simplified), `/apps/<slug>` URLs, `/about`, RSS and JSON feeds, sitemap, robots. |

Why (so the implementer keeps the spirit): the old site was graphics first and did not say who Kuladeep is or what he is doing now. The new one is text first, reads like a real developer made it, and is **live**: the page itself shows current work. Minimal, but not a 2020 template: the novelty is that the bio sentence is live data and is also the menu.

---

## 2. Final copy (use verbatim)

### 2.1 Top of left column
- Left: `Kuladeep Mantri` (weight 600; links to `/`).
- Right: live dot + `Live`, then the theme toggle (section 5.3).

### 2.2 Sentence one (static, ink color)
> I'm **Kuladeep**, a cybersecurity engineer in Michigan. I build security tools and AI systems, and study how they fail.

`Kuladeep` is a token linking to `/about`.

### 2.3 Sentence two (live, muted color; tokens in ink)
Template:
> I pushed to **{project}** on **GitHub** {pushAgo}, posted on **X** {postAgo}, and it's **{time}** here, so {mood}.

Tokens and targets:
| Token | Links to |
|---|---|
| `{project}` = the project with the most recent commit (section 9.5) | `/apps/{slug}` |
| `GitHub` | `/github` |
| `X` | `/x` |
| `{time}` e.g. `2:14 PM` (America/Detroit, `h:mm AM/PM`) | `/contact` |

Grammar rules (implement exactly; unit test the pure function if convenient):
- `{pushAgo}` / `{postAgo}` long form: `just now` (< 1 min), `N minutes ago`, `an hour ago`, `N hours ago`, `yesterday`, `N days ago` (< 30 days), `on Aug 3` (30+ days, same year), `in Aug 2025` (older).
- If there is **no X data** (no token, fetch failed and no cache): drop the X clause. Result: "I pushed to kubereach on GitHub 2 hours ago, and it's 2:14 PM here, so I'm probably at my desk."
- If there is **no GitHub data at all**: "I build in the open on GitHub, post on X, and it's 2:14 PM here, so ..." with GitHub and X still tokens.
- If the latest project push is older than 30 days: "I last pushed to kubereach on GitHub on Aug 3, ..."
- `{mood}` by hour in America/Detroit:
  | Hour | Weekday | Weekend (Sat, Sun) |
  |---|---|---|
  | 0 to 5 | I'm probably asleep | same |
  | 6 to 8 | I'm probably just getting started | same |
  | 9 to 17 | I'm probably at my desk | I'm probably building something of my own |
  | 18 to 23 | I'm probably tinkering on something | same |

### 2.4 Bottom of left column
- Now line: **Now**&nbsp;&nbsp;Securing AI systems: model weights, the infrastructure that trains them, and agents while they run.
  (Kuladeep to confirm this line is still current before launch. Keep it as a constant `NOW` in `app/signals.ts` with a `NOW_UPDATED` date.)
- Footer row, 13px, faint: left `Built from {sha7} · rebuilds on every push`, right `Every underlined word opens something`.

### 2.5 Right pane header
- On `/`: left `Work`, right live dot + `Live from GitHub`.
- Elsewhere: breadcrumb `Work / {Title}` (Work is a link to `/`), right a `Close` link to `/`.

### 2.6 Projects (Work list order is live: most recent push first; projects with no push data sort by `dateLast` desc)

| slug | name | line (row subtitle) | repo | state | stack | started |
|---|---|---|---|---|---|---|
| kubereach | kubereach | Kubernetes foothold to cloud recon | getnullpkg/kubereach | Active | Go · AWS | Jun 27, 2026 |
| rune | Rune | Live diagnostics for my car | kuladeepmantri/rune | In daily use | Python · Pi · React | Jan 2026 |
| shipcrew | ShipCrew | A team of Claude agents that ships code | kuladeepmantri/shipcrew | Prototype | TypeScript | Jan 2025 |
| auris | Auris | Syscall tracer for ARM64 Linux | kuladeepmantri/auris | Shipped | C · ptrace | Sep 2024 |
| kintsugi | Kintsugi | Private recovery tracker for iOS | (private, no repo) | Personal | Swift · SwiftUI | Jan 2026 |
| untilithappens | untilithappens.org | Cyber safety in plain language | kuladeepmantri/untilithappens | Live | Next.js | Mar 2024 |
| deid | DeID | PII masking service | kuladeepmantri/DeID-Anonymizer | Archived | Python · FastAPI | Apr 2023 |

Project page body copy (one paragraph each, verbatim):
- **kubereach:** You get a shell in one Kubernetes pod. kubereach maps what that stolen identity can actually reach, then follows the trail into the AWS account behind the cluster. I proved the two riskiest claims on a real EKS cluster before writing product code: permission tools that trust SelfSubjectRulesReview under-report access on managed clusters, and an IRSA token read off a pod redeems from a laptop for the pod's full AWS role.
- **Rune:** A Raspberry Pi 4B in the armrest of my Accord reads the CAN bus and runs three layers of analysis: threshold checks, streaming anomaly detection, and trend forecasting. The result is a live health score on a phone on the dash, and nothing is ever written back to the car without passing an allowlist.
- **ShipCrew:** A Slack-shaped room where named Claude agents take tasks, hand off, and review each other. I built the agent platform: the router that decides who answers, the executor on the Claude Agent SDK, MCP tools, and streaming. Built with Abhishek Manyam. (Link "Abhishek Manyam" to https://github.com/abhishekmanyam.)
- **Auris:** Auris attaches to an ARM64 process through ptrace and records every system call it makes. From that stream it builds a behavioral baseline, flags what is new, and in block mode rewrites the registers so a disallowed call never reaches the kernel.
- **Kintsugi:** Built for myself and used every day. No account, no server, no analytics. Journal sentiment runs on Apple's on-device NaturalLanguage framework, so nothing I write leaves the phone.
- **untilithappens.org:** Guides for people who were never taught security, in a calm guided sequence. Every claim is dated and linked to an official source like the FTC, the FBI's IC3, or CISA.
- **DeID:** A FastAPI service that detects and masks personal data in text, with a queue and object storage scaffolded for the NER model that replaces the regex detector.

Project links (first one renders as the solid pill button, the rest as text links, all with ` ↗`):
- kubereach: `Open repository` → https://github.com/getnullpkg/kubereach
- Rune: `Open site` → https://rune.kuladeepmantri.com/ (note under commits: "This repo is the Rune case-study site. The car software runs on the Pi.")
- ShipCrew: none (repo link only if the repo is public; check at build via `isPrivate`)
- Auris: `Open site` → https://auris.kuladeepmantri.com/ , `Source` → https://github.com/kuladeepmantri/auris
- Kintsugi: none
- untilithappens.org: `Open site` → https://untilithappens.kuladeepmantri.com/
- DeID: none (add `Source` if the repo is public)

Quiet-state notes (shown instead of the commits list when there are no recent commits):
- Auris: "Shipped and stable. No pushes in the last few months." (only when last push > 60 days)
- Kintsugi: "The repo is private, so its commits stay off this page."
- untilithappens.org: "Live and stable."
- DeID: "Archived."

### 2.7 About pane
Header: avatar 64px, `Kuladeep Mantri`, sub `Hyderabad → Michigan`. Paragraphs:
1. I got into computers by breaking them. Windows XP was the first casualty, then Vista, then 7. Linux pulled me in one night, and I went from barely knowing what it was to running Arch and rolling my own distro.
2. Then I learned to build instead of just poke: Python, then C and C++ with GDB open, then the web, APIs, cloud and Kubernetes. Lately it's AI, running and fine-tuning open-weight models on my own hardware and working out how they fail too.
3. At the core I'm an engineer. I just like understanding how things work, and how they fail.

Facts row: `From` Hyderabad, India · `Based in` Michigan, USA · `Certified` CEH, EC-Council.

### 2.8 Contact pane
- Meta: `{time} in Michigan · Eastern time`
- H2: `Say hello`
- Lead: Security, AI, Kubernetes, or anything that breaks in an interesting way.
- Email card: label `Email`, value `mantrikuladeep@gmail.com` (mailto link), button `Copy` → `Copied` for 1.6 s (Clipboard API; fall back to selecting the text if the API throws).
- Link rows: `X` → `@kuladeepmantri ↗`, `GitHub` → `kuladeepmantri ↗`, `Instagram` → `kuladeep.mantri ↗` (Kuladeep to confirm the handle: the repo has `kuladeep.mantri`, a web search showed `kuladeep_mantri`).
- No LinkedIn (decided).

### 2.9 GitHub pane
Avatar 64, `Kuladeep Mantri`, `@kuladeepmantri on GitHub`, pill `Follow` → profile. Facts: `Contributions, last year` {total} · `Most active this month` {project name} · `Last push` {short ago}. Label `A year of commits` + contribution grid (section 6.5). Label `Languages` + stacked bar + legend (top five by bytes across public, non-fork repos).

### 2.10 X pane
Avatar 64, `Kuladeep Mantri`, `@kuladeepmantri on X`, pill `Follow`. Bio: **live from the X profile** (the mockup's bio is a placeholder; never ship it as static text). Label `Latest posts`, up to 5 posts with short relative time, each links to the post. No follower counts (decided: no vanity numbers). Empty state (no X data): "Follow @kuladeepmantri for what I'm working on." with the Follow pill.

---

## 3. Information architecture and routes

All routes render inside one persistent shell (left column + right pane). Client-side navigation between them must not re-mount the left column.

| Route | Right pane (desktop) | Phone presentation | Title |
|---|---|---|---|
| `/` | Work list | Work list in page flow | Kuladeep Mantri · cybersecurity engineer |
| `/apps/[slug]` (7) | Project page | push page | {name} |
| `/about` | About | push page | About |
| `/github` | GitHub | bottom sheet | GitHub |
| `/x` | X | bottom sheet | X |
| `/contact` | Contact | bottom sheet | Contact |
| `/now` | same as `/` | same as `/` | canonical `/` (keeps old links working) |
| 404 | "Nothing here." + link to Work | in flow | Not found |

Kept routes: `/feed.xml`, `/api/signals.json`, `/sitemap.xml`, `/robots.txt`. New static file: `/live.json` (the snapshot, section 9.3).

Token behavior: tokens are real `<Link>`s. The token for the current route gets `aria-current="page"` and the selected style. Clicking the selected token navigates to `/` (toggle). `Escape` closes a pane (navigate to `/`, or `router.back()` when the previous history entry is inside the site).

---

## 4. Code architecture (target tree)

```
app/
  layout.tsx            fonts, theme script, metadata, <Shell>{children}</Shell>
  page.tsx              Work pane
  about/page.tsx        About pane
  apps/[slug]/page.tsx  Project pane (generateStaticParams from SIGNALS)
  github/page.tsx       GitHub pane
  x/page.tsx            X pane
  contact/page.tsx      Contact pane
  now/page.tsx          re-exports page.tsx, metadata.alternates.canonical = '/'
  not-found.tsx
  globals.css           tokens (section 5), base, motion
  signals.ts            content source (simplified, section 8)
  feed.xml/route.ts     kept, migrated off legacy aliases
  api/signals.json/route.ts  kept, migrated
  sitemap.ts, robots.ts, icon.svg
components/site/
  shell.tsx             server: grid, <Intro/>, <PaneFrame>{children}</PaneFrame>, phone-only <WorkList/>
  intro.tsx             server: top row, sentence one, <LiveSentence/>, Now, footer
  live-sentence.tsx     client: sentence two (tokens + ticking times + mood)
  token.tsx             client: Link with active state via usePathname
  pane-frame.tsx        client: breadcrumb/close, Escape, phone sheet/push/inline wrapper, focus + scroll lock
  work-list.tsx         client (live ordering and dots)
  project-pane.tsx, github-pane.tsx, x-pane.tsx, about-pane.tsx, contact-pane.tsx
  copy-email.tsx        client
  theme-toggle.tsx      client
  avatar.tsx, contribution-grid.tsx, rel-time.tsx (client, ticking)
lib/
  constants.ts          WEBSITE_URL (kept), TIMEZONE = 'America/Detroit'
  live.ts               types, snapshot import, pure helpers: ago(), shortAgo(), mood(), latestProject()
  live-client.ts        browser refresh from GitHub public API (section 9.4)
  live-store.tsx        tiny React context: snapshot + client overrides + `now` tick
  panes.ts              PHONE_PATTERN per route: 'sheet' | 'push' | 'inline'
  generated/live.ts     AUTO-GENERATED, gitignored
scripts/
  fetch-live.ts         replaces fetch-github.ts (section 9.3)
  screenshots.mjs       Playwright capture matrix (section 12)
public/
  images/avatar.jpg     256x256 face crop (section 6.4)
  live.json             written by fetch-live.ts at build (gitignore it)
```

Server vs client: keep panes server components wherever the content is static; only time-dependent or interactive bits are client. All pages must render complete, meaningful HTML at build time (static export) so the site works without JavaScript: relative times then show build-time values.

Hydration: anything time-relative renders the build-time value on the server, then updates in `useEffect`. Put `suppressHydrationWarning` on the text nodes that hold times. Never call `Date.now()` during render in a server component that hydrates.

---

## 5. Visual system

### 5.1 Color tokens (from `docs/redesign/reference/desktop.dc.html`)
Define on `:root` (Paper) and `:root[data-theme="dark"]` (Graphite). Also apply Graphite under `@media (prefers-color-scheme: dark)` when `data-theme` is not set to `light`.

| Token | Paper (light) | Graphite (dark) | Use |
|---|---|---|---|
| `--bg` | `#F7F6F2` | `#111110` | page |
| `--surf` | `#FFFFFF` | `#1A1A19` | email card, sheet background |
| `--ink` | `#151412` | `#EEECE7` | primary text, tokens |
| `--sub` | `#56534D` | `#B0ADA7` | secondary text, row subtitles |
| `--s2` | `#96928A` | `#7A7771` | sentence two (large text only, 3:1+) |
| `--faint` | `#76726B` | `#8F8C86` | meta, labels (4.5:1+) |
| `--rule` | `#E5E2DC` | `#262523` | hairlines |
| `--und` | `#CFCBC2` | `#4A4845` | token underline at rest |
| `--live` | `#1F9D55` | `#3FCF7A` | live dot |
| `--idle` | `#D4D1CA` | `#3A3936` | idle dot |
| `--selbg` / `--seltx` | `#151412` / `#F7F6F2` | `#EEECE7` / `#111110` | selected token |
| `--btn` / `--btntx` | `#151412` / `#F7F6F2` | `#EEECE7` / `#111110` | pill buttons |
| `--q0..--q4` | `#ECEAE4 #D3D0C8 #A8A59E #5E5B55 #151412` | `#1F1F1D #3A3936 #6E6C67 #A3A09A #EEECE7` | contribution levels, language bar |

`meta theme-color`: `#F7F6F2` (light) and `#111110` (dark). No other colors anywhere. No gradients, no shadows except the sheet (`0 -16px 40px -18px rgba(0,0,0,.35)`).

### 5.2 Typography (Mona Sans only)
```ts
import { Mona_Sans } from 'next/font/google'
const mona = Mona_Sans({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sans', display: 'swap' })
```
(Verified: Next 15.5.15 ships Mona Sans in `next/font/google` with `wdth` 75 to 125 and `wght` 200 to 900.) Global: `font-variant-numeric: tabular-nums; -webkit-font-smoothing: antialiased`.

| Role | Desktop | Phone | Weight | Tracking | Line height |
|---|---|---|---|---|---|
| Sentences (display) | 38px | 27px | 500 | -0.032em (-0.03em phone) | 1.2 |
| Pane title (h2) | 32px | 24px | 600 | -0.03em | 1.12 |
| Lead (project line) | 17px | 15px | 400, `--sub` | 0 | 1.5 |
| Body | 15px | 15px | 400 | 0 | 1.6 |
| Pane paragraph | 15.5px | 15px | 400 | 0 | 1.65 |
| Project name in rows | 15px | 15px | 550 | 0 | 1.4 |
| Stat number | 22px | 20px | 500 | -0.02em | 1.2 |
| Meta, labels | 13px | 13px | 400 meta / 500 labels, `--faint` | 0 | 1.5 |
| Fact label | 12.5px | 12px | 400, `--faint` | 0 | 1.4 |

Use `clamp()` for the display size between breakpoints: `font-size: clamp(27px, 1.1rem + 1.45vw, 38px)`. Weights used: 400, 500, 550, 600. Nothing else. No uppercase letter-spaced labels. No second font.

### 5.3 Theme switching
- Default: follow the system (`prefers-color-scheme`).
- Toggle: a small text button in the left column top row, after `● Live`: shows `Dark` in light mode and `Light` in dark mode, 13px, `--faint`, hover `--ink`, 44px hit area. Clicking sets `data-theme` on `<html>` and stores `km-theme` = `light|dark` in `localStorage` (wrap in try/catch).
- Anti-flash: keep an inline script in `<head>` that reads `km-theme`; if absent, uses `matchMedia('(prefers-color-scheme: dark)')`; sets `data-theme` before paint. When no stored choice exists, listen for system changes and follow them.
- `color-scheme: light` / `dark` set per theme so form controls and scrollbars match.

### 5.4 Layout and spacing (desktop, >= 1024px)
- Grid: `grid-template-columns: minmax(0, 1fr) clamp(440px, 43vw, 620px)`; height `100dvh`; each column scrolls independently (`overflow-y: auto`, hidden scrollbars are fine but keep keyboard scroll).
- Left column padding: `72px 88px 48px 96px`; flex column, `justify-content: space-between` (top row / sentences / bottom). Sentences block `max-width: 660px`, gap 30px.
- Right pane: `border-left: 1px solid var(--rule)`, padding `72px 96px 64px 72px`.
- Work rows: `padding: 14px 0; border-top: 1px solid var(--rule)`; list closes with a bottom rule. Row = name + `→` (fades in on hover) over the line; right side dot + short time.
- Facts rows: 3-column grid between two hairlines, `padding: 16px 0`, gap 16px.
- Radii: tokens when selected 7px, pills 999px, email card and sheet 12px / 22px.
- Between 768px and 1023px (tablet): use the phone layout inside a centered column `max-width: 600px`.

### 5.5 Motion (CSS only, no animation library)
| What | Spec |
|---|---|
| Pane change | fade + rise 8px, 240ms, `cubic-bezier(.2,.7,.2,1)`; key the animation on the pathname |
| Token underline / selected fill | 200ms color and background transitions |
| Row hover arrow | opacity 0 → 1 and translateX(-4px → 0), 150ms |
| Live dot | pulse ring 2.4s infinite (`box-shadow` from 55% `--live` to transparent) |
| Phone sheet | translateY(60px) → 0 plus opacity, 280ms; scrim fades in |
| Phone push page | translateX(40px) → 0 plus opacity, 260ms |
| Phone inline | fade + rise 6px, 240ms |
`@media (prefers-reduced-motion: reduce)`: disable all of the above (no pulse, instant panes).

### 5.6 Selected token style
Rest: ink color, 2px underline in `--und`, offset 7px (5px phone). Hover: underline `--ink`. Selected (`aria-current="page"`): background `--selbg`, text `--seltx`, no underline, padding `0 .16em`, margin `0 -.08em`, radius 7px, `box-decoration-break: clone` so wrapped tokens look right.

---

## 6. Components and details

### 6.1 Left column
Top row, sentences, Now, footer as in section 2. The name links to `/`. On phone, the Now line sits after the sentences and the Work list follows (section 7).

### 6.2 Work list
Rows link to `/apps/[slug]`. Right side: dot (`--live` if last push < 7 days, else `--idle`) + short time (`now`, `12m ago`, `3h ago`, `6d ago`, `Nov 2025`) or `private` for Kintsugi. Order per section 2.6.

### 6.3 Project pane
Meta line `{repo} · {state}` (Kintsugi: `private repo · Personal`), h2 name, lead line, paragraph, facts (Stack, Started, Last push), `Recent commits` (up to 3: dot live for the newest if < 7 days, headline, short time, each links to the commit URL) or the quiet note, then links (first as pill).

### 6.4 Avatar
Source photo: `public/images/kuladeep.jpg` (481x620, face centered near x 54.7%, y 34.7%). Make a square face crop once, commit it as `public/images/avatar.jpg` at 256x256 (plus a `.webp`). Render circular at 40, 48 or 64px with `<img width height alt="">` (decorative next to the name). Delete nothing else from `public/images` until the crop exists; the original can then be removed from `public/` (keep it out of the build).

### 6.5 Contribution grid
From GraphQL `contributionCalendar.weeks[].contributionDays[]` using `contributionLevel` (`NONE, FIRST_QUARTILE, SECOND_QUARTILE, THIRD_QUARTILE, FOURTH_QUARTILE` → `--q0..--q4`). Desktop: last 40 weeks, 9px squares, 2px gap, radius 2px, column-major (`grid-auto-flow: column; grid-template-rows: repeat(7, 9px)`). Phone: last 30 weeks, 8px squares. Add `title` on each cell: `Aug 3 · 4 contributions` and an `aria-label` on the grid summarizing the total. Language bar: 6px tall, radius 3px, segments `--q4, --q3, --q2, --q1, --q0`, legend below.

### 6.6 Copy email
Button in the Contact card; also on phone. Announces "Copied" via `aria-live="polite"`.

---

## 7. Phone (< 768px) and tablet (768 to 1023px)

### 7.1 Base layout
Single column, padding `60px 24px 40px`, gap 20px: top row (name, time with live dot, theme toggle) → sentence one → sentence two → Now → Work list (rows min-height 52px). This is the `/` experience and it stays visible underneath sheets.

### 7.2 Patterns
- **Bottom sheet:** fixed to the bottom, `max-height: 78dvh`, own scroll, `--surf` background, top radius 22px, drag handle bar (36x4, `--rule`), header row with the pane name (13px label) and a 44px close button (SVG ×). Scrim `rgba(10,10,10,.32)` over the page; tapping it closes. `role="dialog" aria-modal="true" aria-labelledby`. Lock body scroll while open. Focus the sheet on open; return focus to the token on close. Swipe down to close is a nice-to-have (Phase 8, optional).
- **Push page:** fixed full-screen layer, `--bg`, sticky top bar (88px / title / 88px grid, safe-area top padding 48px) with `← Back`. Content scrolls inside. Browser back works because it is a real route.
- **Inline:** the pane renders as a card (`--surf`, 1px `--rule`, radius 16px, padding `16px 18px 20px`) directly after sentence two, with a small header and close button; the page scrolls normally.

### 7.3 Mapping (`lib/panes.ts`)
```ts
export const PHONE_PATTERN = {
  github: 'sheet', x: 'sheet', contact: 'sheet',
  about: 'push', project: 'push',
} as const
```
Kuladeep approved all three patterns; this mapping (quick cards as sheets, long reads as pages) is the implementer's default and changing a value must be the only thing needed to switch a route to another pattern, including `inline`.

### 7.4 Implementation note
Because panes are routes, on phone the shell always renders the base layout (7.1) and wraps `children` in the pattern chosen by the current route. On `/` there is no overlay. Use CSS (`@media (max-width: 767px)`) for layout switches and a client check (`matchMedia`) only for behavior like scroll lock and focus management. The desktop right pane and the phone overlay are the same `children`, not two copies of content.

---

## 8. Content model changes (`app/signals.ts`)

Keep `SIGNALS` as the single content source and keep ids/slugs. Change the type to:
```ts
export type Signal = {
  id: string; slug: string; type: 'project'
  name: string
  line: string            // row subtitle, section 2.6
  tagline: string         // kept for feeds
  body: string            // project pane paragraph, section 2.6
  description: string     // kept for feeds and meta description
  state: 'active' | 'shipped' | 'paused' | 'archived'
  stateLabel: string      // 'Active', 'In daily use', 'Prototype', ...
  stack: string           // 'Go · AWS'
  started: string         // display string, section 2.6
  dateFirst: string; dateLast: string
  repos: string[]         // [] for Kintsugi
  isPrivate?: boolean
  links: { label: string; href: string }[]
  quietNote?: string
  repoNote?: string       // Rune only
  collaborator?: { name: string; href: string }
  tags: string[]
}
```
Remove: `status`, `STATUS_DOT`, `STATUS_LABEL`, `statusNote`, `featureRank`, `signatureRef`, `image`, `video`, `embedUrl`, `accentColor`, `deviceType`, `article`, `advisory`, `PROJECTS`, `AppProject`, `sortedByRecency`, `sortedByRelevance`, `CERTIFICATIONS` (inline the CEH fact in About). Migrate `app/feed.xml/route.ts` and `app/api/signals.json/route.ts` to `sortedByStart()` in the same commit (this is the "migrate all callers in the same pass" condition from the old CLAUDE.md, so removing the aliases is allowed).

Add constants: `NOW`, `NOW_UPDATED`, `EMAIL = 'mantrikuladeep@gmail.com'`, `X_HANDLE = 'kuladeepmantri'`, `GITHUB_USER = 'kuladeepmantri'`, `INSTAGRAM = { handle: 'kuladeep.mantri', href: 'https://www.instagram.com/kuladeep.mantri/' }`.

---

## 9. Live data

### 9.1 What is live
| Element | Source | Freshness |
|---|---|---|
| Sentence: latest project + push time | GitHub | build (hourly and on push) + browser refresh |
| Sentence: last X post time | X | build (hourly) |
| Sentence: local time + mood | browser clock, America/Detroit | ticks every 30 s |
| Work list dots, times, order | GitHub | build + browser refresh |
| Project pane: last push, recent commits | GitHub | build + browser refresh |
| GitHub pane: contributions, grid, languages, most active | GitHub | build |
| X pane: bio, latest posts | X | build |
| Footer: build sha, "rebuilt N minutes ago" | build env | build; the "ago" ticks |

### 9.2 Snapshot shape (`lib/generated/live.ts` and `public/live.json`)
```ts
export type LiveSnapshot = {
  builtAt: string; sha: string
  github: null | {
    user: { name: string; avatarUrl: string; bio: string | null }
    totalContributions: number
    weeks: { date: string; count: number; level: 0|1|2|3|4 }[][]
    languages: { name: string; bytes: number }[]   // top 5
    repos: Record<string, {          // key 'owner/name'
      isPrivate: boolean; url: string; pushedAt: string | null
      commits30d: number
      recent: { sha: string; message: string; date: string; url: string }[]  // up to 3
    }>
  }
  x: null | {
    userId: string
    profileFetchedAt: string
    bio: string; name: string; avatarUrl: string
    posts: { id: string; text: string; createdAt: string; url: string }[]  // up to 5, newest first
    sinceId: string | null
  }
}
```

### 9.3 Build-time fetch (`scripts/fetch-live.ts`, runs as `predev` and `prebuild`)
Replaces `scripts/fetch-github.ts` and keeps its rules: zero runtime deps, **never throws**, degrades to `null` sections, keeps the last good data.

1. **Load the previous snapshot:** `fetch(WEBSITE_URL + '/live.json')` (the deployed site is the cache between CI runs). On failure, fall back to the local `lib/generated/live.ts` if present, else empty.
2. **GitHub** (token: `GH_PAT` if set, else `GITHUB_TOKEN`; skip section if none). One GraphQL request:
   - `user(login: "kuladeepmantri")`: `name avatarUrl bio`, `contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } }`, `repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) { nodes { languages(first: 5, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } } } }` → aggregate top 5 languages.
   - One aliased `repository(owner, name)` per repo in `SIGNALS[].repos`: `isPrivate url pushedAt defaultBranchRef { target { ... on Commit { history(first: 3) { nodes { oid messageHeadline committedDate url } } recent: history(since: "<30 days ago ISO>") { totalCount } } } }`.
   - Private or missing repos: store `{ isPrivate: true, recent: [] }`; never render their commit messages.
3. **X** (token `X_BEARER_TOKEN`; skip section if missing, keep previous `x` from the cache):
   - Profile: only if the cached `profileFetchedAt` is older than 24 h (or missing): `GET https://api.x.com/2/users/by/username/kuladeepmantri?user.fields=description,profile_image_url,name` (store `userId`).
   - Posts: every build: `GET https://api.x.com/2/users/{userId}/tweets?max_results=5&exclude=replies,retweets&tweet.fields=created_at` plus `&since_id={sinceId}` when cached. Merge new posts in front of cached ones, keep 5, update `sinceId` to the newest id. (`max_results` minimum is 5 on this endpoint.)
   - Cost: X moved to pay-per-use in Feb 2026 (about $0.005 per post read, about $0.01 per user lookup). With `since_id`, hourly builds read only new posts, and the profile is read once a day. **Before enabling, confirm current pricing and set a spend limit in the X developer console.**
4. Write `lib/generated/live.ts` (typed module, `export const LIVE: LiveSnapshot = ...`) and `public/live.json`. Add both to `.gitignore`. Log a one-line summary per section.
5. `sha` = `process.env.GITHUB_SHA?.slice(0, 7) ?? git rev-parse --short HEAD ?? 'local'`.

### 9.4 Browser refresh (`lib/live-client.ts`)
Makes a push visible within seconds without a rebuild. Public, unauthenticated GitHub API, 60 requests per hour per visitor IP.
1. On first load (and when the tab becomes visible again after 10+ minutes): `GET https://api.github.com/users/kuladeepmantri/events/public?per_page=30`. Cache the response in `sessionStorage` for 10 minutes.
2. Keep `PushEvent`s whose `repo.name` is one of the project repos. **Since Oct 7, 2025 the Events API no longer includes the `commits` array or commit messages in PushEvent payloads**, so events only give "which repo, when".
3. For each project repo whose newest event `created_at` is newer than the snapshot's latest commit date: `GET https://api.github.com/repos/{owner}/{name}/commits?per_page=3` and replace that repo's `recent` and `pushedAt`. At most 2 such calls per page load.
4. Update the live store; the sentence, the Work list order and dots, and an open project pane re-render. Any error, 403 or 429: keep the snapshot silently. No X calls from the browser, ever.

### 9.5 Derived values (`lib/live.ts`, pure, unit-testable)
- `latestProject(snapshot, overrides)`: project with the newest `recent[0].date` among public project repos. Exclude this site's repo. Tie-break by `dateLast`.
- `mostActiveThisMonth`: max `commits30d`.
- `ago(date, now)` long form and `shortAgo(date, now)` per section 2.3 and 6.2.
- `mood(now)` per section 2.3, computed in America/Detroit via `Intl.DateTimeFormat(..., { timeZone: 'America/Detroit', hour: 'numeric', hour12: false, weekday: 'short' })`.
- A single `useNow()` hook ticking every 30 s (one interval for the whole page).

### 9.6 Rebuild triggers (`.github/workflows/nextjs.yml`)
```yaml
on:
  push:
    branches: ["main"]
  schedule:
    - cron: "7 * * * *"          # hourly, off the top of the hour
  repository_dispatch:
    types: [project-push]
  workflow_dispatch:
```
Build step env:
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GH_PAT: ${{ secrets.GH_PAT }}                 # optional, read-only fine-grained PAT
  X_BEARER_TOKEN: ${{ secrets.X_BEARER_TOKEN }} # optional
```
Keep `concurrency: group: pages, cancel-in-progress: false`.
Note: GitHub disables scheduled workflows in a public repo after 60 days without repository activity; dispatches and pushes keep builds happening, and the schedule can be re-enabled from the Actions tab.

### 9.7 Project repos ping the site on push
Add `.github/workflows/notify-site.yml` to each public project repo (`kuladeepmantri/auris`, `kuladeepmantri/rune`, `kuladeepmantri/shipcrew`, `kuladeepmantri/untilithappens`, `kuladeepmantri/DeID-Anonymizer`, `getnullpkg/kubereach`):
```yaml
name: Notify site
on: push
jobs:
  ping:
    if: github.ref == format('refs/heads/{0}', github.event.repository.default_branch)
    runs-on: ubuntu-latest
    steps:
      - name: Ask kuladeepmantri.com to rebuild
        run: |
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.SITE_DISPATCH_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/kuladeepmantri/kuladeepmantri.github.io/dispatches \
            -d '{"event_type":"project-push","client_payload":{"repo":"${{ github.repository }}"}}'
```
`SITE_DISPATCH_TOKEN`: a fine-grained PAT scoped to `kuladeepmantri/kuladeepmantri.github.io` with **Contents: Read and write** (required by the dispatches endpoint), saved as a secret in each project repo (for `getnullpkg/kubereach`, in that org repo). Kuladeep does this part (section 14). The implementer only writes the file content into the plan follow-up or PR description; it does not push to other repos.

### 9.8 Costs
| Item | Cost |
|---|---|
| GitHub Pages, Actions (public repo), GraphQL, public REST | $0 |
| X API: ~24 post reads per day only when there are new posts, 1 profile read per day | roughly $1 a month or less; confirm in the X console |

---

## 10. Accessibility, performance, SEO

- Semantics: one `h1` (visually the small `Kuladeep Mantri` in the top row is fine as the `h1`; sentences are paragraphs), pane titles `h2`, labels as `h3` or plain text. Tokens are links with visible focus rings (`outline: 2px solid var(--ink); outline-offset: 4px`). Skip link to the pane.
- Contrast: all meta text uses `--faint` (4.5:1 on both backgrounds); `--s2` is only for the 27 to 38px sentence text (3:1+). Verify with a contrast checker during Phase 8.
- Touch targets >= 44px on phone (rows, close, back, toggle, pills).
- Reduced motion honored (section 5.5).
- No JavaScript: everything readable, all links work, sheets and push pages are simply pages.
- Performance: no 3D, no animation or smooth-scroll libraries, one variable font, one avatar image. Target first-load JS under 110 kB gzip for `/`, Lighthouse performance and accessibility 95+ on mobile.
- SEO: `metadata.title.default` `Kuladeep Mantri · cybersecurity engineer`, template `%s · Kuladeep Mantri`; description = sentence one. Per-route titles per section 3; project pages use `description`. Keep `metadataBase`, no global canonical (as before), `/now` canonical `/`. Sitemap lists `/`, `/about`, `/github`, `/x`, `/contact`, and the seven `/apps/*`. Optional: a static `public/og.png` (1200x630, Paper, sentence one in Mona Sans) captured with the screenshot script.

---

## 11. Removal list

Delete:
- `components/apps/**`, `components/home/**`, `components/gist/**`, `components/ui/**`
- `components/car-preview.tsx`, `components/identity-block.tsx`, `components/keyboard-help.tsx`, `components/layout-shell.tsx`, `components/signal-entry.tsx`, `components/signal-log.tsx`
- `hooks/use-arrow-nav.ts`, `hooks/use-theme.ts` (replaced by `components/site/theme-toggle.tsx`), then the empty `hooks/`
- `app/apps/{auris,deid,kintsugi,kubereach,rune,shipcrew,untilithappens}/` (the per-project `content.ts` folders; their facts now live in section 2.6 and git history)
- `app/header.tsx`, `app/footer.tsx`
- `public/models/` (the Accord `.glb` and poster), `public/videos/`, `public/images/auris.png`, `public/images/shipmate.png`, `public/images/untilithappens.png`, `public/images/Screenshot 2025-12-06 at 12.59.40 PM.png`
- `scripts/fetch-github.ts` and `lib/github.ts` (replaced by `fetch-live.ts` / `live.ts`), `lib/utils.ts` if `cn` is unused
- Dependencies: `@radix-ui/react-dialog`, `@react-three/drei`, `@react-three/fiber`, `three`, `cmdk`, `lenis`, `motion`, `lucide-react`, and `clsx` + `tailwind-merge` if unused. Use `npm uninstall` so the lockfile updates.

Keep: `app/signals.ts` (rewritten), `lib/constants.ts`, `lib/format-date.ts` (if still used), `app/icon.svg`, feeds, sitemap, robots, Tailwind v4 (use it for layout utilities or write plain CSS in `globals.css`; either is fine, stay consistent).

Docs:
- Add a first line to `docs/plan.md`, `docs/design-language.md`, `docs/blueprints/*.md`, and `docs/brain/03-design-system.md`: `> Superseded by docs/redesign/PLAN.md (2026-09-27).`
- Rewrite `CLAUDE.md` to describe the new architecture (shell, panes as routes, live snapshot, fetch-live, workflows, tokens, theme) and drop the immersive-page and alias sections.

---

## 12. Verification and screenshots

Quality gates (no test suite exists): `npm run lint` and `npm run build` must pass. Add small unit tests for `lib/live.ts` pure functions only if a runner is trivial to add (optional).

Screenshot matrix (`scripts/screenshots.mjs`, Playwright):
- Serve the static export: `npx serve out -l 4173` (or `python3 -m http.server 4173 -d out`).
- Chromium is preinstalled in the cloud environment (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); do not run `playwright install`. Add `playwright` as a devDependency; if its version does not match the installed browser, launch with `executablePath` pointing into `/opt/pw-browsers`.
- Routes: `/`, `/about`, `/apps/kubereach`, `/apps/kintsugi`, `/github`, `/x`, `/contact`, `/does-not-exist`.
- Viewports: desktop `1440x900`, phone `390x844` (with `isMobile: true`, `hasTouch: true`), tablet `834x1112`.
- Themes: `page.emulateMedia({ colorScheme: 'light' | 'dark' })` with `localStorage` cleared, plus one run with the toggle clicked to confirm it overrides the system.
- Also: `prefers-reduced-motion: reduce` on `/github` phone; keyboard pass (Tab through tokens, Enter opens, Escape closes) recorded as a short sequence of screenshots.
- Output to `.screenshots/` (gitignored). Name files `{viewport}-{theme}-{route}.png`.
- Compare against the canvas boards: `Paper · warm white` vs `desktop-light-home.png`, `Graphite · dark` vs `desktop-dark-home.png`, `Phone A` vs `phone-light-x.png`, `Phone B` vs `phone-light-apps-kubereach.png`, `Phone A · Graphite` vs `phone-dark-contact.png`. Differences should be limited to real data vs sample data.
- Attach the key screenshots to the PR description (or publish them together as one private artifact page and link it).

Manual checks:
- No horizontal scroll at 320px wide.
- Each column scrolls independently on desktop; the left column never jumps when panes change.
- With no tokens set (`GITHUB_TOKEN`, `X_BEARER_TOKEN` unset), `npm run build` passes and the sentence degrades per section 2.3.
- Relative times tick without a reload; theme persists across reloads; no flash of the wrong theme.
- Lighthouse mobile on `/`: performance, accessibility, best practices, SEO all 95+.

Acceptance criteria (done means all true):
1. The home page matches the Paper board in light mode and the Graphite board in dark mode, at 1440x900.
2. Every token and every project row opens the right pane, with the selected style and breadcrumb, and Escape or Close returns to Work.
3. Phone: GitHub, X, Contact open as bottom sheets; About and projects open as push pages; switching a route to `inline` in `lib/panes.ts` works.
4. The sentence and Work list show real data from the build, and a new public push appears after a reload within a minute (browser refresh) even before the hourly rebuild.
5. Build never fails because of an API.
6. Lint and build pass; no removed dependency remains in `package.json`.

---

## 13. Implementation phases (commit after each)

Work on the session's designated branch. Commit messages: conventional style (`feat(site): ...`, `chore(deps): ...`).

1. **Tear down.** Delete everything in section 11, uninstall dependencies, replace `app/page.tsx` with a placeholder, make lint and build pass. Commit `chore(site): remove the old immersive site`.
2. **Tokens, font, theme.** New `globals.css` (section 5), Mona Sans in `layout.tsx`, anti-flash script, theme toggle, `meta theme-color`. Commit.
3. **Content model.** Rewrite `app/signals.ts` (section 8) with the copy from section 2; migrate feeds; sitemap routes. Commit.
4. **Shell and panes (desktop).** `components/site/*`, all routes from section 3, using a hand-written stub `LiveSnapshot` so the UI can be built before the fetch exists. Match the Paper and Graphite boards. Commit.
5. **Phone and tablet.** Sheet, push, inline patterns, `lib/panes.ts`, focus and scroll management, safe areas. Commit.
6. **Build-time live data.** `scripts/fetch-live.ts`, `lib/live.ts`, `lib/generated/live.ts`, `public/live.json`, `.gitignore`, workflow triggers and env (section 9.6). Commit.
7. **Browser refresh and ticking.** `lib/live-client.ts`, `lib/live-store.tsx`, `useNow`. Commit.
8. **SEO, 404, docs.** Metadata, OG image (optional), `CLAUDE.md` rewrite, superseded notes. Commit.
9. **Verify.** Section 12 in full, fix what it finds, then open the PR with screenshots and the section 14 checklist for Kuladeep.

---

## 14. What Kuladeep needs to do (outside the code)

1. Confirm the **Now** line (section 2.4) and the **Instagram** handle (section 2.8).
2. GitHub secrets on `kuladeepmantri/kuladeepmantri.github.io`:
   - `GH_PAT` (optional): fine-grained, read-only, public repositories; makes the contribution calendar complete.
   - `X_BEARER_TOKEN`: from the X developer console (pay-per-use app, spend limit set).
3. For push-triggered rebuilds: create `SITE_DISPATCH_TOKEN` (fine-grained PAT on `kuladeepmantri/kuladeepmantri.github.io`, Contents: Read and write) and add it as a secret in each project repo, then add `notify-site.yml` (section 9.7) to each.
4. After merge to `main`, check the Actions tab: the hourly schedule is active and the first run fetched GitHub and X data (the build log prints a summary line per section).

---

## 15. Explored and rejected (do not reintroduce)

- Round 1 layouts (Index, Columns, Manual/man page, Letter): read like 2020 sites.
- Round 2 (Receipts, Instrument dashboard, dark Stream): too heavy.
- Round 3 minimal single column and mono dark: fine but not distinctive.
- Round 4 split variants (live rows, panes, ledger): the living sentence won.
- Round 5 hover cards, rotating line, profiles in place: folded into the final; the rotating line was dropped, the time-of-day clause was kept.
- Palettes Snow (cobalt) and Sage: rejected. Paper and Graphite only.
- Fonts Google Sans Flex and Host Grotesk: rejected for Mona Sans.
- Follower counts, visitor counts, 3D, gradients, emoji, a second font: never.
