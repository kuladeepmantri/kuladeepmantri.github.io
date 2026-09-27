'use client'

import type { ProjectRef } from '@/app/signals'
import { latestProject, shortAgo } from '@/lib/live'
import { useLive } from '@/lib/live-store'

export function LastPush({ projects }: { projects: ProjectRef[] }) {
  const { repos, now } = useLive()
  const latest = latestProject(projects, repos)
  return <span suppressHydrationWarning>{latest ? shortAgo(latest.commit.date, now) : 'None yet'}</span>
}
