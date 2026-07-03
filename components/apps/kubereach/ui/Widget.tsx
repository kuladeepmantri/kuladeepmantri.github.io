import type { ReactNode } from 'react'

// Full-bleed band that breaks out of the reading column for wide visuals.
// The `w-screen ml-[calc(-50vw+50%)]` trick centers a viewport-wide block
// inside a normally-narrow parent. Theme-aware via CSS-var tokens.
export function Widget({
  hint,
  children,
}: {
  hint: string
  children: ReactNode
}) {
  return (
    <div className="my-12 ml-[calc(-50vw+50%)] w-screen overflow-x-hidden border-y border-[var(--border)] bg-[var(--bg-elevated)] py-10 md:py-14">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8">
        <div className="mb-5 text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
          {hint}
        </div>
        {children}
      </div>
    </div>
  )
}
