// What every background scene shares: the page's colours, where the open part
// of the screen starts (right of the panes), and a tiny WebGL runner for the
// scenes that are a single fragment shader.

export type RGB = [number, number, number];

function hex(c: string): RGB {
  const n = parseInt(c.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Four colours per page, dark to light: ground, body, colour, highlight. */
const VIVID_HEX: Record<string, [string, string, string, string]> = {
  home: ["#05050f", "#2a1fb8", "#9b4dff", "#7cf2ff"],
  about: ["#0d0507", "#7a1d3f", "#ff6a55", "#ffd6a8"],
  github: ["#020a06", "#0b5a36", "#27d884", "#d9ffe9"],
  x: ["#03060d", "#0f2f6e", "#1d9bf0", "#e6f5ff"],
  contact: ["#0b0806", "#5a3a1c", "#e0a45f", "#fff0d8"],
  kubereach: ["#03061a", "#1c32a8", "#3f7bff", "#c4d6ff"],
  rune: ["#0d0500", "#7a2a00", "#ff8a1f", "#ffe1ae"],
  shipcrew: ["#0e0504", "#6b2314", "#ff6e44", "#ffd8c6"],
  kintsugi: ["#0a0804", "#4a3510", "#e8b93c", "#fff4c8"],
  auris: ["#020805", "#0b4f2a", "#34e68a", "#e0ffec"],
  untilithappens: ["#031211", "#0f544e", "#2fb3a2", "#f6dcaa"],
  deid: ["#08080a", "#34343f", "#9a9aab", "#f4f4f7"],
};

export const VIVID: Record<string, [RGB, RGB, RGB, RGB]> = Object.fromEntries(
  Object.entries(VIVID_HEX).map(([k, v]) => [
    k,
    v.map(hex) as [RGB, RGB, RGB, RGB],
  ]),
);

export function vivid(key: string) {
  return VIVID[key] ?? VIVID.home;
}

export const css = (c: RGB, a = 1) =>
  `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;

export const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/** Left edge of the open part of the screen: right of the last visible pane. */
export function openLeft(W: number) {
  let x0 = 0;
  document.querySelectorAll<HTMLElement>("[data-pane]").forEach((el) => {
    if (el.dataset.phase !== "out")
      x0 = Math.max(x0, el.getBoundingClientRect().right);
  });
  return W - x0 < 260 ? 0 : x0;
}

export const reduceMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Eases a set of colours toward a target, so page changes blend instead of cut. */
export function colourTween(start: RGB[]) {
  let from = start.map((c) => [...c] as RGB);
  let to = from;
  let k = 1;
  return {
    set(next: RGB[]) {
      from = this.now();
      to = next;
      k = 0;
    },
    step(dt: number, seconds = 1.2) {
      k = Math.min(1, k + dt / seconds);
    },
    now(): RGB[] {
      const e = k * k * (3 - 2 * k);
      return from.map((c, i) => mix(c, to[i], e));
    },
  };
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * A full-screen fragment shader on its own canvas, drawn at a fraction of the
 * device resolution. Returns null when WebGL is unavailable.
 */
export function shaderCanvas(
  canvas: HTMLCanvasElement,
  frag: string,
  scale = 0.5,
) {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
  });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(
    prog,
    sh(gl.FRAGMENT_SHADER, `precision highp float;\n${frag}`),
  );
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const locs = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name));
    return locs.get(name) ?? null;
  };
  let W = 0;
  let H = 0;
  return {
    gl,
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    size: () => ({ W, H, w: canvas.width, h: canvas.height }),
    f1: (n: string, v: number) => gl.uniform1f(u(n), v),
    f2: (n: string, a: number, b: number) => gl.uniform2f(u(n), a, b),
    f3: (n: string, c: RGB) => gl.uniform3f(u(n), c[0], c[1], c[2]),
    draw: () => gl.drawArrays(gl.TRIANGLES, 0, 3),
  };
}

/** Runs a frame loop that pauses while the tab is hidden. */
export function loop(frame: (dt: number, now: number) => void) {
  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame(dt, now);
    raf = requestAnimationFrame(tick);
  };
  const onVis = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener("visibilitychange", onVis);
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVis);
  };
}

/** The pointer, eased, in CSS px. `on` is false over panes and on touch. */
export function trackPointer() {
  const p = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, on: false };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    p.on = !(e.target as HTMLElement | null)?.closest("[data-pane]");
    p.x = e.clientX;
    p.y = e.clientY;
    if (p.sx < -1e3) {
      p.sx = p.x;
      p.sy = p.y;
    }
  };
  const leave = () => (p.on = false);
  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerleave", leave);
  return {
    p,
    ease(dt: number, rate = 6) {
      const k = Math.min(1, dt * rate);
      p.sx += (p.x - p.sx) * k;
      p.sy += (p.y - p.sy) * k;
    },
    stop() {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    },
  };
}
