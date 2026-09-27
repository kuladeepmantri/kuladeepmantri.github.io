// Sound, made in the browser with Web Audio: a quiet two-note pad that
// drifts, and a soft tick when a pane opens or closes. Off until the visitor
// turns it on; the choice is remembered.

const KEY = 'km-sound'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let pad: { stop: () => void } | null = null
let on = false
const listeners = new Set<(on: boolean) => void>()

export function soundOn() {
  return on
}

export function subscribe(fn: (on: boolean) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function savedPreference(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

function ensure() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  return ctx
}

function startPad(ac: AudioContext) {
  const out = ac.createGain()
  out.gain.value = 0.05
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 520
  filter.Q.value = 0.6
  filter.connect(out)
  out.connect(master!)
  // A2 and E3, each doubled a few cents apart so they beat slowly.
  const oscs = [110, 110.35, 164.81, 165.2].map((f, i) => {
    const o = ac.createOscillator()
    o.type = i % 2 ? 'triangle' : 'sine'
    o.frequency.value = f
    const g = ac.createGain()
    g.gain.value = i < 2 ? 0.5 : 0.28
    o.connect(g).connect(filter)
    o.start()
    return o
  })
  const lfo = ac.createOscillator()
  lfo.frequency.value = 0.05
  const depth = ac.createGain()
  depth.gain.value = 180
  lfo.connect(depth).connect(filter.frequency)
  lfo.start()
  return {
    stop() {
      oscs.forEach((o) => o.stop())
      lfo.stop()
      out.disconnect()
    },
  }
}

export async function setSound(next: boolean) {
  on = next
  try {
    localStorage.setItem(KEY, next ? 'on' : 'off')
  } catch {
    // remembered for this visit only
  }
  listeners.forEach((fn) => fn(next))
  if (next) {
    const ac = ensure()
    await ac.resume()
    if (!pad) pad = startPad(ac)
    master!.gain.cancelScheduledValues(ac.currentTime)
    master!.gain.setTargetAtTime(1, ac.currentTime, 0.6)
  } else if (ctx && master) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
  }
}

/** A short, soft tick. Higher when opening, lower when closing. */
export function tick(kind: 'open' | 'close' | 'hover' = 'open') {
  if (!on || !ctx || !master) return
  const ac = ctx
  const o = ac.createOscillator()
  const g = ac.createGain()
  const f = kind === 'open' ? 880 : kind === 'close' ? 520 : 1320
  const peak = kind === 'hover' ? 0.012 : 0.05
  o.type = 'sine'
  o.frequency.setValueAtTime(f, ac.currentTime)
  o.frequency.exponentialRampToValueAtTime(f * 0.75, ac.currentTime + 0.09)
  g.gain.setValueAtTime(0, ac.currentTime)
  g.gain.linearRampToValueAtTime(peak, ac.currentTime + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14)
  o.connect(g).connect(master)
  o.start()
  o.stop(ac.currentTime + 0.16)
}
