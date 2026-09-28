import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Shell } from '@/components/site/shell'
import { WEBSITE_URL } from '@/lib/constants'
import { pageMeta } from '@/lib/meta'
import { SENTENCE_ONE } from './signals'

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  ...pageMeta({ description: SENTENCE_ONE, path: '/' }),
  metadataBase: new URL(WEBSITE_URL),
  title: {
    default: 'Kuladeep Mantri · security engineer',
    template: '%s · Kuladeep Mantri',
  },
  authors: [{ name: 'Kuladeep Mantri', url: WEBSITE_URL }],
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
      'application/feed+json': '/api/signals.json',
    },
  },
}

// Each scene's sky top colour, keyed like lib/panes.ts palettes.
const SKY: Record<string, string> = {
  home: '#3b7fd6', about: '#2b3f78', contact: '#2d2a6e', github: '#040a1a', x: '#0b1537',
  kubereach: '#070b1a', rune: '#2a3e80', shipcrew: '#4a74b6', kintsugi: '#6c8bcc',
  auris: '#18223f', untilithappens: '#080d20', deid: '#1d2263', evalcore: '#2f7fe0',
}
const SKY_BOOT = `(function(){try{var m=${JSON.stringify(SKY)};var p=location.pathname.replace(/\\/+$/,'')||'/';var k=p.indexOf('/apps/')===0?p.slice(6):({'/':'home','/now':'home','/about':'about','/github':'github','/x':'x','/contact':'contact'})[p]||'contact';var c=Object.prototype.hasOwnProperty.call(m,k)?m[k]:m.home;document.documentElement.style.setProperty('--bg',c);var t=document.querySelector('meta[name=theme-color]');if(t)t.setAttribute('content',c)}catch(e){}})()`

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b7fd6" />
        {/* Before first paint: the browser chrome takes this page's sky colour. */}
        <script dangerouslySetInnerHTML={{ __html: SKY_BOOT }} />
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
