'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/registry/default/components/ui/avatar'
import { useCurrentUserImage } from '../hooks/use-current-user-image'
import { useCurrentUserName } from '../hooks/use-current-user-name'

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
