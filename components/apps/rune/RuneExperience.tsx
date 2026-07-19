'use client'

import dynamic from 'next/dynamic'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { AsideNote } from '@/components/ui/aside-note'
import { Prose } from '@/components/ui/prose'
import { LazyScene } from '@/components/ui/lazy-scene'
import { ProjectShell } from '@/components/apps/project-shell'
import { DataPathDiagram } from './DataPathDiagram'
import { AnomalyChart } from './AnomalyChart'
import {
  HERO,
  REPO_NOTE,
  INTRO,
  LAYERS,
  NOTES,
  CLOSE,
  SECTIONS,
} from '@/app/apps/rune/content'

// three.js stays out of the initial bundle: it only loads when LazyScene mounts.
const CarPreview = dynamic(
  () => import('@/components/car-preview').then((m) => m.CarPreview),
  { ssr: false }
)

// rune's tint: warm steel — a cool, muted contrast that still sits in the site
// family. Read by section numbers, the diagram signal, the anomaly threshold.
const TINT = 'oklch(0.68 0.05 245)'

export function RuneExperience() {
  return (
    <ProjectShell
      name="rune"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
        live: { url: HERO.live, label: 'rune.kuladeepmantri.com' },
      }}
      footer={{ live: HERO.live, src: 'https://github.com/kuladeepmantri/rune' }}
    >
      {/* 3D hero, full-bleed */}
      <Band max={1100} hint="2026 Honda Accord · auto-orbiting">
        <LazyScene
          poster="/models/accord-poster.webp"
          alt="3D model of a 2026 Honda Accord"
          aspect="16 / 9"
        >
          <CarPreview />
        </LazyScene>
      </Band>

      {/* ── 01 · What it is ── */}
      <SectionHeading id="what" number="01" title="A car that never showed its hand" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>
      <AsideNote label="one honest note">{REPO_NOTE}</AsideNote>

      {/* Data path diagram, full-bleed */}
      <Band max={960} hint="the data path · car to phone">
        <DataPathDiagram />
      </Band>

      {/* ── 02 · Reading health ── */}
      <SectionHeading id="health" number="02" title="Turning readings into health" />
      <Reveal>
        <Prose>
          <p>{LAYERS.intro}</p>
        </Prose>
      </Reveal>
      <ol className="my-6 space-y-0">
        {LAYERS.items.map((st, i) => (
          <Reveal key={st.tag} delay={i * 0.06}>
            <li className="grid grid-cols-[auto_1fr] gap-x-4">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                  {i + 1}
                </span>
                {i < LAYERS.items.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-[var(--border)]" />
                )}
              </div>
              <div className="pb-6">
                <div className="text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
                  {st.tag}
                </div>
                <h3 className="mt-0.5 text-[15px] font-semibold text-[var(--text)]">
                  {st.title}
                </h3>
                <p
                  style={{ fontFamily: 'var(--font-inter)' }}
                  className="mt-1 max-w-[58ch] text-[14px] leading-[1.65] text-[var(--text-secondary)]"
                >
                  {st.text}
                </p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      {/* ── 03 · Anomalies ── */}
      <SectionHeading id="anomaly" number="03" title="Catching the strange, not just the broken" />
      <Band hint="interactive · move the threshold">
        <AnomalyChart />
      </Band>

      {/* ── 04 · Engineering notes ── */}
      <SectionHeading id="notes" number="04" title="The parts that took the most care" />
      <Reveal>
        <Prose>
          <p>{NOTES.intro}</p>
        </Prose>
      </Reveal>
      <div className="my-6 space-y-3">
        {NOTES.items.map((n, i) => (
          <Reveal key={n.tag} delay={i * 0.05}>
            <div className="rounded-lg border border-[var(--border)] p-5">
              <div className="text-[10.5px] tracking-[0.14em] text-[color:var(--signal-color)] uppercase">
                {n.tag}
              </div>
              <h3 className="mt-1 text-[15px] font-semibold text-[var(--text)]">
                {n.title}
              </h3>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="mt-2 text-[14px] leading-[1.7] text-[var(--text-secondary)]"
              >
                {n.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ── 05 · In the car ── */}
      <SectionHeading id="close" number="05" title="In the car" />
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
