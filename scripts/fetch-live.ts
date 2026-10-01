/**
 * Build-time live snapshot. Runs as predev and prebuild.
 *
 * Writes lib/generated/live.ts (imported by the site) and public/live.json
 * (the published snapshot, which the next build reads back as its cache).
 * Rules:
 *  - never throws: every section degrades to its previous value, then to null
 *  - zero runtime dependencies: global fetch only
 *  - GitHub needs GH_PAT or GITHUB_TOKEN (tried in that order, then a local gh
 *    login); X needs X_BEARER_TOKEN. Set X_FULL_REFRESH=1 to refetch X from
 *    scratch.
 *  - live.json is public: only my own commits, only public project repos, and
 *    never the name of a private repo beyond the SIGNALS key it already is.
 *  - tokens are never logged: a malformed one is skipped with a fixed message,
 *    and errors this script did not raise itself log only their name.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SIGNALS, GITHUB_USER, X_HANDLE } from '../app/signals'
import { WEBSITE_URL } from '../lib/constants'
import {
  isGithubUrl,
  safeColor,
  type Commit,
  type LiveSnapshot,
  type Post,
  type Release,
  type RepoLive,
} from '../lib/live'
import { isSkippedRepo } from '../lib/skip'

const ROOT = process.cwd()
const OUT_TS = join(ROOT, 'lib/generated/live.ts')
const OUT_JSON = join(ROOT, 'public/live.json')

const MAX_RECENT = 3
const MAX_RELEASES = 10
const MAX_POSTS = 10

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

/** An error whose message this script wrote, so it is safe to log. */
class KnownError extends Error {}

class HttpError extends KnownError {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * What a failure log line may say about an error. Other errors log only their
 * name: fetch rejects a bad header value with a message that quotes it, and
 * that header can be Authorization.
 */
export function why(e: unknown): string {
  return e instanceof KnownError ? e.message : e instanceof Error ? e.name : 'unknown error'
}

// Visible ASCII only, which is all a bearer token ever is. A CR, LF, or NUL
// inside one would make fetch throw an error that quotes the header.
const TOKEN_CHARS = /^[\x21-\x7e]+$/

/** The token when it can go in a header; otherwise a fixed warning and undefined. */
export function usableToken(name: string, token: string | undefined): string | undefined {
  // Surrounding whitespace (a pasted trailing newline) is dropped, as fetch does.
  const t = token?.trim()
  if (!t) return undefined
  if (TOKEN_CHARS.test(t)) return t
  warn(`${name} has invalid characters, skipped`)
  return undefined
}

async function fetchJson(url: string, init: RequestInit = {}, ms = 10_000): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new HttpError(res.status, `${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

// ── Validation shared by the fetchers and the cache ──

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isSha = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{40}$/i.test(v)
const isPostId = (v: unknown): v is string => typeof v === 'string' && /^\d+$/.test(v)
const isRepoName = (v: unknown): v is string =>
  typeof v === 'string' && /^[\w.-]+\/[\w.-]+$/.test(v)
const notNull = <T>(v: T | null): v is T => v !== null

function count(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

function repoUrl(full: string, u: unknown): string {
  return isGithubUrl(u) ? u : `https://github.com/${full}`
}

function postUrl(id: string): string {
  return `https://x.com/${X_HANDLE}/status/${id}`
}

function toLicense(spdx: unknown): string | null {
  return typeof spdx === 'string' && spdx !== '' && spdx !== 'NOASSERTION' ? spdx : null
}

function toLanguage(l: unknown): RepoLive['language'] {
  return isObj(l) && typeof l.name === 'string' && l.name !== ''
    ? { name: l.name, color: safeColor(l.color) }
    : null
}

/** Valid commits in the order given, up to 3. Links only ever go to GitHub. */
function toCommits(list: unknown, fallbackUrl: string): Commit[] {
  if (!Array.isArray(list)) return []
  return list
    .map((c): Commit | null =>
      isObj(c) && isSha(c.sha) && typeof c.message === 'string' && isTime(c.date)
        ? {
            sha: c.sha,
            message: c.message,
            date: c.date,
            url: isGithubUrl(c.url) ? c.url : fallbackUrl,
          }
        : null,
    )
    .filter(notNull)
    .slice(0, MAX_RECENT)
}

/** Published releases, newest first, up to 10. */
function toReleases(list: unknown, full: string): Release[] {
  if (!Array.isArray(list)) return []
  return list
    .map((r): Release | null =>
      isObj(r) && typeof r.tag === 'string' && r.tag !== '' && isTime(r.publishedAt)
        ? {
            tag: r.tag,
            publishedAt: r.publishedAt,
            url: isGithubUrl(r.url) ? r.url : `https://github.com/${full}/releases`,
          }
        : null,
    )
    .filter(notNull)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, MAX_RELEASES)
}

