// One set of timings and curves for everything that moves on a page change:
// the panes (deck.tsx and the keyframes in globals.css) and the scenery. Keep
// the CSS durations in step with these.

/** A pane sliding out to the right, and the next scene growing in with it. */
export const IN_MS = 720
/** A pane sliding back and fading away. */
export const OUT_MS = 440
/** Switching pages: the new text drifts in from the left. */
export const REOPEN_MS = 560

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

/** --glide in the CSS: quick to start, a long soft landing, for panes and scenes arriving. */
export const glide = bezier(0.16, 1, 0.3, 1)
/** --ease in the CSS: fast out, long settle, for text and colour. */
export const ease = bezier(0.22, 1, 0.36, 1)
