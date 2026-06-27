import Link from 'next/link'
import type { Signal } from '@/app/signals'
import { STATE_LABEL } from '@/app/signals'
import { formatSignalDate } from '@/lib/format-date'
import { activitySummary } from '@/lib/github'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max).trimEnd() + '\u2026'
}

export function SignalEntry({
  signal,
  index,
  total,
}: {
  signal: Signal
  index: number
  total: number
}) {
  const activity = activitySummary(signal.repos[0])
  // 1-based row number, zero-padded so two-digit columns align like a ledger.
  const pad = String(total).length
  const rowNo = String(index + 1).padStart(pad, '0')

  return (
    <article
      data-signal-id={signal.id}
      data-index={index}
      className="signal-entry group grid grid-cols-[auto_auto_1fr] gap-x-5 border-b border-[var(--border)] py-8 last:border-b-0"
    >
      {/* Row number — signature "log file" gutter. */}
      <div
        aria-hidden
        className="select-none pt-0.5 text-[12px] font-semibold leading-[1.4] text-[var(--text-muted)]"
      >
        {rowNo}
      </div>

      {/* Metadata column: ID, started date, activity */}
      <div className="min-w-[130px] text-[13px] leading-[1.7] text-[var(--text-muted)]">
        <div className="font-semibold text-[var(--text-secondary)]">{signal.id}</div>
        <div>started {formatSignalDate(signal.dateFirst)}</div>
        {activity && (
          <div
            className="mt-1.5 text-[11.5px] leading-[1.4] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]"
          >
            {activity}
          </div>
        )}
      </div>

      {/* Right column: title, description, actions */}
      <div className="min-w-0">
        {/* Title line */}
        <div className="flex flex-wrap items-baseline gap-x-2 text-[16px]">
          <span className="font-semibold text-[var(--text)]">
            {signal.name}
          </span>
          <span
            data-state={signal.state}
            className="text-[11px] uppercase tracking-[0.1em]"
          >
            {STATE_LABEL[signal.state].toLowerCase()}
          </span>
        </div>

        {/* Tagline */}
        <p className="mt-1 text-[14.5px] text-[var(--text-secondary)]">
          {signal.tagline.toLowerCase()}
        </p>

        {/* Body preview */}
        <p className="mt-2.5 text-[14px] leading-[1.7] text-[var(--text-muted)]">
          {truncate(signal.description, 200)}
        </p>

        {/* Action row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-1 text-[13px] font-semibold text-[var(--text-secondary)]">
          <Link
            href={`/apps/${signal.slug}`}
            aria-label={`Read about ${signal.name}`}
            className="transition-colors hover:text-[var(--text)]"
          >
            [read]
          </Link>
          {signal.link && (
            <>
              <span className="opacity-50">·</span>
              <a
                href={signal.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${signal.name} live`}
                className="transition-colors hover:text-[var(--text)]"
              >
                [live]
              </a>
            </>
          )}
          {signal.repos.length > 0 && (
            <>
              <span className="opacity-50">·</span>
              <a
                href={`https://github.com/${signal.repos[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${signal.name} source on GitHub`}
                className="transition-colors hover:text-[var(--text)]"
              >
                [src]
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
