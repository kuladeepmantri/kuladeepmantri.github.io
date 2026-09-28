'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
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

// wade: stands in the shallows. swim: sits in the water. land: on a small shore.
type Kind = 'wade' | 'swim' | 'land'
type Spec = { glyph: string; kind: Kind; group?: boolean }

/** One animal per page, printed as a line screen from the system's emoji art. */
const ANIMALS: Record<string, Spec> = {
  home: { glyph: '🦩', kind: 'wade' },
  about: { glyph: '🦢', kind: 'swim' },
  github: { glyph: '🐈', kind: 'land' },
  x: { glyph: '🦚', kind: 'land' },
  contact: { glyph: '🦌', kind: 'land' },
  kubereach: { glyph: '🦭', kind: 'land' },
  rune: { glyph: '🐎', kind: 'land' },
  shipcrew: { glyph: '🦆', kind: 'swim', group: true },
  kintsugi: { glyph: '🦦', kind: 'swim' },
  auris: { glyph: '🦜', kind: 'land' },
  untilithappens: { glyph: '🦮', kind: 'land' },
  deid: { glyph: '🦔', kind: 'land' },
}

// Sky top, sky bottom, clouds, water at the horizon, deep water, lines near,
// lines deep, shore.
const SCENES: Record<string, string[]> = {
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

const colours = (k: string) => (SCENES[k] ?? SCENES.home).map(hex)

type Sprite = { w: number; h: number; px: Uint8ClampedArray }

/** Draws the animal (or a mother and two young), crops it, and brightens its colours. */
function makeSprite(spec: Spec, size: number): Sprite {
  const W = Math.round(size * (spec.group ? 2.6 : 1.4))
  const H = Math.round(size * 1.4)
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d', { willReadFrequently: true })!
  x.textAlign = 'center'
  x.textBaseline = 'alphabetic'
  const put = (s: number, cx: number) => {
    x.font = `${Math.round(size * s)}px ${EMOJI_FONT}`
    x.fillText(spec.glyph, cx, H * 0.86)
  }
  if (spec.group) {
    put(1, W * 0.3)
    put(0.6, W * 0.64)
    put(0.6, W * 0.86)
  } else put(1, W / 2)
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
  return { w, h, px }
}

type Actor = { spec: Spec; sprite: Sprite; tall: number; age: number; leaving: number }

/**
 * The background on every page: a cloud sky over green water, printed as
 * vertical lines whose width follows the brightness underneath. Each page has
 * its own small animal, with its reflection in the water; changing page fades
 * one out and lets the next one grow in from the top, and the sky and water
 * blend to the new page's colours.
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
    let horizon = 0
    let P = 5 // column pitch
    const R = 2 // cell height
    let cols = 0
    let rows = 0
    let widths = new Uint8Array(0)
    let shift = new Int8Array(0)
    let tint = new Uint32Array(0)
    let grain = new Float32Array(0)
    let rowBase = new Uint32Array(0)

    let key = want.current
    const tween = colourTween(colours(key))
    let actors: Actor[] = []
    let mound = 0 // shore height, eased toward the current animal's need
    let t = 0

    const tallFor = (k: Kind) => (k === 'wade' ? 0.27 : k === 'land' ? 0.2 : 0.14) * H

    function arrive(k: string) {
      const spec = ANIMALS[k] ?? ANIMALS.home
      for (const a of actors) if (!a.leaving) a.leaving = 0.0001
      const tall = tallFor(spec.kind)
      actors.push({
        spec,
        sprite: makeSprite(spec, Math.round(tall * 1.25)),
        tall,
        age: reduce ? 9 : 0,
        leaving: 0,
      })
      if (reduce) actors = actors.slice(-1)
    }

    function measure() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
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
      rowBase = new Uint32Array(H)
      buf.width = W
      buf.height = H
      img = bctx.createImageData(W, H)
      out = new Uint32Array(img.data.buffer)
      actors = actors.map((a) => {
        const tall = tallFor(a.spec.kind)
        return { ...a, tall, sprite: makeSprite(a.spec, Math.round(tall * 1.25)) }
      })
    }

    measure()
    arrive(key)
    window.addEventListener('resize', measure)

    const stop = loop((dt) => {
      if (want.current !== key) {
        key = want.current
        tween.set(colours(key))
        arrive(key)
      }
      tween.step(dt, 1.4)
      if (!reduce) t += dt
      ptr.ease(dt, 8)
      for (const a of actors) {
        a.age += dt
        if (a.leaving) a.leaving += dt
      }
      actors = actors.filter((a) => a.leaving < 0.7)
      const lead = actors[actors.length - 1]
      const wantMound = lead?.spec.kind === 'land' ? H * 0.045 : 0
      mound += (wantMound - mound) * Math.min(1, dt * 2.5)

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
      const cx = W < 640 ? W * 0.62 : x0 + (W - x0) * 0.56
      const moundW = Math.max(150, W < 640 ? W * 0.3 : (W - x0) * 0.2)

      // Where each actor stands this frame.
      const placed = actors.map((a) => {
        const s = a.sprite.h / a.tall
        const w = a.sprite.w / s
        const glide = a.spec.kind === 'swim' && !reduce ? Math.sin(t * 0.15) * 40 : 0
        const bob = a.spec.kind === 'swim' ? Math.sin(t * 1.1) * 1.5 : Math.sin(t * 0.8) * 1
        const sink = a.spec.kind === 'swim' ? 0.2 : a.spec.kind === 'wade' ? 0.035 : 0
        const base = horizon - (a.spec.kind === 'land' ? mound : 0) + a.tall * sink + bob
        const grow = Math.min(1, Math.max(0, (a.age - 0.2) / 1.0))
        return {
          a,
          s,
          left: cx - w / 2 + glide,
          top: base - a.tall,
          base,
          w,
          grow: grow * grow * (3 - 2 * grow),
          fade: a.leaving ? Math.max(0, 1 - a.leaving / 0.6) : 1,
        }
      })

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
          let rgba = 0

          // Shore: a low mound around the animal, and its reflection.
          const m = mound > 0.5 ? mound * Math.max(0, 1 - ((x - cx) / moundW) ** 2) ** 0.6 : 0
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

          // The animal, and its reflection in the water.
          for (const p of placed) {
            if (below) {
              const my = 2 * horizon - y // mirrored about the waterline
              const wob = Math.sin(y * 0.09 + t * 2.2) * (2 + 6 * d)
              const u = ((x + wob - p.left) * p.s) | 0
              const v = ((my - p.top) * p.s) | 0
              if (u < 0 || v < 0 || u >= p.a.sprite.w || v >= p.a.sprite.h) continue
              if (my > p.base) continue
              if (v / p.a.sprite.h > p.grow) continue
              const o = (v * p.a.sprite.w + u) * 4
              const al = p.a.sprite.px[o + 3] / 255
              if (al < 0.3) continue
              const fall = Math.max(0, 1 - (y - horizon) / (p.a.tall * 0.9))
              const ac: RGB = [
                p.a.sprite.px[o] / 255,
                p.a.sprite.px[o + 1] / 255,
                p.a.sprite.px[o + 2] / 255,
              ]
              col = mix(waterLine, ac, 0.55 * fall * p.fade)
              b = Math.max(b, (0.35 + 0.35 * fall) * p.fade)
            } else {
              if (y > p.base) continue
              const u = ((x - p.left) * p.s) | 0
              const v = ((y - p.top) * p.s) | 0
              if (u < 0 || v < 0 || u >= p.a.sprite.w || v >= p.a.sprite.h) continue
              if (v / p.a.sprite.h > p.grow) continue
              const o = (v * p.a.sprite.w + u) * 4
              const al = p.a.sprite.px[o + 3] / 255
              if (al < 0.3) continue
              const ac: RGB = [
                p.a.sprite.px[o] / 255,
                p.a.sprite.px[o + 1] / 255,
                p.a.sprite.px[o + 2] / 255,
              ]
              const l = 0.3 * ac[0] + 0.59 * ac[1] + 0.11 * ac[2]
              col = ac
              b = al * (0.62 + 0.38 * l) * p.fade
            }
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
          if (col) rgba = pack(col)
          widths[i] = b > 0 ? Math.max(0, Math.min(P - 1, Math.round(b * P))) : 0
          shift[i] = s
          tint[i] = rgba
        }
      }

      // Water fill under the lines, lighter at the horizon.
      for (let y = 0; y < H; y++)
        rowBase[y] =
          y < horizon ? 0 : pack(mix(waterTop, waterDeep, Math.sqrt((y - horizon) / (H - horizon))))

      const px = out!
      for (let y = 0; y < H; y++) {
        const r = (y / R) | 0
        const row = y * W
        px.fill(rowBase[y], row, row + W)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const w = widths[i]
          if (!w) continue
          const start = c * P + ((P - w) >> 1) + shift[i]
          const ink = tint[i]
          const a = Math.max(0, start)
          const e = Math.min(W, start + w)
          for (let k = a; k < e; k++) px[row + k] = ink
        }
      }
      bctx.putImageData(img!, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, canvas.width, canvas.height)
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
