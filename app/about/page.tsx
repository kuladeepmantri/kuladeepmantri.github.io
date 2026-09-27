import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/site/avatar'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kuladeep Mantri is a cybersecurity engineer in Michigan. He builds security tools and works on applications that meet NIST 800-53, CJIS, FERPA, and HIPAA requirements.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>Cybersecurity engineer</span>
        </span>
      </div>
      <h2 className="sr-only">About</h2>
      <p className="p-text" style={{ marginTop: 28 }}>
        I’m a cybersecurity engineer. I build security tools, and I work on applications that
        organizations run under real compliance requirements.
      </p>
      <p className="p-text">
        On that side I work with NIST 800-53, CJIS, FERPA, and HIPAA. In practice that means
        access control, audit logging, and knowing where sensitive data lives and who can reach it.
      </p>
      <p className="p-text">
        Outside of work I build my own projects, mostly in Go, C, Python, and TypeScript. A few of
        them are on this site. I post about what I’m working on over on{' '}
        <Link href="/x" scroll={false}>
          X
        </Link>
        .
      </p>
      <div className="facts two">
        <span className="fact">
          <span>Currently in</span>
          <span>Michigan, USA</span>
        </span>
        <span className="fact">
          <span>Compliance work</span>
          <span>NIST 800-53 · CJIS · FERPA · HIPAA</span>
        </span>
      </div>
    </article>
  )
}
