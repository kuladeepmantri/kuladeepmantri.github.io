import type { ReactNode } from 'react'

// Labelled callout (note / caveat / scope), re-tokened to the site palette
// so it reads on light and dark.
export function AsideNote({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="my-8 border-l-2 border-[color:color-mix(in_oklch,var(--signal-color,var(--accent))_55%,var(--border))] pl-4">
      <div className="mb-1.5 text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
        {label}
      </div>
      <div className="text-[14.5px] leading-[1.7] text-[var(--text-secondary)] [&_strong]:font-medium [&_strong]:text-[var(--text)]">
        {children}
      </div>
    </div>
  )
}
