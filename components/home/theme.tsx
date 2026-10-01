'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { THEME_KEY } from '@/lib/constants'
import { Indicator, useIndicator } from './indicator'

// Follows the system unless the visitor picks Light or Dark. The choice lives
// in localStorage under THEME_KEY; app/layout.tsx applies it before first paint.

type Mode = 'system' | 'light' | 'dark'

const MODES: Mode[] = ['system', 'light', 'dark']
const LABEL: Record<Mode, string> = { system: 'System', light: 'Light', dark: 'Dark' }
// --bg in app/globals.css, for the browser's own bar.
const BG = { light: '#fdfdfc', dark: '#161615' }

function stored(): Mode {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function apply(mode: Mode) {
  const root = document.documentElement
  // A forced theme gets its own theme-color meta ahead of the per-scheme
  // ones React renders, which are never edited (React would add copies).
  let meta = document.getElementById('tc') as HTMLMetaElement | null
  if (mode === 'system') {
    root.removeAttribute('data-theme')
    meta?.remove()
    return
  }
  root.setAttribute('data-theme', mode)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.id = 'tc'
    document.head.prepend(meta)
  }
  meta.content = BG[mode]
}

export function ThemeSwitch() {
  const [mode, setMode] = useState<Mode>('system')
  const refs = useRef<Partial<Record<Mode, HTMLButtonElement | null>>>({})
  const box = useIndicator(() => refs.current[mode], mode)

  // A layout effect, so a saved Light or Dark is selected before the browser
  // paints the hydrated switch (effects never run in the prerender).
  useLayoutEffect(() => {
    const sync = () => {
      const m = stored()
      setMode(m)
      apply(m)
    }
    sync()
    // Another tab changed it.
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY || e.key === null) sync()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const choose = (m: Mode) => {
    setMode(m)
    apply(m)
    try {
      if (m === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, m)
    } catch {
      // still applied for this visit
    }
  }

  // Radio group keys: arrows move and select, wrapping at the ends.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = MODES[(MODES.indexOf(mode) + step + MODES.length) % MODES.length]
    choose(next)
    refs.current[next]?.focus()
  }

  return (
    <div
      className={box ? 'seglist theme measured' : 'seglist theme'}
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={onKeyDown}
    >
      <Indicator box={box} />
      {MODES.map((m) => (
        <button
          key={m}
          ref={(el) => {
            refs.current[m] = el
          }}
          type="button"
          className="seg"
          role="radio"
          aria-checked={mode === m}
          tabIndex={mode === m ? 0 : -1}
          onClick={() => choose(m)}
        >
          {LABEL[m]}
        </button>
      ))}
    </div>
  )
}
