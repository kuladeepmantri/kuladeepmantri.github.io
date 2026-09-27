import { sortedByStart } from '@/app/signals'
import { WEBSITE_URL } from '@/lib/constants'

export const dynamic = 'force-static'

export function GET(): Response {
  const signals = sortedByStart()

  const body = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Kuladeep Mantri: Log',
    home_page_url: WEBSITE_URL,
    feed_url: `${WEBSITE_URL}/api/signals.json`,
    description:
      "Dated, versioned entries from Kuladeep Mantri's public lab.",
    authors: [{ name: 'Kuladeep Mantri', url: WEBSITE_URL }],
    language: 'en',
    items: signals.map((s) => ({
      id: `${WEBSITE_URL}/apps/${s.slug}#${s.id}`,
      url: `${WEBSITE_URL}/apps/${s.slug}`,
      title: `${s.name}: ${s.tagline}`,
      content_text: s.description,
      date_published: `${s.dateFirst}T00:00:00Z`,
      date_modified: `${s.dateLast}T00:00:00Z`,
      tags: [s.type, s.state, ...s.tags],
      _km: {
        id: s.id,
        state: s.state,
        repos: s.repos,
      },
    })),
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
