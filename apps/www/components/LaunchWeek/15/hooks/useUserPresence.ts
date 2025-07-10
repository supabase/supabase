import { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import supabase from 'lib/supabase'

const useUserPresence = () => {
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    // Listen to realtime presence
    if (!realtimeChannel && supabase) {
      const lw15Room = supabase?.channel('lw15_online', {
        config: { broadcast: { self: true, ack: true } },
      })

      setRealtimeChannel(lw15Room)
      const userStatus = {}

      lw15Room
        ?.on('presence', { event: 'sync' }, () => {
          const newState = lw15Room.presenceState()
          const users = [...Object.entries(newState).map(([_, value]) => value[0])]
          const uniqueUsrs = users.filter(onlyUnique)
          setOnlineUsers(uniqueUsrs)
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') {
            return null
          }
          await lw15Room.track(userStatus)
        })
    }

    return () => {
      realtimeChannel?.unsubscribe()
    }
  }, [])

  return onlineUsers.length
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}

export default useUserPresence
