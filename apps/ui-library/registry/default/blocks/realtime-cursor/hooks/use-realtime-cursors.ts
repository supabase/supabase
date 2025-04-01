import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react'

const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  limit: number,
  deps: DependencyList
) => {
  const lastRun = useRef<number>(0)

  return useCallback(
    (...args: Params) => {
      const now = Date.now()
      if (now - lastRun.current >= limit) {
        lastRun.current = now
        callback(...args)
      }
    },
    [...deps, limit]
  )
}

const supabase = createClient()

const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

const generateRandomNumber = () => Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

type CursorEventPayload = {
  position: {
    x: number
    y: number
  }
  user: {
    id: number
    name: string
  }
  color: string
  timestamp: number
}

export const useRealtimeCursors = ({
  roomName,
  username,
  throttleMs = 70,
}: {
  roomName: string
  username: string
  throttleMs?: number
}) => {
  const [color] = useState(generateRandomColor())
  const [userId] = useState(generateRandomNumber())
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})

  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleMouseMove = useThrottleCallback(
    (event: MouseEvent) => {
      const { clientX, clientY } = event

      const payload: CursorEventPayload = {
        position: {
          x: clientX,
          y: clientY,
        },
        user: {
          id: userId,
          name: username,
        },
        color: color,
        timestamp: new Date().getTime(),
      }

      channelRef.current?.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload: payload,
      })
    },
    throttleMs,
    [color, userId, username]
  )

  useEffect(() => {
    const channel = supabase.channel(roomName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: CursorEventPayload }) => {
        const { user } = data.payload
        // Don't render your own cursor
        if (user.id === userId) return

        setCursors((prev) => {
          if (prev[userId]) {
            delete prev[userId]
          }

          return {
            ...prev,
            [user.id]: data.payload,
          }
        })
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Add event listener for mousemove
    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  return { cursors }
}
