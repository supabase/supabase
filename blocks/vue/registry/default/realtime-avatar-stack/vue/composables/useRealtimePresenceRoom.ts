import { ref, watch, onUnmounted } from 'vue'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'

import { useCurrentUserImage } from './useCurrentUserImage'
import { useCurrentUserName } from './useCurrentUserName'
// @ts-ignore
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type RealtimeUser = {
  id: string
  name: string
  image: string
}

export function useRealtimePresenceRoom(roomName: string) {
  const { image: currentUserImage } = useCurrentUserImage()
  const { name: currentUserName } = useCurrentUserName()

  const users = ref<Record<string, RealtimeUser>>({})

  let room: ReturnType<typeof supabase.channel> | null = null

  function setupRoom() {
    if (!roomName) return

    room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room?.presenceState<{ image: string; name: string }>() ?? {}

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => {
            const typedValues = values as Array<{ image: string; name: string }>
            if (typedValues.length > 0) {
              return [
                key,
                {
                  id: key,
                  name: typedValues[0].name,
                  image: typedValues[0].image,
                },
              ]
            } else {
              return [
                key,
                {
                  id: key,
                  name: '',
                  image: '',
                },
              ]
            }
          })
        ) as Record<string, RealtimeUser>

        users.value = newUsers
      })
      .subscribe(async (status: REALTIME_SUBSCRIBE_STATES) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && room) {
          await room.track({
            name: currentUserName.value,
            image: currentUserImage.value,
          })
        } else {
          users.value = {}
        }
      })
  }

  function cleanup() {
    if (room) {
      room.unsubscribe()
      room = null
    }
  }

  watch(
    [() => roomName, currentUserName, currentUserImage],
    () => {
      cleanup()
      setupRoom()
    },
    { immediate: true }
  )

  onUnmounted(() => {
    cleanup()
  })

  return { users }
}
