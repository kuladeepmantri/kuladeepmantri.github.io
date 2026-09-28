import { glow, hash, rgba, ridgeNoise, scene, vgrad } from '../kit'

// EvalCore: a regatta on a bright day. The fleet sails the same course again
// and again, and every boat is timed at the line, so you see the moment one
// falls behind. Evals do that to an AI app after every change: same cases, a
// fresh run, compared with the baseline. The committee boat snaps each boat as
// it crosses the finish.
const FLEET = [
  { sail: '#ff5a4e', band: '#ffd7cf', speed: 1, size: 1 },
  { sail: '#ffc233', band: '#fff1c2', speed: 0.93, size: 0.9 },
  { sail: '#ff4fa3', band: '#ffe0ef', speed: 1.06, size: 0.95 },
  { sail: '#18b7a8', band: '#c9f4ee', speed: 0.97, size: 0.86 },
  { sail: '#7b61ff', band: '#e3dcff', speed: 1.02, size: 0.92 },
]

type Boat = (typeof FLEET)[number] & { start: number }
type State = { u: number; boats: Boat[]; lineX: number; loop: number; x0: number }

function drawBoat(g: CanvasRenderingContext2D, x: number, y: number, h: number, b: Boat, t: number) {
  const L = h * 0.78 // hull length
  const roll = Math.sin(t * 1.3 + b.start) * 0.035
  g.save()
  g.translate(x, y)
  g.rotate(roll)
  const mast = -L * 0.08

  // Mainsail: a clean white triangle aft of the mast, shaded toward the leech.
  const main = g.createLinearGradient(mast - L * 0.45, 0, mast, 0)
  main.addColorStop(0, '#dfe5ee')
  main.addColorStop(1, '#ffffff')
  g.fillStyle = main
  g.beginPath()
  g.moveTo(mast, -h)
  g.lineTo(mast - L * 0.44, -L * 0.2)
  g.lineTo(mast, -L * 0.17)
  g.closePath()
  g.fill()

  // Spinnaker: a full round sail flown ahead of the mast, with a light band.
  const spin = new Path2D()
  spin.moveTo(mast + 2, -h * 0.97)
  spin.bezierCurveTo(L * 0.78, -h * 0.88, L * 0.72, -L * 0.3, L * 0.46, -L * 0.2)
  spin.lineTo(mast + 3, -L * 0.24)
  spin.closePath()
  g.fillStyle = b.sail
  g.fill(spin)
  g.save()
  g.clip(spin)
  g.fillStyle = b.band
  g.fillRect(mast, -h * 0.62, L, h * 0.13)
  g.fillStyle = rgba('#ffffff', 0.18)
  g.fillRect(mast, -h, L * 0.22, h)
  g.fillStyle = rgba('#000000', 0.16)
  g.fillRect(L * 0.44, -h, L, h)
  g.restore()

  // Mast and hull: white topsides over a navy boot stripe.
  g.fillStyle = '#3a4252'
  g.fillRect(mast - 1, -h, 2, h - L * 0.12)
  g.beginPath()
  g.moveTo(-L * 0.5, -L * 0.14)
  g.lineTo(L * 0.52, -L * 0.17)
  g.quadraticCurveTo(L * 0.44, 0, L * 0.3, 0)
  g.lineTo(-L * 0.44, 0)
  g.closePath()
  g.fillStyle = '#f6f7fa'
  g.fill()
  g.fillStyle = '#1f3a6b'
  g.fillRect(-L * 0.45, -L * 0.035, L * 0.86, L * 0.035)
  g.restore()
}

export default scene<State>({
  sky: { top: '#2f7fe0', bottom: '#cfe8f7', cloud: '#ffffff', clouds: 4, sun: 0.3 },
  paper: 0,
  setup(s) {
    const u = s.unit
    // Fewer boats on narrow stages; the first ones in FLEET matter most.
    const n = s.span > 900 ? 5 : s.span > 560 ? 4 : 3
    const loop = s.span + u * 0.9
    const boats = FLEET.slice(0, n).map((b, i) => ({ ...b, start: (i / n) * loop + hash(i) * u * 0.1 }))
    return { u, boats, lineX: s.left + s.span * 0.66, loop, x0: s.left - u * 0.45 }
  },
  paint(g, f, { u, boats, lineX, loop, x0 }, kit) {
    const back = kit.layer()
    const y = f.horizon

    // Far hills, soft and blue with distance, then a green shore with the club.
    back.fillStyle = '#8fb3d6'
    back.beginPath()
    back.moveTo(0, y)
    for (let x = 0; x <= f.W + 6; x += 6) back.lineTo(x, y - u * 0.1 - u * 0.07 * ridgeNoise(x * 0.004, 9))
    back.lineTo(f.W + 6, y)
    back.fill()
    back.fillStyle = vgrad(back, y - u * 0.05, y, [
      [0, '#4f9a6f'],
      [1, '#2f6f52'],
    ])
    back.beginPath()
    back.moveTo(0, y)
    for (let x = 0; x <= f.W + 6; x += 6) back.lineTo(x, y - u * 0.025 - u * 0.02 * ridgeNoise(x * 0.01, 3))
    back.lineTo(f.W + 6, y)
    back.fill()
    const cx = f.left + f.span * 0.2
    back.fillStyle = '#fbfaf6'
    back.fillRect(cx, y - u * 0.075, u * 0.13, u * 0.055)
    back.fillStyle = '#d2503f'
    back.beginPath()
    back.moveTo(cx - u * 0.01, y - u * 0.075)
    back.lineTo(cx + u * 0.065, y - u * 0.11)
    back.lineTo(cx + u * 0.14, y - u * 0.075)
    back.fill()

    // The finish line: an orange buoy, and the committee boat flying its flag.
    back.fillStyle = '#ff7a1a'
    back.fillRect(lineX - u * 0.012, y - u * 0.03, u * 0.024, u * 0.03)
    const cb = lineX + u * 0.2
    back.fillStyle = '#f6f7fa'
    back.fillRect(cb - u * 0.07, y - u * 0.035, u * 0.14, u * 0.035)
    back.fillStyle = '#1f3a6b'
    back.fillRect(cb - u * 0.035, y - u * 0.06, u * 0.06, u * 0.025)
    back.fillStyle = '#3a4252'
    back.fillRect(cb + u * 0.04, y - u * 0.16, 2, u * 0.125)
    const wave = Math.sin(f.t * 3) * u * 0.006
    back.fillStyle = '#2a5bd7'
    back.beginPath()
    back.moveTo(cb + u * 0.04 + 2, y - u * 0.16)
    back.lineTo(cb + u * 0.11, y - u * 0.145 + wave)
    back.lineTo(cb + u * 0.04 + 2, y - u * 0.125)
    back.fill()

    // The fleet, each boat at its own pace, looping the course.
    let flash = 0
    for (const b of boats) {
      const x = x0 + ((b.start + f.t * u * 0.06 * b.speed) % loop)
      const bow = x + u * 0.12 * b.size
      if (bow > lineX && bow - lineX < u * 0.03) flash = Math.max(flash, 1 - (bow - lineX) / (u * 0.03))
      drawBoat(back, x, y + 1, u * 0.34 * b.size, b, f.t)
    }
    // A camera flash from the committee boat as a boat crosses: its snapshot.
    if (flash > 0) glow(back, cb - u * 0.01, y - u * 0.05, u * 0.08, '#ffffff', 0.8 * flash)

    kit.water(g, back, f, '#2bb3c0', '#0b6b8a', 0.45)
  },
})
