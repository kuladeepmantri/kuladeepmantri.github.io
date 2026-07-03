'use client'

import React, { useState } from 'react'
import { HOPS, BLAST, type Hop } from '@/app/apps/kubereach/content'

// The split-vantage pivot as a row of clickable hops with click-to-expand
// terminal detail, plus a persistent blast-radius strip (allowed / denied).
// Adapted from Rune's PipelineWidget; re-tokened and colored per hop.

function toneColor(tone: Hop['tone']): string {
  switch (tone) {
    case 'rose':
      return 'var(--kr-rose)'
    case 'allow':
      return 'var(--status-active)'
    case 'muted':
      return 'var(--text-muted)'
  }
}

export function AttackPath() {
  const [expanded, setExpanded] = useState<string | null>('creds')
  const active = expanded ? HOPS.find((h) => h.id === expanded) : null

  return (
    <div>
      {/* Vertical attack chain: each hop a full-width card, a down-arrow
          between. Reads top-to-bottom as the key leaves the cluster. */}
      <div className="mx-auto flex max-w-[720px] flex-col gap-1">
        {HOPS.map((hop, i) => (
          <React.Fragment key={hop.id}>
            <HopButton
              hop={hop}
              open={expanded === hop.id}
              onClick={() => setExpanded(expanded === hop.id ? null : hop.id)}
            />
            {i < HOPS.length - 1 && (
              <div className="text-center text-[var(--text-muted)]">&darr;</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {active && (
        <div
          id={`hop-detail-${active.id}`}
          className="mx-auto mt-4 max-w-[720px] border-t border-[var(--border)] pt-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: toneColor(active.tone) }}
            />
            <span className="text-[12px] tracking-[0.08em] text-[var(--text-muted)] uppercase">
              {active.role} &middot; {active.name}
            </span>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-[12.5px] leading-[1.7] whitespace-pre text-[var(--text-secondary)]">
            {active.detail}
          </pre>
        </div>
      )}

      {/* Persistent blast-radius payoff */}
      <div className="mx-auto mt-8 max-w-[720px] border-t border-[var(--border)] pt-6">
        <div className="mb-3 text-[11px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
          blast radius · what the stolen role can touch
        </div>
        <p className="mb-4 max-w-[62ch] text-[13.5px] leading-[1.6] text-[var(--text-secondary)]">
          {BLAST.intro}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Chipcol title="allowed" tone="allow" items={BLAST.allowed} />
          <ChipcolDeny title="denied" items={BLAST.denied} />
        </div>
      </div>
    </div>
  )
}

function HopButton({
  hop,
  open,
  onClick,
}: {
  hop: Hop
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      aria-controls={`hop-detail-${hop.id}`}
      className="h-full cursor-pointer rounded-lg border px-3 py-4 text-left transition-colors"
      style={{
        borderColor: open ? toneColor(hop.tone) : 'var(--border)',
        background: open ? 'var(--bg-subtle)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] tabular-nums"
          style={{ color: toneColor(hop.tone) }}
        >
          {hop.step}
        </span>
        <span
          className="text-[10px] tracking-[0.12em] uppercase"
          style={{ color: toneColor(hop.tone) }}
        >
          {hop.role}
        </span>
      </div>
      <h3 className="mt-1.5 mb-1 text-[14px] font-semibold text-[var(--text)]">
        {hop.name}
      </h3>
      <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)]">
        {hop.summary}
      </p>
    </button>
  )
}

function ChipcolDeny({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="mb-2.5 text-[11px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]"
          >
            <span aria-hidden>&times;</span>
            <code className="text-[12.5px]">{it}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Chipcol({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'allow'
  items: string[]
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor:
          'color-mix(in oklch, var(--status-active) 45%, var(--border))',
      }}
    >
      <div
        className="mb-2.5 text-[11px] tracking-[0.14em] uppercase"
        style={{ color: toneColor(tone) }}
      >
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it}
            className="flex items-center gap-2 text-[13px]"
            style={{ color: 'var(--status-active)' }}
          >
            <span aria-hidden>&check;</span>
            <code className="text-[12.5px]">{it}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
