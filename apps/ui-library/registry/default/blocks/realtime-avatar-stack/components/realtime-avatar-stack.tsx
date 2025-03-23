import { useMemo } from 'react'
import { useRealtimePresenceRoom } from '../hooks/use-realtime-presence-room'
import { AvatarStack } from './avatar-stack'

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
