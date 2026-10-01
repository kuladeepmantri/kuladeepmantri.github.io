// The content source for the whole site. The Projects index
// (components/home/projects.tsx), the GitHub tab, the slider, and the feeds
// read from SIGNALS. Live data (commits, releases, stars) comes from
// lib/generated/live.ts and is matched to projects by `repos`.
//
// Only public repos go in `repos`: the names reach the page's payload and the
// JSON feed. A project with a private repo uses `repos: []` (like Kintsugi);
// scripts/fetch-live.ts warns in CI if a listed repo is private.

export type SignalState = 'active' | 'shipped' | 'paused' | 'archived'

export type Area = 'security' | 'ai' | 'personal'

export type Signal = {
  id: string // KM-YYYY-NNNN, assigned in order of dateFirst
  slug: string
  type: 'project'
  name: string
  summary: string // the project's one plain sentence on the page
  tech: string // the short stack on the page, like 'Go' or 'C, ARM64'
  // A status word on the page, only for work that is not live and public.
  status?: 'Shelved' | 'Prototype' | 'Private' | 'Archived'
  featured?: boolean // leads the Projects index; exactly one project sets it
  // Where the project sits in the index: security work first, then AI, then
  // on-device tools. Inside a group, the latest commit goes first.
  area: Area
  tagline: string // feeds, and the project's line in the Repositories list
  body: string // a longer description in my words; not on the page today
  description: string // feeds and meta description
  state: SignalState
  dateFirst: string
  dateLast: string
  repos: string[]
  links: { label: string; href: string }[]
  // Add a GitHub link to the repo, but only if the build confirms it is public.
  sourceIfPublic?: boolean
  collaborator?: { name: string; href: string }
  tags: string[]
}

