import { glow, hash, noise1, rgba, scene, vgrad } from '../kit'

// Contact: a wooden pier running out into the lake at dusk, its lamps just
// lit, the sun going down behind the far shore.
type State = { u: number }

export default scene<State>({
  sky: { top: '#2d2a6e', bottom: '#f69b7a', cloud: '#f9c3aa', clouds: 4, sun: 0.45 },
  paper: 0.6,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    const back = kit.layer()
    const sunX = f.cx + u * 0.3
    glow(back, sunX, f.horizon - u * 0.03, u * 0.6, '#ffb37a', 0.5)
    back.fillStyle = '#ffe9c8'
    back.beginPath()
    back.arc(sunX, f.horizon - u * 0.01, u * 0.05, Math.PI, 0)
    back.fill()
    // The far shore.
    back.beginPath()
    back.moveTo(-10, f.horizon)
    for (let x = -10; x <= f.W + 10; x += 5)
      back.lineTo(x, f.horizon - 2 - u * 0.05 * noise1(x * 0.006, 90))
    back.lineTo(f.W + 10, f.horizon)
    back.fillStyle = '#3a2e62'
    back.fill()
    kit.water(g, back, f, '#6a5c96', '#171638', 0.55)
    // The sun's path.
    for (let i = 0; i < 34; i++) {
      const d = hash(i * 2.9)
      const y = f.horizon + 3 + d * d * (f.H - f.horizon)
      const w = u * (0.02 + 0.1 * d) * (0.5 + 0.5 * Math.sin(f.t * 1.3 + i))
      g.fillStyle = rgba('#ffd9b0', 0.35 * (1 - d * 0.5))
      g.fillRect(sunX - w / 2 + Math.sin(f.t + i) * 5, y, w, 2)
    }

    // The pier, in one-point perspective toward a point just below the horizon.
    const vx = f.cx - u * 0.1
    const vy = f.horizon + 2
    const end = 0.12 // how far toward the vanishing point the pier reaches (0 is at the viewer)
    const nearL = f.cx - u * 0.62
    const nearR = f.cx + u * 0.02
    const nearY = f.H + 20
    const at = (x: number, k: number) => [x + (vx - x) * k, nearY + (vy - nearY) * k] as const
    // Deck.
    const [l1x, l1y] = at(nearL, 1 - end)
    const [r1x] = at(nearR, 1 - end)
    g.fillStyle = vgrad(g, l1y, nearY, [
      [0, '#7a5746'],
      [1, '#3b2722'],
    ])
    g.beginPath()
    g.moveTo(nearL, nearY)
    g.lineTo(nearR, nearY)
    g.lineTo(r1x, l1y)
    g.lineTo(l1x, l1y)
    g.closePath()
    g.fill()
    // Planks: gaps closer together as they recede.
    g.fillStyle = rgba('#24170f', 0.55)
    for (let i = 1; i < 40; i++) {
      const k = (1 - end) * (1 - Math.pow(1 - i / 40, 1.6))
      const [ax, ay] = at(nearL, k)
      const [bx] = at(nearR, k)
      g.fillRect(ax, ay, bx - ax, Math.max(1, 3 * (1 - k)))
    }
    // Edge beams and posts; lamps on every third post.
    for (const side of [nearL, nearR]) {
      for (let i = 0; i <= 9; i++) {
        const k = (1 - end) * (1 - Math.pow(1 - i / 9, 1.5))
        const [x, y] = at(side, k)
        const s = 1 - k
        const post = u * 0.05 * s + 2
        g.fillStyle = '#2a1b17'
        g.fillRect(x - (2 + 5 * s) / 2, y - post, 2 + 5 * s, post + u * 0.04 * s)
        if (i % 3 === 1) {
          const lamp = u * 0.2 * s + 6
          g.fillRect(x - 1, y - lamp, 2, lamp)
          const flicker = 0.85 + 0.15 * Math.sin(f.t * 3 + i * 7 + side)
          glow(g, x, y - lamp, u * 0.06 * s + 8, '#ffcf8a', 0.75 * flicker)
          g.fillStyle = '#fff1d0'
          g.fillRect(x - 2, y - lamp - 2, 4, 4)
          // Its light on the water beside the pier.
          g.fillStyle = rgba('#ffc98a', 0.22 * flicker)
          g.fillRect(x + (side === nearL ? -8 : 2) * s - 3, y + 4, 6 + 6 * s, u * 0.18 * s + 10)
        }
      }
    }
  },
})
