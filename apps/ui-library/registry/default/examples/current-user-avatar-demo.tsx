'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/registry/default/components/ui/avatar'
import { useUser } from 'common'

const CurrentUserAvatarDemo = () => {
  // this demo only works on supabase.com because all apps are on the same domain and share cookies
  const user = useUser()

  const profileImage = user?.user_metadata.avatar_url ?? null
  const name = (user?.user_metadata.full_name as string) ?? '?'
  const initials = name
    ?.split(' ')
    ?.map((word) => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <Avatar>
        {profileImage && <AvatarImage src={profileImage} alt={initials} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {!user && (
        <span className="text-sm text-foreground-light">
          It seems like you&apos;re not logged in. Login via the{' '}
          <a
            href="https://supabase.com/dashboard/sign-in"
            className="text-foreground underline decoration-1 decoration-foreground-muted underline-offset-4 transition-colors hover:decoration-brand hover:decoration-2"
          >
            Dashboard
          </a>{' '}
          to see your avatar.
        </span>
      )}
    </div>
  )
}

export default CurrentUserAvatarDemo
