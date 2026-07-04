'use client'

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'

const BINDINGS: { keys: string[]; desc: string }[] = [
  { keys: ['↓', '→', 'j', 'l'], desc: 'next link' },
  { keys: ['↑', '←', 'k', 'h'], desc: 'previous link' },
  { keys: ['↵'], desc: 'open / activate' },
  { keys: ['g', 'g'], desc: 'top of page' },
  { keys: ['G'], desc: 'bottom of page' },
  { keys: ['?'], desc: 'toggle this help' },
  { keys: ['esc'], desc: 'close this help' },
]

interface KeyboardHelpProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export function KeyboardHelp({ open, setOpen }: KeyboardHelpProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onToggle() {
      // Functional setter avoids stale-closure double-dispatch flicker.
      setOpen((prev) => !prev)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('toggle-help', onToggle)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('toggle-help', onToggle)
      document.removeEventListener('keydown', onKey)
    }
  }, [setOpen])

  // Focus the close button when opened so Escape always works and SR has a target
  useEffect(() => {
    if (open) closeButtonRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="fixed bottom-6 right-6 z-[9997] w-[280px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[11px] text-[var(--text-muted)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="mb-2 flex items-center justify-between text-[var(--text-secondary)]">
        <span className="uppercase tracking-[0.12em]">keyboard</span>
        <button
          ref={closeButtonRef}
          onClick={() => setOpen(false)}
          aria-label="Close keyboard shortcuts"
          className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          [×]
        </button>
      </div>
      <ul className="space-y-1.5">
        {BINDINGS.map(({ keys, desc }) => (
          <li key={desc} className="flex items-center justify-between gap-4">
            <span className="flex gap-1">
              {keys.map((k, i) => (
                <kbd
                  key={i}
                  className="inline-flex min-w-[20px] items-center justify-center rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 text-[10px] text-[var(--text-secondary)]"
                >
                  {k}
                </kbd>
              ))}
            </span>
            <span>{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
