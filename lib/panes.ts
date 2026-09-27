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
