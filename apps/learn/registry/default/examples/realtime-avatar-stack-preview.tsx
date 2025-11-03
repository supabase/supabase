// 'use client'

import { AvatarStack } from '@/registry/default/blocks/realtime-avatar-stack/components/avatar-stack'
import { TooltipProvider } from '@/registry/default/components/ui/tooltip'
import { users } from './utils'

const avatars = users.filter(
  (u) =>
    u.name === 'Mark S.' || u.name === 'Helly R.' || u.name === 'Irving B.' || u.name === 'Dylan G.'
)

const CurrentUserAvatarPreview = () => {
  return (
    <TooltipProvider delayDuration={0}>
      <AvatarStack avatars={avatars} />
    </TooltipProvider>
  )
}

export default CurrentUserAvatarPreview
