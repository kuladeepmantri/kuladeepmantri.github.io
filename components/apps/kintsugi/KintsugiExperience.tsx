'use client'

import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { AsideNote } from '@/components/ui/aside-note'
import { Prose } from '@/components/ui/prose'
import { ProjectShell } from '@/components/apps/project-shell'
import { DeviceFrame } from '@/components/ui/device-frame'
import { OnDeviceFlow } from './KintsugiVisuals'
import { HERO, INTRO, PRIVACY, PANIC, CLOSE, SECTIONS } from '@/app/apps/kintsugi/content'

const TINT = 'oklch(0.74 0.11 85)' // soft gold

export function KintsugiExperience() {
  return (
    <ProjectShell
      name="kintsugi"
      tint={TINT}
      sections={SECTIONS}
      hero={{
        eyebrow: HERO.eyebrow,
        headline: HERO.headline,
        sub: HERO.sub,
        meta: HERO.meta,
      }}
      footer={{}}
    >
      <Band max={900} hint="the app, running">
        <DeviceFrame
          type="iphone"
          imageSrc={null}
          videoSrc="/videos/kintsugi.mp4"
          appName="Kintsugi"
        />
      </Band>

      {/* 01 · What it is */}
      <SectionHeading id="what" number="01" title="Built for one person" />
      <Reveal>
        <Prose>
          {INTRO.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </Reveal>

      {/* 02 · On device */}
      <SectionHeading id="privacy" number="02" title="Safe and private at once" />
      <Reveal>
        <Prose>
          <p>{PRIVACY.intro}</p>
        </Prose>
      </Reveal>
      <div className="my-6 space-y-3">
        {PRIVACY.layers.map((l, i) => (
          <Reveal key={l.tag} delay={i * 0.05}>
            <div className="rounded-lg border border-[var(--border)] p-5">
              <div className="text-[10.5px] tracking-[0.14em] text-[color:var(--signal-color)] uppercase">
                {l.tag}
              </div>
              <p
                style={{ fontFamily: 'var(--font-inter)' }}
                className="mt-2 text-[14px] leading-[1.7] text-[var(--text-secondary)]"
              >
                {l.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <Band max={900} hint="where the data lives">
        <OnDeviceFlow />
      </Band>
      <AsideNote label="what it deliberately does not use">{PRIVACY.note}</AsideNote>

      {/* 03 · A hard moment */}
      <SectionHeading id="panic" number="03" title="Riding out a hard moment" />
      <Reveal>
        <Prose>
          <p>{PANIC.intro}</p>
          <p>{PANIC.surf}</p>
        </Prose>
      </Reveal>

      {/* 04 · Private on purpose */}
      <SectionHeading id="close" number="04" title="Private on purpose" />
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
