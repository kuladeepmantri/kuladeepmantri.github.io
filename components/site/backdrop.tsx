'use client'

// Background candidates for the lab switcher. Each one draws the same live
// inputs in a different medium: the active page's palette, the last year of
// activity mapped across the open wall (left to right, a year ago to today),
// the pointer, and time.

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { TIMEZONE } from '@/lib/constants'
import { normalizePath, placeFor } from '@/lib/panes'
import { DAY, PALETTES, YEAR_DAYS, buildLUT, dailyHeat, fbm, noise3 } from '@/lib/wall'
import type { Source } from './wall'

export type Mode = 'aurora' | 'contours' | 'currents' | 'signal' | 'stars' | 'dither'

type Frame = {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  W: number
  H: number
  dpr: number
  t: number
  dt: number
  col: (v: number) => string
  rgb: (v: number) => [number, number, number]
  act: (x: number) => number
  soft: (x: number) => number // act blurred over about 60px, for broad shapes
  x0: number
  x1: number
  pointer: { x: number; y: number; on: boolean }
  days: { x: number; n: number; day: number }[] // active days placed on screen
  peak: number
}

type Renderer = { draw: (f: Frame) => void }

const DAY_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: TIMEZONE })

function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/* ── 1. Aurora: curtains of light over a lake, tall where the year was busy ── */
function aurora(): Renderer {
  const stars = Array.from({ length: 220 }, (_, i) => ({ x: hash1(i), y: hash1(i + 99) * 0.7, p: hash1(i + 7) }))
  const sprite = document.createElement('canvas')
  sprite.width = 1
  sprite.height = 256
  const sctx = sprite.getContext('2d')!
  return {
    draw(f) {
      const { ctx, W, H, t, dpr } = f
      const horizon = H * 0.78
      const sky = ctx.createLinearGradient(0, 0, 0, horizon)
      sky.addColorStop(0, f.col(0))
      sky.addColorStop(1, f.col(0.12))
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, horizon)
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.p * 20))
        ctx.fillStyle = '#fff'
        ctx.fillRect(s.x * W, s.y * horizon, 1.2, 1.2)
      }
      // One vertical gradient, bright at the lower edge like a real curtain.
      const [r1, g1, b1] = f.rgb(0.62)
      const [r2, g2, b2] = f.rgb(0.9)
      const gr = sctx.createLinearGradient(0, 0, 0, 256)
      gr.addColorStop(0, `rgba(${r2},${g2},${b2},0)`)
      gr.addColorStop(0.45, `rgba(${r2},${g2},${b2},0.35)`)
      gr.addColorStop(0.9, `rgba(${r1},${g1},${b1},1)`)
      gr.addColorStop(1, `rgba(${r1},${g1},${b1},0.1)`)
      sctx.clearRect(0, 0, 1, 256)
      sctx.fillStyle = gr
      sctx.fillRect(0, 0, 1, 256)

      // Three ribbons that meander across the sky; each hangs a curtain up
      // from its line. Quiet stretches still glow faintly, busy ones blaze.
      ctx.globalCompositeOperation = 'lighter'
      for (let r = 0; r < 3; r++) {
        for (let x = -40; x < W + 40; x += 3) {
          const line =
            horizon - H * (0.1 + 0.09 * r) - H * 0.16 * (fbm(x * 0.0012 + r * 10, t * 0.035 + r, r) - 0.5)
          const amb = Math.max(0, fbm(x * 0.0028 + t * 0.03 + r * 5, r * 3.1, t * 0.05) - 0.38) * 1.6
          const a = f.soft(x)
          let glow = 0
          let lean = 18 * (noise3(x * 0.01, r, t * 0.4) - 0.5)
          if (f.pointer.on) {
            const dx = x - f.pointer.x
            const k = Math.exp(-(dx * dx) / (2 * 150 * 150))
            lean += 40 * k * Math.sign(dx)
            glow = 0.3 * k
          }
          const I = amb * (0.55 - r * 0.12) + a * (1 - r * 0.25) + glow
          if (I < 0.02) continue
          const h = H * (0.07 + 0.2 * amb + 0.42 * a)
          ctx.globalAlpha = Math.min(1, I) * 0.42
          ctx.drawImage(sprite, x + lean, line - h, 4, h + H * 0.02)
        }
      }
      // The lake: the sky reflected, dimmed, with faint ripples.
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = f.col(0.02)
      ctx.globalAlpha = 1
      ctx.fillRect(0, horizon, W, H - horizon)
      ctx.save()
      ctx.globalAlpha = 0.28
      ctx.translate(0, horizon * 2)
      ctx.scale(1, -1)
      const refl = Math.min(H - horizon, horizon)
      ctx.drawImage(f.canvas, 0, (horizon - refl) * dpr, W * dpr, refl * dpr, 0, horizon - refl, W, refl)
      ctx.restore()
      ctx.globalAlpha = 0.07
      ctx.fillStyle = '#fff'
      for (let y = horizon + 3; y < H; y += 5) {
        const w = 0.5 + 0.5 * Math.sin(y * 0.7 + t * 1.5)
        ctx.fillRect(0, y, W, w)
      }
      ctx.globalAlpha = 1
    },
  }
}

