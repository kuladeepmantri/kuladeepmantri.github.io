'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ANOMALY } from '@/app/apps/rune/content'

// Ported from Rune's own site and re-tokened to the portfolio palette. Draws
// catalyst temperature over a window; the highlighted stretch is an anomaly the
// HalfSpaceTrees model catches. The slider moves the detection threshold.
export function AnomalyChart() {
  const [threshold, setThreshold] = useState(65)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cssVar = useCallback((name: string) => {
    if (typeof window === 'undefined') return ''
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const mid = h * 0.5
    const threshY = h * (1 - threshold / 100) * 0.7 + h * 0.15

    const ink = cssVar('--text') || '#e8e8e8'
    const tint = cssVar('--signal-color') || cssVar('--accent') || '#e06a5a'
    const faint = `color-mix(in oklch, ${ink} 10%, transparent)`
    const line = `color-mix(in oklch, ${ink} 22%, transparent)`
    // Canvas can't resolve CSS custom properties in its font string, so read the
    // mono stack out of the cascade first (else labels fall back to generic mono).
    const mono = cssVar('--font-mono') || 'ui-monospace, monospace'

    ctx.clearRect(0, 0, w, h)

    // Baseline
    ctx.setLineDash([4, 6])
    ctx.strokeStyle = faint
    ctx.beginPath()
    ctx.moveTo(0, mid)
    ctx.lineTo(w, mid)
    ctx.stroke()
    ctx.setLineDash([])

    // Threshold line
    ctx.setLineDash([2, 4])
    ctx.strokeStyle = `color-mix(in oklch, ${tint} 45%, transparent)`
    ctx.beginPath()
    ctx.moveTo(0, threshY)
    ctx.lineTo(w, threshY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.font = `9px ${mono}`
    ctx.fillStyle = `color-mix(in oklch, ${tint} 60%, transparent)`
    ctx.textAlign = 'right'
    ctx.fillText('threshold', w - 8, threshY - 6)

    ctx.fillStyle = faint
    ctx.fillText('baseline', w - 8, mid - 6)

    // Anomaly region
    const anomalyStart = w * 0.58
    const anomalyEnd = w * 0.78
    ctx.fillStyle = `color-mix(in oklch, ${tint} 6%, transparent)`
    ctx.fillRect(anomalyStart, 0, anomalyEnd - anomalyStart, h)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = `color-mix(in oklch, ${tint} 20%, transparent)`
    ctx.beginPath()
    ctx.moveTo(anomalyStart, 0)
    ctx.lineTo(anomalyStart, h)
    ctx.moveTo(anomalyEnd, 0)
    ctx.lineTo(anomalyEnd, h)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.textAlign = 'left'
    ctx.fillStyle = `color-mix(in oklch, ${tint} 80%, transparent)`
    ctx.fillText('anomaly detected', anomalyStart + 12, 16)

    ctx.fillStyle = `color-mix(in oklch, ${ink} 30%, transparent)`
    ctx.fillText('normal operation', w * 0.25, mid - 16)

    // Waveform, segmented so above-threshold parts take the tint
    ctx.lineWidth = 1.5
    const defaultColor = line
    const aboveColor = tint
    let currentColor = defaultColor
    ctx.beginPath()
    ctx.strokeStyle = currentColor

    for (let x = 0; x < w; x++) {
      const t = x / w
      let y = mid
      if (t < 0.55) {
        y = mid + Math.sin(t * 30) * 4 + Math.sin(t * 17) * 3 + Math.cos(t * 45) * 2
      } else if (t < 0.8) {
        const intensity = (t - 0.55) / 0.25
        y =
          mid +
          Math.sin(t * 30) * (4 + intensity * 35) +
          Math.sin(t * 47) * (3 + intensity * 20) +
          Math.cos(t * 71) * (2 + intensity * 15)
      } else {
        const recovery = (t - 0.8) / 0.2
        const damping = 1 - recovery
        y = mid + Math.sin(t * 30) * (4 + damping * 20) + Math.sin(t * 17) * 3
      }

      const nextColor = y < threshY ? aboveColor : defaultColor
      if (nextColor !== currentColor && x > 0) {
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.strokeStyle = nextColor
        currentColor = nextColor
      } else if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
  }, [threshold, cssVar])

  useEffect(() => {
    draw()
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw])

  return (
    <div className="mx-auto max-w-[720px]">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Catalyst temperature over a ten-minute window; the highlighted stretch is an anomaly the model flags as conversion efficiency drops."
        className="h-[200px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg)]"
      />
      <div className="mt-4 flex items-center gap-4">
        <label
          htmlFor="rune-threshold"
          className="shrink-0 text-[11px] text-[var(--text-muted)]"
        >
          Sensitivity
        </label>
        <input
          id="rune-threshold"
          type="range"
          min={20}
          max={90}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="h-0.5 flex-1 cursor-pointer appearance-none rounded-sm bg-[var(--border-hover)] outline-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--signal-color,var(--accent))]"
        />
        <span className="min-w-[36px] text-right text-[12px] tabular-nums text-[var(--text-secondary)]">
          {(threshold / 100).toFixed(2)}
        </span>
      </div>
      <p
        style={{ fontFamily: 'var(--font-inter)' }}
        className="mt-4 text-[13px] leading-relaxed text-[var(--text-muted)]"
      >
        {ANOMALY.intro}
      </p>
    </div>
  )
}
