import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/site/avatar'
import { PaneHead } from '@/components/site/pane-head'
import { BuildingNow } from '@/components/site/building-now'
import { EMAIL, GITHUB_USER, X_HANDLE, projectRefs } from '../signals'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kuladeep Mantri is a security engineer in Michigan. He works as an IT Security Analyst 3 on State of Michigan systems that handle criminal justice, student, and health data.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="about">
      <PaneHead title="About" />
      <div className="who">
        <Avatar size={48} />
        <div>
          <p className="who-name">Kuladeep Mantri</p>
          <p className="muted">Security Engineer · Michigan</p>
        </div>
      </div>

      <p>
        I’m curious by default and usually building something. Most of my own time goes into apps,
        AI, security ideas, and whatever I’m learning next. The engineering side of that lives{' '}
        <Link href="/" scroll={false}>
          here
        </Link>
        .
      </p>

      <dl className="facts">
        <div>
          <dt>Work</dt>
          <dd>
            I’m an IT Security Analyst 3 supporting State of Michigan systems that handle sensitive
            criminal justice, student, and health data. I review how those systems are designed and
            secured, evaluate their system security plans, and assess risk against NIST 800-53, the
            U.S. federal framework for security and privacy controls, before they move through
            security authorization.
          </dd>
        </div>
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
        <div>
          <dt>Elsewhere</dt>
          <dd>
            <a href={`https://x.com/${X_HANDLE}`}>X</a> ·{' '}
            <a href={`https://github.com/${GITHUB_USER}`}>GitHub</a> ·{' '}
            <a href={`mailto:${EMAIL}`}>Email</a>
          </dd>
        </div>
      </dl>
    </article>
  )
}
