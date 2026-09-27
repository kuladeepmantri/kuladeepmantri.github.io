'use client'

import { ago } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/** "Updated 12 minutes ago" over the Work list. */
export function UpdatedAt() {
  const { builtAt, now } = useLive()
  return (
    <span suppressHydrationWarning>
      Updated {ago(builtAt, now)}
    </span>
  )
}
