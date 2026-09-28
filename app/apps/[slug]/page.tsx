import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import { notFound } from 'next/navigation'
import { PaneHead } from '@/components/site/pane-head'
import { ProjectActivity } from '@/components/site/project-activity'
import { LIVE } from '@/lib/generated/live'
import { monthYear } from '@/lib/live'
import { SIGNALS, findSignalBySlug, type Signal } from '../../signals'

export function generateStaticParams() {
  return SIGNALS.map((s) => ({ slug: s.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = findSignalBySlug((await params).slug)
  if (!s) return {}
  return pageMeta({ title: s.name, description: s.description, path: `/apps/${s.slug}` })
}

function isPublic(repo: string) {
  const r = LIVE.github?.repos[repo]
  return !!r && !r.isPrivate
}

/** The body text, with the collaborator's name linked. */
function Body({ s }: { s: Signal }) {
  const c = s.collaborator
  if (!c || !s.body.includes(c.name)) return <>{s.body}</>
  const [before, after] = s.body.split(c.name)
  return (
    <>
      {before}
      <a href={c.href}>{c.name}</a>
      {after}
    </>
  )
}

export default async function Project({ params }: Props) {
  const s = findSignalBySlug((await params).slug)
  if (!s) notFound()

  const repo = s.repos[0]
  const shown = repo && isPublic(repo)
  const links = [...s.links]
  if (s.sourceIfPublic && shown) links.push({ label: 'Source', href: `https://github.com/${repo}` })

  return (
    <article>
      <PaneHead title={s.name} />
      <p className="lead">{s.line}</p>
      <p className="muted">
        {shown ? repo : 'Private repo'} · {s.stateLabel}
      </p>
      <p>
        <Body s={s} />
      </p>
      {links.length > 0 && (
        <ul className="list">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label} ↗</a>
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
