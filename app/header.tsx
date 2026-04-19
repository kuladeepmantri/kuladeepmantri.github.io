'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isApps = pathname?.startsWith('/apps') ?? false

  return (
    <header className="mx-auto w-full max-w-[680px] px-5 pt-8 pb-8">
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-x-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
      >
        <Link
          href="/"
          aria-label="Home"
          className={`transition-colors hover:text-[var(--text)] ${
            isHome ? 'text-[var(--text)]' : ''
          }`}
        >
          km
        </Link>
        <Link
          href="/apps"
          className={`transition-colors hover:text-[var(--text)] ${
            isApps ? 'text-[var(--text)]' : ''
          }`}
        >
          index
        </Link>
        <button
          onClick={() =>
            document.dispatchEvent(new CustomEvent('toggle-cmdk'))
          }
          className="ml-auto transition-colors hover:text-[var(--text)]"
          aria-label="Search (⌘K)"
        >
          [search]
        </button>
      </nav>
    </header>
  )
}
