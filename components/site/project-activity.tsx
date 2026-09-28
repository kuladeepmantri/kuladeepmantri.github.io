'use client'

import { isFresh, lastCommit, monthYear, olderThan, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { liveClass } from './rel-time'

/** Stack, dates, and recent commits for one project; updates with the browser refresh. */
export function ProjectActivity({
  repos: projectRepos,
  stack,
  started,
  dateLast,
  quietNote,
}: {
  repos: string[]
  stack: string
  started: string
  dateLast: string
  quietNote?: string
}) {
  const { repos, now, ready } = useLive()
  const hidden = !projectRepos.length || projectRepos.every((r) => repos?.[r]?.isPrivate)
  const commit = lastCommit({ repos: projectRepos }, repos)
  const commits = projectRepos
    .flatMap((r) => (repos?.[r]?.isPrivate ? [] : (repos?.[r]?.recent ?? [])))
    .filter((c) => !/^Merge (pull request|branch)/.test(c.message))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 3)
  const quiet =
    hidden || !commits.length || (!!quietNote && !!commit && olderThan(commit.date, now, 60))
  const last = commit ? shortAgo(commit.date, now) : monthYear(dateLast)

  return (
    <>
      <dl className="facts">
        <div>
          <dt>Stack</dt>
          <dd>{stack}</dd>
        </div>
        <div>
          <dt>Started</dt>
          <dd>{started}</dd>
        </div>
        <div>
          <dt>Last push</dt>
          <dd suppressHydrationWarning>
            {commit ? <span className={liveClass(ready)}>{last}</span> : last}
          </dd>
        </div>
      </dl>
      {quiet ? (
        quietNote && <p className="muted">{quietNote}</p>
      ) : (
        <section>
          <h2 className="list-lab">Recent commits</h2>
          <ul className="commits">
            {commits.map((c, i) => (
              <li key={c.sha}>
                <a href={c.url}>
                  <span className="commit-msg" title={c.message}>
                    {c.message}
                  </span>
                  <span
                    className={`${i === 0 && isFresh(c.date, now) ? 'when fresh' : 'when'} ${liveClass(ready)}`}
                    suppressHydrationWarning
                  >
                    {shortAgo(c.date, now)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
