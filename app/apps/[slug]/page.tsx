import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SIGNALS, findSignalBySlug } from '@/app/signals'
import { AppDetail } from '@/components/apps/app-detail'
import { KubereachExperience } from '@/components/apps/kubereach/KubereachExperience'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return SIGNALS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = findSignalBySlug(slug)

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
  const project = findSignalBySlug(slug)

  if (!project) {
    notFound()
  }

  // kubereach gets a dedicated immersive walkthrough; every other slug keeps
  // the standard text detail page.
  if (project.slug === 'kubereach') {
    return <KubereachExperience />
  }

  return <AppDetail app={project} />
}
