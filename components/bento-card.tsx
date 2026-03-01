'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { cn } from '@/lib/utils'

type BentoCardProps = {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function BentoCard({ children, className, glowColor }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  const springX = useSpring(rotateX, { stiffness: 200, damping: 25 })
  const springY = useSpring(rotateY, { stiffness: 200, damping: 25 })

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    rotateX.set(-(y / (rect.height / 2)) * 6)
    rotateY.set((x / (rect.width / 2)) * 6)
  }

  function handleMouseLeave() {
    setIsHovered(false)
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]',
          'transition-all duration-300 hover:border-[var(--border-hover)]',
          className,
        )}
        style={{
          rotateX: springX,
          rotateY: springY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {/* Hover glow overlay */}
        {glowColor && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              boxShadow: `0 0 60px ${glowColor}25, inset 0 0 60px ${glowColor}08`,
            }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Subtle shimmer on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, transparent 30%, ${glowColor || '#ffffff'}06 50%, transparent 70%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </div>
  )
}
