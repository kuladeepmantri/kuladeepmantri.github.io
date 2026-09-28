import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'
import { LIVE } from '@/lib/generated/live'
import { lastCommit } from '@/lib/live'
import { SIGNALS } from './signals'

export const dynamic = 'force-static'

// lastmod comes from the content itself, never the build time, so an hourly
// rebuild with nothing new does not claim every page changed.
function newest(...dates: (string | null | undefined)[]): Date | undefined {
  const times = dates.flatMap((d) =>
    d ? [Date.parse(d.length === 10 ? `${d}T12:00:00Z` : d)] : [],
  )
  const t = Math.max(...times.filter((n) => !Number.isNaN(n)))
  return Number.isFinite(t) ? new Date(t) : undefined
}

export default function sitemap(): MetadataRoute.Sitemap {
  const repos = LIVE.github?.repos
  const project = (s: (typeof SIGNALS)[number]) => newest(s.dateLast, lastCommit(s, repos)?.date)
  const lastPush = LIVE.github?.pushes[0]?.pushedAt
  const lastPost = LIVE.x?.posts[0]?.createdAt
  const page = (path: string, priority: number, lastModified?: Date) => ({
    url: `${WEBSITE_URL}${path}`,
    ...(lastModified && { lastModified }),
    priority,
  })
  return [
    page('', 1, newest(lastPush, lastPost, ...SIGNALS.map((s) => project(s)?.toISOString()))),
    page('/about', 0.8),
    page('/github', 0.6, newest(lastPush)),
    page('/x', 0.6, newest(lastPost)),
    page('/contact', 0.6),
    ...SIGNALS.map((s) => page(`/apps/${s.slug}`, 0.8, project(s))),
  ]
}
