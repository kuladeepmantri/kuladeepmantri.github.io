'use client'

import { useState, useRef, useCallback } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from 'motion/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PROJECTS, EMAIL, SOCIAL_LINKS, CERTIFICATIONS } from './data'
import { DeviceFrame } from '@/components/ui/device-frame'
import {
  Check,
  Github,
  Instagram,
  ArrowUpRight,
  Users,
  ExternalLink,
} from 'lucide-react'
import type { AppProject } from './data'

// ── Helpers ──

function getStripLabel(project: AppProject): string {
  if (project.collaborator) return `with ${project.collaborator.name}`
  if (project.status === 'live') return 'Live'
  if (project.status === 'personal') return 'Personal Use'
  return 'In Development'
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.lastIndexOf(' ', max)
  return text.slice(0, cut > 0 ? cut : max) + '...'
}

// ── Project Strip ──

function ProjectStrip({
  project,
  onActive,
}: {
  project: AppProject
  onActive: (color: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 85%', 'start 30%'],
  })

  const height = useTransform(scrollYProgress, [0, 1], [70, 580])
  const contentOpacity = useTransform(scrollYProgress, [0.55, 0.85], [0, 1])
  const accentWidth = useTransform(scrollYProgress, [0, 1], ['40px', '100%'])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (v > 0.1 && v < 0.95) {
      onActive(project.accentColor)
    }
  })

  const label = getStripLabel(project)

  return (
    <div ref={ref}>
      <motion.div
        style={{ height }}
        className="relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] transition-colors hover:border-[var(--border-hover)]"
        onClick={() => router.push(`/apps/${project.id}`)}
      >
        {/* Collapsed header */}
        <div className="flex h-[70px] items-center justify-between px-6 sm:px-8">
          <h3 className="text-lg font-bold sm:text-xl">{project.name}</h3>
          <div className="flex items-center gap-3">
            {project.collaborator && (
              <Users size={12} className="text-[var(--text-muted)]" />
            )}
            <span className="text-xs text-[var(--text-muted)]">{label}</span>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: project.accentColor }}
            />
          </div>
        </div>

        {/* Accent line */}
        <motion.div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{
            width: accentWidth,
            backgroundColor: project.accentColor,
          }}
        />

        {/* Expanded content */}
        <motion.div
          className="flex flex-col-reverse gap-6 px-6 pb-8 sm:grid sm:grid-cols-2 sm:px-8"
          style={{ opacity: contentOpacity }}
        >
          {/* Device Frame */}
          <div className="flex items-center justify-center">
            <div
              className={
                project.deviceType === 'iphone'
                  ? 'w-full max-w-[240px]'
                  : 'w-full'
              }
              style={{
                filter: `drop-shadow(0 0 30px ${project.accentColor}20)`,
              }}
            >
              <DeviceFrame
                type={project.deviceType}
                imageSrc={project.image}
                videoSrc={project.video}
                appName={project.name}
                accentColor={project.accentColor}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <h4 className="text-2xl font-bold">{project.name}</h4>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {project.tagline}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {truncate(project.description, 150)}
            </p>

            {project.collaborator && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Users size={12} />
                with{' '}
                <a
                  href={project.collaborator.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-[var(--text)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.collaborator.name}
                </a>
              </p>
            )}

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={10} />
                Visit site
              </a>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              View project <ArrowUpRight size={14} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ── Home Page ──

export default function Home() {
  const [emailCopied, setEmailCopied] = useState(false)
  const [activeColor, setActiveColor] = useState('transparent')

  // Glow reset when scrolling past all strips
  const stripsRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: stripsProgress } = useScroll({
    target: stripsRef,
    offset: ['end 60%', 'end 20%'],
  })

  useMotionValueEvent(stripsProgress, 'change', (v) => {
    if (v > 0.8) setActiveColor('transparent')
  })

  const handleProjectActive = useCallback((color: string) => {
    setActiveColor(color)
  }, [])

  function copyEmail() {
    navigator.clipboard.writeText(EMAIL)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  return (
    <>
      {/* Background color bleed */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 transition-all duration-[600ms]"
        style={{
          background:
            activeColor !== 'transparent'
              ? `radial-gradient(ellipse 80% 50% at 50% 50%, ${activeColor}12 0%, transparent 70%)`
              : 'transparent',
        }}
      />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-16 sm:pt-40">
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--text) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
          {/* Name + Bio row */}
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            {/* Left: Name + Subtitle */}
            <div>
              <motion.h1
                className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-[8rem] lg:leading-[0.9]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
              >
                Kuladeep
                <br />
                <span className="text-[var(--text-secondary)]">Mantri</span>
              </motion.h1>

              <motion.p
                className="mt-4 text-sm tracking-[0.2em] uppercase text-[var(--text-muted)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2,
                  ease: [0.25, 0.1, 0, 1],
                }}
              >
                Security Engineer &amp; Software Developer
              </motion.p>
            </div>

            {/* Right: Bio + CEH */}
            <motion.div
              className="sm:max-w-xs sm:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                ease: [0.25, 0.1, 0, 1],
              }}
            >
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                Curious about how things work, and how they can work
                better.
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {CERTIFICATIONS[0].name}, {CERTIFICATIONS[0].issuer}
              </p>
            </motion.div>
          </div>

          {/* Photo */}
          <motion.div
            className="relative mt-10 h-56 overflow-hidden rounded-2xl sm:h-72 lg:h-80"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.6,
              ease: [0.25, 0.1, 0, 1],
            }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{
                duration: 1.8,
                delay: 0.6,
                ease: [0.25, 0.1, 0, 1],
              }}
            >
              <Image
                src="/images/1.JPG"
                alt="Kuladeep Mantri"
                fill
                className="object-cover"
                style={{
                  objectPosition: 'center 35%',
                  filter: 'grayscale(1) brightness(0.7) contrast(1.1)',
                }}
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </motion.div>

            {/* Inset shadow for edge blending */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] rounded-2xl"
              style={{
                boxShadow: 'inset 0 0 60px rgba(5,5,5,0.5)',
              }}
            />
          </motion.div>

        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="relative z-10 mx-auto max-w-5xl space-y-24 px-5 pb-32 sm:px-8">
        {/* ─── Project Strips ─── */}
        <section ref={stripsRef} className="space-y-4">
          {PROJECTS.map((project) => (
            <ProjectStrip
              key={project.id}
              project={project}
              onActive={handleProjectActive}
            />
          ))}
        </section>

        {/* ─── Contact ─── */}
        <section className="flex flex-col items-center gap-6 py-16 text-center">
          <motion.button
            onClick={copyEmail}
            className="text-2xl font-bold transition-colors hover:text-[var(--text-secondary)] sm:text-4xl"
            whileTap={{ scale: 0.95 }}
          >
            {emailCopied ? (
              <motion.span
                className="flex items-center gap-3 text-green-400"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Check size={24} /> Copied!
              </motion.span>
            ) : (
              EMAIL
            )}
          </motion.button>
          <p className="text-sm text-[var(--text-muted)]">Click to copy</p>

          <div className="flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
              >
                {social.label === 'GitHub' ? (
                  <Github size={18} />
                ) : (
                  <Instagram size={18} />
                )}
              </a>
            ))}
          </div>

          <p className="mt-8 text-xs text-[var(--text-muted)]">
            &copy; 2026 Kuladeep Mantri
          </p>
        </section>
      </div>
    </>
  )
}
