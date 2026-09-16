import { useEffect, useState } from 'react'
import supabase from 'lib/supabase'

const LW15_PRESENCE_TOPIC = 'lw15_online'

const useUserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    if (!supabase) return

    // The previous mount's channel is usually still registered here and
    // mid-leave: this page remounts on every ticket-to-ticket route change
    // (`getStaticProps` returns a `key`), and a channel only deregisters once
    // its leave completes. Removing it again finishes that leave synchronously,
    // so `channel()` below returns a fresh channel rather than the old one —
    // presence callbacks can't be bound after `subscribe()`, and `subscribe()`
    // no-ops while a channel is leaving.
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
