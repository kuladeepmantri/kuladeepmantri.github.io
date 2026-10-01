import type { Metadata } from 'next'
import { FEEDS } from '@/lib/meta'
import { SIGNALS } from './signals'

// No canonical: the layout's would point every missing URL at home. Next adds
// noindex to this page itself.
export const metadata: Metadata = {
  title: 'Not found',
  alternates: { canonical: null, types: FEEDS },
}

// GitHub Pages answers any missing path with this page. The site used to have
// more pages, so their URLs (with or without a trailing slash or .html) go to
// the matching part of the one page. Only listed paths and anything under
// /apps/ redirect, and every target is /, so an unknown path can never loop.
// scripts/csp.ts copies this script (id="moved") to the top of <head>, so it
// runs before the stylesheet loads. That copy runs before the layout's BOOT
// script, so it collapses leading slashes itself.
const MOVED: Record<string, string> = {
  '/about': '#about',
  '/contact': '#contact',
  '/github': '#elsewhere',
  '/x': '#elsewhere',
  '/now': '',
  '/verify': '',
  '/apps': '',
  '/': '',
  ...Object.fromEntries(SIGNALS.map((s) => [`/apps/${s.slug}`, `#${s.slug}`])),
}
const REDIRECT = `(function(){try{var m=${JSON.stringify(MOVED)},p=location.pathname.replace(/^\\/+/,'/').replace(/\\/+$/,'').replace(/\\.html$/,'').replace(/\\/index$/,'').toLowerCase()||'/';var h=Object.prototype.hasOwnProperty.call(m,p)?m[p]:p.indexOf('/apps/')===0?'':null;if(h!==null)location.replace('/'+location.search+(h||location.hash))}catch(e){}})()`

export default function NotFound() {
  return (
    <main className="col lost">
      <script id="moved" dangerouslySetInnerHTML={{ __html: REDIRECT }} />
      <h1>Not found</h1>
      <p className="mute">
        That page doesn’t exist. The whole site is one page now, so everything is on the{' '}
        {/* A full load out of a 404 is fine, and next/link would add a chunk to
            every page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="ul" href="/">
          home page
        </a>
        .
      </p>
    </main>
  )
}
