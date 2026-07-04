import type { CSSProperties, ReactNode } from 'react'

// Full-bleed band that breaks out of the reading column for wide visuals.
// The `w-screen ml-[calc(-50vw+50%)]` trick centers a viewport-wide block
// inside a normally-narrow parent. Theme-aware via CSS-var tokens.
// `max` sets the inner content width (design range: 900–1200px).
export function Band({
  hint,
  max = 1100,
  flush = false,
  children,
}: {
  hint?: string
  max?: number
  flush?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`my-12 ml-[calc(-50vw+50%)] w-screen overflow-x-hidden border-y border-[var(--border)] bg-[var(--bg-elevated)] ${
        flush ? 'py-0' : 'py-10 md:py-14'
      }`}
    >
      <div
        className="mx-auto px-4 md:px-8"
        style={{ maxWidth: max } satisfies CSSProperties}
      >
        {hint && (
          <div className="mb-5 text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {hint}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
