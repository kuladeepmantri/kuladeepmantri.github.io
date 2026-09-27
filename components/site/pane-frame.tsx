'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { PHONE_PATTERN, normalizePath, paneKind } from '@/lib/panes'

const PHONE_QUERY = '(max-width: 1023px)'

function subscribe(cb: () => void) {
  const m = matchMedia(PHONE_QUERY)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

function usePhone() {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(PHONE_QUERY).matches,
    () => false,
  )
}

/**
 * The right pane on desktop. Below 1024px the same children become a bottom
 * sheet, a push page, or an inline card, per PHONE_PATTERN.
 */
export function PaneFrame({
  titles,
  children,
}: {
  titles: Record<string, string>
  children: React.ReactNode
}) {
  const path = normalizePath(usePathname())
  const router = useRouter()
  const phone = usePhone()
  const kind = paneKind(path)
  const pattern = kind === 'work' ? undefined : PHONE_PATTERN[kind]
  const title = titles[path] ?? 'Not found'
  const open = kind !== 'work'
  const modal = phone && (pattern === 'sheet' || pattern === 'push')

  const colRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const trail = useRef<string[]>([])
  const trigger = useRef<HTMLElement | null>(null)

  // Track in-site history so closing can pop back instead of pushing '/'.
  useEffect(() => {
    trail.current.push(path)
    colRef.current?.scrollTo(0, 0)
    overlayRef.current?.scrollTo(0, 0)
  }, [path])

  const close = useCallback(() => {
    const t = trail.current
    if (t.length > 1 && t[t.length - 2] === '/') router.back()
    else router.push('/', { scroll: false })
  }, [router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Phone overlays: lock the page behind, move focus in, and give it back on close.
  useEffect(() => {
    if (!modal) return
    const active = document.activeElement
    trigger.current = active instanceof HTMLElement ? active : null
    overlayRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev
      const t = trigger.current
      if (t?.isConnected) t.focus({ preventScroll: true })
    }
  }, [modal, path])

  return (
    <main
      id="pane"
      ref={colRef}
      className="pane-col"
      data-kind={kind}
      data-pattern={pattern}
      tabIndex={-1}
    >
      <div className="pane-head">
        {open ? (
          <>
            <span className="crumb">
              <Link href="/" scroll={false} className="bk">
                Work
              </Link>
              <span aria-hidden="true">/</span>
              <span>{title}</span>
            </span>
            <Link href="/" scroll={false} className="bk">
              Close
            </Link>
          </>
        ) : (
          <>
            <span>Work</span>
            <span className="live-label">
              <span className="dot live" />
              Live from GitHub
            </span>
          </>
        )}
      </div>

      {open && (
        <button
          type="button"
          className="scrim"
          aria-label="Close"
          tabIndex={-1}
          onClick={close}
        />
      )}

      <div
        ref={overlayRef}
        className="overlay"
        role={modal ? 'dialog' : undefined}
        aria-modal={modal || undefined}
        aria-labelledby={modal ? 'pane-title' : undefined}
        tabIndex={modal ? -1 : undefined}
      >
        {open && (
          <>
            <div className="sheet-handle" aria-hidden="true">
              <span />
            </div>
            <div className="push-bar">
              <button type="button" className="icon-btn" onClick={close}>
                ← Back
              </button>
              <span id={pattern === 'push' ? 'pane-title' : undefined}>{title}</span>
              <span />
            </div>
            <div className="phone-head">
              <span className="lab" id={pattern === 'push' ? undefined : 'pane-title'}>
                {title}
              </span>
              <button type="button" className="icon-btn" aria-label="Close" onClick={close}>
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M2 2 L12 12 M12 2 L2 12"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </>
        )}
        <div className="pane" key={path}>
          {children}
        </div>
      </div>
    </main>
  )
}
