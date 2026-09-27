'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { on, emit, type Point } from '@/lib/bus'
import { TIMEZONE } from '@/lib/constants'
import { normalizePath, placeFor } from '@/lib/panes'
import { DAY, PALETTES, YEAR_DAYS, buildLUT, dailyHeat, fbm, smoothstep } from '@/lib/field'

export type Source = { days: [string, number][]; noun: [string, string] }

const DAY_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIMEZONE,
})

// 8x8 Bayer matrix, normalized to (0, 1).
const B8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64)

const PX = 2 // dither pixel, in CSS px
const G = 8 // lattice spacing the field is computed on, in CSS px
const AMBIENT = 22 // background hosts that aren't tied to a date
const LENS = 190 // radius, in CSS px, the pointer reveals the network within
const BAND = 64 // height of the re-ink front, in CSS px
const REINK_S = 1.1

function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Host = {
  x: number
  y: number
  day: number // negative for ambient hosts
  n: number
  slugs: string[]
  rev: number // how revealed it is, 0 to 1
}

/**
 * The background: a slow dithered print. Under it sits a network of every
 * active day in the last year, placed left to right by date, which stays
 * hidden until the pointer passes over it or a project is hovered.
 *
 * Changing page re-inks the print in the new palette, from the row that was
 * clicked outward: two fronts split up and down from that line, coarse
 * pixels at the edge, the new palette dithered in behind them.
 */
