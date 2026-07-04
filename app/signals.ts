
// ── Types ──

/**
 * Every entry in the lab is a Signal: a dated, versioned record with a stable
 * permalink (`id`, format KM-YYYY-NNNN), a URL-friendly `slug`, a lifecycle
 * `state`, and optional provenance (GitHub repos, signing commit).
 *
 * The legacy `status` field is preserved so components that haven't been
 * rewritten yet keep rendering while routes migrate to `/signals/[id]` over
 * time. New UI should use `state`.
 *
 * Deviation from plan: the plan used `title`/`summary`/`body`. This file keeps
 * the existing `name`/`tagline`/`description` to avoid churning six legacy
 * consumers. Semantics are identical; rename is deferred to a future pass.
 */
export type SignalState = 'active' | 'shipped' | 'paused' | 'archived'
export type SignalType = 'project' | 'finding' | 'thought' | 'ship'

/**
 * Long-form writeup, authored as an ordered list of blocks so a detail page can
 * render real prose, diagrams, and code-style figures without an MDX pipeline.
 * Only set on entries that have a full article; most signals leave `article` null
 * and rely on `description` alone.
 *
 * - prose:    a paragraph of body text
 * - heading:  a section break
 * - ascii:    a monospace figure (box-drawing / terminal output), matches the ledger aesthetic
 * - diagram:  a raw inline SVG string (themed via CSS vars so it adapts light/dark)
 * - callout:  a labelled aside (note, caveat, scope statement)
 * - steps:    an ordered chain of short lines
 */
export type ArticleBlock =
  | { kind: 'prose'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'ascii'; title?: string; art: string }
  | { kind: 'diagram'; title?: string; svg: string }
  | { kind: 'callout'; label: string; text: string }
  | { kind: 'steps'; items: string[] }

export type Signal = {
  // Identity
  id: string // 'KM-2024-0001' — stable permalink, format: KM-YYYY-NNNN
  slug: string // URL-friendly slug (e.g., 'rune') — used by /apps/[slug]
  type: SignalType
  name: string
  tagline: string
  description: string

  // Lifecycle
  state: SignalState
  // Legacy status surface; new UI should use `state` instead.
  status: 'live' | 'beta' | 'building' | 'personal'
  // Optional human phrase shown next to the state label (e.g. "open for more ideas").
  // The state gives the color/word; this gives the nuance.
  statusNote?: string | null
  dateFirst: string // ISO 8601 — when the signal started
  dateLast: string // ISO 8601 — last meaningful update

  // Provenance
  repos: string[] // e.g., ['kuladeepmantri/auris'] — resolved at build time
  signatureRef: string | null // commit SHA of a signed commit anchoring this entry

  // Presentation
  link: string | null
  image: string | null
  video: string | null
  embedUrl: string | null
  accentColor: string
  tags: string[]
  deviceType: 'iphone' | 'browser'
  collaborator: { name: string; github: string } | null

  // Optional long-form writeup rendered on the detail page (see ArticleBlock).
  article?: ArticleBlock[] | null

  // Populated only for type='finding' or security-research projects
  advisory?: {
    affectedSystems: string[]
    impact: string
    mitigation: string
  }
}

// Backward-compat alias so pre-rename imports of AppProject keep resolving.
export type AppProject = Signal

export type SocialLink = {
  label: 'GitHub' | 'Instagram'
  link: string
}

type Certification = {
  id: string
  name: string
  issuer: string
  link: string
}

export const STATUS_DOT: Record<AppProject['status'], string> = {
  live: 'bg-emerald-400',
  beta: 'bg-yellow-400',
  building: 'bg-zinc-500',
  personal: 'bg-violet-400',
}

export const STATUS_LABEL: Record<AppProject['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  building: 'In Development',
  personal: 'On-device',
}

// Semantic labels for the signal state lifecycle (new UI).
export const STATE_LABEL: Record<SignalState, string> = {
  active: 'Active',
  shipped: 'Shipped',
  paused: 'Paused',
  archived: 'Archived',
}

// ── Data ──

