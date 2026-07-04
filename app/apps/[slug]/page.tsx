import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SIGNALS, findSignalBySlug } from '@/app/signals'
import { AppDetail } from '@/components/apps/app-detail'
import { KubereachExperience } from '@/components/apps/kubereach/KubereachExperience'
import { RuneExperience } from '@/components/apps/rune/RuneExperience'
import { AurisExperience } from '@/components/apps/auris/AurisExperience'
import { ShipcrewExperience } from '@/components/apps/shipcrew/ShipcrewExperience'
import { KintsugiExperience } from '@/components/apps/kintsugi/KintsugiExperience'
import { DeidExperience } from '@/components/apps/deid/DeidExperience'
import { UntilExperience } from '@/components/apps/untilithappens/UntilExperience'

// Slugs with a hand-built immersive page. Everything else falls back to the
// generic AppDetail until it gets its own treatment.
const IMMERSIVE: Record<string, () => React.ReactElement> = {
  kubereach: KubereachExperience,
  rune: RuneExperience,
  auris: AurisExperience,
  shipcrew: ShipcrewExperience,
  kintsugi: KintsugiExperience,
  deid: DeidExperience,
  untilithappens: UntilExperience,
}

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

  const Immersive = IMMERSIVE[project.slug]
  if (Immersive) {
    return <Immersive />
  }

  return <AppDetail app={project} />
}
