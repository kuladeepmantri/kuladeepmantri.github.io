const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Twelve bars, one per month, oldest first. Height is relative to the busiest month. */
export function Activity({ months, now }: { months: number[]; now: number }) {
  const max = Math.max(...months)
  if (!max) return null
  const d = new Date(now)
  const label = (i: number) => {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (months.length - 1 - i), 1))
    return MONTH.format(m)
  }
  const total = months.reduce((a, b) => a + b, 0)
  return (
    <span
      className="spark"
      role="img"
      aria-label={`${total} commits in the last 12 months`}
      suppressHydrationWarning
    >
      {months.map((n, i) => (
        <span
          key={i}
          className={n ? 'on' : undefined}
          style={{ height: `${n ? Math.max(18, (n / max) * 100) : 12}%` }}
          title={`${label(i)} · ${n} commit${n === 1 ? '' : 's'}`}
        />
      ))}
    </span>
  )
}
