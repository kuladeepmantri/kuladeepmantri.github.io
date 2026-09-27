import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
  return {
    title: s.name,
    description: s.description,
    alternates: { canonical: `/apps/${s.slug}` },
  }
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

export default async function ProjectPage({ params }: Props) {
  const s = findSignalBySlug((await params).slug)
  if (!s) notFound()

  const repo = s.repos[0]
  const shown = repo && isPublic(repo)
  const links = [...s.links]
  if (s.sourceIfPublic && shown) links.push({ label: 'Source', href: `https://github.com/${repo}` })

  return (
    <article className="p-body">
      <span className="p-meta">
        {shown ? repo : 'private repo'} · {s.stateLabel}
      </span>
      <h2 className="p-title">{s.name}</h2>
      <p className="p-lead">{s.line}</p>
      <p className="p-text">
        <Body s={s} />
      </p>
      <ProjectActivity
        repos={s.repos}
        stack={s.stack}
        started={monthYear(s.dateFirst)}
        dateLast={s.dateLast}
        quietNote={s.quietNote}
      />
      {links.length > 0 && (
        <div className="p-links">
          {links.map((l, i) => (
            <a key={l.href} href={l.href} className={i === 0 ? 'pill' : undefined}>
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  )
}
