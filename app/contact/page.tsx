import type { Metadata } from 'next'
import { CopyEmail } from '@/components/site/copy-email'
import { Clock } from '@/components/site/rel-time'
import { EMAIL, GITHUB_USER, INSTAGRAM, X_HANDLE } from '../signals'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach Kuladeep Mantri.',
  alternates: { canonical: '/contact' },
}

export default function Contact() {
  return (
    <article className="p-body">
      <span className="p-meta">
        <Clock /> in Michigan · Eastern time
      </span>
      <h2 className="p-title">Get in touch</h2>
      <p className="p-lead" style={{ marginTop: 10, fontSize: 15 }}>
        Email is the best way to reach me. Security, AI, Kubernetes, or a bug you think I’d find
        interesting.
      </p>
      <div className="email-card">
        <span>
          <span>Email</span>
          <a id="email-address" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </span>
        <CopyEmail email={EMAIL} />
      </div>
      <div className="links">
        <a href={`https://x.com/${X_HANDLE}`}>
          <span>X</span>
          <span>@{X_HANDLE} ↗</span>
        </a>
        <a href={`https://github.com/${GITHUB_USER}`}>
          <span>GitHub</span>
          <span>{GITHUB_USER} ↗</span>
        </a>
        <a href={INSTAGRAM.href}>
          <span>Instagram</span>
          <span>{INSTAGRAM.handle} ↗</span>
        </a>
      </div>
    </article>
  )
}
