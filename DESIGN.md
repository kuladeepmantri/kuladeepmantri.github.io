# Design

The design and data rules for kuladeepmantri.com. Use this file to change the
site, or to rebuild it somewhere else, without guessing. The code has the
final word: if this file and the code disagree, fix one of them in the same
change.

and the build spec is `PLAN.md` in the same folder. Both are history now; the
site has moved past them in places (no category tags, a theme switch, ruled
rows instead of cards).

Contents:

1. [Purpose and principles](#1-purpose-and-principles)
2. [Tokens, theme and type](#2-tokens-theme-and-type)
3. [Page anatomy](#3-page-anatomy)
4. [Components](#4-components)
5. [Motion](#5-motion)
6. [Responsive behavior](#6-responsive-behavior)
7. [Accessibility](#7-accessibility)
8. [Content and voice](#8-content-and-voice)
9. [Live data](#9-live-data)
10. [Adding or changing a project](#10-adding-or-changing-a-project)
11. [QA checklist](#11-qa-checklist)
12. [File map](#12-file-map)

---

## 1. Purpose and principles

This is a security engineer's personal site. It shows the work and the latest
activity, and it should not read like a portfolio template.

- **Quiet.** One page. Motion is the short list in [Motion](#5-motion), and
  all of it stops under reduced motion. Background art, sound, status dots,
  category tags and a wordmark stay out.
- **Text first.** One 640px column, Geist at 16px, headings the same size as
  body text. Weight (500), colour (`--ink` and `--mute`) and small mono caps
  carry the hierarchy. The layout follows emilkowal.ski.
- **Hairlines for structure.** The slider is the only card on the page.
  Projects, the GitHub stats and the About facts are separated by hairlines
  and have no border of their own. The one exception is the featured project,
  which sits on a soft `--panel` band with no visible border.
- **An engineer's site.** The page opens on the newest post, release and
  commit, then the projects, then X and GitHub. The only job title outside
  About is "Security Engineer".
- **Every value is live.** Every number, date, post and commit comes from the
  build's snapshot (`lib/generated/live.ts`) or from `SIGNALS` in
  `app/signals.ts`. When a source has no data, the page drops that element
  instead of showing a guess or a placeholder.
- **One source per fact.** Projects live in `SIGNALS`, tokens and measurements
  in `app/globals.css`, the About text in `components/home/about.tsx`, and
  site constants (`EMAIL`, handles) in `app/signals.ts`.

## 2. Tokens, theme and type

### Colour tokens

Defined on `:root` in `app/globals.css`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#fdfdfc` | `#161615` | Page background. Also `theme-color`, and the manifest's colours (light). |
| `--panel` | `#f6f6f3` | `#1c1c1b` | Slider card, the featured project's band, segmented-control track. |
| `--ink` | `#21201c` | `#ecebe7` | Primary text, progress fill, links in project meta rows, every focus ring. |
| `--mute` | `#63635e` | `#9c9b95` | Secondary text, caps labels, icons, fallback language dot. |
| `--line` | `rgba(33, 32, 28, 0.09)` | `rgba(236, 235, 231, 0.1)` | Hairlines: project rows, the stats strip, About facts, the footer rule, the slider and control track borders. |
| `--line2` | `rgba(33, 32, 28, 0.2)` | `rgba(236, 235, 231, 0.22)` | Tag pill border, link underlines (including the project name on row hover). |
| `--edge` | `rgba(33, 32, 28, 0.55)` | `rgba(236, 235, 231, 0.4)` | The faintest line that still marks a control, 3:1 against `--panel`: slider progress tracks, and the 1px inset ring on the selected option of a segmented control. |
| `--tab-on` | `#fff` | `#2a2a28` | The selected option's background in a segmented control (the sliding indicator). |
| `--hover` | `rgba(128, 128, 120, 0.07)` | same | Hover background on post and repository rows (`.hov`). |

Other tokens: `--bleed` (16px, how far hover and focus surfaces reach past
the column, see [Page anatomy](#3-page-anatomy)), `--sans` (Geist, then
Helvetica Neue, Arial), `--mono` (Geist Mono, then ui-monospace,
SFMono-Regular, Menlo), and `--ease` (`cubic-bezier(0.2, 0.7, 0, 1)`).

A few colours sit outside the tokens on purpose. Language dots use GitHub's
colour for that language, from the snapshot, and fall back to `--mute`. The
verified badge uses X's blue `#1d9bf0` with a white check. Nothing on the
page has a drop shadow.

Contrast, measured from the tokens:

| Colour | On `--bg` | On `--panel` | On `--tab-on` |
| --- | --- | --- | --- |
| `--mute`, light | 5.93:1 | 5.58:1 | 6.04:1 |
| `--mute`, dark | 6.50:1 | 6.12:1 | 5.16:1 |
| `--ink`, light and dark | 15:1 or more | 14:1 or more | 12:1 or more |
| `--edge`, light | 3.72:1 | 3.45:1 | 3.74:1 |
| `--edge`, dark | 3.40:1 | 3.38:1 | 3.22:1 |

Keep muted text at 4.5:1 or above and `--edge` at 3:1 or above when a token
changes.

### Theme

The site follows the system by default. A visitor can pick Light or Dark with
the theme switch in the footer ([Theme switch](#46-theme-switch)).

- **Light** is the base: the tokens on `:root`, with `color-scheme: light`.
- **Dark** applies in two places that must hold the same values:
  `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`
  for the system setting, and `:root[data-theme='dark']` for a visitor's pick.
  Both set `color-scheme: dark`. Change a dark token in both blocks.
- **The pick** is stored in `localStorage` under `THEME_KEY` (`'km-theme'`,
  `lib/constants.ts`). "System" removes the key.
- **Before first paint**, the `BOOT` inline script in `app/layout.tsx` reads
  the key and sets `data-theme` on `<html>`, so a forced theme never flashes
  the system one. For a saved theme it also sets both `theme-color` metas to
  that theme's `--bg`, once right away and again at `DOMContentLoaded`. The
  same script also turns a `//host/...` path into `/host/...`, which would
  otherwise crash Next. `<html>` carries `suppressHydrationWarning` because of
  it.
- **`theme-color`.** The viewport in `app/layout.tsx` declares
  `colorScheme: 'light dark'` and one `theme-color` meta per scheme (`#fdfdfc`
  light, `#161615` dark), matching `--bg`. `BOOT` points both at the saved
  theme before the page hydrates. After that the switch rewrites them on every
  change: both to the forced colour, or back to one per scheme for System.

### Fonts

Geist (`--font-sans`) and Geist Mono (`--font-mono`), both loaded with
`next/font/google` in `app/layout.tsx` with `display: 'swap'`. next/font
self-hosts them, so the CSP needs no font origin. The page uses two weights:
400 and 500.

Geist's latin subset has no ★, ↗ or ↑, so those three are inline SVGs in
`components/home/icons.tsx` (`Star`, `ArrowUpRight`, `ArrowUp`): 1em boxes
in `currentColor`, class `.glyph`, set 0.125em below the baseline. Never type
them as text.

### Type scale

Every size in `app/globals.css`. Body is 16px with a 1.65 line height. Caps
labels are 11px mono, uppercase, `letter-spacing: 0.06em`.

| Size | Font | Line height, weight, tracking | Used for (class) |
| --- | --- | --- | --- |
| 11px | mono, caps | 1.65, 400, 0.06em | "Pinned", "Repositories", footer labels (`.cap`) |
| 11.5px | mono | 1.65, tabular numbers | Slider counter "1 / 3" (`.count`) |
| 12.5px | mono | 1.65 | Slide time stamps, release facts row, commit meta, project tech and status (`.row-tech`), project meta rows, repo language (`.mono`) |
| 12.5px | sans | 1.65 | Theme switch options (`.theme .seg`) |
| 13px | sans | 1.65 | "Copy address" button (`.copy`), footer bottom row (`.fbottom`) |
| 13.5px | sans | 1.4 | Stat labels (`.stat span`) |
| 13.5px | mono | 1.65 | Repository names (`.repo-name`) |
| 14px | sans | 1.65 | Slide source row (`.src`), Elsewhere tabs (`.seg`) |
| 14px | mono | 1.65 | Release tag pill (`.pill`) |
| 14.5px | sans | 1.65 | Repository line (`.repo-line`) |
| 15px | sans | 1.55 | Project summary (`.row p`) |
| 15px | sans | 1.3 | Post header, name and handle (`.post-who`) |
| 15px | sans | 1.65 | About facts (`.facts`), footer column text (`.fgrid .body`) |
| 15.5px | sans | 1.55 | Post body in the X tab (`.post-body`) |
| 15.5px | mono | 1.55 | Commit message on the slider (`.commit-msg`) |
| 16px | sans | 1.65, 400 or 500 | Body, `h1`, `h2`, project names (`.row h3`, 500, the featured one too), release burst line, About |
| 18px | sans | 1.5, -0.01em | Post text on the slider (`.post-text`) |
| 28px | sans | 1.1, 500, -0.035em, tabular numbers | Stat values (`.stat b`) |
| 30px | sans | 1.1, 500, -0.035em | Release name on the slider (`.release-name`) |

### Radii

18px slider card (17px on the slide link inside it), 12px posts and the
featured project's band (and its focus ring), 10px project row focus ring, 9px
segmented-control track, 8px slider buttons and repository rows, 7px segmented
options and their indicator, 6px focus ring on slider bars, slider buttons and
segmented options, 4px focus ring everywhere else, 2px progress tracks, 999px
tag pill, 50% portraits. Other project rows and the stats have no radius
because they have no box.

## 3. Page anatomy

The whole site is `app/page.tsx`. Everything sits in one column, `.col`
(`id="top"`): `max-width: 640px`, `margin: 0 auto`, `padding: 128px 24px 0`.
Boxes use `border-box`, so the text measure is 592px. Every `section` has
`margin-top: 80px`. Sections, project rows and the footer have
`scroll-margin-top: 24px`, so an anchor link doesn't land flush against the
top edge.

Text stays on the column. Hover and focus surfaces (post rows, repository
rows, the project row's click target, the featured project's band) reach
`--bleed` (16px) past it on each side, with padding that puts their text
back on the column.

```
.col   max-width 640px, padding 128px 24px 0 (592px measure)
|
|-- header.intro         56px portrait, name, "Security Engineer in Michigan"
|      48px
|-- .slider              card, at least 232px tall
|      80px
|-- section#projects     h2, 8px, featured band, 8px, ruled rows
|      80px
|-- section#elsewhere    h2 and tabs on one row, 12px, the open panel
|      80px
|-- section#about        h2, 14px, two paragraphs 16px apart, 28px, facts list
|      112px
'-- footer#contact       hairline, 28px, three columns, 40px,
                         bottom row (copyright, theme switch, back to top), 40px
```

1. **Header** (`header.intro`). Flex row, centred, 16px gap, line height 1.45.
   A 56px round portrait, then "Kuladeep Mantri" (`h1`, 16px, 500) over
   "Security Engineer in Michigan" (muted).
2. **Slider** (`.slider`, 48px below the header). See [Slider](#41-slider).
3. **Projects** (`section#projects`). `h2` "Projects", then the index 8px
   below it. See [Projects](#42-projects).
4. **Elsewhere** (`section#elsewhere`). `.section-head` puts the `h2` on the
   left and the tabs on the right (flex, wrapping, `space-between`, gaps of
   8px by 16px), 12px above the panel. The tabs are taller than the heading,
   so a head that holds them (`.section-head:has(.seglist)`) has
   `margin-top: -8px` to keep the heading on the 80px rhythm. See
   [Elsewhere](#43-elsewhere).
5. **About** (`section#about`). `h2` with 14px below, two paragraphs 16px
   apart, then the facts list 28px below. See [About](#44-about).
6. **Footer** (`footer#contact`). 112px below About, a 1px `--line` top border,
   `padding: 28px 0 40px`. See [Footer](#45-footer).

The header and footer sit outside `<main>`. The slider and the three sections
are inside it.

## 4. Components

All in `components/home/`. Server components render once at build time.
Client components hydrate and read the shared live store (`useLive()` from
`lib/live-store.tsx`).

### 4.1 Slider

`slider.tsx`, client. The newest post, release and commit, one at a time.

**Card.** 1px `--line` border, 18px radius, `--panel` background,
`overflow: hidden`. All slides share one grid cell (`.slides`, `display: grid`,
each `.slide` at `grid-area: 1 / 1`), so the card is as tall as its tallest
slide and keeps that height between slides. `.slides` has `min-height: 230px`,
so with the border the card is at least 232px tall. On phones it grows to fit
the tallest slide.

**Slides,** in this order. The slider drops a slide whose source has no data.
With no slides it doesn't render. With one, the card gets `.single`: no
controls, no 230px minimum, and the slide link's bottom padding drops to
22px, so no space is kept for controls that aren't there.

| Slide | Source row | Body | Links to |
| --- | --- | --- | --- |
| Latest post | X logo, "Latest post", relative time | Post text, 18px, clamped to 4 lines | The post on X |
| Latest release | GitHub logo, "Latest release", date | Project name (30px) and tag pill. The burst sentence, e.g. "Six releases in three days, July 17 to 19." A mono row: language dot and name, star count, forks (only when there are any), SPDX license. | The release page, or the repo's releases page |
| Latest commit | GitHub logo, "Latest commit", relative time | Commit headline in mono 15.5px, clamped to 3 lines, then `owner/repo · shortsha · one of N commits` ("one of N" only when N > 1) | The commit on GitHub |

Each slide is a single link (`.slide-link`) with `padding: 22px 22px 62px`. The
bottom padding leaves room for the controls. The source row (`.src`) is 14px
and muted, with the time stamp pushed right, and the body starts 16px below
it. The latest post is the newest readable post that isn't the pinned one
(see [Elsewhere](#43-elsewhere)). The latest release is the newest published
release across all project repos. The browser computes the latest commit from
the live store, so the browser refresh can replace it in place.

**Controls** (`.chrome`). Placed 22px from the left and right edges and 18px
from the bottom, with 14px gaps.

- **Progress bars.** One `<button class="bar">` per slide, 5px apart. Each is
  a 24px tall hit target (11px padding above and below) that draws a 2px
  track (`--edge`) with an `--ink` fill. Bars before the current slide are
  full and bars after it are empty. Clicking a bar jumps to its slide.
- **Counter.** "1 / 3", mono 11.5px, muted, `aria-hidden` because the bars
  carry the same information. It is hidden at 360px and below.
- **Buttons** (`.navs`, 2px apart): pause or play, then previous, then next.
  Each is 28 by 28px with an 8px radius and its icon in `--mute`. Where hover
  is real (`@media (hover: hover)`), a hovered icon turns `--ink` on a `--bg`
  square.
  - **Pause and play** (`.nav.rotation`, `Rotation` in `icons.tsx`). Two bars
    while the slider rotates, labelled "Stop automatic slide show". A
    triangle once it is stopped, labelled "Start automatic slide show".
    Reduced motion hides it, because nothing rotates.
  - **Previous and next.** Chevrons, labelled "Previous slide" and "Next
    slide". They wrap at the ends.

**Rotation.**

- The current bar's fill runs a CSS animation (`fill`, 6s, linear) from
  `transform: scaleX(0)` to none, with `transform-origin: left`. Since it
  animates a transform, it never triggers layout. Its `animationend`
  moves to the next slide and wraps after the last one. Each move remounts
  the running fill, so the animation restarts from zero.
- The running bar waits for hydration (`ready` from the live store). Before
  then nothing listens for `animationend`, and a prerendered bar that
  finished early could never advance. Until then the current bar is empty.
- Focus anywhere in the slider pauses the animation
  (`.slider:focus-within`). Hover pauses it only inside
  `@media (hover: hover)`, so a tap on a phone doesn't leave it stuck.
- The pause button stops the rotation and draws the current bar full. Pressed
  again, it restarts the current slide's bar from zero. This button is what
  meets WCAG 2.2.2 (Pause, Stop, Hide).
- Moving to a slide by hand (a bar, previous or next) also stops the
  rotation, and the button then offers to start it again.
- Reduced motion removes the animation and draws the running bar full, so
  `animationend` never fires and the slider never starts.

**Crossfade.** Inactive slides get `.is-off`: opacity 0, `translateY(8px)`,
`blur(3px)`, `pointer-events: none`. They are also `inert`, which takes them
out of the tab order and the accessibility tree.

### 4.2 Projects

`projects.tsx`, server. An index of projects: one ordered list (`ol.index`)
of rows separated by hairlines. Every row uses the same type. The featured
project sits on a soft band; the other rows have no background, and no row
has a visible border or a category label.

**Order.** The `SIGNALS` entry with `featured: true` leads. The rest follow in
`area` groups: `security`, then `ai`, then `personal`. The page never shows
the area; it only sorts by it. Inside each group, `orderProjects()` in
`lib/live.ts` puts the newest own commit across the project's public repos
first, and falls back to `dateLast` when there's no commit data.

**Row** (`li.row`):

- `padding: 20px 0`, with a 1px `--line` rule above every row and below the
  last one.
- Head row (`.row-head`, flex, wrapping, baseline aligned, `space-between`,
  gaps of 2px by 16px): the name (`h3`, 16px, 500) on the left, and
  `tech · status` (mono 12.5px, muted, `.row-tech`) on the right. The status
  only appears when the project has one. When the row is too narrow,
  `tech · status` wraps under the name and can wrap itself. The name breaks
  anywhere (`overflow-wrap: anywhere`) only if one word can't fit.
- `summary` 4px below: 15px, line height 1.55, muted, at most 34em wide.
- Meta row 10px below (`.meta`, mono 12.5px, muted, wrapping, gaps of 4px by
  14px): the links in `--ink` with an underline, each with 2px padding above
  and below so it is about 25px tall to tap. A row with nothing to show
  (Kintsugi has no links) has no meta row.

**Lead row** (`li.row.lead`, the featured project). Same type sizes as every
other row (16px name, 15px summary). Only the band sets it apart:

- `background: var(--panel)`, 12px radius, and a 1px transparent border that
  only shows in forced-colours mode.
- `margin: 0 -16px 8px` (`--bleed`) and `padding: 19px 15px`. With the 1px
  border that makes 20px above and below and 16px at the sides, so its text
  sits on the column like every other row while the band reaches 16px past
  the column on each side, with 8px below it.
- The row after it has no top hairline (`.lead + .row`).
- Its meta row starts with the live facts on one line (`.facts-line`), like
  "★ 16 · v0.7.5 · With Abhishek Manyam": the star count, the newest release
  tag and "With {collaborator name}". The links follow (for EvalCore:
  evalcore.cc, GitHub, Product Hunt). Stars and tag come from the snapshot,
  and each drops out without data. Other rows never show stars, tags or a
  collaborator.

**One click target per row.** When a project has links, its name is a link
(`.row-link`) to the first one. Its `::after` covers the whole row and 16px
past it on each side (`inset: 0 -16px`, from `--bleed`, 10px radius; on the
lead row it matches the band, `inset: 0`, 12px radius), so a click anywhere
on the row opens that link. Links in the meta row sit above the overlay
(`position: relative; z-index: 1`) and open their own pages. A project with
no links has a plain-text name, and its row isn't clickable.

**Links.** A row's links are `links` from `SIGNALS`. With `sourceIfPublic`, the
row gets a GitHub link too, but only once the snapshot confirms the repo is
public (`isPublicRepo`). Each link reads "Label ↗", with the arrow drawn by
`ArrowUpRight` inside `span.arrow`. The arrow is `aria-hidden`, and a hidden
", {project}" gives each link a unique accessible name ("GitHub, kubereach").

**Status words.** Only `Shelved`, `Prototype`, `Private` or `Archived`, and
only for work that isn't live and public. The page has no status dots.

**Hover and focus.** Hovering a row underlines the project name (1px,
`--line2`, 3px offset). Where hover is real (`@media (hover: hover)`),
hovering a meta link nudges its arrow 1px up and right; reduced motion turns
the nudge off. Keyboard focus on the name draws a 2px `--ink` ring around the
row overlay instead of the name. Nothing else changes on hover.

**Anchors.** Every row, the lead one included, has `id` set to its slug, so
`/#evalcore` lands on it, 24px below the top edge. The feeds and the old
`/apps/<slug>` URLs point there.

### 4.3 Elsewhere

`elsewhere.tsx`, client. X and GitHub behind a two-tab switch, with no bios.

**Which tabs show.** X shows when it has at least one post to list. GitHub
shows when it has at least one stat or repository. With both, the tablist
appears and X starts selected. With one, its panel shows without a tablist.
With neither, the section doesn't render.

**Tabs** (`.seglist`, `role="tablist"`, `aria-label="Elsewhere"`). A track with
3px padding, 2px gap, 9px radius, `--panel` fill and a `--line` border. Each
tab (`.seg`, `role="tab"`) is 14px text with 5px 12px padding and a 7px
radius. Unselected tabs are muted; the selected tab is `--ink`, and so is a
hovered one where hover is real (`@media (hover: hover)`). One indicator
(`.tab-ind`, from `indicator.tsx`) draws the selected tab's `--tab-on`
background with a 1px inset `--edge` ring, and slides between tabs. The
`--tab-on` fill is too close to `--panel` to see on its own, so the ring marks
the selection.

`useIndicator()` measures the selected tab's fractional box
(`getBoundingClientRect`, relative to the track's padding edge) and measures
again through a `ResizeObserver` when web fonts or the layout change its
width. Placements in the first 400ms after mount (the first measure, a saved
theme applied on hydration, late fonts) appear in place (`.tab-ind.still`, no
transition); only later changes, which come from the visitor, slide. Until
the first measure, the track has no `.measured` class and the selected tab
paints its own `--tab-on` background and the same `--edge` ring. The theme
switch uses the same control.

**Keyboard model** (WAI-ARIA tabs pattern, automatic activation):

| Key | Does |
| --- | --- |
| Tab | Enters the tablist on the selected tab (roving `tabindex`: 0 on the selected tab, -1 on the other). Tab again moves into the open panel. |
| Right Arrow, Left Arrow | Move focus to the next or previous tab, wrapping at the ends, and select it. |
| Home, End | Move to the first or last tab and select it. |
| Click | Selects that tab. |

**Panels** (`role="tabpanel"`, `aria-labelledby` the tab). Both are in the
HTML, and the unselected one is `hidden`. A panel fades in (0.5s) each time it
shows.

**X panel** (`ul.posts`, posts 4px apart). Each post is one link
(`.post.hov`, 16px padding on every side, 12px radius). The list bleeds 16px
past the column on each side (`margin: 0 -16px -16px`, from `--bleed`), so
post text lines up with the column while the hover background reaches past
it. The negative bottom margin takes back the last post's bottom padding,
which is hover room and not space before About.

- Head: a 36px portrait (lazy loaded), then the X profile name, with the
  verified badge when the account is verified, over "@handle · 20h" (muted).
  The pinned post shows a "Pinned" cap on the right.
- Body, 12px below: 15.5px, `white-space: pre-line`, so the post keeps its
  line breaks. It is clamped at 12 lines, which a 280-character post never
  reaches; a longer post reads in full on X.
- Posts: the pinned post first, if it is readable, then the next two readable
  posts. The newest readable post that isn't pinned is already on the slider,
  so the list skips it (`pagePosts()` in `lib/live.ts`).
- Time stamps follow X: "now", "12m", "20h", "Sep 23", "Sep 23, 2025".

**GitHub panel.**

- Stats (`ul.stats`): a ruled strip. A `--line` hairline runs above and below
  it, and each stat is one equal-width column (`grid-auto-flow: column`) with a
  vertical hairline between neighbours. Each `.stat` has 18px padding above
  and below and 16px on each side of a divider, with none at the strip's left
  edge. The value is 28px over a 13.5px muted label. A number inside a label
  is held to its word by a no-break space ("3 days", "2 forks").
  `githubStats()` returns exactly four, in this order, and drops any whose
  data is missing; the rest share the width.
  1. `{count}` "{featured} releases in {days} days" (the featured project's
     newest release burst)
  2. `{stars}` "stars on {featured}, {forks} forks" (forks only when there are
     any)
  3. `{n}` "languages across public repos"
  4. `{SIGNALS.length}` "projects built since {earliest dateFirst year}"
- Repositories: a cap heading (`h3`) 28px below the stats, then the list 6px
  below (`.repos`, `margin: 6px 0 -10px`; the negative bottom margin takes
  back the last row's padding so the gap before About matches every other
  section). Each row (`.item.hov`, padding 10px 16px, `margin: 0 -16px` from
  `--bleed`, 8px radius) shows the mono `owner/name` over the project's
  `tagline`, with the language dot and name on the right. The name breaks
  after the slash first (a `<wbr>` after `owner/`), and anywhere else only if
  a half still can't fit. `repoRows()` picks the rows: the owner's pinned
  GitHub repos that are also public project repos, in pinned order, then the
  most recently committed project repos (by commit only, not by area), at
  most 4.

### 4.4 About

`about.tsx`, server.

- `h2` "About", 14px above the text.
- Two muted paragraphs, 16px apart. The second starts with the run-in lead
  "Day job." in `--ink` at weight 500 (`span.runin`); the rest of that
  paragraph stays muted.
- The text is the owner's own words, verbatim. See
  [Content and voice](#8-content-and-voice).
- A facts list (`dl.facts`) 28px below: a two-column grid (96px labels, then
  the value), 15px text, a `--line` rule above the first row and below every
  row, 10px vertical padding, muted labels.

| Label | Value |
| --- | --- |
| Focus | Application security, cloud security, AI systems |
| Cloud | AWS, Azure, Kubernetes |
| Into | AI, Kubernetes, security tools |
| Writes | Python, Go, C, TypeScript, Rust |

### 4.5 Footer

`footer.tsx`, client. `id="contact"`, so `/#contact` and the old `/contact`
URL land here.

A three-column grid (`.fgrid`, `minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr)`,
28px row gap, 24px column gap). Each column is a cap label with its content
8px below at 15px.

- **Email.** The address (`EMAIL` in `app/signals.ts`) as an underlined
  `mailto:` link, then a "Copy address" button 6px below. The button is 13px
  and shifted 12px left so its text lines up with the address.
  - On success it writes to the clipboard, reads "Copied" for 1.6s, and
    announces "Email address copied".
  - When the clipboard is blocked or missing (some in-app browsers), it
    selects the address text instead, reads "Selected" for 4s, and announces
    "Email address selected. Press Command C or Control C to copy it."
  - Announcements go through a visually hidden `aria-live="polite"` span.
- **Elsewhere.** GitHub, X and Instagram, stacked with a 4px gap, each with
  `rel="me"`. The list is `aria-labelledby` its "Elsewhere" label.
- **Local time** (`.clock-col`). `LocalTime` from `time.tsx`: the time in
  Michigan, like "8:02 PM" (tabular numbers, with a non-breaking space before
  AM or PM), over "Michigan, EDT" or "Michigan, EST" (muted). It runs on `TIMEZONE`
  (`America/Detroit`, `lib/constants.ts`) and ticks every 30s from the shared
  clock in `lib/live-store.tsx`.
- **Bottom row** (`.fbottom`, 40px below, 13px, muted). A grid of
  `minmax(0, 1fr) auto auto`, centred vertically, gaps of 16px by 24px:
  "© {year} Kuladeep Mantri" (the year comes from the build time in
  Michigan), then the theme switch, then "Back to top ↑" (the arrow is
  `ArrowUp`). It links to `#top`, the `.col` wrapper, so following it
  scrolls to the top and moves the keyboard's starting point there too: the
  next Tab lands on the slide link.

The footer has no wordmark, build stamp, "report a vulnerability" line or
cookie notice.

### 4.6 Theme switch

`theme.tsx`, client. A text segmented control, "System · Light · Dark", in the
footer's bottom row. It has no icons.

- **Markup.** `.seglist.theme` with `role="radiogroup"` and
  `aria-label="Theme"`. Each option is a button with `role="radio"` and
  `aria-checked`. Options are 12.5px with 2px 10px padding (`.theme .seg`), on
  the same track and sliding indicator as the Elsewhere tabs.
- **Choosing.** Light or Dark sets `data-theme` on `<html>` and stores the
  pick under `THEME_KEY`. System removes both. If `localStorage` is blocked,
  the pick still applies for the visit. A change in another tab syncs through
  the `storage` event.
- **Keyboard.** Roving `tabindex`, so Tab lands on the checked option. Right
  or Down Arrow moves to the next option and selects it, Left or Up Arrow to
  the previous one, wrapping at the ends.
- **First render.** The prerendered switch says System, so it stays
  `visibility: hidden` (`.theme:not(.measured)`) until its indicator has
  measured. It reads the saved pick in a layout effect, which runs before the
  browser paints the hydrated switch, so a visitor with Light or Dark saved
  never sees System selected first. The colours are right even earlier,
  because the `BOOT` script applied the theme ([Theme](#theme)).
- **Without JavaScript** the switch is hidden, and the page follows the
  system.

### 4.7 Times

`time.tsx`. The build renders the HTML, so any clock or relative time in it
shows the build's time. Elements that show a time carry `.live-t` and stay
transparent until the browser clock takes over: `LiveProvider` sets `ready`
in a layout effect, before the hydrated page paints, and the element gets
`.is-ready`. Wall clocks also carry `.live-clock`. Both classes come from
`liveClass()`, which `time.tsx` keeps to itself. Show any new time on the page
through `Stamp` or `LocalTime`, or add a component to `time.tsx` that uses
`liveClass()`.

### 4.8 Not found and old URLs

`app/not-found.tsx` is the 404 page that GitHub Pages serves for any missing
path: "Not found" and one muted line that links home. The home link is a
plain `<a>`, because `next/link` would add a chunk to every page.

An inline script (`<script id="moved">`) redirects the old routes. The
postbuild (`scripts/csp.ts`) moves it to sit right after the CSP meta, ahead
of the stylesheet, so it runs without waiting for the CSS. Its hash is the
same wherever it sits. It ignores a trailing slash, `.html`, `/index` and
letter case. Only listed paths and anything under `/apps/` redirect, and
every target is `/`, so an unknown path can't loop.

| Old path | Goes to |
| --- | --- |
| `/about` | `/#about` |
| `/contact` | `/#contact` |
| `/github`, `/x` | `/#elsewhere` |
| `/apps/<slug>` for a slug in `SIGNALS` | `/#<slug>` |
| `/apps`, `/now`, `/verify`, any other `/apps/...` | `/` |

## 5. Motion

These are the only animations on the site, all in `app/globals.css`.

| What | Duration | Curve | Where |
| --- | --- | --- | --- |
| Page entrance, once on load. Header, slider, Projects, Elsewhere, About and footer rise from opacity 0.01, `translateY(10px)` and `blur(4px)` in 50ms steps (delays 0, 0.05, 0.1, 0.15, 0.2 and 0.25s). | 0.7s | `--ease` | `enter` keyframes on `.intro`, `.slider`, `.projects`, `#elsewhere`, `.about`, `.footer` |
| Slide crossfade: opacity, `translateY(8px)` to 0, `blur(3px)` to 0 | 0.6s | `ease` for opacity and blur, `--ease` for the move | `.slide` |
| Slider progress, one bar per slide: `transform: scaleX(0)` to none, so the compositor alone draws it | 6s | linear | `fill` keyframes on `.fill.run` |
| Elsewhere panel fade-in: opacity 0 to 1, `translateY(6px)` to 0 | 0.5s | `--ease` | `fadein` keyframes on `.panel` |
| Segmented-control indicator sliding to the selected option (Elsewhere tabs, theme switch). Placements in the first 400ms after mount don't move (`.tab-ind.still`). | 0.35s | `--ease` | `.tab-ind` (transform, width) |
| Link arrow "↗" nudging 1px up and right on hover, only where hover is real (`@media (hover: hover)`) | 0.2s | `--ease` | `.arrow` (top, left) |
| Row hover background (posts, repositories) | 0.15s | default | `.hov` |
| Link underline colour on hover, segmented option text colour | 0.15s | default | `.ul`, `.seg` |

`--ease` is `cubic-bezier(0.2, 0.7, 0, 1)`, an ease-out that moves fast at the
start and settles slowly. The project name's underline on row hover and the
slider buttons' hover colours change with no transition. Nothing bounces or
reacts to scrolling.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, the entrance, the
slide crossfade, the progress animation, the panel fade, the indicator and
the arrow all get `transition: none` and `animation: none`, and the running
progress bar is drawn full. A hovered arrow stays where it is (no nudge), and
the slider's pause button is hidden. The slider never rotates, slides and
panels switch at once, and the page loads in place. Hover colour changes stay,
because nothing moves.

## 6. Responsive behavior

Three breakpoints, all `max-width`: 640px changes the stats strip, 560px the
footer, and 360px the slider counter. The rest of the page needs none.

- **Column.** At most 640px including the 24px side padding. Below 640px it
  is the viewport width less 48px. The 128px top padding holds at every width.
- **Project rows.** The head row wraps, so on a narrow screen `tech · status`
  drops below the name, and it can wrap itself. Summaries stop at 34em on
  wide screens.
- **Slider.** The tallest slide sets the card's height, at least 232px. On
  phones the text wraps more and the card grows to fit, and the height still
  holds between slides. Post text stops at 4 lines and the commit message at
  3, so one long post can't stretch the card much. At 360px and below the
  "1 / 3" counter is hidden, since the bars show the position.
- **Stats.** One row of up to four columns above 640px. At 640px and below
  they wrap into two columns: the left column loses its divider, and the
  second row gets a hairline above it. Labels keep each number on the same
  line as its word (no-break spaces).
- **Elsewhere head.** The heading and tabs stay on one row at every width.
- **About facts.** The label column stays 96px at every width.
- **Footer at 560px and below.** The grid becomes two equal columns, with
  Email across both and Elsewhere and Local time side by side under it. In the
  bottom row the theme switch moves to its own line above the copyright and
  "Back to top".
- **Long strings.** Post text, the post header, commit messages, commit meta,
  project names, the release name, repository names and the email address use
  `overflow-wrap: anywhere`, so nothing scrolls sideways. Repository names
  break after the slash first (`<wbr>`). The release tag pill ends in an
  ellipsis instead.
- **Hover.** Only where hover is real (`@media (hover: hover)`): the slider
  pausing on hover, the slider buttons' hover square, segmented options and
  the copy button turning `--ink`, and the link arrow nudge. A tap on a phone never leaves one
  of them stuck.

## 7. Accessibility

The bar is **WCAG 2.2 AA**.

- **Landmarks.** `header` (banner) holds the `h1`. `main` holds the slider and
  the three sections. `footer` (contentinfo) is `#contact`. Each section is
  labelled by its `h2` (`aria-labelledby`), and the slider is a labelled
  region.
- **Headings.** `h1` is the name. `h2` is Projects, Elsewhere and About. `h3`
  is each project name and "Repositories". Footer labels are not headings.
  Headings are body size, so the hierarchy lives in the markup.
- **Lists.** Projects are an ordered list (`ol`); posts, stats and
  repositories are unordered lists, so screen readers announce their counts.
- **Focus.** `:focus-visible` draws a 2px solid `--ink` outline, offset 2px,
  with a 4px radius (6px on slider bars, slider buttons and segmented
  options). The slide link uses a -3px offset and posts a -2px offset,
  because their containers clip overflow. A focused project name moves its
  ring onto the row overlay (2px `--ink`, 10px radius, 12px on the featured
  band), so focus shows the whole click target. "Back to top" targets an
  element (`#top`), so the next Tab starts from the top of the page. Never
  remove an outline without drawing one somewhere else.
- **Contrast.** Muted text is at least 5.16:1 on every surface, and ink at
  least 12:1. Progress tracks and the selected option's ring use `--edge`,
  which measures at least 3.22:1 on every surface (1.4.11). See
  [Colour tokens](#colour-tokens).
- **Target size (2.5.8).** Slider bars are 24px tall and share the full width.
  Pause, previous and next are 28 by 28px. Elsewhere tabs are about 33px
  tall, theme options about 25px, and the copy button about 31px. Each
  project row is one target for its first link. Footer links are about 25px
  tall. "Back to top" is about 21px tall with nothing else clickable within
  24px. Links in the project meta rows are flex items with 2px padding above
  and below, about 25px tall, and sit inside the row's own target. Recheck
  them if that row changes.
- **Carousel.** `role="region"` with `aria-roledescription="carousel"` and the
  label "Latest from X and GitHub". Each slide is a `group` with
  `aria-roledescription="slide"` and a label like "1 of 3: Latest post".
  Hidden slides are `inert`. Bars are labelled "Show slide 2: Latest release",
  and the current one has `aria-current`. Previous and next are labelled. The
  pause button reads "Stop automatic slide show" or "Start automatic slide
  show" and meets 2.2.2 (Pause, Stop, Hide). Moving to a slide by hand also
  stops the rotation. Hover and focus pause it, and it never starts under
  reduced motion, where the button is hidden.
- **Live regions.** The slides container is `aria-live="off"` while the
  slider rotates and `"polite"` once it is stopped (by the button or by
  moving to a slide), so a screen reader announces slides the visitor chose
  and stays quiet for automatic moves. The footer's copy status is a polite
  live region.
- **Segmented controls.** The Elsewhere tabs follow the WAI-ARIA tabs pattern
  with automatic activation ([Elsewhere](#43-elsewhere)). The theme switch is
  a radio group with arrow keys ([Theme switch](#46-theme-switch)). The
  selected option shows in three ways: `--ink` text, the `--tab-on` fill, and
  a 1px `--edge` ring. The sliding indicator is `aria-hidden`.
- **Images and icons.** Portraits have `alt=""` because the name sits next to
  them. Logos, chevrons and the pause and play icons are `aria-hidden`. The
  verified badge is `role="img"` labelled "Verified account". The star is an
  `aria-hidden` SVG, and a visually hidden "star" or "stars" follows the
  number.
- **Link names.** Repeated labels like "GitHub" get a hidden ", {project}"
  suffix. Decorative arrows (↗, ↑) are `aria-hidden` SVGs.
- **Forced colours.** Progress fills use `Highlight`; tracks and language dots
  use `GrayText`. The indicator gets a 1px `Highlight` border and the
  selected option's text turns `Highlight`. The featured band's transparent
  border shows as a line.
- **Language.** `<html lang="en">`.
- **Without JavaScript.** A `<noscript>` style in `app/layout.tsx` shows
  relative times (with their build-time values), keeps wall clocks hidden,
  and shows both Elsewhere panels 28px apart. It hides what needs a script:
  every `.seglist` (the Elsewhere tabs and the theme switch), the slider's
  controls (`.chrome`), the copy button (`.copy`) and the Local time column
  (`.clock-col`). The slide link's bottom padding drops to 22px, so no space
  is kept for the hidden controls. The prerendered HTML already holds
  everything else.

## 8. Content and voice

- **Voice.** First person, plain words, short sentences. Say what a thing does.
  No marketing words ("powerful", "seamless", "cutting-edge", "robust"), no em
  dashes, no emojis, no exclamation marks. Visitor copy uses typographic
  apostrophes (’).
- **No category labels or tags on projects.** The owner considers them
  marketing filler. A project gets its name, `tech`, an optional status word,
  one plain sentence and its links. `area` only orders the index; never
  render it.
- **Title.** "Security Engineer" is the only job title outside About: the
  header ("Security Engineer in Michigan"), the `<title>`, the JSON-LD
  `jobTitle`, the share image and its alt text. "IT Security Analyst 3"
  appears only inside the About paragraph.
- **Compliance language.** Keep NIST, 800-53, "framework" and GRC language
  inside the About paragraph and nowhere else.
- **About is verbatim.** The two paragraphs in `components/home/about.tsx` are
  the owner's own words, and they match section 6 of `PLAN.md`. Don't edit,
  shorten, reword or "fix" them, and don't paraphrase them anywhere else on the
  site. The facts list values change only when the owner says so.
- **Project copy** (in `SIGNALS`): `summary` is one plain sentence about what
  the project does. `tech` is a short stack ("Go", "C, ARM64"). `tagline` is
  the short line used in the feeds and the Repositories list.
- **Clean links.** Outbound links carry no tracking parameters (`ref=`,
  `utm_*`). Product Hunt's share link, for one, goes in as
  `https://www.producthunt.com/products/evalcore`.
- **Nothing typed in.** Never write a number, date, post or commit into a
  component. If it belongs on the page, it comes from the snapshot or from
  `SIGNALS`.
- **Contact email.** `kuladeepbmantri@gmail.com` (`EMAIL` in
  `app/signals.ts`).
- **Numbers keep their words.** A no-break space holds a number to the word
  it counts in stat labels ("3 days", "2 forks"), the burst sentence ("Six
  releases", "three days") and date ranges ("July 17", "to 19"), so a line
  never ends on a bare number.
- **Photo.** Two files in `public/images/`, cropped on the face, with all
  metadata stripped. `portrait-168.webp` and `portrait-168.jpg` (168px, 3x the
  56px slot) are the header portrait and the 36px post avatars, through a
  `<picture>` in `portrait.tsx`. `portrait.jpg` (512px) is only the JSON-LD
  `image`. The source photo carried GPS tags, and CI fails the build if any
  shipped file has GPS metadata. Strip a new photo with `exiftool -all= FILE`
  before committing it.
- **Share image.** `public/og.png`, 1200 by 630, with the name, the title and
  the photo (`OG_IMAGE` in `lib/meta.ts`).
- **New visitor-facing strings** go through the humanizer skill before they
  ship.

## 9. Live data

### Pipeline

```
scripts/fetch-live.ts  (predev, prebuild, and its own CI step)
   |-- reads lib/skip.ts              SKIP_REPOS, build-time only
   |-- writes lib/generated/live.ts   imported by app/page.tsx, the feeds, the sitemap
   '-- writes public/live.json        published; the next build reads it back as its cache
app/page.tsx  derives every view with the pure helpers in lib/live.ts
LiveProvider (lib/live-store.tsx)  one 30s clock, plus repos refreshed in the browser
lib/live-client.ts  GitHub public API, newer own commits on project repos
```

`scripts/fetch-live.ts` never throws. When a section (GitHub or X) fails, it
keeps the previous snapshot, read first from the deployed `live.json` and then
from the local `public/live.json`, and writes null only when there is none.
The page drops whatever has no data. Both outputs are gitignored, and nobody
edits `lib/generated/live.ts` by hand.

Tokens: GitHub tries `GH_PAT`, then `GITHUB_TOKEN`, then a local `gh` login,
and a rejected token (401) falls through to the next. X needs
`X_BEARER_TOKEN`. Tokens live only in `.env.local` and GitHub Actions secrets,
and in CI only the fetch step sees them. Never print, echo or commit a token.
The script trims each token and skips one with anything but printable ASCII
in it, with a fixed warning (`usableToken()`). A failure log line carries
the message only for errors the script raised itself; any other error logs
just its name (`why()`), because `fetch` quotes a bad header value, and that
header can be `Authorization`.

### Sources and timing

| Shown | Source | Changes on the page |
| --- | --- | --- |
| Latest commit, "one of N commits" | Build: GitHub GraphQL, default-branch history filtered by the owner's user id (newest 3, plus a total count). Browser: GitHub's public events API, then the commits API for the repo. | Within about 10 minutes of a push to a public project repo, through the browser refresh. Otherwise on the hourly build. |
| Latest release, burst sentence, lead row's tag | GraphQL: the 10 newest releases per project repo, drafts dropped | Hourly build |
| Stars, forks, language, license | GraphQL, per project repo | Hourly build |
| Languages count | GraphQL: primary language of the owner's public, non-fork repos, plus public project repos in orgs. CSS is excluded. | Hourly build |
| Repositories list | GraphQL: the owner's pinned repos (public only), matched to project repos | Hourly build |
| Projects count, "since" year, project rows | `SIGNALS` | Next deploy |
| Latest post, X tab posts, pinned post, name, verified badge | X API v2, build only (it needs a token). Replies are dropped (`referenced_tweets` of type `replied_to`), including the ones that continue my own threads, which read as fragments alone. A pinned reply is left out. | Hourly build. New posts arrive every hour. The profile, the pinned post and the latest posts are refetched from scratch once a day (or with `X_FULL_REFRESH=1`, or the workflow's `x_full_refresh` input), so an edited or deleted post drops out within a day. |
| Local time, relative times | The browser clock | Every 30s |

The hourly build is the scheduled run of `.github/workflows/nextjs.yml`
(`7 * * * *`). It deploys only when `live.json` (ignoring `builtAt`) or the
commit differs from what is live.

**Browser refresh** (`lib/live-client.ts`):

- Unauthenticated, so GitHub allows 60 requests per hour per visitor IP.
- It runs on load and whenever the tab becomes visible, at most once per 10
  minutes per page, and not at all while the snapshot is under 10 minutes
  old.
- It caches answers and failures in `localStorage` for 10 minutes, shared by
  every tab: the events under `km-events-v3`, and each repo's commits under
  `km-commits-v3:<repo>`, tied to the push they answer. The events cache holds
  only pushes to the snapshot's public project repos; pushes to any other
  repo are dropped before anything is written. Keys from older versions
  (`km-events`, `km-events-v2`, `km-commits:`, `km-commits-v2:`) are removed.
- It looks only at public project repos with a push newer than both the build
  and the snapshot's newest commit (with 60s of slack), and makes at most two
  commit calls.
- A commit counts only if its author is linked to the owner's GitHub account.
  The API's author filter also matches by email, so that match alone isn't
  enough.
- Each commit call reads one page of 10. If the page comes back full and
  every commit on it is newer than the snapshot's newest, more new commits
  may be missing, so the total is unknown: the slide drops "one of N" until
  the next build.
- On any unexpected answer the page keeps the build snapshot and logs
  nothing. The CSP allows `https://api.github.com` and no other outside
  origin.

### Privacy rules (must hold)

- **Only the owner's commits.** Commits by collaborators, like the newest
  EvalCore commit by abhishekmanyam, never show.
- **Only project repos.** The build and the refresh read commits and releases
  only from repos listed in `SIGNALS`. The events feed also lists pushes to
  friends' repos, and those never match.
- **`SKIP_REPOS` never count** (`lib/skip.ts`): this site's repo, the profile
  README repo, and `InternProjects`, an old coursework repo whose stars must
  not count. The build skips them for the languages count and the pinned
  list. The page and the browser refresh only ever look at `SIGNALS` project
  repos, and none of these is one.
- **Skipped names never ship.** `lib/skip.ts` is build-time only:
  `scripts/fetch-live.ts` and the tests import it, and nothing the browser
  loads may, so the names stay out of the client bundle. A test fails if any
  file under `app/`, `components/` or `lib/` imports it or names a skipped
  repo. CI fails the build if `internprojects`, `trishakti` (a friend's repo
  from the events feed) or `kuladeepmantri.github.io` appears anywhere in
  `out/`, in any letter case.
- **Private repos are counted but never named.** A private project lists
  `repos: []` (like Kintsugi). If a private repo does end up in `SIGNALS`, the
  build stores an empty record for it and warns in CI. A private pinned repo
  never reaches `live.json`.
- **No drafts.** The build keeps only published releases.
- **Links from data stay on known hosts.** GitHub links must start with
  `https://github.com/` (`isGithubUrl`). Language colours must be hex
  (`safeColor`) before they go into a style attribute. X post ids must be
  numeric before they become links.

## 10. Adding or changing a project

1. **Edit `SIGNALS`** in `app/signals.ts`.

   | Field | Where it shows | Rule |
   | --- | --- | --- |
   | `id` | Feeds | `KM-YYYY-NNNN`, in `dateFirst` order. Never reuse one. |
   | `slug` | Row `id`, `/#<slug>`, feed URLs, the `/apps/<slug>` redirect | Never rename a published slug. |
   | `name` | Row heading, feeds | |
   | `area` | Nowhere; it picks the row's group | `security`, `ai` or `personal`. Groups show in that order. |
   | `summary` | The row's sentence | One plain sentence about what it does. |
   | `tech` | Right side of the row's head | Short stack. |
   | `status` | After `tech` | Only `Shelved`, `Prototype`, `Private` or `Archived`, and only for work that isn't live and public. |
   | `featured` | The lead row, its stars and tag, and the first two GitHub stats | Exactly one project sets it. |
   | `tagline` | Feeds, the Repositories list | Short. |
   | `description` | Feeds | |
   | `state`, `dateFirst`, `dateLast`, `tags`, `type` | Feeds, ordering fallback, "since" year | `tags` go to the feeds only, never the page. |
   | `repos` | All live data for the project; the name as written shows in the Repositories list | Public repos only, as `owner/name` in GitHub's own casing (`kuladeepmantri/Auris`). Matching ignores case. A private project uses `repos: []`. |
   | `links` | Row links. The first one is also the whole row's target. | |
   | `sourceIfPublic` | Adds a GitHub link once the build confirms the repo is public | |
   | `collaborator` | "With {name}", on the lead row only | |

   The `Signal` type still requires `line`, `body`, `stateLabel` and `stack`,
   but nothing on the page reads them.

2. **Fetch.** Run `npm run dev`, which runs `scripts/fetch-live.ts` first.
   Read its log for warnings ("did not resolve", "is private"). Then check
   `lib/generated/live.ts` for the repo: `isPrivate: false`, commits,
   releases.
3. **Repositories list.** To list the repo there, pin it on GitHub. Pinned
   order wins, and the list holds at most 4.
4. **Look.** Check the row's position (its `area` group, then newest commit
   first). Check that a click anywhere on the row opens its first link, that
   the meta links open their own pages, that `/#<slug>` lands on the row, and
   that `/apps/<slug>` redirects to it. Check the slider too, in case this
   project now has the newest release or commit.
5. **Feeds.** `/feed.xml`, `/api/signals.json` and the redirect map all read
   the project from `SIGNALS` with no extra step. JSON Feed item ids keep
   their old `/apps/<slug>#<id>` form. Changing an id makes feed readers treat
   the item as new.
6. **Copy.** Run the humanizer skill on the new `summary` and `tagline`.
7. **QA.** Run the checklist below.

## 11. QA checklist

1. `npm run lint`
2. `npm test`. This runs node:test through tsx over `lib/*.test.ts`, 135
   tests: the pure helpers in `lib/live.ts`, `lib/x-text.ts` and
   `lib/skip.ts`, the helpers in `scripts/fetch-live.ts` (reply filter, token
   check, error logging, cache trimming), the browser refresh in
   `lib/live-client.ts`, and a check that no shipped file imports
   `lib/skip.ts` or names a skipped repo.
3. `npm run build`. It fetches live data and exports to `out/`. Then the
   postbuild (`scripts/csp.ts`) adds a Content-Security-Policy to every page
   and prints `[csp] policy added to N page(s) in out`. Scripts run only by
   `'self'` or the sha256 of each inline script on that page, so an inline
   script without a matching hash won't run. Images and fonts come only from
   the site itself (`img-src 'self'`, so no `data:` images either), styles
   from the site or inline (React style attributes), `connect-src` adds
   `https://api.github.com`, and `base-uri`,
   `form-action`, `object-src`, `frame-src` and `worker-src` are `'none'`.
4. Serve the export (`python3 -m http.server 4173 --directory out`) and check:
   - light and dark, at 1280px and 390px wide, both from the system setting
     and from the theme switch, plus 360px for the slider controls
   - the theme switch: Light and Dark survive a reload with no flash of the
     other theme and without the switch showing System first, System follows
     the OS again, and a change in one tab reaches the others
   - keyboard only: the slide link, bars, pause, previous and next, then the
     tabs (arrows, Home, End), every post, repository and project link, the
     email, the copy button, the footer links, the theme switch (arrows) and
     "Back to top", after which Tab should go to the slide link. The focus
     ring should show every time.
   - reduced motion: no entrance, no rotation, no crossfade, no pause button,
     bars full, tabs and panels switch with no slide or fade
   - the slider pauses on hover and focus; the pause button stops it and
     starts it again; a bar, previous or next stops it
   - no console errors, including CSP violations and hydration warnings
5. Old URLs: check each path from
   [Not found and old URLs](#48-not-found-and-old-urls) with `npm run dev`.
   The static server above doesn't serve `404.html`.
6. Content: no em dashes in visitor copy, no category labels on projects,
   "Security Engineer" is the only title outside About, and
   `git diff components/home/about.tsx` shows no change to the paragraphs.
7. Images: no GPS metadata in `out/` (CI runs `exiftool` and fails on it).
8. Excluded names:
   `grep -rIliE 'internprojects|trishakti|kuladeepmantri\.github\.io' out`
   prints nothing. CI runs the same check and fails on a match.

## 12. File map

| Path | What it is |
| --- | --- |
| `app/layout.tsx` | Fonts, metadata, viewport and theme colours, the `BOOT` script (saved theme and its `theme-color`, double-slash fix), the no-JavaScript style, Person JSON-LD. |
| `app/page.tsx` | The whole site: reads `SIGNALS` and the snapshot, derives the views, composes `components/home/*` inside `LiveProvider`. |
| `app/globals.css` | Tokens (light, and dark in two blocks), reset, every measurement, keyframes, reduced motion and forced colours. |
| `app/signals.ts` | Projects (`SIGNALS`) and site constants (`EMAIL`, handles, `SENTENCE_ONE`). |
| `app/not-found.tsx` | 404 page and the old-URL redirect script (`id="moved"`). |
| `app/feed.xml/`, `app/api/signals.json/`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts` | RSS, JSON Feed, sitemap (only `/`), robots, web manifest. |
| `components/home/slider.tsx` | The slider, its progress bars and its pause, previous and next buttons. |
| `components/home/projects.tsx` | The Projects index: the lead row, then ruled rows ordered by area and commit. |
| `components/home/elsewhere.tsx` | X and GitHub tabs. |
| `components/home/about.tsx` | The verbatim About text and the facts list. |
| `components/home/footer.tsx` | Email and copy button, links, local time, bottom row. |
| `components/home/theme.tsx` | The System, Light and Dark switch. |
| `components/home/indicator.tsx` | `useIndicator()` and `Indicator`: the sliding background shared by both segmented controls. |
| `components/home/time.tsx` | `Stamp` and `LocalTime`, built on the internal `liveClass()`. |
| `components/home/portrait.tsx` | The portrait: `portrait-168.webp` with a `.jpg` fallback. |
| `components/home/icons.tsx` | Inline icons: the X and GitHub logos, the verified badge, chevrons, pause and play (`Rotation`), and the ★ ↗ ↑ glyphs Geist lacks (`Star`, `ArrowUpRight`, `ArrowUp`). |
| `lib/live.ts` | Snapshot types and the pure helpers (stamps, release burst, ordering, stats, repository rows, page posts). No React and no I/O. |
| `lib/skip.ts` | `SKIP_REPOS` and `isSkippedRepo()`. Build-time only: imported by `scripts/fetch-live.ts` and the tests, never by shipped code. |
| `lib/live-store.tsx` | `LiveProvider` and `useLive()`: the shared clock, `ready`, refreshed repos. |
| `lib/live-client.ts` | The browser refresh of the newest commits. |
| `lib/x-text.ts` | Post text cleanup (`postText`) and the link-only filter (`readable`). |
| `lib/meta.ts`, `lib/constants.ts` | Page metadata, share image, feeds; `WEBSITE_URL`, `TIMEZONE`, `THEME_KEY`. |
| `lib/*.test.ts` | Unit tests (`npm test`): `live.test.ts` and `live-client.test.ts`. |
| `scripts/fetch-live.ts` | Build-time GitHub and X snapshot. |
| `scripts/csp.ts` | Per-page Content-Security-Policy for the export; also moves the 404 redirect ahead of the stylesheet. |
| `public/images/` | `portrait-168.webp` and `.jpg` (the page), `portrait.jpg` (JSON-LD only). |
| `.github/workflows/nextjs.yml` | Actions pinned to commit SHAs. Lint and test, fetch, build on push and hourly, CSP, GPS and excluded-name checks, deploy to GitHub Pages. |
| `.github/dependabot.yml` | Weekly grouped updates for npm and the pinned Actions. |
| `.prettierrc` | Prettier: no semicolons, single quotes, width 100. |
