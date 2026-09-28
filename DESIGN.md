# Design

How kuladeepmantri.com looks, moves, sounds, and is built, written so that any
person or agent can extend it, or rebuild it somewhere else, without guessing.
If something on the site disagrees with this file, fix one of them so they agree.

Contents:

1. [Principles](#1-principles)
2. [Layout](#2-layout)
3. [Type](#3-type)
4. [Colour](#4-colour)
5. [Motion](#5-motion)
6. [Scenery](#6-scenery): the line-art backgrounds, how they are made, how to design a new one
7. [Sound](#7-sound)
8. [Content and voice](#8-content-and-voice)
9. [Adding a project](#9-adding-a-project): the checklist
10. [Checking your work](#10-checking-your-work)
11. [File map](#11-file-map)

---

## 1. Principles

- **One page, many panes.** The site never navigates away. Every route opens a
  pane beside the home pane; closing it returns to home. The background is a
  place, and the panes float over it like glass.
- **Real data only.** Every number, date, post, and commit on the site comes from
  GitHub or X at build time (and refreshes in the browser). Never add sample,
  placeholder, or invented data.
- **Plain, professional voice.** Short sentences, first person, no marketing, no
  em dashes. See [Content and voice](#8-content-and-voice).
- **The background is art, not decoration.** Each page has its own scene. Scenes
  are grown-up and specific: a real place at a real time of day. They are never
  mascots, icons, or cartoons.
- **Everything moves on one clock.** Panes, scenery, and sound share one set of
  durations and curves ([Motion](#5-motion)), so a click feels like one gesture.
- **Quiet by default.** Nothing flashes, nothing loops loudly, sound is off until
  the visitor turns it on, and reduced-motion settings are respected everywhere.

## 2. Layout

The whole window is a stage (`.stage`). Inside it, the deck (`.deck`) is a row of
panes, starting at the top left, one `--cell` in from the edges.

| Element | Size | Notes |
| --- | --- | --- |
| `--cell` | 18px (16px on phones) | The grid step. Set in `components/site/scenery/index.tsx`. |
| Gap between panes | 12px (10px on phones) | `--gap` |
| Home pane | 380px wide | `.pane-home` |
| Page pane | 470px wide | `.pane-page` |
| Pane height | `100dvh - 2 * --cell` | Scrolls inside itself; the page never scrolls. |
| Pane padding | 30px 28px 24px (26px 22px 20px on phones) | |
| Pane corners | 18px | Also used in the clip-path keyframes. |

**Panes are frosted glass.** Background `rgb(14 17 24 / 0.8)`, `backdrop-filter:
blur(24px) saturate(1.8)` (16px on phones), a 1px inner line (`--line`), a faint top highlight, and
a soft drop shadow. The scenery shows through, blurred, so each page's colours
tint its panes.

The glass values were measured, not guessed: across every scene, at desktop and
phone sizes, all pane text keeps at least 4.5:1 contrast (WCAG AA) against what
shows through. Without backdrop-filter, or with `prefers-reduced-transparency`,
the fill turns nearly solid. Keep that bar if you change any of them.

**The home pane** holds, top to bottom: name, role, location with a filled
location arrow (in the page's accent) and the local time; the live sentence
(last commit, last post, local time); the page links (About, GitHub, X,
Contact); the Projects list, each name over its one-line `line`; the latest post
from X as a card; a footer with the email address and the sound switch. The
order answers who, where to go, and what I build before anything else.

**Phones (under 640px).** Panes become full-width cards, `100vw - 3 * --cell`,
starting a third of the way down so the scene shows above them, in a sideways
scroll-snap deck. Opening a pane scrolls it into view; closing scrolls back to
home. Swipes that start on a card move the deck (panes only contain vertical
overscroll). The scenery keeps running behind them.

**Narrow windows (640 to 899px).** Both panes don't fit, so the deck scrolls
sideways and snaps there too; the home pane is always one swipe away.

**Where the scenery puts things.** Scenes draw their subject in the open part of
the screen, to the right of the panes. That area is the *stage* passed to every
scene (`left`, `span`, `cx`, `unit`). When the gap right of the panes is narrower
than 260px, the stage becomes the right half of the window and the scene shows
through the glass instead. On phones the stage is the whole width.

## 3. Type

One typeface: **Geist**, loaded with `next/font/google` as `--font-sans`.

| Use | Size | Weight | Other |
| --- | --- | --- | --- |
| Body | 14.5px | 400 | line-height 1.65, letter-spacing -0.006em |
| Name, pane titles | 15.5px | 600 | letter-spacing -0.015em |
| Lead and intro paragraphs | 15.5px | 400 | line-height 1.7 on About |
| Post text | 14px | 400 | line-height 1.55 |
| Small labels (Projects, Stack, dates) | 12.5 to 13px | 400 | colour `--faint` or `--muted` |

No second font, no monospace, no all-caps labels. Hierarchy comes from colour
(`--text`, `--muted`, `--faint`) and a little weight, not from size jumps.

## 4. Colour

### Interface tokens (`app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#5d97df` | Shows only before the scenery's first frame. |
| `--pane` | `rgb(14 17 24 / 0.8)` | Glass pane fill. |
| `--card` | `rgb(255 255 255 / 0.055)` | Cards inside panes (the post card). |
| `--line` | `rgb(255 255 255 / 0.1)` | Hairlines and pane edges. |
| `--text` | `#e9ebf0` | Primary text. |
| `--muted` | `#c0c5cf` | Secondary text. |
| `--faint` | `#adb3bf` | Labels and meta. |
| `--accent` | per page | Links and the active item. |

### Accent per page

`:root[data-palette='<key>']` sets `--accent`. The scenery sets `data-palette` on
`<html>` from the route. Each accent is a light colour taken from that page's
scene, so links look lit by it.

| Key | Accent | Key | Accent |
| --- | --- | --- | --- |
| home | `#b3b9ff` | rune | `#ffb65c` |
| about | `#ffb7a6` | shipcrew | `#f2ae8b` |
| github | `#8ee6a8` | kintsugi | `#e8c65e` |
| x | `#8ecdfa` | auris | `#7ef0a2` |
| contact | `#e6cfae` | untilithappens | `#8ecfc0` |
| kubereach | `#9fbaff` | deid | `#cfcfcf` |
| evalcore | `#ff9fcf` | | |

### Scene colours

Each scene sets its own sky (top, bottom, cloud) and water (near, deep). Use the
time-of-day recipes in [Scene recipes](#65-scene-recipes) as a starting point.

## 5. Motion

All timings live in `lib/motion.ts`; the CSS keyframes in `app/globals.css` use
the same numbers. Change them together.

| Name | Value | What uses it |
| --- | --- | --- |
| `IN_MS` | 720ms | A pane sliding out; the next scene growing in; sky colours blending. |
| `OUT_MS` | 440ms | A pane sliding back and fading away. |
| `SWAP_MS` | 180ms | Switching pages: the open pane's text fades out... |
| `REOPEN_MS` | 560ms | ...and the new text drifts in. |
| `--glide` / `glide()` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things arriving: quick to start, a long soft landing. |
| `--glide-in` | `cubic-bezier(0.5, 0, 0.75, 0)` | Things leaving. |
| `--ease` / `ease()` | `cubic-bezier(0.22, 1, 0.36, 1)` | Text and colour settling. |

**Everything moves left to right.** Clicking a row draws a 1px accent hairline
under it (`trace`). The pane slides out to the right from behind the home pane:
it starts 32px to the left, clipped to nothing, and reveals left to right while
fading in (`slide-out`). Its text follows, drifting in from the left
(`content-in`). Closing slides it back and fades it (`slide-back`). Switching
between two open pages keeps the pane where it is: the old text fades out
toward the right, the new text drifts in after it. At the same time the scenery
grows the next scene out from the horizon line and the sky blends to its
colours.

**Only route changes animate.** `deck.tsx` animates when the path changes.
When the content of the page already open changes (Next delivering it a moment
after the path, or live data refreshing it), the pane updates in place with no
animation. Breaking this rule causes flicker and panes stuck with hidden text.

Hover states change colour only, in 0.15s. Nothing bounces. With
`prefers-reduced-motion`, every animation is off and scenes stop their clock.

## 6. Scenery

### 6.1 How it works

Three layers, back to front:

1. **Sky** (`components/site/scenery/sky.ts`): a WebGL cloud shader (from
   Aceternity UI's CloudShader) filling the area above the horizon. Each scene
   sets its colours, number of clouds (1 to 6), and the strength of the sun or
   moon glow.
2. **The picture:** each scene paints an ordinary Canvas 2D picture, in CSS
   pixels, onto a small hidden canvas with one pixel per line-screen cell.
   Anything the scene leaves transparent shows the sky.
3. **The printer** (`printer.ts`): turns the picture into line art. The screen is
   divided into cells 5px wide and 2px tall (4px wide on phones). Each cell
   becomes one vertical line:
   - **width** follows the cell's brightness: `0.14 + 0.92 * luma^0.85`, times
     the cell width, so bright areas print thick and dark areas thin;
   - **colour** is the cell's colour, lifted 14% toward white;
   - **paper**: behind the line, the same colour darkened fills the cell, so
     shapes read as solid. Above the horizon the scene chooses how much paper
     (`paper`, 0 to 1): 0 prints lines only, like the flamingos against the sky,
     and about 0.5 to 0.85 gives solid silhouettes for night and dusk scenes.
     Below the horizon paper is always 0.72;
   - **water** (below the horizon): line widths swell and thin in two slow
     crossing waves, so every lake moves;
   - **pointer**: lines near the cursor part sideways and thin, like reeds
     brushed aside.

Every scene has a lake at the same horizon (64% of the window height, 62% on
phones). That shared waterline is what makes twelve different places feel like
one site.

The component (`scenery/index.tsx`) runs one frame loop. It eases the stage when
panes open and close, paints the active scene or scenes, mixes two scenes during
a change (the new one grows out from the horizon), prints, and draws the sky. It
pauses when the tab is hidden.

### 6.2 The scene contract

A scene is one file in `components/site/scenery/scenes/` that default-exports:

```ts
export default scene<State>({
  sky: { top: '#…', bottom: '#…', cloud: '#…', clouds: 5, sun: 0.3 },
  paper: 0.55,
  setup(stage) {
    // Optional. Lay things out from the stage: positions, counts, seeds.
    // Runs again whenever the stage changes (panes open, window resizes).
    return state
  },
  paint(g, frame, state, kit) {
    // Draw in CSS px with Canvas 2D. frame has the stage plus t, dt,
    // pointer, reduce, and year (GitHub contributions per day).
  },
})
```

Then add one line to `scenes/index.ts`, keyed by the page's palette key.

**The usual paint shape:**

```ts
paint(g, f, st, kit) {
  stars(g, f, 80, seed, f.horizon * 0.8) // night scenes: straight onto g
  const back = kit.layer()               // everything that stands above the water
  // ...draw far shore, subject, lights into `back`...
  kit.water(g, back, f, nearColour, deepColour, 0.5) // lake + reflection + back on top
  // ...things floating on the water, drawn onto g after the lake...
}
```

**The kit** (`kit.ts`):

| Tool | What it does |
| --- | --- |
| `kit.layer()` | A cleared canvas the size of the picture, already scaled to CSS px. |
| `kit.water(g, layer, f, near, deep, alpha)` | Lake from the horizon down, the layer's reflection in it, then the layer on top. |
| `kit.lake(g, f, near, deep)` | Just the lake: a gradient with slow drifting light streaks. |
| `kit.reflect(g, layer, f, { line, alpha, reach })` | Mirror a layer below a line with a wobble and a fade. |
| `kit.sprite(glyph, px)` | An emoji as a cropped, colour-boosted image. Use only for animals that pass the quality bar below. |
| `reflectImage(...)` | Reflect one image about its own waterline (for things standing at different depths). |
| `glow(g, x, y, r, colour, alpha)` | A soft radial light: lamps, the sun, fog banks, highlights. |
| `ridge(...)`, `ridgeNoise(x)`, `ridged(x)`, `noise1(x)` | Hills (smooth) and mountains (sharp peaks). |
| `stars(g, f, count, seed, bottom)` | Twinkling stars. |
| `vgrad(g, y0, y1, stops)`, `rgba(c, a)`, `hash(n)` | Gradients, colours, and repeatable randomness. |

### 6.3 Designing a scene

**What makes a scene work.** Scenes that landed: the flamingos, the container
port, the tall ship, the lighthouse, the regatta, the causeway into the sunset, the
moonrise, the pier. Scenes that were rejected and replaced: cartoon emoji
objects (a satellite, a toy car, a life ring), a bowl on a stone, noisy
mountains, sea stacks that read as rounded pillars, a thin cherry tree, a torii
gate. What separates them:

1. **A place, not an icon.** Show where the thing would be: a port at night,
   not a Kubernetes logo; a mountain road at night, not a car.
2. **Clean geometry.** Smooth curves, straight edges, clear light and shadow
   faces, a few large shapes. Noisy outlines (random ridges, lumpy tops) look
   low quality once printed. When a shape can be read two ways, change it.
3. **A metaphor that is true, or none at all.** For a project, pick something
   whose real behaviour matches it: a crane moving containers (Kubernetes), a
   ship with a crew (agents working together), a lighthouse (a warning before it
   happens), long-exposure trails of cars on a road (live car telemetry),
   balloons rising at dawn (recovery), a regatta timed at the line every lap
   (evals run again after every change). For pages that are not projects (About, GitHub, X, Contact),
   choose pure beauty: a valley at sunset, an aurora, a moonrise, a pier at dusk.
4. **Silhouettes and a few lights.** The line screen loves strong shapes, large
   areas of one colour, and small bright points. Fine detail turns to mush.
5. **One meaningful motion**, plus a quiet bed (clouds, water, twinkling).
6. **Grown-up drawing, and respect.** Draw in code with gradients and light.
   Never use emoji objects (they are drawn as toys); emoji animals only if they
   print as well as the flamingo. Do not use another culture's sacred or
   national symbols as decoration.
7. **Leave room for the panes.** Keep the subject near `stage.cx`, sized from
   `stage.unit`, never fixed pixels.

**Responsive rules.**

- Size from `unit` (`min(span / 1.25, H * 0.9)`), or from `H` scaled by how wide
  the stage is. Never fixed pixel sizes.
- Reduce counts on narrow stages (for example 5 flamingos over 900px, 4 over
  600px, 3 below; fewer lanterns, birds, walkers).
- Keep the subject within `stage.left` to `stage.W`; let background bands (far
  shore, skyline, sky) run the full width.
- Check at 1440 by 900, 1024 by 700, and a phone.

**Performance budget.** 60 fps at 1440 by 900. The printer does the per-cell
work; scenes should only issue Canvas 2D draw calls. Keep glows under about 30
per frame, avoid per-pixel loops in `paint`, and precompute anything random in
`setup`.

### 6.4 The scenes

| Page | Scene (file) | Time | What moves | Why |
| --- | --- | --- | --- | --- |
| Home | Flamingos wading (`flamingos.ts`) | day, rose horizon | the flock bobs, reflections ripple | Colour and calm; home needs no meaning. |
| About | A valley with one snow peak (`valley.ts`) | sunset | birds cross; the water moves | Pure beauty, in clean layers. |
| GitHub | Aurora over a pine lake (`aurora.ts`) | night | the curtains ripple | Pure beauty. |
| X | Moonrise over the sea (`moonrise.ts`) | night | cloud drifts across the moon; birds pass | Pure beauty. |
| Contact | A pier at dusk (`pier.ts`) | dusk | the lamps flicker; the sun's path glitters | A place to meet. |
| kubereach | A container port (`port.ts`) | night | a crane moves a container; a searchlight sweeps | Containers, orchestration, reconnaissance. |
| Rune | A causeway road across the lake into the sunset (`causeway.ts`) | sunset | the centre line streams toward you; one car's tail lights hold ahead | The car, on the road it reads. |
| ShipCrew | A tall ship under sail (`ship.ts`) | golden hour | it rocks; the sun's path glitters | A crew working one ship. |
| Kintsugi | Hot-air balloons rising (`balloons.ts`) | dawn | the balloons drift up and sway | Rising again. |
| Auris | Snow on a pine lake, one cabin lit (`snowfall.ts`) | night | snow falls | So quiet you can hear everything, like watching every syscall. |
| untilithappens | A lighthouse on a headland (`lighthouse.ts`) | night | the beam turns and flashes; a ship passes | The warning before it happens. |
| DeID | A city across the water (`skyline.ts`) | dusk | windows switch on and off | Thousands of people, none identifiable. |
| EvalCore | A regatta on a bright day (`regatta.ts`) | day | the fleet races past the buoy; the committee boat snaps each boat at the line | Same course every lap, compared at the line, like evals after every change. |

### 6.5 Scene recipes

Starting colours by time of day (sky top, sky bottom, cloud; water near, deep;
paper; sun):

| Time | Sky | Water | Paper | Sun |
| --- | --- | --- | --- | --- |
| Day | `#3b7fd6` `#eccad2` `#fdfaf3` | `#43b08c` `#0f6a50` | 0 | 0.28 |
| Golden hour | `#4a74b6` `#f6c58d` `#fde4c6` | `#4e7896` `#122a3c` | 0.55 | 0.5 |
| Dusk | `#231d47` `#f19b72` `#f7c3a8` | `#3b3f72` `#121331` | 0.5 | 0.45 |
| Night | `#070b1a` `#223252` `#56627e` | `#1a3552` `#050d19` | 0.55 | 0.1 |
| Overcast | `#7d8ea6` `#dfe4ea` `#f6f7f9` | `#86a0ac` `#2c4450` | 0.6 | 0.06 |
| Fog | `#8f99a4` `#d9dcdf` `#eff1f3` | `#9aa5ab` `#4f5c64` | 0.65 | 0.04 |

Night scenes: 60 to 90 stars, 3 to 5 clouds, warm lights (`#ffd98a`,
`#ffe6b0`) against cool shapes. Dusk: silhouettes in deep violet or navy
(`#2a2348`, `#2c2d52`) against the warm band. Day: few dark shapes, let the
subject carry colour.

## 7. Sound

`lib/sound.ts`, all synthesized with Web Audio (no audio files). Off until the
visitor clicks the switch in the home pane's footer; the choice is remembered.

| Preset | What it is |
| --- | --- |
| Ambient | Warm pad chords (two detuned voices per note, low-passed, spread across the stereo field) moving through Dmaj9, Bm11, Gmaj7(#11), A6sus2, one every 10 seconds with long fades; soft bell notes every few seconds; the lake quietly underneath. Calm, but always moving somewhere. |
| Lake | Just the water: deep noise that swells every few seconds, short bright lapping at the shore, and a faint wind whose pitch wanders. |

Everything is in **D major**. Bells and interaction sounds use **D major
pentatonic** (D4 to E6): hover plays one very quiet high note; opening a pane
plays two notes rising; closing, two falling. Keep new sounds in this key and at
least as quiet. A synthesized room reverb (three seconds of decaying noise as
the impulse response) sits under the bells and pads.

## 8. Content and voice

- **Projects** live in `app/signals.ts` (`SIGNALS`). Each has a slug, name,
  tagline, description, dates, state, and GitHub repos. Pages read from it; do not
  hard-code project facts in components.
- **Live data** comes from `scripts/fetch-live.ts`, which runs before `dev` and
  `build`. It writes `lib/generated/live.ts` (typed, for the build) and
  `public/live.json` (for the browser to refresh). GitHub needs `GH_PAT` or
  `GITHUB_TOKEN`; X needs `X_BEARER_TOKEN`. Tokens live only in `.env.local`
  (never committed) and in GitHub Actions secrets. Private repositories are
  counted but never named in anything public.
- **Voice:** first person, plain words, short sentences. Say what a thing does
  and why I built it. No marketing (no "powerful", "seamless", "cutting-edge"),
  no em dashes, no emojis in copy, no exclamation marks.
- **Contact email:** `kuladeepbmantri@gmail.com` (`EMAIL` in `app/signals.ts`).
- **Photo:** `public/images/portrait.jpg` and `.webp`, 288px square, cropped to
  head and shoulders, saved without metadata. Strip metadata from any new photo
  before committing it (phone photos carry GPS coordinates).

## 9. Adding a project

1. **Content.** Add an entry to `SIGNALS` in `app/signals.ts` with a new `slug`.
   Its page (`/apps/<slug>`) and its row in Projects appear automatically.
2. **Accent.** Add `:root[data-palette='<slug>'] { --accent: … }` in
   `app/globals.css`: a light colour from the scene's palette.
3. **Scene.** Decide the place, the time of day, and the one meaningful motion
   ([Designing a scene](#63-designing-a-scene)). Create
   `components/site/scenery/scenes/<name>.ts` following the contract, starting
   from the closest existing scene and a time-of-day recipe.
4. **Register.** Add `<slug>: <name>` to `SCENES` in `scenes/index.ts`.
5. **Record it.** Add a row to the table in [The scenes](#64-the-scenes).
6. **Check** ([Checking your work](#10-checking-your-work)).

## 10. Checking your work

- `npm run lint` and `npm run build` must pass (the site is a static export).
- Look at the new page at 1440 by 900, 1024 by 700, and a phone size, with the
  pane open and closed. The subject must be visible and not crowded.
- Click from home to the page, between two project pages, and back. The change
  should read as one gesture.
- The frame rate should stay near 60 fps (a quick check in the browser console:
  count `requestAnimationFrame` calls over two seconds).
- No console errors. Turn on reduced motion and confirm scenes hold still.

## 11. File map

| Path | What it is |
| --- | --- |
| `app/layout.tsx` | Fonts, metadata, theme colour. |
| `app/globals.css` | Tokens, accents, layout, panes, keyframes. |
| `app/signals.ts` | Projects and site constants. |
| `app/<route>/page.tsx` | Each pane's content. |
| `components/site/shell.tsx` | Scenery, deck, and live data provider. |
| `components/site/deck.tsx` | Opening, closing, and switching panes. |
| `components/site/home-pane.tsx` | The home pane and the sound switch. |
| `components/site/scenery/` | The background: `index.tsx` (loop), `printer.ts`, `sky.ts`, `kit.ts`, `runtime.ts`, `scenes/`. |
| `lib/motion.ts` | Shared durations and curves. |
| `lib/sound.ts` | Sound presets and interaction notes. |
| `lib/panes.ts` | Route to pane key and palette key. |
| `scripts/fetch-live.ts` | Build-time GitHub and X data. |
| `.claude/skills/site-design/` | The skill that points agents here. |
