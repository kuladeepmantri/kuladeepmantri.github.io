'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'motion/react'

// Poster-first lazy 3D mount. The sharp static poster paints immediately; the
// WebGL scene (passed as children, itself a next/dynamic ssr:false import so
// three.js stays out of the initial bundle) only mounts when:
//   - motion is allowed (reduced-motion keeps the static poster forever), AND
//   - the block has scrolled near the viewport (IntersectionObserver), AND
//   - on touch devices, the visitor taps to load (saves data + battery).
// This is the shared engine behind every project's 3D hero.
export function LazyScene({
  poster,
  alt,
  children,
  aspect = '16 / 10',
  className = '',
  rounded = true,
}: {
  poster: string
  alt: string
  children: ReactNode
  aspect?: string
  className?: string
  rounded?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [inView, setInView] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    setTouch(
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    )
  }, [])

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '250px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduce])

  const mount = !reduce && inView && (!touch || tapped)
  const showTap = touch && !reduce && !tapped

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-[#050505] ${
        rounded ? 'rounded-xl border border-[var(--border)]' : ''
      } ${className}`}
      style={{ aspectRatio: aspect }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {mount && <div className="absolute inset-0">{children}</div>}
      {showTap && (
        <button
          onClick={() => setTapped(true)}
          className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent pb-5 text-[11px] tracking-[0.2em] text-white/80 uppercase"
        >
          <span className="rounded-full border border-white/30 px-4 py-2 backdrop-blur-sm">
            tap to load 3D
          </span>
        </button>
      )}
    </div>
  )
}
