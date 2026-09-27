'use client'

import type { ProjectRef } from '@/app/signals'
import { shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

function short(repo: string) {
  return repo.split('/')[1] ?? repo
}

/** Two facts: the public repo my latest commit went to, and when. */
export function LastPushFacts() {
  const { pushes, now } = useLive()
  const p = pushes?.find((x) => !x.isPrivate && x.repo)
  return (
    <>
      <span className="fact big">
        <span>Last pushed to</span>
        <span>{p ? (p.repo ? short(p.repo) : 'Private repo') : 'Nothing yet'}</span>
      </span>
      <span className="fact big">
        <span>When</span>
        <span suppressHydrationWarning>{p ? shortAgo(p.pushedAt, now) : ''}</span>
      </span>
    </>
  )
}

/** Public repos I committed to recently; private ones collapse into one line. */
export function RecentPushes({ projects }: { projects: ProjectRef[] }) {
  const { pushes, now } = useLive()
  if (!pushes?.length) return null
  const shown = pushes.filter((p) => p.repo && p.url).slice(0, 5)
  const hidden = pushes.filter((p) => p.isPrivate)
  return (
    <>
      <h3 className="lab section-lab">Recently pushed</h3>
      <div className="repo-list">
        {shown.map((p) => {
          const repo = p.repo!
          const project = projects.find((x) =>
            x.repos.some((r) => r.toLowerCase() === repo.toLowerCase()),
          )
          return (
            <a key={repo} className="repo" href={p.url!}>
              <span className="repo-main">
                <span className="repo-name">
                  {repo}
                  {project && <span className="repo-tag">on this site as {project.name}</span>}
                </span>
                {p.description && <span className="repo-desc">{p.description}</span>}
              </span>
              <span className="repo-meta" suppressHydrationWarning>
                {p.language && <span>{p.language}</span>}
                {shortAgo(p.pushedAt, now)}
              </span>
            </a>
          )
        })}
        {hidden.length > 0 && (
          <div className="repo private">
            <span className="repo-main">
              <span className="repo-name">
                {hidden.length} private repo{hidden.length === 1 ? '' : 's'}
              </span>
            </span>
            <span className="repo-meta" suppressHydrationWarning>
              latest {shortAgo(hidden[0].pushedAt, now)}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
