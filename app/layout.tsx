import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'
import { WEBSITE_URL } from '@/lib/constants'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  metadataBase: new URL(WEBSITE_URL),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Kuladeep Mantri',
    template: '%s | Kuladeep Mantri',
  },
  description: 'Cybersecurity, Secure Cloud Architecture, and AI Research.',
  openGraph: {
    type: 'website',
    url: WEBSITE_URL,
    title: 'Kuladeep Mantri',
    description: 'Cybersecurity, Secure Cloud Architecture, and AI Research.',
    siteName: 'Kuladeep Mantri',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuladeep Mantri',
    description: 'Cybersecurity, Secure Cloud Architecture, and AI Research.',
  },
}

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
      </head>
      <body className="bg-white font-sans tracking-tight antialiased dark:bg-zinc-950">
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
        >
          <div className="flex min-h-screen w-full flex-col">
            <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
              <Header />
              {children}
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
