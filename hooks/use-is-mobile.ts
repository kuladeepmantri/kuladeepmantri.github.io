'use client'

import { useEffect, useState } from 'react'

/**
 * Media-query hook. Returns true while the viewport is below `breakpoint`
 * pixels (default 640, matching Tailwind's `sm`). Safe across SSR — starts
 * false, then reconciles on mount.
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
