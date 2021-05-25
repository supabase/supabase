import { Profile } from '../lib/constants'
import Avatar from './Avatar'

export default function ProfileCard({ profile }: { profile: Profile }) {
  const lastUpdated = profile.updated_at ? new Date(profile.updated_at) : null
  return (
    <div className="profileCard">
      <Avatar url={profile.avatar_url} size={100} />
      <div className="userInfo">
        <p className="username">{profile.username}</p>
        <a className="website" href={profile.website} target="_blank">
          {profile.website}
        </a>
        <p>
          <small>
            Last updated{' '}
            {lastUpdated
              ? `${lastUpdated.toLocaleDateString()} ${lastUpdated.toLocaleTimeString()}`
              : 'Never'}
          </small>
        </p>
      </div>
      <div />
    </div>
  )
}
