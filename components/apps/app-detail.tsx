'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, ExternalLink, Users } from 'lucide-react'
import { STATUS_DOT, STATUS_LABEL } from '@/app/data'
import type { AppProject } from '@/app/data'
import { DeviceFrame } from '@/components/ui/device-frame'

export function AppDetail({ app }: { app: AppProject }) {
  return (
    <div>
      {/* Back link */}
      <Link
        href="/apps"
        className="mb-8 flex items-center gap-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        All Projects
      </Link>

      {/* Hero area */}
      <div className="relative pt-8 pb-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${app.accentColor}15 0%, transparent 70%)`,
          }}
        />

        <div className="relative text-center">
          <motion.h1
            className="text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {app.name}
          </motion.h1>

          <motion.p
            className="mt-3 text-lg sm:text-xl"
            style={{ color: app.accentColor }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {app.tagline}
          </motion.p>

          {/* Status + collaborator */}
          <motion.div
            className="mt-4 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <span className="inline-flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${STATUS_DOT[app.status]}`}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                {STATUS_LABEL[app.status]}
              </span>
            </span>

            {app.collaborator && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Users size={14} />
                with{' '}
                <a
                  href={app.collaborator.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-[var(--text)]"
                >
                  {app.collaborator.name}
                </a>
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Device mockup / Embed */}
      <div className="mt-12 flex justify-center sm:mt-16">
        <motion.div
          className={app.embedUrl ? 'w-full' : app.deviceType === 'browser' ? 'w-full max-w-3xl' : ''}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {app.embedUrl ? (
            <div
              className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
              style={{
                boxShadow: `0 20px 60px -10px ${app.accentColor}25`,
              }}
            >
              {/* Browser chrome */}
              <div className="flex h-10 items-center border-b border-zinc-700 px-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-4 flex-1">
                  <div className="mx-auto h-6 max-w-xs rounded-md bg-zinc-800 px-3 text-center text-[11px] leading-6 text-zinc-500">
                    {app.embedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </div>
                </div>
              </div>
              {/* Iframe */}
              <iframe
                src={app.embedUrl}
                title={app.name}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                className="w-full border-0"
                style={{ height: 'min(75vh, 700px)' }}
              />
            </div>
          ) : (
            <DeviceFrame
              type={app.deviceType}
              imageSrc={app.image}
              videoSrc={app.video}
              appName={app.name}
              accentColor={app.accentColor}
            />
          )}
        </motion.div>
      </div>

      {/* Description */}
      <motion.p
        className="mx-auto mt-12 max-w-3xl text-center text-base leading-relaxed text-[var(--text-secondary)] sm:mt-16 sm:text-lg"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {app.description}
      </motion.p>

      {/* Tech tags */}
      <motion.div
        className="mt-8 flex flex-wrap justify-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {app.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {app.link ? (
          <a
            href={app.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--bg)] transition-colors hover:opacity-90"
          >
            Visit Project
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-[var(--border)] px-6 py-3 text-[var(--text-muted)]">
            Personal Project
          </span>
        )}
      </motion.div>
    </div>
  )
}
