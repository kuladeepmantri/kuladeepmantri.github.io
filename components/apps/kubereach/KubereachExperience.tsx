'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SmoothScroll } from '@/components/ui/smooth-scroll'
import { Reveal } from '@/components/ui/reveal'
import { SectionHeading } from '@/components/ui/section-heading'
import { Band } from '@/components/ui/band'
import { AsideNote as Aside } from '@/components/ui/aside-note'
import { Prose } from '@/components/ui/prose'
import { SsrrVsSar } from './SsrrVsSar'
import { AttackPath } from './AttackPath'
import { ClusterDiagram } from './ClusterDiagram'
import {
  HERO,
  INTRO,
  SSRR_SAR,
  ATTACK_INTRO,
  REAL_RUN,
  METHOD,
  CONCLUSION,
  SECTIONS,
} from '@/app/apps/kubereach/content'

function Nav() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      aria-label="Sections"
      className={`fixed top-0 right-0 left-0 z-40 transition-all duration-300 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <div className="border-b border-[var(--border)] bg-[color-mix(in_oklch,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-11 max-w-[1100px] items-center gap-1 overflow-x-auto px-4 md:px-8">
          <span className="mr-3 shrink-0 text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
            kubereach
          </span>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'location' : undefined}
              className="rounded px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors"
              style={{
                color: active === s.id ? 'var(--text)' : 'var(--text-muted)',
                background:
                  active === s.id ? 'var(--bg-subtle)' : 'transparent',
              }}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}

export function KubereachExperience() {
  return (
    <SmoothScroll>
      <Nav />
      <article className="mx-auto max-w-reading px-5 pb-24">
        {/* Back link */}
        <Link
          href="/"
          aria-label="Back to all projects"
          className="mt-2 mb-8 inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          [&larr; back]
        </Link>

        {/* ── Hero ── */}
        <header>
          <div className="text-[12px] tracking-[0.2em] text-[var(--kr-rose)] uppercase">
            {HERO.eyebrow}
          </div>
          <h1
            style={{ fontFamily: 'var(--font-inter)' }}
            className="mt-3 text-[33px] leading-[1.08] font-semibold tracking-[-0.025em] text-[var(--text)] md:text-[48px]"
          >
            {HERO.headline}
          </h1>
          <p
            style={{ fontFamily: 'var(--font-inter)' }}
            className="mt-5 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--text-secondary)]"
          >
            {HERO.sub}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-[var(--text-muted)]">
            {HERO.meta.map((m, i) => (
              <span key={m} className="inline-flex items-center">
                {i > 0 && (
                  <span aria-hidden className="mr-1.5 opacity-50">
                    &middot;
                  </span>
                )}
                {m}
              </span>
            ))}
          </div>
        </header>

        {/* Architecture diagram, full-bleed band */}
        <Band max={900}>
          <ClusterDiagram />
          <p className="mt-6 text-center text-[11px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
            one container is compromised &middot; its token escapes the cluster
            to your laptop, then to AWS
          </p>
        </Band>

        {/* ── 01 · Start ── */}
        <SectionHeading id="start" number="01" title="The starting point" />
        <Reveal>
          <Prose>
            {INTRO.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Prose>
        </Reveal>

        {/* ── 02 · The front desk lies (SSRR vs SAR) ── */}
        <SectionHeading
          id="front-desk"
          number="02"
          title="Bet one: the front desk lies"
        />
        <Reveal>
          <Prose>
            <p>{SSRR_SAR.intro}</p>
          </Prose>
        </Reveal>
        <Band hint="interactive · try both calls">
          <SsrrVsSar />
        </Band>
        <Reveal>
          <Prose>
            <p>{SSRR_SAR.takeaway}</p>
          </Prose>
        </Reveal>

        {/* ── 03 · Carrying the key out (attack path) ── */}
        <SectionHeading
          id="carry-out"
          number="03"
          title="Bet two: carrying the key out"
        />
        <Reveal>
          <Prose>
            <p>{ATTACK_INTRO}</p>
          </Prose>
        </Reveal>
        <Band hint="interactive · click any hop">
          <AttackPath />
        </Band>

        {/* ── 04 · The real run ── */}
        <SectionHeading id="real-run" number="04" title="The real run" />
        <Reveal>
          <Prose>
            <p>{REAL_RUN.intro}</p>
          </Prose>
        </Reveal>

        <Reveal delay={0.05}>
          <dl className="my-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {REAL_RUN.setup.map((row) => (
              <div key={row.k} className="bg-[var(--bg-elevated)] px-4 py-3">
                <dt className="text-[10.5px] tracking-[0.14em] text-[var(--text-muted)] uppercase">
                  {row.k}
                </dt>
                <dd className="mt-1 text-[13.5px] text-[var(--text-secondary)]">
                  {row.v}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <ol className="my-6 space-y-3">
          {REAL_RUN.steps.map((s, i) => (
            <Reveal
              as="li"
              key={s.text}
              delay={i * 0.05}
              className="flex gap-4 rounded-lg border border-[var(--border)] p-4"
            >
              <span className="mt-0.5 text-[13px] tabular-nums text-[var(--text-muted)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="text-[10.5px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                  {s.hat}
                </div>
                <p
                  style={{ fontFamily: 'var(--font-inter)' }}
                  className="mt-1 text-[14px] leading-[1.6] text-[var(--text-secondary)]"
                >
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Aside label="the assumption that turned out wrong">
          My local test signed the request to AWS with my own credentials, and
          real AWS rejects that outright. The whole point is that the{' '}
          <strong>stolen token is the credential</strong>, so the request has to
          go out unsigned. A four-line fix, and exactly the kind of detail that
          decides whether the attack works or quietly fails. I only found it by
          doing it for real instead of trusting the mock.
        </Aside>

        <Reveal>
          <Prose>
            <p>{REAL_RUN.close}</p>
          </Prose>
        </Reveal>

        {/* ── 05 · How I worked ── */}
        <SectionHeading id="how" number="05" title="How I worked" />
        <Reveal>
          <Prose>
            <p>{METHOD.intro}</p>
          </Prose>
        </Reveal>
        <ol className="my-6 space-y-0">
          {METHOD.stages.map((st, i) => (
            <Reveal
              as="li"
              key={st.tag}
              delay={i * 0.06}
              className="grid grid-cols-[auto_1fr] gap-x-4"
            >
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                  {i + 1}
                </span>
                {i < METHOD.stages.length - 1 && (
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
            </Reveal>
          ))}
        </ol>

        {/* ── 06 · In progress ── */}
        <SectionHeading id="worth" number="06" title="Work in progress" />
        <Reveal>
          <Prose>
            {CONCLUSION.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Prose>
        </Reveal>
        <Aside label="where this belongs">{CONCLUSION.scope}</Aside>

        {/* Footer nav */}
        <div className="mt-16 border-t border-[var(--border)] pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            [&larr; back]
          </Link>
        </div>
      </article>
    </SmoothScroll>
  )
}
