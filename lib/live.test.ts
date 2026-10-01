// Unit tests for the pure helpers in lib/live.ts, lib/x-text.ts, lib/skip.ts,
// and scripts/fetch-live.ts. Run with `npm test` (node:test via tsx). Fixtures
// use real data from the GitHub and X APIs where it exists (EvalCore releases,
// commit SHAs, star counts, post ids).

import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, test } from 'node:test'
import { SIGNALS } from '../app/signals'
import { isReply, newestId, slim, toPosts, usableToken, why } from '../scripts/fetch-live'
import * as live from './live'
import {
  burstSentence,
  clock,
  githubStats,
  isGithubUrl,
  isPublicRepo,
  lastCommit,
  latestCommit,
  latestRelease,
  orderProjects,
  pagePosts,
  plural,
  postStamp,
  releaseBurst,
  repoRows,
  safeColor,
  spell,
  stamp,
  toTime,
  year,
  zone,
  type Burst,
  type Commit,
  type LiveSnapshot,
  type Post,
  type Release,
  type RepoLive,
} from './live'
import { SKIP_REPOS, isSkippedRepo } from './skip'
import { postText, readable } from './x-text'

// ── Fixtures ──

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const NBSP = '\u00a0'

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

function commit(repo: string, sha: string, date: string, message = 'work'): Commit {
  return { sha, message, date, url: `https://github.com/${repo}/commit/${sha}` }
}

/** A deterministic 40-hex SHA for commits whose real SHA does not matter. */
function fakeSha(n: number): string {
  return n.toString(16).padStart(40, '0')
}

function release(tag: string, publishedAt: string, repo = 'Eval-core/evalcore'): Release {
  return { tag, publishedAt, url: `https://github.com/${repo}/releases/tag/${tag}` }
}

// EvalCore's real releases, newest first, as GitHub returns them.
const EVALCORE_RELEASES: Release[] = [
  release('v0.7.5', '2026-07-19T22:11:34Z'),
  release('v0.7.0', '2026-07-19T01:35:39Z'),
  release('v0.6.0', '2026-07-18T22:42:44Z'),
  release('v0.5.0', '2026-07-17T20:25:29Z'),
  release('v0.4.0', '2026-07-17T08:30:51Z'),
  release('v0.3.0', '2026-07-17T07:47:11Z'),
]
const [V075, V070, V060, V050, V040, V030] = EVALCORE_RELEASES

const EVALCORE = 'Eval-core/evalcore'
// GitHub's canonical spelling, which SIGNALS uses.
const AURIS = 'kuladeepmantri/Auris'
const EVALCORE_TOP = commit(
  EVALCORE,
  '7db78615684e01e1f750e09b585f8d48aed02a52',
  '2026-07-23T02:08:55Z',
  'docs(repo): name the beta spike fork and its guardrails',
)

// Real data for every SIGNALS repo as of 2026-09-30 (my own commits only).
const REPOS: Record<string, RepoLive> = {
  [EVALCORE]: repoLive({
    url: 'https://github.com/Eval-core/evalcore',
    pushedAt: '2026-07-26T05:18:25Z',
    recent: [
      EVALCORE_TOP,
      commit(EVALCORE, 'dbd5f75dcff8701e1c35bf622e9688ec956a08d1', '2026-07-23T01:29:25Z'),
      commit(EVALCORE, '9d1248e472b49b3871aebe3fd405adfed1a17b15', '2026-07-23T01:21:19Z'),
    ],
    commits: 38,
    stars: 16,
    forks: 3,
    language: { name: 'Rust', color: '#dea584' },
    license: 'Apache-2.0',
    releases: EVALCORE_RELEASES,
  }),
  'getnullpkg/kubereach': repoLive({
    url: 'https://github.com/getnullpkg/kubereach',
    pushedAt: '2026-07-03T16:32:03Z',
    recent: [
      commit(
        'getnullpkg/kubereach',
        'd8236ca3a8a54aa2a1c5ba63792937a3062af1c1',
        '2026-07-03T16:32:01Z',
      ),
    ],
    commits: 24,
    stars: 0,
    forks: 0,
    language: { name: 'Go', color: '#00ADD8' },
    license: 'Apache-2.0',
  }),
  'meetrune/rune': repoLive({
    url: 'https://github.com/meetrune/rune',
    pushedAt: '2026-03-30T00:32:11Z',
    recent: [commit('meetrune/rune', fakeSha(1), '2026-03-24T01:39:33Z')],
    commits: 25,
    stars: 0,
    forks: 0,
    language: { name: 'Python', color: '#3572A5' },
    license: 'Apache-2.0',
  }),
  'shipcrew-ai/shipcrew': repoLive({
    url: 'https://github.com/shipcrew-ai/shipcrew',
    pushedAt: '2026-03-25T18:11:20Z',
    recent: [commit('shipcrew-ai/shipcrew', fakeSha(2), '2026-03-03T00:20:02Z')],
    commits: 3,
    stars: 0,
    forks: 0,
    language: { name: 'TypeScript', color: '#3178c6' },
  }),
  [AURIS]: repoLive({
    url: 'https://github.com/kuladeepmantri/Auris',
    pushedAt: '2025-12-05T19:09:31Z',
    recent: [commit(AURIS, 'e4646fd575d53f33ca0bcbc4cad02340cf1c8bf4', '2025-12-05T19:09:31Z')],
    commits: 28,
    stars: 0,
    forks: 0,
    language: { name: 'C', color: '#555555' },
    license: 'Apache-2.0',
  }),
  'kuladeepmantri/untilithappens.org': repoLive({
    url: 'https://github.com/kuladeepmantri/untilithappens.org',
    pushedAt: '2026-02-18T05:06:08Z',
    recent: [commit('kuladeepmantri/untilithappens.org', fakeSha(3), '2026-02-18T05:06:06Z')],
    commits: 52,
    stars: 0,
    forks: 0,
    language: { name: 'TypeScript', color: '#3178c6' },
    license: 'Apache-2.0',
  }),
  'kuladeepmantri/DeID-Anonymizer': repoLive({
    url: 'https://github.com/kuladeepmantri/DeID-Anonymizer',
    pushedAt: '2025-08-12T02:02:44Z',
    recent: [commit('kuladeepmantri/DeID-Anonymizer', fakeSha(4), '2025-08-12T02:02:41Z')],
    commits: 12,
    stars: 0,
    forks: 0,
    language: { name: 'Python', color: '#3572A5' },
    license: 'MIT',
  }),
}

