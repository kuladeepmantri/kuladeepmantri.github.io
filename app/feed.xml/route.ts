import { sortedByStart, type Signal } from '@/app/signals'
import { WEBSITE_URL } from '@/lib/constants'

export const dynamic = 'force-static'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET(): Response {
  // Items are newest first by start date, and every date here is that same
  // start date at noon UTC, matching date_published in the JSON Feed.
  const signals = sortedByStart()
  const itemDate = (s: Signal) => new Date(`${s.dateFirst}T12:00:00Z`)
  const newest = signals.reduce<Date | null>(
    (max, s) => (!max || itemDate(s) > max ? itemDate(s) : max),
    null,
  )
  const lastBuild = (newest ?? new Date(0)).toUTCString()

  const items = signals
    .map((s) => {
      const url = `${WEBSITE_URL}/apps/${s.slug}`
      const pubDate = itemDate(s).toUTCString()
      return `    <item>
      <guid isPermaLink="false">${escapeXml(s.id)}</guid>
      <title>${escapeXml(s.name)}: ${escapeXml(s.tagline)}</title>
      <link>${escapeXml(url)}</link>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(s.description)}</description>
      <category>${escapeXml(s.state)}</category>
    </item>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kuladeep Mantri: projects</title>
    <link>${WEBSITE_URL}</link>
    <atom:link href="${WEBSITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Projects I have built and am building.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
