import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'
import { SIGNALS } from './signals'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const page = (path: string, priority: number) => ({
    url: `${WEBSITE_URL}${path}`,
    lastModified,
    priority,
  })
  return [
    page('', 1),
    page('/work', 0.9),
    page('/about', 0.8),
    page('/github', 0.6),
    page('/x', 0.6),
    page('/contact', 0.6),
    ...SIGNALS.map((s) => page(`/apps/${s.slug}`, 0.8)),
  ]
}