export function Field({
  sources,
  names,
}: {
  sources: Record<string, Source>
  names: Record<string, string>
}) {
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

    let W = 0
    let H = 0
    let dpr = 1
    const buf = document.createElement('canvas')
    const bctx = buf.getContext('2d')!
    let img: ImageData | null = null
    let px32: Uint32Array | null = null
    let lattice = new Float32Array(0)

    const inksOf = (l: Float32Array) =>
      [0.0, 0.13, 0.3, 0.58].map((v, k) => {
        const c = Math.max(0, Math.min(255, (v * 255) | 0)) * 3
        const m = k === 0 ? 0.5 : 1
        return (
          (255 << 24) |
          (((l[c + 2] * m) | 0) << 16) |
          (((l[c + 1] * m) | 0) << 8) |
          ((l[c] * m) | 0)
        )
      })

    let paletteKey = place.current.palette
    let lut = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
    let inks = inksOf(lut)
    const col = (v: number, a = 1) => {
      const k = Math.max(0, Math.min(255, (v * 255) | 0)) * 3
      return `rgba(${lut[k] | 0},${lut[k + 1] | 0},${lut[k + 2] | 0},${a})`
    }

    // A page change in progress: where it started, how far along, and the inks it replaces.
    let reink: { y: number; t: number; old: number[] } | null = null
    let pending: { y: number; at: number } | null = null

    // Which projects had commits on each day, so a host can name them.
    const now0 = Date.now()
    const start = now0 - YEAR_DAYS * DAY
    const dayProjects = new Map<number, string[]>()
    for (const [key, src] of Object.entries(sources)) {
      if (!names[key]) continue
      for (const [d] of src.days) {
        const i = Math.floor((Date.parse(`${d}T12:00:00Z`) - start) / DAY)
        if (i < 0 || i >= YEAR_DAYS) continue
        const list = dayProjects.get(i) ?? []
        list.push(key)
        dayProjects.set(i, list)
      }
    }

    let heatKey: string | null | undefined
    let raw = new Float32Array(YEAR_DAYS)
    let peak = 1
    let hosts: Host[] = []
    let layoutKey = ''
    const ambient = Array.from({ length: AMBIENT }, (_, i) => ({
      fx: hash1(i + 11),
      fy: 0.08 + 0.84 * hash1(i + 211),
      seed: i,
    }))

    type Packet = { a: Host; b: Host; p: number; v: number }
    let packets: Packet[] = []
    let links: [Host, Host][] = []
    const pointer = { x: 0, y: 0, on: false }
    let focus: string | null = null
    let trace = 0 // position of the point running along a focused project's days
    let hovered: Host | null = null
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
      root.style.setProperty('--cols', String(Math.floor(W / cell)))
      layoutKey = ''
    }

    function setHeat(key: string | null) {
      heatKey = key
      raw = key && sources[key] ? dailyHeat(sources[key].days, now0) : new Float32Array(YEAR_DAYS)
      peak = Math.max(1, ...raw)
      layoutKey = ''
    }

    /** Place hosts across the open part of the screen and link neighbours. */
    function layout(x0: number, x1: number) {
      const key = `${heatKey}|${Math.round(x0)}|${Math.round(x1)}|${W}|${H}`
      if (key === layoutKey) return
      layoutKey = key
      const old = new Map(hosts.map((h) => [h.day, h.rev]))
      const next: Host[] = []
      for (let i = 0; i < YEAR_DAYS; i++) {
        if (!raw[i]) continue
        next.push({
          x: x0 + (i / (YEAR_DAYS - 1)) * (x1 - x0),
          y: H * (0.14 + 0.72 * hash1(i * 1.37 + 5)),
          day: i,
          n: raw[i],
          slugs: dayProjects.get(i) ?? [],
          rev: old.get(i) ?? 0,
        })
      }
      for (const a of ambient)
        next.push({
          x: a.fx * W,
          y: a.fy * H,
          day: -1 - a.seed,
          n: 0,
          slugs: [],
          rev: old.get(-1 - a.seed) ?? 0,
        })
      hosts = next
      // Each host links to its two nearest neighbours.
      const seen = new Set<string>()
      links = []
      for (const h of hosts) {
        const near = hosts
          .filter((o) => o !== h)
          .map((o) => ({ o, d: (o.x - h.x) ** 2 + (o.y - h.y) ** 2 }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2)
        for (const { o } of near) {
          const id = h.day < o.day ? `${h.day}:${o.day}` : `${o.day}:${h.day}`
          if (seen.has(id)) continue
          seen.add(id)
          links.push([h, o])
        }
      }
      packets = []
    }

    function frame(nowMs: number) {
      const dt = Math.min((nowMs - last) / 1000, 0.05)
      last = nowMs
      if (!reduce) t += dt

      const want = place.current
      if (want.palette !== paletteKey) {
        paletteKey = want.palette
        root.dataset.palette = paletteKey
        const y = pending && nowMs - pending.at < 1500 ? pending.y : H / 2
        pending = null
        const old = inks
        lut = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
        inks = inksOf(lut)
        reink = reduce ? null : { y, t: 0, old }
      }
      if (want.heat !== heatKey) setHeat(want.heat)

      // The open part of the screen starts right of the last pane.
      let x0 = 0
      document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
        if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right + 48)
      })
      const x1 = W - 56
      if (x1 - x0 < 220) x0 = 48
      layout(x0, x1)

      // Ambient hosts drift a little. Hosts come into view near the pointer,
      // and all of a project's days come into view while it is hovered.
      for (const h of hosts) {
        if (h.day < 0) {
          const a = ambient[-1 - h.day]
          h.x = a.fx * W + 18 * Math.sin(t * 0.05 + a.seed)
          h.y = a.fy * H + 14 * Math.cos(t * 0.04 + a.seed * 1.7)
        }
        let target = focus && h.slugs.includes(focus) ? 1 : 0
        if (pointer.on) {
          const d = Math.hypot(h.x - pointer.x, h.y - pointer.y)
          if (d < LENS) target = Math.max(target, (1 - d / LENS) ** 0.6 * (h.day >= 0 ? 1 : 0.6))
        }
        h.rev += (target - h.rev) * Math.min(1, dt * (target > h.rev ? 9 : 2.5))
        if (reduce) h.rev = target
      }

      // ── Dither layer ──
      const bw = Math.ceil(W / PX)
      const bh = Math.ceil(H / PX)
      if (buf.width !== bw || buf.height !== bh || !img) {
        buf.width = bw
        buf.height = bh
        img = bctx.createImageData(bw, bh)
        px32 = new Uint32Array(img.data.buffer)
      }
      const gw = Math.ceil(W / G) + 2
      const gh = Math.ceil(H / G) + 2
      if (lattice.length !== gw * gh) lattice = new Float32Array(gw * gh)
      for (let j = 0; j < gh; j++) {
        const y = j * G
        const vy = (y / H - 0.5) ** 2
        for (let i = 0; i < gw; i++) {
          const x = i * G
          const n = fbm(x * 0.0018 + t * 0.011, y * 0.0018 - t * 0.007, t * 0.016)
          let v = smoothstep(0.42, 0.88, n) * 0.36
          if (pointer.on) {
            const d2 = (x - pointer.x) ** 2 + (y - pointer.y) ** 2
            v += 0.14 * Math.exp(-d2 / (2 * 130 * 130))
          }
          lattice[j * gw + i] = v * (1 - 0.8 * ((x / W - 0.5) ** 2 + vy))
        }
      }
      // Revealed hosts bloom in the same print.
      for (const h of hosts) {
        if (h.day < 0 || h.rev < 0.02) continue
        const s = (0.16 + 0.34 * Math.sqrt(h.n / peak)) * h.rev
        const R = 8
        const ci = Math.round(h.x / G)
        const cj = Math.round(h.y / G)
        for (let j = Math.max(0, cj - R); j <= Math.min(gh - 1, cj + R); j++)
          for (let i = Math.max(0, ci - R); i <= Math.min(gw - 1, ci + R); i++) {
            const d2 = (i * G - h.x) ** 2 + (j * G - h.y) ** 2
            lattice[j * gw + i] += s * Math.exp(-d2 / (2 * 30 * 30))
          }
      }

      // Re-ink progress: the distance each front has travelled from its line.
      let front = Infinity
      if (reink) {
        reink.t += dt
        const p = Math.min(1, reink.t / REINK_S)
        front = (1 - (1 - p) ** 3) * (Math.max(reink.y, H - reink.y) + BAND)
        if (p >= 1) reink = null
      }
      const old = reink?.old ?? inks
      const ry = reink?.y ?? 0

      const out = px32!
      const k = PX / G
      for (let j = 0; j < bh; j++) {
        // Behind the front: new inks. Ahead: old ones. On it: coarse pixels,
        // a little brighter, with the new palette dithered in.
        const edge = front - Math.abs(j * PX - ry)
        const band = edge > 0 && edge < BAND
        const m = band ? edge / BAND : edge <= 0 ? 0 : 1
        const coarse = band && m < 0.7
        const lift = band ? 0.09 * (1 - m) : 0
        const jj = coarse ? j & ~3 : j
        const gy = jj * k
        const j0 = gy | 0
        const fy = gy - j0
        const row0 = j0 * gw
        const row1 = row0 + gw
        const bj = ((coarse ? j >> 2 : j) & 7) * 8
        const pj = ((j + 3) & 7) * 8
        const rowInks = m === 1 ? inks : m === 0 ? old : null
        for (let i = 0; i < bw; i++) {
          const ii = coarse ? i & ~3 : i
          const gx = ii * k
          const i0 = gx | 0
          const fx = gx - i0
          const top = lattice[row0 + i0] + (lattice[row0 + i0 + 1] - lattice[row0 + i0]) * fx
          const bot = lattice[row1 + i0] + (lattice[row1 + i0 + 1] - lattice[row1 + i0]) * fx
          let q = ((top + (bot - top) * fy + lift) * 3 + B8[bj + ((coarse ? i >> 2 : i) & 7)]) | 0
          if (q < 0) q = 0
          else if (q > 3) q = 3
          const set = rowInks ?? (m > B8[pj + ((i + 5) & 7)] ? inks : old)
          out[j * bw + i] = set[q]
        }
      }
      bctx.putImageData(img!, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, bw * PX, bh * PX)
      ctx.imageSmoothingEnabled = true

      // ── Network layer, only where revealed ──
      ctx.lineWidth = 1
      for (const [a, b] of links) {
        const al = Math.min(a.rev, b.rev) * 0.45
        if (al < 0.01) continue
        ctx.strokeStyle = col(0.6, al)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      // A hovered project's days, joined in date order, with a point running along them.
      const chain = focus ? hosts.filter((h) => h.day >= 0 && h.slugs.includes(focus!)) : []
      if (chain.length > 1) {
        ctx.strokeStyle = col(0.9, 0.5 * chain[0].rev)
        ctx.beginPath()
        chain.forEach((h, i) => (i ? ctx.lineTo(h.x, h.y) : ctx.moveTo(h.x, h.y)))
        ctx.stroke()
        if (!reduce) {
          trace = (trace + dt * 1.6) % (chain.length - 1)
          const a = chain[trace | 0]
          const b = chain[(trace | 0) + 1]
          const f = trace % 1
          ctx.fillStyle = col(1, chain[0].rev)
          ctx.fillRect(a.x + (b.x - a.x) * f - 1.5, a.y + (b.y - a.y) * f - 1.5, 3, 3)
        }
      } else trace = 0

      // Packets, only on links in view.
      if (!reduce && pointer.on && Math.random() < 5 * dt) {
        const pick = links[(Math.random() * links.length) | 0]
        if (pick && Math.min(pick[0].rev, pick[1].rev) > 0.35) {
          const [a, b] = Math.random() < 0.5 ? pick : [pick[1], pick[0]]
          packets.push({ a, b, p: 0, v: 70 + Math.random() * 70 })
        }
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i]
        const len = Math.hypot(pk.b.x - pk.a.x, pk.b.y - pk.a.y) || 1
        pk.p += (pk.v * dt) / len
        const al = Math.min(pk.a.rev, pk.b.rev)
        if (pk.p >= 1 || al < 0.02) {
          packets.splice(i, 1)
          continue
        }
        ctx.fillStyle = col(0.95, al)
        ctx.fillRect(
          pk.a.x + (pk.b.x - pk.a.x) * pk.p - 1,
          pk.a.y + (pk.b.y - pk.a.y) * pk.p - 1,
          2,
          2,
        )
      }

      // Hosts: active days are small squares in a frame; ambient ones are dots.
      hovered = null
      let best = 16 * 16
      for (const h of hosts) {
        if (h.rev < 0.02) continue
        if (h.day < 0) {
          ctx.fillStyle = col(0.5, 0.6 * h.rev)
          ctx.fillRect(h.x - 1, h.y - 1, 2, 2)
          continue
        }
        const s = 3 + 3 * Math.sqrt(h.n / peak)
        ctx.fillStyle = col(0.95, h.rev)
        ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s)
        const fs = s + 8
        ctx.strokeStyle = col(0.7, 0.5 * h.rev)
        ctx.strokeRect(h.x - fs / 2 + 0.5, h.y - fs / 2 + 0.5, fs - 1, fs - 1)
        if (pointer.on && h.rev > 0.4) {
          const d2 = (h.x - pointer.x) ** 2 + (h.y - pointer.y) ** 2
          if (d2 < best) {
            best = d2
            hovered = h
          }
        }
      }

      if (pointer.on) {
        ctx.strokeStyle = col(0.9, 0.45)
        const r = 7
        ctx.beginPath()
        ctx.moveTo(pointer.x - r - 4, pointer.y)
        ctx.lineTo(pointer.x - r + 1, pointer.y)
        ctx.moveTo(pointer.x + r - 1, pointer.y)
        ctx.lineTo(pointer.x + r + 4, pointer.y)
        ctx.moveTo(pointer.x, pointer.y - r - 4)
        ctx.lineTo(pointer.x, pointer.y - r + 1)
        ctx.moveTo(pointer.x, pointer.y + r - 1)
        ctx.lineTo(pointer.x, pointer.y + r + 4)
        ctx.stroke()
      }

      updateTip()
      raf = requestAnimationFrame(frame)
    }

    let lastNode = ''
    function updateTip() {
      const h = hovered
      const src = heatKey ? sources[heatKey] : null
      const keyNow = h ? h.slugs.join(',') + h.day : ''
      if (keyNow !== lastNode) {
        lastNode = keyNow
        emit('node', { slugs: h ? h.slugs : [] })
      }
      if (!h || !src) {
        tip.dataset.show = 'false'
        return
      }
      const date = DAY_FMT.format(start + h.day * DAY + DAY / 2)
      const what = `${h.n} ${src.noun[h.n === 1 ? 0 : 1]}`
      const who =
        heatKey === 'all' && h.slugs.length ? ` · ${h.slugs.map((s) => names[s]).join(', ')}` : ''
      tip.textContent = `${date} · ${what}${who}`
      tip.dataset.show = 'true'
      tip.style.transform = `translate(${Math.min(h.x + 16, W - tip.offsetWidth - 12)}px, ${Math.max(12, h.y - 38)}px)`
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      pointer.on = !(e.target as HTMLElement | null)?.closest('[data-pane]')
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    const onLeave = () => (pointer.on = false)
    const offOpen = on<Point>('open', (p) => (pending = { y: p.y, at: performance.now() }))
    const offFocus = on<{ slug: string | null }>('focus', (d) => (focus = d.slug))
    function onVisible() {
      cancelAnimationFrame(raf)
      if (!document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    measure()
    setHeat(place.current.heat)
    root.dataset.palette = paletteKey
    window.addEventListener('resize', measure)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('visibilitychange', onVisible)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      offOpen()
      offFocus()
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [sources, names])

  return (
    <>
      <canvas ref={canvasRef} className="field" aria-hidden="true" />
      <div ref={tipRef} className="field-tip" data-show="false" aria-hidden="true" />
    </>
  )
}
