'use client'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { Prose } from '@/components/ui/prose'
import { ProjectShell } from '@/components/apps/project-shell'
import { PipelineDiagram } from './PipelineDiagram'
import {
  HERO,
  CREDIT,
  INTRO,
  CREW,
  ROUTING,
  CLOSE,
  SECTIONS,
} from '@/app/apps/shipcrew/content'

const TINT = 'oklch(0.62 0.13 320)' // warm violet

export function ShipcrewExperience() {
  return (
    <ProjectShell
      name="shipcrew"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
      }}
      footer={{ src: 'https://github.com/kuladeepmantri/shipcrew' }}
    >
      <Band max={1000} hint="one message, routed to the right agents">
        <PipelineDiagram />
      </Band>

      {/* 01 · The idea */}
      <SectionHeading id="what" number="01" title="A team, not an assistant" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      {/* 02 · The crew */}
      <SectionHeading id="crew" number="02" title="The crew" />
      <Band hint="five agents · addressed like people">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-5">
          {CREW.map((c) => (
            <div key={c.name} className="bg-[var(--bg-elevated)] px-4 py-5">
              <div className="text-[15px] font-semibold text-[var(--text)]">
                {c.name}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
                {c.role}
              </div>
              <div className="mt-2 text-[11px] text-[color:var(--signal-color)]">
                {c.at}
              </div>
            </div>
          ))}
        </div>
      </Band>

      {/* 03 · Routing */}
      <SectionHeading id="routing" number="03" title="Who answers, and how they hand off" />
      <Reveal>
        <Prose>
          <p>{ROUTING.intro}</p>
          <p>{ROUTING.handoff}</p>
        </Prose>
      </Reveal>

      {/* 04 · Built with */}
      <SectionHeading id="credit" number="04" title="Built with Abhishek Manyam" />
      <Reveal>
        <Prose>
          <p>{CREDIT.intro}</p>
        </Prose>
      </Reveal>
      <Reveal>
        <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] p-5">
            <div className="text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
              me
            </div>
            <p
              style={{ fontFamily: 'var(--font-inter)' }}
              className="mt-2 text-[14px] leading-[1.7] text-[var(--text-secondary)]"
            >
              {CREDIT.mine}
            </p>
          </div>
          <div className="rounded-lg border border-[color:color-mix(in_oklch,var(--signal-color)_40%,var(--border))] p-5">
            <div className="text-[10.5px] tracking-[0.14em] text-[color:var(--signal-color)] uppercase">
              Abhishek Manyam
            </div>
            <p
              style={{ fontFamily: 'var(--font-inter)' }}
              className="mt-2 text-[14px] leading-[1.7] text-[var(--text-secondary)]"
            >
              {CREDIT.his}
            </p>
            <a
              href={CREDIT.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[12px] text-[color:var(--signal-color)] underline underline-offset-[3px]"
            >
              abhishekmanyam.com
            </a>
          </div>
        </div>
      </Reveal>

      {/* 05 · What runs */}
      <SectionHeading id="close" number="05" title="What runs today" />
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
