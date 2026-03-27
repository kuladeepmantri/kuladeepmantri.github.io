import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { LayoutShell } from '@/components/layout-shell'
import { LoadingScreen } from '@/components/loading-screen'
import { PageTransition } from '@/components/page-transition'
import { WEBSITE_URL } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050505',
}

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  alternates: { canonical: '/' },
  title: {
    default: 'Kuladeep Mantri',
    template: '%s | Kuladeep Mantri',
  },
  description:
    'Security engineer and software developer. Projects in security, systems, and design.',
  openGraph: {
    type: 'website',
    url: WEBSITE_URL,
    title: 'Kuladeep Mantri',
    description:
      'Security engineer and software developer. Projects in security, systems, and design.',
    siteName: 'Kuladeep Mantri',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuladeep Mantri',
    description:
      'Security engineer and software developer. Projects in security, systems, and design.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-[var(--bg)] font-[var(--font-inter),system-ui,-apple-system,sans-serif] antialiased">
        <LayoutShell>
          <LoadingScreen />
          <div className="flex min-h-screen w-full flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--bg)]"
            >
              Skip to content
            </a>
            <Header />
            <main id="main-content" className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
        </LayoutShell>
      </body>
    </html>
  )
}
