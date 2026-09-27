'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { normalizePath, placeFor } from '@/lib/panes'
import { tick } from '@/lib/sound'

type Open = { key: string; node: React.ReactNode; phase: 'in' | 'open' | 'out'; t0: number }

const IN_MS = 820
const OUT_MS = 620

/**
 * The home pane plus at most one pane to its right, for the current route.
 * Opening and closing are timed to the wall's tile wave: the pane's text
 * fades in once the tiles under it have turned, and fades out before they turn back.
 */
export function Deck({ home, children }: { home: React.ReactNode; children: React.ReactNode }) {
  const path = normalizePath(usePathname())
  const router = useRouter()
  const key = placeFor(path).key
  const [open, setOpen] = useState<Open | null>(() =>
    key ? { key, node: children, phase: 'in', t0: 0 } : null,
  )
  const [homeT0, setHomeT0] = useState(0)
  const openRef = useRef(open)
  openRef.current = open
  const stageRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)

  useEffect(() => {
    clearTimeout(timer.current)
    const now = performance.now()
    const cur = openRef.current
    const settle = (k: string) =>
      setTimeout(() => setOpen((o) => (o && o.key === k ? { ...o, phase: 'open' } : o)), IN_MS)

    if (first.current) {
      // First load: the home pane and any routed pane wave in together.
      first.current = false
      setHomeT0(now)
      if (cur) {
        setOpen({ ...cur, t0: now })
        timer.current = settle(cur.key)
      }
      return
    }
    if (key) {
      if (cur && cur.phase !== 'out') {
        // Already open: swap the content in place; the tiles stay.
        setOpen({ ...cur, key, node: children })
        return
      }
      tick('open')
      setOpen({ key, node: children, phase: 'in', t0: now })
      timer.current = settle(key)
    } else if (cur && cur.phase !== 'out') {
      tick('close')
      setOpen({ ...cur, phase: 'out', t0: now })
      timer.current = setTimeout(() => setOpen((o) => (o?.phase === 'out' ? null : o)), OUT_MS)
    }
  }, [key, children])

  // On phones the deck scrolls sideways: bring a newly opened pane into view.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (stage.scrollWidth <= stage.clientWidth) return
    const target = key ? stage.querySelector<HTMLElement>('[data-depth="1"]') : null
    if (target) target.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' })
    else stage.scrollTo({ left: 0, behavior: 'smooth' })
  }, [key])

  useEffect(() => {
    if (!key) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/', { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, router])

  return (
    <div className="stage" ref={stageRef}>
      <div className="deck">
        <section
          className="pane pane-home"
          data-pane
          data-depth="0"
          data-phase="in"
          data-t0={homeT0}
          aria-label="Kuladeep Mantri"
        >
          {home}
        </section>
        {open && (
          <section
            className="pane pane-page"
            data-pane
            data-depth="1"
            data-phase={open.phase}
            data-t0={open.t0}
            aria-live="polite"
          >
            <div className="pane-content" key={open.key}>
              {open.node}
            </div>
          </section>
        )}
        <div className="deck-end" aria-hidden="true" />
      </div>
    </div>
  )
}
