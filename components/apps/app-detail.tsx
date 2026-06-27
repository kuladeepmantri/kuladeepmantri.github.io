'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { AppProject, Signal } from '@/app/signals'
import { STATE_LABEL } from '@/app/signals'
import { DeviceFrame } from '@/components/ui/device-frame'
import { formatSignalDate } from '@/lib/format-date'
import { activitySummary, getRepoData } from '@/lib/github'

function RawView({ signal }: { signal: Signal }) {
  const { repos, signatureRef, image, video, embedUrl, ...rest } = signal
  const compact = {
    ...rest,
    repos: repos,
    signatureRef,
    hasMedia: Boolean(image || video || embedUrl),
  }
  const text = JSON.stringify(compact, null, 2)
  return (
    <pre className="mt-6 overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[12px] leading-[1.6] text-[var(--text-secondary)]">
      <code>{text}</code>
    </pre>
  )
}

export function AppDetail({ app }: { app: AppProject }) {
  const [raw, setRaw] = useState(false)
  const activity = activitySummary(app.repos[0])
  const repoData = getRepoData(app.repos[0])

  return (
    <div className="mx-auto max-w-[680px] px-5 pb-12">
      {/* Back link */}
      <Link
        href="/"
        aria-label="Back to log"
        className="mb-6 inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        [← log]
      </Link>

      {/* Header: KM-YYYY-NNNN · state · dates · activity */}
      <header className="space-y-2.5 border-b border-[var(--border)] pb-6">
        <div className="flex flex-wrap items-center gap-x-2 text-[12px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
          <span>{app.id}</span>
          <span aria-hidden>·</span>
          <span data-state={app.state}>
            {STATE_LABEL[app.state].toLowerCase()}
          </span>
          <span aria-hidden>·</span>
          <span>
            {formatSignalDate(app.dateFirst)} &rarr;{' '}
            {formatSignalDate(app.dateLast)}
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-[var(--text)]">
          {app.name}
        </h1>
        <p className="text-[15px] font-semibold text-[var(--text-secondary)]">
          {app.tagline.toLowerCase()}
        </p>
        {app.collaborator && (
          <p className="text-[13px] text-[var(--text-muted)]">
            with{' '}
            <a
              href={app.collaborator.github}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-[3px] transition-colors hover:text-[var(--text)]"
            >
              {app.collaborator.name}
            </a>
          </p>
        )}
      </header>

      {/* Action row — bracket syntax consistent with log */}
      <div className="mt-4 flex flex-wrap items-center gap-x-1 text-[12.5px] text-[var(--text-muted)]">
        {app.link && (
          <>
            <a
              href={app.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${app.name} live`}
              className="transition-colors hover:text-[var(--text)]"
            >
              [live]
            </a>
            <span className="opacity-50">·</span>
          </>
        )}
        {app.repos.length > 0 && (
          <>
            <a
              href={`https://github.com/${app.repos[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${app.name} source on GitHub`}
              className="transition-colors hover:text-[var(--text)]"
            >
              [src]
            </a>
            <span className="opacity-50">·</span>
          </>
        )}
        <button
          onClick={() => setRaw((r) => !r)}
          aria-pressed={raw}
          aria-label="Toggle raw view of this entry"
          className="transition-colors hover:text-[var(--text)]"
        >
          {raw ? '[view]' : '[raw]'}
        </button>
        {activity && (
          <span className="ml-auto text-[11px] text-[var(--status-active)]">
            {activity}
          </span>
        )}
      </div>

      {raw ? (
        <RawView signal={app as Signal} />
      ) : (
        <>
          {/* Body */}
          <section className="mt-6 text-[15px] leading-[1.7] text-[var(--text-secondary)]">
            <p>{app.description}</p>
          </section>

          {/* Advisory block (security findings only) */}
          {app.advisory && (
            <section className="mt-8 border-t border-[var(--border)] pt-6">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                advisory
              </h2>
              <dl className="space-y-4 text-[14px]">
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    affected systems
                  </dt>
                  <dd className="mt-1 text-[var(--text-secondary)]">
                    <ul className="list-inside list-disc space-y-0.5">
                      {app.advisory.affectedSystems.map((sys) => (
                        <li key={sys}>{sys}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    impact
                  </dt>
                  <dd className="mt-1 leading-[1.7] text-[var(--text-secondary)]">
                    {app.advisory.impact}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    mitigation
                  </dt>
                  <dd className="mt-1 leading-[1.7] text-[var(--text-secondary)]">
                    {app.advisory.mitigation}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {/* Media — iframe embed (Rune) or DeviceFrame (image/video) */}
          {(app.embedUrl || app.image || app.video) && (
            <section className="mt-8 border-t border-[var(--border)] pt-6">
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                preview
              </h2>
              {app.embedUrl ? (
                <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex h-8 items-center gap-2 border-b border-[var(--border)] px-3 font-[var(--font-mono)] text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--status-active)]">&bull;</span>
                    <span>
                      {app.embedUrl
                        .replace(/^https?:\/\//, '')
                        .replace(/\/$/, '')}
                    </span>
                  </div>
                  <iframe
                    src={app.embedUrl}
                    title={app.name}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full border-0"
                    style={{ height: 'min(60vh, 560px)' }}
                  />
                </div>
              ) : (
                <DeviceFrame
                  type={app.deviceType}
                  imageSrc={app.image}
                  videoSrc={app.video}
                  appName={app.name}
                />
              )}
            </section>
          )}

          {/* Stack */}
          <section className="mt-8 border-t border-[var(--border)] pt-6">
            <h2 className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              stack
            </h2>
            <div className="flex flex-wrap gap-x-1.5 gap-y-2 text-[12px] text-[var(--text-secondary)]">
              {app.tags.map((tag, i) => (
                <span key={tag} className="inline-flex items-center">
                  {i > 0 && (
                    <span aria-hidden className="mr-1.5 opacity-50">
                      ·
                    </span>
                  )}
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Recent commits (from build-time GitHub fetch) */}
          {repoData && !repoData.error && repoData.recentCommits.length > 0 && (
            <section className="mt-8 border-t border-[var(--border)] pt-6">
              <h2 className="mb-3 flex items-baseline justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                <span>recent commits</span>
                <a
                  href={`https://github.com/${repoData.repo}/commits`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="normal-case tracking-normal text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                >
                  [all]
                </a>
              </h2>
              <ul className="space-y-1.5 text-[13px]">
                {repoData.recentCommits.slice(0, 6).map((c) => (
                  <li
                    key={c.sha}
                    className="grid grid-cols-[auto_1fr] gap-x-3"
                  >
                    <a
                      href={`https://github.com/${repoData.repo}/commit/${c.sha}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                    >
                      {c.sha}
                    </a>
                    <span className="truncate text-[var(--text-secondary)]">
                      {c.message}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
