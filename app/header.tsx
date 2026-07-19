'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { SOCIAL_LINKS } from '@/app/signals'

const github = SOCIAL_LINKS.find((s) => s.label === 'GitHub')?.link ?? '#'

const NAV = [
  { href: '/now', label: 'notes', match: (p: string) => p.startsWith('/now') },
  { href: '/about', label: 'whoami', match: (p: string) => p.startsWith('/about') },
]

export function Header() {
  const pathname = usePathname() ?? '/'
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="mx-auto w-full max-w-reading px-5 pt-8 pb-8">
      <nav
        aria-label="Main navigation"
        style={{ fontFamily: 'var(--font-inter)' }}
        className="flex items-center gap-x-6 text-[14px]"
      >
        {/* Home / wordmark */}
        <Link
          href="/"
          aria-label="Home"
          className="py-2 -my-2 text-[15px] font-bold tracking-[-0.01em] text-[var(--text)] transition-colors hover:text-[color:var(--accent)]"
        >
          km
        </Link>

        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`py-2 -my-2 font-medium transition-colors hover:text-[var(--text)] ${
              item.match(pathname)
                ? 'text-[var(--text)]'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <a
          href={github}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 -my-2 font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          github
        </a>

        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </nav>
    </header>
  )
}
