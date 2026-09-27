import { SIGNALS } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { LiveProvider } from '@/lib/live-store'
import { Intro } from './intro'
import { PaneFrame } from './pane-frame'

const TITLES: Record<string, string> = {
  '/about': 'About',
  '/github': 'GitHub',
  '/x': 'X',
  '/contact': 'Contact',
  ...Object.fromEntries(SIGNALS.map((s) => [`/apps/${s.slug}`, s.name])),
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <LiveProvider
      value={{
        builtAt: LIVE.builtAt,
        sha: LIVE.sha,
        repos: LIVE.github?.repos,
        pushes: LIVE.github?.pushes,
        lastPostAt: LIVE.x?.posts[0]?.createdAt ?? null,
      }}
    >
      <a className="skip" href="#pane">
        Skip to content
      </a>
      <div className="site">
        <Intro />
        <PaneFrame titles={TITLES}>{children}</PaneFrame>
      </div>
    </LiveProvider>
  )
}
