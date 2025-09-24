// 'use client'

import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'

const CurrentUserAvatarPreview = () => {
  return (
    <Avatar>
      <AvatarImage
        src={`${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-1.png`}
        alt="MS"
      />
      <AvatarFallback>MS</AvatarFallback>
    </Avatar>
  )
}

export default CurrentUserAvatarPreview
