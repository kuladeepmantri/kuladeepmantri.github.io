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
const AMBIENT = 26 // background hosts that aren't tied to a date

function hash1(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

type Host = {
  x: number
  y: number
  day: number // -1 for ambient hosts
  n: number
  slugs: string[]
  born: number
}

/**
 * The background: a dithered print with a quiet network on top. Every day
 * with activity in the last year is a host, placed left to right by date
 * across the open part of the screen; hosts link to their nearest
 * neighbours and packets travel between them. The pointer probes nearby
 * hosts, a scan line passes over, and opening a pane sends a ripple out
 * from the row that opened it.
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

    // Palette crossfade
    let paletteKey = place.current.palette
    let lutFrom = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
    let lutTo = lutFrom
    let lut = lutFrom
    let lutT = 1
    const rgb = (v: number): [number, number, number] => {
      const k = Math.max(0, Math.min(255, (v * 255) | 0)) * 3
      return [lut[k] | 0, lut[k + 1] | 0, lut[k + 2] | 0]
    }
    const col = (v: number, a = 1) => {
      const [r, g, b] = rgb(v)
      return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`
    }

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
    const ripples: { x: number; y: number; t: number }[] = []
    const pointer = { x: 0, y: 0, on: false }
    let focus: string | null = null
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
      const fresh = !layoutKey.startsWith(`${heatKey}|`)
      layoutKey = key
      const old = new Map(hosts.filter((h) => h.day >= 0).map((h) => [h.day, h]))
      const next: Host[] = []
      for (let i = 0; i < YEAR_DAYS; i++) {
        if (!raw[i]) continue
        const prev = old.get(i)
        next.push({
          x: x0 + (i / (YEAR_DAYS - 1)) * (x1 - x0),
          y: H * (0.14 + 0.72 * hash1(i * 1.37 + 5)),
          day: i,
          n: raw[i],
          slugs: dayProjects.get(i) ?? [],
          born: fresh || !prev ? t : prev.born,
        })
      }
      for (const a of ambient)
        next.push({ x: a.fx * W, y: a.fy * H, day: -1 - a.seed, n: 0, slugs: [], born: -10 })
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

      // The open part of the screen starts right of the last pane.
      let x0 = 0
      document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
        if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right + 48)
      })
      const x1 = W - 56
      if (x1 - x0 < 220) x0 = 48
      layout(x0, x1)

      // Ambient hosts drift a little.
      for (const h of hosts)
        if (h.day < 0) {
          const a = ambient[-1 - h.day]
          h.x = a.fx * W + 18 * Math.sin(t * 0.05 + a.seed)
          h.y = a.fy * H + 14 * Math.cos(t * 0.04 + a.seed * 1.7)
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
      const inks = [0.0, 0.16, 0.38, 0.7].map((v, k) => {
        const [r, g, b] = rgb(v)
        const m = k === 0 ? 0.5 : 1
        return (255 << 24) | (((b * m) | 0) << 16) | (((g * m) | 0) << 8) | ((r * m) | 0)
      })
      const gw = Math.ceil(W / G) + 2
      const gh = Math.ceil(H / G) + 2
      if (lattice.length !== gw * gh) lattice = new Float32Array(gw * gh)
      const scanY = (((t * 0.045) % 1.25) - 0.1) * H
      for (let j = 0; j < gh; j++) {
        const y = j * G
        const scan = 0.07 * Math.exp(-(((y - scanY) / 30) ** 2))
        const vy = (y / H - 0.5) ** 2
        for (let i = 0; i < gw; i++) {
          const x = i * G
          const n = fbm(x * 0.002 + t * 0.016, y * 0.002 - t * 0.01, t * 0.024)
          let v = smoothstep(0.4, 0.86, n) * 0.38 + scan
          if (pointer.on) {
            const d2 = (x - pointer.x) ** 2 + (y - pointer.y) ** 2
            v += 0.22 * Math.exp(-d2 / (2 * 110 * 110))
          }
          for (const r of ripples) {
            const d = Math.hypot(x - r.x, y - r.y)
            const edge = r.t * 900
            v += 0.35 * (1 - r.t / 1.4) * Math.exp(-(((d - edge) / 40) ** 2))
          }
          lattice[j * gw + i] = v * (1 - 0.8 * ((x / W - 0.5) ** 2 + vy))
        }
      }
      // A soft glow around busy hosts, in the same print.
      for (const h of hosts) {
        if (h.day < 0) continue
        const s = 0.18 + 0.4 * Math.sqrt(h.n / peak)
        const lit = focus && h.slugs.includes(focus) ? 1.8 : 1
        const R = 9
        const ci = Math.round(h.x / G)
        const cj = Math.round(h.y / G)
        for (let j = Math.max(0, cj - R); j <= Math.min(gh - 1, cj + R); j++)
          for (let i = Math.max(0, ci - R); i <= Math.min(gw - 1, ci + R); i++) {
            const d2 = (i * G - h.x) ** 2 + (j * G - h.y) ** 2
            lattice[j * gw + i] += s * lit * Math.exp(-d2 / (2 * 34 * 34))
          }
      }
      const out = px32!
      const k = PX / G
      for (let j = 0; j < bh; j++) {
        const gy = j * k
        const j0 = gy | 0
        const fy = gy - j0
        const row0 = j0 * gw
        const row1 = row0 + gw
        const brow = (j & 7) * 8
        for (let i = 0; i < bw; i++) {
          const gx = i * k
          const i0 = gx | 0
          const fx = gx - i0
          const top = lattice[row0 + i0] + (lattice[row0 + i0 + 1] - lattice[row0 + i0]) * fx
          const bot = lattice[row1 + i0] + (lattice[row1 + i0 + 1] - lattice[row1 + i0]) * fx
          let q = ((top + (bot - top) * fy) * 3 + B8[brow + (i & 7)]) | 0
          if (q < 0) q = 0
          else if (q > 3) q = 3
          out[j * bw + i] = inks[q]
        }
      }
      bctx.putImageData(img!, 0, 0)
      ctx.globalAlpha = 1
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, 0, 0, bw * PX, bh * PX)
      ctx.imageSmoothingEnabled = true

      // ── Network layer ──
      const isLit = (h: Host) => !!focus && h.slugs.includes(focus)
      const fade = (h: Host) => Math.min(1, Math.max(0, (t - h.born) / 0.8))

      ctx.lineWidth = 1
      for (const [a, b] of links) {
        const lit = isLit(a) && isLit(b)
        const al =
          Math.min(fade(a), fade(b)) * (lit ? 0.85 : a.day >= 0 || b.day >= 0 ? 0.42 : 0.22)
        ctx.strokeStyle = col(lit ? 0.95 : 0.55, al)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      // Packets: more of them leave busy hosts.
      if (!reduce && links.length) {
        const rate = 2.5 + Math.min(6, hosts.length * 0.12)
        if (Math.random() < rate * dt) {
          const pick = links[(Math.random() * links.length) | 0]
          const [a, b] = Math.random() < 0.5 ? pick : [pick[1], pick[0]]
          packets.push({ a, b, p: 0, v: 90 + Math.random() * 90 })
        }
        if (packets.length > 60) packets.shift()
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const pk = packets[i]
        const len = Math.hypot(pk.b.x - pk.a.x, pk.b.y - pk.a.y) || 1
        pk.p += (pk.v * dt) / len
        if (pk.p >= 1) {
          packets.splice(i, 1)
          continue
        }
        const x = pk.a.x + (pk.b.x - pk.a.x) * pk.p
        const y = pk.a.y + (pk.b.y - pk.a.y) * pk.p
        ctx.fillStyle = col(0.95, 0.9)
        ctx.fillRect(x - 1, y - 1, 2, 2)
      }

      // Hosts: busy days are small squares in a frame; ambient ones are dots.
      hovered = null
      let best = 16 * 16
      for (const h of hosts) {
        const f = fade(h)
        if (h.day < 0) {
          ctx.fillStyle = col(0.5, 0.55 * f)
          ctx.fillRect(h.x - 1, h.y - 1, 2, 2)
          continue
        }
        const lit = isLit(h)
        const s = 3 + 3 * Math.sqrt(h.n / peak)
        ctx.fillStyle = col(lit ? 1 : 0.92, f)
        ctx.fillRect(h.x - s / 2, h.y - s / 2, s, s)
        const frameS = s + 8 + (lit ? 4 : 0)
        ctx.strokeStyle = col(lit ? 0.95 : 0.6, (lit ? 0.9 : 0.45) * f)
        ctx.strokeRect(h.x - frameS / 2 + 0.5, h.y - frameS / 2 + 0.5, frameS - 1, frameS - 1)
        // A ping every few seconds, staggered per host.
        const period = 4 + hash1(h.day) * 4
        const ph = ((t + hash1(h.day + 3) * period) % period) / 1.4
        if (ph < 1 && !reduce) {
          ctx.strokeStyle = col(0.8, (1 - ph) * 0.35 * f)
          const r = 6 + ph * 26
          ctx.strokeRect(h.x - r, h.y - r, r * 2, r * 2)
        }
        if (pointer.on) {
          const d2 = (h.x - pointer.x) ** 2 + (h.y - pointer.y) ** 2
          if (d2 < best) {
            best = d2
            hovered = h
          }
        }
      }

      // The pointer probes: a reticle, and lines to hosts in range.
      if (pointer.on) {
        ctx.strokeStyle = col(0.85, 0.5)
        ctx.setLineDash([2, 4])
        for (const h of hosts) {
          const d = Math.hypot(h.x - pointer.x, h.y - pointer.y)
          if (d > 170) continue
          ctx.globalAlpha = (1 - d / 170) * (h.day >= 0 ? 0.9 : 0.4)
          ctx.beginPath()
          ctx.moveTo(pointer.x, pointer.y)
          ctx.lineTo(h.x, h.y)
          ctx.stroke()
        }
        ctx.setLineDash([])
        ctx.globalAlpha = 1
        ctx.strokeStyle = col(0.9, 0.7)
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

      // Ripples from opened panes, as a crisp ring over the dithered one.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.t += dt
        if (r.t > 1.4) {
          ripples.splice(i, 1)
          continue
        }
        ctx.strokeStyle = col(0.9, 0.5 * (1 - r.t / 1.4))
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.t * 900, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Scan line, crisp and faint.
      ctx.fillStyle = col(0.8, 0.07)
      ctx.fillRect(0, scanY, W, 1)

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
    const offOpen = on<Point>('open', (p) => ripples.push({ x: p.x, y: p.y, t: 0 }))
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
