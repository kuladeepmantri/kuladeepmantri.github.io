// How each pane opens below the desktop breakpoint. Changing a value here is
// all it takes to move a route to another pattern.
export type PhonePattern = 'sheet' | 'push' | 'inline'

export const PHONE_PATTERN = {
  github: 'sheet',
  x: 'sheet',
  contact: 'sheet',
  about: 'push',
  project: 'push',
  notfound: 'inline',
} as const satisfies Record<string, PhonePattern>

export type PaneKind = keyof typeof PHONE_PATTERN | 'work'

export function normalizePath(path: string | null): string {
  if (!path) return '/'
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

export function paneKind(path: string): PaneKind {
  if (path === '/' || path === '/now') return 'work'
  if (path.startsWith('/apps/')) return 'project'
  if (path === '/about') return 'about'
  if (path === '/github') return 'github'
  if (path === '/x') return 'x'
  if (path === '/contact') return 'contact'
  return 'notfound'
}
