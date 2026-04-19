import type { Metadata } from 'next'
import Link from 'next/link'
import { sortedByStart } from '@/app/signals'
import { formatSignalDate } from '@/lib/format-date'

export const metadata: Metadata = {
  title: 'Now',
  description:
    'What Kuladeep Mantri is working on right now: active projects, current focus, recent activity.',
}

// Static as of the build: the three most recently touched signals with
// state !== archived are the current focus set.
export default function NowPage() {
  const signals = sortedByStart()
  const active = signals.filter((s) => s.state === 'active').slice(0, 3)
  const recentShipped = signals
    .filter((s) => s.state === 'shipped')
    .slice(0, 2)
  const latest = signals[0]
  const lastUpdate = latest ? formatSignalDate(latest.dateLast) : ''

  return (
    <div className="mx-auto max-w-[680px] px-5 pb-12">
      <header className="space-y-3 border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          <Link
            href="/"
            className="transition-colors hover:text-[var(--text)]"
          >
            kuladeepmantri.com
          </Link>
          <span aria-hidden>·</span>
          <span>now</span>
          <span aria-hidden>·</span>
          <span>as of {lastUpdate}</span>
        </div>
        <h1 className="text-[18px] font-semibold text-[var(--text)]">
          what i&rsquo;m on right now
        </h1>
      </header>

      <section className="mt-6 space-y-5 text-[15px] leading-[1.7] text-[var(--text-secondary)]">
        <p>
          I&rsquo;m splitting time between security research on ARM64
          (Auris: syscall tracing, ROP scanning) and a multi-agent dev
          experiment (ShipCrew: a Slack-shaped interface for running
          Claude agents in parallel against sandboxed Docker workspaces).
        </p>
        <p>
          On the side I&rsquo;m keeping Rune running in my car. It logs
          OBD-II data from the armrest Pi and streams health analysis to a
          dash-mounted phone. I add a new sensor or a new forecasting
          layer whenever the drive gets boring.
        </p>
        <p>
          Everything here is maintained by me, alone, on purpose. This
          page is updated manually. If it hasn&rsquo;t changed in a while,
          check the{' '}
          <Link
            href="/"
            className="underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
          >
            log
          </Link>{' '}
          for dated activity.
        </p>
      </section>

      {active.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            active
          </h2>
          <ul className="space-y-2 text-[14px] text-[var(--text-secondary)]">
            {active.map((s) => (
              <li key={s.id} className="flex items-baseline gap-x-3">
                <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {s.id}
                </span>
                <Link
                  href={`/apps/${s.slug}`}
                  className="transition-colors hover:text-[var(--text)]"
                >
                  <span className="text-[var(--text)]">{s.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {' '}
                    : {s.tagline.toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentShipped.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
            recently shipped
          </h2>
          <ul className="space-y-2 text-[14px] text-[var(--text-secondary)]">
            {recentShipped.map((s) => (
              <li key={s.id} className="flex items-baseline gap-x-3">
                <span className="font-[var(--font-mono)] text-[12px] text-[var(--text-muted)]">
                  {s.id}
                </span>
                <Link
                  href={`/apps/${s.slug}`}
                  className="transition-colors hover:text-[var(--text)]"
                >
                  <span className="text-[var(--text)]">{s.name}</span>
                  <span className="text-[var(--text-muted)]">
                    {' '}
                    : {s.tagline.toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-[12px] text-[var(--text-muted)]">
        format inspired by{' '}
        <a
          href="https://sive.rs/nowff"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
        >
          derek sivers&rsquo; /now movement
        </a>
        .
      </p>
    </div>
  )
}
