// Single source for the auris page. Facts verified against the repo:
// ARM64 ptrace tracer, C11, Apache-2.0. Copy is confident and about the tech.

export const HERO = {
  eyebrow: 'auris · KM-2024-0002 · syscall tracer',
  headline: 'Watching a program by every system call it makes',
  sub: 'Auris sits above a running ARM64 process and records every syscall it asks the kernel for. From that stream it learns what normal looks like, flags what is not, and blocks calls the program was never meant to make.',
  meta: ['ARM64 Linux', 'ptrace', 'C11', 'live enforcement'],
  live: 'https://auris.kuladeepmantri.com/',
}

export const INTRO = {
  paragraphs: [
    'Everything a program does to the outside world goes through a system call. Open a file, open a socket, start another process, change memory permissions. The names on your screen are wrappers. Underneath, it is a few hundred numbered requests to the kernel, and that list is the truest description of what a program is actually doing.',
    'Auris listens to exactly that. It attaches to an ARM64 process through ptrace and stops it at the boundary of every call. It reads the call number from register x8, the arguments from x0 through x5, the return from x0, and records what happened with timing. No kernel module, no patching the target. It stands at the doorway and notes everyone who passes.',
  ],
}

export const MODES = {
  intro:
    'The tracer is the foundation. Every mode is built on the same syscall stream, and they chain.',
  items: [
    { tag: 'learn', text: 'Run a program and record its full syscall trace.' },
    { tag: 'profile', text: 'Turn traces into a behavioral baseline: which calls, how often, in what shape.' },
    { tag: 'compare', text: 'Run it again and diff against the baseline. What is new, what spiked, what went quiet.' },
    { tag: 'policy', text: 'Generate an allowlist from a profile: the exact calls this program may make.' },
    { tag: 'enforce', text: 'Run under that policy. In block mode a disallowed call never reaches the kernel.' },
    { tag: 'analyze', text: 'Hand a profile to a local LLM for a plain-language read of the behavior.' },
  ],
}

// Anomaly types, for the detection band.
export const ANOMALIES = [
  { k: 'new syscall', v: 'a call the baseline never made', score: '0.7' },
  { k: 'frequency spike', v: 'more than 3x the baseline rate', score: 'scaled' },
  { k: 'frequency drop', v: 'below 0.1x the baseline rate', score: 'scaled' },
  { k: 'sensitive access', v: 'a high-sensitivity path touched', score: '0.8' },
]

export const ANOMALY_NOTE =
  'This is statistics, not machine learning, on purpose. A new syscall, a rate past three times the baseline, a drop below a tenth of it, a read of a path marked sensitive. Each carries a severity, and they roll up into a deviation score. Simple enough that I can explain every number it produces.'

export const ENFORCE = {
  intro:
    'Enforcement acts inside the same ptrace stop where it observed the call. When a program under a block policy tries a syscall that is not on its allowlist, Auris rewrites the registers before the kernel runs it: the call number in x8 goes to an invalid value, the return in x0 is set to -EPERM. The program gets a clean permission-denied, and the dangerous call never happened.',
  command: 'auris enforce -P <policy-id> -m block -- ./myapp',
}

export const OFFENSIVE = {
  intro:
    'A second build adds an offensive toolkit. What is wired, and what is scaffolded:',
  items: [
    {
      tag: 'process injection',
      real: true,
      text: 'Wired. It attaches to a running process, finds a code cave, writes shellcode word by word, points the program counter at it, and reads the result from x0. Real ptrace surgery.',
    },
    {
      tag: 'shellcode',
      real: true,
      text: 'Wired. Hand-assembled ARM64 machine code: exec, reverse shell, bind shell, with documented offsets to patch in an address and port.',
    },
    {
      tag: 'ROP gadget finder',
      real: false,
      text: 'Partial. It maps an ELF, walks the executable segments, and finds gadgets ending in ret, svc, or blr. The chain builder is a template. It finds the pieces; it does not assemble the exploit.',
    },
  ],
}

export const CLOSE = {
  paragraphs: [
    'The tracer, the profiler, the compare, and block-mode enforcement all run on ARM64. What Auris settles is that behavioral profiling from raw syscalls is both tractable and readable.',
    'You do not need a model to catch a program doing something it has never done before. You need the stream, a baseline, and the discipline to act at the exact moment the call is made.',
  ],
}

export const SECTIONS = [
  { id: 'what', label: 'What it is' },
  { id: 'modes', label: 'The modes' },
  { id: 'anomaly', label: 'Detection' },
  { id: 'enforce', label: 'Enforcement' },
  { id: 'offensive', label: 'Offensive build' },
  { id: 'close', label: 'What it settles' },
]
