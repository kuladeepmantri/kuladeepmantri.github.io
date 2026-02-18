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
    <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <Link
          href="/"
          className="block max-w-[18rem] text-base font-medium leading-tight text-black dark:text-white sm:max-w-none sm:text-lg"
        >
          Kuladeep Bhushan Mantri
        </Link>
        <TextEffect
          as="p"
          preset="fade"
          per="char"
          className="text-sm text-zinc-600 dark:text-zinc-500 sm:text-base"
          delay={0.5}
        >
          Security Researcher
        </TextEffect>
      </div>

      <nav
        aria-label="Primary"
        className="flex flex-wrap items-center gap-2 text-sm sm:justify-end"
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-3 py-1 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50',
                isActive
                  ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
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
