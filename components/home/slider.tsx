'use client'

import { useId, useState } from 'react'
import { latestCommit, plural, type Language, type Post } from '@/lib/live'
import { useLive } from '@/lib/live-store'
import { Chevron, GithubLogo, Rotation, Star, XLogo } from './icons'
import { Stamp } from './time'

export type ReleaseView = {
  name: string
  tag: string
  url: string
  publishedAt: string
  burst: string | null
  language: Language | null
  stars: number | null
  forks: number | null
  license: string | null
}

type Slide = {
  key: string
  label: string
  icon: React.ReactNode
  href: string
  when: string
  body: React.ReactNode
}

/**
 * The latest post, release, and commit, one at a time. Progress is a CSS
 * animation (6 s per slide) that pauses on hover and focus; its end moves to
 * the next slide. The pause button stops and restarts the rotation, moving
 * to a slide by hand stops it, and reduced motion never starts it
 * (globals.css removes the animation and hides the button).
 */
export function Slider({
  post,
  release,
  repos: projectRepos,
}: {
  post: Post | null
  release: ReleaseView | null
  repos: string[]
}) {
  const { repos, ready } = useLive()
  const id = useId()
  const [cur, setCur] = useState(0)
  // playing: the bar runs and advances. held: the pause button froze it where
  // it is. stopped: a slide was picked by hand, and the bar shows full.
  const [mode, setMode] = useState<'playing' | 'held' | 'stopped'>('playing')
  // Bumped on every move so the running bar remounts and its animation restarts.
  const [turn, setTurn] = useState(0)

  const commit = latestCommit([{ repos: projectRepos }], repos)
  const slides: Slide[] = []

  if (post)
    slides.push({
      key: 'post',
      label: 'Latest post',
      icon: <XLogo />,
      href: post.url,
      when: post.createdAt,
      body: <p className="post-text">{post.text}</p>,
    })

  if (release)
    slides.push({
      key: 'release',
      label: 'Latest release',
      icon: <GithubLogo />,
      href: release.url,
      when: release.publishedAt,
      body: (
        <>
          <div className="release-head">
            <span className="release-name">{release.name}</span>
            <span className="pill">{release.tag}</span>
          </div>
          {release.burst && <p className="mute release-burst">{release.burst}</p>}
          <div className="mono mute facts-row">
            {release.language && (
              <span>
                <span
                  className="ldot"
                  style={
                    release.language.color ? { background: release.language.color } : undefined
                  }
                  aria-hidden="true"
                />
                {release.language.name}
              </span>
            )}
            {release.stars !== null && (
              <span>
                <Star />
                {release.stars}
                <span className="sr-only"> {plural(release.stars, 'star')}</span>
              </span>
            )}
            {!!release.forks && (
              <span>
                {release.forks} {plural(release.forks, 'fork')}
              </span>
            )}
            {release.license && <span>{release.license}</span>}
          </div>
        </>
      ),
    })

  if (commit)
    slides.push({
      key: 'commit',
      label: 'Latest commit',
      icon: <GithubLogo />,
      href: commit.commit.url,
      when: commit.commit.date,
      body: (
        <>
          <p className="mono commit-msg">{commit.commit.message}</p>
          <div className="mono mute commit-meta">
            {/* Breaks only after the slash and before a dot, never inside a
                name or a count. */}
            {commit.repo.split('/')[0]}/<wbr />
            {commit.repo.split('/').slice(1).join('/')}
            {`\u00a0· ${commit.commit.sha.slice(0, 7)}`}
            {commit.count !== null &&
              commit.count > 1 &&
              `\u00a0· one\u00a0of\u00a0${commit.count}\u00a0commits`}
          </div>
        </>
      ),
    })

  const n = slides.length
  if (!n) return null
  const at = cur % n

  const go = (i: number, byHand: boolean) => {
    setCur((i + n) % n)
    setTurn((t) => t + 1)
    if (byHand) setMode('stopped')
  }
  // Pause freezes the running bar; play resumes it, or starts a fresh one
  // after a slide was picked by hand.
  const toggle = () => {
    if (mode === 'playing') return setMode('held')
    if (mode === 'stopped') setTurn((t) => t + 1)
    setMode('playing')
  }
  const playing = mode === 'playing'
  // The prerendered bar waits for hydration: before it, nothing would hear
  // the animation end, and a bar that already finished could never advance.
  const current = !ready && playing ? 'fill' : mode === 'stopped' ? 'fill done' : 'fill run'

  return (
    <div
      className={n > 1 ? 'slider' : 'slider single'}
      role="region"
      aria-roledescription="carousel"
      aria-label="Latest from X and GitHub"
    >
      <div className="slides" id={id} aria-live={playing ? 'off' : 'polite'}>
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={i === at ? 'slide' : 'slide is-off'}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}: ${s.label}`}
            inert={i !== at}
          >
            <a className="slide-link" href={s.href}>
              <div className="src">
                {s.icon}
                <span>{s.label}</span>
                <Stamp iso={s.when} className="when mono" />
              </div>
              {s.body}
            </a>
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="chrome">
          <div className="bars">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className="bar"
                aria-label={`Show slide ${i + 1}: ${s.label}`}
                aria-controls={id}
                aria-current={i === at ? 'true' : undefined}
                onClick={() => go(i, true)}
              >
                <span className="trk">
                  <span
                    key={i === at ? `run-${turn}` : 'idle'}
                    className={
                      i < at
                        ? 'fill done'
                        : i === at
                          ? `${current}${mode === 'held' ? ' held' : ''}`
                          : 'fill'
                    }
                    onAnimationEnd={
                      i === at && playing && ready ? () => go(at + 1, false) : undefined
                    }
                  />
                </span>
              </button>
            ))}
          </div>
          <span className="count mono mute" aria-hidden="true">
            {at + 1} / {n}
          </span>
          <div className="navs">
            <button
              type="button"
              className="nav rotation"
              aria-label={playing ? 'Stop automatic slide show' : 'Start automatic slide show'}
              aria-controls={id}
              onClick={toggle}
            >
              <Rotation playing={playing} />
            </button>
            <button
              type="button"
              className="nav"
              aria-label="Previous slide"
              aria-controls={id}
              onClick={() => go(at - 1, true)}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className="nav"
              aria-label="Next slide"
              aria-controls={id}
              onClick={() => go(at + 1, true)}
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
