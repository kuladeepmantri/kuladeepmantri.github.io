import { X_HANDLE } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { postText } from '@/lib/x-text'
import { Avatar } from './avatar'
import { XLogo } from './icons'
import { RelTime } from './rel-time'
import { Verified } from './verified'

/** My latest post on X, compact, in the home pane. Refreshed every build. */
export function TweetCard() {
  const x = LIVE.x
  const post = x?.posts[0]
  if (!post) return null
  return (
    <a className="tweet" href={post.url} aria-label="My latest post on X">
      <span className="tweet-head">
        <Avatar size={28} />
        <span className="tweet-who">
          <span className="tweet-name">
            {x.name || 'Kuladeep Mantri'}
            {x.verified && <Verified size={13} />}
          </span>
          <span className="tweet-meta">
            @{X_HANDLE} · <RelTime iso={post.createdAt} />
          </span>
        </span>
        <XLogo />
      </span>
      <span className="tweet-text">{postText(post.text).replace(/\s*\n+\s*/g, ' ')}</span>
    </a>
  )
}
