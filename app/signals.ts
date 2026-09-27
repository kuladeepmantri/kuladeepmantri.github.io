// The content source for the whole site. Every project page, the Work list,
// the feeds, and the sitemap read from SIGNALS. Live data (pushes, commits)
// comes from lib/generated/live.ts and is matched to projects by `repos`.

export type SignalState = 'active' | 'shipped' | 'paused' | 'archived'

export type Signal = {
  id: string // KM-YYYY-NNNN, assigned in order of dateFirst
  slug: string
  type: 'project'
  name: string
  line: string // row subtitle in the Work list and the project lead
  tagline: string // feeds
  body: string // the project pane paragraph
  description: string // feeds and meta description
  state: SignalState
  stateLabel: string
  stack: string
  dateFirst: string
  dateLast: string
  repos: string[]
  links: { label: string; href: string }[]
  // Add a Source link to the repo, but only if the build confirms it is public.
  sourceIfPublic?: boolean
  quietNote?: string
  repoNote?: string
  collaborator?: { name: string; href: string }
  tags: string[]
}

export const SIGNALS: Signal[] = [
  {
    id: 'KM-2026-0006',
    slug: 'kubereach',
    type: 'project',
    name: 'kubereach',
    line: 'What a stolen Kubernetes pod can really reach',
    tagline: 'Kubernetes foothold to cloud recon',
    body: 'If someone gets a shell inside one pod, what can they actually get to from there? kubereach works that out. It checks what the pod’s identity is really allowed to do, then follows it into the AWS account behind the cluster. Before writing the tool I tested the two ideas it rests on against a real EKS cluster. The permission summary most tools rely on misses access on managed clusters, and an IRSA token taken off a pod still works from a laptop outside the cluster, with the pod’s full AWS role.',
    description:
      'Post-foothold Kubernetes recon: map what one compromised pod’s identity can reach, then follow it into the AWS account behind the cluster.',
    state: 'active',
    stateLabel: 'Active',
    stack: 'Go · Kubernetes · AWS',
    dateFirst: '2026-06-27',
    dateLast: '2026-07-03',
    repos: ['getnullpkg/kubereach'],
    links: [
      { label: 'Open repository', href: 'https://github.com/getnullpkg/kubereach' },
    ],
    tags: ['Go', 'Kubernetes', 'AWS', 'EKS', 'IRSA', 'RBAC'],
  },
  {
    id: 'KM-2026-0005',
    slug: 'rune',
    type: 'project',
    name: 'Rune',
    line: 'Live diagnostics for my car',
    tagline: 'Real-time vehicle diagnostics',
    body: 'My car knows a lot about itself and shows me almost none of it, so I built Rune. A Raspberry Pi 4B in the armrest of my 2026 Accord reads the engine data and checks it three ways: against safe ranges, with a streaming anomaly model, and with slow trend forecasts. A phone on the dash shows the result as a live health score. Anything sent back to the car has to pass an allowlist first.',
    description:
      'Real-time diagnostics for a 2026 Honda Accord: a Raspberry Pi reads the engine data, runs three layers of analysis, and shows a live health score on the dash.',
    state: 'active',
    stateLabel: 'In daily use',
    stack: 'Python · Raspberry Pi · React',
    dateFirst: '2026-01-15',
    dateLast: '2026-04-10',
    repos: ['kuladeepmantri/rune'],
    links: [{ label: 'Open site', href: 'https://rune.kuladeepmantri.com/' }],
    quietNote: 'The repo is private, so its commits stay off this page.',
    tags: ['Python', 'Raspberry Pi', 'OBD-II', 'React', 'FastAPI'],
  },
  {
    id: 'KM-2025-0003',
    slug: 'shipcrew',
    type: 'project',
    name: 'ShipCrew',
    line: 'A team of Claude agents that ships code',
    tagline: 'Multi-agent dev team',
    body: 'A Slack-style workspace where the team is Claude agents: a project manager, a few developers, and a reviewer. They pick up tasks, hand work to each other, and review each other’s output. I built the agent side: the router that decides who answers, the executor on the Claude Agent SDK, the MCP tools, and streaming. Abhishek Manyam built auth, storage, and the frontend.',
    description:
      'A Slack-style workspace of named Claude agents that take tasks, hand off work, and review each other. Built with Abhishek Manyam.',
    state: 'active',
    stateLabel: 'Prototype',
    stack: 'TypeScript · Claude Agent SDK',
    dateFirst: '2025-01-01',
    dateLast: '2026-04-15',
    repos: ['shipcrew-ai/shipcrew'],
    links: [],
    sourceIfPublic: true,
    collaborator: {
      name: 'Abhishek Manyam',
      href: 'https://github.com/abhishekmanyam',
    },
    tags: ['TypeScript', 'Claude Agent SDK', 'MCP', 'multi-agent'],
  },
  {
    id: 'KM-2026-0004',
    slug: 'kintsugi',
    type: 'project',
    name: 'Kintsugi',
    line: 'A private recovery tracker for iOS',
    tagline: 'Personal recovery tracker',
    body: 'I built this one for myself and use it every day. There’s no account, no server, and no analytics. Even the sentiment analysis on journal entries runs on Apple’s on-device NaturalLanguage framework, so nothing I write leaves the phone.',
    description:
      'A personal iOS recovery tracker that keeps everything on the device, including the sentiment analysis on journal entries.',
    state: 'active',
    stateLabel: 'Personal',
    stack: 'Swift · SwiftUI',
    dateFirst: '2026-01-10',
    dateLast: '2026-03-22',
    repos: [],
    links: [],
    quietNote: 'The repo is private, so its commits stay off this page.',
    tags: ['Swift', 'SwiftUI', 'SwiftData', 'on-device NLP'],
  },
  {
    id: 'KM-2024-0002',
    slug: 'auris',
    type: 'project',
    name: 'Auris',
    line: 'Syscall tracer for ARM64 Linux',
    tagline: 'ARM64 syscall tracer',
    body: 'Every program talks to the kernel through system calls, so that’s where Auris watches. It attaches to an ARM64 process with ptrace, records each call, and builds a baseline of what normal looks like. From there it flags anything new, and in block mode it rewrites the registers so a call that isn’t allowed never reaches the kernel.',
    description:
      'An ARM64 Linux syscall tracer: records every system call a process makes, baselines normal behavior, flags what is new, and can block disallowed calls.',
    state: 'shipped',
    stateLabel: 'Shipped',
    stack: 'C · ptrace · ARM64',
    dateFirst: '2024-09-01',
    dateLast: '2025-11-15',
    repos: ['kuladeepmantri/auris'],
    links: [
      { label: 'Open site', href: 'https://auris.kuladeepmantri.com/' },
      { label: 'Source', href: 'https://github.com/kuladeepmantri/auris' },
    ],
    quietNote: 'Shipped and stable. No pushes in the last few months.',
    tags: ['C', 'ARM64', 'ptrace', 'Linux'],
  },
  {
    id: 'KM-2024-0001',
    slug: 'untilithappens',
    type: 'project',
    name: 'untilithappens.org',
    line: 'Online safety guides in plain language',
    tagline: 'Plain-language cyber safety',
    body: 'Most security advice is written for people who already understand security. This site is for everyone else: short guided steps on what to do now, what to avoid, and what to do if something already happened. Every claim is dated and links to an official source like the FTC, the FBI’s IC3, or CISA.',
    description:
      'Plain-language online safety guides for people who were never taught security, with every claim linked to an official source.',
    state: 'shipped',
    stateLabel: 'Live',
    stack: 'Next.js',
    dateFirst: '2024-03-01',
    dateLast: '2024-10-15',
    repos: ['kuladeepmantri/untilithappens.org'],
    links: [
      { label: 'Open site', href: 'https://untilithappens.kuladeepmantri.com/' },
    ],
    quietNote: 'Live and stable.',
    tags: ['Next.js', 'security education'],
  },
  {
    id: 'KM-2023-0001',
    slug: 'deid',
    type: 'project',
    name: 'DeID',
    line: 'PII masking service',
    tagline: 'PII masking service',
    body: 'A FastAPI service that finds personal data in text, like emails and phone numbers, and masks it. Detection is regex for now. The job queue and object storage are already wired in for a proper NER model to take its place.',
    description:
      'A FastAPI service that detects and masks personal data in text, with a queue and object storage in place for NER.',
    state: 'archived',
    stateLabel: 'Archived',
    stack: 'Python · FastAPI',
    dateFirst: '2023-04-26',
    dateLast: '2025-08-11',
    repos: ['kuladeepmantri/DeID-Anonymizer'],
    links: [],
    sourceIfPublic: true,
    quietNote: 'Archived.',
    tags: ['Python', 'FastAPI', 'Celery', 'PII'],
  },
]

