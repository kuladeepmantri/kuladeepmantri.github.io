import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import { CopyEmail } from '@/components/site/copy-email'
import { PaneHead } from '@/components/site/pane-head'
import { Clock } from '@/components/site/rel-time'
import { EMAIL, GITHUB_USER, INSTAGRAM, X_HANDLE } from '../signals'

export const metadata: Metadata = pageMeta({
  title: 'Contact',
  description: 'How to reach Kuladeep Mantri.',
  path: '/contact',
})

export default function Contact() {
  return (
    <article>
      <PaneHead title="Contact" />
      <p>If you’d like to connect about anything, send me an email.</p>
      <p className="email">
        <a id="email-address" href={`mailto:${EMAIL}`}>
          {EMAIL}
        </a>
        <CopyEmail email={EMAIL} />
      </p>
      <ul className="list">
        <li>
          <a href={`https://x.com/${X_HANDLE}`}>X ↗</a>
        </li>
        <li>
          <a href={`https://github.com/${GITHUB_USER}`}>GitHub ↗</a>
        </li>
        <li>
          <a href={INSTAGRAM.href}>Instagram ↗</a>
        </li>
      </ul>
      <p className="muted">
        It’s <Clock /> in Michigan.
      </p>
    </article>
  )
}
