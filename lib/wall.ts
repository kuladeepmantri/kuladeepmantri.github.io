// The wall behind every page: palettes, value noise, and the helpers that turn
// a list of active days into a per-day heat curve. No DOM here.

/** Low to high. Low values are the resting field, high values are lit by data. */
export const PALETTES: Record<string, string[]> = {
  // Northern lights over Michigan: night to teal at rest, activity in violet.
  home: ['#03070f', '#061426', '#0a2a3f', '#0f4a55', '#17806c', '#8f7cff', '#c9a8ff', '#f4e4ff'],
  about: ['#140b24', '#2a1646', '#4a2366', '#7a3474', '#b64f78', '#e9807d', '#ffc29a', '#ffe6cf'],
  github: ['#04110a', '#08260f', '#0d4420', '#136b31', '#1f9c47', '#3ecf67', '#9df0b3', '#e6fff0'],
  x: ['#05080d', '#0b1420', '#132438', '#1b3a5c', '#1d6fb0', '#1d9bf0', '#8ecdfa', '#e9f6ff'],
  contact: ['#15100c', '#2b2019', '#46352a', '#6e5646', '#a3846a', '#d6b996', '#f2e2c9', '#fffaf1'],
  kubereach: ['#060f2b', '#0b1d55', '#12318f', '#1f4fcf', '#326ce5', '#6f97ff', '#c1d4ff', '#f2f6ff'],
  rune: ['#120700', '#2d1100', '#5a2200', '#933800', '#d35a00', '#ff8a00', '#ffbf5c', '#fff0cc'],
  shipcrew: ['#150a06', '#301710', '#56281a', '#8a3f25', '#c2603e', '#e08a63', '#f4bea0', '#fdeadf'],
  kintsugi: ['#090807', '#15130f', '#221e18', '#332c21', '#6f5a28', '#b89233', '#e8c65e', '#fff2b8'],
  auris: ['#020805', '#04160b', '#082814', '#0e4421', '#157a39', '#27b85a', '#72f09a', '#d4ffe2'],
  untilithappens: ['#041a19', '#082f2d', '#0f4f4a', '#1a7a70', '#2a9d8f', '#8ecfc0', '#e9d8a6', '#f4a261'],
  deid: ['#0a0a0a', '#151515', '#222222', '#333333', '#4d4d4d', '#7a7a7a', '#b8b8b8', '#f0f0f0'],
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 256 RGB triples sampled evenly along the palette. */
export function buildLUT(stops: string[]): Float32Array<ArrayBuffer> {
  const rgb = stops.map(hex)
  const out = new Float32Array(256 * 3)
  for (let k = 0; k < 256; k++) {
    const f = (k / 255) * (rgb.length - 1)
    const a = Math.floor(f)
    const b = Math.min(rgb.length - 1, a + 1)
    const t = f - a
    for (let c = 0; c < 3; c++) out[k * 3 + c] = rgb[a][c] + (rgb[b][c] - rgb[a][c]) * t
  }
  return out
}

// Integer hash to [0, 1), then trilinear value noise with smoothstep fades.
function hash3(x: number, y: number, z: number): number {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  n ^= n >>> 16
  return (n >>> 0) / 4294967296
}

export function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const fx = x - xi
  const fy = y - yi
  const fz = z - zi
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const w = fz * fz * (3 - 2 * fz)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  const x00 = l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u)
  const x10 = l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u)
  const x01 = l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u)
  const x11 = l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u)
  return l(l(x00, x10, v), l(x01, x11, v), w)
}

export function fbm(x: number, y: number, z: number): number {
  return 0.6 * noise3(x, y, z) + 0.4 * noise3(x * 2.13 + 9.1, y * 2.13 + 4.7, z * 1.7 + 2.3)
}

export const DAY = 86_400_000
export const YEAR_DAYS = 365

/** Counts per day for the last year: index 0 is a year ago, 364 is today. */
export function dailyHeat(days: [string, number][], now: number): Float32Array<ArrayBuffer> {
  const raw = new Float32Array(YEAR_DAYS)
  const start = now - YEAR_DAYS * DAY
  for (const [d, n] of days) {
    const i = Math.floor((Date.parse(`${d}T12:00:00Z`) - start) / DAY)
    if (i >= 0 && i < YEAR_DAYS) raw[i] += n
  }
  return raw
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a)
  return t * t * (3 - 2 * t)
}
