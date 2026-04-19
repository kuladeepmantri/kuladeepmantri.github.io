/**
 * Date formatting for signal entries. Locale is pinned to en-US and the time
 * zone to UTC so the same ISO string renders identically on server, client,
 * and at build time — avoiding hydration mismatches.
 */

const MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * "Apr 2026" — anchors the ISO string to UTC noon so every parser (server,
 * client, build-time) lands on the same calendar day regardless of local TZ.
 * Avoids hydration mismatches for `YYYY-MM-DD` inputs that browsers would
 * otherwise parse as UTC midnight (silently west-shifted in PST).
 */
export function formatSignalDate(iso: string): string {
  const anchored = iso.length === 10 ? `${iso}T12:00:00Z` : iso
  return MONTH_YEAR.format(new Date(anchored))
}

/**
 * "2d ago", "3mo ago", "yesterday". Intended for client-side rendering against
 * a fresh `now`. Do not call from a pure server component that will hydrate
 * into a client component — the offset would shift between render phases.
 */
export function relativeDate(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  const diffMs = now.getTime() - then
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffMo = Math.floor(diffDay / 30)
  const diffYr = Math.floor(diffDay / 365)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 30) return `${diffDay}d ago`
  if (diffMo < 12) return `${diffMo}mo ago`
  return `${diffYr}y ago`
}
