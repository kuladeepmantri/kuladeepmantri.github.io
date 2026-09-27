// Sound, made in the browser with Web Audio. Three ambient presets and a soft
// tick when panes open and close. Off until the visitor picks one; the choice
// is remembered.
//
//   drift      a two-note pad (A2 and E3, detuned) under a slow filter sweep
//   hum        a server room: brown noise, low-passed, with a faint mains hum
//   telemetry  sparse, quiet blips on a pentatonic scale, like a device reporting in

export type Preset = 'off' | 'drift' | 'hum' | 'telemetry'
export const PRESETS: Preset[] = ['off', 'drift', 'hum', 'telemetry']
export const LABELS: Record<Preset, string> = {
  off: 'Sound off',
  drift: 'Drift',
  hum: 'Hum',
  telemetry: 'Telemetry',
}

const KEY = 'km-sound'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let running: { stop: () => void } | null = null
let preset: Preset = 'off'
const listeners = new Set<(p: Preset) => void>()

export function current(): Preset {
  return preset
}

export function subscribe(fn: (p: Preset) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function saved(): Preset {
  try {
    const v = localStorage.getItem(KEY) as Preset | null
    return v && PRESETS.includes(v) ? v : 'off'
  } catch {
    return 'off'
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

function drift(ac: AudioContext, out: AudioNode) {
  const g = ac.createGain()
  g.gain.value = 0.05
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 520
  filter.Q.value = 0.6
  filter.connect(g).connect(out)
  const oscs = [110, 110.35, 164.81, 165.2].map((f, i) => {
    const o = ac.createOscillator()
    o.type = i % 2 ? 'triangle' : 'sine'
    o.frequency.value = f
    const v = ac.createGain()
    v.gain.value = i < 2 ? 0.5 : 0.28
    o.connect(v).connect(filter)
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
      g.disconnect()
    },
  }
}

function hum(ac: AudioContext, out: AudioNode) {
  // Brown noise: integrated white noise, looped from a few seconds of buffer.
  const len = ac.sampleRate * 4
  const buffer = ac.createBuffer(1, len, ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last * 3.2
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 380
  const g = ac.createGain()
  g.gain.value = 0.12
  src.connect(lp).connect(g).connect(out)
  src.start()
  const mains = ac.createOscillator()
  mains.frequency.value = 60
  const mg = ac.createGain()
  mg.gain.value = 0.012
  mains.connect(mg).connect(out)
  mains.start()
  return {
    stop() {
      src.stop()
      mains.stop()
      g.disconnect()
      mg.disconnect()
    },
  }
}

function telemetry(ac: AudioContext, out: AudioNode) {
  const notes = [659.25, 783.99, 880, 987.77, 1174.66, 1318.51]
  let alive = true
  let timer: ReturnType<typeof setTimeout>
  const blip = () => {
    if (!alive) return
    const count = Math.random() < 0.3 ? 2 : 1
    for (let k = 0; k < count; k++) {
      const at = ac.currentTime + k * 0.09
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sine'
      o.frequency.value = notes[(Math.random() * notes.length) | 0]
      g.gain.setValueAtTime(0, at)
      g.gain.linearRampToValueAtTime(0.025, at + 0.005)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22)
      o.connect(g).connect(out)
      o.start(at)
      o.stop(at + 0.25)
    }
    timer = setTimeout(blip, 900 + Math.random() * 2600)
  }
  blip()
  return {
    stop() {
      alive = false
      clearTimeout(timer)
    },
  }
}

const BUILD = { drift, hum, telemetry }

export async function setPreset(next: Preset) {
  preset = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // remembered for this visit only
  }
  listeners.forEach((fn) => fn(next))
  if (next === 'off') {
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
    const old = running
    running = null
    setTimeout(() => old?.stop(), 1200)
    return
  }
  const ac = ensure()
  await ac.resume()
  const old = running
  running = BUILD[next](ac, master!)
  setTimeout(() => old?.stop(), 50)
  master!.gain.cancelScheduledValues(ac.currentTime)
  master!.gain.setTargetAtTime(1, ac.currentTime, 0.5)
}

/** Move to the next preset, wrapping back to off. */
export function cycle() {
  return setPreset(PRESETS[(PRESETS.indexOf(preset) + 1) % PRESETS.length])
}

/** A short, soft tick. Higher when opening, lower when closing. */
export function tick(kind: 'open' | 'close' | 'hover' = 'open') {
  if (preset === 'off' || !ctx || !master) return
  const ac = ctx
  const o = ac.createOscillator()
  const g = ac.createGain()
  const f = kind === 'open' ? 880 : kind === 'close' ? 520 : 1320
  const peak = kind === 'hover' ? 0.01 : 0.045
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
