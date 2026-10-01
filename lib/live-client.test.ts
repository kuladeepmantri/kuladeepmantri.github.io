// Unit tests for the browser refresh in lib/live-client.ts, with a stubbed
// fetch, a stubbed clock, and an in-memory localStorage. Run with `npm test`.

import assert from 'node:assert/strict'
import { beforeEach, describe, test, type TestContext } from 'node:test'
import type { Commit, RepoLive } from './live'
import { refresh } from './live-client'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const ME = 'kuladeepmantri'
const EVALCORE = 'Eval-core/evalcore'
// GitHub's canonical spelling, which SIGNALS uses.
const AURIS = 'kuladeepmantri/Auris'
const KUBEREACH = 'getnullpkg/kubereach'
const SHIPCREW = 'shipcrew-ai/shipcrew'
const SITE = 'kuladeepmantri/kuladeepmantri.github.io'
const FRIEND = 'trishaktiinteriorsbyarg/website'

const EVENTS_URL = `https://api.github.com/users/${ME}/events/public?per_page=30`
const commitsUrl = (repo: string) =>
  `https://api.github.com/repos/${repo}/commits?author=${ME}&per_page=10`

const iso = (t: number) => new Date(t).toISOString()
const sha = (n: number) => n.toString(16).padStart(40, '0')

// ── In-memory localStorage ──

const store = new Map<string, string>()
let storageBroken = false

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: {
    getItem: (k: string) => {
      if (storageBroken) throw new Error('SecurityError')
      return store.get(k) ?? null
    },
    setItem: (k: string, v: string) => {
      if (storageBroken) throw new Error('QuotaExceededError')
      store.set(k, String(v))
    },
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  },
})

// ── Clock: each test runs a day after the last, past the once-per-TTL guard ──

let day = Date.parse('2026-10-01T16:00:00Z')

function setNow(t: TestContext, at: number) {
  let current = at
  t.mock.method(Date, 'now', () => current)
  return (next: number) => {
    current = next
  }
}

// ── Fetch stub ──

type Reply = { status?: number; body?: unknown; raw?: string } | Error

type Call = { url: string; accept: string | null }

function stubFetch(t: TestContext, route: (url: string) => Reply): Call[] {
  const calls: Call[] = []
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, accept: new Headers(init?.headers).get('accept') })
    const r = route(url)
    if (r instanceof Error) throw r
    return new Response(r.raw ?? JSON.stringify(r.body ?? null), { status: r.status ?? 200 })
  })
  return calls
}

const notFound: Reply = { status: 404, body: { message: 'Not Found' } }

// ── GitHub-shaped data ──

function pushEvent(repo: string, at: number) {
  return { id: String(at), type: 'PushEvent', repo: { name: repo }, created_at: iso(at) }
}

function apiCommit(n: number, at: number, login: string | null, repo = EVALCORE) {
  return {
    sha: sha(n),
    html_url: `https://github.com/${repo}/commit/${sha(n)}`,
    author: login === null ? null : { login },
    commit: {
      message: `feat: change ${n}\n\nlonger body`,
      author: { date: iso(at) },
      committer: { date: iso(at) },
    },
  }
}

function commit(repo: string, n: number, at: number): Commit {
  return {
    sha: sha(n),
    message: `feat: change ${n}`,
    date: iso(at),
    url: `https://github.com/${repo}/commit/${sha(n)}`,
  }
}

function repoLive(over: Partial<RepoLive> = {}): RepoLive {
  return {
    isPrivate: false,
    url: '',
    pushedAt: null,
    recent: [],
    commits: null,
    stars: null,
    forks: null,
    language: null,
    license: null,
    releases: [],
    ...over,
  }
}

const PRIVATE: RepoLive = repoLive({ isPrivate: true })

/** A build snapshot made two hours before `now`. */
function snapshot(now: number) {
  const repos: Record<string, RepoLive> = {
    [EVALCORE]: repoLive({
      url: 'https://github.com/Eval-core/evalcore',
      pushedAt: iso(now - 3 * HOUR),
      recent: [
        commit(EVALCORE, 1, now - 3 * HOUR),
        commit(EVALCORE, 2, now - 4 * HOUR),
        commit(EVALCORE, 3, now - 5 * HOUR),
      ],
      commits: 38,
      stars: 16,
      forks: 3,
    }),
    [AURIS]: repoLive({
      url: 'https://github.com/kuladeepmantri/Auris',
      pushedAt: iso(now - 30 * DAY),
      commits: 28,
    }),
    [KUBEREACH]: repoLive({
      url: 'https://github.com/getnullpkg/kubereach',
      pushedAt: iso(now - 60 * DAY),
      recent: [commit(KUBEREACH, 4, now - 60 * DAY)],
      commits: 24,
    }),
    [SHIPCREW]: PRIVATE,
  }
  return { builtAt: iso(now - 2 * HOUR), repos }
}