export const SIGNALS: Signal[] = [
  {
    id: 'KM-2026-0007',
    slug: 'evalcore',
    type: 'project',
    name: 'EvalCore',
    area: 'ai',
    summary:
      'Catches an AI app quietly getting worse after a prompt or model change, and blocks the change in CI before it ships.',
    tech: 'Rust',
    featured: true,
    tagline: 'Snapshot testing for LLM apps and agents',
    body: 'An AI app can keep running after a prompt edit, model swap, or dependency update while its answers quietly get worse. EvalCore catches those changes in CI with repeatable evals and offline replay. It ships as one binary and works from YAML configs and JSONL cases, with baselines, trials, model comparisons, and agent traces. I built it with Abhishek Manyam, and it is open source under Apache-2.0.',
    description:
      'Snapshot testing for LLM apps and agents, built to run locally and block regressions in CI. Built with Abhishek Manyam.',
    state: 'active',
    dateFirst: '2026-07-17',
    dateLast: '2026-07-26',
    repos: ['Eval-core/evalcore'],
    links: [
      { label: 'evalcore.cc', href: 'https://evalcore.cc/' },
      { label: 'GitHub', href: 'https://github.com/Eval-core/evalcore' },
      { label: 'Product Hunt', href: 'https://www.producthunt.com/products/evalcore' },
    ],
    collaborator: {
      name: 'Abhishek Manyam',
      href: 'https://github.com/abhishekmanyam',
    },
    tags: ['Rust', 'LLM', 'evals', 'CI'],
  },
  {
    id: 'KM-2026-0006',
    slug: 'kubereach',
    type: 'project',
    name: 'kubereach',
    area: 'security',
    summary:
      'Maps how far an attacker can get from one hacked Kubernetes pod into the AWS account behind it.',
    tech: 'Go',
    status: 'Shelved',
    tagline: 'Kubernetes foothold to cloud recon',
    body: 'If someone gets a shell inside one pod, what can they actually get to from there? kubereach was my design for answering that: check what the pod’s identity is really allowed to do, then follow it into the AWS account behind the cluster. Before building it I tested the two ideas it rests on against a real EKS cluster, and both held. The permission summary most tools rely on misses access on managed clusters, and an IRSA token taken off a pod still works from a laptop outside the cluster, with the pod’s full AWS role. I shelved it before writing the engine, because a similar tool already covers the ground and EKS defaults are changing under the main demo.',
    description:
      'A design for post-foothold Kubernetes recon, with its two riskiest ideas proven on a real EKS cluster. Shelved before the engine was built.',
    state: 'paused',
    dateFirst: '2026-06-27',
    dateLast: '2026-07-03',
    repos: ['getnullpkg/kubereach'],
    links: [{ label: 'GitHub', href: 'https://github.com/getnullpkg/kubereach' }],
    tags: ['Go', 'Kubernetes', 'AWS', 'EKS', 'IRSA', 'RBAC'],
  },
  {
    id: 'KM-2026-0005',
    slug: 'rune',
    type: 'project',
    name: 'Rune',
    area: 'personal',
    summary:
      'A Raspberry Pi in my car that reads the engine and shows a live health score on my phone.',
    tech: 'Python, Pi',
    tagline: 'Real-time vehicle diagnostics',
    body: 'My car knows a lot about itself and shows me almost none of it, so I built Rune. A Raspberry Pi 4B in the armrest of my 2026 Accord reads the engine data and checks it three ways: against safe ranges, with a streaming anomaly model, and with slow trend forecasts. A phone on the dash shows the result as a live health score. Anything sent back to the car has to pass an allowlist first.',
    description:
      'Real-time diagnostics for a 2026 Honda Accord: a Raspberry Pi reads the engine data, runs three layers of analysis, and shows a live health score on the dash.',
    state: 'active',
    dateFirst: '2026-01-15',
    dateLast: '2026-04-10',
    repos: ['meetrune/rune'],
    links: [{ label: 'Site', href: 'https://rune.kuladeepmantri.com/' }],
    tags: ['Python', 'Raspberry Pi', 'OBD-II', 'React', 'FastAPI'],
  },
  {
    id: 'KM-2025-0003',
    slug: 'shipcrew',
    type: 'project',
    name: 'ShipCrew',
    area: 'ai',
    summary: 'A small team of Claude agents that plan, write, and review code together.',
    tech: 'TypeScript',
    status: 'Prototype',
    tagline: 'Multi-agent dev team',
    body: 'A Slack-style workspace where the team is Claude agents: a project manager, a few developers, and a reviewer. They pick up tasks, hand work to each other, and review each other’s output. I built the agent side: the router that decides who answers, the executor on the Claude Agent SDK, the MCP tools, and streaming. Abhishek Manyam built auth, storage, and the frontend.',
    description:
      'A Slack-style workspace of named Claude agents that take tasks, hand off work, and review each other. Built with Abhishek Manyam.',
    state: 'active',
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
    area: 'personal',
    summary:
      'A recovery tracker for iPhone, designed for people with ADHD.',
    tech: 'Swift',
    status: 'Private',
    tagline: 'On-device recovery tracker',
    body: 'Kintsugi supports streak tracking, journaling, and urge management. Journal sentiment analysis runs on Apple’s on-device NaturalLanguage framework. GitHub backup is optional.',
    description:
      'An iOS recovery tracker designed for people with ADHD, with on-device journaling and sentiment analysis.',
    state: 'active',
    dateFirst: '2026-01-10',
    dateLast: '2026-03-22',
    repos: [],
    links: [],
    tags: ['Swift', 'SwiftUI', 'SwiftData', 'on-device NLP'],
  },
  {
    id: 'KM-2024-0002',
    slug: 'auris',
    type: 'project',
    name: 'Auris',
    area: 'security',
    summary:
      'Watches every request a program makes to the kernel and blocks the ones that don’t belong.',
    tech: 'C, ARM64',
    tagline: 'Syscall tracer for ARM64 Linux',
    body: 'Every program talks to the kernel through system calls, so that’s where Auris watches. It attaches to an ARM64 process with ptrace, records each call, and builds a baseline of what normal looks like. From there it flags anything new, and in block mode it rewrites the registers so a call that isn’t allowed never reaches the kernel.',
    description:
      'An ARM64 Linux syscall tracer: records every system call a process makes, baselines normal behavior, flags what is new, and can block disallowed calls.',
    state: 'shipped',
    dateFirst: '2024-09-01',
    dateLast: '2025-11-15',
    repos: ['kuladeepmantri/Auris'],
    links: [
      { label: 'Site', href: 'https://auris.kuladeepmantri.com/' },
      { label: 'GitHub', href: 'https://github.com/kuladeepmantri/Auris' },
    ],
    tags: ['C', 'ARM64', 'ptrace', 'Linux'],
  },
  {
    id: 'KM-2024-0001',
    slug: 'untilithappens',
    type: 'project',
    name: 'untilithappens.org',
    area: 'security',
    summary: 'Plain steps for staying safe online, each one backed by an official source.',
    tech: 'Next.js',
    tagline: 'Plain-language cyber safety',
    body: 'Most security advice is written for people who already understand security. This site is for everyone else: short guided steps on what to do now, what to avoid, and what to do if something already happened. Every claim is dated and links to an official source like the FTC, the FBI’s IC3, or CISA.',
    description:
      'Plain-language online safety guides for people who were never taught security, with every claim linked to an official source.',
    state: 'shipped',
    dateFirst: '2024-03-01',
    dateLast: '2024-10-15',
    repos: ['kuladeepmantri/untilithappens.org'],
    links: [{ label: 'Visit', href: 'https://untilithappens.kuladeepmantri.com/' }],
    tags: ['Next.js', 'security education'],
  },
  {
    id: 'KM-2023-0001',
    slug: 'deid',
    type: 'project',
    name: 'DeID',
    area: 'security',
    summary: 'Finds personal data like emails and phone numbers in text, and masks it.',
    tech: 'Python',
    status: 'Archived',
    tagline: 'PII masking service',
    body: 'A FastAPI service that finds personal data in text, like emails and phone numbers, and masks it. Detection is regex for now. The job queue and object storage are already wired in for a proper NER model to take its place.',
    description:
      'A FastAPI service that detects and masks personal data in text, with a queue and object storage in place for NER.',
    state: 'archived',
    dateFirst: '2023-04-26',
    dateLast: '2025-08-11',
    repos: ['kuladeepmantri/DeID-Anonymizer'],
    links: [],
    sourceIfPublic: true,
    tags: ['Python', 'FastAPI', 'Celery', 'PII'],
  },
]

// Plain text for the site's meta description and link cards.
export const SENTENCE_ONE =
  'I’m Kuladeep, a security engineer in Michigan. Most of my own time goes into apps, AI, and security tools.'

export const EMAIL = 'kuladeepbmantri@gmail.com'
export const GITHUB_USER = 'kuladeepmantri'
export const X_HANDLE = 'kuladeepmantri'
export const INSTAGRAM = {
  href: 'https://www.instagram.com/kuladeep.mantri/',
}

/** The project that leads the Projects index. */
export function featuredSignal(): Signal | undefined {
  return SIGNALS.find((s) => s.featured)
}

/** Newest dateFirst first. Feeds and anything chronological use this. */
export function sortedByStart(): Signal[] {
  return [...SIGNALS].sort(
    (a, b) => new Date(b.dateFirst).getTime() - new Date(a.dateFirst).getTime(),
  )
}
