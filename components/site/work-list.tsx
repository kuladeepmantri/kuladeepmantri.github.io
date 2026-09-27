'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ProjectRef } from '@/app/signals'
import { isFresh, lastCommit, monthYear, orderProjects, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath } from '@/lib/panes'
import { Activity } from './activity'

export function WorkList({ projects }: { projects: ProjectRef[] }) {
  const { repos, now } = useLive()
  const path = normalizePath(usePathname())

  return (
    <div className="work">
      {orderProjects(projects, repos).map((p) => {
        const live = p.repos.map((r) => repos?.[r]).find((r) => r && !r.isPrivate)
        const commit = lastCommit(p, repos)
        const language = live?.language ?? p.stack.split(' · ')[0]
        const when = commit ? shortAgo(commit.date, now) : monthYear(p.dateLast)
        const meta = live
          ? [language, live.commitsYear ? `${live.commitsYear} commits this year` : null, when]
          : [language, 'private repo']
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
              <span className="row-name">
                {p.name}
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              </span>
              <span className="row-line">{p.line}</span>
              <span
                className={commit && isFresh(commit.date, now) ? 'row-meta fresh' : 'row-meta'}
                suppressHydrationWarning
              >
                {meta.filter(Boolean).join(' · ')}
              </span>
            </span>
            {live?.monthly && <Activity months={live.monthly} now={now} />}
          </Link>
        )
      })}
    </div>
  )
}
