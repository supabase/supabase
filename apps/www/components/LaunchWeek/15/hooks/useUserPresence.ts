import { useEffect, useState } from 'react'
import supabase from 'lib/supabase'

const LW15_PRESENCE_TOPIC = 'lw15_online'

const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!supabase) return

    // `supabase.channel()` returns an existing channel if one is already
    // registered under this topic instead of creating a new one. If a
    // previous mount of this hook (e.g. a fast client-side route change
    // between two ticket pages, which remounts via `getStaticProps`'s `key`)
    // left a channel behind that's still joined/joining, calling
    // `.on('presence', ...)` on it below throws — presence callbacks can
    // only be registered before `subscribe()`. Remove any such stale
    // registration first so we always start from a fresh channel.
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
