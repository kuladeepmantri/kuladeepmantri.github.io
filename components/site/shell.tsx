import { SIGNALS, projectRefs } from '@/app/signals'
import { TIMEZONE } from '@/lib/constants'
import { allDays } from '@/lib/all-days'
import { LIVE } from '@/lib/generated/live'
import { LiveProvider } from '@/lib/live-store'
import { Deck } from './deck'
import { HomePane } from './home-pane'
import { Background } from './background'
import type { Source } from './wall'

const LOCAL_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE })

/** What the wall can light up: all of GitHub, each project, and my posts on X. */
function sources(): Record<string, Source> {
  const out: Record<string, Source> = {
    all: { days: allDays(), noun: ['contribution on GitHub', 'contributions on GitHub'] },
  }
  for (const s of SIGNALS) {
    const live = s.repos.map((r) => LIVE.github?.repos[r]).find((r) => r && !r.isPrivate)
    out[s.slug] = {
      days: live?.days ?? [],
      noun: [`commit to ${s.name}`, `commits to ${s.name}`],
    }
  }
  const posts = new Map<string, number>()
  for (const p of LIVE.x?.posts ?? []) {
    const d = LOCAL_DAY.format(new Date(p.createdAt))
    posts.set(d, (posts.get(d) ?? 0) + 1)
  }
  out.x = { days: [...posts.entries()], noun: ['post on X', 'posts on X'] }
  return out
}

/**
 * The site: the wall behind everything, the home pane, and one pane for the
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
      <Background sources={sources()} builtAt={LIVE.builtAt} />
      <Deck home={<HomePane projects={projectRefs()} />}>{children}</Deck>
    </LiveProvider>
  )
}
