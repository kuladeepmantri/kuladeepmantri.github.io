'use client'
import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as Theme
    if (current === 'light' || current === 'dark') setTheme(current)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('km-theme', next) } catch {}
  }

  return { theme, toggleTheme }
}
