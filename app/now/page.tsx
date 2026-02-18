import type { Metadata } from 'next'
import { NOW_ITEMS } from '@/app/data'

export const metadata: Metadata = {
  title: 'Now',
  description: 'Current experiments and tools I am actively building.',
}

export default function NowPage() {
  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Now
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Current experiments and tools I am actively building.
        </p>
      </section>

      <section className="space-y-4">
        {NOW_ITEMS.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {item.status}
              </span>
            </div>

            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              {item.summary}
            </p>

            <div className="flex flex-wrap gap-2">
              {item.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                >
                  {tool}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
