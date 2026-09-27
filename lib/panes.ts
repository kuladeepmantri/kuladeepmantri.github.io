// Every route is a pane stacked to the right of the home pane. This maps a
// path to the pane it opens, the wall's palette, and whose activity it shows.

export type Place = {
  key: string | null // null on home: only the home pane is open
  palette: string
  heat: string | null // a key into the wall's activity sources, or none
}

export function normalizePath(path: string | null): string {
  if (!path) return '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function placeFor(path: string): Place {
  if (path.startsWith('/apps/')) {
    const slug = path.slice(6)
    return { key: path, palette: slug, heat: slug }
  }
  switch (path) {
    case '/about':
      return { key: path, palette: 'about', heat: null }
    case '/github':
      return { key: path, palette: 'github', heat: 'all' }
    case '/x':
      return { key: path, palette: 'x', heat: 'x' }
    case '/contact':
      return { key: path, palette: 'contact', heat: null }
    case '/':
    case '/now':
      return { key: null, palette: 'home', heat: 'all' }
    default:
      return { key: path, palette: 'contact', heat: null }
  }
}
