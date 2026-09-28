// Whether the scenery holds still. The visitor's choice (the Motion switch in
// the home pane's footer) wins; otherwise it follows the system's reduced-motion
// setting. WCAG 2.2.2 asks for a way to pause anything that moves on its own.

const KEY = 'km-still'
const listeners = new Set<(still: boolean) => void>()

const systemReduce = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function isStill(): boolean {
  try {
    const v = localStorage.getItem(KEY)
    if (v === '1') return true
    if (v === '0') return false
  } catch {
    // storage blocked: fall back to the system setting
  }
  return systemReduce()
}

export function setStill(still: boolean) {
  try {
    localStorage.setItem(KEY, still ? '1' : '0')
  } catch {
    // the choice lasts for this page only
  }
  listeners.forEach((f) => f(still))
}

/** Calls `f` whenever the choice or the system setting changes. Returns an unsubscribe. */
export function onStill(f: (still: boolean) => void): () => void {
  listeners.add(f)
  const mq = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null
  const sys = () => f(isStill())
  mq?.addEventListener('change', sys)
  return () => {
    listeners.delete(f)
    mq?.removeEventListener('change', sys)
  }
}
