// Browser refresh: makes a new public push show up within seconds, before the
// next hourly rebuild. Uses GitHub's unauthenticated REST API (60 requests per
// hour per visitor IP). Any failure keeps the build snapshot, silently.

import { GITHUB_USER } from '@/app/signals'
import type { Push, RepoLive } from './live'

const CACHE_KEY = 'km-events'
const TTL = 10 * 60_000
const MAX_COMMIT_CALLS = 2
const SITE_REPO = `${GITHUB_USER}/${GITHUB_USER}.github.io`.toLowerCase()

type PushEvent = { type: string; repo: { name: string }; created_at: string }
type RestCommit = {
  sha: string
  html_url: string
  commit: { message: string; committer: { date: string } | null; author: { date: string } | null }
}

let lastRun = 0

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

async function getEvents(): Promise<PushEvent[] | null> {
  try {
    const hit = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
    if (hit && Date.now() - hit.at < TTL) return hit.events
  } catch {
    // storage unavailable, fetch instead
  }
  const list = await getJson<PushEvent[]>(
    `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`,
  )
  if (!list) return null
  const pushes = list
    .filter((e) => e.type === 'PushEvent')
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events: pushes }))
  } catch {
    // fine without the cache
  }
  return pushes
}

export type Refreshed = {
  repos: Record<string, RepoLive> | null
  pushes: Push[] | null
}

/** Newer data than the build snapshot, or nulls when there is nothing new. */
export async function refresh(repos: Record<string, RepoLive>, pushes: Push[]): Promise<Refreshed> {
  const none = { repos: null, pushes: null }
  if (Date.now() - lastRun < TTL) return none
  lastRun = Date.now()

  const events = await getEvents()
  if (!events) return none
  const mine = events.filter((e) => e.repo.name.toLowerCase() !== SITE_REPO)
  return { pushes: newerPushes(mine, pushes), repos: await newerRepos(mine, repos) }
}

// The latest public push from the events feed, if it beats the snapshot.
function newerPushes(events: PushEvent[], pushes: Push[]): Push[] | null {
  const e = events[0]
  if (!e || (pushes[0] && Date.parse(e.created_at) <= Date.parse(pushes[0].pushedAt))) return null
  const fresh: Push = {
    repo: e.repo.name,
    isPrivate: false,
    pushedAt: e.created_at,
    url: `https://github.com/${e.repo.name}`,
    description: null,
    language: null,
  }
  const rest = pushes.filter((p) => p.repo?.toLowerCase() !== e.repo.name.toLowerCase())
  return [fresh, ...rest].slice(0, 6)
}

async function newerRepos(
  pushes: PushEvent[],
  repos: Record<string, RepoLive>,
): Promise<Record<string, RepoLive> | null> {
  // Events report repo names with their real casing; SIGNALS may differ.
  const byLower = new Map(Object.keys(repos).map((k) => [k.toLowerCase(), k]))
  const newest = new Map<string, string>()
  for (const e of pushes) {
    const key = byLower.get(e.repo.name.toLowerCase())
    if (!key || repos[key].isPrivate) continue
    if (!newest.has(key) || e.created_at > newest.get(key)!) newest.set(key, e.created_at)
  }

  const stale = [...newest.entries()]
    .filter(([key, at]) => {
      const known = repos[key].recent[0]?.date ?? repos[key].pushedAt
      return !known || Date.parse(at) > Date.parse(known)
    })
    .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
    .slice(0, MAX_COMMIT_CALLS)
  if (!stale.length) return null

  const next = { ...repos }
  let changed = false
  await Promise.all(
    stale.map(async ([key, at]) => {
      const list = await getJson<RestCommit[]>(
        `https://api.github.com/repos/${key}/commits?per_page=3`,
      )
      if (!list?.length) return
      next[key] = {
        ...repos[key],
        pushedAt: at,
        recent: list.map((c) => ({
          sha: c.sha,
          message: c.commit.message.split('\n')[0],
          date: c.commit.committer?.date ?? c.commit.author?.date ?? at,
          url: c.html_url,
        })),
      }
      changed = true
    }),
  )
  return changed ? next : null
}
