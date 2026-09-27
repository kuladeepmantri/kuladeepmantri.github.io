'use client'

import { useLive } from '@/lib/live-store'

export function BuiltLine() {
  const { sha } = useLive()
  return (
    <span>
      Built from {sha} · updates itself from GitHub and X
    </span>
  )
}
