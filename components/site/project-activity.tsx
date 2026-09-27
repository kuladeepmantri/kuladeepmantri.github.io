'use client'

import { isFresh, lastCommit, monthYear, olderThan, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/** Facts row and recent commits for one project; updates with the browser refresh. */
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
  const { repos, now } = useLive()
  const hidden = !projectRepos.length || projectRepos.every((r) => repos?.[r]?.isPrivate)
  const commit = lastCommit({ repos: projectRepos }, repos)
  const commits = projectRepos
    .flatMap((r) => (repos?.[r]?.isPrivate ? [] : (repos?.[r]?.recent ?? [])))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 3)
  const quiet =
    hidden || !commits.length || (!!quietNote && !!commit && olderThan(commit.date, now, 60))
  const last = commit ? shortAgo(commit.date, now) : hidden ? 'private' : monthYear(dateLast)

  return (
    <>
      <div className="facts">
        <span className="fact">
          <span>Stack</span>
          <span>{stack}</span>
        </span>
        <span className="fact desk-only">
          <span>Started</span>
          <span>{started}</span>
        </span>
        <span className="fact">
          <span>Last push</span>
          <span suppressHydrationWarning>{last}</span>
        </span>
      </div>
      {quiet ? (
        quietNote && <p className="p-note">{quietNote}</p>
      ) : (
        <div className="commits">
          <h3 className="lab">Recent commits</h3>
          {commits.map((c, i) => (
            <a key={c.sha} href={c.url} className="commit">
              <span className="commit-msg">
                <span className={i === 0 && isFresh(c.date, now) ? 'dot live' : 'dot'} />
                <span>{c.message}</span>
              </span>
              <span className="commit-ago" suppressHydrationWarning>
                {shortAgo(c.date, now)}
              </span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
