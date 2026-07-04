import type { Signal } from '@/app/signals'
import { SignalEntry } from './signal-entry'

// The project index as a plate section: each project is a small schematic figure
// rather than a row of text. Open on the page (no panel box) so it reads as an
// editorial figure spread, aligned to the timeline above by shared language.
export function SignalLog({ signals }: { signals: Signal[] }) {
  return (
    <section aria-label="Projects" className="mt-20">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[11px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
        <span>every project</span>
        <span>newest first</span>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
        {signals.map((signal) => (
          <SignalEntry key={signal.id} signal={signal} />
        ))}
      </div>
    </section>
  )
}
