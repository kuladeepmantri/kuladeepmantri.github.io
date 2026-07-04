# Palette

Warm paper, ink text, one warm accent family. Never neon, never cliche. The background is already warm; the accent moves from a generic steel blue to a warm ember/rose.

## Site accent
Promote the existing `--kr-rose` (kubereach's accent) to the site-wide accent. It already exists in `app/globals.css`:
- light: `oklch(0.52 0.20 18)`
- dark: `oklch(0.72 0.16 18)`

Retire the blue `--accent` (`oklch(0.38 0.10 250)` / `oklch(0.62 0.10 250)`). Everywhere `--accent` is currently used, point it at the warm accent instead:
- `::selection` background
- focus-visible cursor block and text-input outline
- `.signal-entry` hover bar/tint fallback
- cluster-diagram box tint

## Per-project tint
Each project page sets one quiet `--signal-color` that tints its own accents (eyebrows, section rules, diagram highlights). Same warm family, small shifts, so the site stays coherent:

| project | tint | note |
|---------|------|------|
| kubereach | rose | the reference |
| rune | warm steel | cool contrast, still muted |
| auris | ember | deeper orange-red |
| kintsugi | soft gold | gentle, matches the recovery theme |
| shipcrew | indigo | cool contrast, still muted |
| deid | bronze | warm, muted |
| untilithappens | fuchsia | soft magenta |

## Rules
- Color is a seasoning, not the meal. Ink on paper does most of the work; the 3D and diagrams carry real color.
- No pure black, no pure white, no saturated blue. Keep everything in OKLCH so light/dark stay balanced.
- Status colors (active/shipped/paused/archived) stay semantic and separate from the accent.
