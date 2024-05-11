import React, { useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import solutions from '~/data/Solutions'
import { cn } from 'ui'

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
      const lwxRoom = supabase?.channel('lwx_online', {
        config: { broadcast: { self: true, ack: true } },
      })

      setRealtimeChannel(lwxRoom)
      const userStatus = {}

      lwxRoom
        ?.on('presence', { event: 'sync' }, () => {
          const newState = lwxRoom.presenceState()
          const users = [...Object.entries(newState).map(([_, value]) => value[0])]
          const uniqueUsrs = users.filter(onlyUnique)
          setOnlineUsers(uniqueUsrs)
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') {
            return null
          }
          await lwxRoom.track(userStatus)
        })
    }

    return () => {
      realtimeChannel?.unsubscribe()
    }
  }, [])

  return (
    <div
      className={cn(
        'text-foreground-muted text-xs flex items-center transition-opacity',
        hasTicket && 'text-sm opacity-80',
        props.className
      )}
    >
      <svg
        className="h-5 w-5 stroke-foreground-lighter animate-pulse mr-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke="text-foreground"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d={solutions.realtime.icon}
        />
      </svg>
      {onlineUsers.length} {isSingular ? 'person is' : 'people are'}{' '}
      {hasTicket ? 'customizing' : 'generating'} their ticket right now
    </div>
  )
}

function onlyUnique(value: any, index: number, array: any[]) {
  return array.indexOf(value) === index
}

export default TicketPresence
