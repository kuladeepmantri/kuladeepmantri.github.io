import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import { notFound } from 'next/navigation'
import { PaneHead } from '@/components/site/pane-head'
import { ProjectActivity } from '@/components/site/project-activity'
import { LIVE } from '@/lib/generated/live'
import { monthYear, repoVisibility } from '@/lib/live'
import { SIGNALS, findSignalBySlug, splitBody, type Signal } from '../../signals'

export function generateStaticParams() {
  return SIGNALS.map((s) => ({ slug: s.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = findSignalBySlug((await params).slug)
  if (!s) return {}
  return pageMeta({
    title: `${s.name}: ${s.tagline}`,
    description: s.description,
    path: `/apps/${s.slug}`,
  })
}

/** The body text, with the collaborator's name linked. */
function Body({ s }: { s: Signal }) {
  const parts = splitBody(s)
  if (!parts || !s.collaborator) return <>{s.body}</>
  return (
    <>
      {parts.before}
      <a href={s.collaborator.href}>{s.collaborator.name}</a>
      {parts.after}
    </>
  )
}

export default async function Project({ params }: Props) {
  const s = findSignalBySlug((await params).slug)
  if (!s) notFound()

  const repo = s.repos[0]
  // Without GitHub data the repo is neither named nor called private.
  const seen = repo ? repoVisibility(repo, LIVE.github?.repos) : 'unknown'
  const links = [...s.links]
  if (s.sourceIfPublic && seen === 'public')
    links.push({ label: 'Source', href: `https://github.com/${repo}` })
  const where = seen === 'public' ? repo : seen === 'private' ? 'Private repo' : null

  return (
    <article>
      <PaneHead title={s.name} />
      <p className="lead">{s.line}</p>
      <p className="muted">
        {where ? `${where} · ${s.stateLabel}` : s.stateLabel}
      </p>
      <p>
        <Body s={s} />
      </p>
      {links.length > 0 && (
        <ul className="list">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>
                {l.label} <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <ProjectActivity
        repos={s.repos}
        stack={s.stack}
        started={monthYear(s.dateFirst)}
        dateLast={s.dateLast}
        quietNote={s.quietNote}
      />
    </article>
  )
}
