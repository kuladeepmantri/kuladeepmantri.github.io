// The toolkit every scene paints with. A scene draws a picture in CSS pixels
// onto a small hidden canvas (one pixel per line-screen cell); the printer
// then turns that picture into vertical lines. See DESIGN.md, "Scenery".

export type RGB = [number, number, number]

export function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** A CSS colour from a hex string or RGB, with alpha. */
export function rgba(c: string | RGB, a = 1) {
  const [r, g, b] = typeof c === 'string' ? hex(c) : c
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`
}

/** Deterministic 0 to 1 from a number. */
export function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Smooth 1D value noise, 0 to 1. */
export function noise1(x: number, seed = 0) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u
}

/** Layered 1D noise for ridgelines, 0 to 1. */
export function ridgeNoise(x: number, seed = 0) {
  return 0.55 * noise1(x, seed) + 0.3 * noise1(x * 2.3, seed + 3) + 0.15 * noise1(x * 5.1, seed + 7)
}

/** Where things go: the open part of the screen right of the panes. */
export type Stage = {
  W: number
  H: number
  horizon: number // the waterline, y in CSS px
  left: number // open area, x in CSS px
  right: number
  cx: number // its centre
  span: number // its width
  unit: number // a size that fits the open area: min(span / 1.25, H * 0.9)
  phone: boolean
}

/** A ripple on the lake: where it started, how far its ring has spread, and its strength. */
export type Drop = { x: number; y: number; age: number; r: number; a: number; a0?: number }

export type Frame = Stage & {
  t: number // seconds, frozen when reduced motion is on
  dt: number
  drops: Drop[]
  reduce: boolean
}

export type Sky = {
  top: string
  bottom: string
  cloud: string
  clouds?: number // 1 to 6
  sun?: number // strength of the soft sun or moon glow, 0 to 0.5
}

export type Scene<S = unknown> = {
  sky: Sky
  /** How solid things above the waterline print: 0 is lines only (the sky shows between), up to 1. */
  paper: number
  setup?: (s: Stage) => S
  paint: (g: CanvasRenderingContext2D, f: Frame, state: S, kit: Kit) => void
}

export type Kit = {
  /** A cleared canvas the size of the picture, for things that get reflected. */
  layer: () => CanvasRenderingContext2D
  /** Water from the horizon down: a gradient with slow light streaks. */
  lake: (g: CanvasRenderingContext2D, f: Frame, near: string, deep: string) => void
  /** Mirrors a layer below a line, with a wobble and a fade, onto the water. */
  reflect: (
    g: CanvasRenderingContext2D,
    layer: CanvasRenderingContext2D,
    f: Frame,
    opts?: { line?: number; alpha?: number; reach?: number },
  ) => void
  /** The usual ending: lake, the layer's reflection in it, then the layer on top. */
  water: (
    g: CanvasRenderingContext2D,
    layer: CanvasRenderingContext2D,
    f: Frame,
    near: string,
    deep: string,
    alpha?: number,
  ) => void
  /**
   * An emoji glyph as a cropped, colour-boosted image, cached. Null when the
   * system has no colour glyph for it (older Android, minimal Linux).
   */
  sprite: (glyph: string, px: number) => HTMLCanvasElement | null
}

/** A scene with its state type checked. */
export const scene = <S>(s: Scene<S>) => s as unknown as Scene

// ── Helpers scenes use directly ──

export function vgrad(
  g: CanvasRenderingContext2D,
  y0: number,
  y1: number,
  stops: [number, string][],
) {
  const gr = g.createLinearGradient(0, y0, 0, y1)
  for (const [o, c] of stops) gr.addColorStop(o, c)
  return gr
}

/** A soft radial light. */
export function glow(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  c: string | RGB,
  a: number,
) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r)
  gr.addColorStop(0, rgba(c, a))
  gr.addColorStop(0.35, rgba(c, a * 0.45))
  gr.addColorStop(1, rgba(c, 0))
  g.fillStyle = gr
  g.fillRect(x - r, y - r, r * 2, r * 2)
}

/** A filled ridgeline from x0 to x1 whose top is base - amp * noise, down to `floor`. */
export function ridge(
  g: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  base: number,
  amp: number,
  freq: number,
  seed: number,
  floor: number,
  fill: string | CanvasGradient,
) {
  g.beginPath()
  g.moveTo(x0, floor)
  for (let x = x0; x <= x1 + 4; x += 4) g.lineTo(x, base - amp * ridgeNoise(x * freq, seed))
  g.lineTo(x1 + 4, floor)
  g.closePath()
  g.fillStyle = fill
  g.fill()
}

/** A row of pine silhouettes standing on `base`, with the ground under them. */
export function pines(
  g: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  base: number,
  height: number,
  seed: number,
  fill: string,
) {
  g.fillStyle = fill
  g.fillRect(x0, base - 2, x1 - x0, 4)
  for (let x = x0; x < x1; ) {
    const h = height * (0.5 + 0.5 * hash(x * 0.37 + seed))
    const w = h * 0.34
    g.beginPath()
    for (let k = 0; k < 3; k++) {
      const ty = base - h + k * h * 0.27
      const bw = w * (0.5 + k * 0.3)
      g.moveTo(x, ty)
      g.lineTo(x + bw / 2, ty + h * 0.42)
      g.lineTo(x - bw / 2, ty + h * 0.42)
      g.closePath()
    }
    g.fill()
    g.fillRect(x - w * 0.05, base - h * 0.2, w * 0.1, h * 0.2)
    x += w * (0.35 + 0.45 * hash(x * 1.3 + seed))
  }
}

/** Small stars in the sky, twinkling. */
export function stars(
  g: CanvasRenderingContext2D,
  f: Frame,
  count: number,
  seed: number,
  bottom: number,
) {
  for (let i = 0; i < count; i++) {
    const x = hash(i * 3.1 + seed) * f.W
    const y = Math.pow(hash(i * 7.7 + seed), 1.4) * bottom
    const tw = 0.55 + 0.45 * Math.sin(f.t * (0.8 + hash(i) * 2) + i)
    const r = 0.8 + hash(i * 1.3) * 1.4
    g.fillStyle = rgba('#f4f1ff', 0.35 + 0.6 * tw * hash(i * 5.5 + 1))
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
}

/** Draws an image mirrored below `line`, in thin strips that wobble like water. */
export function reflectImage(
  g: CanvasRenderingContext2D,
  img: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  line: number,
  f: Frame,
  alpha = 0.5,
  mirrorX = false,
) {
  const reach = h * 0.9
  const strip = 2
  g.save()
  for (let dy = 0; dy < reach; dy += strip) {
    const sy = line - dy // the point being reflected
    const iy = ((sy - y) / h) * img.height
    if (iy < 0 || iy >= img.height) continue
    const fall = 1 - dy / reach
    const wob = Math.sin((line + dy) * 0.09 + f.t * 2.2) * (1.5 + dy * 0.04)
    g.globalAlpha = alpha * fall
    if (mirrorX) {
      g.save()
      g.translate(x + w / 2 + wob, 0)
      g.scale(-1, 1)
      g.drawImage(
        img,
        0,
        iy,
        img.width,
        Math.max(1, (strip / h) * img.height),
        -w / 2,
        line + dy,
        w,
        strip,
      )
      g.restore()
    } else
      g.drawImage(
        img,
        0,
        iy,
        img.width,
        Math.max(1, (strip / h) * img.height),
        x + wob,
        line + dy,
        w,
        strip,
      )
  }
  g.restore()
}

// ── The shared kit, bound to the picture's size ──

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'

// The scenes paint on the CPU (the printer reads every picture back), so their
// scratch canvases stay in CPU memory too: no GPU readback per layer per frame.
export function scratch(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) throw new Error('scenery: no 2D canvas')
  return g
}

// Kept across resizes. Scenes ask for few sizes, but bound it anyway.
const sprites = new Map<string, HTMLCanvasElement | null>()

function makeSprite(glyph: string, px: number) {
  const S = Math.round(px * 1.5)
  const x = scratch(S, S)
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = `${px}px ${EMOJI_FONT}`
  x.fillText(glyph, S / 2, S / 2)
  const d = x.getImageData(0, 0, S, S)
  let x0 = S
  let y0 = S
  let x1 = 0
  let y1 = 0
  let colour = 0
  for (let j = 0; j < S; j++)
    for (let i = 0; i < S; i++) {
      const o = (j * S + i) * 4
      if (d.data[o + 3] > 40) {
        x0 = Math.min(x0, i)
        x1 = Math.max(x1, i)
        y0 = Math.min(y0, j)
        y1 = Math.max(y1, j)
        const hi = Math.max(d.data[o], d.data[o + 1], d.data[o + 2])
        const lo = Math.min(d.data[o], d.data[o + 1], d.data[o + 2])
        if (hi - lo > 40) colour++
      }
      // More saturated and a little brighter, so the lines read as colour.
      const r = d.data[o] / 255
      const gg = d.data[o + 1] / 255
      const b = d.data[o + 2] / 255
      const l = 0.3 * r + 0.59 * gg + 0.11 * b
      d.data[o] = Math.min(255, (l + (r - l) * 1.4) * 1.08 * 255)
      d.data[o + 1] = Math.min(255, (l + (gg - l) * 1.4) * 1.08 * 255)
      d.data[o + 2] = Math.min(255, (l + (b - l) * 1.4) * 1.08 * 255)
    }
  // A missing glyph prints as an empty or grey box (.notdef): no colour at all.
  if (colour < S) return null
  x.putImageData(d, 0, 0)
  const out = scratch(Math.max(1, x1 - x0 + 1), Math.max(1, y1 - y0 + 1))
  out.drawImage(x.canvas, -x0, -y0)
  return out.canvas
}

export function makeKit(cols: number, rows: number, P: number, R: number) {
  const pool: CanvasRenderingContext2D[] = []
  let used = 0

  const kit: Kit & { reset: () => void; resize: (c: number, r: number, p: number) => void } = {
    reset() {
      used = 0
    },
    /** Reuses the layer canvases at a new picture size. */
    resize(c, r, p) {
      cols = c
      rows = r
      P = p
      for (const g of pool) {
        g.canvas.width = cols
        g.canvas.height = rows
      }
    },
    layer() {
      if (!pool[used]) pool[used] = scratch(cols, rows)
      const g = pool[used++]
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, cols, rows)
      g.setTransform(1 / P, 0, 0, 1 / R, 0, 0)
      return g
    },
    lake(g, f, near, deep) {
      g.fillStyle = vgrad(g, f.horizon, f.H, [
        [0, near],
        [1, deep],
      ])
      g.fillRect(0, f.horizon, f.W, f.H - f.horizon)
      // Slow streaks of light on the surface, longer and brighter near the viewer.
      for (let i = 0; i < 70; i++) {
        const d = Math.pow(hash(i * 1.7), 1.5)
        const y = f.horizon + 3 + d * (f.H - f.horizon)
        const len = 18 + 90 * d * hash(i * 2.3)
        const x = ((hash(i * 4.1) * f.W * 1.4 + f.t * (4 + 10 * d)) % (f.W * 1.4)) - f.W * 0.2
        g.fillStyle = rgba('#ffffff', 0.05 + 0.1 * hash(i * 9.9))
        g.fillRect(x, y, len, 1.5 + d * 2)
      }
    },
    reflect(g, layer, f, opts = {}) {
      const line = opts.line ?? f.horizon
      const alpha = opts.alpha ?? 0.5
      const reach = (opts.reach ?? 0.8) * (f.H - line)
      const r0 = Math.round(line / R)
      g.save()
      g.setTransform(1, 0, 0, 1, 0, 0)
      for (let j = r0; j < rows; j++) {
        const k = j - r0
        const src = r0 - k - 1
        const fall = 1 - (k * R) / reach
        if (src < 0 || fall <= 0) break
        const wob = (Math.sin(j * R * 0.09 + f.t * 2.2) * (1.5 + (k * R) / 18)) / P
        g.globalAlpha = alpha * fall
        g.drawImage(layer.canvas, 0, src, cols, 1, wob, j, cols, 1)
      }
      g.restore()
    },
    water(g, layer, f, near, deep, alpha = 0.5) {
      kit.lake(g, f, near, deep)
      kit.reflect(g, layer, f, { alpha })
      g.save()
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.drawImage(layer.canvas, 0, 0)
      g.restore()
    },
    sprite(glyph, px) {
      const key = `${glyph}|${px}`
      if (sprites.has(key)) return sprites.get(key) ?? null
      if (sprites.size >= 16) sprites.clear()
      let img: HTMLCanvasElement | null = null
      try {
        img = makeSprite(glyph, px)
      } catch {
        // no canvas memory left: the scene goes without this sprite
      }
      sprites.set(key, img)
      return img
    },
  }
  return kit
}
