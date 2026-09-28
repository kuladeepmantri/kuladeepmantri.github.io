import { X_HANDLE } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { postText, readable } from '@/lib/x-text'
import { Avatar } from './avatar'
import { XLogo } from './icons'
import { RelTime } from './rel-time'
import { Verified } from './verified'

/** My latest post on X with text, compact, in the home pane. Refreshed every build. */
export function TweetCard() {
  const x = LIVE.x
  const post = readable(x?.posts ?? [])[0]
  if (!x || !post) return null
  return (
    <a className="tweet" href={post.url}>
      <span className="sr-only">My latest post on X: </span>
      <span className="tweet-head">
        <Avatar size={28} />
        <span className="tweet-who">
          <span className="tweet-name">
            {x.name || 'Kuladeep Mantri'}
            {x.verified && <Verified size={13} />}
          </span>
          <span className="tweet-meta">
            <span className="tweet-handle">@{X_HANDLE}</span>
            <span aria-hidden="true">·</span>
            <RelTime iso={post.createdAt} />
          </span>
        </span>
        <XLogo />
      </span>
      <span className="tweet-text">{postText(post.text).replace(/\n\s*\n+/g, '\n')}</span>
    </a>
  )
}
