'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

// Inline hover-card: a word in the prose you can hover (or tap) to reveal a
// small floating panel below it. The panel renders in a portal on <body> so it
// escapes the per-paragraph transform stacking contexts (Reveal) that would
// otherwise paint later paragraphs on top of it.
function HoverCard({
  trigger,
  width = 180,
  children,
}: {
  trigger: ReactNode
  width?: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => setMounted(true), [])

  // While open, close on Escape or a click/tap outside the trigger and panel,
  // so keyboard and touch users are not stuck with a lingering card.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    function onDown(e: PointerEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || cardRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  function place() {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    // Clamp the card's center so its edges stay inside the viewport; otherwise a
    // word near the edge of the narrow reading column pushes the fixed-width card
    // off-screen and adds horizontal scroll (it is absolute on <body>).
    const half = width / 2
    const margin = 8
    const center = r.left + r.width / 2 + window.scrollX
    const min = window.scrollX + margin + half
    const max = window.scrollX + window.innerWidth - margin - half
    setPos({
      top: r.bottom + window.scrollY + 10,
      left: Math.min(Math.max(center, min), max),
    })
  }
  function show() {
    clearTimeout(hideTimer.current)
    place()
    setOpen(true)
  }
  function hide() {
    hideTimer.current = setTimeout(() => setOpen(false), 110)
  }

  return (
    <span className="inline" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        className="cursor-pointer font-medium text-[var(--text)] underline decoration-dotted decoration-[color:color-mix(in_oklch,var(--accent)_55%,var(--border))] underline-offset-[5px] transition-colors hover:decoration-[var(--accent)]"
      >
        {trigger}
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={cardRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  position: 'absolute',
                  top: pos.top,
                  left: pos.left - width / 2,
                  width,
                  zIndex: 90,
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2 shadow-[0_14px_44px_rgba(0,0,0,0.30)]"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  )
}

export function NameCard({ children }: { children: ReactNode }) {
  return (
    <HoverCard trigger={children} width={186}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/kuladeep.jpg"
        alt="Kuladeep Mantri"
        width={170}
        height={205}
        className="block h-[214px] w-full rounded-lg object-cover object-center"
      />
      <div
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-2 text-center text-[11px] tracking-[0.03em] text-[var(--text-muted)]"
      >
        somewhere up in the mountains
      </div>
    </HoverCard>
  )
}

const PLACES = {
  india: { name: 'Hyderabad, India', coords: '17.4°N · 78.5°E', pin: { x: 86, y: 46 } },
  us: { name: 'Michigan, USA', coords: '44.3°N · 85.6°W', pin: { x: 34, y: 41 } },
} as const

export function PlaceCard({
  place,
  children,
}: {
  place: keyof typeof PLACES
  children: ReactNode
}) {
  const info = PLACES[place]
  return (
    <HoverCard trigger={children} width={162}>
      <div className="px-1 pt-1 pb-2">
        <Globe pin={info.pin} />
        <div
          style={{ fontFamily: 'var(--font-inter)' }}
          className="mt-1 text-center text-[12px] font-medium text-[var(--text)]"
        >
          {info.name}
        </div>
        <div className="mt-0.5 text-center text-[10px] tracking-[0.05em] text-[var(--text-muted)]">
          {info.coords}
        </div>
      </div>
    </HoverCard>
  )
}

// A small wireframe globe with a pulsing pin. Not a literal country map, but a
// clean "here on Earth" motif that stays dependency-free and on-brand.
function Globe({ pin }: { pin: { x: number; y: number } }) {
  const s = 'color-mix(in oklch, var(--text-muted) 50%, transparent)'
  return (
    <svg viewBox="0 0 120 120" className="mx-auto block h-[118px] w-[118px]">
      <circle cx="60" cy="60" r="48" fill="none" stroke={s} strokeWidth="1" />
      <ellipse cx="60" cy="60" rx="48" ry="18" fill="none" stroke={s} strokeWidth="0.7" />
      <ellipse cx="60" cy="60" rx="48" ry="36" fill="none" stroke={s} strokeWidth="0.7" />
      <ellipse cx="60" cy="60" rx="18" ry="48" fill="none" stroke={s} strokeWidth="0.7" />
      <ellipse cx="60" cy="60" rx="36" ry="48" fill="none" stroke={s} strokeWidth="0.7" />
      <line x1="12" y1="60" x2="108" y2="60" stroke={s} strokeWidth="0.7" />
      <circle cx={pin.x} cy={pin.y} r="6" fill="none" stroke="var(--accent)" strokeWidth="1">
        <animate attributeName="r" values="4;10;4" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle cx={pin.x} cy={pin.y} r="3.4" fill="var(--accent)" />
    </svg>
  )
}
