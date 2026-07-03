'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

// Fade-and-rise on scroll into view. Adapted from Rune's Reveal, but on the
// portfolio's `motion/react` (motion's successor package) instead of framer-motion.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={['kr-reveal', className].filter(Boolean).join(' ')}
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
    </motion.div>
  )
}
