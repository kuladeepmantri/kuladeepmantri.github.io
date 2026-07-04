'use client'

import { DATA_PATH } from '@/app/apps/rune/content'

// Hand-authored wireframe of the data path: car -> Pi -> analysis -> phone.
// Two viewBoxes: a wide horizontal flow for desktop, a stacked vertical one for
// portrait/mobile. Mono labels, dot-grid field, the project tint for the moving
// signal. Reduced-motion is handled globally (animations collapse to 0ms).

const NODE = {
  w: 176,
  h: 74,
}

function DotGrid({ id }: { id: string }) {
  return (
    <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.5" />
    </pattern>
  )
}

function WideDiagram() {
  const gap = (900 - NODE.w * 4) / 3
  const y = 80
  return (
    <svg
      viewBox="0 0 900 240"
      className="hidden h-auto w-full md:block"
      role="img"
      aria-label="Data path: the car over OBD-II to a Raspberry Pi, through three analysis layers, to a phone on the dash."
    >
      <defs>
        <DotGrid id="rune-grid-wide" />
      </defs>
      <rect x="0" y="0" width="900" height="240" fill="url(#rune-grid-wide)" />

      {DATA_PATH.map((node, i) => {
        const x = i * (NODE.w + gap)
        const cx = x + NODE.w
        const nextX = (i + 1) * (NODE.w + gap)
        return (
          <g key={node.key}>
            {i < DATA_PATH.length - 1 && (
              <g>
                <line
                  x1={cx}
                  y1={y + NODE.h / 2}
                  x2={nextX}
                  y2={y + NODE.h / 2}
                  stroke="var(--border-hover)"
                  strokeWidth="1"
                />
                <circle r="3.5" fill="var(--signal-color, var(--accent))">
                  <animateMotion
                    dur="2.4s"
                    begin={`${i * 0.6}s`}
                    repeatCount="indefinite"
                    path={`M ${cx} ${y + NODE.h / 2} L ${nextX} ${y + NODE.h / 2}`}
                  />
                </circle>
              </g>
            )}
            <rect
              x={x}
              y={y}
              width={NODE.w}
              height={NODE.h}
              rx="8"
              fill="var(--bg)"
              stroke="var(--border-hover)"
              strokeWidth="1"
            />
            <text
              x={x + 16}
              y={y + 30}
              fill="var(--text)"
              style={{ fontFamily: 'var(--font-mono)' }}
              fontSize="14"
              fontWeight="600"
            >
              {node.label}
            </text>
            <text
              x={x + 16}
              y={y + 50}
              fill="var(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)' }}
              fontSize="11"
            >
              {node.sub}
            </text>
            <text
              x={x + 16}
              y={y - 14}
              fill="var(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)' }}
              fontSize="10"
              letterSpacing="0.2em"
            >
              {String(i + 1).padStart(2, '0')}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PortraitDiagram() {
  const x = 40
  const w = 280
  const h = 76
  const gap = 52
  return (
    <svg
      viewBox="0 0 360 560"
      className="mx-auto block h-auto w-full max-w-[340px] md:hidden"
      role="img"
      aria-label="Data path: the car over OBD-II to a Raspberry Pi, through three analysis layers, to a phone on the dash."
    >
      <defs>
        <DotGrid id="rune-grid-portrait" />
      </defs>
      <rect x="0" y="0" width="360" height="560" fill="url(#rune-grid-portrait)" />

      {DATA_PATH.map((node, i) => {
        const y = i * (h + gap) + 10
        const cy = y + h
        const nextY = (i + 1) * (h + gap) + 10
        return (
          <g key={node.key}>
            {i < DATA_PATH.length - 1 && (
              <g>
                <line
                  x1={x + w / 2}
                  y1={cy}
                  x2={x + w / 2}
                  y2={nextY}
                  stroke="var(--border-hover)"
                  strokeWidth="1"
                />
                <circle r="3.5" fill="var(--signal-color, var(--accent))">
                  <animateMotion
                    dur="2.4s"
                    begin={`${i * 0.6}s`}
                    repeatCount="indefinite"
                    path={`M ${x + w / 2} ${cy} L ${x + w / 2} ${nextY}`}
                  />
                </circle>
              </g>
            )}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="8"
              fill="var(--bg)"
              stroke="var(--border-hover)"
              strokeWidth="1"
            />
            <text
              x={x + 18}
              y={y + 32}
              fill="var(--text)"
              style={{ fontFamily: 'var(--font-mono)' }}
              fontSize="15"
              fontWeight="600"
            >
              {node.label}
            </text>
            <text
              x={x + 18}
              y={y + 54}
              fill="var(--text-muted)"
              style={{ fontFamily: 'var(--font-mono)' }}
              fontSize="12"
            >
              {node.sub}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DataPathDiagram() {
  return (
    <>
      <WideDiagram />
      <PortraitDiagram />
    </>
  )
}
