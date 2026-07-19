// A short statement of focus. Sits between the masthead and the timeline. One
// confident line, no hedging. Server component, quiet, matches the masthead.
export function Direction() {
  return (
    <section
      aria-label="Focus"
      className="border-b border-[var(--border)] pb-9"
    >
      <div className="text-[11px] tracking-[0.2em] text-[color:var(--accent)] uppercase">
        focus
      </div>

      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-4 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--text-secondary)]"
      >
        Right now my focus is the security of AI systems: keeping model weights
        and their training infrastructure secure, and monitoring agents at
        runtime, including multi-agent systems where the monitor is itself a
        model. It is where the security work and the AI work meet.
      </p>
    </section>
  )
}
