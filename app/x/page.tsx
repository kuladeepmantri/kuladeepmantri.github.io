import type { Metadata } from 'next'
import { pageMeta } from '@/lib/meta'
import { Avatar } from '@/components/site/avatar'
import { PaneHead } from '@/components/site/pane-head'
import { RelTime } from '@/components/site/rel-time'
import { Verified } from '@/components/site/verified'
import { LIVE } from '@/lib/generated/live'
import { postText, readable } from '@/lib/x-text'
import { X_HANDLE } from '../signals'

export const metadata: Metadata = pageMeta({
  title: 'X',
  description: 'Kuladeep Mantri on X: latest posts.',
  path: '/x',
})

export default function XPane() {
  const x = LIVE.x
  const posts = readable(x?.posts ?? [])
  return (
    <article>
      <PaneHead title="X" />
      <a className="who" href={`https://x.com/${X_HANDLE}`} rel="me">
        <Avatar size={48} />
        <div>
          <p className="who-name">
            {x?.name || 'Kuladeep Mantri'}
            {x?.verified && <Verified size={15} />}
          </p>
          <p className="muted">
            @{X_HANDLE} <span aria-hidden="true">↗</span>
          </p>
        </div>
      </a>
      {x?.bio && <p>{x.bio}</p>}
      {!posts.length && (
        <p className="muted">My posts didn’t load for this build. They’re all on X.</p>
      )}
      {posts.length > 0 && (
        <section>
          <h2 className="list-lab">Latest posts</h2>
          <ul className="posts">
            {posts.map((p) => (
              <li key={p.id}>
                <a href={p.url}>
                  <span className="post-text">{postText(p.text)}</span>
                  <span className="when">
                    <RelTime iso={p.createdAt} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
