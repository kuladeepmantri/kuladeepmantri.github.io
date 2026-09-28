import type { Drop } from './kit'
// The line screen. Each cell of the picture (P CSS px wide, R tall) becomes a
// vertical line whose width follows the cell's brightness and whose colour is
// the cell's colour, a little lifted. Behind the line, a "paper" of the same
// colour, darkened, can fill the cell so shapes read as solid. Cells the scene
// left transparent print nothing, and the sky shader shows through.

export type PrintOpts = {
  cols: number
  rows: number
  P: number
  R: number
  W: number
  H: number
  horizon: number
  paperAbove: number // 0 (lines only) to 1
  paperCell: Uint8Array // per cell, 0 to 255, used instead of paperAbove while two scenes mix
  usePaperCell: boolean
  paperBelow: number
  t: number
  drops: Drop[]
}

const pack = (r: number, g: number, b: number, a: number) =>
  ((a << 24) | (b << 16) | (g << 8) | r) >>> 0

export function makePrinter(cols: number, rows: number) {
  const widths = new Uint8Array(cols * rows)
  const line = new Uint32Array(cols * rows)
  const paper = new Uint32Array(cols * rows)

  return function print(src: Uint8ClampedArray, out: Uint32Array, o: PrintOpts) {
    const { P, R, W, H, horizon, t, drops } = o
    for (let r = 0; r < rows; r++) {
      const y = r * R + R / 2
      const below = y >= horizon
      const d = below ? (y - horizon) / (H - horizon) : 0
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const k = i * 4
        const a = src[k + 3]
        if (a < 10) {
          widths[i] = 0
          paper[i] = 0
          continue
        }
        const pk = below ? o.paperBelow : o.usePaperCell ? o.paperCell[i] / 255 : o.paperAbove
        const rr = src[k]
        const gg = src[k + 1]
        const bb = src[k + 2]
        const l = (0.3 * rr + 0.59 * gg + 0.11 * bb) / 255
        const x = c * P + P / 2
        let b = 0.14 + 0.92 * Math.pow(l, 0.85)
        if (below) {
          // Water moves: the lines swell and thin in slow crossing waves.
          const wave =
            0.5 +
            0.25 * Math.sin(x * 0.021 + y * 0.13 - t * 1.1) +
            0.25 * Math.sin(x * 0.012 - y * 0.19 + t * 0.7)
          b *= 0.7 + 0.55 * wave * (0.45 + d)
        }
        b *= Math.min(1, (a / 255) * 1.3)
        // The wake: rings spreading from where the pointer crossed the water.
        // Lines swell on the crest and thin just behind it; flattened
        // vertically, the way ripples look on a lake seen from the shore.
        let w = 0
        if (below && drops.length) {
          for (const d of drops) {
            const dx = x - d.x
            if (dx > d.r + 20 || dx < -d.r - 20) continue
            const dy = (y - d.y) * 2.6
            const off = Math.sqrt(dx * dx + dy * dy) - d.r
            if (off > -20 && off < 20) w += Math.cos(off * 0.24) * Math.exp(-(off * off) / 160) * d.a
          }
          b *= 1 + 0.8 * w
        }
        widths[i] = Math.max(0, Math.min(P - 1, Math.round(b * P)))
        // Crests catch the light, like a real ripple reflecting the sky.
        const lift = 0.14 + 0.3 * Math.max(0, Math.min(1, w))
        line[i] = pack(
          Math.min(255, rr + (255 - rr) * lift),
          Math.min(255, gg + (255 - gg) * lift),
          Math.min(255, bb + (255 - bb) * lift),
          Math.min(255, Math.round(a * 1.5)),
        )
        paper[i] = pk > 0 ? pack((rr * pk) | 0, (gg * pk) | 0, (bb * pk) | 0, a) : 0
      }
    }

    out.fill(0)
    for (let y = 0; y < H; y++) {
      const r = (y / R) | 0
      if (r >= rows) break
      const row = y * W
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const p = paper[i]
        const x0 = c * P
        if (p) out.fill(p, row + x0, row + Math.min(W, x0 + P))
        const w = widths[i]
        if (!w) continue
        const start = x0 + ((P - w) >> 1)
        const e = Math.min(W, start + w)
        const ink = line[i]
        for (let k = Math.max(0, start); k < e; k++) out[row + k] = ink
      }
    }
  }
}
