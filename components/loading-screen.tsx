'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Warm the browser cache so the GLB is ready when Three.js requests it
    fetch('/models/accord.glb').catch(() => {})

    const FADE_MS = 500

    // Always dismiss after a fixed delay -- simple and reliable
    const fadeTimer = setTimeout(() => setFading(true), 800)
    const removeTimer = setTimeout(() => setVisible(false), 800 + FADE_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: `opacity ${500}ms ease`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes km-fade-up {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes km-line-expand {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        .km-monogram {
          animation: km-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
          font-family: var(--font-inter, Inter, system-ui, sans-serif);
          font-size: 2.5rem;
          font-weight: 300;
          letter-spacing: 0.25em;
          color: #f0f0f0;
          line-height: 1;
          user-select: none;
        }

        .km-line {
          animation: km-line-expand 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.45s both;
          margin-top: 14px;
          width: 32px;
          height: 1px;
          background: #a78bfa;
          transform-origin: center;
        }
      `}</style>

      <span className="km-monogram">KM</span>
      <div className="km-line" />
    </div>
  )
}
