import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import { Avatar } from '@/components/site/avatar'
import { RecentPushes } from '@/components/site/last-push'
import { PaneHead } from '@/components/site/pane-head'
import { LIVE } from '@/lib/generated/live'
import { GITHUB_USER, projectRefs } from '../signals'

export const metadata: Metadata = pageMeta({
  title: 'GitHub',
  description: 'Kuladeep Mantri on GitHub: recent contributions and languages.',
  path: '/github',
})

export default function GitHub() {
  const gh = LIVE.github
  const langTotal = gh?.languages.reduce((s, l) => s + l.bytes, 0) ?? 0
  return (
    <article>
      <PaneHead title="GitHub" />
      <a className="who" href={`https://github.com/${GITHUB_USER}`}>
        <Avatar size={48} />
        <div>
          <p className="who-name">Kuladeep Mantri</p>
          <p className="muted">@{GITHUB_USER} ↗</p>
        </div>
      </a>
      {gh?.user.bio && <p>{gh.user.bio}</p>}
      {gh ? (
        <>
          <dl className="facts">
            <div>
              <dt>Contributions, last year</dt>
              <dd>{gh.totalContributions.toLocaleString('en-US')}</dd>
            </div>
          </dl>
          <RecentPushes projects={projectRefs()} />
          {gh.languages.length > 0 && (
            <section>
              <h2 className="list-lab">Languages in public repos</h2>
              <ul className="langs">
                {gh.languages.map((l) => (
                  <li key={l.name}>
                    <span>{l.name}</span>
                    <span className="bar">
                      <i style={{ width: `${(l.bytes / langTotal) * 100}%` }} />
                    </span>
                    <span className="when">{Math.round((l.bytes / langTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <p className="muted">GitHub data didn’t load for this build.</p>
      )}
    </article>
  )
}
