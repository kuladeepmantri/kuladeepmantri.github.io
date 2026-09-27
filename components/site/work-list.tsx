'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'
import type { ProjectRef } from '@/app/signals'
import { TIMEZONE } from '@/lib/constants'
import { isFresh, lastCommit, monthYear, orderProjects, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath } from '@/lib/panes'

const DAY = 86_400_000
const SPAN = 365 * DAY

const MONTH = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: 'UTC',
})
const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIMEZONE,
})

/** Local 'YYYY-MM-DD' read as noon UTC, so it lands on the right day everywhere. */
const dayTime = (d: string) => Date.parse(`${d}T12:00:00Z`)

/** Noon UTC on the Sunday on or before t, matching dayTime's convention. */
function weekStart(t: number) {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - d.getUTCDay(), 12)
}

/** Month starts inside the window, as fractions of its width. */
function monthTicks(start: number, end: number) {
  const out: { x: number; label: string }[] = []
  const d = new Date(start)
  let m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  while (m.getTime() < end) {
    out.push({ x: (m.getTime() - start) / SPAN, label: MONTH.format(m) })
    m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))
  }
  return out
}

/**
 * The Work list on one shared year axis: every project is a row, and every day
 * I committed to it is a tick at that date. Hovering the tracks picks out one
 * calendar week and what I committed in it.
 */
export function WorkList({ projects }: { projects: ProjectRef[] }) {
  const { repos, now } = useLive()
  const path = normalizePath(usePathname())
  const axisRef = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState<number | null>(null) // fraction 0..1

  const end = now
  const start = end - SPAN
  const months = monthTicks(start, end)
  const list = orderProjects(projects, repos)

  const rows = list.map((p) => {
    const live = p.repos.map((r) => repos?.[r]).find((r) => r && !r.isPrivate)
    const days = (live?.days ?? [])
      .map(([d, n]) => ({ t: dayTime(d), n }))
      .filter((d) => d.t >= start && d.t <= end)
    return { p, live, days }
  })
  const peak = Math.max(1, ...rows.flatMap((r) => r.days.map((d) => d.n)))

  // The hovered calendar week, Sunday to Saturday.
  const week = cursor === null ? null : weekStart(start + cursor * SPAN)
  const near = (t: number) => week !== null && t >= week && t < week + 7 * DAY
  const nearTotal = rows.reduce(
    (s, r) => s + r.days.filter((d) => near(d.t)).reduce((a, d) => a + d.n, 0),
    0,
  )

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return
    const box = axisRef.current?.getBoundingClientRect()
    if (!box) return
    const f = (e.clientX - box.left) / box.width
    setCursor(f >= 0 && f <= 1 ? f : null)
  }

  return (
    <div
      className={
        cursor === null ? 'work' : nearTotal ? 'work is-scrubbing has-lit' : 'work is-scrubbing'
      }
      onPointerMove={onMove}
      onPointerLeave={() => setCursor(null)}
      style={
        {
          '--cursor': week === null ? 0 : (week + 3.5 * DAY - start) / SPAN,
        } as React.CSSProperties
      }
    >
      <div className="work-axis" aria-hidden="true">
        <span className="axis-note" suppressHydrationWarning>
          {week === null
            ? 'My commits, last 12 months'
            : `Week of ${MONTH_DAY.format(week)} · ${
                nearTotal ? `${nearTotal} commit${nearTotal === 1 ? '' : 's'}` : 'no commits'
              }`}
        </span>
        <div className="axis" ref={axisRef}>
          {months.map((m) => (
            <span key={m.label + m.x} style={{ left: `${m.x * 100}%` }} suppressHydrationWarning>
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {rows.map(({ p, live, days }, i) => {
        const commit = lastCommit(p, repos)
        const language = live?.language ?? p.stack.split(' · ')[0]
        const when = commit ? shortAgo(commit.date, now) : monthYear(p.dateLast)
        const count = live?.commitsYear
        const meta = live
          ? [language, count ? `${count} commit${count === 1 ? '' : 's'}` : null, when]
          : [language, 'private repo']
        const href = `/apps/${p.slug}`
        const lit = days.some((d) => near(d.t))
        return (
          <Link
            key={p.slug}
            href={href}
            scroll={false}
            className={lit ? 'row lit' : 'row'}
            aria-current={path === href ? 'page' : undefined}
            style={{ '--i': i } as React.CSSProperties}
          >
            <span className="row-main">
              <span className="row-name">{p.name}</span>
              <span className="row-line">{p.line}</span>
              <span
                className={commit && isFresh(commit.date, now) ? 'row-meta fresh' : 'row-meta'}
                suppressHydrationWarning
              >
                {meta.filter(Boolean).join(' · ')}
              </span>
            </span>
            <span
              className="track"
              role="img"
              aria-label={
                days.length
                  ? `Committed on ${days.length} day${days.length === 1 ? '' : 's'} in the last year`
                  : 'No public commits in the last year'
              }
            >
              {days.map((d) => (
                <i
                  key={d.t}
                  className={near(d.t) ? 'hot' : undefined}
                  style={
                    {
                      '--x': (d.t - start) / SPAN,
                      left: `${((d.t - start) / SPAN) * 100}%`,
                      height: `${30 + 70 * Math.sqrt(d.n / peak)}%`,
                    } as React.CSSProperties
                  }
                  title={`${MONTH_DAY.format(d.t)} · ${d.n} commit${d.n === 1 ? '' : 's'}`}
                />
              ))}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