// My pinned repos on GitHub, in pinned order, exactly as GraphQL spells them.
const PINNED = [
  'Eval-core/evalcore',
  'getnullpkg/kubereach',
  'kuladeepmantri/Auris',
  'kuladeepmantri/untilithappens.org',
  'kuladeepmantri/DeID-Anonymizer',
  'meetrune/rune',
]

const LANGUAGES = ['C', 'Dart', 'Go', 'Java', 'Python', 'Rust', 'Shell', 'TypeScript']

const FEATURED = SIGNALS.find((s) => s.featured)

function signal(slug: string) {
  const s = SIGNALS.find((p) => p.slug === slug)
  assert.ok(s, `SIGNALS has ${slug}`)
  return s
}

function shuffled<T>(xs: T[]): T[] {
  // Deterministic: reverse, then rotate by two.
  const r = [...xs].reverse()
  return [...r.slice(2), ...r.slice(0, 2)]
}

// ── Safety guards ──

describe('isGithubUrl', () => {
  test('accepts https links on github.com', () => {
    assert.equal(isGithubUrl('https://github.com/Eval-core/evalcore'), true)
    assert.equal(isGithubUrl(EVALCORE_TOP.url), true)
  })

  test('rejects hostile and look-alike input', () => {
    for (const u of [
      'javascript:alert(1)',
      'https://github.com.evil.com',
      'https://github.com.evil.com/Eval-core/evalcore',
      'https://github.com@evil.com/',
      'http://github.com/Eval-core/evalcore',
      '//github.com/Eval-core/evalcore',
      ' https://github.com/x',
      'HTTPS://GITHUB.COM/x',
      'https://evil.com/https://github.com/',
      'data:text/html,https://github.com/',
      'https://github.com',
      '',
    ])
      assert.equal(isGithubUrl(u), false, u)
  })

  test('rejects non-strings', () => {
    for (const u of [null, undefined, 42, {}, ['https://github.com/x']])
      assert.equal(isGithubUrl(u), false)
  })
})

describe('safeColor', () => {
  test('passes 3 and 6 digit hex colours through', () => {
    assert.equal(safeColor('#dea584'), '#dea584')
    assert.equal(safeColor('#00ADD8'), '#00ADD8')
    assert.equal(safeColor('#fff'), '#fff')
  })

  test('rejects anything that could break out of a style attribute', () => {
    for (const c of [
      'red;background:url(x)',
      '#dea584;background:url(x)',
      'red',
      'javascript:alert(1)',
      'expression(alert(1))',
      'url(https://evil.com)',
      '#ffff',
      '#12345g',
      '#1234567',
      'dea584',
      ' #dea584',
      '#dea584 ',
      '',
    ])
      assert.equal(safeColor(c), null, c)
  })

  test('rejects non-strings', () => {
    for (const c of [null, undefined, 0xdea584, {}]) assert.equal(safeColor(c), null)
  })
})

describe('SKIP_REPOS and isSkippedRepo', () => {
  test('skips this site, the profile README, and InternProjects, in any casing', () => {
    assert.equal(isSkippedRepo('kuladeepmantri/InternProjects'), true)
    assert.equal(isSkippedRepo('KULADEEPMANTRI/internprojects'), true)
    assert.equal(isSkippedRepo('kuladeepmantri/kuladeepmantri.github.io'), true)
    assert.equal(isSkippedRepo('kuladeepmantri/kuladeepmantri'), true)
    assert.equal(SKIP_REPOS.length, 3)
    assert.ok(SKIP_REPOS.every((r) => r === r.toLowerCase()))
  })

  test('does not skip project repos', () => {
    for (const r of SIGNALS.flatMap((s) => s.repos)) assert.equal(isSkippedRepo(r), false, r)
    assert.equal(isSkippedRepo('trishaktiinteriorsbyarg/kuladeepmantri'), false)
  })

  test('lib/live.ts no longer exports the skip list', () => {
    assert.ok(!('SKIP_REPOS' in live))
    assert.ok(!('isSkippedRepo' in live))
  })

  test('nothing the site ships imports lib/skip or names a skipped repo', () => {
    // Everything under app/, components/, and lib/ can end up in the browser
    // bundle. Only the build script and the tests may know these names.
    const root = fileURLToPath(new URL('..', import.meta.url))
    const shipped = ['app', 'components', 'lib']
      .flatMap((dir) =>
        readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' }).map((f) =>
          join(dir, f),
        ),
      )
      .filter((f) => /\.tsx?$/.test(f) && !/\.test\.ts$/.test(f))
      .filter((f) => f !== join('lib', 'skip.ts') && !f.startsWith(join('lib', 'generated')))
    assert.ok(shipped.includes(join('lib', 'live.ts')))
    assert.ok(shipped.includes(join('lib', 'live-client.ts')))
    for (const f of shipped) {
      const src = readFileSync(join(root, f), 'utf8')
      assert.ok(!/lib\/skip'|\.\/skip'/.test(src), `${f} imports lib/skip`)
      assert.ok(!/internprojects|\.github\.io/i.test(src), `${f} names a skipped repo`)
    }
  })
})

describe('isPublicRepo', () => {
  test('true only for a known public repo', () => {
    assert.equal(isPublicRepo(EVALCORE, REPOS), true)
    assert.equal(isPublicRepo(EVALCORE, { [EVALCORE]: repoLive({ isPrivate: true }) }), false)
    assert.equal(isPublicRepo('someone/else', REPOS), false)
    assert.equal(isPublicRepo(EVALCORE, undefined), false)
  })
})

// ── Time ──

describe('toTime and year', () => {
  test('reads bare dates as noon UTC', () => {
    assert.equal(toTime('2026-07-23'), Date.parse('2026-07-23T12:00:00Z'))
    assert.equal(toTime('2026-07-23T02:08:55Z'), Date.parse('2026-07-23T02:08:55Z'))
    assert.ok(Number.isNaN(toTime('not a date')))
  })

  test('year is the Michigan calendar year', () => {
    assert.equal(year('2023-04-26'), '2023')
    // 3am UTC on New Year's Day is still Dec 31 in Detroit.
    assert.equal(year('2027-01-01T03:00:00Z'), '2026')
    assert.equal(year('2027-01-01T06:00:00Z'), '2027')
  })
})

