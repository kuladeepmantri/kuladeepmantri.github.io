import { glow, hash, rgba, scene, stars, vgrad } from '../kit'

// kubereach: a container port at night. A gantry crane moves one container
// between a moored ship and the stacks, and a searchlight sweeps the yard.
const BOXES = ['#8f3f2c', '#2d6570', '#2c3d66', '#a8843c', '#5a5f6b', '#6e2f45', '#3f6b4a']

type Box = { x: number; y: number; w: number; h: number; c: string }
type State = {
  u: number
  quay: number
  stacks: Box[]
  skyline: { x: number; w: number; h: number }[]
  ship: { x0: number; x1: number; top: number; deck: Box[]; spot: Box }
  crane: { legA: number; legB: number; boom: number; b0: number; b1: number }
  slot: Box // where the moving container lands on the stacks
}

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x))

export default scene<State>({
  sky: { top: '#070b1a', bottom: '#223252', cloud: '#56627e', clouds: 4, sun: 0.1 },
  paper: 0.55,
  setup(s) {
    const u = s.unit
    const quay = s.horizon - u * 0.014
    const bw = u * 0.06
    const bh = u * 0.028
    const stacks: Box[] = []
    const x0 = s.cx - u * 0.5
    let tallest = 0
    for (let c = 0; c < 8; c++) {
      const tiers = 2 + Math.floor(hash(c * 3.7) * 3)
      tallest = Math.max(tallest, tiers)
      for (let k = 0; k < tiers; k++)
        stacks.push({
          x: x0 + c * (bw + 2),
          y: quay - (k + 1) * bh,
          w: bw,
          h: bh,
          c: BOXES[Math.floor(hash(c * 11 + k * 5) * BOXES.length)],
        })
    }
    const lastCol = stacks.filter((b) => b.x === x0 + 7 * (bw + 2))
    const slot = {
      x: x0 + 7 * (bw + 2),
      y: quay - (lastCol.length + 1) * bh,
      w: bw,
      h: bh,
      c: '#c9a54a',
    }
    const shipX0 = s.cx + u * 0.12
    const shipX1 = Math.min(s.W + u * 0.1, s.cx + u * 0.75)
    const top = s.horizon - u * 0.05
    const deck: Box[] = []
    for (let c = 0; c < Math.floor((shipX1 - shipX0 - u * 0.12) / (bw + 2)); c++)
      for (let k = 0; k < 2; k++)
        if (c !== 2 || k !== 1)
          deck.push({
            x: shipX0 + u * 0.04 + c * (bw + 2),
            y: top - (k + 1) * bh,
            w: bw,
            h: bh,
            c: BOXES[Math.floor(hash(c * 7 + k * 13 + 1) * BOXES.length)],
          })
    const spot = { x: shipX0 + u * 0.04 + 2 * (bw + 2), y: top - 2 * bh, w: bw, h: bh, c: slot.c }
    const skyline = []
    for (let x = 0; x < s.W; ) {
      const w = 14 + hash(x * 0.37) * 40
      skyline.push({ x, w, h: u * (0.02 + 0.05 * hash(x * 0.91 + 2)) })
      x += w + 2
    }
    return {
      u,
      quay,
      stacks,
      skyline,
      ship: { x0: shipX0, x1: shipX1, top, deck, spot },
      crane: {
        legA: s.cx - u * 0.02,
        legB: s.cx + u * 0.1,
        boom: s.horizon - u * 0.6,
        b0: s.cx - u * 0.2,
        b1: s.cx + u * 0.52,
      },
      slot,
    }
  },
  paint(g, f, st, kit) {
    const { u, quay, crane, ship, slot } = st
    stars(g, f, 60, 4, f.horizon * 0.75)

    const back = kit.layer()
    // Far city across the water.
    for (const b of st.skyline) {
      back.fillStyle = '#131a2d'
      back.fillRect(b.x, quay - b.h, b.w, b.h)
      for (let k = 0; k < 4; k++)
        if (hash(b.x + k * 9.1) > 0.55) {
          back.fillStyle = rgba('#ffd98a', 0.5 + 0.4 * Math.sin(f.t * 0.3 + b.x))
          back.fillRect(b.x + 3 + hash(b.x * k) * (b.w - 6), quay - b.h + 3 + k * 6, 2, 2)
        }
    }
    // Quay.
    back.fillStyle = '#1b2233'
    back.fillRect(0, quay, f.W, f.horizon - quay)

    const box = (b: Box, lit = 1) => {
      back.fillStyle = b.c
      back.fillRect(b.x, b.y, b.w, b.h)
      back.fillStyle = rgba('#ffffff', 0.18 * lit)
      back.fillRect(b.x, b.y, b.w, 2)
      back.fillStyle = rgba('#000000', 0.25)
      back.fillRect(b.x + b.w - 3, b.y, 3, b.h)
    }
    for (const b of st.stacks) box(b)

    // The ship: hull, bridge, containers on deck.
    back.fillStyle = vgrad(back, ship.top, f.horizon, [
      [0, '#2b3142'],
      [0.7, '#232838'],
      [1, '#6d2626'],
    ])
    back.beginPath()
    back.moveTo(ship.x0, ship.top)
    back.lineTo(ship.x1, ship.top)
    back.lineTo(ship.x1 - u * 0.02, f.horizon)
    back.lineTo(ship.x0 + u * 0.03, f.horizon)
    back.closePath()
    back.fill()
    const bx = ship.x1 - u * 0.1
    back.fillStyle = '#c3c8d2'
    back.fillRect(bx, ship.top - u * 0.1, u * 0.06, u * 0.1)
    for (let k = 0; k < 4; k++) {
      back.fillStyle = rgba('#ffe2a0', 0.8)
      back.fillRect(bx + 4, ship.top - u * 0.09 + k * u * 0.022, u * 0.05, 2)
    }
    for (const b of ship.deck) box(b, 0.7)

    // The crane's cycle: ship to stacks, then the same box back, 16 s each way.
    const period = 32
    const p = (f.t + 6) % period
    const forward = p < 16
    const q = p % 16
    const src = forward ? ship.spot : slot
    const dst = forward ? slot : ship.spot
    const high = crane.boom + u * 0.05
    const srcX = src.x + src.w / 2
    const dstX = dst.x + dst.w / 2
    let tx = srcX
    let hook = high
    let carrying = false
    let at: 'src' | 'dst' = 'src'
    if (q < 2.5) hook = high + (src.y - high) * ease(q / 2.5)
    else if (q < 4.5) {
      carrying = true
      hook = src.y + (high - src.y) * ease((q - 2.5) / 2)
    } else if (q < 9) {
      carrying = true
      tx = srcX + (dstX - srcX) * ease((q - 4.5) / 4.5)
    } else if (q < 11) {
      carrying = true
      tx = dstX
      hook = high + (dst.y - high) * ease((q - 9) / 2)
    } else {
      at = 'dst'
      const back01 = ease((q - 12.5) / 3.5)
      tx = dstX + (srcX - dstX) * back01
      hook = q < 12.5 ? dst.y + (high - dst.y) * ease((q - 11) / 1.5) : high
    }
    if (!carrying) box(at === 'src' ? src : dst)

    // Crane structure, lit from below.
    const steel = '#aebad0'
    const beam = (x0: number, y0: number, x1: number, y1: number, w: number) => {
      back.strokeStyle = steel
      back.lineWidth = w
      back.beginPath()
      back.moveTo(x0, y0)
      back.lineTo(x1, y1)
      back.stroke()
    }
    const t = u * 0.009
    beam(crane.legA, quay, crane.legA, crane.boom, t)
    beam(crane.legB, quay, crane.legB, crane.boom, t)
    beam(crane.legA, quay - u * 0.12, crane.legB, quay - u * 0.12, t * 0.7)
    beam(crane.legA, quay, crane.legB, quay - u * 0.12, t * 0.5)
    beam(crane.legB, quay, crane.legA, quay - u * 0.12, t * 0.5)
    beam(crane.b0, crane.boom, crane.b1, crane.boom, t * 1.2)
    beam(crane.legA, crane.boom - u * 0.1, crane.b1, crane.boom, t * 0.4)
    beam(crane.legA, crane.boom - u * 0.1, crane.b0, crane.boom, t * 0.4)
    beam(crane.legA, crane.boom - u * 0.1, crane.legA, crane.boom, t * 0.8)
    back.fillStyle = '#d7dde8'
    back.fillRect(crane.legB - u * 0.02, crane.boom + 2, u * 0.035, u * 0.025)

    // Trolley, cables, spreader, and the box it carries.
    back.fillStyle = '#e1e6ee'
    back.fillRect(tx - u * 0.018, crane.boom - 2, u * 0.036, u * 0.012)
    back.strokeStyle = rgba('#dfe5ef', 0.8)
    back.lineWidth = 1
    back.beginPath()
    back.moveTo(tx - u * 0.01, crane.boom + u * 0.01)
    back.lineTo(tx - u * 0.01, hook)
    back.moveTo(tx + u * 0.01, crane.boom + u * 0.01)
    back.lineTo(tx + u * 0.01, hook)
    back.stroke()
    back.fillStyle = '#f0c24b'
    back.fillRect(tx - slot.w / 2, hook - 3, slot.w, 3)
    if (carrying) box({ ...slot, x: tx - slot.w / 2, y: hook })

    // Lights: floodlights on the yard, a red light on the crane's apex.
    glow(back, crane.legA, crane.boom + u * 0.02, u * 0.16, '#ffe6b0', 0.28)
    glow(back, crane.legB, crane.boom + u * 0.02, u * 0.16, '#ffe6b0', 0.28)
    if (Math.sin(f.t * 3) > 0.2)
      glow(back, crane.legA, crane.boom - u * 0.1, u * 0.02, '#ff4b3a', 0.9)

    // The searchlight: a tower on the quay, a beam sweeping over the yard and the sky.
    const sx = f.left + Math.min(f.span * 0.12, u * 0.2)
    const sy = quay - u * 0.2
    back.fillStyle = '#2a3144'
    back.fillRect(sx - 3, sy, 6, quay - sy)
    const a = -Math.PI / 2 + Math.sin(f.t * 0.25) * 0.9
    const L = u * 1.2
    const spread = 0.07
    const beamG = back.createRadialGradient(sx, sy, 0, sx, sy, L)
    beamG.addColorStop(0, rgba('#e8f0ff', 0.4))
    beamG.addColorStop(1, rgba('#e8f0ff', 0))
    back.fillStyle = beamG
    back.beginPath()
    back.moveTo(sx, sy)
    back.lineTo(sx + Math.cos(a - spread) * L, sy + Math.sin(a - spread) * L)
    back.lineTo(sx + Math.cos(a + spread) * L, sy + Math.sin(a + spread) * L)
    back.closePath()
    back.fill()
    glow(back, sx, sy, u * 0.03, '#f2f6ff', 0.9)

    kit.water(g, back, f, '#1a3552', '#050d19', 0.5)
  },
})