/** The only shape a private SIGNALS repo ever takes: no name, no data. */
function privateRepo(): RepoLive {
  return {
    isPrivate: true,
    url: '',
    pushedAt: null,
    recent: [],
    commits: null,
    stars: null,
    forks: null,
    language: null,
    license: null,
    releases: [],
  }
}

// ── Cache ──

function isSnapshot(v: unknown): v is Obj {
  return isObj(v) && 'builtAt' in v && 'github' in v && 'x' in v
}

async function previousSnapshot(): Promise<Obj | null> {
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
      const local: unknown = JSON.parse(readFileSync(OUT_JSON, 'utf8'))
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

function slimRepo(v: unknown, full: string): RepoLive | null {
  if (!isObj(v)) return null
  if (v.isPrivate !== false) return privateRepo()
  const url = repoUrl(full, v.url)
  // A cache written before commits were filtered by author has no `commits`
  // field, and its `recent` can hold other people's commits. Drop those.
  const authored = 'commits' in v
  return {
    isPrivate: false,
    url,
    pushedAt: isTime(v.pushedAt) ? v.pushedAt : null,
    recent: authored ? toCommits(v.recent, url) : [],
    commits: count(v.commits),
    stars: count(v.stars),
    forks: count(v.forks),
    language: toLanguage(v.language),
    license: toLicense(v.license),
    releases: toReleases(v.releases, full),
  }
}

function slimPost(v: unknown): Post | null {
  return isObj(v) && isPostId(v.id) && typeof v.text === 'string' && isTime(v.createdAt)
    ? { id: v.id, text: v.text, createdAt: v.createdAt, url: postUrl(v.id) }
    : null
}

function slimGithub(gh: Obj): Github {
  // Only repos still in SIGNALS: a repo taken off the list (say, because it
  // went private) stops appearing even when the next fetch fails. Keys take
  // the SIGNALS spelling, so a repo cached under other casing carries over
  // under the new key and the old key is dropped.
  const listed = new Map(SIGNALS.flatMap((s) => s.repos).map((r) => [r.toLowerCase(), r]))
  const cached = isObj(gh.repos) ? gh.repos : {}
  const repos: Record<string, RepoLive> = {}
  for (const [key, r] of Object.entries(cached)) {
    const full = listed.get(key.toLowerCase())
    // An entry already under the SIGNALS spelling wins over other casings.
    if (!full || (key !== full && full in cached)) continue
    const live = slimRepo(r, full)
    if (live) repos[full] = live
  }
  // The old shape was { name, bytes }[]; anything but plain names starts over.
  const langs: unknown[] = Array.isArray(gh.languages) ? gh.languages : []
  const languages = langs.every((l) => typeof l === 'string') ? (langs as string[]) : []
  const pins: unknown[] = Array.isArray(gh.pinned) ? gh.pinned : []
  return {
    repos,
    languages: [...new Set(languages)],
    pinned: pins.filter((p): p is string => isRepoName(p) && !isSkippedRepo(p)),
  }
}

function slimX(x: Obj): X | null {
  if (!isPostId(x.userId)) return null
  // A cache from before the pinned field also predates the thread-reply
  // filter, so its posts may be replies: drop them rather than show them if
  // the next fetch fails. That fetch is a full refresh anyway.
  const fresh = 'pinned' in x
  const posts: unknown[] = fresh && Array.isArray(x.posts) ? x.posts : []
  return {
    userId: x.userId,
    profileFetchedAt: isTime(x.profileFetchedAt) ? x.profileFetchedAt : new Date(0).toISOString(),
    name: typeof x.name === 'string' ? x.name : '',
    verified: x.verified === true,
    pinned: slimPost(x.pinned),
    posts: posts.map(slimPost).filter(notNull).slice(0, MAX_POSTS),
    sinceId: fresh && isPostId(x.sinceId) ? x.sinceId : null,
  }
}

/**
 * Normalize a cached snapshot of any older shape into the current one: keep
 * only the fields the site reads, fill in defaults, drop dead data (pushes,
 * totalContributions, user, bio, languages with bytes).
 */
export function slim(raw: unknown): LiveSnapshot | null {
  if (!isObj(raw)) return null
  return {
    builtAt: isTime(raw.builtAt) ? raw.builtAt : new Date().toISOString(),
    sha: typeof raw.sha === 'string' ? raw.sha : 'local',
    github: isObj(raw.github) ? slimGithub(raw.github) : null,
    x: isObj(raw.x) ? slimX(raw.x) : null,
  }
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

type GqlCommit = null | {
  oid?: unknown
  messageHeadline?: unknown
  committedDate?: unknown
  url?: unknown
}
type GqlRelease = null | {
  tagName?: unknown
  publishedAt?: unknown
  url?: unknown
  isDraft?: unknown
}
type GqlRepo = null | {
  isPrivate?: unknown
  url?: unknown
  pushedAt?: unknown
  stargazerCount?: unknown
  forkCount?: unknown
  primaryLanguage?: unknown
  licenseInfo?: null | { spdxId?: unknown }
  releases?: null | { nodes?: GqlRelease[] }
  defaultBranchRef?: null | {
    target?: null | { history?: { totalCount?: unknown; nodes?: GqlCommit[] } }
  }
}
type GqlUser = {
  repositories?: {
    nodes?: (null | {
      nameWithOwner?: unknown
      isPrivate?: unknown
      primaryLanguage?: null | { name?: unknown }
    })[]
  }
  pinnedItems?: { nodes?: (null | { nameWithOwner?: unknown; isPrivate?: unknown })[] }
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

function liveRepo(full: string, r: NonNullable<GqlRepo>): RepoLive {
  const url = repoUrl(full, r.url)
  // Filtered by my node id in the query, so both the count and the list are
  // my own commits only.
  const history = r.defaultBranchRef?.target?.history
  const commits = (history?.nodes ?? []).map((c) =>
    c ? { sha: c.oid, message: c.messageHeadline, date: c.committedDate, url: c.url } : null,
  )
  const releases = (r.releases?.nodes ?? []).map((n) =>
    n && n.isDraft === false ? { tag: n.tagName, publishedAt: n.publishedAt, url: n.url } : null,
  )
  return {
    isPrivate: false,
    url,
    pushedAt: isTime(r.pushedAt) ? r.pushedAt : null,
    recent: toCommits(commits, url),
    commits: count(history?.totalCount),
    stars: count(r.stargazerCount),
    forks: count(r.forkCount),
    language: toLanguage(r.primaryLanguage),
    license: toLicense(r.licenseInfo?.spdxId),
    releases: toReleases(releases, full),
  }
}

async function fetchGithub(token: string, prev: Github | null): Promise<Github> {
  // The node id lets the main query keep only commits I authored.
  const who = await gql(token, 'query($login: String!) { user(login: $login) { id } }', {
    login: GITHUB_USER,
  })
  const uid = (who.data?.user as { id?: unknown } | undefined)?.id
  if (typeof uid !== 'string' || !uid) throw new KnownError('could not resolve the GitHub user id')

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
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      nodes { nameWithOwner isPrivate primaryLanguage { name } }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { nameWithOwner isPrivate } }
    }
  }
  ${aliases}
}
fragment R on Repository {
  isPrivate url pushedAt stargazerCount forkCount
  primaryLanguage { name color }
  licenseInfo { spdxId }
  releases(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
    nodes { tagName publishedAt url isDraft }
  }
  defaultBranchRef { target { ... on Commit {
    history(first: 3, author: {id: $uid}) { totalCount nodes { oid messageHeadline committedDate url } }
  } } }
}`

  const res = await gql(token, query, { login: GITHUB_USER, uid })

  // Partial data is normal (a repo the token cannot see errors, the rest resolve).
  if (res.errors?.length)
    log(`github: ${res.errors.length} partial error(s): ${res.errors[0].message}`)
  const data = res.data
  const user = data?.user as GqlUser | null | undefined
  if (!user) throw new KnownError('no user in GraphQL response')

  // Keyed by the SIGNALS spelling, whatever casing GitHub uses.
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
    if (r.isPrivate !== false) {
      // Never expose anything about it. Private repos should not be in SIGNALS.
      repoOut[full] = privateRepo()
      warn(`github: ${full} is private but listed in SIGNALS, which makes its name public`)
      return
    }
    repoOut[full] = liveRepo(full, r)
  })

  // Distinct primary languages across my public non-fork repos and the public
  // project repos that live in orgs. CSS is styling, not a language I build in.
  const names = new Set<string>()
  for (const n of user.repositories?.nodes ?? [])
    if (
      n &&
      n.isPrivate === false &&
      isRepoName(n.nameWithOwner) &&
      !isSkippedRepo(n.nameWithOwner)
    )
      if (typeof n.primaryLanguage?.name === 'string') names.add(n.primaryLanguage.name)
  for (const [full, r] of Object.entries(repoOut))
    if (!r.isPrivate && !isSkippedRepo(full) && r.language) names.add(r.language.name)
  const languages = [...names].filter((l) => l !== 'CSS').sort((a, b) => a.localeCompare(b, 'en'))

  // Pinned order, public only. A private pinned repo never reaches live.json.
  const pinned = (user.pinnedItems?.nodes ?? []).flatMap((n) =>
    n && n.isPrivate === false && isRepoName(n.nameWithOwner) && !isSkippedRepo(n.nameWithOwner)
      ? [n.nameWithOwner]
      : [],
  )

  return { repos: repoOut, languages, pinned }
}

// ── X ──

const DAY_MS = 24 * 3600 * 1000
// referenced_tweets is how a reply shows itself; see isReply.
const TWEET_FIELDS = 'created_at,note_tweet,referenced_tweets'

/**
 * A reply, my own included. The timeline's exclude=replies drops replies to
 * other people but keeps the replies that continue my own threads, and those
 * read as fragments on their own.
 */
export function isReply(t: unknown): boolean {
  return (
    isObj(t) &&
    Array.isArray(t.referenced_tweets) &&
    t.referenced_tweets.some((r) => isObj(r) && r.type === 'replied_to')
  )
}

/** A post from the X API, preferring the full text of a long post. */
function toPost(t: unknown): Post | null {
  if (!isObj(t) || !isPostId(t.id) || !isTime(t.created_at)) return null
  const note = isObj(t.note_tweet) && typeof t.note_tweet.text === 'string' ? t.note_tweet.text : ''
  const text = note || (typeof t.text === 'string' ? t.text : null)
  return text === null ? null : { id: t.id, text, createdAt: t.created_at, url: postUrl(t.id) }
}

/** The posts in a timeline response's data, in the order given, replies dropped. */
export function toPosts(data: unknown): Post[] {
  return (Array.isArray(data) ? data : [])
    .filter((t) => !isReply(t))
    .map(toPost)
    .filter(notNull)
}

/** The newest of these post ids. Ids are compared as integers, too big for a double. */
export function newestId(ids: unknown[]): string | null {
  let best: string | null = null
  for (const id of ids) if (isPostId(id) && (best === null || BigInt(id) > BigInt(best))) best = id
  return best
}

// One extra call on full refreshes. A failure here keeps the previous pinned
// post instead of dropping the whole X section.
async function fetchPinned(
  id: unknown,
  headers: Record<string, string>,
  fallback: Post | null,
): Promise<Post | null> {
  if (!isPostId(id)) return null
  try {
    const res = (await fetchJson(`https://api.x.com/2/tweets/${id}?tweet.fields=${TWEET_FIELDS}`, {
      headers,
    })) as { data?: unknown }
    if (isReply(res.data)) {
      log('x: the pinned post is a reply, left out')
      return null
    }
    const post = toPost(res.data)
    if (!post || post.id !== id) throw new KnownError('no post in X response')
    return post
  } catch (e) {
    warn(`x: pinned post failed (${why(e)}), ${fallback ? 'kept cached' : 'none'}`)
    return fallback
  }
}

