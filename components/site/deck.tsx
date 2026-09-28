'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { normalizePath, placeFor } from '@/lib/panes'
import { IN_MS, OUT_MS, REOPEN_MS, SWAP_MS } from '@/lib/motion'
import { tick } from '@/lib/sound'

type Phase = 'in' | 'open' | 'out' | 'swap' | 'reopen'
type Open = { key: string; node: React.ReactNode; phase: Phase }

/**
 * The home pane plus at most one pane to its right, for the current route.
 * A pane slides out to the right from behind the home pane and slides back to
 * close. Picking another page while one is open keeps the pane and swaps its
 * contents: the old text fades out and the new text drifts in.
 */
export function Deck({ home, children }: { home: React.ReactNode; children: React.ReactNode }) {
  const path = normalizePath(usePathname())
  const router = useRouter()
  const key = placeFor(path).key
  const [open, setOpen] = useState<Open | null>(() =>
    key ? { key, node: children, phase: 'in' } : null,
  )
  const openRef = useRef(open)
  openRef.current = open
  // The newest content for the current route. Next can deliver a route's
  // content after its path changes, and live data can refresh it later.
  const latest = useRef(children)
  latest.current = children
  const stageRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)

  // Route changes are the only thing that animates the pane.
  useEffect(() => {
    const cur = openRef.current
    // Replace the pending timer only when setting a new one. A re-run of this
    // effect for the same page (Strict Mode, Fast Refresh) must not cancel the
    // timer that brings the pane's text back.
    const next = (t: ReturnType<typeof setTimeout>) => {
      clearTimeout(timer.current)
      timer.current = t
    }
    const settle = (k: string, ms = IN_MS) =>
      setTimeout(() => setOpen((o) => (o && o.key === k ? { ...o, phase: 'open' } : o)), ms)

    if (first.current) {
      first.current = false
      if (cur) next(settle(cur.key))
      return
    }
    if (key) {
      const showing = cur && cur.phase !== 'out'
      if (showing && cur.key === key) {
        // Back to the page whose text was fading out: bring it straight back in.
        if (cur.phase === 'swap') {
          setOpen({ key, node: latest.current, phase: 'reopen' })
          next(settle(key, REOPEN_MS))
        }
        return
      }
      tick('open')
      if (showing) {
        // Another page is open: fade its text out, then bring the new text in.
        setOpen({ ...cur, phase: 'swap' })
        next(
          setTimeout(() => {
            setOpen({ key, node: latest.current, phase: 'reopen' })
            next(settle(key, REOPEN_MS))
          }, SWAP_MS),
        )
        return
      }
      setOpen({ key, node: latest.current, phase: 'in' })
      next(settle(key))
    } else if (cur && cur.phase !== 'out') {
      tick('close')
      const lost = !document.activeElement || document.activeElement === document.body
      if (lost || paneRef.current?.contains(document.activeElement)) {
        const row = document.querySelector<HTMLElement>(`.pane-home a[href="${cur.key}"]`)
        ;(row ?? document.querySelector<HTMLElement>('.pane-home .name a'))?.focus({
          preventScroll: true,
        })
      }
      setOpen({ ...cur, phase: 'out' })
      next(setTimeout(() => setOpen((o) => (o?.phase === 'out' ? null : o)), OUT_MS))
    }
  }, [key])

  // New content for the page already open replaces it in place, without animating.
  useEffect(() => {
    setOpen((o) => (o && o.key === key && o.node !== children ? { ...o, node: children } : o))
  }, [children, key])

  // Each page starts at its top. The pane element stays when pages switch, so
  // without this a long page's scroll position would carry over to a short one
  // and show empty space.
  const shownKey = open?.key
  useLayoutEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = 0
  }, [shownKey])

  // On phones the deck scrolls sideways: bring the open pane into view once
  // it exists, or go back to the home pane when it closes.
  const openKey = open && open.phase !== 'out' ? open.key : null
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || stage.scrollWidth <= stage.clientWidth) return
    const pane = paneRef.current
    if (openKey && pane) {
      // offsetLeft ignores the slide-in transform, so this is where the pane settles.
      const margin = parseFloat(getComputedStyle(pane).scrollMarginLeft) || 0
      stage.scrollTo({ left: pane.offsetLeft - margin, behavior: 'smooth' })
    } else if (!openKey) stage.scrollTo({ left: 0, behavior: 'smooth' })
  }, [openKey])

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
