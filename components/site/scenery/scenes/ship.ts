import { glow, hash, rgba, scene, vgrad } from '../kit'

// ShipCrew: a tall ship under full sail at golden hour, rocking on the swell,
// with the low sun laying a path of light across the water toward it.
type State = { u: number }

export default scene<State>({
  sky: { top: '#4a74b6', bottom: '#f6c58d', cloud: '#fde4c6', clouds: 5, sun: 0.5 },
  paper: 0.55,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    const back = kit.layer()
    const sunX = f.cx + u * 0.42
    const sunY = f.horizon - u * 0.1
    glow(back, sunX, sunY, u * 0.35, '#ffd9a0', 0.55)
    back.fillStyle = rgba('#fff4d6', 0.95)
    back.beginPath()
    back.arc(sunX, sunY, u * 0.035, 0, Math.PI * 2)
    back.fill()

    // The ship, drawn around its waterline centre and rocked as a whole.
    const L = u * 0.62
    back.save()
    back.translate(f.cx - u * 0.05, f.horizon + u * 0.008 + Math.sin(f.t * 0.8) * 2)
    back.rotate(Math.sin(f.t * 0.7) * 0.025)
    // Hull, with a gold stripe along the sheer.
    back.fillStyle = vgrad(back, -u * 0.07, 0, [
      [0, '#4a3326'],
      [1, '#1e1511'],
    ])
    back.beginPath()
    back.moveTo(-L / 2, -u * 0.075)
    back.quadraticCurveTo(0, -u * 0.05, L / 2, -u * 0.085)
    back.lineTo(L * 0.42, 0)
    back.quadraticCurveTo(0, u * 0.01, -L * 0.44, 0)
    back.closePath()
    back.fill()
    back.strokeStyle = '#d2ac62'
    back.lineWidth = 2
    back.beginPath()
    back.moveTo(-L / 2 + 4, -u * 0.064)
    back.quadraticCurveTo(0, -u * 0.04, L / 2 - 4, -u * 0.074)
    back.stroke()
    // Bowsprit and jibs.
    back.strokeStyle = '#2b201a'
    back.lineWidth = 2
    back.beginPath()
    back.moveTo(L / 2, -u * 0.085)
    back.lineTo(L * 0.72, -u * 0.13)
    back.stroke()
    const sailcloth = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => {
      back.fillStyle = '#efe3c8'
      back.beginPath()
      back.moveTo(x0, y0)
      back.lineTo(x1, y1)
      back.lineTo(x2, y2)
      back.closePath()
      back.fill()
    }
    // Masts with three square sails each, catching the sun on one side.
    const masts = [
      { x: -L * 0.3, h: u * 0.46 },
      { x: 0, h: u * 0.52 },
      { x: L * 0.28, h: u * 0.44 },
    ]
    sailcloth(masts[2].x + 4, -masts[2].h * 0.95, L * 0.7, -u * 0.13, masts[2].x + 6, -u * 0.11)
    for (const m of masts) {
      back.strokeStyle = '#2b201a'
      back.lineWidth = 2.5
      back.beginPath()
      back.moveTo(m.x, -u * 0.06)
      back.lineTo(m.x, -m.h)
      back.stroke()
      for (let k = 0; k < 3; k++) {
        const top = -m.h + k * m.h * 0.28 + u * 0.02
        const bot = top + m.h * 0.25
        const wt = u * (0.1 - k * 0.012) * 0.8
        const wb = u * (0.12 - k * 0.012)
        const billow = u * 0.012
        const sail = back.createLinearGradient(m.x - wb / 2, 0, m.x + wb / 2, 0)
        sail.addColorStop(0, '#d7c6a2')
        sail.addColorStop(0.7, '#f6ecd6')
        sail.addColorStop(1, '#fff6e2')
        back.fillStyle = sail
        back.beginPath()
        back.moveTo(m.x - wt, top)
        back.lineTo(m.x + wt, top)
        back.quadraticCurveTo(m.x + wb + billow, (top + bot) / 2, m.x + wb, bot)
        back.lineTo(m.x - wb, bot)
        back.quadraticCurveTo(m.x - wb + billow, (top + bot) / 2, m.x - wt, top)
        back.fill()
      }
      back.fillStyle = '#b8423a'
      back.fillRect(m.x, -m.h - u * 0.02, u * 0.03, u * 0.014)
    }
    // A little rigging.
    back.strokeStyle = rgba('#2b201a', 0.7)
    back.lineWidth = 1
    back.beginPath()
    back.moveTo(masts[0].x, -masts[0].h)
    back.lineTo(-L / 2, -u * 0.08)
    back.moveTo(masts[2].x, -masts[2].h)
    back.lineTo(L / 2, -u * 0.09)
    back.moveTo(masts[0].x, -masts[0].h)
    back.lineTo(masts[1].x, -masts[1].h)
    back.lineTo(masts[2].x, -masts[2].h)
    back.stroke()
    back.restore()

    kit.water(g, back, f, '#4e7896', '#122a3c', 0.5)
    // The sun's path on the water.
    for (let i = 0; i < 40; i++) {
      const d = hash(i * 2.9)
      const y = f.horizon + 4 + d * d * (f.H - f.horizon)
      const w = u * (0.02 + 0.12 * d) * (0.5 + 0.5 * Math.sin(f.t * 1.5 + i))
      g.fillStyle = rgba('#fff0c8', 0.35 * (1 - d * 0.6))
      g.fillRect(sunX - w / 2 + Math.sin(f.t + i) * 6, y, w, 2)
    }
  },
})
