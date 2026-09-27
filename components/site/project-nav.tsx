'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { ProjectRef } from '@/app/signals'
import { orderProjects } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/** Previous and next project, in the same order as the Work list. Arrow keys too. */
export function ProjectNav({ slug, projects }: { slug: string; projects: ProjectRef[] }) {
  const { repos } = useLive()
  const router = useRouter()
  const list = orderProjects(projects, repos)
  const i = list.findIndex((p) => p.slug === slug)
  const prev = list[(i - 1 + list.length) % list.length]
  const next = list[(i + 1) % list.length]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      const t = e.target as HTMLElement | null
      if (t?.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft') router.push(`/apps/${prev.slug}`, { scroll: false })
      if (e.key === 'ArrowRight') router.push(`/apps/${next.slug}`, { scroll: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [router, prev.slug, next.slug])

  if (i < 0) return null
  return (
    <nav className="project-nav" aria-label="More projects">
      <Link href={`/apps/${prev.slug}`} scroll={false} rel="prev">
        <span>Previous</span>
        <span>← {prev.name}</span>
      </Link>
      <Link href={`/apps/${next.slug}`} scroll={false} rel="next">
        <span>Next</span>
        <span>{next.name} →</span>
      </Link>
    </nav>
  )
}
