import { glow, hash, noise1, rgba, scene, vgrad } from '../kit'

// Auris: snow falling on a pine lake at night, a single cabin with its window
// lit. Snow makes the world so quiet you can hear everything.
type Flake = { x: number; y: number; r: number; speed: number; phase: number }
type State = { u: number; flakes: Flake[] }

/** A pine with snow resting on each tier. */
function snowyPine(g: CanvasRenderingContext2D, x: number, base: number, h: number) {
  const w = h * 0.36
  for (let k = 0; k < 3; k++) {
    const ty = base - h + k * h * 0.27
    const bw = w * (0.5 + k * 0.3)
    g.fillStyle = '#1b2a3c'
    g.beginPath()
    g.moveTo(x, ty)
    g.lineTo(x + bw / 2, ty + h * 0.42)
    g.lineTo(x - bw / 2, ty + h * 0.42)
    g.closePath()
    g.fill()
    g.fillStyle = '#e8eef7'
    g.beginPath()
    g.moveTo(x, ty)
    g.lineTo(x + bw * 0.2, ty + h * 0.16)
    g.lineTo(x, ty + h * 0.12)
    g.lineTo(x - bw * 0.2, ty + h * 0.16)
    g.closePath()
    g.fill()
  }
  g.fillStyle = '#1b2a3c'
  g.fillRect(x - w * 0.05, base - h * 0.2, w * 0.1, h * 0.2)
}

export default scene<State>({
  sky: { top: '#18223f', bottom: '#5c6d92', cloud: '#8f9bb8', clouds: 5, sun: 0.06 },
  paper: 0.6,
  setup(s) {
    const n = s.span > 800 ? 260 : 160
    const flakes = Array.from({ length: n }, (_, i) => ({
      x: hash(i * 1.3) * s.W,
      y: hash(i * 2.9) * s.H,
      r: 0.8 + 2.2 * hash(i * 5.7) ** 2,
      speed: 12 + 26 * hash(i * 7.1),
      phase: hash(i * 3.3) * 6.28,
    }))
    return { u: s.unit, flakes }
  },
  paint(g, f, { u, flakes }, kit) {
    const back = kit.layer()
    // Snowy hills far away, then the near shore with its pines.
    back.beginPath()
    back.moveTo(-10, f.horizon)
    for (let x = -10; x <= f.W + 10; x += 5)
      back.lineTo(x, f.horizon - u * 0.04 - u * 0.1 * noise1(x * 0.004, 100))
    back.lineTo(f.W + 10, f.horizon)
    back.fillStyle = vgrad(back, f.horizon - u * 0.15, f.horizon, [
      [0, '#c8d3e6'],
      [1, '#8a9bba'],
    ])
    back.fill()
    back.fillStyle = '#dfe7f2'
    back.fillRect(-10, f.horizon - u * 0.012, f.W + 20, u * 0.012)
    for (let x = -10; x < f.W + 10; ) {
      const h = u * (0.08 + 0.1 * hash(x * 0.37))
      const nearCabin = Math.abs(x - (f.cx + u * 0.12)) < u * 0.12
      if (!nearCabin) snowyPine(back, x, f.horizon - u * 0.01, h)
      x += h * (0.2 + 0.25 * hash(x * 1.3))
    }
    // The cabin: a lit window, snow on the roof, smoke drifting from the chimney.
    const cx = f.cx + u * 0.12
    const base = f.horizon - u * 0.01
    const cw = u * 0.13
    const ch = u * 0.07
    back.fillStyle = '#3a2f33'
    back.fillRect(cx - cw / 2, base - ch, cw, ch)
    back.fillStyle = '#eef3fa'
    back.beginPath()
    back.moveTo(cx - cw * 0.62, base - ch)
    back.lineTo(cx, base - ch - u * 0.06)
    back.lineTo(cx + cw * 0.62, base - ch)
    back.closePath()
    back.fill()
    back.fillStyle = '#2a2226'
    back.fillRect(cx + cw * 0.22, base - ch - u * 0.06, u * 0.014, u * 0.035)
    const lit = 0.85 + 0.15 * Math.sin(f.t * 2.2)
    glow(back, cx - cw * 0.18, base - ch * 0.5, u * 0.08, '#ffc478', 0.55 * lit)
    back.fillStyle = rgba('#ffd89a', lit)
    back.fillRect(cx - cw * 0.28, base - ch * 0.7, cw * 0.2, ch * 0.4)
    for (let i = 0; i < 6; i++) {
      const k = (f.t * 0.12 + i / 6) % 1
      glow(
        back,
        cx + cw * 0.23 + k * u * 0.08,
        base - ch - u * 0.07 - k * u * 0.14,
        u * (0.015 + 0.03 * k),
        '#c9d2e2',
        0.3 * (1 - k),
      )
    }
    kit.water(g, back, f, '#6f82a3', '#1a2440', 0.55)
    // The warm window on the water.
    g.fillStyle = rgba('#ffc98a', 0.25 * lit)
    g.fillRect(cx - cw * 0.26, f.horizon + 3, cw * 0.16, u * 0.12)
    // Snow over everything, near flakes larger and faster.
    for (const fl of flakes) {
      const y = (fl.y + f.t * fl.speed) % (f.H + 20)
      const x = (fl.x + Math.sin(f.t * 0.6 + fl.phase) * 14 + f.t * 4) % (f.W + 20)
      g.fillStyle = rgba('#f4f8ff', 0.55 + 0.4 * (fl.r / 3))
      g.fillRect(x - fl.r, y - fl.r, fl.r * 2, fl.r * 2)
    }
  },
})
