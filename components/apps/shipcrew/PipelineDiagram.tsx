'use client'

import { PIPELINE } from '@/app/apps/shipcrew/content'

// A message flowing through the routing pipeline: your message -> router ->
// executor (Claude Agent SDK) -> streamed back. Wide + portrait variants.

function Field({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <>
      <defs>
        <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.5" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill={`url(#${id})`} />
    </>
  )
}

export function PipelineDiagram() {
  const W = 176
  const gap = (960 - W * 4) / 3
  const y = 70
  const h = 76
  return (
    <>
      <svg viewBox="0 0 960 220" className="hidden h-auto w-full md:block" role="img" aria-label="A message flows through the router and executor and streams back.">
        <Field id="sc-grid" w={960} h={220} />
        {PIPELINE.map((n, i) => {
          const x = i * (W + gap)
          const cx = x + W
          const nextX = (i + 1) * (W + gap)
          return (
            <g key={n.key}>
              {i < PIPELINE.length - 1 && (
                <g>
                  <line x1={cx} y1={y + h / 2} x2={nextX} y2={y + h / 2} stroke="var(--border-hover)" />
                  <circle r="3.5" fill="var(--signal-color,var(--accent))">
                    <animateMotion dur="2.4s" begin={`${i * 0.6}s`} repeatCount="indefinite" path={`M ${cx} ${y + h / 2} L ${nextX} ${y + h / 2}`} />
                  </circle>
                </g>
              )}
              <rect x={x} y={y} width={W} height={h} rx="8" fill="var(--bg)" stroke="var(--border-hover)" />
              <text x={x + 16} y={y + 32} fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="14" fontWeight="600">{n.label}</text>
              <text x={x + 16} y={y + 54} fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">{n.sub}</text>
            </g>
          )
        })}
      </svg>

      <svg viewBox="0 0 360 540" className="mx-auto block h-auto w-full max-w-[340px] md:hidden" role="img" aria-label="A message flows through the router and executor and streams back.">
        <Field id="sc-grid-p" w={360} h={540} />
        {PIPELINE.map((n, i) => {
          const x = 40, w = 280, hh = 76, gg = 48
          const yy = i * (hh + gg) + 10
          const cy = yy + hh
          const nextY = (i + 1) * (hh + gg) + 10
          return (
            <g key={n.key}>
              {i < PIPELINE.length - 1 && (
                <g>
                  <line x1={x + w / 2} y1={cy} x2={x + w / 2} y2={nextY} stroke="var(--border-hover)" />
                  <circle r="3.5" fill="var(--signal-color,var(--accent))">
                    <animateMotion dur="2.4s" begin={`${i * 0.6}s`} repeatCount="indefinite" path={`M ${x + w / 2} ${cy} L ${x + w / 2} ${nextY}`} />
                  </circle>
                </g>
              )}
              <rect x={x} y={yy} width={w} height={hh} rx="8" fill="var(--bg)" stroke="var(--border-hover)" />
              <text x={x + 18} y={yy + 32} fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="15" fontWeight="600">{n.label}</text>
              <text x={x + 18} y={yy + 54} fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="12">{n.sub}</text>
            </g>
          )
        })}
      </svg>
    </>
  )
}