beforeEach(() => {
  store.clear()
  storageBroken = false
  day += DAY
})

describe('refresh', () => {
  test('a newer commit of mine replaces recent and bumps the count; other authors never show', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 30 * MIN)] }
      if (url === commitsUrl(EVALCORE))
        return {
          body: [
            apiCommit(11, now - 31 * MIN, 'abhishekmanyam'), // newest, not mine
            apiCommit(10, now - 32 * MIN, ME),
            apiCommit(12, now - 33 * MIN, null), // email-only match, no account
            apiCommit(13, now - 35 * MIN, 'KulaDeepMantri'), // mine, other casing
            apiCommit(1, now - 3 * HOUR, ME), // already the snapshot's newest
          ],
        }
      return notFound
    })

    const next = await refresh(builtAt, repos)
    assert.ok(next)
    const r = next[EVALCORE]
    assert.deepEqual(
      r.recent.map((c) => c.sha),
      [sha(10), sha(13), sha(1)],
    )
    assert.equal(r.recent[0].message, 'feat: change 10')
    assert.equal(r.recent[0].url, `https://github.com/${EVALCORE}/commit/${sha(10)}`)
    assert.equal(r.commits, 40) // 38 + the two newer commits of mine
    assert.equal(r.pushedAt, iso(now - 30 * MIN))
    assert.equal(r.stars, 16, 'other fields kept')
    assert.ok(!JSON.stringify(next).includes(sha(11)), 'no commit by another author')
    assert.ok(!JSON.stringify(next).includes(sha(12)), 'no commit without my account')
    // Untouched repos are the same objects.
    assert.equal(next[AURIS], repos[AURIS])
    assert.equal(next[SHIPCREW], repos[SHIPCREW])
    assert.deepEqual(
      calls.map((c) => c.url),
      [EVENTS_URL, commitsUrl(EVALCORE)],
    )
    assert.ok(calls.every((c) => c.accept === 'application/vnd.github+json'))
    // The input is not mutated.
    assert.equal(repos[EVALCORE].commits, 38)
  })

  test("a push to a friend's repo is never fetched, shown, or cached", async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) =>
      url === EVENTS_URL
        ? {
            body: [
              pushEvent(FRIEND, now - 5 * MIN),
              pushEvent('trishaktiinteriorsbyarg/kuladeepmantri', now - 6 * MIN),
              pushEvent(AURIS, Date.parse(builtAt) - MIN),
            ],
          }
        : notFound,
    )
    assert.equal(await refresh(builtAt, repos), null)
    assert.deepEqual(
      calls.map((c) => c.url),
      [EVENTS_URL],
    )
    // Only pushes to the snapshot's public project repos reach localStorage.
    const cached = JSON.parse(store.get('km-events-v3') ?? 'null')
    assert.deepEqual(cached.v, [{ repo: AURIS, at: iso(Date.parse(builtAt) - MIN) }])
    assert.ok(![...store.values()].some((v) => /trishakti/i.test(v)))
  })

  test('private repos are never fetched', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) =>
      url === EVENTS_URL ? { body: [pushEvent(SHIPCREW, now - 5 * MIN)] } : notFound,
    )
    assert.equal(await refresh(builtAt, repos), null)
    assert.deepEqual(
      calls.map((c) => c.url),
      [EVENTS_URL],
    )
  })

  test('with no public repo at all, nothing is requested', async (t) => {
    const now = day
    setNow(t, now)
    const calls = stubFetch(t, () => notFound)
    assert.equal(await refresh(iso(now - 2 * HOUR), { [SHIPCREW]: PRIVATE }), null)
    assert.equal(calls.length, 0)
  })

  test("a push to this site's repo, not a project repo, is never fetched or cached", async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) =>
      url === EVENTS_URL ? { body: [pushEvent(SITE, now - 5 * MIN)] } : notFound,
    )
    assert.equal(await refresh(builtAt, repos), null)
    assert.deepEqual(
      calls.map((c) => c.url),
      [EVENTS_URL],
    )
    assert.deepEqual(JSON.parse(store.get('km-events-v3') ?? 'null').v, [])
  })

  test('pushes from before the build are ignored', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) =>
      url === EVENTS_URL ? { body: [pushEvent(AURIS, Date.parse(builtAt) - MIN)] } : notFound,
    )
    assert.equal(await refresh(builtAt, repos), null)
    assert.equal(calls.length, 1)
  })

  test('a push already reflected in the snapshot (within a minute) is not refetched', async (t) => {
    const now = day
    setNow(t, now)
    const { repos } = snapshot(now)
    // Built just before the snapshot's newest commit landed as a push event.
    const builtAt = iso(now - 3 * HOUR - 30_000)
    const calls = stubFetch(t, (url) =>
      url === EVENTS_URL ? { body: [pushEvent(EVALCORE, now - 3 * HOUR + 30_000)] } : notFound,
    )
    assert.equal(await refresh(builtAt, repos), null)
    assert.equal(calls.length, 1)
  })

  test('a push with no newer commit of mine changes nothing', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE))
        return {
          body: [apiCommit(20, now - 11 * MIN, 'abhishekmanyam'), apiCommit(1, now - 3 * HOUR, ME)],
        }
      return notFound
    })
    assert.equal(await refresh(builtAt, repos), null)
  })

  test('event casing differs from SIGNALS: matched, fetched and keyed by the SIGNALS spelling', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent('KULADEEPMANTRI/auris', now - 10 * MIN)] }
      if (url === commitsUrl(AURIS))
        return {
          body: [
            apiCommit(30, now - 11 * MIN, ME, 'kuladeepmantri/Auris'),
            apiCommit(31, now - 12 * MIN, ME, 'kuladeepmantri/Auris'),
          ],
        }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.deepEqual(Object.keys(next).sort(), Object.keys(repos).sort())
    // No previous commits in the snapshot: every fetched commit is new.
    assert.equal(next[AURIS].commits, 30)
    assert.deepEqual(
      next[AURIS].recent.map((c) => c.sha),
      [sha(30), sha(31)],
    )
    assert.deepEqual(
      calls.map((c) => c.url),
      [EVENTS_URL, commitsUrl(AURIS)],
    )
  })

  test('an unknown commit count stays unknown', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    repos[EVALCORE] = { ...repos[EVALCORE], commits: null }
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(40, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.equal(next[EVALCORE].commits, null)
    assert.equal(next[EVALCORE].recent[0].sha, sha(40))
  })

  describe('a full page of commits (per_page=10)', () => {
    const page = (now: number, n: number, login: (i: number) => string | null = () => ME) =>
      Array.from({ length: n }, (_, i) => apiCommit(100 + i, now - (11 + i) * MIN, login(i)))

    test('all newer than the snapshot: the count is unknown until the next build', async (t) => {
      const now = day
      setNow(t, now)
      const { builtAt, repos } = snapshot(now)
      stubFetch(t, (url) => {
        if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
        if (url === commitsUrl(EVALCORE)) return { body: page(now, 10) }
        return notFound
      })
      const next = await refresh(builtAt, repos)
      assert.ok(next)
      assert.equal(next[EVALCORE].commits, null)
      assert.deepEqual(
        next[EVALCORE].recent.map((c) => c.sha),
        [sha(100), sha(101), sha(102)],
      )
    })

    test('one not linked to my account still fills the page: count unknown', async (t) => {
      const now = day
      setNow(t, now)
      const { builtAt, repos } = snapshot(now)
      stubFetch(t, (url) => {
        if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
        if (url === commitsUrl(EVALCORE))
          return { body: page(now, 10, (i) => (i === 9 ? null : ME)) }
        return notFound
      })
      const next = await refresh(builtAt, repos)
      assert.ok(next)
      assert.equal(next[EVALCORE].recent[0].sha, sha(100))
      assert.equal(next[EVALCORE].commits, null)
    })

    test("reaching back to the snapshot's newest commit: counted", async (t) => {
      const now = day
      setNow(t, now)
      const { builtAt, repos } = snapshot(now)
      stubFetch(t, (url) => {
        if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
        if (url === commitsUrl(EVALCORE))
          return { body: [...page(now, 9), apiCommit(1, now - 3 * HOUR, ME)] }
        return notFound
      })
      const next = await refresh(builtAt, repos)
      assert.ok(next)
      assert.equal(next[EVALCORE].commits, 38 + 9)
    })

    test('nine of mine, all newer, on a short page: counted', async (t) => {
      const now = day
      setNow(t, now)
      const { builtAt, repos } = snapshot(now)
      stubFetch(t, (url) => {
        if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
        if (url === commitsUrl(EVALCORE)) return { body: page(now, 9) }
        return notFound
      })
      const next = await refresh(builtAt, repos)
      assert.equal(next?.[EVALCORE].commits, 38 + 9)
    })
  })

  test('at most two commit requests, for the most recent pushes', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) => {
      if (url === EVENTS_URL)
        return {
          body: [
            pushEvent(KUBEREACH, now - 30 * MIN),
            pushEvent(EVALCORE, now - 10 * MIN),
            pushEvent(AURIS, now - 20 * MIN),
          ],
        }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(50, now - 11 * MIN, ME)] }
      if (url === commitsUrl(AURIS)) return { body: [apiCommit(51, now - 21 * MIN, ME)] }
      if (url === commitsUrl(KUBEREACH)) return { body: [apiCommit(52, now - 31 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.deepEqual(
      calls.map((c) => c.url).sort(),
      [EVENTS_URL, commitsUrl(AURIS), commitsUrl(EVALCORE)].sort(),
    )
    assert.equal(next[KUBEREACH], repos[KUBEREACH])
  })

  test('commits are validated: 40-hex SHA, readable date, GitHub-only links, first line only', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const shortSha = { ...apiCommit(60, now - 11 * MIN, ME), sha: 'abc1234' }
    const evilUrl = { ...apiCommit(61, now - 12 * MIN, ME), html_url: 'javascript:alert(1)' }
    const noDate = {
      ...apiCommit(62, now - 13 * MIN, ME),
      commit: { message: 'x', author: { date: 'nope' }, committer: null },
    }
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [shortSha, evilUrl, noDate, 'junk', null] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.deepEqual(next[EVALCORE].recent, [
      {
        sha: sha(61),
        message: 'feat: change 61',
        date: iso(now - 12 * MIN),
        url: 'https://github.com/Eval-core/evalcore',
      },
    ])
    assert.equal(next[EVALCORE].commits, 39)
  })

  test('skips while the snapshot is younger than 10 minutes', async (t) => {
    const now = day
    setNow(t, now)
    const { repos } = snapshot(now)
    const calls = stubFetch(t, () => notFound)
    assert.equal(await refresh(iso(now - 5 * MIN), repos), null)
    assert.equal(await refresh('not a date', repos), null)
    assert.equal(calls.length, 0)
  })

  test('runs at most once per 10 minutes per page', async (t) => {
    const now = day
    const move = setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const calls = stubFetch(t, (url) => (url === EVENTS_URL ? { body: [] } : notFound))
    assert.equal(await refresh(builtAt, repos), null)
    assert.equal(calls.length, 1)
    move(now + 5 * MIN)
    store.clear()
    assert.equal(await refresh(builtAt, repos), null)
    assert.equal(calls.length, 1, 'no second request inside the TTL')
    move(now + 10 * MIN)
    store.clear()
    await refresh(builtAt, repos)
    assert.equal(calls.length, 2, 'runs again once the TTL has passed')
  })

  test('uses the v3 cache keys; older caches are ignored and removed', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const at = iso(now - 10 * MIN)
    // v1 and v2 event caches could hold pushes to other people's repos; v1
    // commit caches could hold other authors' commits.
    const oldEvents = [
      { repo: EVALCORE, at },
      { repo: FRIEND, at },
    ]
    store.set('km-events', JSON.stringify({ at: now - MIN, v: oldEvents }))
    store.set('km-events-v2', JSON.stringify({ at: now - MIN, v: oldEvents }))
    const oldCommits = [commit(EVALCORE, 99, now - 11 * MIN)]
    store.set(
      'km-commits:eval-core/evalcore',
      JSON.stringify({ at: now - MIN, key: at, v: oldCommits }),
    )
    store.set(
      'km-commits-v2:eval-core/evalcore',
      JSON.stringify({ at: now - MIN, key: at, v: oldCommits }),
    )
    store.set('km-theme', 'dark')
    const calls = stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(70, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.equal(next[EVALCORE].recent[0].sha, sha(70))
    assert.ok(!JSON.stringify(next).includes(sha(99)))
    assert.equal(calls.length, 2)
    assert.deepEqual([...store.keys()].sort(), [
      'km-commits-v3:eval-core/evalcore',
      'km-events-v3',
      'km-theme',
    ])
    const cached = JSON.parse(store.get('km-commits-v3:eval-core/evalcore') ?? 'null')
    assert.equal(cached.key, at, 'commit cache is keyed by the push time')
    assert.equal(cached.v.full, false)
    assert.equal(cached.v.commits[0].sha, sha(70))
    // The events cache never holds anything but repo names and times.
    const events = JSON.parse(store.get('km-events-v3') ?? 'null')
    assert.deepEqual(events.v, [{ repo: EVALCORE, at }])
  })

  test('removing old caches is best effort', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    store.set('km-events-v2', JSON.stringify({ at: now - MIN, v: [] }))
    t.mock.method(localStorage, 'removeItem', () => {
      throw new Error('SecurityError')
    })
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(71, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.equal(next?.[EVALCORE].recent[0].sha, sha(71))
  })

  test('fresh v3 caches answer without any request', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const at = iso(now - 10 * MIN)
    store.set('km-events-v3', JSON.stringify({ at: now - MIN, v: [{ repo: EVALCORE, at }] }))
    store.set(
      'km-commits-v3:eval-core/evalcore',
      JSON.stringify({
        at: now - MIN,
        key: at,
        v: { commits: [commit(EVALCORE, 80, now - 11 * MIN)], full: false },
      }),
    )
    const calls = stubFetch(t, () => new Error('should not be called'))
    const next = await refresh(builtAt, repos)
    assert.ok(next)
    assert.equal(next[EVALCORE].recent[0].sha, sha(80))
    assert.equal(next[EVALCORE].commits, 39)
    assert.equal(calls.length, 0)
  })

  test('a commit cache in the v2 shape under the v3 key is a miss', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    const at = iso(now - 10 * MIN)
    store.set(
      'km-commits-v3:eval-core/evalcore',
      JSON.stringify({ at: now - MIN, key: at, v: [commit(EVALCORE, 81, now - 11 * MIN)] }),
    )
    const calls = stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(82, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.equal(next?.[EVALCORE].recent[0].sha, sha(82))
    assert.equal(calls.length, 2)
  })

  test('a cached failure is not retried inside the TTL', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    store.set('km-events-v3', JSON.stringify({ at: now - MIN, v: null }))
    const calls = stubFetch(t, () => ({ body: [] }))
    assert.equal(await refresh(builtAt, repos), null)
    assert.equal(calls.length, 0)
  })

  describe('failures return null and never throw', () => {
    const cases: [string, (now: number) => (url: string) => Reply][] = [
      ['network error', () => () => new TypeError('Failed to fetch')],
      ['events 500', () => () => ({ status: 500, body: { message: 'oops' } })],
      ['events rate limited', () => () => ({ status: 403, body: { message: 'rate limit' } })],
      ['events not JSON', () => () => ({ raw: '<html>' })],
      ['events not a list', () => () => ({ body: { message: 'hi' } })],
      [
        'commits 403',
        (now) => (url) =>
          url === EVENTS_URL ? { body: [pushEvent(EVALCORE, now - 10 * MIN)] } : { status: 403 },
      ],
      [
        'commits network error',
        (now) => (url) =>
          url === EVENTS_URL ? { body: [pushEvent(EVALCORE, now - 10 * MIN)] } : new Error('reset'),
      ],
      [
        'commits not a list',
        (now) => (url) =>
          url === EVENTS_URL ? { body: [pushEvent(EVALCORE, now - 10 * MIN)] } : { body: {} },
      ],
    ]
    for (const [name, route] of cases)
      test(name, async (t) => {
        const now = day
        setNow(t, now)
        const { builtAt, repos } = snapshot(now)
        stubFetch(t, route(now))
        assert.equal(await refresh(builtAt, repos), null)
      })
  })

  test('works when localStorage throws', async (t) => {
    const now = day
    setNow(t, now)
    storageBroken = true
    const { builtAt, repos } = snapshot(now)
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(90, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, repos)
    assert.equal(next?.[EVALCORE].recent[0].sha, sha(90))
  })

  test('a malformed snapshot entry does not throw', async (t) => {
    const now = day
    setNow(t, now)
    const { builtAt, repos } = snapshot(now)
    // An older snapshot shape, cast like lib/generated/live.ts does.
    const legacy = { isPrivate: false, url: 'x', pushedAt: null } as unknown as RepoLive
    stubFetch(t, (url) => {
      if (url === EVENTS_URL) return { body: [pushEvent(EVALCORE, now - 10 * MIN)] }
      if (url === commitsUrl(EVALCORE)) return { body: [apiCommit(91, now - 11 * MIN, ME)] }
      return notFound
    })
    const next = await refresh(builtAt, { ...repos, [EVALCORE]: legacy })
    assert.ok(next)
    assert.equal(next[EVALCORE].recent[0].sha, sha(91))
    assert.equal(next[EVALCORE].commits, null)
    assert.equal(next[EVALCORE].recent[0].url, `https://github.com/${EVALCORE}/commit/${sha(91)}`)
  })
})
