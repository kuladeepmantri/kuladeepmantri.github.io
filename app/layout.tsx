import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { THEME_KEY, WEBSITE_URL } from '@/lib/constants'
import { pageMeta } from '@/lib/meta'
import { GITHUB_USER, INSTAGRAM, SENTENCE_ONE, X_HANDLE } from './signals'

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  ...pageMeta({ description: SENTENCE_ONE, path: '/' }),
  metadataBase: new URL(WEBSITE_URL),
  title: {
    default: 'Kuladeep Mantri · Security Engineer',
    template: '%s · Kuladeep Mantri',
  },
  authors: [{ name: 'Kuladeep Mantri', url: WEBSITE_URL }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfdfc' },
    { media: '(prefers-color-scheme: dark)', color: '#161615' },
  ],
}

// Before first paint: the visitor's saved theme (components/home/theme.tsx),
// so a forced Light or Dark never flashes the system one, with its own
// theme-color meta (#tc, ahead of the per-scheme ones React renders); then a path like
// //host/ becomes /host/, since Next reads it as another origin and crashes.
// scripts/csp.ts hashes this script into the page's Content-Security-Policy.
const BOOT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);var m=document.createElement('meta');m.name='theme-color';m.id='tc';m.content=t==='dark'?'#161615':'#fdfdfc';document.head.prepend(m)}}catch(e){}try{var p=location.pathname;if(/^\\/\\//.test(p))history.replaceState(history.state,'',p.replace(/^\\/+/,'/')+location.search+location.hash)}catch(e){}})()`

// Without JavaScript: relative times show their build-time values, wall
// clocks stay hidden, both Elsewhere panels show without the tabs, and the
// controls that need a script (theme, slider, copy, the clock) are hidden.
const NOSCRIPT = `.live-t:not(.live-clock){opacity:1}[role=tabpanel][hidden]{display:block}[role=tabpanel]+[role=tabpanel]{margin-top:28px}.seglist,.chrome,.copy,.clock-col,.slide.is-off{display:none}.slides{min-height:0}.slide-link{padding-bottom:22px}.fbottom{grid-template-columns:minmax(0,1fr) auto}`

// Structured data that ties the site to the same person's profiles.
const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Kuladeep Mantri',
  url: WEBSITE_URL,
  jobTitle: 'Security Engineer',
  image: `${WEBSITE_URL}/images/portrait.jpg`,
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'MI',
    addressCountry: 'US',
  },
  sameAs: [`https://github.com/${GITHUB_USER}`, `https://x.com/${X_HANDLE}`, INSTAGRAM.href],
}
const PERSON_LD = JSON.stringify(PERSON).replace(/</g, '\\u003c')

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: BOOT may set data-theme before React hydrates.
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <noscript>
          <style>{NOSCRIPT}</style>
        </noscript>
      </head>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PERSON_LD }} />
      </body>
    </html>
  )
}
