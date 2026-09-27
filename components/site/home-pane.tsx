'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ProjectRef } from '@/app/signals'
import { orderProjects } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath } from '@/lib/panes'
import { savedPreference, setSound, soundOn, subscribe, tick } from '@/lib/sound'
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
  meta,
  path,
}: {
  href: string
  label: string
  meta?: string
  path: string
}) {
  const active = path === href
  return (
    <li>
      <Link
        href={active ? '/' : href}
        scroll={false}
        aria-current={active ? 'page' : undefined}
        onPointerEnter={() => tick('hover')}
      >
        <span className="item-label">
          {label}
          {active && <CloseIcon />}
        </span>
        {meta && <span className="item-meta">{meta}</span>}
      </Link>
    </li>
  )
}

/** The first pane: who I am, what I did last, and everything that opens a pane. */
export function HomePane({ projects, tweet }: { projects: ProjectRef[]; tweet: React.ReactNode }) {
  const path = normalizePath(usePathname())
  const { repos } = useLive()
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

      <nav aria-label="Work" className="block">
        <h2 className="lab">Work</h2>
        <ul className="rows">
          {orderProjects(projects, repos).map((p) => {
            const live = p.repos.map((r) => repos?.[r]).find((r) => r && !r.isPrivate)
            return (
              <Item
                key={p.slug}
                href={`/apps/${p.slug}`}
                label={p.name}
                meta={live?.language ?? p.stack.split(' · ')[0]}
                path={path}
              />
            )
          })}
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
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(soundOn())
    const off = subscribe(setOn)
    // Browsers only allow audio after a gesture: resume a saved "on" at the first one.
    if (savedPreference() && !soundOn()) {
      const arm = () => setSound(true)
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
  return (
    <button
      type="button"
      className="sound"
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      onClick={() => setSound(!on)}
    >
      <span>{on ? 'Sound on' : 'Sound off'}</span>
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
