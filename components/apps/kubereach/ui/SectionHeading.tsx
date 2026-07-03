'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'motion/react'

// Numbered section break with a count-up on the index (Rune's move), retimed to
// the portfolio's tokens. Serif title; mono index label.
export function SectionHeading({
  number,
  title,
  id,
}: {
  number: string
  title: string
  id: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [display, setDisplay] = useState('00')

  useEffect(() => {
    if (!inView || !number) return
    const target = parseInt(number, 10)
    let current = 0
    const timer = setInterval(
      () => {
        current++
        setDisplay(String(current).padStart(2, '0'))
        if (current >= target) clearInterval(timer)
      },
      400 / Math.max(target, 1)
    )
    return () => clearInterval(timer)
  }, [inView, number])

  return (
    <div
      id={id}
      className="mt-20 mb-6 scroll-mt-24 border-t border-[var(--border)] pt-8"
    >
      <div
        ref={ref}
        className="mb-2 text-[11px] tracking-[0.2em] text-[var(--text-muted)]"
      >
        {display}
      </div>
      <h2
        style={{ fontFamily: 'var(--font-inter)' }}
        className="text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-[var(--text)] md:text-[32px]"
      >
        {title}
      </h2>
    </div>
  )
}
