import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'
import { LIVE } from '@/lib/generated/live'
import { lastCommit, pagePosts, toTime } from '@/lib/live'
import { SIGNALS } from './signals'

export const dynamic = 'force-static'

// One page. lastmod comes from the content itself, never the build time, so an
// hourly rebuild with nothing new does not claim the page changed. Posts count
// only when the page shows them (a link-only post never does).
export default function sitemap(): MetadataRoute.Sitemap {
  const repos = LIVE.github?.repos
  const { latest, list } = pagePosts(LIVE.x)
  const times = [
    ...SIGNALS.flatMap((s) => [s.dateLast, lastCommit(s, repos)?.date]),
    latest?.createdAt,
    ...list.map((p) => p.createdAt),
  ]
    .flatMap((d) => (d ? [toTime(d)] : []))
    .filter((t) => !Number.isNaN(t))
  return [
    {
      url: `${WEBSITE_URL}/`,
      ...(times.length && { lastModified: new Date(Math.max(...times)) }),
      priority: 1,
    },
  ]
}
