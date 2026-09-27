'use client'

import Link from 'next/link'
import type { ProjectRef } from '@/app/signals'
import { useLive } from '@/lib/live-store'

/** The public repo I last pushed to, linked to its project page when it has one. */
export function BuildingNow({ projects }: { projects: ProjectRef[] }) {
  const { pushes } = useLive()
  const push = pushes?.find((p) => !p.isPrivate && p.repo)
  if (!push?.repo) return <>Planning the next one</>
  const repo = push.repo.toLowerCase()
  const project = projects.find((p) => p.repos.some((r) => r.toLowerCase() === repo))
  const name = project?.name ?? push.repo.split('/')[1]
  return (
    <>
      {project ? (
        <Link href={`/apps/${project.slug}`} scroll={false}>
          {name}
        </Link>
      ) : (
        <a href={push.url ?? `https://github.com/${push.repo}`}>{name}</a>
      )}
      , and planning the next one
    </>
  )
}
