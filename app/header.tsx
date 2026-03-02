'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  return (
    <motion.header
      className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
      animate={{
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -20,
      }}
      initial={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <nav
        className="flex items-center gap-1 rounded-full border border-[#ffffff18] bg-[#ffffff12] px-2 py-1.5 backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            pathname === '/'
              ? 'text-[var(--text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Home
        </Link>
        <Link
          href="/apps"
          className={`rounded-full px-3 py-1 text-sm transition-colors ${
            pathname?.startsWith('/apps')
              ? 'text-[var(--text)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Projects
        </Link>
        <button
          onClick={() =>
            document.dispatchEvent(new CustomEvent('toggle-cmdk'))
          }
          className="flex items-center rounded-full px-2 py-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </nav>
    </motion.header>
  )
}
