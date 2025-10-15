import { advisorGameClient } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Throttle a callback to a certain delay, It will only call the callback if the delay has passed, with the arguments
 * from the last call
 */
const useThrottleCallback = <Params extends unknown[], Return>(
  callback: (...args: Params) => Return,
  delay: number
) => {
  const lastCall = useRef(0)
  const timeout = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Params) => {
      const now = Date.now()
      const remainingTime = delay - (now - lastCall.current)

      if (remainingTime <= 0) {
        if (timeout.current) {
          clearTimeout(timeout.current)
          timeout.current = null
        }
        lastCall.current = now
        callback(...args)
      } else if (!timeout.current) {
        timeout.current = setTimeout(() => {
          lastCall.current = Date.now()
          timeout.current = null
          callback(...args)
        }, remainingTime)
      }
    },
    [callback, delay]
  )
}

const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

const generateRandomNumber = () => Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

type CursorEventPayload = {
  canvasPosition: {
    x: number
    y: number
  }
  gridPosition: {
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
  throttleMs,
  canvasRef,
  onMouseMoveRef,
}: {
  roomName: string
  username: string
  throttleMs: number
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  onMouseMoveRef?: React.MutableRefObject<
    ((canvasX: number, canvasY: number, gridX: number, gridY: number) => void) | undefined
  >
}) => {
  const [color] = useState(generateRandomColor())
  const [userId] = useState(generateRandomNumber())
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})

  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null)

  const callback = useCallback(
    (canvasX: number, canvasY: number, gridX: number, gridY: number) => {
      if (!canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()

      // Only broadcast if cursor is inside the canvas
      if (canvasX < 0 || canvasY < 0 || canvasX > rect.width || canvasY > rect.height) {
        return
      }

      lastPositionRef.current = { x: canvasX, y: canvasY }

      const payload: CursorEventPayload = {
        canvasPosition: {
          x: canvasX,
          y: canvasY,
        },
        gridPosition: {
          x: gridX,
          y: gridY,
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
    [color, userId, username, canvasRef]
  )

  const handleMouseMoveThrottled = useThrottleCallback(callback, throttleMs)

  // Store the callback in the ref so PixelCanvas can call it
  useEffect(() => {
    if (onMouseMoveRef) {
      onMouseMoveRef.current = handleMouseMoveThrottled
    }
  }, [handleMouseMoveThrottled, onMouseMoveRef])

  useEffect(() => {
    const channel = advisorGameClient.channel(roomName)
    channelRef.current = channel

    channel
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: CursorEventPayload }) => {
        const { user } = data.payload
        // Don't render your own cursor
        if (user.id === userId) return

        setCursors((prev: Record<string, CursorEventPayload>) => ({
          ...prev,
          [user.id]: data.payload,
        }))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomName, userId])

  return { cursors }
}
