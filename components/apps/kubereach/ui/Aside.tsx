import type { ReactNode } from 'react'

// Labelled callout (note / caveat / scope). Rune's Aside, re-tokened to the
// portfolio so it reads on light and dark.
export function Aside({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="my-6 border-y border-[var(--border)] py-4">
      <div className="mb-2 text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {label}
      </div>
      <div className="text-[14.5px] leading-[1.7] text-[var(--text-secondary)] [&_strong]:font-medium [&_strong]:text-[var(--text)]">
        {children}
      </div>
    </div>
  )
}
