import type { Metadata } from 'next'
import { Avatar } from '@/components/site/avatar'
import { BuildingNow } from '@/components/site/building-now'
import { EMAIL, GITHUB_USER, X_HANDLE, projectRefs } from '../signals'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Kuladeep Mantri is a cybersecurity engineer in government. He writes system security plans and runs risk assessments on systems that hold criminal justice, student, and health records.',
  alternates: { canonical: '/about' },
}

export default function About() {
  return (
    <article className="p-body">
      <div className="profile about-profile">
        <Avatar size={80} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>Cybersecurity engineer · Michigan</span>
        </span>
      </div>
      <h2 className="sr-only">About</h2>

      <p className="about-lead">
        I’m a cybersecurity engineer in government. I write system security plans and run risk
        assessments on systems that hold criminal justice, student, and health records, so they
        can be authorized to operate.
      </p>

      <dl className="about-facts">
        <div>
          <dt>Day job</dt>
          <dd>Security architecture reviews, risk assessments, authorizations to operate</dd>
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
