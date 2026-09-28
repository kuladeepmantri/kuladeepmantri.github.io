// Browser refresh: makes a new public push show up within minutes, before the
// next scheduled rebuild. Uses GitHub's unauthenticated REST API (60 requests
// per hour per visitor IP). Answers, failures included, are cached in
// localStorage for 10 minutes and shared by every tab. Anything unexpected
// keeps the build snapshot, silently.

import { GITHUB_USER } from '@/app/signals'
import { PUSHES_MAX, isSkippedRepo, type Commit, type Push, type RepoLive } from './live'

const TTL = 10 * 60_000
// A push event's time is when it reached GitHub, a little after its commit.
const SLACK = 60_000
const MAX_COMMIT_CALLS = 2
const EVENTS_KEY = 'km-events'
const COMMITS_KEY = 'km-commits:'

type PushEvent = { repo: string; at: string }
type Cached<T> = { at: number; key?: string; v: T | null }

let lastRun = 0

const lower = (s: string) => s.toLowerCase()

function isTime(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v))
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

/** My public push events, newest first, or null when GitHub did not answer. */
async function getEvents(): Promise<PushEvent[] | null> {
  const hit = readCache(EVENTS_KEY, isEvents)
  if (hit !== undefined) return hit
  const list = await getJson(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
  )
  const events = Array.isArray(list)
    ? list
        .filter(
          (e) =>
            e?.type === 'PushEvent' && typeof e.repo?.name === 'string' && isTime(e.created_at),
        )
        .map((e): PushEvent => ({ repo: e.repo.name, at: e.created_at }))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    : null
  writeCache(EVENTS_KEY, events)
  return events
}

const isCommits = (v: unknown): v is Commit[] =>
  Array.isArray(v) &&
  v.every((c) => typeof c?.sha === 'string' && typeof c?.message === 'string' && isTime(c?.date))

/** The latest commits on a repo's default branch, cached per repo and push. */
async function getCommits(repo: string, pushedAt: string): Promise<Commit[] | null> {
  const name = COMMITS_KEY + lower(repo)
  const hit = readCache(name, isCommits, pushedAt)
  if (hit !== undefined) return hit
  const list = await getJson(`https://api.github.com/repos/${repo}/commits?per_page=3`)
  const commits = Array.isArray(list)
    ? list
        .filter((c) => typeof c?.sha === 'string' && typeof c?.commit?.message === 'string')
        .map(
          (c): Commit => ({
            sha: c.sha,
            message: c.commit.message.split('\n')[0],
            date: [c.commit.committer?.date, c.commit.author?.date].find(isTime) ?? pushedAt,
            // Only ever link to GitHub itself.
            url:
              typeof c.html_url === 'string' && c.html_url.startsWith('https://github.com/')
                ? c.html_url
                : `https://github.com/${repo}`,
          }),
        )
    : null
  writeCache(name, commits?.length ? commits : null, pushedAt)
  return commits?.length ? commits : null
}

export type Refreshed = {
  repos: Record<string, RepoLive> | null
  pushes: Push[] | null
}

/** Newer data than the build snapshot, or nulls when there is nothing new. */
export async function refresh(
  builtAt: string,
  repos: Record<string, RepoLive>,
  pushes: Push[],
): Promise<Refreshed> {
  const none = { repos: null, pushes: null }
  const built = Date.parse(builtAt)
  // Once per TTL per page, and not at all while the snapshot itself is that fresh.
  if (Date.now() - lastRun < TTL || Date.now() - built < TTL) return none
  lastRun = Date.now()

  const events = await getEvents()
  if (!events) return none
  // Only pushes after the build, to repos the build already knows: project
  // repos and my recent public pushes. That keeps forks and the profile
  // README out, since the build excludes both.
  const known = new Set(
    [...Object.keys(repos), ...pushes.flatMap((p) => (p.repo ? [p.repo] : []))].map(lower),
  )
  const fresh = events.filter(
    (e) => Date.parse(e.at) > built && known.has(lower(e.repo)) && !isSkippedRepo(e.repo),
  )
  if (!fresh.length) return none
  return { pushes: newerPushes(fresh, pushes), repos: await newerRepos(fresh, repos) }
}

// The latest public push from the events feed, if it beats the snapshot.
function newerPushes(events: PushEvent[], pushes: Push[]): Push[] | null {
  const e = events[0]
  if (pushes[0] && Date.parse(e.at) <= Date.parse(pushes[0].pushedAt) + SLACK) return null
  const same = (p: Push) => !!p.repo && lower(p.repo) === lower(e.repo)
  const prior = pushes.find(same)
  const next: Push = {
    repo: prior?.repo ?? e.repo,
    isPrivate: false,
    pushedAt: e.at,
    url: prior?.url ?? `https://github.com/${e.repo}`,
    description: prior?.description ?? null,
    language: prior?.language ?? null,
  }
  return [next, ...pushes.filter((p) => !same(p))].slice(0, PUSHES_MAX)
}

async function newerRepos(
  events: PushEvent[],
  repos: Record<string, RepoLive>,
): Promise<Record<string, RepoLive> | null> {
  // Events report repo names with their real casing; SIGNALS may differ.
  const byLower = new Map(Object.keys(repos).map((k) => [lower(k), k]))
  const newest = new Map<string, string>()
  for (const e of events) {
    const key = byLower.get(lower(e.repo))
    if (!key || repos[key].isPrivate) continue
    const seen = newest.get(key)
    if (!seen || Date.parse(e.at) > Date.parse(seen)) newest.set(key, e.at)
  }

  const stale = [...newest.entries()]
    .filter(([key, at]) => {
      const r = repos[key]
      const known = Math.max(
        ...[r.recent[0]?.date, r.pushedAt].map((t) => (t ? Date.parse(t) || 0 : 0)),
      )
      return Date.parse(at) > known + SLACK
    })
    .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
    .slice(0, MAX_COMMIT_CALLS)
  if (!stale.length) return null

  const next = { ...repos }
  let changed = false
  await Promise.all(
    stale.map(async ([key, at]) => {
      const recent = await getCommits(key, at)
      if (!recent) return
      next[key] = { ...repos[key], pushedAt: at, recent }
      changed = true
    }),
  )
  return changed ? next : null
}
