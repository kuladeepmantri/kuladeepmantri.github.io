// Types for the live snapshot and the pure helpers that turn it into what the
// page shows. No React and no I/O here, so the build script, server
// components, the browser, and the unit tests can all share it.

import { TIMEZONE } from './constants'
import { readable } from './x-text'

export type Commit = {
  sha: string
  message: string
  date: string
  url: string
}
export type Release = { tag: string; publishedAt: string; url: string }
export type Language = { name: string; color: string | null }

export type RepoLive = {
  isPrivate: boolean
  url: string
  pushedAt: string | null
  /** My own commits on the default branch, newest first, up to 3. */
  recent: Commit[]
  /** How many commits on the default branch are mine. Null when unknown. */
  commits: number | null
  stars: number | null
  forks: number | null
  language: Language | null
  /** SPDX id, or null for no license or one GitHub cannot identify. */
  license: string | null
  /** Published releases, newest first, up to 10. Drafts never appear. */
  releases: Release[]
}

export type Post = { id: string; text: string; createdAt: string; url: string }

export type LiveSnapshot = {
  builtAt: string
  sha: string
  github: null | {
    /** Keyed by the 'owner/name' spelling used in SIGNALS. */
    repos: Record<string, RepoLive>
    /** Distinct primary languages across my public repos, sorted. */
    languages: string[]
    /** My pinned public repos on GitHub, 'owner/name', in pinned order. */
    pinned: string[]
  }
  x: null | {
    userId: string
    profileFetchedAt: string
    name: string
    verified: boolean
    pinned: Post | null
    /**
     * Newest first, without reposts or replies, replies in my own threads
     * included. A cache from before self-replies were dropped can still hold
     * some until the next full X refresh.
     */
    posts: Post[]
    sinceId: string | null
  }
}

/** Links from GitHub data only ever point at GitHub itself. */
export function isGithubUrl(u: unknown): u is string {
  return typeof u === 'string' && u.startsWith('https://github.com/')
}

/** A language colour safe to put in a style attribute, or null. */
export function safeColor(c: unknown): string | null {
  return typeof c === 'string' && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c) ? c : null
}

export function isPublicRepo(repo: string, repos: Record<string, RepoLive> | undefined): boolean {
  const live = repos?.[repo]
  return !!live && !live.isPrivate
}

// ── Time ──

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
// Clock skew allowance: a timestamp up to this far ahead still reads as "now".
const SKEW = 5 * MIN

const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: TIMEZONE,
})
const MONTH_DAY_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: TIMEZONE,
})
const LONG_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: TIMEZONE,
})
const YEAR = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: TIMEZONE,
})
const LOCAL_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }) // YYYY-MM-DD
const ZONE = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  timeZoneName: 'short',
})

export function toTime(iso: string): number {
  // Bare dates are read as noon UTC so they land on the same day everywhere.
  return new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).getTime()
}

/** The calendar day an instant falls on in TIMEZONE, as a day number. */
function localDay(t: number): number {
  return Math.round(Date.parse(LOCAL_DATE.format(t)) / DAY)
}

function date(t: number, now: number): string {
  return YEAR.format(t) === YEAR.format(now) ? MONTH_DAY.format(t) : MONTH_DAY_YEAR.format(t)
}

/** Slide stamps: "just now", "12m ago", "20h ago", then "Jul 23" or "Jul 23, 2025". */
export function stamp(iso: string, now: number): string {
  const t = toTime(iso)
  if (Number.isNaN(t)) return ''
  if (t > now + SKEW) return date(t, now)
  const diff = Math.max(0, now - t)
  if (diff < MIN) return 'just now'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`
  return date(t, now)
}

/** Post stamps the way X writes them: "now", "12m", "20h", "Sep 23", "Sep 23, 2025". */
export function postStamp(iso: string, now: number): string {
  const t = toTime(iso)
  if (Number.isNaN(t)) return ''
  if (t > now + SKEW) return date(t, now)
  const diff = Math.max(0, now - t)
  if (diff < MIN) return 'now'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`
  return date(t, now)
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

/** "EDT" or "EST", whichever Michigan is on at that instant. */
export function zone(now: number): string {
  return ZONE.formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? ''
}

export function year(iso: string): string {
  return YEAR.format(toTime(iso))
}

// ── Numbers in sentences ──

const WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
]

