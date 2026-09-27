'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { TIMEZONE } from '@/lib/constants'
import { normalizePath, placeFor } from '@/lib/panes'
import { DAY, PALETTES, YEAR_DAYS, buildLUT, dailyHeat, fbm, noise3, smoothstep } from '@/lib/wall'

export type Source = { days: [string, number][]; noun: [string, string] }

const PANE = [11, 12, 16] // pane fill, a hair lighter than the gaps
const GAP_BG = '#050609'
const WAVE_IN = 0.3 // seconds one tile takes to turn into pane
const SPREAD_IN = 0.42 // seconds for the wave to cross a pane
const WAVE_OUT = 0.24
const SPREAD_OUT = 0.3

const DAY_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: TIMEZONE })

/**
 * The wall: a grid of rounded tiles behind the whole site. Panes are carved
 * out of it (tiles grow and darken in a wave), the resting field drifts, and
 * the last year of activity rises from the bottom as columns of light, one
 * column per stretch of days. The pointer leaves a short-lived glow.
 */
export function Wall({ sources, builtAt }: { sources: Record<string, Source>; builtAt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const path = normalizePath(usePathname())
  const place = useRef(placeFor(path))
  place.current = placeFor(path)

  useEffect(() => {
    const canvas = canvasRef.current!
    const tip = tipRef.current!
    const ctx = canvas.getContext('2d', { alpha: false })!
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const root = document.documentElement

    let W = 0
    let H = 0
    let dpr = 1
    let cell = 18
    let tile = 15
    let rad = 4
    let cols = 0
    let rows = 0
    let offX = 0
    let offY = 0

    // Palette crossfade
    let paletteKey = place.current.palette
    let lutFrom = buildLUT(PALETTES[paletteKey] ?? PALETTES.home)
    let lutTo = lutFrom
    let lut = lutFrom
    let lutT = 1
    let styles = toStyles(lut)

    // Activity: raw counts per day for the active source, and the displayed
    // height per column, eased toward its target every frame.
    let heatKey: string | null = null
    let raw: Float32Array = new Float32Array(YEAR_DAYS)
    let hShown = new Float32Array(0)
    let colDays: [number, number][] = [] // day range per column
    let colCount = new Float32Array(0)
    const now0 = Date.now()
    const start = now0 - YEAR_DAYS * DAY

    let wake = new Float32Array(0)
    const sparks: { x: number; y: number; t: number }[] = []
    let pointer: { x: number; y: number } | null = null

    let raf = 0
    let last = performance.now()
    let t = 0

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      const small = W < 640
      cell = small ? 16 : 18
      tile = cell - 3
      rad = small ? 3 : 4
      cols = Math.floor(W / cell)
      rows = Math.floor(H / cell)
      offX = Math.floor((W - cols * cell) / 2)
      offY = Math.floor((H - rows * cell) / 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      root.style.setProperty('--cell', `${cell}px`)
      root.style.setProperty('--ox', `${offX}px`)
      root.style.setProperty('--oy', `${offY}px`)
      root.style.setProperty('--cols', String(cols))
      root.style.setProperty('--rows', String(rows))
      hShown = new Float32Array(cols + 4)
      wake = new Float32Array((cols + 4) * rows)
    }

    function setHeat(key: string | null) {
      heatKey = key
      raw = key && sources[key] ? dailyHeat(sources[key].days, now0) : new Float32Array(YEAR_DAYS)
    }

    type PaneBox = { c0: number; c1: number; r0: number; r1: number; phase: string; t0: number }

    function readPanes(scroll: number): PaneBox[] {
      const out: PaneBox[] = []
      document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
        const r = el.getBoundingClientRect()
        const c0 = Math.round((r.left + scroll - offX) / cell)
        const r0 = Math.round((r.top - offY) / cell)
        out.push({
          c0,
          c1: c0 + Math.round(r.width / cell),
          r0,
          r1: r0 + Math.round(r.height / cell),
          phase: el.dataset.phase ?? 'open',
          t0: Number(el.dataset.t0 ?? 0),
        })
      })
      return out
    }

    /** How far a tile has turned into pane, 0 to 1, eased. */
    function cover(ic: number, j: number, panes: PaneBox[], nowMs: number): number {
      for (const p of panes) {
        if (ic < p.c0 || ic >= p.c1 || j < p.r0 || j >= p.r1) continue
        if (p.phase === 'open' || reduce) return p.phase === 'out' ? 0 : 1
        const w = p.c1 - p.c0
        const h = p.r1 - p.r0
        const jitter = noise3(ic * 0.9, j * 0.9, 3.3) * 0.08
        const age = (nowMs - p.t0) / 1000
        if (p.phase === 'in') {
          const d = ((ic - p.c0) / w) * SPREAD_IN + ((j - p.r0) / h) * 0.1 + jitter
          const k = Math.min(1, Math.max(0, (age - d) / WAVE_IN))
          return 1 - (1 - k) ** 3
        }
        const d = ((p.c1 - 1 - ic) / w) * SPREAD_OUT + jitter
        const k = Math.min(1, Math.max(0, (age - d) / WAVE_OUT))
        return 1 - k * k
      }
      return 0
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
        styles = toStyles(lut)
      }
      if (want.heat !== heatKey) setHeat(want.heat)

      const stage = document.querySelector<HTMLElement>('.stage')
      const scroll = stage?.scrollLeft ?? 0
      const totalCols = Math.max(cols, Math.ceil(((stage?.scrollWidth ?? W) - offX) / cell))
      const panes = readPanes(scroll)
      const shift = Math.floor(scroll / cell)
      const sub = scroll - shift * cell

      // The field is the stretch of wall right of the open panes.
      let fieldL = 1
      for (const p of panes) if (p.phase !== 'out') fieldL = Math.max(fieldL, p.c1 + 1 - shift)
      const fieldR = cols - 2
      if (fieldR - fieldL < 8) fieldL = 1
      const span = Math.max(1, fieldR - fieldL + 1)

      // Column heat: sum the days each column covers, normalize to the busiest.
      colDays = []
      colCount = new Float32Array(cols + 4)
      let peak = 0
      for (let c = 0; c <= cols + 1; c++) {
        if (c < fieldL || c > fieldR) continue
        const a = Math.floor(((c - fieldL) / span) * YEAR_DAYS)
        const b = Math.max(a + 1, Math.floor(((c - fieldL + 1) / span) * YEAR_DAYS))
        let s = 0
        for (let d = a; d < b && d < YEAR_DAYS; d++) s += raw[d]
        colDays[c] = [a, b - 1]
        colCount[c] = s
        if (s > peak) peak = s
      }
      const ease = reduce ? 1 : Math.min(1, dt * 3.2)
      for (let c = 0; c < hShown.length; c++) {
        const target = peak > 0 ? (colCount[c] / peak) ** 0.7 : 0
        hShown[c] += (target - hShown[c]) * ease
      }

      // Pointer glow, stamped into a buffer and faded.
      wake.fill(0)
      for (let s = sparks.length - 1; s >= 0; s--) {
        const sp = sparks[s]
        sp.t += dt
        if (sp.t > 0.9) {
          sparks.splice(s, 1)
          continue
        }
        const life = 1 - sp.t / 0.9
        const cx = sp.x - shift
        for (let j = Math.max(0, Math.floor(sp.y - 3)); j <= Math.min(rows - 1, sp.y + 3); j++)
          for (let c = Math.max(0, Math.floor(cx - 3)); c <= Math.min(cols + 1, cx + 3); c++) {
            const d2 = (c + 0.5 - cx) ** 2 + (j + 0.5 - sp.y) ** 2
            wake[j * (cols + 4) + c] += Math.exp(-d2 / 3.2) * life * 0.55
          }
      }

      ctx.fillStyle = GAP_BG
      ctx.fillRect(0, 0, W, H)

      const hasHeat = !!heatKey && peak > 0
      // Each active column becomes a plume of light rising from the floor,
      // spread over its neighbours so a burst reads as a glow, not a bar.
      const plume = new Float32Array(cols + 4)
      if (hasHeat)
        for (let c = fieldL; c <= fieldR; c++) {
          let best = 0
          for (let k = Math.max(fieldL, c - 6); k <= Math.min(fieldR, c + 6); k++) {
            const v = hShown[k] * Math.exp(-(((c - k) / 2.6) ** 2))
            if (v > best) best = v
          }
          plume[c] = best
        }
      const buckets: number[][] = new Array(256)
      const inset = (cell - tile) / 2

      for (let j = 0; j < rows; j++) {
        const y = offY + j * cell
        const hgt = (rows - 2 - j) / (rows - 3) // 0 at the bottom row inside the frame
        for (let c = -1; c <= cols + 1; c++) {
          const ic = c + shift
          const x = offX + c * cell - sub
          if (x > W || x + cell < 0) continue
          const frameTile = j === 0 || j === rows - 1 || ic <= 0 || ic >= totalCols - 1

          const n = fbm(ic * 0.075 + t * 0.045, j * 0.075 - t * 0.02, t * 0.06)
          let v: number
          if (hasHeat) {
            v = 0.07 + 0.62 * n ** 1.35
            const s = c >= 0 && c <= cols + 1 ? plume[c] : 0
            if (s > 0.02 && !frameTile) {
              const reach = 0.08 + 0.46 * s
              const flicker = 0.7 + 0.6 * noise3(ic * 0.4, j * 0.22 - t * 0.5, t * 0.35)
              const light = s * Math.exp(-hgt / reach) * flicker
              const k = smoothstep(0.06, 0.55, light)
              v = v * (1 - k) + (0.6 + 0.4 * Math.min(1, light)) * k
            }
          } else {
            v = 0.06 + 0.9 * n ** 1.8
          }
          if (c >= 0 && c <= cols + 1) v += wake[j * (cols + 4) + c]
          if (frameTile) v *= 0.32
          v = v < 0 ? 0 : v > 1 ? 1 : v
          const idx = (v * 255) | 0

          const p = frameTile ? 0 : cover(ic, j, panes, nowMs)
          if (p >= 1) {
            ctx.fillStyle = `rgb(${PANE[0]},${PANE[1]},${PANE[2]})`
            ctx.fillRect(x, y, cell + 0.5, cell + 0.5)
          } else if (p > 0) {
            const size = tile + (cell - tile) * p
            const o = (cell - size) / 2
            const r = lut[idx * 3] + (PANE[0] - lut[idx * 3]) * p
            const g = lut[idx * 3 + 1] + (PANE[1] - lut[idx * 3 + 1]) * p
            const b = lut[idx * 3 + 2] + (PANE[2] - lut[idx * 3 + 2]) * p
            ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`
            ctx.beginPath()
            ctx.roundRect(x + o, y + o, size, size, rad * (1 - p))
            ctx.fill()
          } else {
            ;(buckets[idx] ??= []).push(x + inset, y + inset)
          }
        }
      }

      // One fill per colour instead of one per tile.
      for (let k = 0; k < 256; k++) {
        const list = buckets[k]
        if (!list) continue
        ctx.fillStyle = styles[k]
        ctx.beginPath()
        for (let q = 0; q < list.length; q += 2) ctx.roundRect(list[q], list[q + 1], tile, tile, rad)
        ctx.fill()
      }

      updateTip(fieldL, fieldR, sub)
      raf = requestAnimationFrame(frame)
    }

    function updateTip(fieldL: number, fieldR: number, sub: number) {
      const src = heatKey ? sources[heatKey] : null
      if (!pointer || !src) {
        tip.dataset.show = 'false'
        return
      }
      const c = Math.floor((pointer.x + sub - offX) / cell)
      const j = Math.floor((pointer.y - offY) / cell)
      const range = colDays[c]
      if (c < fieldL || c > fieldR || j < 1 || j > rows - 2 || !range || !colCount[c]) {
        tip.dataset.show = 'false'
        return
      }
      const a = DAY_FMT.format(start + range[0] * DAY + DAY / 2)
      const b = DAY_FMT.format(start + range[1] * DAY + DAY / 2)
      const n = colCount[c]
      tip.textContent = `${a === b ? a : `${a} to ${b}`} · ${n} ${src.noun[n === 1 ? 0 : 1]}`
      tip.dataset.show = 'true'
      const x = Math.min(pointer.x + 14, W - tip.offsetWidth - 12)
      const y = Math.max(12, pointer.y - 36)
      tip.style.transform = `translate(${x}px, ${y}px)`
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-pane]')) {
        pointer = null
        return
      }
      pointer = { x: e.clientX, y: e.clientY }
      if (reduce) return
      const stage = document.querySelector<HTMLElement>('.stage')
      const scroll = stage?.scrollLeft ?? 0
      const x = (e.clientX + scroll - offX) / cell
      const y = (e.clientY - offY) / cell
      const lastSpark = sparks[sparks.length - 1]
      if (!lastSpark || Math.hypot(lastSpark.x - x, lastSpark.y - y) > 0.6)
        sparks.push({ x, y, t: 0 })
      if (sparks.length > 40) sparks.shift()
    }

    function onLeave() {
      pointer = null
    }

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
    root.dataset.wall = 'ready'
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [sources, builtAt])

  return (
    <>
      <canvas ref={canvasRef} className="wall" aria-hidden="true" />
      <div ref={tipRef} className="wall-tip" data-show="false" aria-hidden="true" />
    </>
  )
}

function toStyles(lut: Float32Array): string[] {
  const out = new Array<string>(256)
  for (let k = 0; k < 256; k++)
    out[k] = `rgb(${lut[k * 3] | 0},${lut[k * 3 + 1] | 0},${lut[k * 3 + 2] | 0})`
  return out
}
