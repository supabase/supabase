import { useEffect, useState } from 'react'
import supabase from 'lib/supabase'

const LW15_PRESENCE_TOPIC = 'lw15_online'

const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!supabase) return

    // `channel()` would reuse the previous mount's channel, and presence
    // callbacks can't be added after `subscribe()`.
    const staleChannel = supabase
      .getChannels()
      .find((channel) => channel.topic === `realtime:${LW15_PRESENCE_TOPIC}`)
    if (staleChannel) {
      supabase.removeChannel(staleChannel)
    }

    const lw15Room = supabase.channel(LW15_PRESENCE_TOPIC, {
      config: { broadcast: { self: true, ack: true } },
    })
    const userStatus = {}

    lw15Room
      .on('presence', { event: 'sync' }, () => {
        const newState = lw15Room.presenceState()
        const users = [...Object.entries(newState).map(([_, value]) => value[0])]
        const uniqueUsrs = users.filter(onlyUnique)
        setOnlineUsers(uniqueUsrs)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          return
        }
        await lw15Room.track(userStatus)
      })

    return () => {
      supabase.removeChannel(lw15Room)
    }
  }, [])

  return onlineUsers.length
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}

export default useUserPresence
