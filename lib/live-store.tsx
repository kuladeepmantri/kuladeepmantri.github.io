'use client'

// One React context for everything time- or live-dependent in the browser:
// the build snapshot's repo data, overrides from the browser refresh, and a
// single `now` that ticks every 30 s for the whole page.

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Push, RepoLive } from './live'
import { refresh } from './live-client'

export type ClientLive = {
  builtAt: string
  repos: Record<string, RepoLive> | undefined
  pushes: Push[] | undefined
  lastPostAt: string | null
}

type Store = ClientLive & {
  now: number
  // False until the browser clock has replaced the build time. Anything that
  // shows a clock or a relative time stays hidden (class live-t) until then.
  ready: boolean
  // The build snapshot's repos, never refreshed. Orders lists that must not
  // reshuffle under a visitor's pointer.
  buildRepos: Record<string, RepoLive> | undefined
}

const LiveContext = createContext<Store | null>(null)

// Layout effects run before paint in the browser; on the server they would warn.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function LiveProvider({
  value,
  children,
}: {
  value: ClientLive
  children: React.ReactNode
}) {
  // First render uses the build time on both server and client so hydration
  // matches; the layout effect below switches to the real clock before the
  // hydrated page paints. The prerendered HTML still carries build-time
  // values, which is why time tokens wait for `ready`.
  const [now, setNow] = useState(() => Date.parse(value.builtAt))
  const [ready, setReady] = useState(false)
  const [repos, setRepos] = useState(value.repos)
  const [pushes, setPushes] = useState(value.pushes)

  useIsoLayoutEffect(() => {
    setNow(Date.now())
    setReady(true)
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!value.repos) return
    const run = () =>
      refresh(value.builtAt, value.repos!, value.pushes ?? [])
        .then((next) => {
          if (next.repos) setRepos(next.repos)
          if (next.pushes) setPushes(next.pushes)
        })
        .catch(() => {
          // keep the build snapshot
        })
    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [value.builtAt, value.repos, value.pushes])

  const store = useMemo(
    () => ({ ...value, repos, pushes, now, ready, buildRepos: value.repos }),
    [value, repos, pushes, now, ready],
  )
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
