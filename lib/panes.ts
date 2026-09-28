// Every route is a pane stacked to the right of the home pane. This maps a
// path to the pane it opens and the colours the page takes.

export type Place = {
  key: string | null // null on home: only the home pane is open
  palette: string
}

export function normalizePath(path: string | null): string {
  if (!path) return '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function placeFor(path: string): Place {
  if (path.startsWith('/apps/')) {
    const slug = path.slice(6)
    return { key: path, palette: slug }
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
      return { key: null, palette: 'home' }
    default:
      return { key: path, palette: 'contact' }
  }
}
