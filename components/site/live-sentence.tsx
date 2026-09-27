'use client'

import type { ProjectRef } from '@/app/signals'
import { ago, clock, latestProject, mood, olderThan } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { Token } from './token'

/** Sentence two: built from the latest push, the latest post, and the clock. */
export function LiveSentence({ projects }: { projects: ProjectRef[] }) {
  const { repos, lastPostAt, now } = useLive()
  const latest = latestProject(projects, repos)
  const time = <Token href="/contact">{clock(now)}</Token>

  let lead: React.ReactNode
  if (!latest) {
    lead = (
      <>
        I build in the open on <Token href="/github">GitHub</Token>, post on{' '}
        <Token href="/x">X</Token>
      </>
    )
  } else {
    const { project, commit } = latest
    lead = (
      <>
        I {olderThan(commit.date, now, 30) ? 'last pushed' : 'pushed'} to{' '}
        <Token href={`/apps/${project.slug}`}>{project.name}</Token> on{' '}
        <Token href="/github">GitHub</Token> {ago(commit.date, now)}
        {lastPostAt && (
          <>
            , posted on <Token href="/x">X</Token> {ago(lastPostAt, now)}
          </>
        )}
      </>
    )
  }

  return (
    <p className="sentence s2" suppressHydrationWarning>
      {lead}, and it’s {time} here, so {mood(now)}.
    </p>
  )
}
