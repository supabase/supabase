'use client'

import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { useCurrentUserImage } from '@/registry/default/blocks/current-user-avatar/hooks/use-current-user-image'
import { useCurrentUserName } from '@/registry/default/blocks/current-user-avatar/hooks/use-current-user-name'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

const supabase = createClient()

export type RealtimeUser = {
  id: string
  name: string
  image: string
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const currentUserImage = useCurrentUserImage()
  const currentUserName = useCurrentUserName()

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

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
        setUsers(newUsers)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await room.track({
            name: currentUserName,
            image: currentUserImage,
          })
        } else {
          setUsers({})
        }
      })

    return () => {
      room.unsubscribe()
    }
  }, [roomName, currentUserName, currentUserImage])

  return { users }
}
