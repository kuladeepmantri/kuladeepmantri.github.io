import { hash, rgba, scene, vgrad } from '../kit'

// DeID: a city across the water at dusk. Thousands of lit windows, every one
// somebody, none of them anyone in particular. Lights come and go slowly.
type Building = { x: number; w: number; h: number; spire: number; layer: number }
type State = { u: number; buildings: Building[] }

export default scene<State>({
  sky: { top: '#1d2263', bottom: '#f27ea2', cloud: '#f7abc3', clouds: 4, sun: 0.2 },
  paper: 0.6,
  setup(s) {
    const u = s.unit
    const buildings: Building[] = []
    for (const layer of [0, 1]) {
      for (let x = -20; x < s.W + 20; ) {
        const w = u * (0.035 + 0.05 * hash(x * 0.13 + layer * 9))
        // Taller toward the centre of the view, like a downtown.
        const centre = Math.exp(-(((x - s.cx) / (u * 0.6)) ** 2))
        const base = layer ? 0.06 : 0.12
        const h = u * (base + (layer ? 0.2 : 0.34) * centre * (0.4 + 0.6 * hash(x * 0.71 + layer)))
        buildings.push({ x, w, h, spire: hash(x * 1.9) > 0.85 ? u * 0.05 : 0, layer })
        x += w + 2
      }
    }
    // Far layer first.
    buildings.sort((a, b) => a.layer - b.layer)
    return { u, buildings }
  },
  paint(g, f, { u, buildings }, kit) {
    const back = kit.layer()
    const floor = u * 0.022
    for (const b of buildings) {
      const top = f.horizon - b.h
      back.fillStyle = b.layer
        ? vgrad(back, top, f.horizon, [
            [0, '#232656'],
            [1, '#141433'],
          ])
        : rgba('#5b4b8e', 1)
      back.fillRect(b.x, top, b.w, b.h)
      if (b.spire) {
        back.fillRect(b.x + b.w / 2 - 1, top - b.spire, 2, b.spire)
        if (Math.sin(f.t * 2 + b.x) > 0.4) {
          back.fillStyle = rgba('#ff5a4a', 0.95)
          back.fillRect(b.x + b.w / 2 - 2, top - b.spire - 2, 4, 3)
        }
      }
      if (!b.layer) continue
      // Windows, floor by floor; a few switch on or off every few seconds.
      const cols = Math.max(1, Math.floor((b.w - 4) / 6))
      for (let fl = 1; fl * floor < b.h - 4; fl++)
        for (let c = 0; c < cols; c++) {
          const seed = b.x * 13 + fl * 7 + c
          const on = hash(seed + Math.floor(f.t / 9 + hash(seed) * 9) * 0.37) > 0.52
          if (!on) continue
          back.fillStyle = hash(seed * 3) > 0.3 ? rgba('#ffd89c', 0.9) : rgba('#cfe4ff', 0.85)
          back.fillRect(b.x + 3 + c * 6, top + fl * floor - floor * 0.6, 3, floor * 0.45)
        }
    }
    kit.water(g, back, f, '#3c3170', '#0c0b26', 0.62)
  },
})
