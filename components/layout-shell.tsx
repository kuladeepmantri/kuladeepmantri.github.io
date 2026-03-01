'use client'

import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { CommandPalette } from '@/components/command-palette'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    })

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      {children}
      <CommandPalette open={cmdkOpen} setOpen={setCmdkOpen} />
    </>
  )
}