describe('stamp and postStamp', () => {
  const now = Date.parse('2026-09-30T18:00:00Z') // 2:00 PM EDT
  const ago = (ms: number) => new Date(now - ms).toISOString()

  const cases: [string, string, string][] = [
    // [iso, stamp, postStamp]
    [ago(0), 'just now', 'now'],
    [ago(59_000), 'just now', 'now'],
    [ago(MIN), '1m ago', '1m'],
    [ago(59 * MIN + 59_000), '59m ago', '59m'],
    [ago(HOUR), '1h ago', '1h'],
    [ago(23 * HOUR + 59 * MIN), '23h ago', '23h'],
    [ago(DAY), 'Sep 29', 'Sep 29'],
    // 03:30 UTC on Sep 29 is 11:30 PM on Sep 28 in Detroit.
    ['2026-09-29T03:30:00Z', 'Sep 28', 'Sep 28'],
    ['2026-07-23', 'Jul 23', 'Jul 23'],
    ['2025-07-23T16:00:00Z', 'Jul 23, 2025', 'Jul 23, 2025'],
    // 2am UTC on Jan 1 2026 is still 2025 in Detroit.
    ['2026-01-01T02:00:00Z', 'Dec 31, 2025', 'Dec 31, 2025'],
  ]

  for (const [iso, s, p] of cases)
    test(`${iso} -> "${s}" / "${p}"`, () => {
      assert.equal(stamp(iso, now), s)
      assert.equal(postStamp(iso, now), p)
    })

  test('a little clock skew still reads as now', () => {
    const ahead = new Date(now + 4 * MIN).toISOString()
    assert.equal(stamp(ahead, now), 'just now')
    assert.equal(postStamp(ahead, now), 'now')
  })

  test('a timestamp well in the future shows its date, never a negative age', () => {
    const later = new Date(now + 6 * MIN).toISOString()
    assert.equal(stamp(later, now), 'Sep 30')
    assert.equal(postStamp(later, now), 'Sep 30')
    assert.equal(stamp('2027-01-15T12:00:00Z', now), 'Jan 15, 2027')
  })

  test('an unreadable timestamp gives an empty string', () => {
    assert.equal(stamp('nope', now), '')
    assert.equal(postStamp('', now), '')
  })
})

describe('clock and zone', () => {
  test('clock is Michigan time with a no-break space before AM/PM', () => {
    const c = clock(Date.parse('2026-07-20T18:14:00Z'))
    assert.equal(c, `2:14${NBSP}PM`)
    assert.ok(!/[  ]/.test(c), 'no plain or narrow space')
    assert.equal(clock(Date.parse('2026-01-15T05:05:00Z')), `12:05${NBSP}AM`)
  })

  test('zone is EDT in July and EST in January', () => {
    assert.equal(zone(Date.parse('2026-07-20T12:00:00Z')), 'EDT')
    assert.equal(zone(Date.parse('2026-01-15T12:00:00Z')), 'EST')
  })

  test('zone switches at the DST boundary (2am local, Mar 8 2026)', () => {
    assert.equal(zone(Date.parse('2026-03-08T06:59:00Z')), 'EST')
    assert.equal(zone(Date.parse('2026-03-08T07:00:00Z')), 'EDT')
  })
})

// ── Numbers in sentences ──

describe('spell and plural', () => {
  test('spells zero to twelve, digits above', () => {
    assert.deepEqual([0, 1, 2, 3, 6, 10, 11, 12].map(spell), [
      'zero',
      'one',
      'two',
      'three',
      'six',
      'ten',
      'eleven',
      'twelve',
    ])
    assert.equal(spell(13), '13')
    assert.equal(spell(100), '100')
  })

  test('negative and fractional numbers stay digits', () => {
    assert.equal(spell(-1), '-1')
    assert.equal(spell(2.5), '2.5')
  })

  test('plural', () => {
    assert.equal(plural(1, 'star'), 'star')
    assert.equal(plural(0, 'star'), 'stars')
    assert.equal(plural(16, 'star'), 'stars')
    assert.equal(plural(2, 'repository', 'repositories'), 'repositories')
    assert.equal(plural(1, 'repository', 'repositories'), 'repository')
  })
})

// ── Releases ──

describe('releaseBurst', () => {
  test("EvalCore's real releases: six in three days", () => {
    assert.deepEqual(releaseBurst(EVALCORE_RELEASES), {
      count: 6,
      days: 3,
      from: '2026-07-17T07:47:11.000Z',
      to: '2026-07-19T22:11:34.000Z',
    })
  })

  test('input order does not matter', () => {
    assert.deepEqual(releaseBurst(shuffled(EVALCORE_RELEASES)), releaseBurst(EVALCORE_RELEASES))
  })

  test('days are Detroit calendar days: v0.7.0 (01:35 UTC Jul 19) is July 18', () => {
    // Both on July 18 in Detroit; UTC would call these two different days.
    const b = releaseBurst([V070, V060])
    assert.equal(b?.count, 2)
    assert.equal(b?.days, 1)
    assert.equal(b && burstSentence(b), 'Two\u00a0releases on July\u00a018.')
    // July 18 and July 20 in Detroit are two days apart (UTC: Jul 19 and 20).
    assert.equal(releaseBurst([V070, release('v0.7.1', '2026-07-20T12:00:00Z')]), null)
    // July 17 and 18 in Detroit are consecutive (UTC: Jul 17 and 19).
    const pair = releaseBurst([V070, V050])
    assert.equal(pair?.days, 2)
    assert.equal(
      pair && burstSentence(pair),
      'Two\u00a0releases in two\u00a0days, July\u00a017 to\u00a018.',
    )
  })

  test('consecutive calendar days continue the run even when far apart in hours', () => {
    // 00:30 EDT Jul 17 and 19:30 EDT Jul 18: 43 hours apart, adjacent days.
    const b = releaseBurst([
      release('a', '2026-07-17T04:30:00Z'),
      release('b', '2026-07-18T23:30:00Z'),
    ])
    assert.deepEqual(b && { count: b.count, days: b.days }, { count: 2, days: 2 })
  })

  test('a gap of two or more calendar days ends the run', () => {
    const b = releaseBurst([V075, V070, release('old', '2026-07-15T16:00:00Z')])
    assert.deepEqual(b && { count: b.count, days: b.days }, { count: 2, days: 2 })
    assert.equal(b?.from, new Date(V070.publishedAt).toISOString())
  })

  test('a lone newer release does not erase the last burst', () => {
    const later = release('v0.8.0', '2026-07-21T16:00:00Z') // Jul 21, two days after Jul 19
    assert.deepEqual(releaseBurst([later, ...EVALCORE_RELEASES]), releaseBurst(EVALCORE_RELEASES))
  })

  test('the newest run wins over an older, larger one', () => {
    const newer = [release('v1.1', '2026-09-01T16:00:00Z'), release('v1.0', '2026-09-02T16:00:00Z')]
    const b = releaseBurst([...newer, ...EVALCORE_RELEASES])
    assert.deepEqual(b && { count: b.count, days: b.days }, { count: 2, days: 2 })
  })

  test('fewer than two releases is never a burst', () => {
    assert.equal(releaseBurst([]), null)
    assert.equal(releaseBurst([V075]), null)
  })

  test('unreadable dates are ignored', () => {
    const junk = [release('bad', 'not a date'), release('empty', '')]
    assert.deepEqual(releaseBurst([...junk, ...EVALCORE_RELEASES]), releaseBurst(EVALCORE_RELEASES))
    assert.equal(releaseBurst([...junk, V075]), null)
  })
})

