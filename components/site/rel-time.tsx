'use client'

import { ago, clock, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/**
 * Class for anything that shows a clock or a relative time. The prerendered
 * HTML holds build-time values, so `.live-t` stays transparent until the
 * browser clock has taken over (`.is-ready`). `.live-clock` marks wall-clock
 * times, which stay hidden without JavaScript; relative times show anyway.
 */
export function liveClass(ready: boolean, wallClock = false): string {
  return `live-t${wallClock ? ' live-clock' : ''}${ready ? ' is-ready' : ''}`
}

/** A relative time that keeps ticking. */
export function RelTime({ iso, form = 'short' }: { iso: string; form?: 'short' | 'long' }) {
  const { now, ready } = useLive()
  return (
    <time dateTime={iso} className={liveClass(ready)} suppressHydrationWarning>
      {form === 'long' ? ago(iso, now) : shortAgo(iso, now)}
    </time>
  )
}

/** Local time in Michigan, e.g. "2:14 PM". */
export function Clock() {
  const { now, ready } = useLive()
  return (
    <span className={liveClass(ready, true)} suppressHydrationWarning>
      {clock(now)}
    </span>
  )
}
