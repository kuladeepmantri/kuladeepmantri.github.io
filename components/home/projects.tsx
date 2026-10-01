import type { Area, Signal } from '@/app/signals'
import { isGithubUrl, isPublicRepo, orderProjects, plural, type RepoLive } from '@/lib/live'
import { ArrowUpRight, Star } from './icons'

type Link = { label: string; href: string }

/** The project's links, plus a GitHub link when the build confirmed the repo is public. */
function linksFor(s: Signal, repos: Record<string, RepoLive> | undefined): Link[] {
  const out = [...s.links]
  const repo = s.sourceIfPublic ? s.repos.find((r) => isPublicRepo(r, repos)) : undefined
  if (repo) {
    const url = repos?.[repo]?.url
    out.push({ label: 'GitHub', href: isGithubUrl(url) ? url : `https://github.com/${repo}` })
  }
  return out
}

const AREAS: Area[] = ['security', 'ai', 'personal']

/**
 * An index of projects: a ruled list, the featured project first, then
 * security work, AI, and personal builds, each group ordered by my latest
 * commit. A row is one click target for its first link; the links under it
 * still work on their own.
 */
export function Projects({
  signals,
  repos,
}: {
  signals: Signal[]
  repos: Record<string, RepoLive> | undefined
}) {
  const featured = signals.find((s) => s.featured)
  const rest = AREAS.flatMap((area) =>
    orderProjects(
      signals.filter((s) => s !== featured && s.area === area),
      repos,
    ),
  )

  return (
    <section className="projects" id="projects" aria-labelledby="projects-title">
      <h2 id="projects-title">Projects</h2>
      <ol>
        {[...(featured ? [featured] : []), ...rest].map((s) => (
          <Row key={s.slug} s={s} repos={repos} lead={s === featured} />
        ))}
      </ol>
    </section>
  )
}

function Row({
  s,
  repos,
  lead,
}: {
  s: Signal
  repos: Record<string, RepoLive> | undefined
  lead: boolean
}) {
  const links = linksFor(s, repos)
  const repo = lead ? s.repos.find((r) => isPublicRepo(r, repos)) : undefined
  const live = repo ? repos?.[repo] : undefined
  const stars = live?.stars ?? null
  const tag = live?.releases[0]?.tag
  const collaborator = lead ? s.collaborator : undefined
  // The lead row's live facts, read as one line: "★ 16 · v0.7.5 · With …".
  const parts = [tag, collaborator && `With ${collaborator.name}`].filter((p): p is string => !!p)
  const facts = stars !== null || parts.length > 0
  const meta = facts || links.length > 0
  return (
    <li className={lead ? 'row lead' : 'row'} id={s.slug}>
      <div className="row-head">
        <h3>
          {links[0] ? (
            <a className="row-link" href={links[0].href}>
              {s.name}
            </a>
          ) : (
            s.name
          )}
        </h3>
        <span className="mono mute">
          {s.tech}
          {s.status && ` · ${s.status}`}
        </span>
      </div>
      <p className="mute">{s.summary}</p>
      {meta && (
        <div className="mono meta">
          {facts && (
            <span className="facts-line">
              {stars !== null && (
                <span className="star">
                  <Star />
                  {stars}
                  <span className="sr-only"> {plural(stars, 'star')}</span>
                </span>
              )}
              {parts.map((p, i) => (
                <span key={p}>
                  {(i > 0 || stars !== null) && ' · '}
                  {p}
                </span>
              ))}
            </span>
          )}
          {links.map((l) => (
            <a key={l.href} className="ul" href={l.href}>
              {l.label}
              <span className="sr-only">, {s.name}</span>
              <span className="arrow">
                <ArrowUpRight />
              </span>
            </a>
          ))}
        </div>
      )}
    </li>
  )
}
