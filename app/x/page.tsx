import type { Metadata } from 'next'
import { Avatar } from '@/components/site/avatar'
import { RelTime } from '@/components/site/rel-time'
import { Verified } from '@/components/site/verified'
import { LIVE } from '@/lib/generated/live'
import { X_HANDLE } from '../signals'

export const metadata: Metadata = {
  title: 'X',
  description: 'Kuladeep Mantri on X: latest posts.',
  alternates: { canonical: '/x' },
}

export default function XPane() {
  const x = LIVE.x
  const follow = `https://x.com/${X_HANDLE}`

  return (
    <article className="p-body">
      <div className="profile">
        <Avatar size={64} />
        <span className="profile-name">
          <span>
            {x?.name || 'Kuladeep Mantri'}
            {x?.verified && <Verified />}
          </span>
          <span>@{X_HANDLE} on X</span>
        </span>
        <a className="pill" href={follow}>
          Follow
        </a>
      </div>
      <h2 className="sr-only">X</h2>

      {x && x.bio && <p className="bio">{x.bio}</p>}

      {x && x.posts.length > 0 ? (
        <>
          <h3 className="lab" style={{ padding: '32px 0 6px' }}>
            Latest posts
          </h3>
          {x.posts.map((p) => (
            <a key={p.id} href={p.url} className="post">
              <span className="post-text">{p.text}</span>
              <span className="post-ago">
                <RelTime iso={p.createdAt} />
              </span>
            </a>
          ))}
        </>
      ) : null}
    </article>
  )
}
