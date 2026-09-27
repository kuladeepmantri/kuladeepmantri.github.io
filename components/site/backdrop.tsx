'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { normalizePath, placeFor } from '@/lib/panes'
import { Field, type Source } from './field'
import { Lattice } from './scenes/lattice'
import { Lines } from './scenes/lines'
import { Orbit } from './scenes/orbit'
import { Ridges } from './scenes/ridges'
import { Silk } from './scenes/silk'

type Choice = 'dither' | 'silk' | 'lines' | 'orbit' | 'lattice' | 'ridges'

const CHOICES: { id: Choice; label: string }[] = [
  { id: 'silk', label: 'Silk' },
  { id: 'lines', label: 'Lines' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'lattice', label: 'Lattice' },
  { id: 'ridges', label: 'Ridges' },
  { id: 'dither', label: 'Dither' },
]

const KEY = 'km-bg'

/**
 * The site's background. On localhost a switcher (and keys 1 to 6) tries the
 * candidates in place; the published site keeps the dither field.
 */
export function Backdrop({
  sources,
  names,
}: {
  sources: Record<string, Source>
  names: Record<string, string>
}) {
  const place = placeFor(normalizePath(usePathname()))
  const [lab, setLab] = useState(false)
  const [choice, setChoice] = useState<Choice>('dither')

  useEffect(() => {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname)
    setLab(local)
    if (!local) return
    const fromUrl = new URLSearchParams(location.search).get('bg')
    let saved: string | null = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {}
    const pick = [fromUrl, saved].find((c) => CHOICES.some((x) => x.id === c)) as Choice | undefined
    setChoice(pick ?? 'silk')
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement | null)?.closest('input, textarea')) return
      const n = Number(e.key)
      if (n >= 1 && n <= CHOICES.length) choose(CHOICES[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function choose(c: Choice) {
    setChoice(c)
    try {
      localStorage.setItem(KEY, c)
    } catch {}
  }

  // The panes' link colour and grid size, whichever scene is drawing.
  useEffect(() => {
    document.documentElement.dataset.palette = place.palette
  }, [place.palette])
  useEffect(() => {
    const root = document.documentElement
    const size = () => {
      const cell = innerWidth < 640 ? 16 : 18
      root.style.setProperty('--cell', `${cell}px`)
      root.style.setProperty('--cols', String(Math.floor(innerWidth / cell)))
    }
    size()
    window.addEventListener('resize', size)
    return () => window.removeEventListener('resize', size)
  }, [])

  return (
    <>
      {choice === 'dither' && <Field sources={sources} names={names} />}
      {choice === 'silk' && <Silk palette={place.palette} />}
      {choice === 'lines' && <Lines palette={place.palette} />}
      {choice === 'orbit' && <Orbit palette={place.palette} />}
      {choice === 'lattice' && <Lattice palette={place.palette} />}
      {choice === 'ridges' && (
        <Ridges palette={place.palette} heat={place.heat} sources={sources} />
      )}
      {lab && (
        <div className="lab-switch" role="toolbar" aria-label="Background">
          {CHOICES.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={choice === c.id}
              onClick={() => choose(c.id)}
            >
              <span>{i + 1}</span>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