describe('burstSentence', () => {
  test("EvalCore's sentence, exactly", () => {
    const b = releaseBurst(EVALCORE_RELEASES)
    assert.ok(b)
    assert.equal(burstSentence(b), 'Six\u00a0releases in three\u00a0days, July\u00a017 to\u00a019.')
  })

  test('one day', () => {
    const b = releaseBurst([V040, V030])
    assert.ok(b)
    assert.equal(b.days, 1)
    assert.equal(burstSentence(b), 'Two\u00a0releases on July\u00a017.')
  })

  test('across a month', () => {
    const b = releaseBurst([
      release('a', '2026-07-30T16:00:00Z'),
      release('b', '2026-07-31T16:00:00Z'),
      release('c', '2026-08-01T16:00:00Z'),
    ])
    assert.ok(b)
    assert.equal(
      burstSentence(b),
      'Three\u00a0releases in three\u00a0days, July\u00a030 to\u00a0August\u00a01.',
    )
  })

  test('across a year', () => {
    const b = releaseBurst([
      release('a', '2026-12-31T16:00:00Z'),
      release('b', '2027-01-01T16:00:00Z'),
    ])
    assert.ok(b)
    assert.equal(
      burstSentence(b),
      'Two\u00a0releases in two\u00a0days, December\u00a031 to\u00a0January\u00a01.',
    )
  })

  test('twelve is a word, thirteen and up are digits', () => {
    const daily = (n: number) =>
      Array.from({ length: n }, (_, i) =>
        release(`v${i}`, `2026-07-${String(i + 1).padStart(2, '0')}T16:00:00Z`),
      )
    const twelve = releaseBurst(daily(12))
    const thirteen = releaseBurst(daily(13))
    assert.ok(twelve && thirteen)
    assert.equal(
      burstSentence(twelve),
      'Twelve\u00a0releases in twelve\u00a0days, July\u00a01 to\u00a012.',
    )
    assert.equal(
      burstSentence(thirteen),
      '13\u00a0releases in 13\u00a0days, July\u00a01 to\u00a013.',
    )

    // 13 releases an hour apart, 9 AM to 9 PM on July 17 in Detroit.
    const hourly = Array.from({ length: 13 }, (_, i) =>
      release(`h${i}`, new Date(Date.parse('2026-07-17T13:00:00Z') + i * HOUR).toISOString()),
    )
    const sameDay = releaseBurst(hourly)
    assert.ok(sameDay)
    assert.equal(burstSentence(sameDay), '13\u00a0releases on July\u00a017.')
  })

  test('works from a hand-built burst', () => {
    const b: Burst = {
      count: 4,
      days: 2,
      from: '2026-03-01T15:00:00.000Z',
      to: '2026-03-02T15:00:00.000Z',
    }
    assert.equal(burstSentence(b), 'Four\u00a0releases in two\u00a0days, March\u00a01 to\u00a02.')
  })
})

// ── Projects × live data ──

describe('lastCommit and orderProjects', () => {
  test("a project's newest commit across its public repos", () => {
    const p = { repos: [EVALCORE, 'getnullpkg/kubereach'] }
    assert.equal(lastCommit(p, REPOS), EVALCORE_TOP)
    assert.equal(lastCommit({ repos: [] }, REPOS), null)
    assert.equal(lastCommit(p, undefined), null)
  })

  test('private repos never count', () => {
    const newer = commit('getnullpkg/kubereach', fakeSha(9), '2026-09-01T00:00:00Z')
    const repos = {
      ...REPOS,
      'getnullpkg/kubereach': repoLive({ isPrivate: true, recent: [newer] }),
    }
    assert.equal(lastCommit({ repos: [EVALCORE, 'getnullpkg/kubereach'] }, repos), EVALCORE_TOP)
  })

  test('orders SIGNALS by my last commit, dateLast for projects without data', () => {
    const order = orderProjects(SIGNALS, REPOS).map((p) => p.slug)
    // Kintsugi has no public repo, so its dateLast (2026-03-22) places it.
    assert.deepEqual(order, [
      'evalcore',
      'kubereach',
      'rune',
      'kintsugi',
      'shipcrew',
      'untilithappens',
      'auris',
      'deid',
    ])
  })

  test('without live data the order is by dateLast, and the input is not mutated', () => {
    const before = SIGNALS.map((p) => p.slug)
    const order = orderProjects(SIGNALS, undefined)
    assert.deepEqual(
      order.map((p) => p.dateLast),
      [...SIGNALS.map((p) => p.dateLast)].sort((a, b) => toTime(b) - toTime(a)),
    )
    assert.deepEqual(
      SIGNALS.map((p) => p.slug),
      before,
    )
  })
})

describe('latestCommit', () => {
  test('my newest commit across every project, with its own-commit count', () => {
    assert.deepEqual(latestCommit(SIGNALS, REPOS), {
      repo: EVALCORE,
      commit: EVALCORE_TOP,
      count: 38,
    })
  })

  test('ignores private repos even with a newer commit', () => {
    const newer = commit(AURIS, fakeSha(7), '2026-09-29T00:00:00Z')
    const repos = {
      ...REPOS,
      [AURIS]: repoLive({ isPrivate: true, recent: [newer] }),
    }
    assert.equal(latestCommit(SIGNALS, repos)?.repo, EVALCORE)
  })

  test('picks a newer public commit in another project', () => {
    const newer = commit('meetrune/rune', fakeSha(8), '2026-09-29T00:00:00Z')
    const repos = {
      ...REPOS,
      'meetrune/rune': { ...REPOS['meetrune/rune'], recent: [newer], commits: 26 },
    }
    assert.deepEqual(latestCommit(SIGNALS, repos), {
      repo: 'meetrune/rune',
      commit: newer,
      count: 26,
    })
  })

  test('null without data; count stays null when unknown', () => {
    assert.equal(latestCommit(SIGNALS, undefined), null)
    assert.equal(latestCommit(SIGNALS, {}), null)
    const repos = { [EVALCORE]: { ...REPOS[EVALCORE], commits: null } }
    assert.equal(latestCommit(SIGNALS, repos)?.count, null)
  })
})

