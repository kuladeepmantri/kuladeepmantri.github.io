'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import Lenis from 'lenis'

// Lenis smooth-scroll, scoped to the page that mounts it. Respects
// reduced-motion by simply not initializing (native scroll takes over).
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      lerp: 0.12,
      smoothWheel: true,
      wheelMultiplier: 1,
      // Route in-page #section links through Lenis so the nav scrolls smoothly
      // instead of jumping and fighting the smooth-scroll loop.
      anchors: true,
    })
    lenisRef.current = lenis

    let frame = 0
    function raf(time: number) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
