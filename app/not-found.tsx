import Link from 'next/link'
import { PaneHead } from '@/components/site/pane-head'
import type { Metadata } from 'next'
import { FEEDS } from '@/lib/meta'
import { SIGNALS } from './signals'

// No canonical: the layout's would point every missing URL at home. Next adds
// noindex to this page itself.
export const metadata: Metadata = {
  title: 'Not found',
  alternates: { canonical: null, types: FEEDS },
}

// GitHub Pages answers /about/ with this 404 page, since only about.html
// exists. Before hydration, send a known page's trailing-slash URL to the clean
// one. Only listed paths redirect, so an unknown path can never loop.
const PAGES = [
  '/',
  '/about',
  '/github',
  '/x',
  '/contact',
  '/now',
  '/apps',
  '/verify',
  ...SIGNALS.map((s) => `/apps/${s.slug}`),
]
const SLASH_FIX = `(function(){try{var p=location.pathname,t=p.replace(/\\/+$/,'')||'/';if(t!==p&&${JSON.stringify(PAGES)}.indexOf(t)>=0)location.replace(t+location.search+location.hash)}catch(e){}})()`

export default function NotFound() {
  return (
    <article>
      <script dangerouslySetInnerHTML={{ __html: SLASH_FIX }} />
      <PaneHead title="Not found" />
      <p>
        That page doesn’t exist, or it moved in the redesign. Everything that’s here opens from the
        home pane, or <Link href="/">start over</Link>.
      </p>
    </article>
  )
}
