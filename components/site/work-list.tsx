'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProjectRef } from '@/app/signals'
import { isFresh, lastCommit, monthYear, orderProjects, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath } from '@/lib/panes'

export function WorkList({ projects }: { projects: ProjectRef[] }) {
  const { repos, now } = useLive()
  const path = normalizePath(usePathname())

  return (
    <div className="work">
      {orderProjects(projects, repos).map((p) => {
        const commit = lastCommit(p, repos)
        const hidden = !p.repos.length || p.repos.every((r) => repos?.[r]?.isPrivate)
        const meta = commit ? shortAgo(commit.date, now) : hidden ? 'private' : monthYear(p.dateLast)
        const href = `/apps/${p.slug}`
        return (
          <Link
            key={p.slug}
            href={href}
            scroll={false}
            className="row"
            aria-current={path === href ? 'page' : undefined}
          >
            <span className="row-main">
              <span>
                <span className="row-name">{p.name}</span>
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </span>
              <span className="row-line">{p.line}</span>
            </span>
            <span className="row-meta" suppressHydrationWarning>
              <span className={commit && isFresh(commit.date, now) ? 'dot live' : 'dot'} />
              {meta}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