describe('latestRelease', () => {
  test("EvalCore's v0.7.5 with its burst", () => {
    const r = latestRelease(SIGNALS, REPOS)
    assert.ok(r)
    assert.equal(r.project, 'EvalCore')
    assert.equal(r.repo, EVALCORE)
    assert.equal(r.release, V075)
    assert.equal(r.live, REPOS[EVALCORE])
    assert.deepEqual(r.burst, releaseBurst(EVALCORE_RELEASES))
  })

  test('ignores private repos', () => {
    const repos = {
      ...REPOS,
      'getnullpkg/kubereach': repoLive({
        isPrivate: true,
        releases: [release('v9', '2026-09-01T00:00:00Z', 'getnullpkg/kubereach')],
      }),
    }
    assert.equal(latestRelease(SIGNALS, repos)?.repo, EVALCORE)
  })

  test('a newer single release elsewhere wins, with no burst', () => {
    const v1 = release('v1.0.0', '2026-09-01T00:00:00Z', 'getnullpkg/kubereach')
    const repos = {
      ...REPOS,
      'getnullpkg/kubereach': { ...REPOS['getnullpkg/kubereach'], releases: [v1] },
    }
    const r = latestRelease(SIGNALS, repos)
    assert.equal(r?.project, 'kubereach')
    assert.equal(r?.release, v1)
    assert.equal(r?.burst, null)
  })

  test('a lone newer release on the same repo has no burst line', () => {
    const later = release('v0.8.0', '2026-07-21T16:00:00Z')
    const repos = {
      ...REPOS,
      [EVALCORE]: { ...REPOS[EVALCORE], releases: [later, ...EVALCORE_RELEASES] },
    }
    const r = latestRelease(SIGNALS, repos)
    assert.equal(r?.release, later)
    assert.equal(r?.burst, null)
    // The stat still reports the last real burst.
    const stats = githubStats({
      featured: FEATURED,
      projects: SIGNALS,
      repos,
      languages: LANGUAGES,
    })
    assert.equal(stats[0]?.label, 'EvalCore releases in 3\u00a0days')
  })

  test('null without releases', () => {
    assert.equal(latestRelease(SIGNALS, undefined), null)
    assert.equal(latestRelease(SIGNALS, { [EVALCORE]: repoLive() }), null)
  })
})

describe('githubStats', () => {
  test('the four stats from real data, in order', () => {
    assert.ok(FEATURED)
    assert.deepEqual(
      githubStats({ featured: FEATURED, projects: SIGNALS, repos: REPOS, languages: LANGUAGES }),
      [
        { value: '6', label: 'EvalCore releases in 3\u00a0days' },
        { value: '16', label: 'stars on EvalCore, 3\u00a0forks' },
        { value: '8', label: 'languages across public repos' },
        { value: '8', label: 'projects built since 2023' },
      ],
    )
  })

  test('singular forms', () => {
    const featured = { name: 'EvalCore', repos: [EVALCORE] }
    const repos = {
      [EVALCORE]: repoLive({ stars: 1, forks: 1, releases: [V040, V030] }),
    }
    const stats = githubStats({ featured, projects: SIGNALS, repos, languages: LANGUAGES })
    assert.deepEqual(stats.slice(0, 2), [
      { value: '2', label: 'EvalCore releases in 1\u00a0day' },
      { value: '1', label: 'star on EvalCore, 1\u00a0fork' },
    ])
  })

  test('no forks means no fork clause', () => {
    const featured = { name: 'EvalCore', repos: [EVALCORE] }
    const repos = { [EVALCORE]: repoLive({ stars: 0, forks: 0 }) }
    assert.deepEqual(githubStats({ featured, projects: [], repos, languages: [] }), [
      { value: '0', label: 'stars on EvalCore' },
    ])
    const unknown = { [EVALCORE]: repoLive({ stars: 5, forks: null }) }
    assert.deepEqual(githubStats({ featured, projects: [], repos: unknown, languages: [] }), [
      { value: '5', label: 'stars on EvalCore' },
    ])
  })

  test('each stat drops out when its data is missing', () => {
    const base = { featured: FEATURED, projects: SIGNALS, repos: REPOS, languages: LANGUAGES }
    const labels = (o: Parameters<typeof githubStats>[0]) => githubStats(o).map((s) => s.label)

    // No burst: a single release.
    const oneRelease = { [EVALCORE]: { ...REPOS[EVALCORE], releases: [V075] } }
    assert.deepEqual(labels({ ...base, repos: oneRelease }), [
      'stars on EvalCore, 3\u00a0forks',
      'languages across public repos',
      'projects built since 2023',
    ])
    // No stars.
    const noStars = { [EVALCORE]: { ...REPOS[EVALCORE], stars: null } }
    assert.deepEqual(labels({ ...base, repos: noStars }), [
      'EvalCore releases in 3\u00a0days',
      'languages across public repos',
      'projects built since 2023',
    ])
    // No languages.
    assert.equal(labels({ ...base, languages: [] }).length, 3)
    assert.equal(labels({ ...base, languages: undefined }).length, 3)
    // No projects.
    assert.deepEqual(labels({ ...base, projects: [] }), [
      'EvalCore releases in 3\u00a0days',
      'stars on EvalCore, 3\u00a0forks',
      'languages across public repos',
    ])
    // No featured project, no repo data, or a private featured repo: both repo stats go.
    const repoless = ['languages across public repos', 'projects built since 2023']
    assert.deepEqual(labels({ ...base, featured: undefined }), repoless)
    assert.deepEqual(labels({ ...base, repos: undefined }), repoless)
    const hidden = { [EVALCORE]: { ...REPOS[EVALCORE], isPrivate: true } }
    assert.deepEqual(labels({ ...base, repos: hidden }), repoless)
    // Nothing at all.
    assert.deepEqual(
      githubStats({ featured: undefined, projects: [], repos: undefined, languages: undefined }),
      [],
    )
  })

  test('one language reads "1 language", not "1 languages"', () => {
    const stats = githubStats({
      featured: undefined,
      projects: [],
      repos: undefined,
      languages: ['Rust'],
    })
    assert.deepEqual(stats, [{ value: '1', label: 'language across public repos' }])
  })

  test('one project reads "1 project", not "1 projects"', () => {
    const stats = githubStats({
      featured: undefined,
      projects: [{ dateFirst: '2023-04-26' }],
      repos: undefined,
      languages: undefined,
    })
    assert.deepEqual(stats, [{ value: '1', label: 'project built since 2023' }])
  })
})

