'use client'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type DeviceFrameProps = {
  type: 'iphone' | 'browser'
  imageSrc: string | null
  videoSrc?: string | null
  embedUrl?: string | null
  appName: string
  interactive?: boolean
  className?: string
}

function IPhoneFrame({
  imageSrc,
  videoSrc,
  appName,
}: Omit<DeviceFrameProps, 'type' | 'className'>) {
  return (
    <div className="mx-auto w-[260px] sm:w-[280px]">
      <div className="relative rounded-[2.5rem] border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
        {/* Dynamic island */}
        <div className="absolute top-4 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        {/* Screen */}
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2rem] bg-black">
          {videoSrc ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              style={{ objectPosition: 'center 15%', transform: 'scale(1.05)' }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : imageSrc ? (
            <Image
              src={imageSrc}
              alt={appName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-subtle)]">
              <span className="text-sm text-[var(--text-muted)]">{appName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BrowserFrame({
  imageSrc,
  videoSrc,
  embedUrl,
  appName,
  interactive,
}: Omit<DeviceFrameProps, 'type' | 'className'>) {
  const displayUrl = embedUrl
    ? embedUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${appName.toLowerCase().replace(/\s/g, '')}.com`

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Title bar */}
        <div className="flex h-10 items-center border-b border-zinc-700 px-4">
          <div className="flex gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--border-hover)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--border-hover)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--border-hover)]" />
          </div>
          <div className="mx-4 flex-1">
            <div className="mx-auto h-6 max-w-xs rounded-md bg-zinc-800 px-3 text-center text-[11px] leading-6 text-zinc-500">
              {displayUrl}
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="relative aspect-[16/10] bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={appName}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className="h-full w-full border-0"
              style={{ pointerEvents: interactive ? 'auto' : 'none' }}
            />
          ) : videoSrc ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover object-top"
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : imageSrc ? (
            <Image
              src={imageSrc}
              alt={appName}
              fill
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-[var(--bg-subtle)]">
              <span className="text-sm text-[var(--text-muted)]">{appName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function DeviceFrame({
  type,
  imageSrc,
  videoSrc,
  embedUrl,
  appName,
  interactive,
  className,
}: DeviceFrameProps) {
  return (
    <div className={cn('', className)}>
      {type === 'iphone' ? (
        <IPhoneFrame
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          appName={appName}
        />
      ) : (
        <BrowserFrame
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          embedUrl={embedUrl}
          appName={appName}
          interactive={interactive}
        />
      )}
    </div>
  )
}
