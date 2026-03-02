import type { Metadata } from 'next'
import { PROJECTS } from '@/app/data'
import { AppCard } from '@/components/apps/app-card'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Projects and tools built by Kuladeep Mantri.',
}

export default function AppsPage() {
  const personal = PROJECTS.filter((p) => p.status === 'personal')
  const building = PROJECTS.filter((p) => p.status === 'building')
  const live = PROJECTS.filter((p) => p.status === 'live')

  return (
    <div className="pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-6">
        <h1 className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
          Projects
        </h1>
        <div className="mb-12" />

        {/* Personal Use */}
        {personal.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Personal Use
            </h2>
            <div className="space-y-4">
              {personal.map((app, i) => (
                <AppCard
                  key={app.id}
                  app={app}
                  index={i}
                  variant="featured"
                />
              ))}
            </div>
          </section>
        )}

        {/* Currently Building */}
        {building.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Currently Building
            </h2>
            <div className="space-y-4">
              {building.map((app, i) => (
                <AppCard
                  key={app.id}
                  app={app}
                  index={i}
                  variant="featured"
                />
              ))}
            </div>
          </section>
        )}

        {/* Live */}
        {live.length > 0 && (
          <section>
            <h2 className="mb-6 text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Live
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {live.map((app, i) => (
                <AppCard
                  key={app.id}
                  app={app}
                  index={i}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
