import { glow, hash, noise1, rgba, scene, vgrad } from '../kit'

// Rune: a causeway road running straight across the lake into the sunset.
// The centre line streams toward you as if you are driving it, and one car's
// tail lights hold steady ahead.
type State = { u: number }

export default scene<State>({
  sky: { top: '#2a3e80', bottom: '#f6a46c', cloud: '#fbcfae', clouds: 4, sun: 0.55 },
  paper: 0.6,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    const back = kit.layer()
    const vx = f.cx + u * 0.04
    const vy = f.horizon + 1
    glow(back, vx, f.horizon - u * 0.04, u * 0.75, '#ffb676', 0.5)
    back.fillStyle = '#fff0cf'
    back.beginPath()
    back.arc(vx, f.horizon - u * 0.015, u * 0.06, Math.PI, 0)
    back.fill()
    // Low hills on both far shores.
    back.beginPath()
    back.moveTo(-10, f.horizon)
    for (let x = -10; x <= f.W + 10; x += 5) {
      const gapNearRoad = Math.min(1, Math.abs(x - vx) / (u * 0.25))
      back.lineTo(x, f.horizon - 2 - u * 0.07 * noise1(x * 0.005, 95) * gapNearRoad)
    }
    back.lineTo(f.W + 10, f.horizon)
    back.fillStyle = '#4a3a6c'
    back.fill()
    kit.water(g, back, f, '#9a6f8e', '#1c1c42', 0.55)
    for (let i = 0; i < 40; i++) {
      const d = hash(i * 2.3)
      const y = f.horizon + 3 + d * d * (f.H - f.horizon)
      const w = u * (0.02 + 0.12 * d) * (0.5 + 0.5 * Math.sin(f.t * 1.3 + i))
      g.fillStyle = rgba('#ffd9a8', 0.3 * (1 - d * 0.5))
      g.fillRect(vx + u * 0.3 * d + Math.sin(f.t + i) * 5 - w / 2, y, w, 2)
    }

    // The road in perspective. A point at distance z (1 is the near edge of the
    // screen) sits at vy + (nearY - vy) / z, and its width shrinks as 1 / z.
    const nearY = f.H + 30
    const half = u * 0.55
    const proj = (z: number) => vy + (nearY - vy) / z
    g.fillStyle = vgrad(g, vy, nearY, [
      [0, '#9c7486'],
      [0.25, '#5a4760'],
      [1, '#2a2436'],
    ])
    g.beginPath()
    g.moveTo(vx - half, nearY)
    g.lineTo(vx + half, nearY)
    g.lineTo(vx + 1, vy)
    g.lineTo(vx - 1, vy)
    g.closePath()
    g.fill()
    // Edge lines.
    g.strokeStyle = rgba('#f4e6d8', 0.75)
    g.lineWidth = 1.5
    for (const side of [-1, 1]) {
      g.beginPath()
      g.moveTo(vx + side * half * 0.92, nearY)
      g.lineTo(vx + side * 1, vy)
      g.stroke()
    }
    // Centre dashes streaming toward the viewer.
    const spacing = 1.2
    const offset = f.reduce ? 0 : (f.t * 0.9) % spacing
    for (let n = 0; n < 40; n++) {
      const z0 = 1 + n * spacing - offset
      const z1 = z0 + spacing * 0.5
      if (z0 < 1) continue
      const y0 = proj(z0)
      const y1 = proj(z1)
      const w0 = (half * 0.035) / z0
      const w1 = (half * 0.035) / z1
      g.fillStyle = rgba('#ffe6b0', Math.min(0.95, 0.35 + 1.2 / z0))
      g.beginPath()
      g.moveTo(vx - w0, y0)
      g.lineTo(vx + w0, y0)
      g.lineTo(vx + w1, y1)
      g.lineTo(vx - w1, y1)
      g.closePath()
      g.fill()
    }
    // Posts along the edges, each with a small reflector catching the light.
    for (let n = 0; n < 24; n++) {
      const z = 1 + n * 1.6 - (f.reduce ? 0 : (f.t * 0.9) % 1.6)
      if (z < 1) continue
      const y = proj(z)
      const s = 1 / z
      for (const side of [-1, 1]) {
        const x = vx + side * (half * 1.02) * s
        const h = u * 0.06 * s + 1
        g.fillStyle = '#2b2233'
        g.fillRect(x - Math.max(1, 3 * s), y - h, Math.max(1, 6 * s), h)
        g.fillStyle = rgba(side < 0 ? '#ffdca0' : '#ff7a5a', 0.9)
        g.fillRect(x - Math.max(0.7, 2 * s), y - h, Math.max(1.4, 4 * s), Math.max(1, 3 * s))
      }
    }
    // A car ahead: two tail lights, far down the road.
    const zc = 9 + Math.sin(f.t * 0.2) * 1.5
    const yc = proj(zc)
    const sc = 1 / zc
    const cx = vx + half * 0.3 * sc
    for (const side of [-1, 1])
      glow(g, cx + side * half * 0.1 * sc, yc - 3, u * 0.025, '#ff4a3a', 0.9)
  },
})