// Hourly runs fetch only posts newer than the last one seen. Once a day (or
// with X_FULL_REFRESH=1, or when the cache predates a field) the profile, the
// pinned post, and the latest posts are fetched from scratch and replace the
// cache, so a deleted or edited post drops out.
async function fetchX(token: string, prev: X | null, forceFull: boolean): Promise<X> {
  const headers = { Authorization: `Bearer ${token}` }
  const age = prev ? Date.now() - Date.parse(prev.profileFetchedAt) : NaN
  // NaN-safe: an unreadable fetch time counts as stale.
  const full = forceFull || !prev || !(age <= DAY_MS)
  let profile: Omit<X, 'posts' | 'sinceId'>
  if (full) {
    const u = (await fetchJson(
      `https://api.x.com/2/users/by/username/${X_HANDLE}?user.fields=name,verified,verified_type,pinned_tweet_id`,
      { headers },
    )) as { data?: unknown }
    const d = u.data
    if (!isObj(d) || !isPostId(d.id)) throw new KnownError('no user in X response')
    profile = {
      userId: d.id,
      name: typeof d.name === 'string' ? d.name : (prev?.name ?? ''),
      verified:
        d.verified === true || (typeof d.verified_type === 'string' && d.verified_type !== 'none'),
      profileFetchedAt: new Date().toISOString(),
      pinned: await fetchPinned(d.pinned_tweet_id, headers, prev?.pinned ?? null),
    }
  } else {
    profile = {
      userId: prev.userId,
      name: prev.name,
      verified: prev.verified,
      profileFetchedAt: prev.profileFetchedAt,
      pinned: prev.pinned,
    }
  }

  const params = new URLSearchParams({
    max_results: String(MAX_POSTS),
    exclude: 'replies,retweets',
    'tweet.fields': TWEET_FIELDS,
  })
  if (!full && prev?.sinceId) params.set('since_id', prev.sinceId)
  const t = (await fetchJson(`https://api.x.com/2/users/${profile.userId}/tweets?${params}`, {
    headers,
  })) as { data?: unknown }
  const page: unknown[] = Array.isArray(t.data) ? t.data : []
  // Post ids are numeric; anything else never becomes a link.
  const fresh = toPosts(page)
  const seen = new Set(fresh.map((p) => p.id))
  const posts = (full ? fresh : [...fresh, ...(prev?.posts ?? []).filter((p) => !seen.has(p.id))])
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_POSTS)
  const replies = page.filter(isReply).length
  const unreadable = page.length - replies - fresh.length
  log(
    (full ? `x: full refresh, ${fresh.length} post(s)` : `x: ${fresh.length} new post(s)`) +
      (replies ? `, ${replies} repl${replies === 1 ? 'y' : 'ies'} dropped` : '') +
      (unreadable ? `, ${unreadable} unreadable item(s) dropped` : ''),
  )
  // since_id moves past dropped replies too, so the next run does not pay to
  // read them again.
  const sinceId = newestId([
    ...page.map((p) => (isObj(p) ? p.id : null)),
    posts[0]?.id,
    full ? null : prev?.sinceId,
  ])
  return { ...profile, posts, sinceId }
}

