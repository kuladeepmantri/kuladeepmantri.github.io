import { noise1, pines, rgba, scene, stars, vgrad } from '../kit'

// GitHub: the northern lights over a still lake. Curtains of green and violet
// hang from the sky and ripple slowly; a pine forest lines the far shore and
// the water holds the whole display.
type State = { u: number }

export default scene<State>({
  sky: { top: '#040a1a', bottom: '#0d2a38', cloud: '#26394d', clouds: 2, sun: 0.02 },
  paper: 0.55,
  setup: (s) => ({ u: s.unit }),
  paint(g, f, { u }, kit) {
    stars(g, f, 120, 41, f.horizon * 0.95)
    const back = kit.layer()
    const t = f.t
    // Three curtains at different heights; each is a row of hanging rays.
    const curtains = [
      { top: 0.62, len: 0.3, freq: 0.0035, speed: 0.05, seed: 1, hi: '#b98cff', mid: '#5dffb4' },
      { top: 0.5, len: 0.26, freq: 0.005, speed: -0.07, seed: 2, hi: '#8fe8ff', mid: '#43f0a0' },
      { top: 0.4, len: 0.2, freq: 0.007, speed: 0.09, seed: 3, hi: '#ff9ad8', mid: '#7affc4' },
    ]
    for (const c of curtains) {
      for (let x = -10; x <= f.W + 10; x += 3) {
        const wave = Math.sin(x * c.freq + t * c.speed * 4 + c.seed) * u * 0.07
        const y0 = f.horizon - u * c.top + wave
        const k = noise1(x * 0.008 + t * c.speed + c.seed * 10, c.seed)
        const bright = Math.max(0, k * 1.5 - 0.35)
        if (bright < 0.03) continue
        const len = u * c.len * (0.55 + 0.6 * noise1(x * 0.02 - t * 0.2, c.seed + 5))
        const gr = back.createLinearGradient(0, y0, 0, y0 + len)
        gr.addColorStop(0, rgba(c.hi, 0))
        gr.addColorStop(0.25, rgba(c.hi, 0.35 * bright))
        gr.addColorStop(0.55, rgba(c.mid, 0.6 * bright))
        gr.addColorStop(1, rgba(c.mid, 0))
        back.fillStyle = gr
        back.fillRect(x, y0, 3, len)
      }
    }
    // A soft green glow over the horizon under the lights.
    back.fillStyle = vgrad(back, f.horizon - u * 0.3, f.horizon, [
      [0, rgba('#3cffa8', 0)],
      [1, rgba('#3cffa8', 0.14)],
    ])
    back.fillRect(0, f.horizon - u * 0.3, f.W, u * 0.3)
    pines(back, -10, f.W + 10, f.horizon, u * 0.1, 11, '#061219')
    pines(back, f.W - u * 0.28, f.W + 10, f.horizon, u * 0.26, 13, '#040c11')
    kit.water(g, back, f, '#10344a', '#02070e', 0.65)
  },
})
