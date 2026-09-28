'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { IN_MS, OUT_MS, snap } from '@/lib/motion'
import { normalizePath, placeFor } from '@/lib/panes'
import {
  colourTween,
  hex,
  loop,
  mix,
  openLeft,
  pack,
  reduceMotion,
  shaderCanvas,
  trackPointer,
  type RGB,
} from './scenes/common'
import { SKY_FRAG } from './scenes/sky'

// wade: stands in the shallows. swim: floats. land: on a low shore. sky: in the air.
type Kind = 'wade' | 'swim' | 'land' | 'sky'
type Motion = 'rock' | 'sail' | 'leap' | 'drift' | 'idle'

type Prop = {
  glyph: string
  kind: Kind
  size: number // height, as a fraction of the screen height
  x?: number // offset from the scene's centre, as a fraction of the screen height
  depth?: number // how far in front of the horizon it stands, as a fraction of the screen height
  sink?: number // how much of it is under the waterline
  mirror?: boolean
  motion?: Motion
  seams?: boolean // gold seams through its cracks
  phase?: number
}

type Scene = { props: Prop[]; uplink?: [number, number] }

const FLAMINGO = '🦩'

/** What stands in the water on each page, printed as a line screen from emoji art. */
const SCENES: Record<string, Scene> = {
  home: {
    props: [
      { glyph: FLAMINGO, kind: 'wade', size: 0.19, x: -0.36, depth: 0.012, mirror: true, phase: 1 },
      { glyph: FLAMINGO, kind: 'wade', size: 0.2, x: 0.37, depth: 0.018, phase: 5 },
      { glyph: FLAMINGO, kind: 'wade', size: 0.24, x: -0.18, depth: 0.034, phase: 2 },
      { glyph: FLAMINGO, kind: 'wade', size: 0.25, x: 0.2, depth: 0.042, mirror: true, phase: 4 },
      { glyph: FLAMINGO, kind: 'wade', size: 0.29, x: 0.01, depth: 0.07, phase: 3 },
    ],
  },
  about: { props: [{ glyph: '🐬', kind: 'swim', size: 0.16, depth: 0.04, motion: 'leap' }] },
  github: { props: [{ glyph: '🐈', kind: 'land', size: 0.2 }] },
  x: { props: [{ glyph: '🦚', kind: 'land', size: 0.22 }] },
  contact: { props: [{ glyph: '🦌', kind: 'land', size: 0.22 }] },
  kubereach: {
    props: [
      { glyph: '📡', kind: 'land', size: 0.16, x: -0.08 },
      { glyph: '🛰️', kind: 'sky', size: 0.1, x: 0.16, motion: 'drift' },
    ],
    uplink: [0, 1],
  },
  rune: { props: [{ glyph: '🚗', kind: 'land', size: 0.13, motion: 'idle' }] },
  shipcrew: {
    props: [{ glyph: '⛵', kind: 'swim', size: 0.24, depth: 0.03, sink: 0.07, motion: 'sail' }],
  },
  kintsugi: { props: [{ glyph: '🏺', kind: 'land', size: 0.2, seams: true }] },
  auris: { props: [{ glyph: '🦜', kind: 'land', size: 0.2 }] },
  untilithappens: {
    props: [{ glyph: '🛟', kind: 'swim', size: 0.12, depth: 0.05, sink: 0.3, motion: 'rock' }],
  },
  deid: { props: [{ glyph: '🦝', kind: 'land', size: 0.14 }] },
}

