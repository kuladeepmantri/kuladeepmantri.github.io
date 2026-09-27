'use client'

import { ago } from '@/lib/live'
import { useLive } from '@/lib/live-store'

export function BuiltLine() {
  const { builtAt, sha, now } = useLive()
  return (
    <span suppressHydrationWarning>
      Rebuilt {ago(builtAt, now)} from {sha}
    </span>
  )
}
