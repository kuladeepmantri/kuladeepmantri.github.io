'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { IN_MS, glide } from '@/lib/motion'
import { normalizePath, placeFor } from '@/lib/panes'
import { isStill, onStill } from '@/lib/still'
import {
  hash,
  hex,
  makeKit,
  mix,
  scratch,
  type Frame,
  type RGB,
  type Scene,
  type Stage,
} from './kit'
import { makePrinter } from './printer'
import { loop, paneEdge, shaderCanvas, trackPointer } from './runtime'
import { sceneFor } from './scenes'
import { SKY_FRAG } from './sky'

type Live = { key: string; scene: Scene; state: unknown; age: number; g: CanvasRenderingContext2D }

const R = 2 // cell height in CSS px
const BLEED = 120 // scenery below the page on iOS, behind the toolbar

/**
 * The sky without WebGL: the scene's sky gradient and its sun glow, on a small
 * 2D canvas of its own next to the (unusable) shader canvas. No clouds.
 */
function flatSky(shaderEl: HTMLCanvasElement) {
  const c = document.createElement('canvas')
  c.className = 'sky'
  c.setAttribute('aria-hidden', 'true')
  const g = c.getContext('2d')
  if (!g) return null
  shaderEl.style.display = 'none'
  shaderEl.after(c)
  let w = 1
  let h = 1
  let last = ''
  const css = (v: RGB, a = 1) =>
    `rgba(${v.map((x) => Math.round(Math.min(1, x) * 255)).join(',')},${a})`
  return {
    resize(cw: number, ch: number) {
      // A gradient needs few pixels; the browser smooths it up to size.
      w = Math.max(1, Math.ceil(cw / 4))
      h = Math.max(1, Math.ceil(ch / 4))
      c.width = w
      c.height = h
      c.style.width = `${cw}px`
      c.style.height = `${ch}px`
      last = ''
    },
    paint(top: RGB, bottom: RGB, sun: number) {
      const key = css(top) + css(bottom) + sun.toFixed(3)
      if (key === last) return
      last = key
      // The same curve as the shader: top to bottom, lifted a little near the horizon.
      const gr = g.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, css(top))
      gr.addColorStop(0.65, css(mix(bottom, top, 0.35)))
      const lifted: RGB = [bottom[0] * 1.06, bottom[1] * 1.06, bottom[2] * 1.06]
      gr.addColorStop(1, css(mix(bottom, lifted, 0.5)))
      g.globalCompositeOperation = 'source-over'
      g.fillStyle = gr
      g.fillRect(0, 0, w, h)
      const sx = w * 0.78
      const sy = h * 0.08
      const glow = g.createRadialGradient(sx, sy, 0, sx, sy, h)
      for (const k of [0, 0.25, 0.5, 0.75, 1])
        glow.addColorStop(k, `rgba(255,242,209,${Math.exp(-5 * k * k) * sun})`)
      g.globalCompositeOperation = 'lighter'
      g.fillStyle = glow
      g.fillRect(0, 0, w, h)
    },
    remove() {
      c.remove()
      shaderEl.style.display = ''
    },
  }
}

/**
 * The background on every page. Each page has a scene (scenes/): a picture
 * painted in code onto a small hidden canvas, one pixel per cell. The printer
 * turns it into vertical lines over a cloud sky. Changing page grows the next
 * scene out from the horizon while the last one is still moving, on the same
 * timing as the panes (lib/motion.ts). When the scenery is still (the Motion
 * switch, or reduced motion), it draws a settled frame and stops its loop.
 */
