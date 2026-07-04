import type { CSSProperties } from 'react'

// One small figure per project. Calm and precise at rest; on hover each one
// performs its real behavior (a token traces a reach path, a telemetry line
// sweeps, a document redacts itself). The motion is pure CSS driven by the
// `.group` hover on the surrounding card — see the `.kmf-*` rules in globals.css
// — so these stay server-rendered, cheap, and reduced-motion safe (those users
// get the fully-drawn static figure). Color enters as one accent that blooms.
//
// Add a case in SKETCHES when a new project needs a homepage figure.

const VB = '0 0 240 150'
const ink = 'var(--text-secondary)'
const faint = 'var(--border-hover)'
const tint = 'var(--signal-color, var(--accent))'

// Stagger helper: sets the per-element animation delay consumed by the CSS.
const delay = (ms: number): CSSProperties => ({ '--kmf-delay': `${ms}ms` }) as CSSProperties

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg viewBox={VB} className="h-auto w-full" role="img" aria-label={label}>
      {children}
    </svg>
  )
}

// kubereach — a held pod; on hover the signal traces out along each path and the
// cloud resources it can reach light up in turn.
function Kubereach() {
  const rows = [44, 76, 108]
  return (
    <Frame label="A held pod; on hover the reachable cloud resources light up in turn.">
      {rows.map((y, i) => {
        const d = `M68 75 C 112 75, 104 ${y}, 150 ${y}`
        return (
          <g key={y}>
            <path d={d} fill="none" stroke={faint} strokeWidth="1" opacity="0.5" />
            <path
              d={d}
              fill="none"
              stroke={tint}
              strokeWidth="1.4"
              pathLength={1}
              className="kmf-draw kmf-glow"
              style={delay(i * 130)}
            />
            <rect
              x="150"
              y={y - 11}
              width="46"
              height="22"
              rx="5"
              fill="none"
              stroke={ink}
              strokeWidth="1.2"
              className="kmf-node"
              style={delay(360 + i * 130)}
            />
          </g>
        )
      })}
      <rect x="26" y="61" width="42" height="28" rx="7" fill="var(--bg)" stroke={tint} strokeWidth="1.4" className="kmf-glow" />
      <circle cx="35" cy="70" r="2" fill={tint} className="kmf-glow" />
    </Frame>
  )
}

// rune — a live telemetry trace; on hover the accent channel sweeps in over the
// faint resting signal, like an instrument drawing itself.
function Rune() {
  const pts =
    '34,78 54,78 64,54 78,94 92,62 112,62 126,46 140,92 156,60 182,60 196,50 210,72'
  const base =
    '34,94 58,94 72,86 90,98 108,90 128,90 144,84 158,96 176,88 210,90'
  return (
    <Frame label="A live diagnostic trace; on hover the signal sweeps in.">
      <line x1="30" y1="40" x2="30" y2="112" stroke={faint} strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="112" x2="212" y2="112" stroke={faint} strokeWidth="1" opacity="0.6" />
      <polyline points={base} fill="none" stroke={faint} strokeWidth="1.1" opacity="0.5" strokeLinejoin="round" />
      <polyline
        points={pts}
        fill="none"
        stroke={tint}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        className="kmf-draw kmf-glow"
      />
    </Frame>
  )
}

// shipcrew — an orchestrator; on hover it routes out to each agent in turn and
// they answer.
function Shipcrew() {
  const hub = { x: 120, y: 75 }
  const agents = [
    { x: 58, y: 46 },
    { x: 58, y: 104 },
    { x: 182, y: 46 },
    { x: 182, y: 104 },
  ]
  return (
    <Frame label="An orchestrator routing work out to a crew of agents.">
      {agents.map((a, i) => (
        <g key={i}>
          <line x1={hub.x} y1={hub.y} x2={a.x} y2={a.y} stroke={faint} strokeWidth="1" opacity="0.5" />
          <line
            x1={hub.x}
            y1={hub.y}
            x2={a.x}
            y2={a.y}
            stroke={tint}
            strokeWidth="1.3"
            pathLength={1}
            className="kmf-draw kmf-glow"
            style={delay(i * 110)}
          />
          <rect
            x={a.x - 16}
            y={a.y - 10}
            width="32"
            height="20"
            rx="4"
            fill="var(--bg)"
            stroke={ink}
            strokeWidth="1.2"
            className="kmf-node"
            style={delay(360 + i * 110)}
          />
        </g>
      ))}
      <rect x={hub.x - 20} y={hub.y - 14} width="40" height="28" rx="6" fill="var(--bg)" stroke={tint} strokeWidth="1.5" className="kmf-glow" />
      <circle cx={hub.x} cy={hub.y} r="2.6" fill={tint} className="kmf-glow" />
    </Frame>
  )
}

