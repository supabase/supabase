'use client'

import { AvatarStack } from '@/registry/default/blocks/realtime-avatar-stack/components/avatar-stack'
import { useRealtimePresenceRoom } from '@/registry/default/blocks/realtime-avatar-stack/hooks/use-realtime-presence-room'
import { useMemo } from 'react'

export const RealtimeAvatarStack = ({ roomName }: { roomName: string }) => {
  const { users: usersMap } = useRealtimePresenceRoom(roomName)
  const avatars = useMemo(() => {
    return Object.values(usersMap).map((user) => ({
      name: user.name,
      image: user.image,
    }))
  }, [usersMap])

  return <AvatarStack avatars={avatars} />
}
