'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { SmoothScroll } from '@/components/ui/smooth-scroll'

// Shared scaffold for every immersive project page: smooth scroll, a floating
// section nav, the back link, the hero header with an optional live-site
// callout, and the footer links. Each page sets its own --signal-color tint and
// supplies the section bodies (diagrams, bands, prose) as children.

export type NavSection = { id: string; label: string }

export type ProjectHero = {
  eyebrow: string
  headline: string
  sub: string
  meta: string[]
  live?: { url: string; label: string }
}

export type ProjectFooter = {
  live?: string
  src?: string
}

function Nav({
  name,
  sections,
}: {
  name: string
  sections: NavSection[]
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

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
            {name}
          </span>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={active === s.id ? 'location' : undefined}
              className="rounded px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors"
              style={{
                color: active === s.id ? 'var(--text)' : 'var(--text-muted)',
                background: active === s.id ? 'var(--bg-subtle)' : 'transparent',
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

export function LiveCallout({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[color:color-mix(in_oklch,var(--signal-color)_40%,var(--border))] bg-[color:color-mix(in_oklch,var(--signal-color)_6%,transparent)] px-4 py-2.5 text-[13px] text-[var(--text)] transition-colors hover:bg-[color:color-mix(in_oklch,var(--signal-color)_12%,transparent)]"
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: 'var(--signal-color)' }}
      />
      open the live site
      <span className="text-[var(--text-muted)]">{label}</span>
    </a>
  )
}

export function ProjectShell({
  name,
  tint,
  sections,
  hero,
  footer,
  children,
}: {
  name: string
  tint: string
  sections: NavSection[]
  hero: ProjectHero
  footer: ProjectFooter
  children: ReactNode
}) {
  return (
    <SmoothScroll>
      <Nav name={name} sections={sections} />
      <article
        className="mx-auto max-w-reading px-5 pb-24"
        style={{ ['--signal-color' as string]: tint }}
      >
        <Link
          href="/"
          aria-label="Back to all projects"
          className="mt-2 mb-8 inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          [&larr; back]
        </Link>

        <header>
          <div className="text-[12px] tracking-[0.2em] text-[color:var(--signal-color)] uppercase">
            {hero.eyebrow}
          </div>
          <h1
            style={{ fontFamily: 'var(--font-inter)' }}
            className="mt-3 text-[33px] leading-[1.08] font-semibold tracking-[-0.025em] text-[var(--text)] md:text-[48px]"
          >
            {hero.headline}
          </h1>
          <p
            style={{ fontFamily: 'var(--font-inter)' }}
            className="mt-5 max-w-[60ch] text-[16px] leading-[1.7] text-[var(--text-secondary)]"
          >
            {hero.sub}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-[var(--text-muted)]">
            {hero.meta.map((m, i) => (
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
          {hero.live && <LiveCallout url={hero.live.url} label={hero.live.label} />}
        </header>

        {children}

        <div className="mt-16 flex items-center gap-5 border-t border-[var(--border)] pt-6 text-[12px]">
          <Link
            href="/"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
          >
            [&larr; back]
          </Link>
          {footer.live && (
            <a
              href={footer.live}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              [live]
            </a>
          )}
          {footer.src && (
            <a
              href={footer.src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              [src]
            </a>
          )}
        </div>
      </article>
    </SmoothScroll>
  )
}
