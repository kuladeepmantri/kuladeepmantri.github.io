// The four-ink palettes the About portrait is printed in. No DOM here.

/** Low to high. Low values are the resting field, high values are lit by data. */
export const PALETTES: Record<string, string[]> = {
  // Cool steel at rest, a soft periwinkle signal.
  home: ['#04060a', '#0a1018', '#111c29', '#1a2c3e', '#2a4a5e', '#5f7f9a', '#aab4ff', '#eceeff'],
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
