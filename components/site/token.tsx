'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { normalizePath } from '@/lib/panes'

/** An underlined word in the sentence. Clicking the selected one goes home. */
export function Token({ href, children }: { href: string; children: React.ReactNode }) {
  const active = normalizePath(usePathname()) === href
  return (
    <Link
      href={active ? '/' : href}
      scroll={false}
      className="tk"
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}