// IDs assigned in chronological order of creation (dateFirst) so a reader
// scanning the log sees ID and year move in the same direction even though
// the log itself is sorted by last-updated.
export const SIGNALS: Signal[] = [
  {
    id: 'KM-2026-0006',
    slug: 'kubereach',
    type: 'project',
    name: 'kubereach',
    tagline: 'Kubernetes Foothold-to-Cloud Recon',
    description:
      'A post-foothold Kubernetes recon technique: drop into one compromised pod, map what the stolen identity can actually reach, and follow the trail out into the AWS account behind the cluster. The two hardest parts are proven against real infrastructure.',
    state: 'active',
    status: 'building',
    statusNote: 'proven against real infra · shaping the tool',
    dateFirst: '2026-06-27',
    dateLast: '2026-07-03',
    repos: ['getnullpkg/kubereach'],
    signatureRef: null,
    link: 'https://github.com/getnullpkg/kubereach',
    image: null,
    video: null,
    embedUrl: null,
    accentColor: '#fb7185',
    tags: [
      'Go',
      'Kubernetes',
      'AWS',
      'EKS',
      'IRSA',
      'RBAC',
      'Offensive Security',
    ],
    deviceType: 'browser',
    collaborator: null,
    advisory: {
      affectedSystems: [
        'Amazon EKS clusters using IRSA (IAM Roles for Service Accounts)',
        'Any managed Kubernetes (EKS / GKE / AKS) where tooling trusts SelfSubjectRulesReview behind a webhook authorizer',
      ],
      impact:
        "Two findings, both proven in a lab. First: a token read from a single pod can be redeemed off-cluster for that pod's full cloud permissions, with no path back to the cluster. Second: permission-enumeration tools that trust SelfSubjectRulesReview under-report what a stolen identity can do on any cluster with a webhook authorizer, which is the norm on managed Kubernetes.",
      mitigation:
        'Prefer EKS Pod Identity over IRSA, since its tokens are cluster-bound and cannot be redeemed off-box. Scope workload IAM roles tightly and alert on AssumeRoleWithWebIdentity calls from unexpected networks. When auditing blast radius, probe permissions with SelfSubjectAccessReview per action rather than trusting the summarized rule list.',
    },
  },
  {
    id: 'KM-2026-0005',
    slug: 'rune',
    type: 'project',
    name: 'Rune',
    tagline: 'Real-Time Vehicle Diagnostics',
    description:
      'Real-time diagnostic system for a 2026 Honda Accord SE. A Raspberry Pi 4B in the armrest streams OBD-II data through three layers of health analysis (threshold checks, streaming anomaly detection, trend forecasting) to a React PWA on a mounted Pixel 6 Pro, with a 3D visualization of subsystem health zones and sensor fusion across vibration, audio, and environmental data.',
    state: 'active',
    status: 'live',
    statusNote: 'in daily use · adding sensors',
    dateFirst: '2026-01-15',
    dateLast: '2026-04-10',
    repos: ['kuladeepmantri/rune'],
    signatureRef: null,
    link: 'https://rune.kuladeepmantri.com/',
    image: null,
    video: null,
    embedUrl: 'https://rune.kuladeepmantri.com/',
    accentColor: '#4ade80',
    tags: ['React', 'Three.js', 'FastAPI', 'Python', 'Raspberry Pi', 'OBD-II'],
    deviceType: 'browser',
    collaborator: null,
  },
  {
    id: 'KM-2025-0003',
    slug: 'shipcrew',
    type: 'project',
    name: 'ShipCrew',
    tagline: 'Multi-Agent AI Dev Team',
    description:
      'A Slack-shaped room of named Claude agents that take tasks, review each other, and ship. Message routing, live token streaming, per-agent memory and budgets, automatic handoffs. Built with Abhishek Manyam.',
    state: 'active',
    status: 'building',
    statusNote: 'working prototype',
    dateFirst: '2025-01-01',
    dateLast: '2026-04-15',
    repos: ['kuladeepmantri/shipcrew'],
    signatureRef: null,
    link: null,
    image: '/images/shipmate.png',
    video: null,
    embedUrl: null,
    accentColor: '#818cf8',
    tags: ['Next.js', 'Express', 'Claude SDK', 'WebSocket', 'Docker'],
    deviceType: 'browser',
    collaborator: {
      name: 'Abhishek Manyam',
      github: 'https://github.com/abhishekmanyam',
    },
  },
  {
    id: 'KM-2024-0002',
    slug: 'auris',
    type: 'project',
    name: 'Auris',
    tagline: 'ARM64 Linux Security Toolkit',
    description:
      'Syscall tracer and security analyzer for ARM64 Linux. Covers both defense (behavioral profiling, anomaly detection) and offense (process injection, ROP gadget scanning).',
    state: 'shipped',
    status: 'live',
    statusNote: 'runs on ARM64',
    dateFirst: '2024-09-01',
    dateLast: '2025-11-15',
    repos: ['kuladeepmantri/auris'],
    signatureRef: null,
    link: 'https://auris.kuladeepmantri.com/',
    image: '/images/auris.png',
    video: null,
    embedUrl: null,
    accentColor: '#c084fc',
    tags: ['C', 'ARM64', 'ptrace', 'eBPF', 'Next.js'],
    deviceType: 'browser',
    collaborator: null,
    advisory: {
      affectedSystems: [
        'ARM64 Linux userspace binaries',
        'Production workloads on aarch64 servers',
      ],
      impact:
        'Demonstrates fine-grained syscall tracing, behavioral profiling, process injection, and ROP gadget scanning on ARM64. Covers both defensive observability (anomaly detection across syscall sequences) and offensive tooling (gadget enumeration, injected-code measurement).',
      mitigation:
        'Apply standard ARM64 exploit mitigations: ASLR, PAC (Pointer Authentication), BTI (Branch Target Identification), W^X. Monitor for anomalous ptrace() / process_vm_writev() usage. Harden seccomp-bpf profiles around ptrace scope. Auris itself can be used defensively to baseline normal syscall patterns.',
    },
  },
  {
    id: 'KM-2026-0004',
    slug: 'kintsugi',
    // Note: kept at 0004 (Kintsugi predates Rune by a few days). Rune is 0005.
    type: 'project',
    name: 'Kintsugi',
    tagline: 'On-device Recovery Tracker',
    description:
      'Recovery tracker with streak tracking, a panic mode for tough moments, and journaling with mood analysis. Built with SwiftUI and iOS 26 Liquid Glass.',
    state: 'active',
    status: 'personal',
    statusNote: 'on-device tracker',
    dateFirst: '2026-01-10',
    dateLast: '2026-03-22',
    repos: [],
    signatureRef: null,
    link: null,
    image: null,
    video: '/videos/kintsugi.mp4',
    embedUrl: null,
    accentColor: '#a78bfa',
    tags: ['SwiftUI', 'iOS 26', 'Liquid Glass', 'NLP', 'SwiftData'],
    deviceType: 'iphone',
    collaborator: null,
  },
  {
    id: 'KM-2024-0001',
    slug: 'untilithappens',
    type: 'project',
    name: 'untilithappens.org',
    tagline: 'Digital Safety Platform',
    description:
      'Practical digital safety guides and tools. Plain-language security without the jargon.',
    state: 'shipped',
    status: 'live',
    statusNote: 'live',
    dateFirst: '2024-03-01',
    dateLast: '2024-10-15',
    repos: ['kuladeepmantri/untilithappens'],
    signatureRef: null,
    link: 'https://untilithappens.kuladeepmantri.com/',
    image: '/images/untilithappens.png',
    video: null,
    embedUrl: null,
    accentColor: '#e879f9',
    tags: ['Next.js', 'Security UX', 'Education'],
    deviceType: 'browser',
    collaborator: null,
  },
  {
    id: 'KM-2023-0001',
    slug: 'deid',
    type: 'project',
    name: 'DeID-Anonymizer',
    tagline: 'PII masking service',
    description:
      'A PII de-identification service: a FastAPI endpoint that detects and masks personal data, behind a queue and object storage. Regex detection today, with the pipeline scaffolded for NER.',
    state: 'archived',
    status: 'building',
    statusNote: 'regex detection · scaffolded for NER',
    dateFirst: '2023-04-26',
    dateLast: '2025-08-11',
    repos: ['kuladeepmantri/DeID-Anonymizer'],
    signatureRef: null,
    link: null,
    image: null,
    video: null,
    embedUrl: null,
    accentColor: '#b58a5e',
    tags: ['FastAPI', 'Celery', 'React'],
    deviceType: 'browser',
    collaborator: null,
  },
]

