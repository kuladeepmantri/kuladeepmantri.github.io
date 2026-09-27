// Types for the live snapshot and the pure helpers that turn it into words.
// No React and no I/O here, so the build script, server components, and the
// browser can all share it.

import { TIMEZONE } from './constants'

export type Commit = { sha: string; message: string; date: string; url: string }

export type RepoLive = {
  isPrivate: boolean
  url: string
  pushedAt: string | null
  commits30d: number
  recent: Commit[] // newest first, up to 3
}

/** A recently pushed repo. Private repos keep only the time, never the name. */
export type Push = {
  repo: string | null // 'owner/name', null when private
  isPrivate: boolean
  pushedAt: string
  url: string | null
  description: string | null
  language: string | null
}

export type LiveSnapshot = {
  builtAt: string
  sha: string
  github: null | {
    user: { name: string; avatarUrl: string; bio: string | null }
    totalContributions: number
    weeks: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[][]
    languages: { name: string; bytes: number }[]
    repos: Record<string, RepoLive>
    pushes: Push[] // newest first, this site's repo and forks excluded
  }
  x: null | {
    userId: string
    profileFetchedAt: string
    bio: string
    name: string
    avatarUrl: string
    verified?: boolean
    posts: { id: string; text: string; createdAt: string; url: string }[]
    sinceId: string | null
  }
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIMEZONE,
})
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: TIMEZONE,
})
const YEAR = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: TIMEZONE })

function toTime(iso: string): number {
  // Bare dates are read as noon UTC so they land on the same day everywhere.
  return new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).getTime()
}

/** Long form for the sentence: "2 hours ago", "yesterday", "on Aug 3". */
export function ago(iso: string, now: number): string {
  const t = toTime(iso)
  const diff = Math.max(0, now - t)
  const m = Math.floor(diff / MIN)
  if (m < 1) return 'just now'
  if (m < 60) return m === 1 ? 'a minute ago' : `${m} minutes ago`
  const h = Math.floor(diff / HOUR)
  if (h < 24) return h === 1 ? 'an hour ago' : `${h} hours ago`
  const d = Math.floor(diff / DAY)
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  if (YEAR.format(t) === YEAR.format(now)) return `on ${MONTH_DAY.format(t)}`
  return `in ${MONTH_YEAR.format(t)}`
}

/** Short form for rows: "now", "12m ago", "3h ago", "6d ago", "Nov 2025". */
export function shortAgo(iso: string, now: number): string {
  const t = toTime(iso)
  const diff = Math.max(0, now - t)
  if (diff < MIN) return 'now'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`
  return MONTH_YEAR.format(t)
}

export function monthYear(iso: string): string {
  return MONTH_YEAR.format(toTime(iso))
}

export function isFresh(iso: string | null, now: number, days = 7): boolean {
  return !!iso && now - toTime(iso) < days * DAY
}

export function olderThan(iso: string, now: number, days: number): boolean {
  return now - toTime(iso) > days * DAY
}

/** "2:14 PM" in Michigan. The space before AM/PM never breaks. */
export function clock(now: number): string {
  return new Date(now)
    .toLocaleTimeString('en-US', {
      timeZone: TIMEZONE,
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(/\s/g, ' ')
}

const PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  hour: 'numeric',
  hourCycle: 'h23',
  weekday: 'short',
})

export function mood(now: number): string {
  const parts = PARTS.formatToParts(new Date(now))
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12)
  const weekday = parts.find((p) => p.type === 'weekday')?.value
  const weekend = weekday === 'Sat' || weekday === 'Sun'
  if (hour < 6) return 'I’m probably asleep'
  if (hour < 9) return 'I’m probably just getting started'
  if (hour < 18)
    return weekend ? 'I’m probably building something of my own' : 'I’m probably at my desk'
  return 'I’m probably tinkering on something'
}

// ── Projects × live data ──

type ProjectRef = { slug: string; name: string; repos: string[]; dateLast: string }

/** The newest default-branch commit across a project's public repos. */
export function lastCommit(
  p: Pick<ProjectRef, 'repos'>,
  repos: Record<string, RepoLive> | undefined,
): Commit | null {
  let best: Commit | null = null
  for (const r of p.repos) {
    const live = repos?.[r]
    if (!live || live.isPrivate) continue
    const c = live.recent[0]
    if (c && (!best || toTime(c.date) > toTime(best.date))) best = c
  }
  return best
}

/** Most recent commit first; projects without data fall back to dateLast. */
export function orderProjects<T extends ProjectRef>(
  projects: T[],
  repos: Record<string, RepoLive> | undefined,
): T[] {
  const key = (p: T) => toTime(lastCommit(p, repos)?.date ?? p.dateLast)
  return [...projects].sort((a, b) => key(b) - key(a))
}

export function latestProject<T extends ProjectRef>(
  projects: T[],
  repos: Record<string, RepoLive> | undefined,
): { project: T; commit: Commit } | null {
  let out: { project: T; commit: Commit } | null = null
  for (const p of projects) {
    const c = lastCommit(p, repos)
    if (!c) continue
    const better =
      !out ||
      toTime(c.date) > toTime(out.commit.date) ||
      (toTime(c.date) === toTime(out.commit.date) &&
        toTime(p.dateLast) > toTime(out.project.dateLast))
    if (better) out = { project: p, commit: c }
  }
  return out
}

export function mostActive<T extends ProjectRef>(
  projects: T[],
  repos: Record<string, RepoLive> | undefined,
): T | null {
  let best: T | null = null
  let max = 0
  for (const p of projects) {
    const n = p.repos.reduce((s, r) => s + (repos?.[r]?.commits30d ?? 0), 0)
    if (n > max) {
      max = n
      best = p
    }
  }
  return best
}
