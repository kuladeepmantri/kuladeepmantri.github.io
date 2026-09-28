'use client'

import type { ProjectRef } from '@/app/signals'
import { ago, clock, isSkippedRepo, latestProject, type Push } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import Link from 'next/link'
import { liveClass } from './rel-time'

type Target = { at: string; node: React.ReactNode }

function Token({
  href,
  label,
  children,
}: {
  href: string
  label?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} scroll={false} className="tk" aria-label={label}>
      {children}
    </Link>
  )
}

/** The public repo I last committed to: its project page when it has one. */
function lastPublicTarget(
  pushes: Push[] | undefined,
  projects: ProjectRef[],
  fallback: ReturnType<typeof latestProject>,
): Target | null {
  const push = pushes?.find((p) => !p.isPrivate && p.repo && !isSkippedRepo(p.repo))
  if (push?.repo) {
    const repo = push.repo.toLowerCase()
    const project = projects.find((p) => p.repos.some((r) => r.toLowerCase() === repo))
    if (project)
      return {
        at: push.pushedAt,
        node: <Token href={`/apps/${project.slug}`}>{project.name}</Token>,
      }
    return {
      at: push.pushedAt,
      node: (
        <a className="tk" href={push.url ?? `https://github.com/${push.repo}`}>
          {push.repo.split('/')[1]}
        </a>
      ),
    }
  }
  if (fallback) {
    const { project, commit } = fallback
    return {
      at: commit.date,
      node: <Token href={`/apps/${project.slug}`}>{project.name}</Token>,
    }
  }
  return null
}

/** Sentence two: built from the latest push, the latest post, and the clock. */
export function LiveSentence({ projects }: { projects: ProjectRef[] }) {
  const { repos, pushes, lastPostAt, now, ready } = useLive()
  const target = lastPublicTarget(pushes, projects, latestProject(projects, repos))
  const newest = pushes?.[0]
  // A private repo is named only as "a private repo", and only when it is newer.
  const privateAt =
    newest?.isPrivate && (!target || Date.parse(newest.pushedAt) > Date.parse(target.at))
      ? newest.pushedAt
      : null
  // Relative times and the clock carry build-time values until hydration.
  const when = (iso: string) => <span className={liveClass(ready)}>{ago(iso, now)}</span>
  const x = <Token href="/x">X</Token>
  const github = <Token href="/github">GitHub</Token>

  // "My last commit on GitHub went to evalcore on Jul 22, my last post to X
  // 4 days ago, and it's 4:09 PM here." Each clause drops out without data.
  const parts: React.ReactNode[] = []
  if (privateAt)
    parts.push(
      <>
        My last commit on {github} went to a private repo {when(privateAt)}
        {target && (
          <>
            , the last public one to {target.node} {when(target.at)}
          </>
        )}
      </>,
    )
  else if (target)
    parts.push(
      <>
        My last commit on {github} went to {target.node} {when(target.at)}
      </>,
    )
  if (lastPostAt)
    parts.push(
      parts.length ? (
        <>
          my last post to {x} {when(lastPostAt)}
        </>
      ) : (
        <>
          My last post went to {x} {when(lastPostAt)}
        </>
      ),
    )

  // The clock clause, with its lead-in comma, is one unit: without JavaScript
  // it stays hidden and the sentence still reads.
  const time = (
    <Token href="/contact" label={`${clock(now)} in Michigan, contact`}>
      {clock(now)}
    </Token>
  )
  return (
    <p className="sentence s2" suppressHydrationWarning>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ', '}
          {p}
        </span>
      ))}
      <span className={liveClass(ready, true)}>
        {parts.length ? <>, and it’s {time} here</> : <>It’s {time} here</>}
      </span>
      .
    </p>
  )
}
