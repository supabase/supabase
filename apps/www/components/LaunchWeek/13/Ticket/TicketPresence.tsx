import React, { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { cn } from 'ui'
import { Dot } from 'lucide-react'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'

const TicketPresence = (props: { className?: string }) => {
  const { supabase, ticketState } = useConfData()
  const hasTicket = ticketState === 'ticket'
  const [realtimeChannel, setRealtimeChannel] = useState<ReturnType<
    SupabaseClient['channel']
  > | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const isSingular = onlineUsers.length === 1
  const lowTraffic = onlineUsers.length < 5

  useEffect(() => {
    // Listen to realtime presence
    if (!realtimeChannel && supabase) {
      const lw13Room = supabase?.channel('lw13_rooms', {
        config: { broadcast: { self: true, ack: true } },
      })

      setRealtimeChannel(lw13Room)
      const userStatus = {}

      lw13Room
        ?.on('presence', { event: 'sync' }, () => {
          const newState = lw13Room.presenceState()
          const users = [...Object.entries(newState).map(([_, value]) => value[0])]
          const uniqueUsrs = users.filter(onlyUnique)
          setOnlineUsers(uniqueUsrs)
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') {
            return null
          }
          await lw13Room.track(userStatus)
        })
    }

    return () => {
      realtimeChannel?.unsubscribe()
    }
  }, [])

  return (
    <div
      className={cn(
        'text-foreground-lighter text-xs flex items-center transition-opacity opacity-100',
        hasTicket && 'text-sm opacity-80',
        props.className
      )}
    >
      <Dot className="text-brand animate-pulse -ml-2" />
      {onlineUsers.length} {isSingular ? 'person is' : 'people are'} online
    </div>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}

export default TicketPresence
