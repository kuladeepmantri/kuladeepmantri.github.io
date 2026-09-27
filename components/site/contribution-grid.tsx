import type { LiveSnapshot } from '@/lib/live'

type Week = NonNullable<LiveSnapshot['github']>['weeks'][number]

const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Last 40 weeks (CSS trims to 30 on phones), one column per week. */
export function ContributionGrid({ weeks, total }: { weeks: Week[]; total: number }) {
  const shown = weeks.slice(-40)
  return (
    <div
      className="contrib"
      role="img"
      aria-label={`${total.toLocaleString('en-US')} contributions in the last year`}
    >
      {shown.map((w, i) => (
        <div className="week" key={w[0]?.date ?? i}>
          {w.map((d) => (
            <span
              key={d.date}
              className={`sq q${d.level}`}
              title={`${DAY.format(new Date(`${d.date}T12:00:00Z`))} · ${d.count} contribution${d.count === 1 ? '' : 's'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
