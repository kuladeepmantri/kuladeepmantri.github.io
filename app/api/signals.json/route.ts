import { sortedByStart, type Signal } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { WEBSITE_URL } from '@/lib/constants'
import { lastCommit, toTime } from '@/lib/live'

export const dynamic = 'force-static'

export function GET(): Response {
  const signals = sortedByStart()
  // Only repos the build confirmed public are named.
  const repos = LIVE.github?.repos
  const publicRepos = (list: string[]) => list.filter((r) => repos?.[r] && !repos[r].isPrivate)
  // The newer of dateLast and my latest commit on the project, the same rule
  // the sitemap uses for lastmod.
  const modified = (s: Signal) => {
    const commit = lastCommit(s, repos)?.date
    const times = [toTime(s.dateLast), commit ? toTime(commit) : NaN].filter(
      (t) => !Number.isNaN(t),
    )
    return times.length ? new Date(Math.max(...times)).toISOString() : `${s.dateLast}T12:00:00Z`
  }

  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Kuladeep Mantri: projects',
    home_page_url: WEBSITE_URL,
    feed_url: `${WEBSITE_URL}/api/signals.json`,
    description: 'Projects I have built and am building.',
    authors: [{ name: 'Kuladeep Mantri', url: WEBSITE_URL }],
    language: 'en',
    items: signals.map((s) => ({
      id: `${WEBSITE_URL}/apps/${s.slug}#${s.id}`,
      url: `${WEBSITE_URL}/#${s.slug}`,
      title: `${s.name}: ${s.tagline}`,
      content_text: s.description,
      date_published: `${s.dateFirst}T12:00:00Z`,
      date_modified: modified(s),
      tags: [s.type, s.state, ...s.tags],
      _km: { id: s.id, state: s.state, repos: publicRepos(s.repos) },
    })),
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
