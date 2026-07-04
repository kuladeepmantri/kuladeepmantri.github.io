import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'
import { SIGNALS } from './signals'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const appPages = SIGNALS.map((signal) => ({
    url: `${WEBSITE_URL}/apps/${signal.slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: WEBSITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${WEBSITE_URL}/now`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${WEBSITE_URL}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...appPages,
  ]
}
