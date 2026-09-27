import { LIVE } from '@/lib/generated/live'
import { RelTime } from './rel-time'

// X appends t.co links for media and quoted posts; they read as noise here.
function clean(text: string) {
  return text.replace(/\s*https:\/\/t\.co\/\w+\s*$/g, '').trim()
}

/** My newest post on X, refreshed every build. Replaces the old Now line. */
export function LatestPost() {
  const post = LIVE.x?.posts[0]

  if (!post) return null

  return (
    <a className="latest-post" href={post.url}>
      <span className="lp-head">
        Latest on X · <RelTime iso={post.createdAt} />
      </span>
      <span className="lp-text">{clean(post.text)}</span>
    </a>
  )
}
