import Link from 'next/link'

/**
 * The pane's title with the close control beside it. The deck moves focus to
 * the title when a pane opens from the keyboard, and the skip link targets it.
 */
export function PaneHead({ title }: { title: string }) {
  return (
    <header className="pane-head">
      <h1 className="name" id="pane-title" tabIndex={-1}>
        {title}
      </h1>
      <Link href="/" scroll={false} className="close" aria-label={`Close ${title}`}>
        <CloseIcon />
      </Link>
    </header>
  )
}

/** A filled circle with the X cut out of it, so it keeps its X in forced colours. */
export function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1 7a6 6 0 1 0 12 0a6 6 0 1 0-12 0ZM9.97 8.98L8.98 9.97L7 7.99L5.02 9.97L4.03 8.98L6.01 7L4.03 5.02L5.02 4.03L7 6.01L8.98 4.03L9.97 5.02L7.99 7Z"
      />
    </svg>
  )
}
