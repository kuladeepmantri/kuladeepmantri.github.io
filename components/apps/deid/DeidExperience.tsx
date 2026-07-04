'use client'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { Prose } from '@/components/ui/prose'
import { ProjectShell } from '@/components/apps/project-shell'
import { HERO, BODY, ARCH, CLOSE, SECTIONS } from '@/app/apps/deid/content'

const TINT = 'oklch(0.60 0.07 60)' // warm tan

// A small inline masking visual for the hero.
function MaskVisual() {
  return (
    <svg viewBox="0 0 900 200" className="mx-auto h-auto w-full max-w-[680px]" role="img" aria-label="An email address being masked.">
      <defs>
        <pattern id="deid-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--border)" opacity="0.4" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="900" height="200" fill="url(#deid-grid)" />
      <text x="80" y="105" fill="var(--text-secondary)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="20">john.doe@example.com</text>
      <path d="M 420 98 L 500 98" stroke="var(--signal-color,var(--accent))" markerEnd="url(#deid-arrow)" fill="none" />
      <text x="540" y="105" fill="var(--text)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="20" fontWeight="600">***@***.***</text>
      <text x="80" y="140" fill="var(--text-muted)" style={{ fontFamily: 'var(--font-mono)' }} fontSize="11">a regex, doing the real work</text>
      <defs>
        <marker id="deid-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--signal-color,var(--accent))" />
        </marker>
      </defs>
    </svg>
  )
}

export function DeidExperience() {
  return (
    <ProjectShell
      name="deid"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
      }}
      footer={{ src: 'https://github.com/kuladeepmantri/DeID-Anonymizer' }}
    >
      <Band max={900} hint="what it actually does">
        <MaskVisual />
      </Band>

      <SectionHeading id="what" number="01" title="What it does" />
      <Reveal>
        <Prose>
          {BODY.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      <SectionHeading id="arch" number="02" title="The pipeline around the detector" />
      <Band hint="API live · queue and storage scaffolded">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
          {ARCH.map((a) => (
            <div key={a.key} className="bg-[var(--bg-elevated)] px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  {a.label}
                </span>
                <span
                  className={`text-[10px] tracking-[0.1em] uppercase ${
                    a.wired
                      ? 'text-[var(--status-active)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {a.wired ? 'live' : 'scaffold'}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                {a.sub}
              </p>
            </div>
          ))}
        </div>
      </Band>

      <SectionHeading id="close" number="03" title="The bones" />
      <Reveal>
        <Prose>
          <p>{CLOSE}</p>
        </Prose>
      </Reveal>
    </ProjectShell>
  )
}
