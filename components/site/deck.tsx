'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { normalizePath, placeFor } from '@/lib/panes'
import { IN_MS, OUT_MS, REOPEN_MS } from '@/lib/motion'
import { tick } from '@/lib/sound'
import { isStill } from '@/lib/still'

type Phase = 'in' | 'open' | 'out' | 'reopen'
type Open = { key: string; node: React.ReactNode; phase: Phase }

/**
 * The home pane plus at most one pane to its right, for the current route.
 * A pane slides out to the right from behind the home pane and slides back to
 * close. Picking another page while one is open keeps the pane and remounts
 * its contents, so the new text drifts in.
 */
// The last input was a key press, not a pointer: decides where focus goes on close.
let keyboard = false
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => (keyboard = true), true)
  window.addEventListener('pointerdown', () => (keyboard = false), true)
}

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
  const stageRef = useRef<HTMLElement>(null)
  const paneRef = useRef<HTMLElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)
  const focusTitle = useRef(false)

  // Route changes are the only thing that animates the pane.
  useEffect(() => {
    const cur = openRef.current
    // Replace the pending timer only when setting a new one. A re-run of this
    // effect for the same page (Strict Mode, Fast Refresh) must not cancel the
    // timer that settles the pane.
    const next = (t: ReturnType<typeof setTimeout>) => {
      clearTimeout(timer.current)
      timer.current = t
    }
    const settle = (k: string, ms: number) =>
      setTimeout(() => setOpen((o) => (o && o.key === k ? { ...o, phase: 'open' } : o)), ms)

    if (first.current) {
      first.current = false
      if (cur) next(settle(cur.key, IN_MS))
      return
    }
    if (key) {
      const showing = cur && cur.phase !== 'out'
      if (showing && cur.key === key) return
      tick('open')
      // Opened from a row or a link in a pane: focus follows to the new title.
      const a = document.activeElement
      focusTitle.current = !!a && a !== document.body && !!stageRef.current?.contains(a)
      // Switching pages keeps the pane; its content remounts (key below) and drifts in.
      setOpen({ key, node: latest.current, phase: showing ? 'reopen' : 'in' })
      next(settle(key, showing ? REOPEN_MS : IN_MS))
    } else if (cur && cur.phase !== 'out') {
      tick('close')
      focusTitle.current = false
      const active = document.activeElement as HTMLElement | null
      const lost = !active || active === document.body
      if (lost || paneRef.current?.contains(active)) {
        // Keyboard users land back on the row they came from. After a tap or a
        // swipe, a moved focus ring would only show up as a stray outline.
        if (keyboard) {
          const row = document.querySelector<HTMLElement>(`.pane-home li a[href="${cur.key}"]`)
          ;(row ?? document.querySelector<HTMLElement>('.pane-home .name a'))?.focus({
            preventScroll: true,
          })
        } else active?.blur()
      }
      setOpen({ ...cur, phase: 'out' })
      next(setTimeout(() => setOpen((o) => (o?.phase === 'out' ? null : o)), OUT_MS))
    }
  }, [key])

  // New content for the page already open replaces it in place, without animating.
  useEffect(() => {
    setOpen((o) => (o && o.key === key && o.node !== children ? { ...o, node: children } : o))
  }, [children, key])

  // Move focus once the new pane's title exists (its content can arrive late).
  useEffect(() => {
    if (!focusTitle.current || !open || open.phase === 'out') return
    const title = paneRef.current?.querySelector<HTMLElement>('#pane-title')
    if (!title) return
    focusTitle.current = false
    title.focus({ preventScroll: true })
  }, [open])

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
  const place = (behavior: ScrollBehavior) => {
    const stage = stageRef.current
    if (!stage || stage.scrollWidth <= stage.clientWidth) return
    const pane = paneRef.current
    if (openKey && pane) {
      // offsetLeft ignores the slide-in transform, so this is where the pane settles.
      const margin = parseFloat(getComputedStyle(pane).scrollMarginLeft) || 0
      stage.scrollTo({ left: pane.offsetLeft - margin, behavior })
    } else if (!openKey) stage.scrollTo({ left: 0, behavior })
  }
  const placeRef = useRef(place)
  placeRef.current = place

  useEffect(() => {
    placeRef.current(isStill() ? 'instant' : 'smooth')
    // Rotating a phone or resizing across a breakpoint changes the snap
    // offsets; keep the same pane in view. Height-only resizes (browser bars)
    // are left alone so they never fight a swipe.
    let width = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      placeRef.current('instant')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [openKey])

  // Swiping back to the home pane on a phone closes the page pane, so the
  // address, the scene, and the active row match what's on screen.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !openKey) return
    let t: ReturnType<typeof setTimeout> | undefined
    // Only a scroll the visitor made counts, never the deck's own scrollTo.
    let user = false
    const touched = () => {
      user = true
    }
    const settled = () => {
      const pane = paneRef.current
      if (!user || !pane || openRef.current?.phase === 'out') return
      user = false
      if (pane.offsetLeft - stage.scrollLeft > stage.clientWidth - 48) {
        router.replace('/', { scroll: false })
      }
    }
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(settled, 150)
    }
    const type = 'onscrollend' in window ? 'scrollend' : 'scroll'
    const handler = type === 'scrollend' ? settled : onScroll
    stage.addEventListener(type, handler)
    stage.addEventListener('touchstart', touched, { passive: true })
    stage.addEventListener('wheel', touched, { passive: true })
    return () => {
      clearTimeout(t)
      stage.removeEventListener(type, handler)
      stage.removeEventListener('touchstart', touched)
      stage.removeEventListener('wheel', touched)
    }
  }, [openKey, router])

  useEffect(() => {
    if (!key) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/', { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, router])

  return (
    <main className="stage" ref={stageRef}>
      {openKey && (
        <a
          className="skip"
          href="#pane-title"
          onClick={(e) => {
            e.preventDefault()
            place('instant')
            document.getElementById('pane-title')?.focus({ preventScroll: true })
          }}
        >
          Skip to page
        </a>
      )}
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
            aria-labelledby="pane-title"
          >
            <div className="pane-content" key={open.key}>
              {open.node}
            </div>
          </section>
        )}
        <div className="deck-end" aria-hidden="true" />
      </div>
    </main>
  )
}
