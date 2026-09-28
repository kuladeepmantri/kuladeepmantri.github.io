import type { Drop } from './kit'
// The scenery's plumbing: where the open part of the screen starts (right of
// the panes), a small WebGL runner for the sky shader, a frame loop that
// pauses in background tabs, and the pointer.

import type { RGB } from './kit'

/** Left edge of the open part of the screen: right of the last visible pane. */
export function openLeft(W: number) {
  let x0 = 0
  document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
    if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right)
  })
  return W - x0 < 260 ? 0 : x0
}

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

/**
 * A full-screen fragment shader on its own canvas, drawn at a fraction of the
 * device resolution. Returns null when WebGL is unavailable.
 */
export function shaderCanvas(canvas: HTMLCanvasElement, frag: string, scale = 0.5) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return null
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision highp float;\n${frag}`))
  gl.linkProgram(prog)
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const locs = new Map<string, WebGLUniformLocation | null>()
  const u = (name: string) => {
    if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name))
    return locs.get(name) ?? null
  }
  return {
    /** Size the canvas to `w` by `h` CSS px. */
    resize(w: number, h: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u('u_res'), canvas.width, canvas.height)
    },
    f1: (n: string, v: number) => gl.uniform1f(u(n), v),
    f3: (n: string, c: RGB) => gl.uniform3f(u(n), c[0], c[1], c[2]),
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
  }
}

/** Runs a frame loop that pauses while the tab is hidden. */
export function loop(frame: (dt: number) => void) {
  let raf = 0
  let last = performance.now()
  let failed = false
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
      frame(dt)
    } catch (e) {
      if (!failed) console.error(e)
      failed = true
    }
    end = performance.now()
    cost = end - t0
  }
  const onVis = () => {
    cancelAnimationFrame(raf)
    if (!document.hidden) {
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }
  document.addEventListener('visibilitychange', onVis)
  raf = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', onVis)
  }
}

/**
 * The pointer on the scenery, and the ripples it leaves on the lake. A mouse
 * crossing the water drops a ring every few dozen pixels; a tap on the water
 * drops one. Nothing happens over the panes or in the sky.
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
    p.y = e.clientY
  }
  const down = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && onScene(e)) pending.push({ x: e.clientX, y: e.clientY, a: 1.2 })
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
