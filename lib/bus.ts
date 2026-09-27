// How the panes and the background talk to each other, without a shared
// React tree: a few window events, plus the point a pane was opened from.
//
//   km:open   { x, y }         the page is changing from this row (the background re-inks from it)
//   km:focus  { slug | null }  a project is hovered in the list (its hosts light up)
//   km:node   { slugs }        a host is hovered on the background (its rows light up)

export type Point = { x: number; y: number }

let origin: Point | null = null

/** Remember where the next pane opens from: the row that was clicked. */
export function setOrigin(p: Point) {
  origin = p
}

export function takeOrigin(): Point | null {
  const o = origin
  origin = null
  return o
}

export function emit<T>(name: 'open' | 'focus' | 'node', detail: T) {
  window.dispatchEvent(new CustomEvent(`km:${name}`, { detail }))
}

export function on<T>(name: 'open' | 'focus' | 'node', fn: (detail: T) => void) {
  const h = (e: Event) => fn((e as CustomEvent<T>).detail)
  window.addEventListener(`km:${name}`, h)
  return () => window.removeEventListener(`km:${name}`, h)
}
