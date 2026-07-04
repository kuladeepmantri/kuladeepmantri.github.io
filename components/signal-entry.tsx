import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { Signal } from '@/app/signals'
import { STATE_LABEL } from '@/app/signals'
import { ProjectSchematic } from '@/components/home/project-schematics'

// One project as a figure plate: a small schematic of what it is, then its name,
// one line, and the ways in. No border, no ledger; the figure and whitespace do
// the separating. The signal color enters only as the one tinted stroke in the
// sketch (via --signal-color), so the grid stays calm instead of a row of dots.
export function SignalEntry({ signal }: { signal: Signal }) {
  const isLive = Boolean(signal.link && !signal.link.includes('github.com'))

  return (
    <article className="group">
      <Link
        href={`/apps/${signal.slug}`}
        aria-label={`Read about ${signal.name}`}
        className="block"
        style={{ '--signal-color': signal.accentColor } as CSSProperties}
      >
        <figure className="overflow-hidden rounded-md transition-transform duration-300 group-hover:-translate-y-0.5">
          <ProjectSchematic slug={signal.slug} />
        </figure>
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <Link
            href={`/apps/${signal.slug}`}
            style={{ fontFamily: 'var(--font-inter)' }}
            className="truncate text-[18px] font-semibold tracking-[-0.01em] text-[var(--text)] transition-colors group-hover:text-[color:var(--accent)]"
          >
            {signal.name}
          </Link>
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
            {STATE_LABEL[signal.state].toLowerCase()}
          </span>
        </div>
        <span className="shrink-0 text-[10.5px] tracking-[0.06em] text-[var(--text-muted)]">
          {signal.id}
        </span>
      </div>

      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-1.5 text-[14px] leading-[1.6] text-[var(--text-secondary)]"
      >
        {signal.tagline}
      </p>

      <div className="mt-3.5 flex items-center gap-x-5 text-[12px] font-semibold text-[var(--text-secondary)]">
        <Link
          href={`/apps/${signal.slug}`}
          className="inline-flex items-center gap-1 transition-colors hover:text-[var(--text)]"
        >
          read
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
        {isLive && (
          <a
            href={signal.link!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${signal.name} live`}
            className="inline-flex items-center gap-0.5 transition-colors hover:text-[var(--text)]"
          >
            live <span className="text-[var(--text-muted)]">&#8599;</span>
          </a>
        )}
        {signal.repos.length > 0 && (
          <a
            href={`https://github.com/${signal.repos[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${signal.name} source on GitHub`}
            className="inline-flex items-center gap-0.5 transition-colors hover:text-[var(--text)]"
          >
            source <span className="text-[var(--text-muted)]">&#8599;</span>
          </a>
        )}
      </div>
    </article>
  )
}
