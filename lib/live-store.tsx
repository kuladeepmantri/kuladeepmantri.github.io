'use client'

// One React context for everything time- or live-dependent in the browser:
// the build snapshot's repo data, overrides from the browser refresh, and a
// single `now` that ticks every 30 s for the whole page.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { RepoLive } from './live'
import { refreshRepos } from './live-client'

export type ClientLive = {
  builtAt: string
  sha: string
  repos: Record<string, RepoLive> | undefined
  lastPostAt: string | null
}

type Store = ClientLive & { now: number }

const LiveContext = createContext<Store | null>(null)

export function LiveProvider({
  value,
  children,
}: {
  value: ClientLive
  children: React.ReactNode
}) {
  // First render uses the build time on both server and client so hydration
  // matches; the effect then switches to the real clock.
  const [now, setNow] = useState(() => Date.parse(value.builtAt))
  const [repos, setRepos] = useState(value.repos)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!value.repos) return
    const run = () =>
      refreshRepos(value.repos!).then((next) => {
        if (next) setRepos(next)
      })
    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [value.repos])

  const store = useMemo(() => ({ ...value, repos, now }), [value, repos, now])
  return <LiveContext.Provider value={store}>{children}</LiveContext.Provider>
}

export function useLive(): Store {
  const s = useContext(LiveContext)
  if (!s) throw new Error('useLive outside LiveProvider')
  return s
}

export function useNow(): number {
  return useLive().now
}
