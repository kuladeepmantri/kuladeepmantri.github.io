import Link from 'next/link'

/** The pane's title with the close control beside it. */
export function PaneHead({ title }: { title: string }) {
  return (
    <header className="pane-head">
      <h1 className="name">{title}</h1>
      <Link href="/" scroll={false} className="close" aria-label={`Close ${title}`}>
        <CloseIcon />
      </Link>
    </header>
  )
}

export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6" fill="currentColor" />
      <path
        d="M4.8 4.8l4.4 4.4M9.2 4.8l-4.4 4.4"
        stroke="var(--pane)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
