// Browser refresh for the latest-commit slide: a commit of mine pushed to a
// public project repo after the build shows up within minutes, before the next
// scheduled rebuild. Uses GitHub's unauthenticated REST API (60 requests per
// hour per visitor IP). Answers, failures included, are cached in localStorage
// for 10 minutes and shared by every tab. The cache only ever holds pushes to
// and commits on the snapshot's public project repos. Anything unexpected
// keeps the build snapshot, silently.

import { GITHUB_USER } from '../app/signals'
import { isGithubUrl, type Commit, type RepoLive } from './live'

const TTL = 10 * 60_000
// A push event's time is when it reached GitHub, a little after its commit.
const SLACK = 60_000
const MAX_COMMIT_CALLS = 2
const MAX_RECENT = 3
const PER_PAGE = 10
// v3 events: older caches held every push, to other people's repos too.
// v3 commits: the cached page also says whether it came back full.
const EVENTS_KEY = 'km-events-v3'
const COMMITS_KEY = 'km-commits-v3:'
const OLD_EVENTS_KEYS = ['km-events', 'km-events-v2']
const OLD_COMMITS_KEYS = ['km-commits:', 'km-commits-v2:']

type PushEvent = { repo: string; at: string }
/** My commits from one page of the API, and whether that page was full. */
type Page = { commits: Commit[]; full: boolean }
type Cached<T> = { at: number; key?: string; v: T | null }

let lastRun = 0

const lower = (s: string) => s.toLowerCase()
const me = lower(GITHUB_USER)

function isTime(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v))
}

function isSha(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-f]{40}$/i.test(v)
}

function time(v: string | null | undefined): number {
  const t = v ? Date.parse(v) : NaN
  return Number.isNaN(t) ? 0 : t
}

/** A cached answer younger than the TTL; `undefined` is a miss, `null` a cached failure. */
function readCache<T>(
  name: string,
  valid: (v: unknown) => v is T,
  key?: string,
): T | null | undefined {
  try {
    const hit = JSON.parse(localStorage.getItem(name) ?? 'null') as Cached<unknown> | null
    const now = Date.now()
    if (!hit || typeof hit.at !== 'number' || hit.at > now || now - hit.at >= TTL) return undefined
    if (key !== undefined && hit.key !== key) return undefined
    if (hit.v === null) return null
    return valid(hit.v) ? hit.v : undefined
  } catch {
    return undefined
  }
}

function writeCache<T>(name: string, v: T | null, key?: string) {
  try {
    localStorage.setItem(name, JSON.stringify({ at: Date.now(), key, v }))
  } catch {
    // fine without the cache
  }
}

/** Drop caches written by older versions, best effort. `repos` are lowercase. */
function forgetOldCaches(repos: string[]) {
  try {
    for (const name of OLD_EVENTS_KEYS) localStorage.removeItem(name)
    for (const prefix of OLD_COMMITS_KEYS)
      for (const repo of repos) localStorage.removeItem(prefix + repo)
  } catch {
    // nothing to clean, or no storage
  }
}

async function getJson(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

const isEvents = (v: unknown): v is PushEvent[] =>
  Array.isArray(v) && v.every((e) => typeof e?.repo === 'string' && isTime(e?.at))

/**
 * My public pushes to the given repos (lowercase names), newest first, or
 * null when GitHub did not answer. The feed also lists pushes to other
 * people's repos; those are dropped before anything is cached.
 */
async function getEvents(repos: Set<string>): Promise<PushEvent[] | null> {
  const hit = readCache(EVENTS_KEY, isEvents)
  if (hit !== undefined) return hit
  const list = await getJson(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
  )
  const events = Array.isArray(list)
    ? list
        .filter(
          (e) =>
            e?.type === 'PushEvent' &&
            typeof e.repo?.name === 'string' &&
            repos.has(lower(e.repo.name)) &&
            isTime(e.created_at),
        )
        .map((e): PushEvent => ({ repo: e.repo.name, at: e.created_at }))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    : null
  writeCache(EVENTS_KEY, events)
  return events
}

const isCommits = (v: unknown): v is Commit[] =>
  Array.isArray(v) &&
  v.every(
    (c) =>
      isSha(c?.sha) && typeof c?.message === 'string' && isTime(c?.date) && isGithubUrl(c?.url),
  )

const isPage = (v: unknown): v is Page =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Page).full === 'boolean' &&
  isCommits((v as Page).commits)

