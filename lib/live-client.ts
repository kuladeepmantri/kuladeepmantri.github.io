// Browser refresh: makes a new public push show up within seconds, before the
// next hourly rebuild. Uses GitHub's unauthenticated REST API (60 requests per
// hour per visitor IP). Any failure keeps the build snapshot, silently.

import { GITHUB_USER } from '@/app/signals'
import type { RepoLive } from './live'

const CACHE_KEY = 'km-events'
const TTL = 10 * 60_000
const MAX_COMMIT_CALLS = 2

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

async function events(): Promise<PushEvent[] | null> {
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
  const pushes = list.filter((e) => e.type === 'PushEvent')
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events: pushes }))
  } catch {
    // fine without the cache
  }
  return pushes
}

/** Returns an updated repo map when something newer than the snapshot exists. */
export async function refreshRepos(
  repos: Record<string, RepoLive>,
): Promise<Record<string, RepoLive> | null> {
  if (Date.now() - lastRun < TTL) return null
  lastRun = Date.now()

  const pushes = await events()
  if (!pushes) return null

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
