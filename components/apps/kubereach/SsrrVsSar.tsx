'use client'

import { useState } from 'react'
import { SSRR_SAR } from '@/app/apps/kubereach/content'

// Bet one, made tangible: flip between the summary call every tool trusts
// (SelfSubjectRulesReview) and the exact yes/no question (SelfSubjectAccessReview)
// on the same permission. One under-reports; one gets the truth.

type Side = typeof SSRR_SAR.ssrr | typeof SSRR_SAR.sar

export function SsrrVsSar() {
  const [side, setSide] = useState<'ssrr' | 'sar'>('ssrr')
  const data: Side = side === 'ssrr' ? SSRR_SAR.ssrr : SSRR_SAR.sar
  const allow = data.verdictTone === 'allow'

  return (
    <div className="mx-auto max-w-[640px]">
      {/* Tab switch */}
      <div
        role="tablist"
        aria-label="permission check method"
        className="grid grid-cols-2 overflow-hidden rounded-lg border border-[var(--border)]"
      >
        {(['ssrr', 'sar'] as const).map((k) => {
          const on = side === k
          const label = k === 'ssrr' ? SSRR_SAR.ssrr.tab : SSRR_SAR.sar.tab
          return (
            <button
              key={k}
              role="tab"
              id={`ssrr-sar-tab-${k}`}
              aria-selected={on}
              aria-controls="ssrr-sar-panel"
              onClick={() => setSide(k)}
              className="px-4 py-3 text-left transition-colors"
              style={{
                background: on ? 'var(--bg-subtle)' : 'transparent',
                color: on ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              <div className="text-[13px] font-semibold">{label}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                {k === 'ssrr' ? SSRR_SAR.ssrr.call : SSRR_SAR.sar.call}
              </div>
            </button>
          )
        })}
      </div>

      {/* Terminal panel */}
      <div
        role="tabpanel"
        id="ssrr-sar-panel"
        aria-labelledby={`ssrr-sar-tab-${side}`}
        tabIndex={0}
        className="mt-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: allow ? 'var(--status-active)' : 'var(--text-muted)',
            }}
          />
          <span>{data.nick}</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.7] whitespace-pre text-[var(--text-secondary)]">
          {data.lines.join('\n')}
        </pre>
        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{
            borderColor: allow
              ? 'color-mix(in oklch, var(--status-active) 45%, var(--border))'
              : 'var(--border)',
          }}
        >
          <span className="text-[11px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
            verdict
          </span>
          <span
            className="text-[13px] font-semibold"
            style={{
              color: allow ? 'var(--status-active)' : 'var(--text-muted)',
            }}
          >
            {data.verdict}
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[12px] text-[var(--text-muted)]">
        Same identity, same permission. The two calls disagree, and only one is
        right.
      </p>
    </div>
  )
}
