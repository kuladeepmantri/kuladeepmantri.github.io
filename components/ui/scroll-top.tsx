'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// A quiet return-to-top control for the standalone pages (home, notes, whoami).
// Project pages already return to top via the section-nav wordmark, so this
// hides on /apps/*. Fixed bottom-right, fades in after a bit of scrolling, and
// respects reduced-motion.
export function ScrollTop() {
  const pathname = usePathname() ?? '/'
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname.startsWith('/apps/')) return null

  const toTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={toTop}
      className={`fixed right-4 bottom-4 z-40 flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] px-3.5 text-[11px] tracking-[0.14em] text-[var(--text-muted)] uppercase backdrop-blur-md transition-all duration-300 hover:text-[var(--text)] ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <span aria-hidden>&uarr;</span> top
    </button>
  )
}