describe('repoRows', () => {
  const tagline = (slug: string) => signal(slug).tagline

  test('pinned order first, capped at 4', () => {
    const rows = repoRows(SIGNALS, REPOS, PINNED)
    assert.deepEqual(
      rows.map((r) => r.name),
      ['Eval-core/evalcore', 'getnullpkg/kubereach', AURIS, 'kuladeepmantri/untilithappens.org'],
    )
    assert.deepEqual(rows[2], {
      name: AURIS,
      url: 'https://github.com/kuladeepmantri/Auris',
      line: tagline('auris'),
      language: { name: 'C', color: '#555555' },
    })
    assert.equal(rows[0].line, tagline('evalcore'))
  })

  test('pinned names match case-insensitively; rows keep the SIGNALS spelling', () => {
    const rows = repoRows(SIGNALS, REPOS, ['KULADEEPMANTRI/auris', 'eval-core/EVALCORE'], 2)
    assert.deepEqual(
      rows.map((r) => r.name),
      [AURIS, EVALCORE],
    )
    assert.equal(rows[0].line, tagline('auris'))
  })

  test('tops up from project order when fewer than 4 are pinned', () => {
    const rows = repoRows(SIGNALS, REPOS, [AURIS])
    assert.deepEqual(
      rows.map((r) => r.name),
      [AURIS, 'Eval-core/evalcore', 'getnullpkg/kubereach', 'meetrune/rune'],
    )
    assert.deepEqual(
      repoRows(SIGNALS, REPOS, undefined).map((r) => r.name),
      ['Eval-core/evalcore', 'getnullpkg/kubereach', 'meetrune/rune', 'shipcrew-ai/shipcrew'],
    )
  })

  test('skips private repos even when pinned', () => {
    const repos = { ...REPOS, 'shipcrew-ai/shipcrew': repoLive({ isPrivate: true }) }
    const rows = repoRows(SIGNALS, repos, ['shipcrew-ai/shipcrew', ...PINNED], 10)
    assert.ok(!rows.some((r) => r.name === 'shipcrew-ai/shipcrew'))
    assert.equal(rows.length, 6)
  })

  test('a pinned skipped repo never shows: rows only come from project repos', () => {
    // Even with live data for it, a repo no project lists has no row.
    const [skipped] = SKIP_REPOS
    const repos = { ...REPOS, [skipped]: repoLive({ url: `https://github.com/${skipped}` }) }
    const rows = repoRows(SIGNALS, repos, [...SKIP_REPOS, ...PINNED], 10)
    assert.ok(!rows.some((r) => isSkippedRepo(r.name)))
    assert.equal(rows.length, 7)
  })

  test('pinned repos that are not project repos are ignored', () => {
    const rows = repoRows(SIGNALS, REPOS, [
      'kuladeepmantri/CyberChakra',
      'trishaktiinteriorsbyarg/site',
    ])
    assert.ok(rows.every((r) => SIGNALS.some((s) => s.repos.includes(r.name))))
  })

  test('no duplicates when a repo is pinned and also next in project order', () => {
    const rows = repoRows(SIGNALS, REPOS, ['eval-core/EVALCORE', 'Eval-core/evalcore'])
    assert.deepEqual(
      rows.map((r) => r.name),
      ['Eval-core/evalcore', 'getnullpkg/kubereach', 'meetrune/rune', 'shipcrew-ai/shipcrew'],
    )
  })

  test('a non-GitHub url falls back to the repo page', () => {
    const repos = {
      [EVALCORE]: { ...REPOS[EVALCORE], url: 'javascript:alert(1)' },
    }
    const [row] = repoRows(SIGNALS, repos, [])
    assert.equal(row.url, 'https://github.com/Eval-core/evalcore')
  })

  test('respects max, and is empty without data', () => {
    assert.equal(repoRows(SIGNALS, REPOS, PINNED, 2).length, 2)
    assert.deepEqual(repoRows(SIGNALS, undefined, PINNED), [])
  })
})

// ── X ──

function post(id: string, text: string, createdAt: string): Post {
  return { id, text, createdAt, url: `https://x.com/kuladeepmantri/status/${id}` }
}

function xData(posts: Post[], pinned: Post | null): NonNullable<LiveSnapshot['x']> {
  return {
    userId: '1500000000000000000',
    profileFetchedAt: '2026-09-30T12:00:00.000Z',
    name: 'Kuladeep Mantri',
    verified: true,
    pinned,
    posts,
    sinceId: posts[0]?.id ?? null,
  }
}

describe('postText and readable', () => {
  test('drops t.co links', () => {
    assert.equal(postText('Shipped it https://t.co/AbC123'), 'Shipped it')
    assert.equal(postText('one https://t.co/a two https://t.co/b'), 'one two')
  })

  test('drops a short line that only introduced a link', () => {
    assert.equal(
      postText('EvalCore is out.\n\nCode and quickstart: https://t.co/abc123'),
      'EvalCore is out.',
    )
    assert.equal(postText('Intro\nDocs:\nhttps://t.co/x9'), 'Intro')
  })

  test('keeps a long line that ends in a colon before a link', () => {
    const long = 'This sentence is much longer than forty characters in total:'
    assert.equal(postText(`${long} https://t.co/x`), long)
  })

  test('decodes entities, &amp; last', () => {
    assert.equal(postText('a &lt;b&gt; &amp; c'), 'a <b> & c')
    assert.equal(postText('literal &amp;lt;'), 'literal &lt;')
  })

  test('collapses runs of blank lines and trims', () => {
    assert.equal(postText('  a\n\n\n\nb  '), 'a\n\nb')
    assert.equal(postText('a\n\nb'), 'a\n\nb')
  })

  test('a link-only post leaves nothing', () => {
    assert.equal(postText('https://t.co/xyz789'), '')
    assert.equal(postText('Watch: https://t.co/xyz789'), '')
  })

  test('readable keeps posts with text, in order, as the same objects', () => {
    const a = post('3', 'hello', '2026-09-30T00:00:00Z')
    const b = post('2', 'https://t.co/x', '2026-09-29T00:00:00Z')
    const c = post('1', 'world https://t.co/y', '2026-09-28T00:00:00Z')
    const out = readable([a, b, c])
    assert.deepEqual(out, [a, c])
    assert.equal(out[0], a)
    assert.deepEqual(readable([]), [])
  })
})

