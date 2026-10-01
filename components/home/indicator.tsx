'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Box = { x: number; w: number; settled: boolean }

/**
 * The selected option's box inside a segmented control, kept current as web
 * fonts load or the layout changes. Null until measured, so the selected
 * option keeps its own background until then (and without JavaScript).
 */
export function useIndicator(selected: () => HTMLElement | null | undefined, key: string) {
  const [box, setBox] = useState<Box | null>(null)
  // Placements in the first moments after mount (the initial one, a saved
  // choice applied after hydration, late fonts) appear in place; only later
  // changes, which come from the visitor, slide.
  const placed = useRef(false)
  useEffect(() => {
    const id = setTimeout(() => (placed.current = true), 400)
    return () => clearTimeout(id)
  }, [])
  // A layout effect, so a selection made during hydration (the theme switch
  // reading a saved choice) is measured before the browser paints.
  useLayoutEffect(() => {
    const el = selected()
    if (!el) return
    const settled = placed.current
    const measure = () => {
      const list = el.parentElement
      if (!list) return
      const r = el.getBoundingClientRect()
      const l = list.getBoundingClientRect()
      setBox({ x: r.left - l.left - list.clientLeft, w: r.width, settled })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // `selected` reads refs; `key` is what changes when the selection does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return box
}

/** The background that slides to the selected option. */
export function Indicator({ box }: { box: Box | null }) {
  if (!box) return null
  return (
    <span
      className={box.settled ? 'tab-ind' : 'tab-ind still'}
      aria-hidden="true"
      style={{ width: box.w, transform: `translateX(${box.x}px)` }}
    />
  )
}
