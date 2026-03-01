'use client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion } from 'motion/react'

type DeviceFrameProps = {
  type: 'iphone' | 'browser'
  imageSrc: string | null
  videoSrc?: string | null
  appName: string
  accentColor: string
  className?: string
}

function IPhoneFrame({
  imageSrc,
  videoSrc,
  appName,
  accentColor,
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
            <div
              className="flex h-full w-full flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}20 0%, #09090b 50%, ${accentColor}10 100%)`,
              }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: accentColor }}
              >
                {appName}
              </span>
              <span className="mt-2 text-xs text-[var(--text-muted)]">
                Coming soon
              </span>
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
  appName,
  accentColor,
}: Omit<DeviceFrameProps, 'type' | 'className'>) {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Title bar */}
        <div className="flex h-10 items-center border-b border-zinc-700 px-4">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-4 flex-1">
            <div className="mx-auto h-6 max-w-xs rounded-md bg-zinc-800 px-3 text-center text-[11px] leading-6 text-zinc-500">
              {appName.toLowerCase().replace(/\s/g, '')}.com
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="relative aspect-[16/10] bg-black">
          {videoSrc ? (
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
            <div
              className="flex h-full w-full flex-col items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}15 0%, #09090b 50%, ${accentColor}08 100%)`,
              }}
            >
              <span
                className="text-3xl font-bold"
                style={{ color: accentColor }}
              >
                {appName}
              </span>
              <span className="mt-2 text-sm text-[var(--text-muted)]">
                Coming soon
              </span>
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
  appName,
  accentColor,
  className,
}: DeviceFrameProps) {
  return (
    <div style={{ perspective: 1000 }}>
    <motion.div
      className={cn('', className)}
      whileHover={{
        rotateY: type === 'iphone' ? -3 : -5,
        rotateX: 2,
        scale: 1.02,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {type === 'iphone' ? (
        <IPhoneFrame
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          appName={appName}
          accentColor={accentColor}
        />
      ) : (
        <BrowserFrame
          imageSrc={imageSrc}
          videoSrc={videoSrc}
          appName={appName}
          accentColor={accentColor}
        />
      )}
    </motion.div>
    </div>
  )
}
