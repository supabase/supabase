'use client'

import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useUser } from 'common'
import { useEffect, useMemo, useState } from 'react'
import { Label_Shadcn_, Switch } from 'ui'

import { getRandomUser } from './utils'
import { AvatarStack } from '@/registry/default/blocks/realtime-avatar-stack/components/avatar-stack'
import { RealtimeUser } from '@/registry/default/blocks/realtime-avatar-stack/hooks/use-realtime-presence-room'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

const supabase = createClient()
const roomName = 'realtime-avatar-stack-demo'

const randomUser = getRandomUser()

// This demo is using the supabase.com account to broadcast its data to a realtime channel from a normal Supabase project.
// This is a workaround to make the more interactive. Don't use it this way in production (it only works on supabase.com)
const RealtimeAvatarStackDemo = () => {
  // this demo only works on supabase.com because all apps are on the same domain and share cookies
  const user = useUser()
  const [dashboardUser, setDashboardUser] = useState(false)

  // generate a random name for the current user or use his supabase.com name
  const currentUserName = useMemo(() => {
    let name = randomUser.name
    if (dashboardUser) {
      name = user?.user_metadata.full_name as string
    }
    return name ?? '?'
  }, [dashboardUser, user?.user_metadata.full_name])

  // generate a random image for the current user or use his supabase.com avatar
  const currentUserImage = useMemo(() => {
    let image = randomUser.image
    if (dashboardUser) {
      image = (user?.user_metadata.avatar_url as string) ?? null
    }

    return image
  }, [dashboardUser, user?.user_metadata.avatar_url])

  const [usersMap, setUsersMap] = useState<Record<string, RealtimeUser> | null>(null)

  useEffect(() => {
    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<{ image: string; name: string }>()

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => [
            key,
            { name: values[0].name, image: values[0].image },
          ])
        ) as Record<string, RealtimeUser>
        setUsersMap(newUsers)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await room.track({
            name: currentUserName,
            image: currentUserImage,
          })
        } else {
          setUsersMap(null)
        }
      })

    return () => {
      room.unsubscribe()
    }
  }, [currentUserName, currentUserImage])

  const avatars = useMemo(() => {
    return Object.values(usersMap || {}).map((user) => ({
      name: user.name,
      image: user.image,
    }))
  }, [usersMap])

  if (usersMap === null) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 items-center justify-center">
      <AvatarStack avatars={avatars} />

      {avatars.length < 2 ? (
        <div className="flex flex-col text-sm text-foreground-light">
          <span>It seems like you&apos;re the only person viewing this page.</span>
          <span>Open this page in another browser tab to see it in action.</span>
        </div>
      ) : user ? (
        <div className="flex items-center space-x-2">
          <Switch id="current-user" checked={dashboardUser} onCheckedChange={setDashboardUser} />
          <Label_Shadcn_ htmlFor="current-user">Use my supabase.com account instead</Label_Shadcn_>
        </div>
      ) : (
        <span className="text-sm text-foreground-light">
          It seems like you&apos;re not logged in. Login via the{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
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

export default RealtimeAvatarStackDemo
