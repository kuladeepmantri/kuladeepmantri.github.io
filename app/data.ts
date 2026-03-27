// ── Types ──

export type AppProject = {
  id: string
  name: string
  tagline: string
  description: string
  link: string | null
  image: string | null
  video: string | null
  embedUrl: string | null
  accentColor: string
  tags: string[]
  status: 'live' | 'beta' | 'building' | 'personal'
  deviceType: 'iphone' | 'browser'
  collaborator: { name: string; github: string } | null
}

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

// ── Data ──

export const PROJECTS: AppProject[] = [
  {
    id: 'rune',
    name: 'Rune',
    tagline: 'Real-Time Vehicle Diagnostics',
    description:
      'Real-time diagnostic system for a 2026 Honda Accord SE. A Raspberry Pi 4B in the armrest streams OBD-II data through three layers of health analysis \u2014 threshold checks, streaming anomaly detection, and trend forecasting \u2014 to a React PWA on a mounted Pixel 6 Pro, with a 3D visualization of subsystem health zones and sensor fusion across vibration, audio, and environmental data.',
    link: 'https://rune.kuladeepmantri.com/',
    image: null,
    video: null,
    embedUrl: 'https://rune.kuladeepmantri.com/',
    accentColor: '#4ade80',
    tags: ['React', 'Three.js', 'FastAPI', 'Python', 'Raspberry Pi', 'OBD-II'],
    status: 'live',
    deviceType: 'browser',
    collaborator: null,
  },
  {
    id: 'shipcrew',
    name: 'ShipCrew',
    tagline: 'Multi-Agent AI Dev Team',
    description:
      'AI dev team that runs multiple agents in parallel through a Slack-like interface. Live message streaming, Kanban board, and sandboxed Docker execution.',
    link: null,
    image: '/images/shipmate.png',
    video: null,
    embedUrl: null,
    accentColor: '#818cf8',
    tags: ['Next.js', 'Express', 'Claude SDK', 'WebSocket', 'Docker'],
    status: 'building',
    deviceType: 'browser',
    collaborator: { name: 'Abhishek Manyam', github: 'https://github.com/abhishekmanyam' },
  },
  {
    id: 'auris',
    name: 'Auris',
    tagline: 'ARM64 Linux Security Toolkit',
    description:
      'Syscall tracer and security analyzer for ARM64 Linux. Covers both defense (behavioral profiling, anomaly detection) and offense (process injection, ROP gadget scanning).',
    link: 'https://auris.kuladeepmantri.com/',
    image: '/images/auris.png',
    video: null,
    embedUrl: null,
    accentColor: '#c084fc',
    tags: ['C', 'ARM64', 'ptrace', 'eBPF', 'Next.js'],
    status: 'live',
    deviceType: 'browser',
    collaborator: null,
  },
  {
    id: 'kintsugi',
    name: 'Kintsugi',
    tagline: 'On-device Recovery Tracker',
    description:
      'Recovery tracker with streak tracking, a panic mode for tough moments, and journaling with mood analysis. Built with SwiftUI and iOS 26 Liquid Glass.',
    link: null,
    image: null,
    video: '/videos/kintsugi.mp4',
    embedUrl: null,
    accentColor: '#a78bfa',
    tags: ['SwiftUI', 'iOS 26', 'Liquid Glass', 'NLP', 'SwiftData'],
    status: 'personal',
    deviceType: 'iphone',
    collaborator: null,
  },
  {
    id: 'untilithappens',
    name: 'untilithappens.org',
    tagline: 'Digital Safety Platform',
    description:
      'Practical digital safety guides and tools. Plain-language security without the jargon.',
    link: 'https://untilithappens.kuladeepmantri.com/',
    image: '/images/untilithappens.png',
    video: null,
    embedUrl: null,
    accentColor: '#e879f9',
    tags: ['Next.js', 'Security UX', 'Education'],
    status: 'live',
    deviceType: 'browser',
    collaborator: null,
  },
]

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

export const EMAIL = 'mantrikuladeep@gmail.com'
