import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PROJECTS } from '@/app/data'
import { AppDetail } from '@/components/apps/app-detail'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = PROJECTS.find((p) => p.id === slug)

  if (!project) {
    return { title: 'Not Found' }
  }

  return {
    title: project.name,
    description: project.tagline,
  }
}

export default async function AppPage({ params }: Props) {
  const { slug } = await params
  const project = PROJECTS.find((p) => p.id === slug)

  if (!project) {
    notFound()
  }

  return (
    <div className="pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <AppDetail app={project} />
      </div>
    </div>
  )
}
