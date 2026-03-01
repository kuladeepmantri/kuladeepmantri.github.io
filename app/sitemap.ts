import type { MetadataRoute } from 'next'
import { WEBSITE_URL } from '@/lib/constants'
import { PROJECTS } from './data'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const appPages = PROJECTS.map((project) => ({
    url: `${WEBSITE_URL}/apps/${project.id}`,
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
      url: `${WEBSITE_URL}/apps`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...appPages,
  ]
}