// A no-break space: a number never wraps away from the word it counts.
const NBSP = '\u00a0'

/** Small counts as words ("six"), larger ones as digits. */
export function spell(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < WORDS.length ? WORDS[n] : String(n)
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

// ── Releases ──

/**
 * A run of releases: two or more where each one is no more than a calendar day
 * after the one before. This is the newest such run, so a lone release cut
 * later does not erase the last real burst.
 */
export type Burst = { count: number; days: number; from: string; to: string }

export function releaseBurst(releases: Release[]): Burst | null {
  const times = releases
    .map((r) => toTime(r.publishedAt))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => b - a)
  for (let start = 0; start < times.length; ) {
    let end = start + 1
    while (end < times.length && localDay(times[end - 1]) - localDay(times[end]) <= 1) end++
    if (end - start >= 2) {
      const to = times[start]
      const from = times[end - 1]
      return {
        count: end - start,
        days: localDay(to) - localDay(from) + 1,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      }
    }
    start = end
  }
  return null
}

/**
 * "Six releases in three days, July 17 to 19." Each number is held to its word
 * by a no-break space, and so is "to" in the range ("to 19", "to August 1").
 */
export function burstSentence(b: Burst): string {
  const count = spell(b.count)
  const lead = `${count[0].toUpperCase()}${count.slice(1)}${NBSP}releases`
  const [fromMonth, fromDay] = LONG_DATE.format(toTime(b.from)).split(' ') // "July 17"
  const [toMonth, toDay] = LONG_DATE.format(toTime(b.to)).split(' ')
  const from = `${fromMonth}${NBSP}${fromDay}`
  if (b.days === 1) return `${lead} on ${toMonth}${NBSP}${toDay}.`
  const to = fromMonth === toMonth ? toDay : `${toMonth}${NBSP}${toDay}`
  return `${lead} in ${spell(b.days)}${NBSP}days, ${from} to${NBSP}${to}.`
}

// ── Projects × live data ──

type ProjectRef = { name: string; repos: string[]; dateLast: string }

function publicRepos(
  p: Pick<ProjectRef, 'repos'>,
  repos: Record<string, RepoLive> | undefined,
): [string, RepoLive][] {
  return p.repos.flatMap((r) => {
    const live = repos?.[r]
    return live && !live.isPrivate ? [[r, live] as [string, RepoLive]] : []
  })
}

/** My newest default-branch commit across a project's public repos. */
export function lastCommit(
  p: Pick<ProjectRef, 'repos'>,
  repos: Record<string, RepoLive> | undefined,
): Commit | null {
  let best: Commit | null = null
  for (const [, live] of publicRepos(p, repos)) {
    const c = live.recent[0]
    if (c && (!best || toTime(c.date) > toTime(best.date))) best = c
  }
  return best
}

/** Most recent commit first; projects without data fall back to dateLast. */
export function orderProjects<T extends Pick<ProjectRef, 'repos' | 'dateLast'>>(
  projects: T[],
  repos: Record<string, RepoLive> | undefined,
): T[] {
  const key = (p: T) => toTime(lastCommit(p, repos)?.date ?? p.dateLast)
  return [...projects].sort((a, b) => key(b) - key(a))
}

type LatestCommit = {
  repo: string
  commit: Commit
  count: number | null
}

/** My newest commit across every project's public repos. */
export function latestCommit(
  projects: Pick<ProjectRef, 'repos'>[],
  repos: Record<string, RepoLive> | undefined,
): LatestCommit | null {
  let out: LatestCommit | null = null
  for (const p of projects)
    for (const [repo, live] of publicRepos(p, repos)) {
      const c = live.recent[0]
      if (c && (!out || toTime(c.date) > toTime(out.commit.date)))
        out = { repo, commit: c, count: live.commits }
    }
  return out
}

type LatestRelease = {
  project: string
  repo: string
  release: Release
  burst: Burst | null
  live: RepoLive
}