// ── main ──

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
  const raw = await previousSnapshot()
  prev = slim(raw)
  // A cache from before the pinned post existed has never fetched it.
  const xPredatesPinned = !!raw && isObj(raw.x) && !('pinned' in raw.x)
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
    const token = usableToken(name, get())
    if (!token) continue
    tried = true
    try {
      const gh = await fetchGithub(token, prev?.github ?? null)
      snap.github = gh
      const pub = Object.values(gh.repos).filter((r) => !r.isPrivate)
      const releases = pub.reduce((n, r) => n + r.releases.length, 0)
      const commits = pub.reduce((n, r) => n + (r.commits ?? 0), 0)
      log(
        `github: ok via ${name}, ${pub.length} public project repo(s), ${commits} own commit(s), ` +
          `${releases} release(s), ${gh.languages.length} language(s), ${gh.pinned.length} pinned`,
      )
      break
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        warn(`github: ${name} was rejected (401), trying the next token`)
        continue
      }
      log(`github: failed (${why(e)}), ${snap.github ? 'kept cached' : 'no data'}`)
      break
    }
  }
  if (!tried) log(`github: no usable token, ${snap.github ? 'kept cached' : 'no data'}`)

  const xToken = usableToken('X_BEARER_TOKEN', process.env.X_BEARER_TOKEN)
  if (xToken) {
    try {
      snap.x = await fetchX(xToken, snap.x, process.env.X_FULL_REFRESH === '1' || xPredatesPinned)
      log(`x: ok, ${snap.x.posts.length} post(s), ${snap.x.pinned ? 'a' : 'no'} pinned post`)
    } catch (e) {
      log(`x: failed (${why(e)}), ${snap.x ? 'kept cached' : 'no data'}`)
    }
  } else {
    log(`x: no usable token, ${snap.x ? 'kept cached' : 'no data'}`)
  }

  write(snap)
}

// True when this file is the script being run (`tsx scripts/fetch-live.ts`),
// false when a test imports it for the helpers above.
function isEntry(): boolean {
  try {
    const entry = process.argv[1]
    return !!entry && import.meta.url === pathToFileURL(realpathSync(entry)).href
  } catch {
    return false
  }
}

if (isEntry())
  main().catch((e) => {
    // Last resort: keep whatever the cache held so the build still succeeds.
    log(`unexpected error (${why(e)}), writing the cached snapshot`)
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
