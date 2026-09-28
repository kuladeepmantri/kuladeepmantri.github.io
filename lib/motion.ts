// One set of timings and curves for everything that moves on a page change:
// the panes (deck.tsx and the keyframes in globals.css) and the scenery. Keep
// the CSS durations in step with these.

/** A pane unfolding, and the scenery rising in with it. */
export const IN_MS = 650
/** A pane folding away, and the scenery sinking out. */
export const OUT_MS = 440
/** Switching pages: the open pane pinches into the clicked row's line... */
export const SWAP_MS = 210
/** ...and spreads open again from it. */
export const REOPEN_MS = 520

/** A CSS cubic-bezier as a function of progress (0 to 1). */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      const d = dx(t)
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break
      t -= e / d
    }
    return sy(Math.min(1, Math.max(0, t)))
  }
}

/** --snap in the CSS: a firm start and a soft landing, for things opening and closing. */
export const snap = bezier(0.7, 0, 0.2, 1)
/** --ease in the CSS: fast out, long settle, for text and colour. */
export const ease = bezier(0.22, 1, 0.36, 1)
