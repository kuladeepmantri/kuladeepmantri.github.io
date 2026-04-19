/**
 * Stable consumer-facing API over the auto-generated `lib/generated/github.ts`.
 * If the generated file is missing (first-run dev, no network during CI, etc.)
 * we degrade to an empty map so nothing throws.
 */
import type { RepoData } from './generated/github'
import { GITHUB_DATA } from './generated/github'

export type { RepoCommit, RepoData } from './generated/github'

export function getRepoData(repo: string | undefined): RepoData | undefined {
  if (!repo) return undefined
  return GITHUB_DATA[repo]
}

/**
 * Human-readable summary of repo activity. Returns null when there's nothing
 * worth showing (no repos, no recent commits, or an errored fetch).
 */
export function activitySummary(repo: string | undefined): string | null {
  const data = getRepoData(repo)
  if (!data || data.error) return null
  if (data.commits7d > 0) {
    return `${data.commits7d} commit${data.commits7d === 1 ? '' : 's'} this week`
  }
  if (data.commits30d > 0) {
    return `${data.commits30d} commit${data.commits30d === 1 ? '' : 's'} this month`
  }
  if (data.openPRs > 0) {
    return `${data.openPRs} open PR${data.openPRs === 1 ? '' : 's'}`
  }
  return null
}

export { GITHUB_DATA }
