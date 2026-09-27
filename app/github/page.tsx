import type { Metadata } from 'next'
import { Avatar } from '@/components/site/avatar'
import { ContributionGrid } from '@/components/site/contribution-grid'
import { LastPush } from '@/components/site/last-push'
import { LIVE } from '@/lib/generated/live'
import { latestProject, mostActive } from '@/lib/live'
import { GITHUB_USER, projectRefs } from '../signals'

export const metadata: Metadata = {
  title: 'GitHub',
  description: 'Kuladeep Mantri on GitHub: recent contributions and languages.',
  alternates: { canonical: '/github' },
}

export default function GitHub() {
  const gh = LIVE.github
  const projects = projectRefs()
  const active = mostActive(projects, gh?.repos)
  const latest = latestProject(projects, gh?.repos)
  const langTotal = gh?.languages.reduce((s, l) => s + l.bytes, 0) ?? 0

  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>Kuladeep Mantri</span>
          <span>@{GITHUB_USER} on GitHub</span>
        </span>
        <a className="pill" href={`https://github.com/${GITHUB_USER}`}>
          Follow
        </a>
      </div>
      <h2 className="sr-only">GitHub</h2>

      {gh ? (
        <>
          <div className="facts">
            <span className="fact big">
              <span>Contributions, last year</span>
              <span>{gh.totalContributions.toLocaleString('en-US')}</span>
            </span>
            {active ? (
              <span className="fact big">
                <span>Most active this month</span>
                <span>{active.name}</span>
              </span>
            ) : (
              <span className="fact big">
                <span>Latest project</span>
                <span>{latest?.project.name ?? 'None yet'}</span>
              </span>
            )}
            <span className="fact big desk-only">
              <span>Last push</span>
              <LastPush projects={projects} />
            </span>
          </div>

          <h3 className="lab section-lab">Recent contributions</h3>
          <div className="grid-wrap">
            <ContributionGrid weeks={gh.weeks} total={gh.totalContributions} />
          </div>

          {gh.languages.length > 0 && (
            <>
              <h3 className="lab section-lab">Languages</h3>
              <div className="langbar" aria-hidden="true">
                {gh.languages.map((l, i) => (
                  <div
                    key={l.name}
                    className={`q${4 - i}`}
                    style={{ width: `${(l.bytes / langTotal) * 100}%` }}
                  />
                ))}
              </div>
              <div className="legend">
                {gh.languages.map((l, i) => (
                  <span key={l.name}>
                    <i className={`q${4 - i}`} aria-hidden="true" />
                    {l.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="p-note">GitHub data didn’t load for this build. The profile has everything.</p>
      )}
    </article>
  )
}
