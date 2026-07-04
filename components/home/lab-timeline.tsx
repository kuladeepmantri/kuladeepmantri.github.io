'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Signal } from '@/app/signals'
import { STATE_LABEL } from '@/app/signals'

// Fractional year from an ISO date, so a bar can start mid-2023 and read true.
function toYear(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const days = new Date(y, (m ?? 1) - 1, d ?? 1).getTime()
  const start = new Date(y, 0, 1).getTime()
  const end = new Date(y + 1, 0, 1).getTime()
  return y + (days - start) / (end - start)
}

// A lab log drawn as time: every project as a duration bar across the years it
// ran, tinted by its own signal color. Names sit in a left gutter so nothing
// overflows at any width; the track carries the bars, gridlines, and axis.
// Reading top to bottom shows the whole body of work and where it overlapped.
export function LabTimeline({ signals }: { signals: Signal[] }) {
  const router = useRouter()
  const [active, setActive] = useState<string | null>(null)

  const { rows, ticks, min, span } = useMemo(() => {
    const withRange = signals.map((s) => ({
      s,
      start: toYear(s.dateFirst),
      end: Math.max(toYear(s.dateLast), toYear(s.dateFirst) + 0.08),
    }))
    const lo = Math.floor(Math.min(...withRange.map((r) => r.start)))
    const hi = Math.ceil(Math.max(...withRange.map((r) => r.end)))
    const years: number[] = []
    for (let y = lo; y <= hi; y++) years.push(y)
    const ordered = [...withRange].sort((a, b) => b.start - a.start)
    return { rows: ordered, ticks: years, min: lo, span: hi - lo }
  }, [signals])

  const pct = (year: number) => ((year - min) / span) * 100
  const current = rows.find((r) => r.s.id === active)?.s ?? null

  const live = signals.filter(
    (s) => s.link && !s.link.includes('github.com'),
  ).length
  const active_ = signals.filter((s) => s.state === 'active').length

  const on = (id: string) => () => setActive(id)
  const off = () => setActive(null)
  const open = (slug: string) => () => router.push(`/apps/${slug}`)

  return (
    <figure className="mx-auto w-full max-w-[1000px]">
      <div className="mb-3 flex items-baseline justify-between text-[11px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
        <span>the work, over time</span>
        <span>hover to read · click to open</span>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-5 sm:px-6">
        <div className="grid grid-cols-[76px_1fr] gap-x-3 sm:grid-cols-[130px_1fr] sm:gap-x-4">
          {/* Left gutter: project names, right-aligned toward their bars. */}
          <div className="space-y-1.5">
            {rows.map(({ s }) => {
              const isOn = active === s.id
              const dim = active !== null && !isOn
              return (
                <button
                  key={s.id}
                  type="button"
                  onMouseEnter={on(s.id)}
                  onMouseLeave={off}
                  onFocus={on(s.id)}
                  onBlur={off}
                  onClick={open(s.slug)}
                  aria-label={`${s.name}: ${s.tagline}`}
                  className="flex h-[26px] w-full items-center justify-end truncate text-right text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap outline-none transition-colors"
                  style={{
                    color: isOn ? s.accentColor : 'var(--text-secondary)',
                    opacity: dim ? 0.4 : 1,
                  }}
                >
                  <span className="truncate">{s.name.toLowerCase()}</span>
                </button>
              )
            })}
          </div>

          {/* Track: gridlines behind, bars, then the year axis. */}
          <div className="relative">
            <div className="relative space-y-1.5">
              {/* Year gridlines, spanning the bars only. */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {ticks.map((y) => (
                  <div
                    key={y}
                    className="absolute top-0 bottom-0 w-px bg-[var(--border)] opacity-60"
                    style={{ left: `${pct(y)}%` }}
                  />
                ))}
              </div>

              {rows.map(({ s, start, end }) => {
                const isOn = active === s.id
                const dim = active !== null && !isOn
                return (
                  <button
                    key={s.id}
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onMouseEnter={on(s.id)}
                    onMouseLeave={off}
                    onClick={open(s.slug)}
                    className="relative block h-[26px] w-full outline-none"
                  >
                    <span
                      className="absolute top-1/2 h-[14px] -translate-y-1/2 rounded-[3px] transition-all duration-200"
                      style={{
                        left: `${pct(start)}%`,
                        width: `${Math.max(pct(end) - pct(start), 1.5)}%`,
                        background: isOn
                          ? s.accentColor
                          : `color-mix(in oklch, ${s.accentColor} 30%, transparent)`,
                        borderLeft: `2px solid ${s.accentColor}`,
                        opacity: dim ? 0.3 : 1,
                        boxShadow: isOn
                          ? `0 0 0 1px color-mix(in oklch, ${s.accentColor} 60%, transparent)`
                          : 'none',
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Year axis */}
            <div className="relative mt-2.5 h-4 border-t border-[var(--border)]">
              {ticks.map((y) => (
                <span
                  key={y}
                  className="absolute top-1.5 -translate-x-1/2 text-[10px] tracking-[0.08em] text-[var(--text-muted)]"
                  style={{ left: `${pct(y)}%` }}
                >
                  {y}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Caption: reads the hovered project, or a default framing line. */}
      <figcaption
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-3 min-h-[2.75rem] text-[13.5px] leading-[1.6] text-[var(--text-secondary)]"
      >
        {current ? (
          <span>
            <span className="font-semibold text-[var(--text)]">
              {current.name}
            </span>
            <span className="mx-1.5 text-[var(--text-muted)]">·</span>
            {current.tagline.toLowerCase()}
            <span className="mx-1.5 text-[var(--text-muted)]">·</span>
            <span
              className="text-[11px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: current.accentColor }}
            >
              {STATE_LABEL[current.state].toLowerCase()}
            </span>
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">
            {rows.length} projects · {live} live · {active_} active
          </span>
        )}
      </figcaption>
    </figure>
  )
}
