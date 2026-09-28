// Sound, made in the browser with Web Audio: no files. On by default; browsers
// only allow audio after a gesture, so it starts at the visitor's first click,
// tap, or key press. The switch turns it off, and the choice is remembered.
//
// One piece, kept simple: soft piano-like notes wandering in short phrases over
// a very quiet low drone, in a dark room. Everything is in D major. The drone
// moves D, B, G, A; the notes, and the ticks for hovering and opening panes,
// come from D major pentatonic, so interaction sounds like part of the music.

export type Preset = 'off' | 'on'
export const PRESETS: Preset[] = ['off', 'on']
export const LABELS: Record<Preset, string> = {
  off: 'Sound off',
  on: 'Sound on',
}

// D major pentatonic, D4 to E6.
const SCALE = [
  293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51,
]
// Drone roots, an octave and a fifth each: D, B, G, A.
const ROOTS = [73.42, 61.74, 49, 55]

// A new key drops choices saved by older versions of the site, so everyone starts with
// sound on at their first interaction; turning it off from here on is remembered.
const KEY = 'km-sound-v2'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let room: ConvolverNode | null = null
let running: { stop: () => void } | null = null
let preset: Preset = 'off'
// A chosen preset the browser has not let start yet (no gesture, or iOS interrupted it).
let waiting = false
// Bumped on every change, so a slow resume() from an older request knows it is stale.
let req = 0
// Gestures inside this element (the switch) are left to its own click handler.
let guard: Element | null = null
let pointer = 'mouse'
const listeners = new Set<(p: Preset) => void>()

export function current(): Preset {
  return preset
}

export function subscribe(fn: (p: Preset) => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  listeners.forEach((fn) => fn(preset))
}

/** The remembered choice. Nothing remembered means on; older presets count as on. */
export function saved(): Preset {
  try {
    return localStorage.getItem(KEY) === 'off' ? 'off' : 'on'
  } catch {
    return 'on'
  }
}

function remember(p: Preset) {
  try {
    localStorage.setItem(KEY, p)
  } catch {
    // remembered for this visit only
  }
}

// iOS gives a plain AudioContext the 'ambient' audio session, which the ring/silent switch
// mutes. 'playback' plays through the switch (Safari 16.4+) and pauses other apps' audio, so
// it is released back to 'auto' when sound goes off. Browsers without the API ignore this.
function session(type: 'playback' | 'auto') {
  const s = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
  try {
    if (s) s.type = type
  } catch {
    // unsupported type: keep the default
  }
}

function ensure() {
  if (ctx) return ctx
  if (typeof AudioContext === 'undefined') return null
  try {
    ctx = new AudioContext()
  } catch {
    return null
  }
  master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  // A dark, wide room: four and a half seconds of softened, decaying noise per ear.
  room = ctx.createConvolver()
  const len = Math.round(ctx.sampleRate * 4.5)
  const ir = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    let soft = 0
    for (let i = 0; i < len; i++) {
      soft = soft * 0.82 + (Math.random() * 2 - 1) * 0.18
      d[i] = soft * (1 - i / len) ** 2.6
    }
  }
  room.buffer = ir
  const wet = ctx.createGain()
  wet.gain.value = 0.9
  room.connect(wet).connect(master)
  document.addEventListener('visibilitychange', onVisibility)
  // pointerover runs before pointerenter, so tick('hover') can tell a mouse from a tap.
  window.addEventListener('pointerover', (e) => (pointer = e.pointerType), {
    capture: true,
    passive: true,
  })
  return ctx
}

// Hidden tabs go quiet. The music is stopped, not just suspended: its timers keep running
// while the clock is frozen and would pile notes up at the same instant on return.
function onVisibility() {
  if (!ctx || !master || preset === 'off') return
  if (document.hidden) {
    req++
    running?.stop()
    running = null
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(0, ctx.currentTime)
    ctx.suspend().catch(() => {})
  } else void setPreset(preset)
}

const GESTURES = ['pointerup', 'keydown', 'click'] as const

function onGesture(e: Event) {
  if (guard && e.target instanceof Node && guard.contains(e.target)) return
  if (e instanceof KeyboardEvent && e.key === 'Escape') return
  void setPreset(preset)
}

function arm() {
  GESTURES.forEach((t) => window.addEventListener(t, onGesture, true))
}

function disarm() {
  GESTURES.forEach((t) => window.removeEventListener(t, onGesture, true))
}

/**
 * Bring back the remembered choice (on, unless turned off before). Browsers only start
 * audio after a gesture, so it starts at the first click, tap, or key press, and the
 * switch shows it meanwhile.
 */
export function restore(ignore: Element | null) {
  guard = ignore
  if (req === 0 && preset === 'off' && saved() === 'on') {
    preset = 'on'
    waiting = true
    emit()
  }
  if (waiting) arm()
  return () => {
    guard = null
    disarm()
  }
}

/**
 * One piano-like note: a few harmonics that fade at different speeds (the higher ones
 * sooner), through a filter that closes after the strike, into the room.
 */
