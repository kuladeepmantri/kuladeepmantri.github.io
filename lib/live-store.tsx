'use client'

// One React context for everything time- or live-dependent in the browser:
// the build snapshot's repo data, newer commits from the browser refresh, and
// a single `now` that ticks every 30 s for the whole page.

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { RepoLive } from './live'
import { refresh } from './live-client'

type ClientLive = {
  builtAt: string
  repos: Record<string, RepoLive> | undefined
}

type Store = ClientLive & {
  now: number
  // False until the browser clock has replaced the build time. Anything that
  // shows a clock or a relative time stays hidden (class live-t) until then.
  ready: boolean
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

  useIsoLayoutEffect(() => {
    setNow(Date.now())
    setReady(true)
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const base = value.repos
    if (!base) return
    const run = () =>
      refresh(value.builtAt, base)
        .then((next) => {
          if (next) setRepos(next)
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
  }, [value.builtAt, value.repos])

  const store = useMemo(() => ({ ...value, repos, now, ready }), [value, repos, now, ready])
  return <LiveContext.Provider value={store}>{children}</LiveContext.Provider>
}

export function useLive(): Store {
  const s = useContext(LiveContext)
  if (!s) throw new Error('useLive outside LiveProvider')
  return s
}
