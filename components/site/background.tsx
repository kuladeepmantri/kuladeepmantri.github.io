'use client'

import { useEffect, useState } from 'react'
import { Backdrop, type Mode } from './backdrop'
import { Wall, type Source } from './wall'

type Choice = 'tiles' | Mode

const CHOICES: { id: Choice; label: string }[] = [
  { id: 'tiles', label: 'Tiles' },
  { id: 'aurora', label: 'Aurora' },
  { id: 'contours', label: 'Contours' },
  { id: 'currents', label: 'Currents' },
  { id: 'signal', label: 'Signal' },
  { id: 'stars', label: 'Stars' },
  { id: 'dither', label: 'Dither' },
]

const KEY = 'km-bg'

/**
 * The site's background. On localhost a switcher (and keys 1 to 7) tries the
 * candidates in place; the published site always uses the tile wall.
 */
export function Background({ sources, builtAt }: { sources: Record<string, Source>; builtAt: string }) {
  const [lab, setLab] = useState(false)
  const [choice, setChoice] = useState<Choice>('tiles')

  useEffect(() => {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname)
    setLab(local)
    if (!local) return
    const fromUrl = new URLSearchParams(location.search).get('bg') as Choice | null
    let saved: Choice | null = null
    try {
      saved = localStorage.getItem(KEY) as Choice | null
    } catch {}
    const pick = [fromUrl, saved].find((c) => CHOICES.some((x) => x.id === c))
    if (pick) setChoice(pick)
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
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

  useEffect(() => {
    document.documentElement.dataset.bg = choice
  }, [choice])

  return (
    <>
      {choice === 'tiles' ? (
        <Wall sources={sources} builtAt={builtAt} />
      ) : (
        <Backdrop key={choice} mode={choice} sources={sources} />
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
