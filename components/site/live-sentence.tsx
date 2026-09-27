'use client'

import type { ProjectRef } from '@/app/signals'
import { ago, clock, latestProject, mood, olderThan, type Push } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { Token } from './token'

type Target = { at: string; node: React.ReactNode }

/** Whatever I last committed to: a project page, a public repo, or "a private repo". */
function lastPushTarget(
  pushes: Push[] | undefined,
  projects: ProjectRef[],
  fallback: ReturnType<typeof latestProject>,
): Target | null {
  const push = pushes?.[0]
  if (push) {
    if (push.isPrivate || !push.repo) return { at: push.pushedAt, node: 'a private repo' }
    const repo = push.repo.toLowerCase()
    const project = projects.find((p) => p.repos.some((r) => r.toLowerCase() === repo))
    if (project)
      return { at: push.pushedAt, node: <Token href={`/apps/${project.slug}`}>{project.name}</Token> }
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
  const { repos, pushes, lastPostAt, now } = useLive()
  const target = lastPushTarget(pushes, projects, latestProject(projects, repos))
  const time = <Token href="/contact">{clock(now)}</Token>
  const x = <Token href="/x">X</Token>
  const github = <Token href="/github">GitHub</Token>

  const lead = target ? (
    <>
      I {olderThan(target.at, now, 30) ? 'last pushed' : 'pushed'} to {target.node} on {github}{' '}
      {ago(target.at, now)}
      {lastPostAt && (
        <>
          , posted on {x} {ago(lastPostAt, now)}
        </>
      )}
    </>
  ) : (
    <>
      I build in the open on {github}, post on {x}
    </>
  )

  return (
    <p className="sentence s2" suppressHydrationWarning>
      {lead}, and it’s {time} here, so {mood(now)}.
    </p>
  )
}
