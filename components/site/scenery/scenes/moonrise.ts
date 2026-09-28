import { glow, hash, noise1, rgba, scene, stars } from '../kit'

// X: a large moon rising over a calm sea, thin cloud drifting across it, a
// few birds passing, and the moon's path lying across the water.
type State = { u: number }

export default scene<State>({
  sky: { top: '#0b1537', bottom: '#3c3f7c', cloud: '#7a7cad', clouds: 4, sun: 0.04 },
  paper: 0.6,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    stars(g, f, 90, 61, f.horizon * 0.9)
    const back = kit.layer()
    const mx = f.cx + u * 0.04
    const my = f.horizon - u * 0.24
    const r = u * 0.2
    glow(back, mx, my, u * 0.9, '#ffe3b4', 0.28)
    glow(back, mx, my, r * 1.5, '#fff0d4', 0.45)
    // The disc, with soft darker seas on its face.
    back.save()
    back.beginPath()
    back.arc(mx, my, r, 0, Math.PI * 2)
    back.clip()
    const face = back.createRadialGradient(mx - r * 0.3, my - r * 0.3, 0, mx, my, r)
    face.addColorStop(0, '#fff8e6')
    face.addColorStop(1, '#f1d7a4')
    back.fillStyle = face
    back.fillRect(mx - r, my - r, r * 2, r * 2)
    for (const [dx, dy, s] of [
      [-0.3, -0.2, 0.32],
      [0.15, -0.35, 0.22],
      [0.25, 0.1, 0.3],
      [-0.1, 0.35, 0.2],
    ])
      glow(back, mx + dx * r, my + dy * r, s * r * 1.4, '#c9a878', 0.35)
    back.restore()
    // Thin cloud drifting across the moon.
    for (let i = 0; i < 3; i++) {
      const x = ((f.t * (7 + i * 3) + hash(i) * f.W * 1.5) % (f.W * 1.5)) - f.W * 0.25
      const y = my + (i - 1) * r * 0.55
      const w = u * (0.35 + 0.2 * hash(i * 3))
      const gr = back.createLinearGradient(0, y - 6, 0, y + 6)
      gr.addColorStop(0, rgba('#2b2f5e', 0))
      gr.addColorStop(0.5, rgba('#2b2f5e', 0.5))
      gr.addColorStop(1, rgba('#2b2f5e', 0))
      back.fillStyle = gr
      back.fillRect(x - w / 2, y - 6, w, 12)
    }
    // Low islands on the horizon, left and right.
    for (const [x0, x1, h, seed] of [
      [f.left - u * 0.1, f.left + u * 0.35, u * 0.05, 1],
      [f.W - u * 0.45, f.W + 20, u * 0.07, 2],
    ]) {
      back.fillStyle = '#12173a'
      back.beginPath()
      back.moveTo(x0, f.horizon)
      for (let x = x0; x <= x1; x += 4) {
        const k = (x - x0) / (x1 - x0)
        back.lineTo(
          x,
          f.horizon - h * Math.sin(k * Math.PI) ** 0.7 * (0.7 + 0.3 * noise1(x * 0.03, seed)),
        )
      }
      back.lineTo(x1, f.horizon)
      back.fill()
    }
    // Birds crossing in front of the moon.
    for (let i = 0; i < 5; i++) {
      const x = ((f.t * 14 + i * 26 + hash(i) * 30) % (f.W + 200)) - 100
      const y = my - r * 0.4 + i * 9 + Math.sin(f.t * 3 + i) * 2
      const flap = Math.sin(f.t * 8 + i) > 0 ? 1.5 : 0
      back.fillStyle = rgba('#141838', 0.9)
      back.fillRect(x - 4, y - flap, 4, 1.6)
      back.fillRect(x, y - 1.5 + flap, 4, 1.6)
    }
    kit.water(g, back, f, '#2b3672', '#070b22', 0.6)
    // The moon's path on the water.
    for (let i = 0; i < 46; i++) {
      const d = hash(i * 2.1)
      const y = f.horizon + 3 + d * d * (f.H - f.horizon)
      const w = u * (0.02 + 0.13 * d) * (0.5 + 0.5 * Math.sin(f.t * 1.2 + i))
      g.fillStyle = rgba('#fff0cc', 0.45 * (1 - d * 0.5))
      g.fillRect(mx - w / 2 + Math.sin(f.t * 0.8 + i) * 5, y, w, 2)
    }
  },
})
