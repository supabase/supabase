// 'use client'

import { AvatarStack } from '@/registry/default/blocks/realtime-avatar-stack/components/avatar-stack'
import { users } from './utils'

const avatars = users.filter(
  (u) =>
    u.name === 'Mark S.' || u.name === 'Helly R.' || u.name === 'Irving B.' || u.name === 'Dylan G.'
)

const CurrentUserAvatarPreview = () => {
  return <AvatarStack avatars={avatars} />
}

export default CurrentUserAvatarPreview
