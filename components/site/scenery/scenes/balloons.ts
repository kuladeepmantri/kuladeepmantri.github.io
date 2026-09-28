import { glow, hash, noise1, rgba, scene } from '../kit'

// Kintsugi: hot-air balloons rising over a lake at dawn, each in its own
// colours, drifting up slowly on the still morning air.
type Balloon = {
  x: number
  y: number
  s: number
  a: string
  b: string
  phase: number
  rise: number
}
type State = { u: number; balloons: Balloon[] }

const PAIRS: [string, string][] = [
  ['#e8574a', '#f7c85e'],
  ['#3f7fd6', '#f4f1ea'],
  ['#7a5ad1', '#f5a3c7'],
  ['#2fa37f', '#f6d86b'],
  ['#e36a3c', '#3c4f9c'],
  ['#d94a6a', '#f4efe6'],
  ['#f0a23a', '#6b4fb8'],
]

function balloon(g: CanvasRenderingContext2D, b: Balloon, x: number, y: number, t: number) {
  const s = b.s
  const env = new Path2D()
  env.moveTo(x, y - s * 0.62)
  env.bezierCurveTo(
    x + s * 0.62,
    y - s * 0.62,
    x + s * 0.6,
    y + s * 0.05,
    x + s * 0.14,
    y + s * 0.42,
  )
  env.lineTo(x - s * 0.14, y + s * 0.42)
  env.bezierCurveTo(x - s * 0.6, y + s * 0.05, x - s * 0.62, y - s * 0.62, x, y - s * 0.62)
  g.save()
  g.clip(env)
  // Gores: vertical panels in two colours, narrowing toward the sides.
  const gores = 8
  for (let i = 0; i < gores; i++) {
    const k0 = i / gores
    const k1 = (i + 1) / gores
    const x0 = x + Math.sin((k0 - 0.5) * Math.PI) * s * 0.62
    const x1 = x + Math.sin((k1 - 0.5) * Math.PI) * s * 0.62
    g.fillStyle = i % 2 ? b.a : b.b
    g.fillRect(x0, y - s * 0.7, x1 - x0 + 0.5, s * 1.2)
  }
  // Light from the low sun on the left; shade on the right.
  const shade = g.createLinearGradient(x - s * 0.6, 0, x + s * 0.6, 0)
  shade.addColorStop(0, rgba('#fff4dc', 0.35))
  shade.addColorStop(0.45, rgba('#fff4dc', 0))
  shade.addColorStop(1, rgba('#1e1640', 0.4))
  g.fillStyle = shade
  g.fillRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.2)
  g.restore()
  // Ropes and basket, and a burst from the burner now and then.
  g.strokeStyle = rgba('#3b2a22', 0.8)
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(x - s * 0.13, y + s * 0.42)
  g.lineTo(x - s * 0.07, y + s * 0.58)
  g.moveTo(x + s * 0.13, y + s * 0.42)
  g.lineTo(x + s * 0.07, y + s * 0.58)
  g.stroke()
  g.fillStyle = '#6b4a32'
  g.fillRect(x - s * 0.08, y + s * 0.58, s * 0.16, s * 0.1)
  if (Math.sin(t * 0.9 + b.phase * 5) > 0.93) glow(g, x, y + s * 0.44, s * 0.14, '#ffb45a', 0.9)
}

export default scene<State>({
  sky: { top: '#6c8bcc', bottom: '#ffd8b2', cloud: '#fff1e2', clouds: 5, sun: 0.5 },
  paper: 0.55,
  setup(s) {
    const n = s.span > 800 ? 7 : s.span > 520 ? 5 : 4
    const balloons = Array.from({ length: n }, (_, i) => {
      const z = hash(i * 4.3 + 1)
      return {
        x: s.left + s.span * (0.12 + 0.76 * ((i + 0.5 * hash(i * 2.2)) / n)),
        y: s.horizon - s.unit * (0.2 + 0.42 * hash(i * 6.1)),
        s: s.unit * (0.1 + 0.15 * z),
        a: PAIRS[i % PAIRS.length][0],
        b: PAIRS[i % PAIRS.length][1],
        phase: hash(i * 9.7),
        rise: 2 + 4 * z,
      }
    })
    // Smaller, farther balloons behind the nearer ones.
    return { u: s.unit, balloons: balloons.sort((a, b) => a.s - b.s) }
  },
  paint(g, f, { u, balloons }, kit) {
    const back = kit.layer()
    glow(back, f.cx - u * 0.45, f.horizon - u * 0.05, u * 0.7, '#ffd29a', 0.5)
    for (const [amp, colour, seed] of [
      [0.14, '#aab4d4', 81],
      [0.08, '#8793c1', 82],
    ] as const) {
      back.beginPath()
      back.moveTo(-10, f.horizon)
      for (let x = -10; x <= f.W + 10; x += 5)
        back.lineTo(x, f.horizon - 2 - u * amp * noise1(x * 0.004, seed))
      back.lineTo(f.W + 10, f.horizon)
      back.fillStyle = colour
      back.fill()
    }
    for (const b of balloons) {
      // Each drifts up and sways a little, on its own slow cycle.
      const drift = Math.sin(f.t * 0.05 + b.phase * 6.28) * u * 0.04 * (b.rise / 4)
      const sway = Math.sin(f.t * 0.12 + b.phase * 9) * 12
      balloon(back, b, b.x + sway, b.y - drift, f.t)
    }
    kit.water(g, back, f, '#bcaacb', '#3f4f80', 0.58)
  },
})
