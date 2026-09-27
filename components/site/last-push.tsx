'use client'

import type { ProjectRef } from '@/app/signals'
import { shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/** Public repos I committed to recently; private ones collapse into one line. */
export function RecentPushes({ projects }: { projects: ProjectRef[] }) {
  const { pushes, now } = useLive()
  if (!pushes?.length) return null
  const shown = pushes.filter((p) => p.repo && p.url).slice(0, 5)
  const hidden = pushes.filter((p) => p.isPrivate)
  return (
    <section>
      <h2 className="list-lab">Recently pushed</h2>
      <ul className="commits">
        {shown.map((p) => {
          const repo = p.repo!
          const project = projects.find((x) =>
            x.repos.some((r) => r.toLowerCase() === repo.toLowerCase()),
          )
          return (
            <li key={repo}>
              <a href={p.url!}>
                <span className="commit-msg">{project?.name ?? repo.split('/')[1]}</span>
                <span className="when" suppressHydrationWarning>
                  {shortAgo(p.pushedAt, now)}
                </span>
              </a>
            </li>
          )
        })}
        {hidden.length > 0 && (
          <li>
            <span className="row-quiet">
              <span className="commit-msg">
                {hidden.length} private repo{hidden.length === 1 ? '' : 's'}
              </span>
              <span className="when" suppressHydrationWarning>
                {shortAgo(hidden[0].pushedAt, now)}
              </span>
            </span>
          </li>
        )}
      </ul>
    </section>
  )
}
