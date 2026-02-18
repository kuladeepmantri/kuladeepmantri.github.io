'use client'
import { TextEffect } from '@/components/ui/text-effect'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/now', label: 'Now' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <Link href="/" className="font-medium text-black dark:text-white">
          Kuladeep Bhushan Mantri
        </Link>
        <TextEffect
          as="p"
          preset="fade"
          per="char"
          className="text-zinc-600 dark:text-zinc-500"
          delay={0.5}
        >
          Security Researcher
        </TextEffect>
      </div>

      <nav aria-label="Primary" className="flex items-center gap-3 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-zinc-950 dark:hover:text-zinc-50',
                isActive
                  ? 'text-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-500 dark:text-zinc-400',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
