// Every route is a pane stacked to the right of the home pane. This maps a
// path to the pane it opens and the colours the page takes.

// SCENES is already in the client bundle (the scenery runs on every page);
// app/signals would add every project body to it.
import { SCENES } from '@/components/site/scenery/scenes'

export type Place = {
  key: string | null // null on home: only the home pane is open
  palette: string
}

// GitHub Pages also serves /index.html and /<page>.html, so those map to the
// same place as the clean URL.
export function normalizePath(path: string | null): string {
  if (!path) return '/'
  return (
    path
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '')
      .replace(/\/+$/, '') || '/'
  )
}

const PAGE_PALETTES = ['home', 'about', 'github', 'x', 'contact']

function isProjectPalette(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, slug) && !PAGE_PALETTES.includes(slug)
}

export function placeFor(path: string): Place {
  if (path.startsWith('/apps/')) {
    // Only a project with a scene gives its slug as the palette. Any other text
    // (a typo, 'constructor') is the 404 pane, with the 404 colours.
    const slug = path.slice(6)
    return { key: path, palette: isProjectPalette(slug) ? slug : 'contact' }
  }
  switch (path) {
    case '/about':
      return { key: path, palette: 'about' }
    case '/github':
      return { key: path, palette: 'github' }
    case '/x':
      return { key: path, palette: 'x' }
    case '/contact':
      return { key: path, palette: 'contact' }
    case '/':
    case '/now':
    case '/apps':
    case '/verify':
      return { key: null, palette: 'home' }
    default:
      return { key: path, palette: 'contact' }
  }
}
