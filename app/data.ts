type Project = {
  name: string
  description: string
  link: string
  image: string
  id: string
}

type Certification = {
  name: string
  number: string
  link: string
  id: string
}

type SocialLink = {
  label: string
  link: string
}

type NowItem = {
  id: string
  title: string
  status: string
  summary: string
  tools: string[]
}

export const PROJECTS: Project[] = [
  {
    name: 'Auris',
    description: 'ARM Linux Syscall Tracer & Security Analyzer using AI/LLM.',
    link: 'https://auris.kuladeepmantri.com/',
    image: '/images/auris.png',
    id: 'project1',
  },
  {
    name: 'untilithappens.org',
    description: "Digital safety shouldn't be complicated. We're here to help.",
    link: 'https://untilithappens.kuladeepmantri.com/',
    image: '/images/untilithappens.png',
    id: 'project2',
  },
]

export const CERTIFICATIONS: Certification[] = [
  {
    name: 'Certified Ethical Hacker',
    number: 'ECC2013574869',
    link: 'https://aspen.eccouncil.org/Verify',
    id: 'cert1',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'GitHub',
    link: 'https://github.com/kuladeepmantri',
  },
  {
    label: 'Instagram',
    link: 'https://www.instagram.com/kuladeep_mantri/',
  },
]

export const NOW_ITEMS: NowItem[] = [
  {
    id: 'now-1',
    title: 'Threat-Informed Tracing for Auris',
    status: 'Building',
    summary:
      'Designing syscall clustering and behavior baselines to flag anomaly chains instead of single-call outliers.',
    tools: ['eBPF', 'Rust', 'LLM-assisted triage'],
  },
  {
    id: 'now-2',
    title: 'Phishing-Resilient UX Patterns',
    status: 'Researching',
    summary:
      'Prototyping interface patterns that reduce risky clicks by making trust signals obvious and contextual.',
    tools: ['Next.js', 'Telemetry', 'Security UX heuristics'],
  },
  {
    id: 'now-3',
    title: 'Local Security Lab Automation',
    status: 'Experimenting',
    summary:
      'Automating reproducible attack/defense scenarios for Linux hardening and cloud misconfiguration drills.',
    tools: ['Docker', 'IaC', 'Detection rules'],
  },
]

export const EMAIL = 'mantrikuladeep@gmail.com'
