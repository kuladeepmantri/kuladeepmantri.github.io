import type { Drop } from './kit'
// The scenery's plumbing: where the open part of the screen starts (right of
// the panes), a small WebGL runner for the sky shader, a frame loop that
// pauses in background tabs, and the pointer.

import type { RGB } from './kit'

/** Right edge of the last visible pane, or 0 when none is on screen. */
export function paneEdge() {
  let x0 = 0
  document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
    if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right)
  })
  return x0
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

export type Shader = {
  resize: (w: number, h: number) => void
  f1: (n: string, v: number) => void
  f3: (n: string, c: RGB) => void
  draw: () => void
  dispose: () => void
}

/**
 * A full-screen fragment shader on its own canvas, drawn at a fraction of the
 * device resolution. Returns null when WebGL is unavailable or the shader does
 * not build. Survives a lost context: `onRestore` runs once it is rebuilt.
 */
export function shaderCanvas(
  canvas: HTMLCanvasElement,
  frag: string,
  scale = 0.5,
  onRestore?: () => void,
): Shader | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return null
  const locs = new Map<string, WebGLUniformLocation | null>()
  let prog: WebGLProgram | null = null
  let size: [number, number] | null = null
  let shown = false

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s
    if (!gl.isContextLost()) console.error(gl.getShaderInfoLog(s))
    return null
  }
  const init = () => {
    locs.clear()
    const vs = sh(gl.VERTEX_SHADER, VERT)
    const fs = sh(gl.FRAGMENT_SHADER, `precision highp float;\n${frag}`)
    const p = gl.createProgram()
    if (!vs || !fs || !p) return false
    gl.attachShader(p, vs)
    gl.attachShader(p, fs)
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      if (!gl.isContextLost()) console.error(gl.getProgramInfoLog(p))
      return false
    }
    prog = p
    gl.useProgram(p)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(p, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    return true
  }
  const u = (name: string) => {
    if (!locs.has(name)) locs.set(name, prog && gl.getUniformLocation(prog, name))
    return locs.get(name) ?? null
  }
  const ready = () => !!prog && !gl.isContextLost()
  const applySize = () => {
    if (!size || !ready()) return
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u('u_res'), canvas.width, canvas.height)
  }

  if (!init()) return null
  // Hidden until a frame has drawn cleanly; until then the page background shows.
  canvas.style.visibility = 'hidden'

  // Browsers drop WebGL contexts (backgrounded tabs on iOS, GPU resets). Asking
  // to keep it lets the browser restore it, and then the program is rebuilt.
  const lost = (e: Event) => {
    e.preventDefault()
    prog = null
  }
  const restored = () => {
    if (!init()) return
    applySize()
    onRestore?.()
  }
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', restored)

  return {
    /** Size the canvas to `w` by `h` CSS px. */
    resize(w, h) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale
      size = [w, h]
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      applySize()
    },
    f1: (n, v) => {
      if (ready()) gl.uniform1f(u(n), v)
    },
    f3: (n, c) => {
      if (ready()) gl.uniform3f(u(n), c[0], c[1], c[2])
    },
    draw() {
      if (!ready()) return
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!shown && gl.getError() === gl.NO_ERROR) {
        shown = true
        canvas.style.visibility = ''
      }
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      canvas.style.visibility = ''
    },
  }
}

/**
 * Runs a frame loop that pauses while the tab is hidden. When `frame` returns
 * false the loop parks until `wake()` is called.
 */
export function loop(frame: (dt: number) => boolean | void) {
  let raf = 0
  let last = performance.now()
  let failed = false
  let parked = false
  // The scenery gets at most about half the main thread: after a frame that took
  // `cost` ms, it waits at least that long again before drawing. On a fast machine
  // this never skips a frame; on a slow phone the scene drops frames instead of
  // starving the panes, their timers, and taps.
  let cost = 0
  let end = 0
  const tick = (now: number) => {
    // Schedule first: one bad frame must not stop the scenery for the rest of the visit.
    raf = requestAnimationFrame(tick)
    const t0 = performance.now()
    if (t0 - end < cost) return
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    try {
      if (frame(dt) === false) {
        cancelAnimationFrame(raf)
        raf = 0
        parked = true
      }
    } catch (e) {
      if (!failed) console.error(e)
      failed = true
    }
    end = performance.now()
    cost = end - t0
  }
  const start = () => {
    cancelAnimationFrame(raf)
    last = performance.now()
    raf = requestAnimationFrame(tick)
  }
  const onVis = () => {
    cancelAnimationFrame(raf)
    raf = 0
    if (!document.hidden && !parked) start()
  }
  document.addEventListener('visibilitychange', onVis)
  start()
  return {
    wake() {
      parked = false
      if (!raf && !document.hidden) start()
    },
    stop() {
      cancelAnimationFrame(raf)
      raf = 0
      document.removeEventListener('visibilitychange', onVis)
    },
  }
}

/**
 * The pointer on the scenery, and the ripples it leaves on the lake. A mouse
 * crossing the water drops a ring every few dozen pixels; a tap on the water
 * drops one. Nothing happens over the panes or in the sky. Positions are page
 * coordinates, which is where the canvases sit (on iOS they start above the page).
 */
export function trackPointer() {
  const p = { x: -1e4, y: -1e4, on: false }
  const drops: Drop[] = []
  let lx = -1e4
  let ly = -1e4
  let pending: { x: number; y: number; a: number }[] = []
  const onScene = (e: PointerEvent) => !(e.target as HTMLElement | null)?.closest('[data-pane]')
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    p.on = onScene(e)
    p.x = e.clientX
    p.y = e.pageY
  }
  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && onScene(e)) pending.push({ x: e.clientX, y: e.pageY, a: 1.2 })
  }
  const leave = () => (p.on = false)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerdown', down, { passive: true })
  document.addEventListener('pointerleave', leave)
  return {
    p,
    drops,
    /** Age the rings, and add new ones where the pointer crossed the water. */
    wake(dt: number, horizon: number, still: boolean) {
      for (const d of drops) {
        d.age += dt
        d.r = 6 + d.age * 70
        d.a = Math.exp(-d.age * 1.6) * Math.min(1, d.age * 6) * (d.a0 ?? 1)
      }
      while (drops.length && drops[0].age > 2.6) drops.shift()
      if (still) {
        pending = []
        return
      }
      for (const q of pending) if (q.y > horizon + 4) drops.push({ x: q.x, y: q.y, age: 0, r: 6, a: 0, a0: q.a })
      pending = []
      if (p.on && p.y > horizon + 4 && Math.hypot(p.x - lx, p.y - ly) > 36) {
        drops.push({ x: p.x, y: p.y, age: 0, r: 6, a: 0, a0: 0.8 })
        lx = p.x
        ly = p.y
      }
      if (drops.length > 12) drops.splice(0, drops.length - 12)
    },
    stop() {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      document.removeEventListener('pointerleave', leave)
    },
  }
}