// Back-compat name — PROJECTS used to be the canonical export.
export const PROJECTS = SIGNALS

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'ceh',
    name: 'Certified Ethical Hacker',
    issuer: 'EC-Council',
    link: 'https://aspen.eccouncil.org/Verify',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', link: 'https://github.com/kuladeepmantri' },
  { label: 'Instagram', link: 'https://www.instagram.com/kuladeep.mantri/' },
]

export const EMAIL = 'kuladeepbmantri@gmail.com'

// ── Helpers ──

export function findSignalById(id: string): Signal | undefined {
  return SIGNALS.find((s) => s.id.toUpperCase() === id.toUpperCase())
}

export function findSignalBySlug(slug: string): Signal | undefined {
  return SIGNALS.find((s) => s.slug === slug)
}

/**
 * Sorted by when each signal was started (dateFirst), newest first.
 * The log shows "started MON YYYY" per row, so this sort keeps the visible
 * date monotonic top-to-bottom.
 */
export function sortedByStart(): Signal[] {
  return [...SIGNALS].sort(
    (a, b) =>
      new Date(b.dateFirst).getTime() - new Date(a.dateFirst).getTime()
  )
}

/**
 * Back-compat alias. Prefer `sortedByStart`.
 */
export const sortedByRecency = sortedByStart
