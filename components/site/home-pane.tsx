'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { EMAIL, type ProjectRef } from '@/app/signals'
import { orderProjects } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { normalizePath, placeFor } from '@/lib/panes'
import { LABELS, current, cycle, restore, subscribe, tick, type Preset } from '@/lib/sound'
import { isStill, onStill, setStill } from '@/lib/still'
import { LiveSentence } from './live-sentence'
import { CloseIcon } from './pane-head'
import { LocationIcon } from './icons'
import { Clock } from './rel-time'

const PAGES = [
  { href: '/about', label: 'About' },
  { href: '/github', label: 'GitHub' },
  { href: '/x', label: 'X' },
  { href: '/contact', label: 'Contact' },
]

// When a row last opened its pane. The second click of a double click or
// double tap lands after the re-render, on the now active row that closes it.
let openedAt = -Infinity

function Item({
  href,
  label,
  line,
  path,
}: {
  href: string
  label: string
  line?: string
  path: string
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
        onPointerEnter={() => tick('hover')}
        onClick={(e) => {
          if (e.detail > 1 || (active && performance.now() - openedAt < 500)) {
            e.preventDefault()
            return
          }
          if (!active) openedAt = performance.now()
          // A hairline draws under the row as its pane slides out.
          const el = ref.current
          if (el) {
            el.dataset.fire = ''
            setTimeout(() => delete el.dataset.fire, 700)
          }
        }}
      >
        <span className="item-label">
          {active && <span className="sr-only">Close </span>}
          {label}
          {active && <CloseIcon />}
        </span>
        {line && <span className="item-line">{line}</span>}
      </Link>
    </li>
  )
}

/** The first pane: who I am, what I did last, and everything that opens a pane. */
export function HomePane({ projects, tweet }: { projects: ProjectRef[]; tweet: React.ReactNode }) {
  const path = normalizePath(usePathname())
  // The build's data, so the order never jumps after load.
  const { buildRepos } = useLive()
  // One h1 per page: while a pane is open, its title is the page's heading.
  const Name = placeFor(path).key ? 'div' : 'h1'
  return (
    <div className="home">
      <header className="id">
        <Name className="name">
          <Link href="/" scroll={false}>
            Kuladeep Mantri
          </Link>
        </Name>
        <p className="role">Security Engineer</p>
        <p className="loc">
          <LocationIcon />
          Michigan
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <Clock />
        </p>
      </header>

      <LiveSentence projects={projects} />

      <nav aria-label="Pages">
        <ul className="tabs">
          {PAGES.map((p) => (
            <Item key={p.href} {...p} path={path} />
          ))}
        </ul>
      </nav>

      <nav aria-label="Projects">
        <h2 className="lab">Projects</h2>
        <ul className="rows">
          {orderProjects(projects, buildRepos).map((p) => (
            <Item key={p.slug} href={`/apps/${p.slug}`} label={p.name} line={p.line} path={path} />
          ))}
        </ul>
      </nav>

      {tweet}

      <footer className="home-foot">
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <span className="switches">
          <SoundToggle />
          <MotionToggle />
        </span>
      </footer>
    </div>
  )
}

/** Lets the scenery move or holds it still. Follows the system setting until used. */
function MotionToggle() {
  const [still, setS] = useState(false)
  useEffect(() => {
    const apply = (s: boolean) => {
      setS(s)
      document.documentElement.toggleAttribute('data-still', s)
    }
    apply(isStill())
    return onStill(apply)
  }, [])
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!still}
      className="motion"
      onClick={() => setStill(!still)}
    >
      <span>Motion</span>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d={still ? 'M1.5 8h12.6' : 'M1.5 8q2.1-4 4.2 0t4.2 0t4.2 0'}
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

function SoundToggle() {
  const [preset, setP] = useState<Preset>('off')
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const off = subscribe(setP)
    const stop = restore(ref.current)
    setP(current())
    return () => {
      off()
      stop()
    }
  }, [])
  const on = preset !== 'off'
  return (
    <button ref={ref} type="button" className="sound" aria-pressed={on} onClick={() => cycle()}>
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
