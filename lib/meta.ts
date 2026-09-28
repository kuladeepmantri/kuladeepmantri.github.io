import type { Metadata } from 'next'

// One share image for every page: the site itself, 1200 by 630.
export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Kuladeep Mantri, security engineer: the home pane over the site’s line-art scenery.',
}

const SITE = 'Kuladeep Mantri'

// The project feeds, linked from every page. A page's alternates replace the
// layout's, so each page repeats them.
export const FEEDS = {
  'application/rss+xml': [{ url: '/feed.xml', title: `${SITE}: projects (RSS)` }],
  'application/feed+json': [{ url: '/api/signals.json', title: `${SITE}: projects (JSON Feed)` }],
}

/** Metadata for an old URL that now shows home (/now, /apps, /verify). */
export const ALIAS_OF_HOME: Metadata = {
  alternates: { canonical: '/', types: FEEDS },
}

/**
 * Title, description, canonical URL, and link-card tags for one page. Next
 * replaces openGraph and twitter wholesale per page, so each page sets all of it.
 */
export function pageMeta({
  title,
  description,
  path,
}: {
  title?: string
  description: string
  path: string
}): Metadata {
  const full = title ? `${title} · ${SITE}` : `${SITE} · security engineer`
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path, types: FEEDS },
    openGraph: {
      type: 'website',
      siteName: SITE,
      title: full,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@kuladeepmantri',
      title: full,
      description,
      images: [OG_IMAGE.url],
    },
  }
}
