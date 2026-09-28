import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Shell } from '@/components/site/shell'
import { WEBSITE_URL } from '@/lib/constants'
import { pageMeta } from '@/lib/meta'
import { GITHUB_USER, INSTAGRAM, SENTENCE_ONE, X_HANDLE } from './signals'

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
}

// Each scene's sky top colour, keyed like lib/panes.ts palettes. The path
// mapping below mirrors normalizePath and placeFor there.
const SKY: Record<string, string> = {
  home: '#3b7fd6', about: '#2b3f78', contact: '#2d2a6e', github: '#040a1a', x: '#0b1537',
  kubereach: '#070b1a', rune: '#2a3e80', shipcrew: '#4a74b6', kintsugi: '#6c8bcc',
  auris: '#18223f', untilithappens: '#080d20', deid: '#1d2263', evalcore: '#2f7fe0',
}
const SKY_BOOT = `(function(){try{var m=${JSON.stringify(SKY)};var p=location.pathname.replace(/\\/index\\.html$/,'/').replace(/\\.html$/,'').replace(/\\/+$/,'')||'/';var k=p.indexOf('/apps/')===0?p.slice(6):({'/':'home','/now':'home','/apps':'home','/verify':'home','/about':'about','/github':'github','/x':'x','/contact':'contact'})[p]||'contact';var h=Object.prototype.hasOwnProperty.call(m,k);var c=h?m[k]:m.contact;var d=document.documentElement;d.style.setProperty('--bg',c);d.dataset.palette=h?k:'contact';var t=document.querySelector('meta[name=theme-color]');if(t)t.setAttribute('content',c);var r=function(){var v=parseFloat(getComputedStyle(d).getPropertyValue('--runway'))||0;if(v&&scrollY<v-1)scrollTo(0,v)};document.addEventListener('DOMContentLoaded',r);addEventListener('load',r);addEventListener('pageshow',r)}catch(e){}})()`

// Structured data that ties the site to the same person's profiles. The deck
// never renders home's page content, so this lives in the layout.
const PERSON = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Kuladeep Mantri',
  url: WEBSITE_URL,
  jobTitle: 'Security Engineer',
  image: `${WEBSITE_URL}/images/portrait.jpg`,
  address: { '@type': 'PostalAddress', addressRegion: 'MI', addressCountry: 'US' },
  sameAs: [`https://github.com/${GITHUB_USER}`, `https://x.com/${X_HANDLE}`, INSTAGRAM.href],
}
const PERSON_LD = JSON.stringify(PERSON).replace(/</g, '\\u003c')

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
        {/* Before first paint: the page's sky colour for the browser chrome, and on iOS
            the scroll onto the runway (globals.css) that lets the scene show behind it. */}
        <script dangerouslySetInnerHTML={{ __html: SKY_BOOT }} />
        <noscript>
          <style>{'.live-t:not(.live-clock){opacity:1}.pane{background:var(--pane)}'}</style>
        </noscript>
      </head>
      <body>
        <Shell>{children}</Shell>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PERSON_LD }} />
      </body>
    </html>
  )
}
