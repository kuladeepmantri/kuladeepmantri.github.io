import { X_HANDLE } from '@/app/signals'
import { LIVE } from '@/lib/generated/live'
import { Avatar } from './avatar'
import { Verified } from './verified'

/** My X profile at the bottom of the left column: name, badge, bio, Follow. */
export function XCard() {
  const x = LIVE.x
  const profile = `https://x.com/${X_HANDLE}`
  return (
    <div className="x-card">
      <a className="x-card-who" href={profile}>
        <Avatar size={40} />
        <span className="x-card-name">
          <span>
            {x?.name || 'Kuladeep Mantri'}
            {x?.verified && <Verified size={14} />}
          </span>
          <span>@{X_HANDLE} on X</span>
        </span>
      </a>
      <a className="pill" href={profile}>
        Follow
      </a>
      {x?.bio && <p className="x-card-bio">{x.bio}</p>}
    </div>
  )
}
