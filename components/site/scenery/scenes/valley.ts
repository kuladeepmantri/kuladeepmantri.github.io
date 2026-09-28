import { glow, hash, rgba, scene, vgrad } from '../kit'

// About: a valley at sunset in clean, layered shapes. One snow-capped peak,
// lit on one face and shaded on the other, then ridges of forest stepping
// toward the lake, each one darker and nearer.
type State = { u: number }

/** A smooth ridgeline from two sine waves, so the layers read as clean shapes. */
const crest = (x: number, base: number, amp: number, f1: number, f2: number, ph: number) =>
  base - amp * (0.55 + 0.3 * Math.sin(x * f1 + ph) + 0.15 * Math.sin(x * f2 + ph * 2.3))

function forest(
  g: CanvasRenderingContext2D,
  f: { W: number; horizon: number },
  base: number,
  amp: number,
  f1: number,
  f2: number,
  ph: number,
  tree: number,
  fill: string,
) {
  g.fillStyle = fill
  g.beginPath()
  g.moveTo(-10, f.horizon)
  for (let x = -10; x <= f.W + 10; x += 4) g.lineTo(x, crest(x, base, amp, f1, f2, ph))
  g.lineTo(f.W + 10, f.horizon)
  g.closePath()
  g.fill()
  // Pines standing along the crest.
  for (let x = -10; x < f.W + 10; ) {
    const h = tree * (0.55 + 0.45 * hash(x * 0.61 + ph))
    const y = crest(x, base, amp, f1, f2, ph) + 2
    g.beginPath()
    g.moveTo(x, y - h)
    g.lineTo(x + h * 0.2, y)
    g.lineTo(x - h * 0.2, y)
    g.closePath()
    g.fill()
    x += h * (0.22 + 0.2 * hash(x * 1.7 + ph))
  }
}

export default scene<State>({
  sky: { top: '#2b3f78', bottom: '#f7a86b', cloud: '#ffd3b0', clouds: 3, sun: 0.5 },
  paper: 0.62,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    const back = kit.layer()
    const sunX = f.cx + u * 0.42
    const sunY = f.horizon - u * 0.2
    glow(back, sunX, sunY, u * 0.7, '#ffc38a', 0.45)
    glow(back, sunX, sunY, u * 0.14, '#fff0d0', 0.9)

    // The peak: two faces meeting at a clean ridge.
    const px = f.cx - u * 0.05
    const py = f.horizon - u * 0.64
    const lx = f.cx - u * 0.75
    const rx = f.cx + u * 0.72
    const foot = f.horizon - u * 0.14
    const ridgeX = f.cx - u * 0.12
    back.fillStyle = vgrad(back, py, foot, [
      [0, '#f6b49a'],
      [1, '#9c6c93'],
    ])
    back.beginPath()
    back.moveTo(lx, foot)
    back.quadraticCurveTo(px - u * 0.28, py + u * 0.22, px, py)
    back.quadraticCurveTo(px + u * 0.3, py + u * 0.26, rx, foot)
    back.closePath()
    back.fill()
    // Snow, with a stepped lower edge.
    const snow = new Path2D()
    snow.moveTo(px, py)
    const steps = [
      [-0.14, 0.13],
      [-0.1, 0.1],
      [-0.06, 0.15],
      [-0.01, 0.11],
      [0.04, 0.16],
      [0.09, 0.12],
      [0.15, 0.15],
    ]
    snow.lineTo(px - u * 0.15, py + u * 0.12)
    for (const [dx, dy] of steps) snow.lineTo(px + u * dx, py + u * dy)
    snow.lineTo(px + u * 0.17, py + u * 0.13)
    snow.closePath()
    back.fillStyle = '#ffe6d8'
    back.fill(snow)
    // The shaded face, left of the ridge.
    back.fillStyle = rgba('#3b2d6e', 0.42)
    back.beginPath()
    back.moveTo(px, py)
    back.quadraticCurveTo(ridgeX + u * 0.02, py + u * 0.3, ridgeX - u * 0.06, foot)
    back.lineTo(lx, foot)
    back.quadraticCurveTo(px - u * 0.28, py + u * 0.22, px, py)
    back.fill()

    // Haze, then ridges of forest from far to near.
    back.fillStyle = vgrad(back, f.horizon - u * 0.3, f.horizon, [
      [0, rgba('#ffb98f', 0)],
      [1, rgba('#ffb98f', 0.4)],
    ])
    back.fillRect(0, f.horizon - u * 0.3, f.W, u * 0.3)
    forest(back, f, f.horizon - u * 0.1, u * 0.12, 0.004, 0.011, 1, u * 0.035, '#b3698a')
    forest(back, f, f.horizon - u * 0.05, u * 0.12, 0.005, 0.013, 4, u * 0.045, '#834d7e')
    forest(back, f, f.horizon - u * 0.01, u * 0.1, 0.006, 0.017, 7, u * 0.06, '#5b3a6d')
    forest(back, f, f.horizon + u * 0.01, u * 0.07, 0.008, 0.02, 11, u * 0.08, '#352450')

    for (let i = 0; i < 4; i++) {
      const x = ((f.t * (10 + i * 3) + hash(i) * f.W) % (f.W + 60)) - 30
      const y = f.horizon - u * (0.5 + 0.1 * hash(i * 3)) + Math.sin(f.t * 2 + i) * 2
      back.fillStyle = rgba('#2d2448', 0.85)
      back.fillRect(x - 3, y, 3, 1.5)
      back.fillRect(x, y - 1, 3, 1.5)
    }
    kit.water(g, back, f, '#b77f98', '#2a1f48', 0.6)
  },
})
