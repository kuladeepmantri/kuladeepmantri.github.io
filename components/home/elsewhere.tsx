'use client'

import { useRef, useState } from 'react'
import type { Post, RepoRow, Stat } from '@/lib/live'
import { Verified } from './icons'
import { Indicator, useIndicator } from './indicator'
import { Portrait } from './portrait'
import { Stamp } from './time'

type Tab = 'x' | 'github'

export type XView = {
  name: string
  handle: string
  verified: boolean
  pinnedId: string | null
  posts: Post[]
}

const LABEL: Record<Tab, string> = { x: 'X', github: 'GitHub' }

/**
 * X and GitHub behind a two-tab switch. Both panels are in the HTML; without
 * JavaScript a <noscript> style in the layout shows both and hides the tabs.
 */
export function Elsewhere({
  x,
  stats,
  repos,
}: {
  x: XView | null
  stats: Stat[]
  repos: RepoRow[]
}) {
  const tabs: Tab[] = []
  if (x?.posts.length) tabs.push('x')
  if (stats.length || repos.length) tabs.push('github')
  const [tab, setTab] = useState<Tab>(tabs[0] ?? 'x')
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const box = useIndicator(() => refs.current[tab], tab)

  if (!tabs.length) return null

  // Arrow keys, Home, and End move between tabs and select them.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.indexOf(tab)
    const next =
      e.key === 'ArrowRight'
        ? tabs[(i + 1) % tabs.length]
        : e.key === 'ArrowLeft'
          ? tabs[(i - 1 + tabs.length) % tabs.length]
          : e.key === 'Home'
            ? tabs[0]
            : e.key === 'End'
              ? tabs[tabs.length - 1]
              : null
    if (!next) return
    e.preventDefault()
    setTab(next)
    refs.current[next]?.focus()
  }

  const panel = (t: Tab) => (t === 'x' ? <Posts x={x!} /> : <Github stats={stats} repos={repos} />)

  return (
    <section id="elsewhere" aria-labelledby="elsewhere-title">
      <div className="section-head">
        <h2 id="elsewhere-title">Elsewhere</h2>
        {tabs.length > 1 && (
          <div
            className={box ? 'seglist measured' : 'seglist'}
            role="tablist"
            aria-label="Elsewhere"
            onKeyDown={onKeyDown}
          >
            <Indicator box={box} />
            {tabs.map((t) => (
              <button
                key={t}
                ref={(el) => {
                  refs.current[t] = el
                }}
                type="button"
                className="seg"
                role="tab"
                id={`tab-${t}`}
                aria-controls={`panel-${t}`}
                aria-selected={tab === t}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
              >
                {LABEL[t]}
              </button>
            ))}
          </div>
        )}
      </div>
      {tabs.length > 1
        ? tabs.map((t) => (
            <div
              key={t}
              className="panel"
              role="tabpanel"
              id={`panel-${t}`}
              aria-labelledby={`tab-${t}`}
              hidden={tab !== t}
            >
              {panel(t)}
            </div>
          ))
        : panel(tabs[0])}
    </section>
  )
}

function Posts({ x }: { x: XView }) {
  return (
    <ul className="posts">
      {x.posts.map((p) => (
        <li key={p.id}>
          <a className="post hov" href={p.url}>
            <div className="post-head">
              <Portrait size={36} lazy />
              <div className="post-who">
                <div className="post-name">
                  {x.name}
                  {x.verified && <Verified />}
                </div>
                <div className="mute">
                  @{x.handle} · <Stamp iso={p.createdAt} form="post" />
                </div>
              </div>
              {p.id === x.pinnedId && <span className="cap">Pinned</span>}
            </div>
            <p className="post-body">{p.text}</p>
          </a>
        </li>
      ))}
    </ul>
  )
}

function Github({ stats, repos }: { stats: Stat[]; repos: RepoRow[] }) {
  return (
    <>
      {!!stats.length && (
        <ul className="stats">
          {stats.map((s) => (
            <li key={s.label} className="stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
      {!!repos.length && (
        <>
          <h3 className="cap repos-head">Repositories</h3>
          <ul className="repos">
            {repos.map((r) => (
              <li key={r.name}>
                <a className="item hov" href={r.url}>
                  <span>
                    <span className="mono repo-name">
                      {r.name.split('/')[0]}/<wbr />
                      {r.name.split('/').slice(1).join('/')}
                    </span>
                    <span className="mute repo-line">{r.line}</span>
                  </span>
                  {r.language && (
                    <span className="mono mute lang">
                      <span
                        className="ldot"
                        style={r.language.color ? { background: r.language.color } : undefined}
                        aria-hidden="true"
                      />
                      {r.language.name}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
