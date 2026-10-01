'use client'

import { clock, postStamp, stamp, zone } from '@/lib/live'
import { useLive } from '@/lib/live-store'

/**
 * Class for anything that shows a clock or a relative time. The prerendered
 * HTML holds build-time values, so `.live-t` stays transparent until the
 * browser clock has taken over (`.is-ready`). `.live-clock` marks wall-clock
 * times, which stay hidden without JavaScript; relative times show anyway.
 */
function liveClass(ready: boolean, wallClock = false): string {
  return `live-t${wallClock ? ' live-clock' : ''}${ready ? ' is-ready' : ''}`
}

/** A timestamp that keeps itself current: "20h ago" on slides, "20h" on posts. */
export function Stamp({
  iso,
  form = 'slide',
  className,
}: {
  iso: string
  form?: 'slide' | 'post'
  className?: string
}) {
  const { now, ready } = useLive()
  return (
    <time
      dateTime={iso}
      className={`${className ? `${className} ` : ''}${liveClass(ready)}`}
      suppressHydrationWarning
    >
      {form === 'post' ? postStamp(iso, now) : stamp(iso, now)}
    </time>
  )
}

/** Local time in Michigan, "8:02 PM", and its zone, "EDT". */
export function LocalTime() {
  const { now, ready } = useLive()
  return (
    <div className={liveClass(ready, true)} suppressHydrationWarning>
      <div className="time">{clock(now)}</div>
      <div className="mute">Michigan, {zone(now)}</div>
    </div>
  )
}
