// Repos that never count toward anything on the page: this site, the profile
// README, and an old coursework repo whose stars are not project work.
//
// Build-time only. scripts/fetch-live.ts (and the tests) import this; nothing
// the browser loads may, so these names never reach the client bundle. The
// page never needs them: it only looks at SIGNALS project repos.

import { GITHUB_USER } from '../app/signals'

export const SKIP_REPOS = [
  `${GITHUB_USER}/${GITHUB_USER}.github.io`,
  `${GITHUB_USER}/${GITHUB_USER}`,
  `${GITHUB_USER}/InternProjects`,
].map((r) => r.toLowerCase())

export function isSkippedRepo(repo: string): boolean {
  return SKIP_REPOS.includes(repo.toLowerCase())
}
