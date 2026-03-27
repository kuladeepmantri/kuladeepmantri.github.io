'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'motion/react'
import { Users, ExternalLink } from 'lucide-react'
import { STATUS_DOT, STATUS_LABEL } from '@/app/data'
import { CarPreview } from '@/components/car-preview'
import type { AppProject } from '@/app/data'

type AppCardProps = {
  app: AppProject
  index: number
  variant?: 'featured' | 'compact'
}

export function AppCard({ app, index, variant = 'compact' }: AppCardProps) {
  const {
    id,
    name,
    tagline,
    description,
    image,
    video,
    embedUrl,
    accentColor,
    status,
    collaborator,
    link,
  } = app
  const [hovered, setHovered] = useState(false)

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <Link
          href={`/apps/${id}`}
          className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-[var(--border-hover)]"
          style={{
            boxShadow: hovered
              ? `0 8px 30px -5px ${accentColor}40`
              : 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {/* Image/Video/3D Preview */}
            <div className="relative aspect-[16/10] overflow-hidden">
              {embedUrl ? (
                <div className="h-full w-full" style={{ pointerEvents: 'none' }}>
                  <CarPreview />
                </div>
              ) : video ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                  style={{ objectPosition: 'center 15%' }}
                >
                  <source src={video} type="video/mp4" />
                </video>
              ) : image ? (
                <Image
                  src={image}
                  alt={name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="50vw"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}20, #0a0a0a 50%, ${accentColor}10)`,
                  }}
                >
                  <span
                    className="text-2xl font-bold"
                    style={{ color: accentColor }}
                  >
                    {name}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent" />
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center p-6">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                />
                <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-[var(--text-muted)]">
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <h3
                className="text-xl font-bold transition-colors"
                style={{ color: hovered ? accentColor : 'var(--text)' }}
              >
                {name}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {tagline}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                {description.length > 120
                  ? description.slice(0, Math.max(description.lastIndexOf(' ', 120), 80)) + '...'
                  : description}
              </p>

              {collaborator && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Users size={12} />
                  with{' '}
                  <a
                    href={collaborator.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-[var(--text)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {collaborator.name}
                  </a>
                </p>
              )}

              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={10} /> Visit site
                </a>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  // ── Compact variant ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link
        href={`/apps/${id}`}
        className="group block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] transition-all duration-300 hover:border-[var(--border-hover)]"
        style={{
          boxShadow: hovered ? `0 8px 30px -5px ${accentColor}40` : 'none',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          {embedUrl ? (
            <div className="h-full w-full" style={{ pointerEvents: 'none' }}>
              <CarPreview />
            </div>
          ) : image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20, #0a0a0a 50%, ${accentColor}10)`,
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: accentColor }}
              >
                {name}
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--bg-elevated)] to-transparent" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <span
              className="text-base font-semibold transition-colors"
              style={{ color: hovered ? accentColor : 'var(--text)' }}
            >
              {name}
            </span>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={10} /> Live
              </a>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {tagline}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