/* ── 2. Contours: a topographic map whose mountains are the busy weeks ── */
function contours(): Renderer {
  const STEP = 10
  const LEVELS = 18
  let hf = new Float32Array(0)
  return {
    draw(f) {
      const { ctx, W, H, t } = f
      const gx = Math.ceil(W / STEP) + 2
      const gy = Math.ceil(H / STEP) + 2
      if (hf.length !== gx * gy) hf = new Float32Array(gx * gy)
      for (let j = 0; j < gy; j++)
        for (let i = 0; i < gx; i++) {
          const x = i * STEP
          const y = j * STEP
          let h = 0.55 * fbm(x * 0.0024 + t * 0.012, y * 0.0024 - t * 0.006, t * 0.02)
          const a = f.soft(x)
          if (a > 0) h += a * 0.7 * Math.exp(-(((y - H * 0.58) / (H * 0.3)) ** 2))
          if (f.pointer.on) {
            const d2 = (x - f.pointer.x) ** 2 + (y - f.pointer.y) ** 2
            h += 0.22 * Math.exp(-d2 / (2 * 110 * 110))
          }
          hf[j * gx + i] = h
        }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle = f.col(0.015)
      ctx.fillRect(0, 0, W, H)
      for (let l = 1; l <= LEVELS; l++) {
        const iso = 0.08 + (l / LEVELS) * 0.95
        ctx.beginPath()
        for (let j = 0; j < gy - 1; j++)
          for (let i = 0; i < gx - 1; i++) {
            const a = hf[j * gx + i]
            const b = hf[j * gx + i + 1]
            const c = hf[(j + 1) * gx + i + 1]
            const d = hf[(j + 1) * gx + i]
            const k = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0)
            if (k === 0 || k === 15) continue
            const x = i * STEP
            const y = j * STEP
            const top = x + ((iso - a) / (b - a)) * STEP
            const right = y + ((iso - b) / (c - b)) * STEP
            const bot = x + ((iso - d) / (c - d)) * STEP
            const left = y + ((iso - a) / (d - a)) * STEP
            const seg = (x1: number, y1: number, x2: number, y2: number) => {
              ctx.moveTo(x1, y1)
              ctx.lineTo(x2, y2)
            }
            switch (k) {
              case 1: case 14: seg(x, left, bot, y + STEP); break
              case 2: case 13: seg(bot, y + STEP, x + STEP, right); break
              case 3: case 12: seg(x, left, x + STEP, right); break
              case 4: case 11: seg(top, y, x + STEP, right); break
              case 5: seg(x, left, top, y); seg(bot, y + STEP, x + STEP, right); break
              case 6: case 9: seg(top, y, bot, y + STEP); break
              case 7: case 8: seg(x, left, top, y); break
              case 10: seg(top, y, x + STEP, right); seg(x, left, bot, y + STEP); break
            }
          }
        ctx.strokeStyle = f.col(0.42 + 0.56 * (l / LEVELS))
        ctx.lineWidth = l % 4 === 0 ? 1.7 : 1
        ctx.globalAlpha = l % 4 === 0 ? 1 : 0.75
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
  }
}

/* ── 3. Currents: particles on a flow field; busy days send them upward ── */
function currents(): Renderer {
  type P = { x: number; y: number; life: number }
  let ps: P[] = []
  let cdf: number[] = []
  function spawn(p: P, f: Frame) {
    const total = cdf[cdf.length - 1] ?? 0
    if (total > 0 && Math.random() < 0.55) {
      const r = Math.random() * total
      let lo = 0
      let hi = cdf.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cdf[mid] < r) lo = mid + 1
        else hi = mid
      }
      p.x = f.x0 + lo * 4 + Math.random() * 4
      p.y = f.H - Math.random() * f.H * 0.15
    } else {
      p.x = Math.random() * f.W
      p.y = Math.random() * f.H
    }
    p.life = 80 + Math.random() * 160
  }
  let cleared = false
  return {
    draw(f) {
      const { ctx, W, H, t } = f
      const want = Math.round(Math.min(3200, (W * H) / 420))
      while (ps.length < want) {
        const p = { x: 0, y: 0, life: 0 }
        ps.push(p)
      }
      if (ps.length > want) ps = ps.slice(0, want)
      cdf = []
      let acc = 0
      for (let x = f.x0; x < f.x1; x += 4) {
        acc += f.act(x) ** 2
        cdf.push(acc)
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = cleared ? 0.1 : 1
      cleared = true
      ctx.fillStyle = f.col(0.01)
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      const buckets: number[][] = Array.from({ length: 12 }, () => [])
      for (const p of ps) {
        if (p.life <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) spawn(p, f)
        const ang = (fbm(p.x * 0.0017, p.y * 0.0017, t * 0.05) - 0.5) * Math.PI * 4
        let vx = Math.cos(ang) * 0.9
        let vy = Math.sin(ang) * 0.9
        const a = f.act(p.x)
        vy -= a * 1.9
        if (f.pointer.on) {
          const dx = p.x - f.pointer.x
          const dy = p.y - f.pointer.y
          const d = Math.hypot(dx, dy) + 0.001
          if (d < 150) {
            const k = (1 - d / 150) * 2.4
            vx += (dx / d) * k - (dy / d) * k * 0.8
            vy += (dy / d) * k + (dx / d) * k * 0.8
          }
        }
        const sp = f.dt * 60
        p.x += vx * sp
        p.y += vy * sp
        p.life -= sp
        const lvl = Math.min(11, Math.floor((0.45 + 0.45 * a + 0.1 * Math.hypot(vx, vy)) * 11))
        buckets[lvl].push(p.x, p.y)
      }
      ctx.globalAlpha = 0.7
      for (let k = 0; k < 12; k++) {
        const b = buckets[k]
        if (!b.length) continue
        ctx.fillStyle = f.col(0.3 + (k / 11) * 0.68)
        for (let q = 0; q < b.length; q += 2) ctx.fillRect(b[q], b[q + 1], 1.4, 1.4)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/* ── 4. Signal: phosphor traces on a scope, with the year as their envelope ── */
function signal(): Renderer {
  let cleared = false
  return {
    draw(f) {
      const { ctx, W, H, t } = f
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = cleared ? 0.22 : 1
      cleared = true
      ctx.fillStyle = f.col(0.01)
      ctx.fillRect(0, 0, W, H)
      // Graticule: dots every division, brighter on the axes.
      ctx.globalAlpha = 0.22
      ctx.fillStyle = f.col(0.35)
      const div = 48
      for (let y = div / 2; y < H; y += div)
        for (let x = div / 2; x < W; x += div / 4) ctx.fillRect(x, y, 1, 1)
      for (let x = div / 2; x < W; x += div)
        for (let y = div / 2; y < H; y += div / 4) ctx.fillRect(x, y, 1, 1)

      const sweep = ((t * 0.18) % 1.2) * W
      const K = 5
      ctx.globalCompositeOperation = 'lighter'
      for (let k = 0; k < K; k++) {
        const base = H * (0.34 + 0.08 * k)
        ctx.beginPath()
        for (let x = 0; x <= W; x += 3) {
          const a = f.act(x)
          let env = 0.05 + a * 1.1
          if (f.pointer.on) {
            const d = Math.abs(f.pointer.y - base) + Math.abs(f.pointer.x - x) * 0.3
            env += 0.5 * Math.exp(-(d * d) / (2 * 60 * 60))
          }
          const near = Math.exp(-(((x - sweep) / 90) ** 2))
          const wave =
            Math.sin(x * 0.021 * (1 + k * 0.35) + t * (1.6 + k * 0.4)) * 0.55 +
            (noise3(x * 0.012, k * 3.1, t * 0.9) - 0.5) * 1.5
          const y = base + H * 0.07 * env * wave * (1 + near * 0.6)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        const c = f.col(0.55 + 0.4 * (k / (K - 1)))
        ctx.strokeStyle = c
        for (const [w, al] of [
          [7, 0.05],
          [3, 0.14],
          [1.2, 0.85],
        ]) {
          ctx.lineWidth = w
          ctx.globalAlpha = al
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/* ── 5. Stars: every active day is a star; bursts become constellations ── */
function stars(): Renderer {
  const dust = Array.from({ length: 480 }, (_, i) => ({ x: hash1(i + 3), y: hash1(i + 501), p: hash1(i + 77), z: 0.3 + hash1(i + 9) }))
  const neb = document.createElement('canvas')
  const nctx = neb.getContext('2d')!
  const glow = document.createElement('canvas')
  glow.width = glow.height = 64
  const gctx = glow.getContext('2d')!
  return {
    draw(f) {
      const { ctx, W, H, t } = f
      // Nebula at a tenth of the resolution, scaled up soft.
      const nw = Math.ceil(W / 10)
      const nh = Math.ceil(H / 10)
      if (neb.width !== nw || neb.height !== nh) {
        neb.width = nw
        neb.height = nh
      }
      const img = nctx.createImageData(nw, nh)
      for (let j = 0; j < nh; j++)
        for (let i = 0; i < nw; i++) {
          const n = fbm(i * 0.035 + t * 0.01, j * 0.035, t * 0.015)
          const a = f.act(i * 10)
          const v = Math.max(0, n - 0.35) * 0.9 + a * 0.18
          const [r, g, b] = f.rgb(0.05 + v * 0.55)
          const o = (j * nw + i) * 4
          img.data[o] = r
          img.data[o + 1] = g
          img.data[o + 2] = b
          img.data[o + 3] = 255
        }
      nctx.putImageData(img, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(neb, 0, 0, W, H)

      const px = f.pointer.on ? (f.pointer.x / W - 0.5) * 18 : 0
      const py = f.pointer.on ? (f.pointer.y / H - 0.5) * 12 : 0
      ctx.fillStyle = '#fff'
      for (const s of dust) {
        ctx.globalAlpha = (0.2 + 0.55 * Math.abs(Math.sin(t * 0.6 + s.p * 30))) * s.z
        ctx.fillRect(s.x * W - px * s.z, s.y * H - py * s.z, s.z * 1.4, s.z * 1.4)
      }

      const [r, g, b] = f.rgb(0.92)
      const gr = gctx.createRadialGradient(32, 32, 0, 32, 32, 32)
      gr.addColorStop(0, 'rgba(255,255,255,1)')
      gr.addColorStop(0.18, `rgba(${r},${g},${b},0.9)`)
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
      gctx.clearRect(0, 0, 64, 64)
      gctx.fillStyle = gr
      gctx.fillRect(0, 0, 64, 64)

      // Place each active day; y is fixed per date so a burst keeps its shape.
      const pts = f.days.map((d) => ({ ...d, y: H * (0.16 + 0.62 * hash1(d.day * 1.37)) }))
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = f.col(0.8)
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.28
      ctx.beginPath()
      for (let i = 1; i < pts.length; i++)
        if (pts[i].day - pts[i - 1].day <= 12) {
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
          ctx.lineTo(pts[i].x, pts[i].y)
        }
      ctx.stroke()
      for (const p of pts) {
        let s = 10 + 34 * Math.sqrt(p.n / f.peak)
        s *= 1 + 0.12 * Math.sin(t * 2 + p.day)
        if (f.pointer.on && Math.hypot(p.x - f.pointer.x, p.y - f.pointer.y) < 24) s *= 1.6
        ctx.globalAlpha = 0.95
        ctx.drawImage(glow, p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

/* ── 6. Dither: an ordered-dither print of rising light, four inks per page ── */
function dither(): Renderer {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16)
  const PX = 3
  const buf = document.createElement('canvas')
  const bctx = buf.getContext('2d')!
  return {
    draw(f) {
      const { ctx, W, H, t } = f
      const bw = Math.ceil(W / PX)
      const bh = Math.ceil(H / PX)
      if (buf.width !== bw || buf.height !== bh) {
        buf.width = bw
        buf.height = bh
      }
      const inks = [0.03, 0.3, 0.62, 0.95].map((v) => f.rgb(v))
      const img = bctx.createImageData(bw, bh)
      const colAct = new Float32Array(bw)
      for (let i = 0; i < bw; i++) colAct[i] = f.soft(i * PX)
      for (let j = 0; j < bh; j++) {
        const hgt = 1 - j / bh
        for (let i = 0; i < bw; i++) {
          let v = 0.12 + 0.55 * noise3(i * 0.018 + t * 0.12, j * 0.018 - t * 0.05, t * 0.1)
          const a = colAct[i]
          if (a > 0) v += a * Math.exp(-hgt / (0.12 + 0.5 * a)) * 0.9
          if (f.pointer.on) {
            const d2 = (i * PX - f.pointer.x) ** 2 + (j * PX - f.pointer.y) ** 2
            v += 0.5 * Math.exp(-d2 / (2 * 70 * 70))
          }
          const q = Math.min(3, Math.max(0, Math.floor(v * 3 + BAYER[(j & 3) * 4 + (i & 3)])))
          const [r, g, b] = inks[q]
          const o = (j * bw + i) * 4
          img.data[o] = r
          img.data[o + 1] = g
          img.data[o + 2] = b
          img.data[o + 3] = 255
        }
      }
      bctx.putImageData(img, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, bw * PX, bh * PX)
      ctx.imageSmoothingEnabled = true
    },
  }
}

const MAKERS: Record<Mode, () => Renderer> = { aurora, contours, currents, signal, stars, dither }

export function Backdrop({ mode, sources }: { mode: Mode; sources: Record<string, Source> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const path = normalizePath(usePathname())
  const place = useRef(placeFor(path))
  place.current = placeFor(path)

  useEffect(() => {
    const canvas = canvasRef.current!
    const tip = tipRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!
    const root = document.documentElement
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = MAKERS[mode]()
    let W = 0
    let H = 0
    let dpr = 1

    let paletteKey = place.current.palette
    let lutFrom = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
    let lutTo = lutFrom
    let lut = lutFrom
    let lutT = 1

    const now0 = Date.now()
    const start = now0 - YEAR_DAYS * DAY
    let heatKey: string | null | undefined
    let raw = new Float32Array(YEAR_DAYS)
    let target = new Float32Array(YEAR_DAYS)
    const shown = new Float32Array(YEAR_DAYS)
    let peak = 1

    const pointer = { x: 0, y: 0, on: false }
    let t = 0
    let last = performance.now()
    let raf = 0

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cell = W < 640 ? 16 : 18
      root.style.setProperty('--cell', `${cell}px`)
      root.style.setProperty('--ox', '0px')
      root.style.setProperty('--oy', '0px')
      root.style.setProperty('--cols', String(Math.floor(W / cell)))
    }

    function setHeat(key: string | null) {
      heatKey = key
      raw = key && sources[key] ? dailyHeat(sources[key].days, now0) : new Float32Array(YEAR_DAYS)
      // Smooth by a few days so a burst reads as a shape, then normalize.
      target = new Float32Array(YEAR_DAYS)
      for (let i = 0; i < YEAR_DAYS; i++) {
        if (!raw[i]) continue
        for (let k = -9; k <= 9; k++) {
          const d = i + k
          if (d >= 0 && d < YEAR_DAYS) target[d] += raw[i] * Math.exp(-(k * k) / 18)
        }
      }
      let m = 0
      for (let i = 0; i < YEAR_DAYS; i++) m = Math.max(m, target[i])
      for (let i = 0; i < YEAR_DAYS; i++) target[i] = m ? (target[i] / m) ** 0.65 : 0
      peak = Math.max(1, ...raw)
    }

    const rgb = (v: number): [number, number, number] => {
      const k = Math.max(0, Math.min(255, (v * 255) | 0)) * 3
      return [lut[k] | 0, lut[k + 1] | 0, lut[k + 2] | 0]
    }
    const col = (v: number) => {
      const [r, g, b] = rgb(v)
      return `rgb(${r},${g},${b})`
    }

    function frame(nowMs: number) {
      const dt = Math.min((nowMs - last) / 1000, 0.05)
      last = nowMs
      if (!reduce) t += dt
      const want = place.current
      if (want.palette !== paletteKey) {
        paletteKey = want.palette
        root.dataset.palette = paletteKey
        lutFrom = lut
        lutTo = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
        lutT = 0
      }
      if (lutT < 1) {
        lutT = reduce ? 1 : Math.min(1, lutT + dt / 0.9)
        const k = lutT * lutT * (3 - 2 * lutT)
        lut = new Float32Array(768)
        for (let i = 0; i < 768; i++) lut[i] = lutFrom[i] + (lutTo[i] - lutFrom[i]) * k
      }
      if (want.heat !== heatKey) setHeat(want.heat)
      const ease = reduce ? 1 : Math.min(1, dt * 2.5)
      for (let i = 0; i < YEAR_DAYS; i++) shown[i] += (target[i] - shown[i]) * ease

      // The open wall starts right of the last pane.
      let x0 = 0
      document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
        if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right + 24)
      })
      const x1 = W - 24
      if (x1 - x0 < 200) x0 = 24
      const span = x1 - x0
      const act = (x: number) => {
        if (x < x0 || x > x1) return 0
        const d = ((x - x0) / span) * (YEAR_DAYS - 1)
        const i = Math.floor(d)
        const fr = d - i
        return shown[i] * (1 - fr) + (shown[Math.min(YEAR_DAYS - 1, i + 1)] ?? 0) * fr
      }
      // A wide blur of the same curve, sampled every 4px, for broad shapes.
      const n4 = Math.ceil(W / 4) + 1
      let wide = new Float32Array(n4)
      for (let i = 0; i < n4; i++) wide[i] = act(i * 4)
      for (let pass = 0; pass < 3; pass++) {
        const next = new Float32Array(n4)
        let acc = 0
        const R = 8
        for (let i = -R; i <= R; i++) acc += wide[Math.min(n4 - 1, Math.max(0, i))]
        for (let i = 0; i < n4; i++) {
          next[i] = acc / (2 * R + 1)
          acc += wide[Math.min(n4 - 1, i + R + 1)] - wide[Math.max(0, i - R)]
        }
        wide = next
      }
      let wm = 0
      for (let i = 0; i < n4; i++) wm = Math.max(wm, wide[i])
      const soft = (x: number) => {
        const i = Math.max(0, Math.min(n4 - 1, Math.round(x / 4)))
        return wm ? (wide[i] / wm) ** 0.8 : 0
      }
      const days: Frame['days'] = []
      for (let i = 0; i < YEAR_DAYS; i++)
        if (raw[i]) days.push({ day: i, n: raw[i], x: x0 + (i / (YEAR_DAYS - 1)) * span })

      renderer.draw({ ctx, canvas, W, H, dpr, t, dt, col, rgb, act, soft, x0, x1, pointer, days, peak })

      // Hover: the nearest active day within a few days of the pointer.
      const src = heatKey ? sources[heatKey] : null
      let shownTip = false
      if (src && pointer.on && pointer.x >= x0 && pointer.x <= x1) {
        const d = Math.round(((pointer.x - x0) / span) * (YEAR_DAYS - 1))
        let n = 0
        let a = -1
        let b = -1
        for (let k = Math.max(0, d - 3); k <= Math.min(YEAR_DAYS - 1, d + 3); k++)
          if (raw[k]) {
            n += raw[k]
            if (a < 0) a = k
            b = k
          }
        if (n) {
          const fa = DAY_FMT.format(start + a * DAY + DAY / 2)
          const fb = DAY_FMT.format(start + b * DAY + DAY / 2)
          tip.textContent = `${fa === fb ? fa : `${fa} to ${fb}`} · ${n} ${src.noun[n === 1 ? 0 : 1]}`
          tip.style.transform = `translate(${Math.min(pointer.x + 14, W - tip.offsetWidth - 12)}px, ${Math.max(12, pointer.y - 36)}px)`
          shownTip = true
        }
      }
      tip.dataset.show = String(shownTip)
      raf = requestAnimationFrame(frame)
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      const over = (e.target as HTMLElement | null)?.closest('[data-pane], .lab-switch')
      pointer.on = !over
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    const onLeave = () => (pointer.on = false)

    measure()
    setHeat(place.current.heat)
    root.dataset.palette = paletteKey
    root.dataset.wall = 'ready'
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [mode, sources])

  return (
    <>
      <canvas ref={canvasRef} className="wall" aria-hidden="true" />
      <div ref={tipRef} className="wall-tip" data-show="false" aria-hidden="true" />
    </>
  )
}
