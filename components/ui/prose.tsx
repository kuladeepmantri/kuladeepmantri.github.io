import type { ReactNode } from 'react'

// Long reading passages ride Inter while headings and labels stay in their own
// voices (Inter display, mono labels). Keeps the mono body aesthetic for the
// shell and uses a real reading face for paragraphs.
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ fontFamily: 'var(--font-inter)' }}
      className="max-w-[64ch] space-y-4 text-[15px] leading-[1.75] text-[var(--text-secondary)]"
    >
      {children}
    </div>
  )
}