// Sky top, sky bottom, clouds, water at the horizon, deep water, lines near,
// lines deep, shore.
const COLOURS: Record<string, string[]> = {
  home: ['#3b7fd6', '#a9d4f5', '#fdfaf3', '#43b08c', '#0f6a50', '#c4f3dc', '#6fd8a8', '#8fae4c'],
  about: ['#6b8fd8', '#f6cfae', '#fff8f0', '#4aad8a', '#136a53', '#d0f5df', '#7bd9ad', '#9aae4e'],
  github: ['#2f8fc0', '#b4e9dc', '#fbfcf8', '#3aae83', '#0e684b', '#c0f4d8', '#66d9a0', '#86ad48'],
  x: ['#2471d4', '#9cccf6', '#fbfcff', '#3aa98f', '#0f6656', '#bff0e0', '#66d3b4', '#8aab52'],
  contact: ['#7d8fd6', '#ecd0ea', '#fff9fc', '#48ad8e', '#136955', '#cdf3e3', '#78d6b0', '#98ab58'],
  kubereach: [
    '#2f68d8',
    '#9cc0f6',
    '#fbfcff',
    '#35a896',
    '#0d615c',
    '#bdefe6',
    '#5fd0bf',
    '#86a856',
  ],
  rune: ['#4d88d6', '#f6dbab', '#fffaf0', '#49ad84', '#14694c', '#cff3d6', '#7ed8a2', '#a0ae48'],
  shipcrew: [
    '#4382d2',
    '#f5c3ae',
    '#fff8f4',
    '#44ab8a',
    '#126851',
    '#c9f2dc',
    '#74d6a8',
    '#94ac4e',
  ],
  kintsugi: [
    '#5a88c8',
    '#f4e3aa',
    '#fffbf0',
    '#4aa983',
    '#15674b',
    '#d2f2d2',
    '#84d69e',
    '#a4ad44',
  ],
  auris: ['#2f89c6', '#afeed0', '#fbfffc', '#36b085', '#0c6a4b', '#bdf6d8', '#5cdda0', '#84b04a'],
  untilithappens: [
    '#3e82c8',
    '#bfe6df',
    '#fbfefd',
    '#3dab91',
    '#10665a',
    '#c4f1e4',
    '#69d4ba',
    '#8cab54',
  ],
  deid: ['#6f88b8', '#dae1ec', '#fcfcfd', '#4aa892', '#16655a', '#cdeee5', '#7dd0bb', '#94a866'],
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'
const GOLD: RGB = [1, 0.86, 0.42]
const WHITE: RGB = [1, 1, 1]

const coloursFor = (k: string) => (COLOURS[k] ?? COLOURS.home).map(hex)

type Sprite = { w: number; h: number; px: Uint8ClampedArray; gold: Uint8Array | null }

/** Draws a glyph, crops it to what it covers, brightens its colours, and adds seams if asked. */
function makeSprite(glyph: string, size: number, seams: boolean): Sprite {
  const W = Math.round(size * 1.5)
  const H = Math.round(size * 1.5)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.font = `${Math.round(size)}px ${EMOJI_FONT}`
  x.fillText(glyph, W / 2, H / 2)
  const d = x.getImageData(0, 0, W, H).data
  let x0 = W
  let y0 = H
  let x1 = 0
  let y1 = 0
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++)
      if (d[(j * W + i) * 4 + 3] > 40) {
        x0 = Math.min(x0, i)
        x1 = Math.max(x1, i)
        y0 = Math.min(y0, j)
        y1 = Math.max(y1, j)
      }
  const w = Math.max(1, x1 - x0 + 1)
  const h = Math.max(1, y1 - y0 + 1)
  const px = new Uint8ClampedArray(w * h * 4)
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const s = ((j + y0) * W + i + x0) * 4
      const o = (j * w + i) * 4
      const r = d[s] / 255
      const g = d[s + 1] / 255
      const b = d[s + 2] / 255
      const l = 0.3 * r + 0.59 * g + 0.11 * b
      // More saturated and a little brighter, so the lines read as colour.
      px[o] = Math.min(255, (l + (r - l) * 1.4) * 1.08 * 255)
      px[o + 1] = Math.min(255, (l + (g - l) * 1.4) * 1.08 * 255)
      px[o + 2] = Math.min(255, (l + (b - l) * 1.4) * 1.08 * 255)
      px[o + 3] = d[s + 3]
    }
  let gold: Uint8Array | null = null
  if (seams) {
    // Two cracks that wander from the rim toward the foot, one with a branch.
    const g = new Uint8Array(w * h)
    const r = Math.max(3, Math.round(w * 0.03))
    const stamp = (cx: number, cy: number) => {
      for (let j = -r; j <= r; j++)
        for (let i = -r; i <= r; i++) {
          const X = Math.round(cx + i)
          const Y = Math.round(cy + j)
          if (X < 0 || Y < 0 || X >= w || Y >= h || i * i + j * j > r * r) continue
          if (px[(Y * w + X) * 4 + 3] > 120) g[Y * w + X] = 1
        }
    }
    const crack = (sx: number, sy: number, ey: number, lean: number) => {
      let cx = sx
      for (let cy = sy; cy < ey; cy += 1.5) {
        cx += (Math.random() - 0.5) * 3.2 + lean
        stamp(cx, cy)
      }
      return cx
    }
    const a = crack(w * 0.42, h * 0.12, h * 0.9, 0.12)
    crack(w * 0.62, h * 0.25, h * 0.6, -0.35)
    crack(a - w * 0.05, h * 0.55, h * 0.8, 0.6)
    gold = g
  }
  return { w, h, px, gold }
}

