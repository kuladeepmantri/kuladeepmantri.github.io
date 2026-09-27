'use client'

import { ago } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/** "Ordered by latest push · updated 12 minutes ago" over the Work list. */
export function UpdatedAt() {
  const { builtAt, now } = useLive()
  return (
    <span suppressHydrationWarning>
      Latest push first · updated {ago(builtAt, now)}
    </span>
  )
}
