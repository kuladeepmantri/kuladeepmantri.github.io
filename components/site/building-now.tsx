'use client'

import Link from 'next/link'
import type { ProjectRef } from '@/app/signals'
import { isFresh, isSkippedRepo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

// A project counts as "building now" while its last push is this recent.
const FRESH_DAYS = 45

/** The project I pushed to most recently, if that push is recent. */
export function BuildingNow({ projects }: { projects: ProjectRef[] }) {
  const { pushes, now } = useLive()
  const match = (repo: string) =>
    projects.find((p) => p.repos.some((r) => r.toLowerCase() === repo.toLowerCase()))
  const push = pushes?.find(
    (p) => !p.isPrivate && !!p.repo && !isSkippedRepo(p.repo) && !!match(p.repo),
  )
  const project = push?.repo ? match(push.repo) : undefined
  if (!push || !project || !isFresh(push.pushedAt, now, FRESH_DAYS))
    return <>Planning the next one</>
  return (
    <>
      <Link href={`/apps/${project.slug}`} scroll={false}>
        {project.name}
      </Link>
      , and planning the next one
    </>
  )
}
