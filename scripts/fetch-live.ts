/**
 * Build-time live snapshot. Runs as predev and prebuild.
 *
 * Writes lib/generated/live.ts (imported by the site) and public/live.json
 * (the published snapshot, which the next build reads back as its cache).
 * Rules:
 *  - never throws: every section degrades to its previous value, then to null
 *  - zero runtime dependencies: global fetch only
 *  - GitHub needs GH_PAT or GITHUB_TOKEN (tried in that order); X needs
 *    X_BEARER_TOKEN. Set X_FULL_REFRESH=1 to refetch X posts from scratch.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SIGNALS, GITHUB_USER, X_HANDLE } from '../app/signals'
import { WEBSITE_URL } from '../lib/constants'
import {
  PUSHES_MAX,
  isGithubUrl,
  isSkippedRepo,
  type LiveSnapshot,
  type Push,
  type RepoLive,
} from '../lib/live'

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

// A GitHub Actions annotation in CI, a plain log line elsewhere.
function warn(msg: string) {
  console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `[fetch-live] warning: ${msg}`)
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function fetchJson(url: string, init: RequestInit = {}, ms = 10_000): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new HttpError(res.status, `${res.status} ${res.statusText} for ${url}`)
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
      execSync('gh auth token', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim() || undefined
    )
  } catch {
    return undefined
  }
}

// ── GitHub ──

type GqlCommit = { oid: string; messageHeadline: string; committedDate: string; url: string }
type GqlRepo = null | {
  isPrivate: boolean
  url: string
  pushedAt: string | null
  defaultBranchRef: null | { target: null | { history?: { nodes: GqlCommit[] } } }
}

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
  bio: string | null
  contributionsCollection: { contributionCalendar: { totalContributions: number } }
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
  })) as { data?: Record<string, unknown>; errors?: { message: string; path?: unknown[] }[] }
}

async function fetchGithub(token: string, prev: Github | null): Promise<Github> {
  // The node id lets the main query keep only commits I authored.
  const who = await gql(token, 'query($login: String!) { user(login: $login) { id } }', {
    login: GITHUB_USER,
  })
  const uid = (who.data?.user as { id: string } | undefined)?.id
  if (!uid) throw new Error('could not resolve the GitHub user id')

  const repos = [...new Set(SIGNALS.flatMap((s) => s.repos))]
  const aliases = repos
    .map((full, i) => {
      const [owner, name] = full.split('/')
      return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ...R }`
    })
    .join('\n')
  const query = `
query($login: String!, $uid: ID!) {
  user(login: $login) {
    name bio
    contributionsCollection { contributionCalendar { totalContributions } }
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
  } } }
}`

  const res = await gql(token, query, { login: GITHUB_USER, uid })

  // Partial data is normal (a repo the token cannot see errors, the rest resolve).
  if (res.errors?.length)
    log(`github: ${res.errors.length} partial error(s): ${res.errors[0].message}`)
  const data = res.data
  const user = data?.user as GqlUser | undefined
  if (!user) throw new Error('no user in GraphQL response')

  const cal = user.contributionsCollection.contributionCalendar

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
    if (!r) {
      // Not resolved this time (renamed, transferred, no access): keep what the
      // last good build knew, or leave it out so the site says nothing about it.
      const cached = prev?.repos[full]
      if (cached) repoOut[full] = cached
      warn(`github: ${full} did not resolve; ${cached ? 'kept cached data' : 'left out'}`)
      return
    }
    if (r.isPrivate) {
      // Never expose commit messages. Private repos should not be in SIGNALS.
      repoOut[full] = { isPrivate: true, url: '', pushedAt: null, recent: [] }
      warn(`github: ${full} is private but listed in SIGNALS, which makes its name public`)
      return
    }
    const target = r.defaultBranchRef?.target
    repoOut[full] = {
      isPrivate: false,
      url: isGithubUrl(r.url) ? r.url : `https://github.com/${full}`,
      pushedAt: r.pushedAt,
      recent: (target?.history?.nodes ?? []).map((c) => ({
        sha: c.oid,
        message: c.messageHeadline,
        date: c.committedDate,
        url: isGithubUrl(c.url) ? c.url : `https://github.com/${full}`,
      })),
    }
  })

  // Only repos where my own latest commit is known, newest first. Private repos
  // contribute a timestamp and nothing else: live.json is public.
  const pushes: Push[] = user.pushed.nodes
    .filter((r) => !r.isFork && !isSkippedRepo(r.nameWithOwner))
    .flatMap((r): Push[] => {
      const at = r.defaultBranchRef?.target?.mine?.nodes[0]?.committedDate
      if (!at) return []
      return r.isPrivate
        ? [
            {
              repo: null,
              isPrivate: true,
              pushedAt: at,
              url: null,
              description: null,
              language: null,
            },
          ]
        : [
            {
              repo: r.nameWithOwner,
              isPrivate: false,
              pushedAt: at,
              url: isGithubUrl(r.url) ? r.url : `https://github.com/${r.nameWithOwner}`,
              description: r.description,
              language: r.primaryLanguage?.name ?? null,
            },
          ]
    })
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
    .slice(0, PUSHES_MAX)

  return {
    user: { name: user.name ?? 'Kuladeep Mantri', bio: user.bio },
    totalContributions: cal.totalContributions,
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
    verified?: boolean
    verified_type?: string
  }
}
type XTweets = { data?: { id: string; text: string; created_at: string }[] }

const DAY_MS = 24 * 3600 * 1000

// Hourly runs fetch only posts newer than the last one seen. Once a day (or
// with X_FULL_REFRESH=1) the profile and the latest posts are fetched from
// scratch and replace the cache, so a deleted or edited post drops out.
async function fetchX(token: string, prev: X | null, forceFull: boolean): Promise<X> {
  const headers = { Authorization: `Bearer ${token}` }
  let profile: Omit<X, 'posts' | 'sinceId'>
  const full = forceFull || !prev || Date.now() - Date.parse(prev.profileFetchedAt) > DAY_MS
  if (full) {
    const u = (await fetchJson(
      `https://api.x.com/2/users/by/username/${X_HANDLE}?user.fields=description,name,verified,verified_type`,
      { headers },
    )) as XUser
    if (!u.data) throw new Error('no user in X response')
    profile = {
      userId: u.data.id,
      name: u.data.name,
      bio: u.data.description,
      verified: !!u.data.verified || (!!u.data.verified_type && u.data.verified_type !== 'none'),
      profileFetchedAt: new Date().toISOString(),
    }
  } else {
    profile = {
      userId: prev.userId,
      name: prev.name,
      bio: prev.bio,
      verified: prev.verified,
      profileFetchedAt: prev.profileFetchedAt,
    }
  }

  const params = new URLSearchParams({
    max_results: '5',
    exclude: 'replies,retweets',
    'tweet.fields': 'created_at',
  })
  if (!full && prev?.sinceId) params.set('since_id', prev.sinceId)
  const t = (await fetchJson(`https://api.x.com/2/users/${profile.userId}/tweets?${params}`, {
    headers,
  })) as XTweets
  // Post ids are numeric; anything else never becomes a link.
  const fresh = (t.data ?? [])
    .filter((p) => /^\d+$/.test(p.id))
    .map((p) => ({
      id: p.id,
      text: p.text,
      createdAt: p.created_at,
      url: `https://x.com/${X_HANDLE}/status/${p.id}`,
    }))
  const seen = new Set(fresh.map((p) => p.id))
  const posts = full
    ? fresh
    : [...fresh, ...(prev?.posts ?? []).filter((p) => !seen.has(p.id))].slice(0, 5)
  log(full ? `x: full refresh, ${fresh.length} post(s)` : `x: ${fresh.length} new post(s)`)
  return { ...profile, posts, sinceId: posts[0]?.id ?? (full ? null : (prev?.sinceId ?? null)) }
}

// ── main ──

// Keep only the fields the site reads, so a cache written by an older version
// of this script does not carry dead data (or needless diffs) forward.
function slim(snap: LiveSnapshot | null): LiveSnapshot | null {
  if (!snap) return null
  const gh = snap.github
  const x = snap.x
  return {
    builtAt: snap.builtAt,
    sha: snap.sha,
    github: gh && {
      user: { name: gh.user?.name ?? 'Kuladeep Mantri', bio: gh.user?.bio ?? null },
      totalContributions: gh.totalContributions ?? 0,
      languages: gh.languages ?? [],
      repos: Object.fromEntries(
        Object.entries(gh.repos ?? {}).map(([k, r]) => [
          k,
          { isPrivate: r.isPrivate, url: r.url, pushedAt: r.pushedAt, recent: r.recent ?? [] },
        ]),
      ),
      pushes: (gh.pushes ?? []).filter((p) => !p.repo || !isSkippedRepo(p.repo)),
    },
    x: x && {
      userId: x.userId,
      profileFetchedAt: x.profileFetchedAt,
      bio: x.bio,
      name: x.name,
      verified: x.verified,
      posts: x.posts ?? [],
      sinceId: x.sinceId ?? null,
    },
  }
}

function write(snap: LiveSnapshot) {
  mkdirSync(join(ROOT, 'lib/generated'), { recursive: true })
  const ts =
    `// AUTO-GENERATED by scripts/fetch-live.ts. Do not edit or commit.\n` +
    `import type { LiveSnapshot } from '../live'\n\n` +
    // Cast rather than annotate: a cached snapshot with an older or newer shape
    // must never fail the build on excess-property checks.
    `export const LIVE = ${JSON.stringify(snap, null, 2)} as unknown as LiveSnapshot\n`
  writeFileSync(OUT_TS, ts)
  writeFileSync(OUT_JSON, JSON.stringify(snap))
}

// Hoisted so the last-resort handler can still write the cached data.
let prev: LiveSnapshot | null = null

async function main() {
  loadEnvLocal()
  prev = slim(await previousSnapshot())
  const snap: LiveSnapshot = {
    builtAt: new Date().toISOString(),
    sha: buildSha(),
    github: prev?.github ?? null,
    x: prev?.x ?? null,
  }

  // GH_PAT first, then the workflow's GITHUB_TOKEN, then a local gh login. A
  // rejected token (401) falls through to the next one instead of freezing
  // the data behind a warning nobody reads.
  const tokens: [string, () => string | undefined][] = [
    ['GH_PAT', () => process.env.GH_PAT],
    ['GITHUB_TOKEN', () => process.env.GITHUB_TOKEN],
    ['gh CLI', ghCliToken],
  ]
  let tried = false
  for (const [name, get] of tokens) {
    const token = get()
    if (!token) continue
    tried = true
    try {
      snap.github = await fetchGithub(token, prev?.github ?? null)
      const n = Object.values(snap.github.repos).filter((r) => !r.isPrivate).length
      log(
        `github: ok via ${name}, ${snap.github.totalContributions} contributions, ${n} public project repo(s)`,
      )
      break
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        warn(`github: ${name} was rejected (401), trying the next token`)
        continue
      }
      log(`github: failed (${(e as Error).message}), ${snap.github ? 'kept cached' : 'no data'}`)
      break
    }
  }
  if (!tried) log(`github: no token, ${snap.github ? 'kept cached' : 'no data'}`)

  const xToken = process.env.X_BEARER_TOKEN
  if (xToken) {
    try {
      snap.x = await fetchX(xToken, snap.x, process.env.X_FULL_REFRESH === '1')
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
  // Last resort: keep whatever the cache held so the build still succeeds.
  log(`unexpected error (${(e as Error).message}), writing the cached snapshot`)
  try {
    write({
      builtAt: new Date().toISOString(),
      sha: buildSha(),
      github: prev?.github ?? null,
      x: prev?.x ?? null,
    })
  } catch {
    // nothing else to do
  }
})