type Actor = { prop: Prop; sprite: Sprite; tall: number; age: number; leaving: number }
type Blob = {
  x: number
  y: number
  r: number
  grow: number
  t: number
  life: number
  vx: number
  vy: number
  fall: number
}

/**
 * The background on every page: a cloud sky over green water, printed as
 * vertical lines whose width follows the colour underneath. Each page stands
 * something of its own in the water, with its reflection. Changing page sinks
 * the old scene into its waterline and raises the next one out of it, on the
 * same timing and curve as the panes.
 */
export function Scenery() {
  const place = placeFor(normalizePath(usePathname()))
  const skyRef = useRef<HTMLCanvasElement>(null)
  const linesRef = useRef<HTMLCanvasElement>(null)
  const want = useRef(place.palette)
  want.current = place.palette

  useEffect(() => {
    document.documentElement.dataset.palette = place.palette
  }, [place.palette])

  useEffect(() => {
    const sky = shaderCanvas(skyRef.current!, SKY_FRAG, 0.5)
    const canvas = linesRef.current!
    const ctx = canvas.getContext('2d')!
    const root = document.documentElement
    const reduce = reduceMotion()
    const ptr = trackPointer()
    const buf = document.createElement('canvas')
    const bctx = buf.getContext('2d')!
    let img: ImageData | null = null
    let out: Uint32Array | null = null

    let W = 0
    let H = 0
    let dpr = 1
    let horizon = 0
    let P = 5 // column pitch
    const R = 2 // cell height
    let cols = 0
    let rows = 0
    let widths = new Uint8Array(0)
    let shift = new Int8Array(0)
    let tint = new Uint32Array(0)
    let grain = new Float32Array(0)

    let key = want.current
    const tween = colourTween(coloursFor(key))
    let actors: Actor[] = []
    let uplink: [Prop, Prop] | null = null
    let blobs: Blob[] = []
    let mound = 0
    let moundC = 0
    let moundW = 150
    let t = 0
    let puffAt = 0

    const build = (prop: Prop): Actor => {
      const tall = prop.size * H
      return {
        prop,
        tall,
        sprite: makeSprite(prop.glyph, Math.round(tall * 1.2), !!prop.seams),
        age: reduce ? 9 : 0,
        leaving: 0,
      }
    }

    function arrive(k: string) {
      const scene = SCENES[k] ?? SCENES.home
      for (const a of actors) if (!a.leaving) a.leaving = 0.0001
      const fresh = scene.props.map(build)
      actors = reduce ? fresh : [...actors, ...fresh]
      uplink = scene.uplink ? [scene.props[scene.uplink[0]], scene.props[scene.uplink[1]]] : null
    }

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      const cell = W < 640 ? 16 : 18
      root.style.setProperty('--cell', `${cell}px`)
      root.style.setProperty('--cols', String(Math.floor(W / cell)))
      horizon = Math.round(H * (W < 640 ? 0.62 : 0.64))
      sky?.resize(W, horizon)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      P = W < 640 ? 4 : 5
      cols = Math.ceil(W / P)
      rows = Math.ceil(H / R)
      widths = new Uint8Array(cols * rows)
      shift = new Int8Array(cols * rows)
      tint = new Uint32Array(cols * rows)
      grain = new Float32Array(cols * rows)
      for (let i = 0; i < grain.length; i++) grain[i] = Math.random()
      buf.width = W
      buf.height = H
      img = bctx.createImageData(W, H)
      out = new Uint32Array(img.data.buffer)
      actors = actors.map((a) => ({ ...build(a.prop), age: a.age, leaving: a.leaving }))
    }

    measure()
    arrive(key)
    window.addEventListener('resize', measure)

    const moundAt = (x: number) =>
      mound > 0.5 ? mound * Math.max(0, 1 - ((x - moundC) / moundW) ** 2) ** 0.6 : 0

    function splash(x: number, y: number) {
      for (let k = 0; k < 8; k++)
        blobs.push({
          x: x + (Math.random() - 0.5) * 24,
          y,
          r: 2 + Math.random() * 2.5,
          grow: 2,
          t: 0,
          life: 0.55 + Math.random() * 0.35,
          vx: (Math.random() - 0.5) * 80,
          vy: -70 - Math.random() * 70,
          fall: 260,
        })
    }

    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current
        tween.set(coloursFor(key))
        arrive(key)
      }
      tween.step(dt, IN_MS / 1000)
      if (!reduce) t += dt
      ptr.ease(dt, 8)
      for (const a of actors) {
        a.age += dt
        if (a.leaving) a.leaving += dt
      }
      actors = actors.filter((a) => a.leaving < OUT_MS / 1000)

      const [skyTop, skyBottom, cloud, waterTop, waterDeep, lineNear, lineDeep, shore] = tween.now()
      if (sky) {
        sky.f1('u_time', 40 + t)
        sky.f1('u_count', 6)
        sky.f3('u_cloud', cloud)
        sky.f3('u_skyTop', skyTop)
        sky.f3('u_skyBottom', skyBottom)
        sky.draw()
      }

      const x0 = openLeft(W)
      const phone = W < 640
      const cx = phone ? W * 0.6 : x0 + (W - x0) * 0.55
      const spread = Math.min(1, (phone ? W : W - x0) / (H * 1.05))

      // The shore follows the land props of the scene that is arriving.
      const land = actors.filter((a) => !a.leaving && a.prop.kind === 'land')
      mound += ((land.length ? H * 0.045 : 0) - mound) * Math.min(1, dt * 4)
      if (land.length) {
        const xs = land.map((a) => cx + (a.prop.x ?? 0) * H * spread)
        moundC = xs.reduce((s, v) => s + v, 0) / xs.length
        const half = (Math.max(...xs) - Math.min(...xs)) / 2
        const wide = Math.max(...land.map((a) => (a.sprite.w / a.sprite.h) * a.tall))
        moundW = Math.max(140, half + wide * 0.95)
      }

      // Where everything stands this frame.
      const placed = []
      for (const a of actors) {
        const p = a.prop
        const s = a.sprite.h / a.tall
        const w = a.sprite.w / s
        const ph = p.phase ?? 0
        const x = cx + (p.x ?? 0) * H * spread
        let dx = 0
        let dy = Math.sin(t * 0.8 + ph)
        let angle = 0
        let lift = 0
        if (p.motion === 'rock') {
          angle = Math.sin(t * 1.3 + ph) * 0.1
          dy = Math.sin(t * 1.3 + ph) * 3
        } else if (p.motion === 'sail') {
          dx = Math.sin(t * 0.09) * 0.06 * H
          angle = Math.sin(t * 0.9) * 0.05
          dy = Math.sin(t * 0.9) * 2
        } else if (p.motion === 'drift') {
          dx = Math.sin(t * 0.07) * 0.05 * H
          dy = Math.sin(t * 0.5) * 4
          angle = Math.sin(t * 0.3) * 0.06
        }
        const base =
          p.kind === 'land'
            ? horizon - moundAt(x + dx)
            : p.kind === 'sky'
              ? horizon - 0.36 * H
              : horizon + (p.depth ?? 0) * H
        let sink = p.sink ?? (p.kind === 'swim' ? 0.18 : p.kind === 'wade' ? 0.03 : 0)
        if (p.motion === 'leap') {
          // A leap every 6.5 s, starting just after arrival: out on the right, back in on the left.
          const air = 1.9
          const u = ((a.age - 0.35) % 6.5) / air
          if (reduce || a.age < 0.35 || u > 1) continue
          const span = 0.5 * H * spread
          const height = 0.2 * H
          dx = (0.5 - u) * span
          lift = 4 * u * (1 - u) * height
          sink = 0.8
          // The dolphin faces left: turn its nose along the direction of travel.
          angle = Math.atan2(-(4 - 8 * u) * height, -span) - Math.PI
          const was = u - dt / air
          for (const edge of [0.08, 0.92]) if (u >= edge && was < edge) splash(x + dx, base)
        }
        if (p.motion === 'idle' && !reduce && !a.leaving && a.age > 0.8 && t > puffAt) {
          // Exhaust from the back of the car (it faces left).
          puffAt = t + 0.75
          blobs.push({
            x: x + w * 0.47,
            y: base - a.tall * 0.18,
            r: 2.5,
            grow: 7,
            t: 0,
            life: 1.8,
            vx: 24,
            vy: -10,
            fall: 0,
          })
        }
        const bottom = base + a.tall * sink - lift
        placed.push({
          a,
          s,
          w,
          h: a.tall,
          mirror: !!p.mirror,
          cxp: x + dx,
          cyp: bottom - a.tall / 2 + dy,
          cos: Math.cos(angle),
          sin: Math.sin(angle),
          reach: angle ? Math.hypot(w, a.tall) / 2 : 0,
          base,
          reflect: p.kind !== 'sky',
          mirrorLine: p.kind === 'land' ? horizon : base,
          grow: a.leaving ? 1 : snap(Math.min(1, Math.max(0, (a.age - 0.1) / (IN_MS / 1000)))),
          gone: a.leaving ? snap(Math.min(1, a.leaving / (OUT_MS / 1000))) : 0,
        })
      }
      placed.sort((a, b) => a.base - b.base)

      for (const b of blobs) {
        b.t += dt
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.vy += b.fall * dt
        b.r += b.grow * dt
      }
      blobs = blobs.filter((b) => b.t < b.life)

      type Placed = (typeof placed)[number]
      /** Samples a placed sprite at a screen point: colour, coverage, gold. */
      const sample = (q: Placed, x: number, y: number) => {
        let lx = x - q.cxp
        let ly = y - q.cyp
        if (q.reach) {
          const rx = lx * q.cos + ly * q.sin
          ly = -lx * q.sin + ly * q.cos
          lx = rx
        }
        let u = ((lx + q.w / 2) * q.s) | 0
        const v = ((ly + q.h / 2) * q.s) | 0
        const sp = q.a.sprite
        if (u < 0 || v < 0 || u >= sp.w || v >= sp.h) return null
        // Rising in from the waterline; sinking out from the top.
        if (v < sp.h * (1 - q.grow) || v < sp.h * q.gone) return null
        if (q.mirror) u = sp.w - 1 - u
        const o = (v * sp.w + u) * 4
        const al = sp.px[o + 3] / 255
        if (al < 0.3) return null
        return {
          c: [sp.px[o] / 255, sp.px[o + 1] / 255, sp.px[o + 2] / 255] as RGB,
          al,
          gold: !!sp.gold && sp.gold[v * sp.w + u] === 1,
          v: v / sp.h,
        }
      }

      const pOn = ptr.p.on
      for (let r = 0; r < rows; r++) {
        const y = r * R + R / 2
        const below = y >= horizon
        const d = below ? (y - horizon) / (H - horizon) : 0
        // Lines sit a little above the water's own colour, so the surface stays calm.
        const waterLine = mix(
          mix(lineNear, lineDeep, Math.sqrt(d)),
          mix(waterTop, waterDeep, Math.sqrt(d)),
          0.35,
        )
        for (let c = 0; c < cols; c++) {
          const x = c * P + P / 2
          const i = r * cols + c
          let b = 0
          let col: RGB | null = null

          const m = moundAt(x)
          if (!below && m > 0 && y > horizon - m) {
            b = 0.5 + 0.35 * grain[i]
            col = mix(shore, [0.2, 0.3, 0.1], ((y - (horizon - m)) / Math.max(1, m)) * 0.35)
          }
          if (below) {
            const wave =
              0.5 +
              0.25 * Math.sin(x * 0.021 + y * 0.13 - t * 1.1) +
              0.25 * Math.sin(x * 0.012 - y * 0.19 + t * 0.7)
            b = 0.12 + 0.42 * d + 0.28 * wave * (0.4 + d) + 0.08 * grain[i]
            col = waterLine
            if (m > 0 && y < horizon + m * 0.8) {
              col = mix(shore, waterLine, 0.5)
              b = Math.max(b, 0.45)
            }
          }

          for (const q of placed) {
            const halfW = (q.reach || q.w / 2) + 2
            if (x < q.cxp - halfW || x > q.cxp + halfW) continue
            if (y <= q.base) {
              const halfH = (q.reach || q.h / 2) + 2
              if (y < q.cyp - halfH || y > q.cyp + halfH) continue
              const hit = sample(q, x, y)
              if (!hit) continue
              if (hit.gold) {
                col = mix(GOLD, WHITE, 0.35 + 0.3 * Math.sin(t * 2.2 - hit.v * 9))
                b = 1
              } else {
                const l = 0.3 * hit.c[0] + 0.59 * hit.c[1] + 0.11 * hit.c[2]
                col = hit.c
                b = hit.al * (0.62 + 0.38 * l)
              }
            } else if (below && q.reflect) {
              const my = 2 * q.mirrorLine - y
              if (my > q.base) continue
              const fall = 1 - (y - q.mirrorLine) / (q.h * 0.9)
              if (fall <= 0) continue
              const wob = Math.sin(y * 0.09 + t * 2.2) * (2 + 6 * d)
              const hit = sample(q, x + wob, my)
              if (!hit) continue
              col = mix(waterLine, hit.gold ? GOLD : hit.c, 0.55 * fall)
              b = Math.max(b, 0.35 + 0.35 * fall)
            }
          }

          for (const bl of blobs) {
            const dd = (x - bl.x) ** 2 + (y - bl.y) ** 2
            if (dd > bl.r * bl.r * 4) continue
            const k = (1 - bl.t / bl.life) * 0.85 * Math.exp(-dd / (bl.r * bl.r))
            if (k < 0.05) continue
            col = mix(col ?? WHITE, WHITE, Math.min(1, k * 1.4))
            b = Math.max(b, k)
          }

          // The pointer parts the lines around it.
          let s = 0
          if (pOn && b > 0) {
            const dx = x - ptr.p.sx
            const dy = y - ptr.p.sy
            const d2 = dx * dx + dy * dy
            if (d2 < 120 * 120) {
              const dd = Math.sqrt(d2) || 1
              s = Math.round((dx / dd) * 12 * Math.exp(-d2 / (2 * 50 * 50)))
              b *= 1 - 0.45 * Math.exp(-d2 / (2 * 36 * 36))
            }
          }
          widths[i] = col && b > 0 ? Math.max(0, Math.min(P - 1, Math.round(b * P))) : 0
          shift[i] = s
          tint[i] = col ? pack(col) : 0
        }
      }

      const px = out!
      for (let y = 0; y < H; y++) {
        const r = (y / R) | 0
        const row = y * W
        const fill =
          y < horizon ? 0 : pack(mix(waterTop, waterDeep, Math.sqrt((y - horizon) / (H - horizon))))
        px.fill(fill, row, row + W)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const w = widths[i]
          if (!w) continue
          const start = c * P + ((P - w) >> 1) + shift[i]
          const ink = tint[i]
          const e = Math.min(W, start + w)
          for (let k = Math.max(0, start); k < e; k++) px[row + k] = ink
        }
      }
      bctx.putImageData(img!, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height)

      // The uplink: a dotted line from the dish's feed to the satellite, with packets on it.
      const link = uplink
      const qa = link && placed.find((q) => q.a.prop === link[0] && !q.a.leaving)
      const qb = link && placed.find((q) => q.a.prop === link[1] && !q.a.leaving)
      if (qa && qb && qa.grow > 0.98 && qb.grow > 0.98) {
        const ax = qa.cxp + qa.w * 0.3
        const ay = qa.cyp - qa.h * 0.36
        const bx = qb.cxp - qb.w * 0.05
        const by = qb.cyp + qb.h * 0.1
        const n = Math.floor(Math.hypot(bx - ax, by - ay) / 8)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        for (let k = 1; k < n; k++) {
          const f = k / n
          ctx.fillRect(Math.round(ax + (bx - ax) * f) - 1, Math.round(ay + (by - ay) * f) - 1, 2, 2)
        }
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        for (const [speed, off, up] of [
          [0.42, 0, true],
          [0.42, 0.5, true],
          [0.3, 0.2, false],
        ] as const) {
          const f = (t * speed + off) % 1
          const g = up ? f : 1 - f
          ctx.fillRect(Math.round(ax + (bx - ax) * g) - 2, Math.round(ay + (by - ay) * g) - 2, 4, 4)
        }
      }
    })

    return () => {
      stop()
      ptr.stop()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <>
      <canvas ref={skyRef} className="sky" aria-hidden="true" />
      <canvas ref={linesRef} className="field" aria-hidden="true" />
    </>
  )
}
