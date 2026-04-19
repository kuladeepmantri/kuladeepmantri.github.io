import type { Signal } from '@/app/signals'
import { SignalEntry } from './signal-entry'

export function SignalLog({ signals }: { signals: Signal[] }) {
  const activeCount = signals.filter((s) => s.state === 'active').length
  const shippedCount = signals.filter((s) => s.state === 'shipped').length

  return (
    <section aria-label="Log" className="mt-8">
      <h2 className="sr-only">Log</h2>

      {/* Log column label row. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--border)] pb-3 text-[11.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        <span>
          #
          <span className="mx-2 opacity-50">·</span>
          id / started
          <span className="mx-2 opacity-50">·</span>
          entry
        </span>
        <span className="text-[var(--text-secondary)]">
          {signals.length} entries &middot; {activeCount} active &middot; {shippedCount} shipped
        </span>
      </div>

      {signals.map((signal, i) => (
        <SignalEntry
          key={signal.id}
          signal={signal}
          index={i}
          total={signals.length}
        />
      ))}
    </section>
  )
}
