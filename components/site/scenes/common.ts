// Shared by the scenery: colour helpers, where the open part of the screen
// starts (right of the panes), a small WebGL runner for full-screen shaders,
// a frame loop, and the pointer.

export type RGB = [number, number, number]

export function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

/** RGB (0 to 1) packed as one little-endian RGBA pixel for a Uint32Array. */
export const pack = (c: RGB, a = 255) =>
  ((a << 24) |
    (Math.round(Math.min(1, Math.max(0, c[2])) * 255) << 16) |
    (Math.round(Math.min(1, Math.max(0, c[1])) * 255) << 8) |
    Math.round(Math.min(1, Math.max(0, c[0])) * 255)) >>>
  0

/** Left edge of the open part of the screen: right of the last visible pane. */
export function openLeft(W: number) {
  let x0 = 0
  document.querySelectorAll<HTMLElement>('[data-pane]').forEach((el) => {
    if (el.dataset.phase !== 'out') x0 = Math.max(x0, el.getBoundingClientRect().right)
  })
  return W - x0 < 260 ? 0 : x0
}

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Eases a set of colours toward a target, so page changes blend instead of cut. */
export function colourTween(start: RGB[]) {
  let from = start
  let to = start
  let k = 1
  const now = (): RGB[] => {
    const e = k * k * (3 - 2 * k)
    return from.map((c, i) => mix(c, to[i], e))
  }
  return {
    set(next: RGB[]) {
      from = now()
      to = next
      k = 0
    },
    step(dt: number, seconds = 1.2) {
      k = Math.min(1, k + dt / seconds)
    },
    now,
  }
}

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
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    frame(dt)
    raf = requestAnimationFrame(tick)
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

/** The pointer, eased, in CSS px. `on` is false over panes and on touch. */
export function trackPointer() {
  const p = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, on: false }
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    p.on = !(e.target as HTMLElement | null)?.closest('[data-pane]')
    p.x = e.clientX
    p.y = e.clientY
    if (p.sx < -1e3) {
      p.sx = p.x
      p.sy = p.y
    }
  }
  const leave = () => (p.on = false)
  window.addEventListener('pointermove', move, { passive: true })
  document.addEventListener('pointerleave', leave)
  return {
    p,
    ease(dt: number, rate = 6) {
      const k = Math.min(1, dt * rate)
      p.sx += (p.x - p.sx) * k
      p.sy += (p.y - p.sy) * k
    },
    stop() {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    },
  }
}
