'use client'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { Prose } from '@/components/ui/prose'
import { ProjectShell } from '@/components/apps/project-shell'
import { HERO, INTRO, STEPS, HELP, CLOSE, SECTIONS } from '@/app/apps/untilithappens/content'

const TINT = 'oklch(0.66 0.14 30)' // warm coral

export function UntilExperience() {
  return (
    <ProjectShell
      name="untilithappens"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
        live: { url: HERO.live, label: 'untilithappens.kuladeepmantri.com' },
      }}
      footer={{
        live: HERO.live,
        src: 'https://github.com/kuladeepmantri/untilithappens',
      }}
    >
      {/* Hero: the four calm steps */}
      <Band max={1000} hint="start calm · move step by step">
        <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-[var(--bg-elevated)] px-5 py-6">
              <div className="text-[11px] tracking-[0.2em] text-[color:var(--signal-color)]">
                {s.n}
              </div>
              <div className="mt-2 text-[14px] font-semibold text-[var(--text)]">
                {s.title}
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                {s.time}
              </div>
            </li>
          ))}
        </ol>
      </Band>

      {/* 01 · What it is */}
      <SectionHeading id="what" number="01" title="Written for the people the advice leaves behind" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      {/* 02 · The journey */}
      <SectionHeading id="steps" number="02" title="A guided sequence, not a wall of tips" />
      <Reveal>
        <Prose>
          <p>
            The core is a four-step journey. You are never shown everything at
            once. You finish one short step, then the next, and it always tells
            you where you are and what comes after.
          </p>
        </Prose>
      </Reveal>

      {/* 03 · If it happened */}
      <SectionHeading id="help" number="03" title="For the worst moment, too" />
      <Reveal>
        <Prose>
          <p>{HELP.intro}</p>
        </Prose>
      </Reveal>

      {/* 04 · Who it is for */}
      <SectionHeading id="close" number="04" title="Who it is for" />
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