// auris — an ARM64 chip; on hover the syscall stream draws through it.
function Auris() {
  const pins = [0, 1, 2, 3, 4]
  return (
    <Frame label="An ARM64 chip; on hover the syscall stream draws through it.">
      {pins.map((i) => {
        const x = 98 + i * 12
        return (
          <g key={i}>
            <line x1={x} y1="50" x2={x} y2="58" stroke={faint} strokeWidth="1.2" />
            <line x1={x} y1="92" x2={x} y2="100" stroke={faint} strokeWidth="1.2" />
          </g>
        )
      })}
      {pins.map((i) => {
        const y = 62 + i * 5.6
        return (
          <g key={`h${i}`}>
            <line x1="88" y1={y} x2="96" y2={y} stroke={faint} strokeWidth="1.2" />
            <line x1="156" y1={y} x2="164" y2={y} stroke={faint} strokeWidth="1.2" />
          </g>
        )
      })}
      <rect x="96" y="58" width="60" height="34" rx="4" fill="var(--bg)" stroke={ink} strokeWidth="1.4" className="kmf-glow" />
      <line
        x1="30"
        y1="75"
        x2="210"
        y2="75"
        stroke={tint}
        strokeWidth="1.5"
        pathLength={1}
        className="kmf-draw kmf-glow"
      />
    </Frame>
  )
}

// deid — a document; on hover the sensitive fields wipe into redaction.
function Deid() {
  const rows = [
    { y: 46, masked: false, w: 68 },
    { y: 60, masked: true, w: 52 },
    { y: 74, masked: false, w: 60 },
    { y: 88, masked: true, w: 44 },
    { y: 102, masked: true, w: 64 },
  ]
  let mi = 0
  return (
    <Frame label="A document; on hover its sensitive fields redact themselves.">
      <rect x="84" y="32" width="94" height="96" rx="4" fill="var(--bg)" stroke={ink} strokeWidth="1.4" />
      {rows.map((r, i) => (
        <line key={i} x1="96" y1={r.y + 3} x2={96 + r.w} y2={r.y + 3} stroke={faint} strokeWidth="1.4" opacity="0.7" />
      ))}
      {rows.map((r, i) => {
        if (!r.masked) return null
        const d = delay(mi * 140)
        mi += 1
        return (
          <rect
            key={`m${i}`}
            x="96"
            y={r.y}
            width={r.w}
            height="6"
            rx="2"
            fill={tint}
            opacity="0.8"
            className="kmf-mask kmf-glow"
            style={d}
          />
        )
      })}
    </Frame>
  )
}

// kintsugi — a field of days; on hover a golden seam of kept days draws across it
// and the cells it threads light up.
function Kintsugi() {
  const cells: { x: number; y: number; c: number; r: number }[] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 7; c++) {
      cells.push({ x: 60 + c * 17, y: 42 + r * 17, c, r })
    }
  }
  // The kept run, bottom-left rising to top-right (cell centers).
  const kept = [
    { c: 0, r: 3 },
    { c: 2, r: 2 },
    { c: 4, r: 1 },
    { c: 6, r: 0 },
  ]
  const isKept = (c: number, r: number) => kept.some((k) => k.c === c && k.r === r)
  const center = (c: number, r: number) => ({ x: 66 + c * 17, y: 48 + r * 17 })
  const seam = kept.map((k, i) => {
    const p = center(k.c, k.r)
    return `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`
  }).join(' ')
  return (
    <Frame label="A field of days; on hover the kept-streak seam draws across it.">
      {cells.map((cell, i) =>
        isKept(cell.c, cell.r) ? (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width="12"
            height="12"
            rx="2.5"
            fill={tint}
            className="kmf-node kmf-glow"
            style={delay(200 + kept.findIndex((k) => k.c === cell.c && k.r === cell.r) * 150)}
          />
        ) : (
          <rect key={i} x={cell.x} y={cell.y} width="12" height="12" rx="2.5" fill="none" stroke={faint} strokeWidth="1" opacity="0.7" />
        ),
      )}
      <path d={seam} fill="none" stroke={tint} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="kmf-draw kmf-glow" />
    </Frame>
  )
}

// untilithappens — a small network; on hover the links resolve and one node
// hardens (its ring draws closed).
function UntilItHappens() {
  const hub = { x: 120, y: 76 }
  const nodes = [
    { x: 78, y: 52 },
    { x: 162, y: 50 },
    { x: 172, y: 98 },
    { x: 90, y: 104 },
  ]
  return (
    <Frame label="A small network; on hover one node hardens.">
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={hub.x} y1={hub.y} x2={n.x} y2={n.y} stroke={faint} strokeWidth="1" opacity="0.5" />
          <line
            x1={hub.x}
            y1={hub.y}
            x2={n.x}
            y2={n.y}
            stroke={tint}
            strokeWidth="1.2"
            pathLength={1}
            className="kmf-draw"
            style={delay(i * 100)}
          />
          <circle cx={n.x} cy={n.y} r="3.4" fill="var(--bg)" stroke={ink} strokeWidth="1.2" className="kmf-node" style={delay(340 + i * 100)} />
        </g>
      ))}
      <circle
        cx={hub.x}
        cy={hub.y}
        r="10"
        fill="none"
        stroke={tint}
        strokeWidth="1.5"
        pathLength={1}
        className="kmf-draw kmf-glow"
        style={delay(480)}
      />
      <circle cx={hub.x} cy={hub.y} r="3" fill={tint} className="kmf-glow" />
    </Frame>
  )
}

const SKETCHES: Record<string, () => React.JSX.Element> = {
  kubereach: Kubereach,
  rune: Rune,
  shipcrew: Shipcrew,
  auris: Auris,
  kintsugi: Kintsugi,
  untilithappens: UntilItHappens,
  deid: Deid,
}

export function ProjectSchematic({ slug }: { slug: string }) {
  const Sketch = SKETCHES[slug]
  if (!Sketch) return null
  return <Sketch />
}

export function hasSchematic(slug: string): boolean {
  return slug in SKETCHES
}
