import { LIVE } from './generated/live'

/** Every day with GitHub contributions in the last year, from the calendar. */
export function allDays(): [string, number][] {
  return (LIVE.github?.weeks ?? [])
    .flat()
    .filter((d) => d.count > 0)
    .map((d) => [d.date, d.count])
}
