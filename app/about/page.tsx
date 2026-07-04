import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NameCard, PlaceCard } from '@/components/gist/inline-cards'

export const metadata: Metadata = {
  title: 'whoami',
  description:
    'Who Kuladeep Mantri is, in his own words: from bricking Windows in Hyderabad to systems, cloud, and security.',
}

const PARAGRAPHS: string[] = [
  'I’m Kuladeep, born in Hyderabad, India, and living in Michigan, USA. I got into computers young by breaking them, and I mean that literally. Windows XP was the first casualty, bricked by installing an unreasonable number of viruses, a good chunk of them on purpose, then Vista, then 7, over and over. I installed all sorts of things I had no business installing, and one month I ran up an internet bill big enough that my dad still hasn’t quite let it go. Me and my brother were in it together, swapping CPUs, cracking open motherboards, killing hardware by plugging things in wrong, and pulling apart games like WWE 2K12 just to mess with them.',
  'From there it kept going. I got into Linux one night and it pulled me right in, it was new and nothing like what I was used to, and it set off my curiosity in a way that never really switched back off. I was young enough to fall all the way down the rabbit hole. I went from barely knowing what Linux even was to being a full “I use Arch, btw” guy, building it up from the installer by hand, and eventually rolling my own distro (nothing heroic, I didn’t write a kernel from scratch, just my own custom spin on it). It was a whole journey. The entire time I was dual-booting and messing with the Windows bootloader and GRUB, writing my own boot scripts. Then came the proper script-kiddie phase, running attacks mostly off Kali just to see how they actually worked.',
  'I flashed custom ROMs on Android, pulled apart IoT devices, poked at websites, and generally got deep into Android and mobile security, whatever was new at the time. I was also writing articles back then, a lot of them about the Windows Phone beta and developer programs, just keeping up with the latest as it dropped.',
  'Eventually I sat down and actually learned to build things, instead of just poking at them. I started with Python, but a lot of what I wanted to do lived down at the low level, so I ended up in C and C++, spending real hours in GDB working out why things broke. From there it was virtual machines, web, APIs and API security, and eventually cloud and Kubernetes. I keep the range wide on purpose, so whenever something new turns up, AI and all the rest, I go and actually understand it.',
  'Somewhere in there it stopped being a hobby and became the way my head works. I look at almost anything and start seeing how it’s put together, what it depends on, and where it could go wrong. It’s not something I turn on for work, and honestly I don’t think of it as work at all. It’s just always running, part of my job and part of my life.',
  'So if I put it simply, at the core I believe I’m an engineer, more than anything else. Not tied to one device, one operating system, or to security on its own. I just like understanding how things work, and how they fail.',
]

// Named technologies get subtle weight so the eye can trace the arc of tools.
const TECH = [
  'Windows Phone',
  'custom ROMs',
  'C and C++',
  'Kubernetes',
  'Android',
  'Python',
  'Linux',
  'Vista',
  'Arch',
  'GRUB',
  'Kali',
  'GDB',
  'IoT',
]
const TECH_SET = new Set(TECH)

// One regex over the special tokens: the name, the two places, and the tech.
// Word-boundaried, case-sensitive US so it never matches "us"/"business"/etc.
const TOKEN_RE = new RegExp(
  '(' +
    ['Kuladeep', 'India', 'USA', ...TECH.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))].join('|') +
    ')',
  'g',
)

function enrich(text: string): ReactNode[] {
  return text.split(TOKEN_RE).map((part, i) => {
    if (part === 'Kuladeep') return <NameCard key={i}>{part}</NameCard>
    if (part === 'India') return <PlaceCard key={i} place="india">{part}</PlaceCard>
    if (part === 'USA') return <PlaceCard key={i} place="us">{part}</PlaceCard>
    if (TECH_SET.has(part))
      return (
        <span key={i} className="font-medium text-[var(--text)]">
          {part}
        </span>
      )
    return part
  })
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-reading px-5 pt-4 pb-24">
      <div className="mb-8 border-b border-[var(--border)] pb-5 text-[11px] tracking-[0.2em] text-[color:var(--accent)] uppercase">
        whoami
      </div>

      <div
        style={{ fontFamily: 'var(--font-inter)', fontFeatureSettings: 'normal' }}
        className="space-y-6 text-[16px] leading-[1.85] tracking-[-0.003em] text-[var(--text-secondary)]"
      >
        {PARAGRAPHS.map((p, i) => (
          <p key={i}>{enrich(p)}</p>
        ))}
      </div>
    </div>
  )
}
