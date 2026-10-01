import { EMAIL, GITHUB_USER, INSTAGRAM, SIGNALS, X_HANDLE, featuredSignal } from '@/app/signals'
import { About } from '@/components/home/about'
import { Elsewhere, type XView } from '@/components/home/elsewhere'
import { Footer } from '@/components/home/footer'
import { Portrait } from '@/components/home/portrait'
import { Projects } from '@/components/home/projects'
import { Slider, type ReleaseView } from '@/components/home/slider'
import { LIVE } from '@/lib/generated/live'
import {
  burstSentence,
  githubStats,
  isGithubUrl,
  latestRelease,
  pagePosts,
  repoRows,
  year,
  type Post,
} from '@/lib/live'
import { LiveProvider } from '@/lib/live-store'
import { postText } from '@/lib/x-text'

// The whole site. Everything below the header comes from app/signals.ts and
// the build's live snapshot (scripts/fetch-live.ts); nothing here is typed in.

const clean = (p: Post): Post => ({ ...p, text: postText(p.text) })

function releaseView(): ReleaseView | null {
  const r = latestRelease(SIGNALS, LIVE.github?.repos)
  if (!r) return null
  return {
    name: r.project,
    tag: r.release.tag,
    url: isGithubUrl(r.release.url) ? r.release.url : `https://github.com/${r.repo}/releases`,
    publishedAt: r.release.publishedAt,
    burst: r.burst && burstSentence(r.burst),
    language: r.live.language,
    stars: r.live.stars,
    forks: r.live.forks,
    license: r.live.license,
  }
}

export default function Home() {
  const repos = LIVE.github?.repos
  const posts = pagePosts(LIVE.x)
  const x: XView | null = LIVE.x && {
    name: LIVE.x.name || 'Kuladeep Mantri',
    handle: X_HANDLE,
    verified: !!LIVE.x.verified,
    pinnedId: posts.pinned?.id ?? null,
    posts: posts.list.map(clean),
  }

  return (
    <LiveProvider value={{ builtAt: LIVE.builtAt, repos }}>
      <div className="col" id="top">
        <header className="intro">
          <Portrait size={56} />
          <div>
            <h1>Kuladeep Mantri</h1>
            <p className="mute">Security Engineer in Michigan</p>
          </div>
        </header>
        <main>
          <Slider
            post={posts.latest && clean(posts.latest)}
            release={releaseView()}
            repos={SIGNALS.flatMap((s) => s.repos)}
          />
          <Projects signals={SIGNALS} repos={repos} />
          <Elsewhere
            x={x}
            stats={githubStats({
              featured: featuredSignal(),
              projects: SIGNALS,
              repos,
              languages: LIVE.github?.languages,
            })}
            repos={repoRows(SIGNALS, repos, LIVE.github?.pinned)}
          />
          <About />
        </main>
        <Footer
          email={EMAIL}
          year={year(LIVE.builtAt)}
          elsewhere={[
            { label: 'GitHub', href: `https://github.com/${GITHUB_USER}` },
            { label: 'X', href: `https://x.com/${X_HANDLE}` },
            { label: 'Instagram', href: INSTAGRAM.href },
          ]}
        />
      </div>
    </LiveProvider>
  )
}