export function Scenery() {
  const path = usePathname()
  const place = placeFor(normalizePath(path))
  const skyRef = useRef<HTMLCanvasElement>(null)
  const linesRef = useRef<HTMLCanvasElement>(null)
  const want = useRef(place.palette)
  want.current = place.palette
  const wake = useRef(() => {})

  useEffect(() => {
    document.documentElement.dataset.palette = place.palette
    wake.current()
  }, [place.palette])

  // A route change can scroll the document; on iOS the page belongs on its runway.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const top =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--runway')) || 0
      if (top && Math.abs(window.scrollY - top) > 1) window.scrollTo(0, top)
    })
    return () => cancelAnimationFrame(id)
  }, [path])

  useEffect(() => {
    const undo: (() => void)[] = []

    // The site's text never depends on the background: if it cannot start, the
    // page keeps its plain background instead of failing.
    function start() {
      const skyEl = skyRef.current
      const canvas = linesRef.current
      const ctx = canvas?.getContext('2d')
      if (!skyEl || !canvas || !ctx) return
      // The line screen is drawn one pixel per CSS px; the browser scales it up with hard edges.
      canvas.style.imageRendering = 'pixelated'
      const root = document.documentElement
      let still = isStill()
      const ptr = trackPointer()
      undo.push(ptr.stop)
      let img: ImageData | null = null
      let out: Uint32Array = new Uint32Array(0)

      let W = 0
      let H = 0
      let P = 5
      let cols = 0
      let rows = 0
      let horizon = 0
      let left = -1
      const kit = makeKit(1, 1, P, R)
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
      let edgeT = 1
      let edgeKey = ''
      let needMeasure = true
      let drawnKey = ''
      let wakeUntil = 0
      let lp: ReturnType<typeof loop> | null = null
      const wakeUp = () => {
        // Panes keep moving for a moment after whatever woke us: watch them settle.
        wakeUntil = performance.now() + IN_MS + 200
        lp?.wake()
      }
      const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      // The large viewport (browser toolbars hidden). iOS draws the page under its
      // floating toolbar, so the scenery must reach that far down, not just innerHeight.
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none'
      document.body.appendChild(probe)
      undo.push(() => probe.remove())
      const css = (c: RGB) =>
        '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
      // The browser paints its status bar and the strip under its toolbar with the
      // page background, so that follows the sky of the scene on screen.
      function paintEdges(top: RGB) {
        const sky = css(top)
        if (sky === edgeKey) return
        edgeKey = sky
        meta?.setAttribute('content', sky)
        root.style.setProperty('--bg', sky)
      }

      const sky = shaderCanvas(skyEl, SKY_FRAG, 0.5, () => {
        drawnKey = ''
        wakeUp()
      })
      if (sky) undo.push(sky.dispose)
      const flat = sky ? null : flatSky(skyEl)
      if (flat) undo.push(flat.remove)

      const skyOf = (s: Scene) => ({
        c: [hex(s.sky.top), hex(s.sky.bottom), hex(s.sky.cloud)],
        clouds: s.sky.clouds ?? 5,
        sun: s.sky.sun ?? 0.2,
      })
      // The first frame already shows this page's sky; only later changes blend.
      let skyTo = skyOf(sceneFor(want.current))
      let skyFrom = skyTo
      let skyK = 1

      function measure() {
        needMeasure = false
        W = Math.max(1, window.innerWidth)
        // On iOS the canvases also cover the runway above the page and a strip
        // below it (globals.css), so Safari has scenery to draw behind its bars.
        const top = parseFloat(getComputedStyle(root).getPropertyValue('--runway')) || 0
        const page = Math.max(1, window.innerHeight, probe.offsetHeight)
        H = top + page + (top ? BLEED : 0)
        const phone = W < 640
        horizon = top + Math.round(page * (phone ? 0.62 : 0.64))
        sky?.resize(W, horizon)
        flat?.resize(W, horizon)
        if (!img || img.width !== W || img.height !== H) {
          canvas!.width = W
          canvas!.height = H
          img = ctx!.createImageData(W, H)
          out = new Uint32Array(img.data.buffer)
        }
        canvas!.style.width = `${W}px`
        canvas!.style.height = `${H}px`
        const p = phone ? 4 : 5
        const c = Math.ceil(W / p)
        const r = Math.ceil(H / R)
        if (p !== P || c !== cols || r !== rows) {
          P = p
          cols = c
          rows = r
          kit.resize(cols, rows, P)
          print = makePrinter(cols, rows)
          mixed = new Uint8ClampedArray(cols * rows * 4)
          paperCell = new Uint8Array(cols * rows)
          jitter = new Float32Array(cols)
          for (let i = 0; i < cols; i++) jitter[i] = hash(i * 1.37) * 70
          for (const g of pool) {
            g.canvas.width = cols
            g.canvas.height = rows
          }
        }
        layoutKey = ''
      }

      function source() {
        const used = new Set(live.map((l) => l.g))
        let g = pool.find((p) => !used.has(p))
        if (!g) {
          g = scratch(cols, rows)
          pool.push(g)
        }
        return g
      }

      function arrive(key: string) {
        const scene = sceneFor(key)
        const first = live.length === 0
        if (live.length >= 2) live = live.slice(-1)
        live.push({ key, scene, state: scene.setup?.(stage), age: still ? 9 : 0, g: source() })
        if (first) {
          skyFrom = skyTo = skyOf(scene)
          skyK = 1
          return
        }
        const now = skyTo
        skyFrom = {
          c: skyFrom.c.map((c, i) => mix(c, now.c[i], ease(skyK))) as RGB[],
          clouds: skyFrom.clouds + (now.clouds - skyFrom.clouds) * ease(skyK),
          sun: skyFrom.sun + (now.sun - skyFrom.sun) * ease(skyK),
        }
        skyTo = skyOf(scene)
        skyK = still ? 1 : 0
      }
      const ease = (k: number) => k * k * (3 - 2 * k)

      function updateStage(dt: number) {
        const phone = W < 640
        // Scenes live right of the panes. When that gap is under 260px, the stage
        // hugs the right edge, 300px wide, so the subject stays partly in the open.
        // When the panes cover the window, it takes the right half and shows
        // through the glass panes instead.
        const edge = phone ? 0 : paneEdge()
        const gap = W - edge
        const half = Math.round(W * 0.45)
        const target = phone
          ? 0
          : edge <= 0 || gap <= 0
            ? half
            : gap >= 260
              ? edge + 16
              : Math.max(half, W - 300)
        left = left < 0 || still ? target : left + (target - left) * Math.min(1, dt * 6)
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

      function draw(dt: number) {
        const e = ease(skyK)
        const [top, bottom, cloud] = skyFrom.c.map((c, i) => mix(c, skyTo.c[i], e))
        const sun = skyFrom.sun + (skyTo.sun - skyFrom.sun) * e
        if (sky) {
          sky.f1('u_time', 40 + t)
          sky.f1('u_count', skyFrom.clouds + (skyTo.clouds - skyFrom.clouds) * e)
          sky.f1('u_sun', sun)
          sky.f3('u_cloud', cloud)
          sky.f3('u_skyTop', top)
          sky.f3('u_skyBottom', bottom)
          sky.draw()
        }
        flat?.paint(top, bottom, sun)

        const drops = still ? [] : ptr.drops
        const frame: Frame = {
          ...stage,
          t,
          dt,
          reduce: still,
          drops,
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
          drops,
        })
        ctx!.putImageData(img!, 0, 0)
        edgeT += dt
        if (edgeT > 0.2 || still) {
          edgeT = 0
          paintEdges(mix(skyFrom.c[0], skyTo.c[0], ease(skyK)))
        }
      }

      measure()
      updateStage(0)
      arrive(want.current)

      const onResize = () => {
        needMeasure = true
        wakeUp()
      }
      window.addEventListener('resize', onResize)
      undo.push(() => window.removeEventListener('resize', onResize))
      // While still, the loop sleeps: panes opening, closing, or scrolling wake it.
      document.addEventListener('scroll', wakeUp, { capture: true, passive: true })
      undo.push(() => document.removeEventListener('scroll', wakeUp, { capture: true }))
      const panes = new MutationObserver(wakeUp)
      panes.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-phase'],
      })
      undo.push(() => panes.disconnect())
      undo.push(
        onStill((s) => {
          still = s
          if (s) {
            skyK = 1
            for (const l of live) l.age = 9
            ptr.drops.length = 0
          }
          ptr.wake(0, horizon, true)
          drawnKey = ''
          wakeUp()
        }),
      )

      wakeUntil = performance.now() + IN_MS + 200
      lp = loop((step) => {
        if (needMeasure) measure()

        if (still) {
          // Draw only when something on screen changed, then sleep once the panes settle.
          updateStage(0)
          if (want.current !== live[live.length - 1]?.key) arrive(want.current)
          const key = `${layoutKey}|${live.map((l) => l.key).join()}`
          if (key !== drawnKey) {
            drawnKey = key
            draw(0)
          }
          return live.length > 1 || performance.now() < wakeUntil
        }

        // The water and clouds move slowly, so a settled scene draws at 30 fps. Scene
        // changes, panes moving, and ripples on the water get every frame.
        const busy = live.length > 1 || skyK < 1 || !settled || ptr.drops.length > 0
        idle += step
        if (!busy && idle < 1 / 30 - 0.004) return
        const dt = Math.min(idle, 0.05)
        idle = 0
        updateStage(dt)
        if (want.current !== live[live.length - 1]?.key) arrive(want.current)
        t += dt
        ptr.wake(dt, horizon, false)
        skyK = Math.min(1, skyK + dt / (IN_MS / 1000))
        draw(dt)
      })
      undo.push(() => lp?.stop())
      wake.current = wakeUp
      undo.push(() => (wake.current = () => {}))
    }

    try {
      start()
    } catch (e) {
      console.error(e)
    }
    return () => {
      for (const f of undo.reverse()) f()
    }
  }, [])

  return (
    <>
      <canvas ref={skyRef} className="sky" aria-hidden="true" />
      <canvas ref={linesRef} className="field" aria-hidden="true" />
    </>
  )
}