function key(freq: number, level: number, when = 0, pan = 0) {
  if (!ctx || !master || !room) return
  const at = ctx.currentTime + when
  const out = ctx.createGain()
  out.gain.value = level
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(Math.min(7000, freq * 9), at)
  lp.frequency.exponentialRampToValueAtTime(Math.max(600, freq * 2.2), at + 0.9)
  const place = ctx.createStereoPanner()
  place.pan.value = pan
  lp.connect(out).connect(place)
  place.connect(master)
  place.connect(room)
  const partials: [number, number, number][] = [
    [1, 1, 3.6],
    [2.001, 0.32, 2],
    [3.003, 0.12, 1.2],
    [4.01, 0.05, 0.7],
  ]
  for (const [mult, amp, decay] of partials) {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq * mult
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(amp, at + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    o.connect(g).connect(lp)
    o.start(at)
    o.stop(at + decay + 0.05)
  }
}

/** A very quiet low drone on one root: the root and its fifth, sines, slow in and out. */
function drone(ac: AudioContext, root: number, hold: number) {
  if (!master || !room) return null
  const at = ac.currentTime
  const env = ac.createGain()
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(1, at + 4)
  env.gain.setValueAtTime(1, at + hold)
  env.gain.linearRampToValueAtTime(0, at + hold + 5)
  env.connect(master)
  env.connect(room)
  const oscs = [root, root * 1.5, root * 2].map((f, i) => {
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.detune.value = i === 1 ? 3 : 0
    const g = ac.createGain()
    g.gain.value = [0.022, 0.012, 0.008][i]
    o.connect(g).connect(env)
    o.start(at)
    o.stop(at + hold + 5.5)
    return o
  })
  return {
    release(t: number) {
      env.gain.cancelScheduledValues(t)
      env.gain.setValueAtTime(env.gain.value, t)
      env.gain.setTargetAtTime(0, t, 0.4)
      oscs.forEach((o) => o.stop(t + 2))
    },
  }
}

/** The music: phrases of three to five notes, a pause, and the drone moving underneath. */
function music(ac: AudioContext) {
  let alive = true
  let step = 0
  let at = 5 + Math.floor(Math.random() * 3) // a place in the scale, walked step by step
  let drones: NonNullable<ReturnType<typeof drone>>[] = []
  const timers: ReturnType<typeof setTimeout>[] = []

  const nextDrone = () => {
    if (!alive) return
    const d = drone(ac, ROOTS[step++ % ROOTS.length], 11)
    if (d) drones = [...drones.slice(-1), d]
    timers.push(setTimeout(nextDrone, 14000))
  }

  const phrase = () => {
    if (!alive) return
    const notes = 3 + Math.floor(Math.random() * 3)
    let when = 0
    for (let n = 0; n < notes; n++) {
      // Mostly small steps, sometimes a leap, kept inside the singing range.
      const move =
        Math.random() < 0.8 ? (Math.random() < 0.5 ? -1 : 1) : Math.random() < 0.5 ? -2 : 2
      at = Math.max(3, Math.min(10, at + move))
      const last = n === notes - 1
      const level = 0.05 * (0.75 + 0.25 * Math.random()) * (last ? 0.85 : 1)
      key(SCALE[at], level, when, (Math.random() - 0.5) * 0.5)
      // Now and then a softer note a third or fifth below, for harmony.
      if (Math.random() < 0.25) key(SCALE[Math.max(0, at - 2)], level * 0.5, when + 0.02, 0)
      when += 0.55 + Math.random() * 0.45
    }
    timers.push(setTimeout(phrase, (when + 2.8 + Math.random() * 3.5) * 1000))
  }

  nextDrone()
  timers.push(setTimeout(phrase, 1200))
  return {
    stop() {
      alive = false
      timers.forEach(clearTimeout)
      drones.forEach((d) => d.release(ac.currentTime))
    },
  }
}

export async function setPreset(next: Preset) {
  const id = ++req
  preset = next
  waiting = false
  disarm()
  remember(next)
  emit()
  if (next === 'off') {
    if (!ctx || !master) return
    const ac = ctx
    master.gain.setTargetAtTime(0, ac.currentTime, 0.25)
    const old = running
    running = null
    setTimeout(() => {
      old?.stop()
      if (id !== req) return
      session('auto')
      ac.suspend().catch(() => {})
    }, 1300)
    return
  }
  // Called within the gesture, before any await, so iOS counts it as user-initiated.
  session('playback')
  const ac = ensure()
  if (!ac) {
    preset = 'off'
    remember('off')
    emit()
    return
  }
  if (ac.state !== 'running') {
    // If this call had no gesture behind it, resume() waits; the next gesture retries.
    waiting = true
    arm()
    try {
      await ac.resume()
    } catch {
      return
    }
    if (id !== req || (ac.state as AudioContextState) !== 'running') return
    waiting = false
    disarm()
  }
  const old = running
  running = music(ac)
  setTimeout(() => old?.stop(), 50)
  master!.gain.cancelScheduledValues(ac.currentTime)
  master!.gain.setTargetAtTime(1, ac.currentTime, 0.8)
}

/** The switch: on to off, off to on. */
export function cycle() {
  return setPreset(preset === 'off' ? 'on' : 'off')
}

/** Single notes of the same piano for interaction: rising when opening, falling when closing. */
export function tick(kind: 'open' | 'close' | 'hover' = 'open') {
  if (preset === 'off' || !ctx || ctx.state !== 'running') return
  if (kind === 'hover') {
    // Hover is a mouse affordance; a tap also fires pointerenter.
    if (pointer === 'mouse') key(SCALE[7 + Math.floor(Math.random() * 3)], 0.014)
  } else if (kind === 'open') {
    key(SCALE[5], 0.045)
    key(SCALE[8], 0.035, 0.1)
  } else {
    key(SCALE[8], 0.035)
    key(SCALE[5], 0.03, 0.1)
  }
}
