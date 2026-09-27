import { X_HANDLE } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { postText } from '@/lib/x-text'
import { Avatar } from './avatar'
import { RelTime } from './rel-time'
import { Verified } from './verified'

/** My latest post on X, set as a pull quote. Refreshed every build. */
export function TweetCard() {
  const x = LIVE.x
  const post = x?.posts[0]
  if (!post) return null

  return (
    <a className="tweet" href={post.url} aria-label="My latest post on X">
      <span className="tweet-top">
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
        <span>Latest on X</span>
        <span aria-hidden="true">·</span>
        <RelTime iso={post.createdAt} />
        <span className="tweet-go" aria-hidden="true">
          ↗
        </span>
      </span>
      <span className="tweet-text">{postText(post.text)}</span>
      <span className="tweet-by">
        <Avatar size={28} />
        <span className="tweet-name">
          {x.name || 'Kuladeep Mantri'}
          {x.verified && <Verified size={15} />}
        </span>
        <span className="tweet-handle">@{X_HANDLE}</span>
      </span>
    </a>
  )
}
