'use client'

import { useCurrentUserImage } from '@/registry/default/blocks/current-user-avatar/hooks/use-current-user-image'
import { useCurrentUserName } from '@/registry/default/blocks/current-user-avatar/hooks/use-current-user-name'
import { Avatar, AvatarFallback, AvatarImage } from '@/registry/default/components/ui/avatar'

export const CurrentUserAvatar = () => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <Avatar>
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
