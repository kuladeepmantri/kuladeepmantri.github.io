'use client'

import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
]
  .map((sel) => `${sel}:not([aria-hidden="true"])`)
  .join(',')

/**
 * Site-wide keyboard navigation. All four arrow keys (plus vim h/j/k/l) move
 * focus between visible focusable elements in DOM order with wrap. Enter
 * activates (native behavior). `/` opens the command palette. `?` shows
 * keyboard help. `gg` top, `G` bottom.
 *
 * The hook short-circuits when the command palette is open (caller passes
 * `paletteOpen`) so cmdk's own list navigation owns the keys.
 *
 * Disabled on touch devices.
 */
export function useArrowNav(paletteOpen = false) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return

    function isTypingTarget(el: Element | null): boolean {
      if (!el) return false
      const tag = el.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
      if ((el as HTMLElement).isContentEditable) return true
      return false
    }

    function visibleFocusables(): HTMLElement[] {
      const all = Array.from(
        document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      return all.filter((el) => {
        if (el.offsetParent === null && el.tagName !== 'BODY') return false
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return false
        const style = window.getComputedStyle(el)
        if (style.visibility === 'hidden' || style.display === 'none') return false
        return true
      })
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scrollBehavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth'

    function move(dir: 1 | -1) {
      const items = visibleFocusables()
      if (items.length === 0) return
      const active = document.activeElement as HTMLElement | null
      const currentIndex = active ? items.indexOf(active) : -1
      let nextIndex: number
      if (currentIndex === -1) {
        nextIndex = dir === 1 ? 0 : items.length - 1
      } else {
        nextIndex = currentIndex + dir
        if (nextIndex < 0) nextIndex = items.length - 1
        if (nextIndex >= items.length) nextIndex = 0
      }
      const target = items[nextIndex]
      target.focus({ preventScroll: false })
      target.scrollIntoView({ block: 'nearest', behavior: scrollBehavior })
    }

    function onKeyDown(e: KeyboardEvent) {
      // Let cmdk own its keys when open
      if (paletteOpen) return
      if (isTypingTarget(document.activeElement)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
        case 'j':
        case 'l':
          e.preventDefault()
          move(1)
          break
        case 'ArrowUp':
        case 'ArrowLeft':
        case 'k':
        case 'h':
          e.preventDefault()
          move(-1)
          break
        case '/':
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('toggle-cmdk'))
          break
        case '?':
          e.preventDefault()
          document.dispatchEvent(new CustomEvent('toggle-help'))
          break
        case 'g': {
          const w = window as typeof window & { __kmGLast?: number }
          const now = Date.now()
          if (w.__kmGLast && now - w.__kmGLast < 500) {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: scrollBehavior })
            w.__kmGLast = undefined
          } else {
            w.__kmGLast = now
          }
          break
        }
        case 'G':
          e.preventDefault()
          window.scrollTo({ top: document.body.scrollHeight, behavior: scrollBehavior })
          break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const w = window as typeof window & { __kmGLast?: number }
      w.__kmGLast = undefined
    }
  }, [paletteOpen])
}
