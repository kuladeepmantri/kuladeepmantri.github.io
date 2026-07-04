'use client'

// Hand-authored wireframe visuals for the auris page. The hero is a syscall
// stream leaving a traced process and passing through the tracer into the
// analyzer; the second is the ptrace stop loop. Mono labels, dot-grid, the
// ember tint on the live signal. Animations respect reduced-motion globally.

const CALLS = ['openat', 'read', 'execve', 'connect', 'mmap', 'write', 'close']

function DotField({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <>
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.5" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill={`url(#${id})`} />
    </>
  )
}

// ── Hero: the syscall stream ──
export function SyscallStream() {
  return (
    <svg
      viewBox="0 0 1000 210"
      className="h-auto w-full"
      role="img"
      aria-label="Syscalls leaving a traced process, passing through the tracer, into the analyzer."
    >
      <DotField id="auris-hero-grid" w={1000} h={210} />

      <text x="40" y="30" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11" letterSpacing="0.2em">EVERY SYSTEM CALL, AS IT HAPPENS</text>

      {/* target process — centered on the stream line at y=130 */}
      <rect x="40" y="90" width="180" height="80" rx="10" fill="var(--bg)" stroke="var(--border-hover)" />
      <text x="60" y="125" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="15" fontWeight="600">./myapp</text>
      <text x="60" y="148" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">traced process</text>

      {/* tracer */}
      <rect x="410" y="80" width="180" height="100" rx="10" fill="var(--bg)" stroke="var(--signal-color,var(--accent))" strokeWidth="1.5" />
      <text x="430" y="118" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="15" fontWeight="600">auris</text>
      <text x="430" y="140" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">ptrace tracer</text>
      <text x="430" y="160" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">x8 · x0–x5</text>

      {/* analyzer */}
      <rect x="780" y="90" width="180" height="80" rx="10" fill="var(--bg)" stroke="var(--border-hover)" />
      <text x="800" y="125" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="15" fontWeight="600">profile</text>
      <text x="800" y="148" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">baseline · anomalies</text>

      {/* stream: process -> tracer */}
      <line x1="220" y1="130" x2="410" y2="130" stroke="var(--border-hover)" />
      {CALLS.map((c, i) => (
        <g key={c}>
          <circle r="3" fill="var(--signal-color,var(--accent))">
            <animateMotion dur="2.6s" begin={`${i * 0.34}s`} repeatCount="indefinite" path="M 220 130 L 410 130" />
          </circle>
        </g>
      ))}
      {/* a couple of labelled calls riding along */}
      <text x="250" y="116" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">openat</text>
      <text x="320" y="116" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">execve</text>

      {/* tracer -> analyzer */}
      <line x1="590" y1="130" x2="780" y2="130" stroke="var(--border-hover)" />
      <circle r="3" fill="var(--signal-color,var(--accent))">
        <animateMotion dur="2.2s" repeatCount="indefinite" path="M 590 130 L 780 130" />
      </circle>
    </svg>
  )
}

// ── The ptrace stop loop ──
export function PtraceLoop() {
  return (
    <svg
      viewBox="0 0 900 300"
      className="hidden h-auto w-full md:block"
      role="img"
      aria-label="The ptrace loop: the tracer stops the target at each syscall entry and exit."
    >
      <DotField id="auris-loop-grid" w={900} h={300} />
      <rect x="60" y="110" width="200" height="90" rx="10" fill="var(--bg)" stroke="var(--border-hover)" />
      <text x="80" y="150" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">target</text>
      <text x="80" y="172" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">PTRACE_TRACEME</text>

      <rect x="640" y="110" width="200" height="90" rx="10" fill="var(--bg)" stroke="var(--signal-color,var(--accent))" strokeWidth="1.5" />
      <text x="660" y="150" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">tracer</text>
      <text x="660" y="172" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">waitpid · PTRACE_SYSCALL</text>

      {/* entry stop */}
      <path d="M 260 135 L 640 135" stroke="var(--border-hover)" fill="none" markerEnd="url(#auris-arrow)" />
      <text x="360" y="126" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">stop at entry · read x8, x0–x5</text>
      {/* exit stop */}
      <path d="M 640 178 L 260 178" stroke="var(--border-hover)" fill="none" markerEnd="url(#auris-arrow)" />
      <text x="360" y="198" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">stop at exit · read x0, timing</text>
      <defs>
        <marker id="auris-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--border-hover)" />
        </marker>
      </defs>
    </svg>
  )
}

export function PtraceLoopPortrait() {
  return (
    <svg
      viewBox="0 0 360 420"
      className="mx-auto block h-auto w-full max-w-[340px] md:hidden"
      role="img"
      aria-label="The ptrace loop: the tracer stops the target at each syscall entry and exit."
    >
      <DotField id="auris-loop-grid-p" w={360} h={420} />
      <rect x="90" y="30" width="180" height="80" rx="10" fill="var(--bg)" stroke="var(--border-hover)" />
      <text x="110" y="66" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">target</text>
      <text x="110" y="88" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="10">PTRACE_TRACEME</text>

      <rect x="90" y="310" width="180" height="80" rx="10" fill="var(--bg)" stroke="var(--signal-color,var(--accent))" strokeWidth="1.5" />
      <text x="110" y="346" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">tracer</text>
      <text x="110" y="368" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="10">PTRACE_SYSCALL</text>

      <line x1="150" y1="110" x2="150" y2="310" stroke="var(--border-hover)" />
      <text x="165" y="180" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="10">entry · x8, x0–x5</text>
      <text x="165" y="250" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="10">exit · x0, timing</text>
    </svg>
  )
}
