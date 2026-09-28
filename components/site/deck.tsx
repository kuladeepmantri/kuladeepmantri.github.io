'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { emit, takeOrigin } from '@/lib/bus'
import { normalizePath, placeFor } from '@/lib/panes'
import { IN_MS, OUT_MS, REOPEN_MS, SWAP_MS } from '@/lib/motion'
import { tick } from '@/lib/sound'

type Phase = 'in' | 'open' | 'out' | 'swap' | 'reopen'
type Open = { key: string; node: React.ReactNode; phase: Phase; y: number | null }


/**
 * The home pane plus at most one pane to its right, for the current route.
 * A pane opens out of the row that was clicked: a line at that row's height
 * runs across, then unfolds up and down into the pane. Closing folds it back
 * into the same line. Picking another row while a pane is open pinches the
 * pane into that row's line and unfolds the new page from it.
 */
export function Deck({ home, children }: { home: React.ReactNode; children: React.ReactNode }) {
  const path = normalizePath(usePathname())
  const router = useRouter()
  const key = placeFor(path).key
  const [open, setOpen] = useState<Open | null>(() =>
    key ? { key, node: children, phase: 'in', y: null } : null,
  )
  const openRef = useRef(open)
  openRef.current = open
  const stageRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)

  useEffect(() => {
    clearTimeout(timer.current)
    const cur = openRef.current
    const settle = (k: string, ms = IN_MS) =>
      setTimeout(() => setOpen((o) => (o && o.key === k ? { ...o, phase: 'open' } : o)), ms)

    if (first.current) {
      first.current = false
      if (cur) timer.current = settle(cur.key)
      return
    }
    const from = takeOrigin()
    if (from) emit('open', from)
    if (key) {
      if (cur && cur.phase !== 'out') {
        tick('open')
        const y = from?.y ?? cur.y
        const node = children
        setOpen({ ...cur, phase: 'swap', y })
        timer.current = setTimeout(() => {
          setOpen({ key, node, phase: 'reopen', y })
          timer.current = settle(key, REOPEN_MS)
        }, SWAP_MS)
        return
      }
      tick('open')
      setOpen({ key, node: children, phase: 'in', y: from?.y ?? null })
      timer.current = settle(key)
    } else if (cur && cur.phase !== 'out') {
      tick('close')
      setOpen({ ...cur, phase: 'out' })
      timer.current = setTimeout(() => setOpen((o) => (o?.phase === 'out' ? null : o)), OUT_MS)
    }
  }, [key, children])

  // On phones the deck scrolls sideways: bring the open pane into view once
  // it exists, or go back to the home pane when it closes.
  const openKey = open && open.phase !== 'out' ? open.key : null
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || stage.scrollWidth <= stage.clientWidth) return
    if (openKey && paneRef.current)
      paneRef.current.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' })
    else if (!openKey) stage.scrollTo({ left: 0, behavior: 'smooth' })
  }, [openKey])

  useEffect(() => {
    if (!key) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/', { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, router])

  // Where the pane unfolds from, relative to its own box.
  const fold = (() => {
    if (!open || open.y === null || typeof window === 'undefined') return undefined
    const cell =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 18
    const top = cell
    const bottom = window.innerHeight - cell
    const y = Math.min(bottom - 2, Math.max(top + 2, open.y))
    return { '--ft': `${y - top}px`, '--fb': `${bottom - y}px` } as React.CSSProperties
  })()

  return (
    <div className="stage" ref={stageRef}>
      <div className="deck">
        <section
          className="pane pane-home"
          data-pane
          data-phase="open"
          aria-label="Kuladeep Mantri"
        >
          {home}
        </section>
        {open && (
          <section
            ref={paneRef}
            className="pane pane-page"
            data-pane
            data-phase={open.phase}
            style={fold}
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
