import type { Metadata } from 'next'
import { Avatar } from '@/components/site/avatar'
import { RelTime } from '@/components/site/rel-time'
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
            {x?.verified && (
              <svg
                className="verified"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                role="img"
                aria-label="Verified on X"
              >
                <path
                  fill="currentColor"
                  d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
                />
              </svg>
            )}
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