// Sentence one, as plain text for meta descriptions. The page renders it with
// "Kuladeep" as a link, in components/site/intro.tsx; keep the two in sync.
export const SENTENCE_ONE =
  'I’m Kuladeep, a cybersecurity engineer in Michigan. I build security tools, and lately I’ve been studying how AI systems fail.'

// The Now line on the home page. Update both together.
export const NOW =
  'Learning how to monitor and contain AI agents while they run, and building small tools along the way.'
export const NOW_UPDATED = '2026-09-27'

export const EMAIL = 'mantrikuladeep@gmail.com'
export const GITHUB_USER = 'kuladeepmantri'
export const X_HANDLE = 'kuladeepmantri'
export const INSTAGRAM = {
  handle: 'kuladeep.mantri',
  href: 'https://www.instagram.com/kuladeep.mantri/',
}

export function findSignalBySlug(slug: string): Signal | undefined {
  return SIGNALS.find((s) => s.slug === slug)
}

/** Newest dateFirst first. Feeds and anything chronological use this. */
export function sortedByStart(): Signal[] {
  return [...SIGNALS].sort(
    (a, b) => new Date(b.dateFirst).getTime() - new Date(a.dateFirst).getTime(),
  )
}

/** The slim shape client components need (keeps bodies out of the JS bundle). */
export type ProjectRef = Pick<Signal, 'slug' | 'name' | 'line' | 'repos' | 'dateLast'>

export function projectRefs(): ProjectRef[] {
  return SIGNALS.map(({ slug, name, line, repos, dateLast }) => ({
    slug,
    name,
    line,
    repos,
    dateLast,
  }))
}
