'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { normalizePath } from '@/lib/panes'
import { ThemeToggle } from './theme-toggle'

const ITEMS = [
  { href: '/', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/x', label: 'X' },
  { href: '/github', label: 'GitHub' },
  { href: '/contact', label: 'Contact' },
]

export function TopNav() {
  const path = normalizePath(usePathname())
  const current = (href: string) =>
    href === '/' ? path === '/' || path === '/now' || path.startsWith('/apps/') : path === href
  return (
    <nav className="topnav" aria-label="Site">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          scroll={false}
          aria-current={current(i.href) ? 'page' : undefined}
        >
          {i.label}
        </Link>
      ))}
      <ThemeToggle />
    </nav>
  )
}