describe('pagePosts', () => {
  const linkOnly = post('16', 'https://t.co/video1', '2026-09-30T10:00:00Z')
  const p5 = post('15', 'Newest post with words', '2026-09-29T10:00:00Z')
  const p4 = post('14', 'Fourth', '2026-09-20T10:00:00Z')
  const p3 = post('13', 'Third https://t.co/link', '2026-09-10T10:00:00Z')
  const p2 = post('12', 'Second', '2026-09-01T10:00:00Z')
  const p1 = post('11', 'First', '2026-08-01T10:00:00Z')
  const pin = post('10', 'EvalCore launch: snapshot testing for LLM apps.', '2026-07-20T15:00:00Z')

  const ids = (ps: Post[]) => ps.map((p) => p.id)

  test('slider gets the newest readable post; list is pinned then two more', () => {
    const r = pagePosts(xData([linkOnly, p5, p4, p3, p2, p1], pin))
    assert.equal(r.latest, p5)
    assert.equal(r.pinned, pin)
    assert.deepEqual(ids(r.list), ['10', '14', '13'])
    assert.ok(r.list.length <= 3)
    assert.ok(!r.list.some((p) => p.id === r.latest?.id), 'slider post not repeated')
    assert.ok(![r.latest, ...r.list].some((p) => p?.id === linkOnly.id), 'link-only dropped')
  })

  test('a pinned post that is also in the timeline shows once', () => {
    const r = pagePosts(xData([p5, p4, p3, p2, p1], p3))
    assert.deepEqual(ids(r.list), ['13', '14', '12'])
    assert.equal(new Set(ids(r.list)).size, r.list.length)
  })

  test('a link-only pinned post is dropped', () => {
    const r = pagePosts(xData([p5, p4, p3], post('9', 'https://t.co/img', '2026-07-01T00:00:00Z')))
    assert.equal(r.pinned, null)
    assert.deepEqual(ids(r.list), ['14', '13'])
  })

  test('no pinned post: the two after the slider post', () => {
    const r = pagePosts(xData([p5, p4, p3, p2], null))
    assert.equal(r.latest, p5)
    assert.deepEqual(ids(r.list), ['14', '13'])
  })

  test('short timelines', () => {
    assert.deepEqual(pagePosts(xData([p5], null)), { latest: p5, pinned: null, list: [] })
    assert.deepEqual(pagePosts(xData([linkOnly], null)), { latest: null, pinned: null, list: [] })
    assert.deepEqual(pagePosts(xData([], pin)), { latest: null, pinned: pin, list: [pin] })
  })

  test('no X data', () => {
    const empty = { latest: null, pinned: null, list: [] }
    assert.deepEqual(pagePosts(null), empty)
    assert.deepEqual(pagePosts(undefined), empty)
  })

  test('when the newest post is also pinned, the slider post is not repeated in the list', () => {
    const r = pagePosts(xData([p5, p4, p3, p2], p5))
    assert.equal(r.latest, p4)
    assert.deepEqual(ids(r.list), ['15', '13', '12'])
    assert.ok(!r.list.some((p) => p.id === r.latest?.id))
  })
})

describe('postText mentions', () => {
  test('a space typed between a mention and its punctuation is dropped', () => {
    assert.equal(
      postText('Built with @manyamabhishek .\n\nLive on Product Hunt:\nhttps://t.co/BXegybtGkk'),
      'Built with @manyamabhishek.',
    )
    assert.equal(postText('ping @a , then @b !'), 'ping @a, then @b!')
  })

  test('other spacing is left alone', () => {
    assert.equal(postText('a @ b . c'), 'a @ b . c')
    assert.equal(postText('@handle .net'), '@handle .net')
  })
})

// ── scripts/fetch-live.ts ──

describe('X posts from the API (fetch-live)', () => {
  // Shaped like GET /2/users/:id/tweets with
  // tweet.fields=created_at,note_tweet,referenced_tweets.
  const tweet = (id: string, text: string, createdAt: string, extra: object = {}) => ({
    id,
    text,
    created_at: createdAt,
    edit_history_tweet_ids: [id],
    ...extra,
  })
  const head = tweet('2105138137194500001', 'Thread head', '2026-09-30T03:30:18.000Z')
  const selfReply = tweet('2105138181800960002', 'Thread, part two', '2026-09-30T03:30:28.000Z', {
    referenced_tweets: [{ type: 'replied_to', id: head.id }],
  })
  const quote = tweet('2104455352431587003', 'A quote post', '2026-09-28T06:17:09.000Z', {
    referenced_tweets: [{ type: 'quoted', id: '2079202727167398097' }],
  })
  const long = tweet('2102716858147406004', 'Cut short…', '2026-09-23T11:09:00.000Z', {
    note_tweet: { text: 'The whole long post' },
  })

  test('isReply is true only for replied_to', () => {
    assert.equal(isReply(selfReply), true)
    assert.equal(isReply(head), false)
    assert.equal(isReply(quote), false)
    assert.equal(
      isReply(tweet('1', 'x', '2026-09-30T00:00:00Z', { referenced_tweets: 'replied_to' })),
      false,
    )
    for (const v of [null, undefined, 'replied_to', []]) assert.equal(isReply(v), false)
  })

  test('drops replies inside my own threads, keeps heads and quotes, prefers the long text', () => {
    const posts = toPosts([selfReply, head, quote, long])
    assert.deepEqual(
      posts.map((p) => p.id),
      [head.id, quote.id, long.id],
    )
    assert.equal(posts[2].text, 'The whole long post')
    assert.equal(posts[0].url, `https://x.com/kuladeepmantri/status/${head.id}`)
    assert.ok(!posts.some((p) => 'referenced_tweets' in p), 'only the Post fields are stored')
  })

  test('junk in, nothing out', () => {
    assert.deepEqual(toPosts(null), [])
    assert.deepEqual(toPosts({ data: [head] }), [])
    assert.deepEqual(
      toPosts([null, 'x', { ...head, id: 'abc' }, { ...head, created_at: 'nope' }]),
      [],
    )
  })

  test('newestId compares post ids as integers', () => {
    // Too big for a double: as numbers these two are equal.
    const [a, b] = ['2105138503843495996', '2105138503843495997']
    assert.equal(Number(a), Number(b))
    assert.equal(newestId([a, b]), b)
    assert.equal(newestId([b, a, '999', 'abc', null, undefined]), b)
    assert.equal(newestId(['999', '1000']), '1000')
    assert.equal(newestId([]), null)
  })
})

