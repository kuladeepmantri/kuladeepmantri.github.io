import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/site/avatar'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kuladeep Mantri is a cybersecurity engineer in Michigan who secures systems that handle highly sensitive data, and builds apps and AI tools on the side.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>Cybersecurity engineer · Michigan</span>
        </span>
      </div>
      <h2 className="sr-only">About</h2>
      <p className="p-text about-lead">
        I’m a cybersecurity engineer. My day job is securing systems that handle highly sensitive
        data, and it’s more technical than people expect.
      </p>
      <p className="p-text about-lead">
        Outside of that, I build things I’m curious about, usually apps and AI tools, sometimes the
        cloud setup under them. A few are under{' '}
        <Link href="/" scroll={false}>
          Work
        </Link>
        . The rest shows up on{' '}
        <Link href="/x" scroll={false}>
          X
        </Link>
        .
      </p>
    </article>
  )
}
