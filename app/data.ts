// ── Types ──

export type AppProject = {
  id: string
  name: string
  tagline: string
  description: string
  link: string | null
  image: string | null
  video: string | null
  accentColor: string
  tags: string[]
  status: 'live' | 'beta' | 'building' | 'personal'
  deviceType: 'iphone' | 'browser'
  collaborator: { name: string; github: string } | null
}

type SocialLink = {
  label: string
  link: string
}

type Certification = {
  id: string
  name: string
  issuer: string
  number: string
  link: string
}

// ── Data ──

export const PROJECTS: AppProject[] = [
  {
    id: 'kintsugi',
    name: 'Kintsugi',
    tagline: 'On-device Recovery Tracker',
    description:
      'iOS app with neuroscience-backed streak tracking, 3-level panic mode escalation, NLP-powered journal sentiment analysis, and 21 achievement badges. Built with SwiftUI and iOS 26 Liquid Glass design.',
    link: null,
    image: null,
    video: '/videos/kintsugi.mp4',
    accentColor: '#a78bfa',
    tags: ['SwiftUI', 'iOS 26', 'Liquid Glass', 'NLP', 'SwiftData'],
    status: 'personal',
    deviceType: 'iphone',
    collaborator: null,
  },
  {
    id: 'shipcrew',
    name: 'ShipCrew',
    tagline: 'Multi-Agent AI Dev Team',
    description:
      '5 AI agents working simultaneously in a Slack-like interface. Real-time streaming messages, Kanban board, autonomous task execution, and sandboxed Docker environments.',
    link: null,
    image: '/images/shipmate.png',
    video: null,
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
      'Syscall tracer and security analyzer for ARM64 Linux. Blue Team defense with behavioral profiling and anomaly detection. Red Team offense with process injection and ROP gadget scanning.',
    link: 'https://auris.kuladeepmantri.com/',
    image: '/images/auris.png',
    video: null,
    accentColor: '#c084fc',
    tags: ['C', 'ARM64', 'ptrace', 'eBPF', 'Next.js'],
    status: 'live',
    deviceType: 'browser',
    collaborator: null,
  },
  {
    id: 'untilithappens',
    name: 'untilithappens.org',
    tagline: 'Digital Safety Platform',
    description:
      'Making digital safety accessible. Practical tools and guides that help people protect themselves online without needing a security degree.',
    link: 'https://untilithappens.kuladeepmantri.com/',
    image: '/images/untilithappens.png',
    video: null,
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
    number: 'ECC2013574869',
    link: 'https://aspen.eccouncil.org/Verify',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'GitHub', link: 'https://github.com/kuladeepmantri' },
  { label: 'Instagram', link: 'https://www.instagram.com/kuladeep.mantri/' },
]

export const EMAIL = 'mantrikuladeep@gmail.com'
