'use client'

import { THEME_COLORS as COLORS } from '@/lib/theme'

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.dataset.theme === 'light' ? 'dark' : 'light'
    if (next === 'light') root.dataset.theme = 'light'
    else delete root.dataset.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[next])
    try {
      localStorage.setItem('km-theme', next)
    } catch {
      // private mode: the choice lasts for this page only
    }
  }

  // Both icons render; CSS shows the one that matches the active theme, so the
  // server HTML is right before hydration.
  return (
    <button type="button" className="theme-toggle" onClick={toggle}>
      <svg className="to-dark" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20.3 14.6A8.5 8.5 0 0 1 9.4 3.7a.6.6 0 0 0-.8-.7 9.8 9.8 0 1 0 12.4 12.4.6.6 0 0 0-.7-.8Z"
        />
      </svg>
      <svg className="to-light" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <path
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"
        />
      </svg>
      <span className="sr-only">Switch theme</span>
    </button>
  )
}
