// Sound, made in the browser with Web Audio: no files. Off until the visitor
// picks it; the choice is remembered.
//
//   ambient  warm pad chords that change slowly, a few soft bell notes, and
//            the lake underneath: calm, but always moving somewhere
//   lake     just the water: swells, lapping at the shore, a little wind
//
// Everything is in D major. Bells and the ticks for hovering and opening panes
// use the D major pentatonic scale, so interaction sounds like part of the music.

export type Preset = 'off' | 'ambient' | 'lake'
export const PRESETS: Preset[] = ['off', 'ambient', 'lake']
export const LABELS: Record<Preset, string> = {
  off: 'Sound off',
  ambient: 'Sound: ambient',
  lake: 'Sound: lake',
}

// D major pentatonic, D4 to E6.
const SCALE = [
  293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51,
]

const KEY = 'km-sound'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let room: ConvolverNode | null = null
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
  // A soft room: three seconds of decaying noise as the impulse response.
  room = ctx.createConvolver()
  const len = ctx.sampleRate * 3
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  }
  room.buffer = ir
  const wet = ctx.createGain()
  wet.gain.value = 0.5
  room.connect(wet).connect(master)
  return ctx
}

/** A few seconds of looping noise: brown (deep) or pink-ish (lighter). */
function noise(ac: AudioContext, brown: boolean) {
  const len = ac.sampleRate * 6
  const buffer = ac.createBuffer(1, len, ac.sampleRate)
  const d = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    last = brown ? (last + 0.02 * w) / 1.02 : 0.97 * last + 0.03 * w
    d[i] = last * (brown ? 3.4 : 6)
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

function lake(ac: AudioContext, out: AudioNode) {
  const nodes: AudioScheduledSourceNode[] = []
  let alive = true
  const timers: ReturnType<typeof setTimeout>[] = []

  // Swells: deep water noise whose level rises and falls every few seconds.
  const deep = noise(ac, true)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 520
  const swell = ac.createGain()
  swell.gain.value = 0.05
  deep.connect(lp).connect(swell).connect(out)
  deep.start()
  nodes.push(deep)
  const nextSwell = () => {
    if (!alive) return
    const now = ac.currentTime
    const peak = 0.08 + Math.random() * 0.07
    const rise = 1.4 + Math.random() * 1.2
    swell.gain.cancelScheduledValues(now)
    swell.gain.setTargetAtTime(peak, now, rise / 3)
    swell.gain.setTargetAtTime(0.035, now + rise, 1.3)
    timers.push(setTimeout(nextSwell, (rise + 2.5 + Math.random() * 3) * 1000))
  }
  nextSwell()

  // Lapping: short bright bursts where the water meets the shore.
  const lap = noise(ac, false)
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1100
  bp.Q.value = 0.8
  const lapGain = ac.createGain()
  lapGain.gain.value = 0
  lap.connect(bp).connect(lapGain).connect(out)
  lap.start()
  nodes.push(lap)
  const nextLap = () => {
    if (!alive) return
    const now = ac.currentTime
    bp.frequency.setValueAtTime(800 + Math.random() * 900, now)
    lapGain.gain.setTargetAtTime(0.012 + Math.random() * 0.018, now, 0.05)
    lapGain.gain.setTargetAtTime(0, now + 0.15 + Math.random() * 0.3, 0.12)
    timers.push(setTimeout(nextLap, 600 + Math.random() * 2400))
  }
  nextLap()

  // Wind: a faint band of noise whose pitch wanders.
  const air = noise(ac, false)
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 500
  band.Q.value = 1.4
  const airGain = ac.createGain()
  airGain.gain.value = 0.012
  const lfo = ac.createOscillator()
  lfo.frequency.value = 0.04
  const depth = ac.createGain()
  depth.gain.value = 260
  lfo.connect(depth).connect(band.frequency)
  air.connect(band).connect(airGain).connect(out)
  air.start()
  lfo.start()
  nodes.push(air, lfo)

  return {
    stop() {
      alive = false
      timers.forEach(clearTimeout)
      nodes.forEach((n) => n.stop())
    },
  }
}

/** One soft, bell-like note: a sine with a quiet octave, into the room. */
function note(freq: number, level: number, when = 0) {
  if (!ctx || !master || !room) return
  const at = ctx.currentTime + when
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(level, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 2.4)
  const a = ctx.createOscillator()
  a.type = 'sine'
  a.frequency.value = freq
  const b = ctx.createOscillator()
  b.type = 'sine'
  b.frequency.value = freq * 2.01
  const bg = ctx.createGain()
  bg.gain.value = 0.18
  a.connect(g)
  b.connect(bg).connect(g)
  g.connect(master)
  g.connect(room)
  a.start(at)
  b.start(at)
  a.stop(at + 2.5)
  b.stop(at + 2.5)
}

// Dmaj9, Bm11, Gmaj7(#11), A6sus2: each voiced low and open.
const CHORDS = [
  [146.83, 220, 277.18, 329.63, 369.99],
  [123.47, 185, 220, 293.66, 329.63],
  [98, 146.83, 185, 246.94, 277.18],
  [110, 164.81, 185, 246.94, 329.63],
]

/** One pad chord: each note two slightly detuned voices, filtered warm, faded in and out. */
function chord(ac: AudioContext, out: AudioNode, notes: number[], hold: number) {
  const at = ac.currentTime
  const env = ac.createGain()
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(1, at + 3.5)
  env.gain.setValueAtTime(1, at + hold)
  env.gain.linearRampToValueAtTime(0, at + hold + 4.5)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 820
  lp.Q.value = 0.4
  const swell = ac.createOscillator()
  swell.frequency.value = 0.07
  const depth = ac.createGain()
  depth.gain.value = 260
  swell.connect(depth).connect(lp.frequency)
  swell.start(at)
  swell.stop(at + hold + 5)
  lp.connect(env)
  env.connect(out)
  if (room) env.connect(room)
  notes.forEach((f, i) => {
    for (const [type, detune, level] of [
      ['triangle', -6, 0.5],
      ['sawtooth', 5, 0.12],
    ] as const) {
      const o = ac.createOscillator()
      o.type = type
      o.frequency.value = f
      o.detune.value = detune
      const pan = ac.createStereoPanner()
      pan.pan.value = (i / (notes.length - 1)) * 1.2 - 0.6
      const v = ac.createGain()
      v.gain.value = (level * 0.022) / (1 + i * 0.25)
      o.connect(v).connect(pan).connect(lp)
      o.start(at)
      o.stop(at + hold + 5)
    }
  })
}

function ambient(ac: AudioContext, out: AudioNode) {
  const waterLevel = ac.createGain()
  waterLevel.gain.value = 0.55
  waterLevel.connect(out)
  const water = lake(ac, waterLevel)
  let alive = true
  let step = 0
  const timers: ReturnType<typeof setTimeout>[] = []
  const nextChord = () => {
    if (!alive) return
    chord(ac, out, CHORDS[step++ % CHORDS.length], 9)
    timers.push(setTimeout(nextChord, 10000))
  }
  const nextBell = () => {
    if (!alive) return
    const i = 4 + Math.floor(Math.random() * 7)
    note(SCALE[i], 0.022)
    if (Math.random() < 0.3) note(SCALE[i - 2] ?? SCALE[i], 0.014, 0.6)
    timers.push(setTimeout(nextBell, 2600 + Math.random() * 4200))
  }
  nextChord()
  timers.push(setTimeout(nextBell, 2500))
  return {
    stop() {
      alive = false
      timers.forEach(clearTimeout)
      water.stop()
      waterLevel.disconnect()
    },
  }
}

const BUILD = { ambient, lake }

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
  master!.gain.setTargetAtTime(1, ac.currentTime, 0.6)
}

/** Move to the next preset, wrapping back to off. */
export function cycle() {
  return setPreset(PRESETS[(PRESETS.indexOf(preset) + 1) % PRESETS.length])
}

/** Notes from the same scale for interaction: up when opening, down when closing. */
export function tick(kind: 'open' | 'close' | 'hover' = 'open') {
  if (preset === 'off' || !ctx) return
  if (kind === 'hover') note(SCALE[6 + Math.floor(Math.random() * 4)], 0.008)
  else if (kind === 'open') {
    note(SCALE[5], 0.03)
    note(SCALE[8], 0.024, 0.09)
  } else {
    note(SCALE[8], 0.024)
    note(SCALE[5], 0.02, 0.09)
  }
}
