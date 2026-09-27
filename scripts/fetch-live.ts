/**
 * Build-time live snapshot. Runs as predev and prebuild.
 *
 * Writes lib/generated/live.ts (imported by the site) and public/live.json
 * (served, and used as the cache between CI runs). Rules:
 *  - never throws: every section degrades to its previous value, then to null
 *  - zero runtime dependencies: global fetch only
 *  - GitHub needs GH_PAT or GITHUB_TOKEN; X needs X_BEARER_TOKEN
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SIGNALS, GITHUB_USER, X_HANDLE } from '../app/signals'
import { WEBSITE_URL } from '../lib/constants'
import type { LiveSnapshot, Push, RepoLive } from '../lib/live'

const ROOT = process.cwd()
const OUT_TS = join(ROOT, 'lib/generated/live.ts')
const OUT_JSON = join(ROOT, 'public/live.json')

// Local runs read tokens from .env.local (gitignored). CI passes them as env.
function loadEnvLocal() {
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}

type Github = NonNullable<LiveSnapshot['github']>
type X = NonNullable<LiveSnapshot['x']>

function log(msg: string) {
  console.log(`[fetch-live] ${msg}`)
}

async function fetchJson(url: string, init: RequestInit = {}, ms = 10_000): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

function isSnapshot(v: unknown): v is LiveSnapshot {
  return !!v && typeof v === 'object' && 'builtAt' in v && 'github' in v && 'x' in v
}

async function previousSnapshot(): Promise<LiveSnapshot | null> {
  try {
    const remote = await fetchJson(`${WEBSITE_URL}/live.json`, {}, 8_000)
    if (isSnapshot(remote)) {
      log('cache: loaded the deployed live.json')
      return remote
    }
  } catch {
    // fall through to the local copy
  }
  try {
    if (existsSync(OUT_JSON)) {
      const local = JSON.parse(readFileSync(OUT_JSON, 'utf8'))
      if (isSnapshot(local)) {
        log('cache: loaded the local public/live.json')
        return local
      }
    }
  } catch {
    // no usable cache
  }
  log('cache: none')
  return null
}

function buildSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'local'
  }
}

// Local fallback: reuse a logged-in gh CLI session so no token file is needed.
// Held in memory only, never written anywhere.
function ghCliToken(): string | undefined {
  if (process.env.CI) return undefined
  try {
    return (
      execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ||
      undefined
    )
  } catch {
    return undefined
  }
}

// ── GitHub ──

const LEVEL: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

type GqlCommit = { oid: string; messageHeadline: string; committedDate: string; url: string }
type GqlRepo = null | {
  isPrivate: boolean
  url: string
  pushedAt: string | null
  defaultBranchRef: null | {
    target: null | {
      history?: { nodes: GqlCommit[] }
      recent?: { totalCount: number }
    }
  }
}
const SITE_REPO = `${GITHUB_USER}/${GITHUB_USER}.github.io`.toLowerCase()

type GqlPushed = {
  nameWithOwner: string
  isPrivate: boolean
  isFork: boolean
  url: string
  description: string | null
  primaryLanguage: { name: string } | null
  defaultBranchRef: null | {
    target: null | { mine?: { nodes: { committedDate: string }[] } }
  }
}

type GqlUser = {
  name: string | null
  avatarUrl: string
  bio: string | null
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number
      weeks: {
        contributionDays: { date: string; contributionCount: number; contributionLevel: string }[]
      }[]
    }
  }
  repositories: {
    nodes: { languages: { edges: { size: number; node: { name: string } }[] } }[]
  }
  pushed: { nodes: GqlPushed[] }
}

async function gql(token: string, query: string, variables: Record<string, unknown>) {
  return (await fetchJson('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'kuladeepmantri.com build',
    },
    body: JSON.stringify({ query, variables }),
  })) as { data?: Record<string, unknown>; errors?: { message: string }[] }
}

async function fetchGithub(token: string): Promise<Github> {
  // The node id lets the main query keep only commits I authored.
  const who = await gql(token, 'query($login: String!) { user(login: $login) { id } }', {
    login: GITHUB_USER,
  })
  const uid = (who.data?.user as { id: string } | undefined)?.id
  if (!uid) throw new Error('could not resolve the GitHub user id')

  const repos = [...new Set(SIGNALS.flatMap((s) => s.repos))]
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  const aliases = repos
    .map((full, i) => {
      const [owner, name] = full.split('/')
      return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ...R }`
    })
    .join('\n')
  const query = `
query($login: String!, $since: GitTimestamp!, $uid: ID!) {
  user(login: $login) {
    name avatarUrl bio
    contributionsCollection { contributionCalendar { totalContributions
      weeks { contributionDays { date contributionCount contributionLevel } } } }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      nodes { languages(first: 5, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name } } } }
    }
    pushed: repositories(first: 25, orderBy: {field: PUSHED_AT, direction: DESC},
      ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]) {
      nodes { nameWithOwner isPrivate isFork url description primaryLanguage { name }
        defaultBranchRef { target { ... on Commit {
          mine: history(first: 1, author: {id: $uid}) { nodes { committedDate } } } } } }
    }
  }
  ${aliases}
}
fragment R on Repository {
  isPrivate url pushedAt
  defaultBranchRef { target { ... on Commit {
    history(first: 3) { nodes { oid messageHeadline committedDate url } }
    recent: history(since: $since) { totalCount }
  } } }
}`

  const res = await gql(token, query, { login: GITHUB_USER, since, uid })

  // Partial data is normal (a private repo errors, the rest still resolve).
  if (res.errors?.length) log(`github: ${res.errors.length} partial error(s): ${res.errors[0].message}`)
  const data = res.data
  const user = data?.user as GqlUser | undefined
  if (!user) throw new Error('no user in GraphQL response')

  const cal = user.contributionsCollection.contributionCalendar
  const weeks = cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVEL[d.contributionLevel] ?? 0,
    })),
  )

  const bytes = new Map<string, number>()
  for (const r of user.repositories.nodes)
    for (const e of r.languages.edges)
      bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size)
  const languages = [...bytes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, b]) => ({ name, bytes: b }))

  const repoOut: Record<string, RepoLive> = {}
  repos.forEach((full, i) => {
    const r = data?.[`r${i}`] as GqlRepo | undefined
    if (!r || r.isPrivate) {
      // Missing (no access) or private: never expose commit messages.
      repoOut[full] = { isPrivate: true, url: '', pushedAt: null, commits30d: 0, recent: [] }
      return
    }
    const target = r.defaultBranchRef?.target
    repoOut[full] = {
      isPrivate: false,
      url: r.url,
      pushedAt: r.pushedAt,
      commits30d: target?.recent?.totalCount ?? 0,
      recent: (target?.history?.nodes ?? []).map((c) => ({
        sha: c.oid,
        message: c.messageHeadline,
        date: c.committedDate,
        url: c.url,
      })),
    }
  })

  // Only repos where my own latest commit is known, newest first. Private repos
  // contribute a timestamp and nothing else: live.json is public.
  const pushes: Push[] = user.pushed.nodes
    .filter((r) => !r.isFork && r.nameWithOwner.toLowerCase() !== SITE_REPO)
    .flatMap((r): Push[] => {
      const at = r.defaultBranchRef?.target?.mine?.nodes[0]?.committedDate
      if (!at) return []
      return r.isPrivate
        ? [{ repo: null, isPrivate: true, pushedAt: at, url: null, description: null, language: null }]
        : [
            {
              repo: r.nameWithOwner,
              isPrivate: false,
              pushedAt: at,
              url: r.url,
              description: r.description,
              language: r.primaryLanguage?.name ?? null,
            },
          ]
    })
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
    .slice(0, 12)

  return {
    user: { name: user.name ?? 'Kuladeep Mantri', avatarUrl: user.avatarUrl, bio: user.bio },
    totalContributions: cal.totalContributions,
    weeks,
    languages,
    repos: repoOut,
    pushes,
  }
}

// ── X ──

type XUser = {
  data?: {
    id: string
    name: string
    description: string
    profile_image_url: string
    verified?: boolean
    verified_type?: string
  }
}
type XTweets = { data?: { id: string; text: string; created_at: string }[] }

async function fetchX(token: string, prev: X | null): Promise<X> {
  const headers = { Authorization: `Bearer ${token}` }
  let profile: Omit<X, 'posts' | 'sinceId'>
  const stale =
    !prev || Date.now() - new Date(prev.profileFetchedAt).getTime() > 24 * 3600 * 1000
  if (stale) {
    const u = (await fetchJson(
      `https://api.x.com/2/users/by/username/${X_HANDLE}?user.fields=description,profile_image_url,name,verified,verified_type`,
      { headers },
    )) as XUser
    if (!u.data) throw new Error('no user in X response')
    profile = {
      userId: u.data.id,
      name: u.data.name,
      bio: u.data.description,
      avatarUrl: u.data.profile_image_url,
      verified: !!u.data.verified || (!!u.data.verified_type && u.data.verified_type !== 'none'),
      profileFetchedAt: new Date().toISOString(),
    }
    log('x: profile refreshed')
  } else {
    profile = {
      userId: prev.userId,
      name: prev.name,
      bio: prev.bio,
      avatarUrl: prev.avatarUrl,
      verified: prev.verified,
      profileFetchedAt: prev.profileFetchedAt,
    }
  }

  const params = new URLSearchParams({
    max_results: '5',
    exclude: 'replies,retweets',
    'tweet.fields': 'created_at',
  })
  if (prev?.sinceId) params.set('since_id', prev.sinceId)
  const t = (await fetchJson(
    `https://api.x.com/2/users/${profile.userId}/tweets?${params}`,
    { headers },
  )) as XTweets
  const fresh = (t.data ?? []).map((p) => ({
    id: p.id,
    text: p.text,
    createdAt: p.created_at,
    url: `https://x.com/${X_HANDLE}/status/${p.id}`,
  }))
  const seen = new Set(fresh.map((p) => p.id))
  const posts = [...fresh, ...(prev?.posts ?? []).filter((p) => !seen.has(p.id))].slice(0, 5)
  log(`x: ${fresh.length} new post(s)`)
  return { ...profile, posts, sinceId: posts[0]?.id ?? prev?.sinceId ?? null }
}

// ── main ──

function write(snap: LiveSnapshot) {
  mkdirSync(join(ROOT, 'lib/generated'), { recursive: true })
  const ts =
    `// AUTO-GENERATED by scripts/fetch-live.ts. Do not edit or commit.\n` +
    `import type { LiveSnapshot } from '../live'\n\n` +
    `export const LIVE: LiveSnapshot = ${JSON.stringify(snap, null, 2)}\n`
  writeFileSync(OUT_TS, ts)
  writeFileSync(OUT_JSON, JSON.stringify(snap))
}

async function main() {
  loadEnvLocal()
  const sha = buildSha()


  const prev = await previousSnapshot()
  const snap: LiveSnapshot = {
    builtAt: new Date().toISOString(),
    sha,
    github: prev?.github ?? null,
    x: prev?.x ?? null,
  }

  const ghToken = process.env.GH_PAT || process.env.GITHUB_TOKEN || ghCliToken()
  if (ghToken) {
    try {
      snap.github = await fetchGithub(ghToken)
      const n = Object.values(snap.github.repos).filter((r) => !r.isPrivate).length
      log(`github: ok, ${snap.github.totalContributions} contributions, ${n} public project repo(s)`)
    } catch (e) {
      log(`github: failed (${(e as Error).message}), ${snap.github ? 'kept cached' : 'no data'}`)
    }
  } else {
    log(`github: no token, ${snap.github ? 'kept cached' : 'no data'}`)
  }

  const xToken = process.env.X_BEARER_TOKEN
  if (xToken) {
    try {
      snap.x = await fetchX(xToken, snap.x)
      log(`x: ok, ${snap.x.posts.length} post(s)`)
    } catch (e) {
      log(`x: failed (${(e as Error).message}), ${snap.x ? 'kept cached' : 'no data'}`)
    }
  } else {
    log(`x: no token, ${snap.x ? 'kept cached' : 'no data'}`)
  }

  write(snap)
}

main().catch((e) => {
  // Last resort: an empty snapshot so the build still succeeds.
  log(`unexpected error (${(e as Error).message}), writing an empty snapshot`)
  try {
    write({ builtAt: new Date().toISOString(), sha: buildSha(), github: null, x: null })
  } catch {
    // nothing else to do
  }
})
