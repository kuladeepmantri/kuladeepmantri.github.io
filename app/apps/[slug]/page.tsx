import { notFound } from 'next/navigation'
import { SIGNALS, findSignalBySlug } from '@/app/signals'

export function generateStaticParams() {
  return SIGNALS.map((s) => ({ slug: s.slug }))
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const signal = findSignalBySlug(slug)
  if (!signal) notFound()
  return <main>{signal.name}</main>
}
