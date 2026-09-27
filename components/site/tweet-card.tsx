import { LIVE } from '@/lib/generated/live'
import { postText } from '@/lib/x-text'
import { RelTime } from './rel-time'

/** My latest post on X, as plain text. Refreshed every build. */
export function TweetCard() {
  const post = LIVE.x?.posts[0]
  if (!post) return null

  return (
    <a className="tweet" href={post.url} aria-label="My latest post on X">
      <span className="tweet-top">
        <span>Latest on X</span>
        <RelTime iso={post.createdAt} />
        <span className="tweet-go" aria-hidden="true">
          ↗
        </span>
      </span>
      <span className="tweet-text">{postText(post.text)}</span>
    </a>
  )
}