/** The newest published release across every project's public repos. */
export function latestRelease(
  projects: Pick<ProjectRef, 'name' | 'repos'>[],
  repos: Record<string, RepoLive> | undefined,
): LatestRelease | null {
  let out: LatestRelease | null = null
  for (const p of projects)
    for (const [repo, live] of publicRepos(p, repos)) {
      const r = live.releases[0]
      if (r && (!out || toTime(r.publishedAt) > toTime(out.release.publishedAt)))
        out = { project: p.name, repo, release: r, burst: null, live }
    }
  if (!out) return null
  // The slide's burst line is only about a run that ends with this release.
  const burst = releaseBurst(out.live.releases)
  const ends = burst && toTime(burst.to) === toTime(out.release.publishedAt)
  return { ...out, burst: ends ? burst : null }
}

export type Stat = { value: string; label: string }

/**
 * The four GitHub numbers, in order. Each one drops out when its data is
 * missing rather than showing a guess. A number inside a label is held to the
 * word it counts by a no-break space.
 */
export function githubStats({
  featured,
  projects,
  repos,
  languages,
}: {
  featured: Pick<ProjectRef, 'name' | 'repos'> | undefined
  projects: { dateFirst: string }[]
  repos: Record<string, RepoLive> | undefined
  languages: string[] | undefined
}): Stat[] {
  const stats: Stat[] = []
  const live = featured ? publicRepos(featured, repos)[0]?.[1] : undefined
  const burst = live ? releaseBurst(live.releases) : null
  if (featured && burst)
    stats.push({
      value: String(burst.count),
      label: `${featured.name} releases in ${burst.days}${NBSP}${plural(burst.days, 'day')}`,
    })
  if (featured && live && live.stars !== null) {
    const forks = live.forks ? `, ${live.forks}${NBSP}${plural(live.forks, 'fork')}` : ''
    stats.push({
      value: String(live.stars),
      label: `${plural(live.stars, 'star')} on ${featured.name}${forks}`,
    })
  }
  if (languages?.length)
    stats.push({
      value: String(languages.length),
      label: `${plural(languages.length, 'language')} across public repos`,
    })
  const since = projects.map((p) => Number(year(p.dateFirst))).filter(Number.isFinite)
  if (since.length)
    stats.push({
      value: String(projects.length),
      label: `${plural(projects.length, 'project')} built since ${Math.min(...since)}`,
    })
  return stats
}

export type RepoRow = {
  name: string
  url: string
  line: string
  language: Language | null
}

/**
 * The Repositories list: my pinned repos on GitHub that are also public
 * project repos, in pinned order, topped up with the most recently committed
 * project repos. Only project repos qualify, since only they carry a line;
 * that also keeps out every repo the build skips, none of which is one.
 */
export function repoRows(
  projects: (Pick<ProjectRef, 'repos' | 'dateLast'> & { tagline: string })[],
  repos: Record<string, RepoLive> | undefined,
  pinned: string[] | undefined,
  max = 4,
): RepoRow[] {
  const rows = new Map<string, RepoRow>()
  const byLower = new Map(
    projects.flatMap((p) =>
      publicRepos(p, repos).map(([repo, live]) => [repo.toLowerCase(), { p, repo, live }] as const),
    ),
  )
  const add = (key: string) => {
    const hit = byLower.get(key.toLowerCase())
    if (!hit || rows.has(hit.repo)) return
    rows.set(hit.repo, {
      name: hit.repo,
      url: isGithubUrl(hit.live.url) ? hit.live.url : `https://github.com/${hit.repo}`,
      line: hit.p.tagline,
      language: hit.live.language,
    })
  }
  for (const r of pinned ?? []) add(r)
  for (const p of orderProjects(projects, repos)) for (const r of p.repos) add(r)
  return [...rows.values()].slice(0, max)
}

// ── X ──

type PagePosts = {
  latest: Post | null
  pinned: Post | null
  list: Post[]
}

/**
 * The slider gets the newest readable post that is not pinned. The X tab
 * shows the pinned post, then the next two readable posts, so no post shows
 * twice on the page.
 */
export function pagePosts(x: LiveSnapshot['x'] | undefined): PagePosts {
  if (!x) return { latest: null, pinned: null, list: [] }
  const posts = readable(x.posts)
  const pinned = x.pinned && readable([x.pinned]).length ? x.pinned : null
  const latest = posts.find((p) => p.id !== pinned?.id) ?? null
  const rest = posts.filter((p) => p.id !== latest?.id && p.id !== pinned?.id).slice(0, 2)
  return { latest, pinned, list: pinned ? [pinned, ...rest] : rest }
}
