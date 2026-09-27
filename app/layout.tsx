import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Shell } from '@/components/site/shell'
import { WEBSITE_URL } from '@/lib/constants'
import { SENTENCE_ONE } from './signals'

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  title: {
    default: 'Kuladeep Mantri · security engineer',
    template: '%s · Kuladeep Mantri',
  },
  description: SENTENCE_ONE,
  authors: [{ name: 'Kuladeep Mantri', url: WEBSITE_URL }],
  openGraph: {
    type: 'website',
    siteName: 'Kuladeep Mantri',
    title: 'Kuladeep Mantri · security engineer',
    description: SENTENCE_ONE,
    url: WEBSITE_URL,
  },
  twitter: { card: 'summary', creator: '@kuladeepmantri' },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
      'application/feed+json': '/api/signals.json',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050609" />
        <noscript>
          <style>{'.s2{opacity:1}.pane{background:var(--pane)}'}</style>
        </noscript>
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
