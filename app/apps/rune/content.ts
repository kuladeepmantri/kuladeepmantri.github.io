// Single source for the rune project page: copy (first person, honest) + data
// for the diagrams and bands. Metadata (id, dates, links) stays in signals.ts.

export const HERO = {
  eyebrow: 'rune · KM-2026-0005 · shipped',
  headline: 'A dashboard for a car that never had one',
  sub: 'Rune reads my 2026 Honda Accord in real time. A Raspberry Pi in the armrest pulls data off the engine and turns it into a health readout on a phone stuck to the dash. It runs on every drive.',
  meta: ['Raspberry Pi 4B', 'OBD-II / CAN', 'React PWA', 'shipped · in daily use'],
  live: 'https://rune.kuladeepmantri.com/',
}

// A note the reader deserves up front: this repo is the writeup, not the car app.
export const REPO_NOTE =
  'The repo behind the [src] link is this case-study site. The car software itself is a separate, older project that runs on the Pi.'

export const INTRO = {
  paragraphs: [
    'A modern car already knows almost everything about itself. Coolant temperature, fuel trims, catalyst heat, battery voltage, every sensor the engine computer watches to keep itself alive. It just never shows you any of it. The dashboard gives you a speed, a fuel gauge, and a check-engine light that only turns on once something is already wrong.',
    'Rune is my answer to that. A Raspberry Pi 4B sits in the armrest, taps the car\'s OBD-II port through the CAN bus, and reads the same signals the engine computer sees. A phone mounted on the dash shows them back to me as a single health score, updated live while I drive. Not a fault code after the fact. The actual state of the car, right now.',
  ],
}

// The three-layer analysis, for the "how it reads health" section.
export const LAYERS = {
  intro:
    'A raw number off a sensor does not tell you much. 440 degrees at the catalyst is fine on the highway and alarming at idle. So the readings pass through three layers before they become a health score, each catching a kind of problem the last one misses.',
  items: [
    {
      tag: 'layer 1',
      title: 'Threshold checks',
      text: 'The floor. Every reading is checked against the range Honda considers safe for that specific part. Fast, boring, and enough to catch anything already out of spec.',
    },
    {
      tag: 'layer 2',
      title: 'Streaming anomaly detection',
      text: 'A HalfSpaceTrees model learns what normal looks like for my car, on my drives, and flags readings that are strange even while still inside the safe range. I picked it over an isolation forest because it scores each reading as it arrives, without holding a window of history in memory on a Pi.',
    },
    {
      tag: 'layer 3',
      title: 'Trend forecasting',
      text: 'The slow one. It watches how a value drifts across weeks, so a battery giving out or a sensor going lazy shows up as a falling line long before it trips a threshold.',
    },
  ],
}

// Data-path diagram nodes (car -> Pi -> analysis -> phone). Drives the wireframe.
export const DATA_PATH = [
  { key: 'car', label: 'the car', sub: 'OBD-II port · CAN bus' },
  { key: 'pi', label: 'Raspberry Pi 4B', sub: 'in the armrest' },
  { key: 'analysis', label: '3 analysis layers', sub: 'threshold · anomaly · trend' },
  { key: 'phone', label: 'phone on the dash', sub: 'React PWA · live score' },
]

export const ANOMALY = {
  intro:
    'Here is what layer two actually does. This is catalyst temperature over a ten-minute window. On the left is normal highway driving. In the highlighted stretch the temperature starts swinging as conversion efficiency drops, and the anomaly score climbs past the line. Drag the sensitivity to see where the model decides something is off.',
}

export const NOTES = {
  intro:
    'Two pieces took the most care.',
  items: [
    {
      tag: 'safety',
      title: 'Nothing goes back to the car unchecked',
      text: 'Reading from a car is safe. Writing to it is not. The CAN bus is the same wire that carries braking and throttle messages, and a malformed command does not politely fail. So every command the Pi is allowed to send passes a gate first that validates it against a hand-written allowlist. If a command is not on the list, it never reaches the wire. I would rather the feature not exist than ship a way to brick my own car.',
    },
    {
      tag: 'honda pids',
      title: 'The interesting data is not in the standard',
      text: 'The generic OBD-II standard exposes maybe a dozen values. Everything genuinely useful, the real fuel trims, the transmission and catalyst internals, lives in Honda-specific parameter IDs that are not documented anywhere official. Finding and decoding them was most of the work, and it is why the health score reflects this car specifically instead of a generic engine.',
    },
    {
      tag: 'heat',
      title: 'A Pi in a car gets hot',
      text: 'A sealed armrest in summer is a bad place for a computer. When the Pi heats up, Rune backs off on its own, slowing the analysis it can afford to slow so the parts that matter keep running instead of the whole thing throttling at once.',
    },
  ],
}

export const CLOSE = {
  paragraphs: [
    'Rune runs on every drive. The health score is live, and the safety gate has stopped exactly the mistakes it was built to stop. The demo on the site plays recorded sample data so you can see the screens without my car present; the system behind them is the one in the car.',
    'I keep adding sensors because the feedback is immediate and physical. I change something, I drive, and the car tells me whether I was right.',
  ],
}

// Floating section nav.
export const SECTIONS = [
  { id: 'what', label: 'What it is' },
  { id: 'health', label: 'Reading health' },
  { id: 'anomaly', label: 'Anomalies' },
  { id: 'notes', label: 'Engineering' },
  { id: 'close', label: 'In the car' },
]
