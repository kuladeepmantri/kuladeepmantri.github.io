'use client'

import { THEME_COLORS as COLORS } from '@/lib/theme'

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const current =
      root.dataset.theme ??
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[next])
    try {
      localStorage.setItem('km-theme', next)
    } catch {
      // private mode: the choice lasts for this page only
    }
  }

  // Both labels render; CSS shows the one that matches the active theme, so
  // the server HTML is right before hydration.
  return (
    <button type="button" className="theme-toggle" onClick={toggle}>
      <span className="to-dark">Dark</span>
      <span className="to-light">Light</span>
    </button>
  )
}
