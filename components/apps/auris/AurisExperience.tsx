'use client'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { AsideNote } from '@/components/ui/aside-note'
import { Prose } from '@/components/ui/prose'
import { ProjectShell } from '@/components/apps/project-shell'
import { SyscallStream, PtraceLoop, PtraceLoopPortrait } from './AurisDiagrams'
import {
  HERO,
  INTRO,
  MODES,
  ANOMALIES,
  ANOMALY_NOTE,
  ENFORCE,
  OFFENSIVE,
  CLOSE,
  SECTIONS,
} from '@/app/apps/auris/content'

const TINT = 'oklch(0.64 0.19 35)' // ember

export function AurisExperience() {
  return (
    <ProjectShell
      name="auris"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
        live: { url: HERO.live, label: 'auris.kuladeepmantri.com' },
      }}
      footer={{ live: HERO.live, src: 'https://github.com/kuladeepmantri/auris' }}
    >
      <Band max={1100} hint="the syscall stream">
        <SyscallStream />
      </Band>

      {/* 01 · What it is */}
      <SectionHeading id="what" number="01" title="A program, described by its system calls" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      {/* 02 · The modes */}
      <SectionHeading id="modes" number="02" title="Six modes on one stream" />
      <Reveal>
        <Prose>
          <p>{MODES.intro}</p>
        </Prose>
      </Reveal>
      <div className="my-6 overflow-hidden rounded-lg border border-[var(--border)]">
        {MODES.items.map((m, i) => (
          <Reveal key={m.tag} delay={i * 0.04}>
            <div className="grid grid-cols-[110px_1fr] gap-x-4 border-b border-[var(--border)] px-4 py-3.5 last:border-b-0">
              <div className="text-[11px] tracking-[0.14em] text-[color:var(--signal-color)] uppercase">
                {m.tag}
              </div>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="text-[14px] leading-[1.6] text-[var(--text-secondary)]"
              >
                {m.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* 03 · Detection */}
      <SectionHeading id="anomaly" number="03" title="What counts as strange" />
      <Band hint="anomaly types · scored against a baseline">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {ANOMALIES.map((a) => (
            <div key={a.k} className="bg-[var(--bg-elevated)] px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {a.k}
                </span>
                <span className="text-[11px] text-[color:var(--signal-color)]">
                  {a.score}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                {a.v}
              </p>
            </div>
          ))}
        </div>
      </Band>
      <AsideNote label="why statistics, not a model">{ANOMALY_NOTE}</AsideNote>

      {/* 04 · Enforcement */}
      <SectionHeading id="enforce" number="04" title="Blocking a call before the kernel runs it" />
      <Reveal>
        <Prose>
          <p>{ENFORCE.intro}</p>
        </Prose>
      </Reveal>
      <Reveal>
        <pre className="my-6 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          <code>$ {ENFORCE.command}</code>
        </pre>
      </Reveal>
      <Band max={900} hint="the ptrace stop loop">
        <PtraceLoop />
        <PtraceLoopPortrait />
      </Band>

      {/* 05 · Offensive build */}
      <SectionHeading id="offensive" number="05" title="The offensive toolkit" />
      <Reveal>
        <Prose>
          <p>{OFFENSIVE.intro}</p>
        </Prose>
      </Reveal>
      <div className="my-6 space-y-3">
        {OFFENSIVE.items.map((o, i) => (
          <Reveal key={o.tag} delay={i * 0.05}>
            <div className="rounded-lg border border-[var(--border)] p-5">
              <div className="flex items-center gap-2">
                <div className="text-[10.5px] tracking-[0.14em] text-[color:var(--signal-color)] uppercase">
                  {o.tag}
                </div>
                <span
                  className={`text-[10px] tracking-[0.1em] uppercase ${
                    o.real
                      ? 'text-[var(--status-active)]'
                      : 'text-[var(--status-paused)]'
                  }`}
                >
                  {o.real ? 'real' : 'partial'}
                </span>
              </div>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="mt-2 text-[14px] leading-[1.7] text-[var(--text-secondary)]"
              >
                {o.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* 06 · What it settles */}
      <SectionHeading id="close" number="06" title="What it settles" />
      <Reveal>
        <Prose>
          {CLOSE.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>
    </ProjectShell>
  )
}
