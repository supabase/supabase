// 'use client'
import { users } from './utils'
import { AvatarStack } from '@/registry/default/blocks/realtime-avatar-stack/components/avatar-stack'

const avatars = users.filter(
  (u) =>
    u.name === 'Mark S.' || u.name === 'Helly R.' || u.name === 'Irving B.' || u.name === 'Dylan G.'
)

const CurrentUserAvatarPreview = () => {
  return <AvatarStack avatars={avatars} />
}

export default CurrentUserAvatarPreview
