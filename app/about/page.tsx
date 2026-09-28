import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import Link from 'next/link'
import { PaneHead } from '@/components/site/pane-head'
import { BuildingNow } from '@/components/site/building-now'
import { LocationIcon } from '@/components/site/icons'
import { EMAIL, GITHUB_USER, X_HANDLE, projectRefs } from '../signals'

export const metadata: Metadata = pageMeta({
  title: 'About',
  description:
    'Kuladeep Mantri is a security engineer in Michigan. He works as an IT Security Analyst 3 on State of Michigan systems that handle criminal justice, student, and health data.',
  path: '/about',
})

export default function About() {
  return (
    <article className="about">
      <PaneHead title="About" />

      <header className="about-hero">
        <picture className="portrait">
          <source srcSet="/images/portrait.webp" type="image/webp" />
          <img src="/images/portrait.jpg" width={88} height={88} alt="Kuladeep Mantri" />
        </picture>
        <div>
          <p className="who-name">Kuladeep Mantri</p>
          <p className="muted">Security Engineer</p>
          <p className="loc">
            <LocationIcon />
            Michigan
          </p>
        </div>
      </header>

      <p className="about-lede">
        I’m curious by default and usually building something. Most of my own time goes into apps,
        AI, security ideas, and whatever I’m learning next. The engineering side of that is in
        the{' '}
        <Link href="/" scroll={false}>
          Projects list
        </Link>
        .
      </p>

      <section className="about-block">
        <h2 className="lab">Work</h2>
        <p>
          I’m an IT Security Analyst 3 supporting State of Michigan systems that handle sensitive
          criminal justice, student, and health data. I review how those systems are designed and
          secured, evaluate their system security plans, and assess risk against NIST 800-53, the
          U.S. federal framework for security and privacy controls, before they move through
          security authorization.
        </p>
      </section>

      <dl className="cells">
        <div>
          <dt>Building now</dt>
          <dd>
            <BuildingNow projects={projectRefs()} />
          </dd>
        </div>
        <div>
          <dt>Into</dt>
          <dd>AI, Kubernetes, security tools</dd>
        </div>
        <div>
          <dt>Writes</dt>
          <dd>Python, Go, C, TypeScript, Rust</dd>
        </div>
        <div>
          <dt>Based in</dt>
          <dd>Michigan</dd>
        </div>
      </dl>

      <section className="about-block">
        <h2 className="lab">Elsewhere</h2>
        <ul className="tabs">
          <li>
            <a href={`https://x.com/${X_HANDLE}`}>X ↗</a>
          </li>
          <li>
            <a href={`https://github.com/${GITHUB_USER}`}>GitHub ↗</a>
          </li>
          <li>
            <a href={`mailto:${EMAIL}`}>Email ↗</a>
          </li>
        </ul>
      </section>
    </article>
  )
}
