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

export const PROJECTS: Project[] = [
  {
    name: 'Auris',
    description:
      'ARM Linux Syscall Tracer & Security Analyzer using AI/LLM.',
    link: 'https://auris.kuladeepmantri.com/',
    image: '/images/auris.png',
    id: 'project1',
  },
  {
    name: 'untilithappens.org',
    description: 'Digital safety shouldn\'t be complicated. We\'re here to help.',
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
    label: 'Github',
    link: 'https://github.com/kuladeepmantri',
  },
  {
    label: 'Instagram',
    link: 'https://www.instagram.com/kuladeep_mantri/',
  },
]

export const EMAIL = 'mantrikuladeep@gmail.com'
