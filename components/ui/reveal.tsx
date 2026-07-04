'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Fade-and-rise on scroll into view. The `km-reveal` class is the no-JS
// fallback hook in globals.css (forces visibility when scripting is off).
// `as` lets it render as a list item so it can sit directly inside <ol>/<ul>.
export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li'
}) {
  const reduce = useReducedMotion()
  const Comp = as === 'li' ? motion.li : motion.div

  return (
    <Comp
      className={['km-reveal', className].filter(Boolean).join(' ')}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: reduce ? 0 : 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        delay: reduce ? 0 : delay,
      }}
    >
      {children}
    </Comp>
  )
}
