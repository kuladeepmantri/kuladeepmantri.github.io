'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { IN_MS, glide } from '@/lib/motion'
import { normalizePath, placeFor } from '@/lib/panes'
import { hash, hex, makeKit, mix, type Frame, type RGB, type Scene, type Stage } from './kit'
import { makePrinter } from './printer'
import { loop, openLeft, reduceMotion, shaderCanvas, trackPointer } from './runtime'
import { SCENES, sceneFor } from './scenes'
import { SKY_FRAG } from './sky'

type Live = { key: string; scene: Scene; state: unknown; age: number; g: CanvasRenderingContext2D }

const R = 2 // cell height in CSS px

/**
 * The background on every page. Each page has a scene (scenes/): a picture
 * painted in code onto a small hidden canvas, one pixel per cell. The printer
 * turns it into vertical lines over a cloud sky. Changing page grows the next
 * scene out from the horizon while the last one is still moving, on the same
 * timing as the panes (lib/motion.ts).
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
    let out: Uint32Array = new Uint32Array(0)

    let W = 0
    let H = 0
    let dpr = 1
    let P = 5
    let cols = 0
    let rows = 0
    let horizon = 0
    let left = -1
    let kit = makeKit(1, 1, P, R)
    let print = makePrinter(1, 1)
    let mixed: Uint8ClampedArray = new Uint8ClampedArray(0)
    let paperCell = new Uint8Array(0)
    let jitter = new Float32Array(0)
    const pool: CanvasRenderingContext2D[] = []
    let live: Live[] = []
    let layoutKey = ''
    let stage: Stage
    let t = 0
    let settled = true
    let idle = 0

    const skyOf = (s: Scene) => ({
      c: [hex(s.sky.top), hex(s.sky.bottom), hex(s.sky.cloud)],
      clouds: s.sky.clouds ?? 5,
      sun: s.sky.sun ?? 0.2,
    })
    let skyFrom = skyOf(SCENES.home)
    let skyTo = skyFrom
    let skyK = 1

    function measure() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      const phone = W < 640
      const cell = phone ? 16 : 18
      root.style.setProperty('--cell', `${cell}px`)
      root.style.setProperty('--cols', String(Math.floor(W / cell)))
      horizon = Math.round(H * (phone ? 0.62 : 0.64))
      sky?.resize(W, horizon)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      P = phone ? 4 : 5
      cols = Math.ceil(W / P)
      rows = Math.ceil(H / R)
      kit = makeKit(cols, rows, P, R)
      print = makePrinter(cols, rows)
      mixed = new Uint8ClampedArray(cols * rows * 4)
      paperCell = new Uint8Array(cols * rows)
      jitter = new Float32Array(cols)
      for (let c = 0; c < cols; c++) jitter[c] = hash(c * 1.37) * 70
      for (const g of pool) {
        g.canvas.width = cols
        g.canvas.height = rows
      }
      buf.width = W
      buf.height = H
      img = bctx.createImageData(W, H)
      out = new Uint32Array(img.data.buffer)
      layoutKey = ''
    }

    function source() {
      const used = new Set(live.map((l) => l.g))
      let g = pool.find((p) => !used.has(p))
      if (!g) {
        const c = document.createElement('canvas')
        c.width = cols
        c.height = rows
        g = c.getContext('2d', { willReadFrequently: true })!
        pool.push(g)
      }
      return g
    }

    function arrive(key: string) {
      const scene = sceneFor(key)
      if (live.length >= 2) live = live.slice(-1)
      live.push({ key, scene, state: scene.setup?.(stage), age: reduce ? 9 : 0, g: source() })
      const now = skyTo
      skyFrom = {
        c: skyFrom.c.map((c, i) => mix(c, now.c[i], ease(skyK))) as RGB[],
        clouds: skyFrom.clouds + (now.clouds - skyFrom.clouds) * ease(skyK),
        sun: skyFrom.sun + (now.sun - skyFrom.sun) * ease(skyK),
      }
      skyTo = skyOf(scene)
      skyK = reduce ? 1 : 0
    }
    const ease = (k: number) => k * k * (3 - 2 * k)

    function updateStage(dt: number) {
      const phone = W < 640
      // Scenes live right of the panes. When that gap is too narrow, they take the
      // right half of the window and show through the glass panes instead.
      const x0 = phone ? 0 : openLeft(W)
      const target = phone ? 0 : x0 > 0 ? x0 + 16 : Math.round(W * 0.45)
      left = left < 0 || reduce ? target : left + (target - left) * Math.min(1, dt * 6)
      // After a resize the eased value can sit past the new window edge: keep a real stage.
      left = Math.min(Math.max(0, left), Math.max(0, W - 200))
      settled = Math.abs(target - left) < 0.5
      const span = Math.max(1, W - left)
      stage = {
        W,
        H,
        horizon,
        left,
        right: W,
        cx: left + span * 0.5,
        span,
        unit: phone ? Math.min(span / 1.25, horizon * 0.85) : Math.min(span / 1.25, H * 0.9),
        phone,
      }
      const k = `${Math.round(left)}|${W}|${H}`
      if (k !== layoutKey) {
        layoutKey = k
        for (const l of live) l.state = l.scene.setup?.(stage)
      }
    }

    measure()
    updateStage(0)
    arrive(want.current)
    window.addEventListener('resize', measure)

    const stop = loop((step) => {
      // The water and clouds move slowly, so a settled scene draws at 30 fps. Scene
      // changes, panes moving, and ripples on the water get every frame.
      const busy = live.length > 1 || skyK < 1 || !settled || ptr.drops.length > 0
      idle += step
      if (!busy && idle < 1 / 30 - 0.004) return
      const dt = Math.min(idle, 0.05)
      idle = 0
      updateStage(dt)
      if (want.current !== live[live.length - 1]?.key) arrive(want.current)
      if (!reduce) t += dt
      ptr.wake(dt, horizon, reduce)
      skyK = Math.min(1, skyK + dt / (IN_MS / 1000))

      if (sky) {
        const e = ease(skyK)
        const [top, bottom, cloud] = skyFrom.c.map((c, i) => mix(c, skyTo.c[i], e))
        sky.f1('u_time', 40 + t)
        sky.f1('u_count', skyFrom.clouds + (skyTo.clouds - skyFrom.clouds) * e)
        sky.f1('u_sun', skyFrom.sun + (skyTo.sun - skyFrom.sun) * e)
        sky.f3('u_cloud', cloud)
        sky.f3('u_skyTop', top)
        sky.f3('u_skyBottom', bottom)
        sky.draw()
      }

      const frame: Frame = {
        ...stage,
        t,
        dt,
        reduce,
        drops: ptr.drops,
      }
      const pics = live.map((l) => {
        l.age += dt
        const g = l.g
        g.setTransform(1, 0, 0, 1, 0, 0)
        g.clearRect(0, 0, cols, rows)
        g.setTransform(1 / P, 0, 0, 1 / R, 0, 0)
        kit.reset()
        l.scene.paint(g, frame, l.state, kit)
        return g.getImageData(0, 0, cols, rows).data
      })

      let src = pics[pics.length - 1]
      let cellPaper: Uint8Array | null = null
      if (live.length === 2) {
        // The next scene grows out from the horizon, a little unevenly per column.
        const [a, b] = live
        const reveal =
          glide(Math.min(1, b.age / (IN_MS / 1000))) * (Math.max(horizon, H - horizon) + 90)
        const pa = Math.round(a.scene.paper * 255)
        const pb = Math.round(b.scene.paper * 255)
        for (let r = 0; r < rows; r++) {
          const dy = Math.abs(r * R + R / 2 - horizon)
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c
            const useB = dy < reveal - jitter[c]
            const from = useB ? pics[1] : pics[0]
            const k = i * 4
            mixed[k] = from[k]
            mixed[k + 1] = from[k + 1]
            mixed[k + 2] = from[k + 2]
            mixed[k + 3] = from[k + 3]
            paperCell[i] = useB ? pb : pa
          }
        }
        src = mixed
        cellPaper = paperCell
        if (b.age > IN_MS / 1000 + 0.05) live = [b]
      }

      print(src, out, {
        cols,
        rows,
        P,
        R,
        W,
        H,
        horizon,
        paperAbove: live[live.length - 1].scene.paper,
        paperCell,
        usePaperCell: !!cellPaper,
        paperBelow: 0.72,
        t,
        drops: ptr.drops,
      })
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
