'use client'

import { ago, clock, shortAgo } from '@/lib/live'
import { useNow } from '@/lib/live-store'

/** A relative time that keeps ticking. Renders the build-time value first. */
export function RelTime({ iso, form = 'short' }: { iso: string; form?: 'short' | 'long' }) {
  const now = useNow()
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {form === 'long' ? ago(iso, now) : shortAgo(iso, now)}
    </time>
  )
}

/** Local time in Michigan, e.g. "2:14 PM". */
export function Clock() {
  const now = useNow()
  return <span suppressHydrationWarning>{clock(now)}</span>
}
