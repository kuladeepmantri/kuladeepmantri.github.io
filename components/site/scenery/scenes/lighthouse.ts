import { glow, hash, ridgeNoise, rgba, scene, stars, vgrad } from '../kit'

// untilithappens: a lighthouse on a headland at night, its beam turning over
// the sea, and a ship's lights far out on the horizon.
type State = { u: number; x0: number; top: number; lx: number }

export default scene<State>({
  sky: { top: '#080d20', bottom: '#2b3d5e', cloud: '#77839f', clouds: 5, sun: 0.12 },
  paper: 0.55,
  setup(s) {
    const u = s.unit
    const x0 = s.cx - u * 0.05
    const top = s.horizon - u * 0.24
    const lx = s.cx + u * 0.26
    return { u, x0, top, lx }
  },
  paint(g, f, { u, x0, top, lx }, kit) {
    stars(g, f, 90, 11, f.horizon * 0.8)
    const back = kit.layer()

    // A low far shore, and a ship's lights crossing slowly.
    back.fillStyle = '#121a2c'
    back.beginPath()
    back.moveTo(0, f.horizon)
    for (let x = 0; x <= x0; x += 6) back.lineTo(x, f.horizon - 4 - 10 * ridgeNoise(x * 0.01, 2))
    back.lineTo(x0, f.horizon)
    back.fill()
    const shipX = f.left + ((f.t * 6) % (f.span * 0.8))
    glow(back, shipX, f.horizon - 3, u * 0.015, '#ffd9a0', 0.9)
    glow(back, shipX + 9, f.horizon - 3, u * 0.01, '#ff6b5a', 0.8)

    // The headland: a cliff rising from the water, grass on top.
    const edge = (x: number) => top + u * 0.03 * ridgeNoise(x * 0.02, 5)
    back.beginPath()
    back.moveTo(x0, f.horizon)
    back.bezierCurveTo(
      x0 + u * 0.08,
      f.horizon - u * 0.02,
      x0 + u * 0.1,
      top + u * 0.05,
      x0 + u * 0.16,
      edge(x0 + u * 0.16),
    )
    for (let x = x0 + u * 0.16; x <= f.W + 8; x += 6) back.lineTo(x, edge(x))
    back.lineTo(f.W + 8, f.horizon)
    back.closePath()
    back.fillStyle = vgrad(back, top, f.horizon, [
      [0, '#2f3e3a'],
      [0.12, '#242d3d'],
      [1, '#0f141e'],
    ])
    back.fill()

    // The tower: tapered, in red and white bands, with a gallery and a lit lantern room.
    const H = u * 0.42
    const base = edge(lx) + 2
    const wb = u * 0.085
    const wt = u * 0.055
    const bands = 5
    for (let k = 0; k < bands; k++) {
      const y0 = base - (H * k) / bands
      const y1 = base - (H * (k + 1)) / bands
      const w0 = wb + (wt - wb) * (k / bands)
      const w1 = wb + (wt - wb) * ((k + 1) / bands)
      back.fillStyle = k % 2 ? '#b8423a' : '#ece6da'
      back.beginPath()
      back.moveTo(lx - w0 / 2, y0)
      back.lineTo(lx + w0 / 2, y0)
      back.lineTo(lx + w1 / 2, y1)
      back.lineTo(lx - w1 / 2, y1)
      back.closePath()
      back.fill()
    }
    // Shade the side away from the beam.
    back.fillStyle = rgba('#000000', 0.22)
    back.beginPath()
    back.moveTo(lx + wb * 0.1, base)
    back.lineTo(lx + wb / 2, base)
    back.lineTo(lx + wt / 2, base - H)
    back.lineTo(lx + wt * 0.1, base - H)
    back.fill()
    const gy = base - H
    back.fillStyle = '#1d2230'
    back.fillRect(lx - wt * 0.75, gy - 3, wt * 1.5, 4)
    const lamp = gy - u * 0.03
    back.fillStyle = '#fff2c4'
    back.fillRect(lx - wt * 0.38, lamp, wt * 0.76, u * 0.028)
    back.fillStyle = '#6e2622'
    back.beginPath()
    back.moveTo(lx - wt * 0.48, lamp)
    back.quadraticCurveTo(lx, lamp - u * 0.035, lx + wt * 0.48, lamp)
    back.fill()

    // The beam turns: it reaches far when it points across, and flashes when it faces us.
    const ly2 = lamp + u * 0.014
    const theta = f.t * 0.55
    for (const off of [0, Math.PI]) {
      const c = Math.cos(theta + off)
      const facing = Math.max(0, Math.sin(theta + off))
      const L = Math.abs(c) * u * 1.6 + u * 0.05
      const dir = c < 0 ? -1 : 1
      const spread = u * 0.03 + u * 0.05 * facing
      const gr = back.createLinearGradient(lx, ly2, lx + dir * L, ly2)
      gr.addColorStop(0, rgba('#fff4cf', 0.55))
      gr.addColorStop(1, rgba('#fff4cf', 0))
      back.fillStyle = gr
      back.beginPath()
      back.moveTo(lx, ly2 - 3)
      back.lineTo(lx + dir * L, ly2 - spread + u * 0.02)
      back.lineTo(lx + dir * L, ly2 + spread + u * 0.04)
      back.lineTo(lx, ly2 + 3)
      back.closePath()
      back.fill()
      glow(back, lx, ly2, u * (0.04 + 0.2 * facing ** 6), '#fff6d8', 0.7 + 0.3 * facing)
    }

    // Surf where the cliff meets the sea.
    for (let i = 0; i < 26; i++) {
      const x = x0 + u * 0.02 + hash(i * 3.3) * (f.W - x0)
      const k = (f.t * 0.6 + hash(i)) % 1
      back.fillStyle = rgba('#ffffff', 0.5 * (1 - k))
      back.fillRect(x + k * 8, f.horizon - 3 - k * 4, 6 + hash(i * 2) * 10, 2)
    }

    kit.water(g, back, f, '#1e3d5a', '#060f1d', 0.5)
  },
})
