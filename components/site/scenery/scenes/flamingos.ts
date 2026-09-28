import { reflectImage, scene } from '../kit'

// Home: a flock of flamingos wading in a bright lake. Most important bird
// first, so narrow screens keep the centre of the flock and drop the edges.
const FLOCK = [
  { at: 0, size: 0.29, depth: 0.07, mirror: false, phase: 3 },
  { at: -1, size: 0.24, depth: 0.034, mirror: false, phase: 2 },
  { at: 1.05, size: 0.25, depth: 0.042, mirror: true, phase: 4 },
  { at: -1.95, size: 0.19, depth: 0.012, mirror: true, phase: 1 },
  { at: 2, size: 0.2, depth: 0.018, mirror: false, phase: 5 },
]

type Bird = { x: number; tall: number; foot: number; mirror: boolean; phase: number }

// Sprites come in a few sizes and drawImage scales them the rest of the way,
// so a pane sliding open does not rebuild them on every frame.
const SIZES = [48, 64, 96, 128, 192, 256, 384, 512]
const spritePx = (want: number) => SIZES.find((s) => s >= want) ?? 512

// For systems without the flamingo emoji: a flamingo drawn in code, facing
// left like the emoji, standing on one leg.
let drawn: HTMLCanvasElement | null = null
function drawnFlamingo() {
  if (drawn) return drawn
  const c = document.createElement('canvas')
  c.width = 200
  c.height = 300
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return c
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.strokeStyle = '#e46f93'
  g.lineWidth = 5
  g.beginPath()
  g.moveTo(116, 190)
  g.lineTo(116, 296)
  g.moveTo(122, 188)
  g.lineTo(138, 232)
  g.lineTo(118, 250)
  g.stroke()
  g.fillStyle = '#f47fa5'
  g.beginPath()
  g.ellipse(124, 165, 64, 34, -0.22, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#e05a86'
  g.beginPath()
  g.ellipse(140, 160, 40, 20, -0.3, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#f47fa5'
  g.lineWidth = 13
  g.beginPath()
  g.moveTo(74, 156)
  g.bezierCurveTo(36, 120, 104, 86, 72, 44)
  g.stroke()
  g.fillStyle = '#f47fa5'
  g.beginPath()
  g.arc(64, 36, 15, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#f6e3d6'
  g.lineWidth = 8
  g.beginPath()
  g.moveTo(52, 34)
  g.quadraticCurveTo(36, 38, 38, 60)
  g.stroke()
  g.strokeStyle = '#2b1a1f'
  g.beginPath()
  g.moveTo(38, 52)
  g.lineTo(39, 62)
  g.stroke()
  drawn = c
  return c
}

export default scene<{ birds: Bird[] }>({
  sky: { top: '#3b7fd6', bottom: '#eccad2', cloud: '#fdfaf3', clouds: 6, sun: 0.28 },
  paper: 0,
  setup(s) {
    // Size the birds from the height, but never wider than the open area allows.
    const scale = Math.max(0.55, Math.min(1, s.span / (s.H * 1.1)))
    const wide = 0.29 * s.H * scale * 0.72 // width of the largest bird
    const gap = Math.max(Math.min(s.span * 0.17, s.H * 0.2), wide * 0.88)
    // As many birds as fit without crowding, most important first.
    let n = FLOCK.length
    const extent = (k: number) => {
      const at = FLOCK.slice(0, k).map((b) => b.at)
      return (Math.max(...at) - Math.min(...at)) * gap + wide
    }
    while (n > 1 && extent(n) > s.span * 0.92) n--
    const chosen = FLOCK.slice(0, n)
    const mid = (Math.max(...chosen.map((b) => b.at)) + Math.min(...chosen.map((b) => b.at))) / 2
    const birds = chosen.map((b) => ({
      x: s.cx + (b.at - mid) * gap,
      tall: b.size * s.H * scale,
      foot: s.horizon + b.depth * s.H * scale,
      mirror: b.mirror,
      phase: b.phase,
    }))
    // Far birds first, so nearer ones overlap them.
    return { birds: birds.sort((a, b) => a.foot - b.foot) }
  },
  paint(g, f, { birds }, kit) {
    kit.lake(g, f, '#43b08c', '#0f6a50')
    for (const b of birds) {
      const img = kit.sprite('🦩', spritePx(b.tall * 1.2)) ?? drawnFlamingo()
      const w = (b.tall * img.width) / img.height
      const top = b.foot - b.tall * 0.97 + Math.sin(f.t * 0.8 + b.phase)
      const x = b.x - w / 2
      reflectImage(g, img, x, top, w, b.tall, b.foot, f, 0.45, b.mirror)
      g.save()
      g.beginPath()
      g.rect(0, 0, f.W, b.foot)
      g.clip()
      if (b.mirror) {
        g.translate(x + w, 0)
        g.scale(-1, 1)
        g.drawImage(img, 0, top, w, b.tall)
      } else g.drawImage(img, x, top, w, b.tall)
      g.restore()
    }
  },
})
