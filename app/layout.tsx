import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { LayoutShell } from '@/components/layout-shell'
import { WEBSITE_URL } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1c1b18' },
    { media: '(prefers-color-scheme: light)', color: '#faf9f5' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  // Canonical is NOT set here — that would force every sub-page (/now, /about,
  // /apps/[slug]) to canonicalize to `/`, suppressing their indexing. Let Next
  // derive canonical per-page from the route, or override in per-page metadata.
  title: {
    default: 'Kuladeep Mantri · cybersecurity engineer',
    template: '%s | Kuladeep Mantri',
  },
  description:
    'Cybersecurity engineer who also builds AI. I work on how systems and the AI running on them are designed, and where they fail.',
  openGraph: {
    type: 'website',
    url: WEBSITE_URL,
    title: 'Kuladeep Mantri · cybersecurity engineer',
    description:
      'Cybersecurity engineer who also builds AI. I work on how systems and the AI running on them are designed, and where they fail.',
    siteName: 'Kuladeep Mantri',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuladeep Mantri · cybersecurity engineer',
    description:
      'Cybersecurity engineer who also builds AI. I work on how systems and the AI running on them are designed, and where they fail.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-flash: sets data-theme before React hydrates, defaulting to light */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('km-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}})();` }} />
      </head>
      <body className="bg-[var(--bg)] antialiased">
        <LayoutShell>
          <div className="flex min-h-screen w-full flex-col">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:rounded focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--bg)]"
            >
              Skip to content
            </a>
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </div>
        </LayoutShell>
      </body>
    </html>
  )
}
