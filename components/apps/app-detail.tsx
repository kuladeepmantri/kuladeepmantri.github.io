'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowLeft, ExternalLink, Users } from 'lucide-react'
import type { AppProject } from '@/app/data'
import { DeviceFrame } from '@/components/ui/device-frame'

const STATUS_DOT: Record<AppProject['status'], string> = {
  live: 'bg-emerald-400',
  beta: 'bg-yellow-400',
  building: 'bg-zinc-500',
  personal: 'bg-violet-400',
}

const STATUS_LABEL: Record<AppProject['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  building: 'In Development',
  personal: 'Personal Use',
}

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

      {/* Device mockup */}
      <div className="mt-12 flex justify-center sm:mt-16">
        <motion.div
          className={app.deviceType === 'browser' ? 'w-full max-w-3xl' : ''}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <DeviceFrame
            type={app.deviceType}
            imageSrc={app.image}
            videoSrc={app.video}
            appName={app.name}
            accentColor={app.accentColor}
          />
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
