import { projectRefs } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { LiveProvider } from '@/lib/live-store'
import { Deck } from './deck'
import { HomePane } from './home-pane'
import { TweetCard } from './tweet-card'
import { Scenery } from './scenery'

/**
 * The site: the scenery behind everything, the home pane, and one pane for the
 * current route. Route pages render only their pane's content.
 */
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
      <Scenery />
      <Deck home={<HomePane projects={projectRefs()} tweet={<TweetCard />} />}>{children}</Deck>
    </LiveProvider>
  )
}
