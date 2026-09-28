'use client'

import type { ProjectRef } from '@/app/signals'
import { isSkippedRepo, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { liveClass } from './rel-time'

type Row = { key: string; at: string; href: string | null; label: string }

/** Public repos I committed to recently; private ones collapse into one line, in date order. */
export function RecentPushes({ projects }: { projects: ProjectRef[] }) {
  const { pushes, now, ready } = useLive()
  if (!pushes?.length) return null
  const rows: Row[] = pushes
    .filter((p) => p.repo && p.url && !p.isPrivate && !isSkippedRepo(p.repo))
    .slice(0, 5)
    .map((p) => {
      const repo = p.repo!
      const project = projects.find((x) =>
        x.repos.some((r) => r.toLowerCase() === repo.toLowerCase()),
      )
      return { key: repo, at: p.pushedAt, href: p.url, label: project?.name ?? repo.split('/')[1] }
    })
  const hidden = pushes.filter((p) => p.isPrivate)
  if (hidden.length)
    rows.push({
      key: 'private',
      at: hidden[0].pushedAt,
      href: null,
      label: `${hidden.length} private repo${hidden.length === 1 ? '' : 's'}`,
    })
  rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return (
    <section>
      <h2 className="list-lab">Recently pushed</h2>
      <ul className="commits">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="commit-msg">{r.label}</span>
              <span className={`when ${liveClass(ready)}`} suppressHydrationWarning>
                {shortAgo(r.at, now)}
              </span>
            </>
          )
          return (
            <li key={r.key}>
              {r.href ? <a href={r.href}>{inner}</a> : <span className="row-quiet">{inner}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