describe('tokens and error logging (fetch-live)', () => {
  const SECRET = 'ghp_SECRETsecret0123456789'

  test('a token with a control, space, or non-ASCII character inside is skipped', (t) => {
    const lines: string[] = []
    t.mock.method(console, 'log', (m: string) => void lines.push(m))
    const bad = [
      `${SECRET}\r\nX-Injected: 1`,
      `${SECRET}\nmore`,
      `${SECRET}\0`,
      `Bearer ${SECRET}`,
      `${SECRET}\tx`,
      `${SECRET}é`,
    ]
    for (const v of bad) assert.equal(usableToken('GH_PAT', v), undefined)
    assert.equal(lines.length, bad.length)
    for (const l of lines) {
      assert.ok(l.endsWith('GH_PAT has invalid characters, skipped'), l)
      assert.ok(!l.includes(SECRET))
    }
  })

  test('a clean token passes, trimmed; a missing one is absent without a warning', (t) => {
    const lines: string[] = []
    t.mock.method(console, 'log', (m: string) => void lines.push(m))
    assert.equal(usableToken('GH_PAT', SECRET), SECRET)
    assert.equal(usableToken('X_BEARER_TOKEN', `${SECRET}\r\n`), SECRET)
    assert.equal(usableToken('X_BEARER_TOKEN', 'AAAA%2Fb%3D'), 'AAAA%2Fb%3D')
    assert.equal(usableToken('GITHUB_TOKEN', undefined), undefined)
    assert.equal(usableToken('GITHUB_TOKEN', ''), undefined)
    assert.equal(usableToken('GITHUB_TOKEN', ' \n'), undefined)
    assert.deepEqual(lines, [])
  })

  test('an error the script did not raise logs only its name', async () => {
    // fetch rejects a bad header value with a message that quotes it.
    const e = await fetch('http://127.0.0.1:9/', {
      headers: { Authorization: `Bearer ${SECRET}\nX-Injected: 1` },
    }).then(
      () => null,
      (err: unknown) => err,
    )
    assert.ok(e instanceof TypeError)
    assert.ok(e.message.includes(SECRET), 'the raw message would leak the token')
    assert.equal(why(e), 'TypeError')
    assert.equal(why(new Error(SECRET)), 'Error')
    assert.equal(why(SECRET), 'unknown error')
    assert.equal(why(undefined), 'unknown error')
  })
})

describe('the cached snapshot (fetch-live slim)', () => {
  const cachedAuris = {
    isPrivate: false,
    url: 'https://github.com/kuladeepmantri/Auris',
    pushedAt: '2025-12-05T19:09:31Z',
    recent: [REPOS[AURIS].recent[0]],
    commits: 28,
    stars: 0,
    forks: 0,
    language: { name: 'C', color: '#555555' },
    license: 'Apache-2.0',
    releases: [],
  }
  const cache = (repos: Record<string, unknown>, pinned: string[] = PINNED) => ({
    builtAt: '2026-10-01T00:15:41.963Z',
    sha: '18ef336',
    github: { repos, languages: LANGUAGES, pinned },
    x: null,
  })

  test('a repo cached under older casing carries over under the SIGNALS key', () => {
    const snap = slim(cache({ 'kuladeepmantri/auris': cachedAuris }))
    assert.ok(snap?.github)
    assert.deepEqual(Object.keys(snap.github.repos), [AURIS])
    assert.deepEqual(snap.github.repos[AURIS], cachedAuris)
    assert.ok(SIGNALS.some((s) => s.repos.includes(AURIS)))
  })

  test('the SIGNALS spelling wins when both are cached', () => {
    const stale = { ...cachedAuris, stars: 99 }
    const snap = slim(cache({ 'kuladeepmantri/auris': stale, [AURIS]: cachedAuris }))
    assert.deepEqual(Object.keys(snap?.github?.repos ?? {}), [AURIS])
    assert.equal(snap?.github?.repos[AURIS].stars, 0)
  })

  test('repos no project lists are dropped, and skipped repos are never pinned', () => {
    const [skipped] = SKIP_REPOS
    const repos = {
      [skipped]: cachedAuris,
      'someone/else': cachedAuris,
      [EVALCORE]: REPOS[EVALCORE],
    }
    const snap = slim(cache(repos, [skipped, ...PINNED]))
    assert.deepEqual(Object.keys(snap?.github?.repos ?? {}), [EVALCORE])
    assert.deepEqual(snap?.github?.pinned, PINNED)
  })
})

describe('slim drops X posts cached before the reply filter', () => {
  const post = (id: string) => ({
    id,
    text: `post ${id}`,
    createdAt: '2026-09-28T06:17:09.000Z',
    url: `https://x.com/kuladeepmantri/status/${id}`,
  })
  const x = {
    userId: '123',
    profileFetchedAt: '2026-09-28T00:00:00.000Z',
    name: 'Kuladeep Mantri',
    verified: true,
    posts: [post('2'), post('1')],
    sinceId: '2',
  }

  test('a cache without the pinned field keeps no posts and no since_id', () => {
    const snap = slim({ builtAt: '2026-09-28T14:13:41.103Z', sha: 'abc1234', github: null, x })
    assert.deepEqual(snap?.x?.posts, [])
    assert.equal(snap?.x?.sinceId, null)
  })

  test('a current cache keeps its posts', () => {
    const snap = slim({
      builtAt: '2026-09-30T14:13:41.103Z',
      sha: 'abc1234',
      github: null,
      x: { ...x, pinned: null },
    })
    assert.deepEqual(
      snap?.x?.posts.map((p) => p.id),
      ['2', '1'],
    )
    assert.equal(snap?.x?.sinceId, '2')
  })
})
