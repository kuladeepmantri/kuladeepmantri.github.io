'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { ProjectRef } from '@/app/signals'
import { orderProjects } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath } from '@/lib/panes'
import { emit, on, setOrigin } from '@/lib/bus'
import { LABELS, current, cycle, saved, setPreset, subscribe, tick, type Preset } from '@/lib/sound'
import { LiveSentence } from './live-sentence'
import { CloseIcon } from './pane-head'
import { PinIcon } from './icons'
import { Clock } from './rel-time'

const PAGES = [
  { href: '/about', label: 'About' },
  { href: '/github', label: 'GitHub' },
  { href: '/x', label: 'X' },
  { href: '/contact', label: 'Contact' },
]

function Item({
  href,
  label,
  path,
  slug,
  lit,
}: {
  href: string
  label: string
  path: string
  slug?: string
  lit?: boolean
}) {
  const active = path === href
  const ref = useRef<HTMLAnchorElement>(null)
  return (
    <li>
      <Link
        ref={ref}
        href={active ? '/' : href}
        scroll={false}
        aria-current={active ? 'page' : undefined}
        data-lit={lit || undefined}
        onPointerEnter={() => {
          tick('hover')
          if (slug) emit('focus', { slug })
        }}
        onPointerLeave={() => slug && emit('focus', { slug: null })}
        onClick={() => {
          // The pane opens out of this row, and the background ripples from it.
          const r = ref.current?.getBoundingClientRect()
          if (r) setOrigin({ x: r.right, y: r.top + r.height / 2 })
          const el = ref.current
          if (el) {
            el.dataset.fire = ''
            setTimeout(() => delete el.dataset.fire, 700)
          }
        }}
      >
        <span className="item-label">
          {label}
          {active && <CloseIcon />}
        </span>
      </Link>
    </li>
  )
}

/** The first pane: who I am, what I did last, and everything that opens a pane. */
export function HomePane({ projects, tweet }: { projects: ProjectRef[]; tweet: React.ReactNode }) {
  const path = normalizePath(usePathname())
  const { repos } = useLive()
  // Hosts hovered on the background light up their projects here.
  const [lit, setLit] = useState<string[]>([])
  useEffect(() => on<{ slugs: string[] }>('node', (d) => setLit(d.slugs)), [])
  return (
    <div className="home">
      <header className="id">
        <h1 className="name">
          <Link href="/" scroll={false}>
            Kuladeep Mantri
          </Link>
        </h1>
        <p className="role">Security Engineer</p>
        <p className="loc">
          <PinIcon />
          Michigan
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <Clock />
        </p>
      </header>

      <LiveSentence projects={projects} />

      {tweet}

      <nav aria-label="Projects" className="block">
        <h2 className="lab">Projects</h2>
        <ul className="rows">
          {orderProjects(projects, repos).map((p) => (
            <Item
              key={p.slug}
              href={`/apps/${p.slug}`}
              label={p.name}
              path={path}
              slug={p.slug}
              lit={lit.includes(p.slug)}
            />
          ))}
        </ul>
      </nav>

      <nav aria-label="More" className="block">
        <ul className="tabs">
          {PAGES.map((p) => (
            <Item key={p.href} {...p} path={path} />
          ))}
        </ul>
      </nav>

      <footer className="home-foot">
        <span>© {new Date().getFullYear()}</span>
        <SoundToggle />
      </footer>
    </div>
  )
}

function SoundToggle() {
  const [preset, setP] = useState<Preset>('off')
  useEffect(() => {
    setP(current())
    const off = subscribe(setP)
    // Browsers only allow audio after a gesture: resume a saved choice at the first one.
    const want = saved()
    if (want !== 'off' && current() === 'off') {
      const arm = () => setPreset(want)
      window.addEventListener('pointerdown', arm, { once: true })
      return () => {
        off()
        window.removeEventListener('pointerdown', arm)
      }
    }
    return () => {
      off()
    }
  }, [])
  const on = preset !== 'off'
  return (
    <button
      type="button"
      className="sound"
      aria-pressed={on}
      aria-label={`Sound: ${LABELS[preset]}. Change sound`}
      onClick={() => cycle()}
    >
      <span>{LABELS[preset]}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z" fill="currentColor" />
        {on ? (
          <path
            d="M10.4 5.6a3.4 3.4 0 0 1 0 4.8M12.2 3.9a5.8 5.8 0 0 1 0 8.2"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M10.5 6.2l3 3.6M13.5 6.2l-3 3.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  )
}
