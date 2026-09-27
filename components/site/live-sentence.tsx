'use client'

import type { ProjectRef } from '@/app/signals'
import { ago, clock, latestProject, type Push } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { Token } from './token'

type Target = { at: string; node: React.ReactNode }

/** The public repo I last committed to: its project page when it has one. */
function lastPushTarget(
  pushes: Push[] | undefined,
  projects: ProjectRef[],
  fallback: ReturnType<typeof latestProject>,
): Target | null {
  const push = pushes?.find((p) => !p.isPrivate && p.repo)
  if (push?.repo) {
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

  // "My last commit went to evalcore on GitHub on Jul 22, my last post to X
  // 4 days ago, and it's 4:09 PM here." Each clause drops out without data.
  const parts: React.ReactNode[] = []
  if (target)
    parts.push(
      <>
        My last commit went to {target.node} on {github} {ago(target.at, now)}
      </>,
    )
  if (lastPostAt)
    parts.push(
      target ? (
        <>
          my last post to {x} {ago(lastPostAt, now)}
        </>
      ) : (
        <>
          My last post went to {x} {ago(lastPostAt, now)}
        </>
      ),
    )
  const clockPart = parts.length ? <>and it’s {time} here.</> : <>It’s {time} here.</>

  return (
    <p className="sentence s2" suppressHydrationWarning>
      {parts.map((p, i) => (
        <span key={i}>
          {p},{' '}
        </span>
      ))}
      {clockPart}
    </p>
  )
}