/**
 * My latest commits on a repo's default branch, newest first, cached per repo
 * and push. The API's author filter also matches by email, so each commit must
 * also be linked to my account.
 */
async function getCommits(repo: string, pushedAt: string, repoUrl: string): Promise<Page | null> {
  const name = COMMITS_KEY + lower(repo)
  const hit = readCache(name, isPage, pushedAt)
  if (hit !== undefined) return hit
  const list = await getJson(
    `https://api.github.com/repos/${repo}/commits?author=${encodeURIComponent(GITHUB_USER)}&per_page=${PER_PAGE}`,
  )
  const page: Page | null = Array.isArray(list)
    ? {
        commits: list
          .flatMap((c): Commit[] => {
            const login = c?.author?.login
            if (typeof login !== 'string' || lower(login) !== me) return []
            if (!isSha(c.sha) || typeof c.commit?.message !== 'string') return []
            const date = [c.commit.committer?.date, c.commit.author?.date].find(isTime)
            if (!date) return []
            return [
              {
                sha: c.sha,
                message: c.commit.message.split('\n')[0],
                date,
                // Only ever link to GitHub itself.
                url: isGithubUrl(c.html_url) ? c.html_url : repoUrl,
              },
            ]
          })
          .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
        full: list.length >= PER_PAGE,
      }
    : null
  writeCache(name, page, pushedAt)
  return page
}

/**
 * The project repos with a newer commit of mine than the build snapshot, or
 * null when nothing changed. Only the snapshot's public repos are ever looked
 * at; they are all SIGNALS project repos. Never throws.
 */
export async function refresh(
  builtAt: string,
  repos: Record<string, RepoLive>,
): Promise<Record<string, RepoLive> | null> {
  try {
    const now = Date.now()
    const built = Date.parse(builtAt)
    // Once per TTL per page, and not at all while the snapshot itself is that fresh.
    if (Number.isNaN(built) || now - lastRun < TTL || now - built < TTL) return null
    lastRun = now

    // Events report repo names with their real casing; SIGNALS may differ.
    const byLower = new Map<string, string>()
    for (const [key, r] of Object.entries(repos))
      if (r && r.isPrivate === false && /^[\w.-]+\/[\w.-]+$/.test(key)) byLower.set(lower(key), key)
    forgetOldCaches([...byLower.keys()])
    if (!byLower.size) return null

    const events = await getEvents(new Set(byLower.keys()))
    if (!events) return null
    const newest = new Map<string, string>()
    for (const e of events) {
      const key = byLower.get(lower(e.repo))
      if (!key || !(Date.parse(e.at) > built)) continue
      const seen = newest.get(key)
      if (!seen || Date.parse(e.at) > Date.parse(seen)) newest.set(key, e.at)
    }

    const stale = [...newest.entries()]
      .filter(([key, at]) => {
        const r = repos[key]
        return Date.parse(at) > Math.max(time(r.recent?.[0]?.date), time(r.pushedAt)) + SLACK
      })
      .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
      .slice(0, MAX_COMMIT_CALLS)
    if (!stale.length) return null

    const next = { ...repos }
    let changed = false
    await Promise.all(
      stale.map(async ([key, at]) => {
        const r = repos[key]
        const url = isGithubUrl(r.url) ? r.url : `https://github.com/${key}`
        const page = await getCommits(key, at, url)
        const fetched = page?.commits
        if (!page || !fetched?.length) return
        // A push can carry no new commit of mine (another branch, someone
        // else's work): then nothing changes.
        const top = r.recent?.[0]?.date
        const newer = top ? fetched.filter((c) => Date.parse(c.date) > Date.parse(top)) : fetched
        if (!newer.length) return
        // A full page that never reaches back to the snapshot's newest commit
        // may have left newer commits of mine off it: the count is unknown
        // until the next build.
        const counted = !(page.full && newer.length === fetched.length)
        next[key] = {
          ...r,
          pushedAt: at,
          recent: fetched.slice(0, MAX_RECENT),
          commits: counted && typeof r.commits === 'number' ? r.commits + newer.length : null,
        }
        changed = true
      }),
    )
    return changed ? next : null
  } catch {
    return null
  }
}
