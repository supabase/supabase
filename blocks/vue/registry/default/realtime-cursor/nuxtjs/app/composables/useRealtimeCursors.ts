import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { createClient } from '@/lib/supabase/client'
import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from '@supabase/supabase-js'

/**
 * Throttle a callback to a certain delay.
 * It will only call the callback if the delay has passed,
 * using the arguments from the last call.
 */
function useThrottleCallback<Params extends unknown[]>(
  callback: (...args: Params) => void,
  delay: number
) {
  let lastCall = 0
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Params) => {
    const now = Date.now()
    const remainingTime = delay - (now - lastCall)

    if (remainingTime <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      lastCall = now
      callback(...args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now()
        timeout = null
        callback(...args)
      }, remainingTime)
    }
  }
}

const supabase = createClient()

const generateRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

const generateRandomNumber = () =>
  Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

export type CursorEventPayload = {
  position: { x: number; y: number }
  user: { id: number; name: string }
  color: string
  timestamp: number
}

export function useRealtimeCursors({
  roomName,
  username,
  throttleMs,
}: {
  roomName: string
  username: string
  throttleMs: number
}) {
  const color = generateRandomColor()
  const userId = generateRandomNumber()

  const cursors = reactive<Record<string, CursorEventPayload>>({})
  const cursorPayload = ref<CursorEventPayload | null>(null)
  const channelRef = ref<RealtimeChannel | null>(null)

  const sendCursor = (event: MouseEvent) => {
    const payload: CursorEventPayload = {
      position: {
        x: event.clientX,
        y: event.clientY,
      },
      user: {
        id: userId,
        name: username,
      },
      color,
      timestamp: Date.now(),
    }

    cursorPayload.value = payload

    channelRef.value?.send({
      type: 'broadcast',
      event: EVENT_NAME,
      payload,
    })
  }

  const handleMouseMove = useThrottleCallback(sendCursor, throttleMs)

  onMounted(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach(({ key }) => {
          delete cursors[key]
        })
      })
      .on('presence', { event: 'join' }, () => {
        if (!cursorPayload.value) return

        channelRef.value?.send({
          type: 'broadcast',
          event: EVENT_NAME,
          payload: cursorPayload.value,
        })
      })
      .on('broadcast', { event: EVENT_NAME }, ({ payload }) => {
        if (payload.user.id === userId) return

        delete cursors[userId]

        cursors[payload.user.id] = payload
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({ key: userId })
          channelRef.value = channel
        } else {
          Object.keys(cursors).forEach((k) => delete cursors[k])
          channelRef.value = null
        }
      })

    window.addEventListener('mousemove', handleMouseMove)

    onUnmounted(() => {
      window.removeEventListener('mousemove', handleMouseMove)
      channel.unsubscribe()
      channelRef.value = null
    })
  })

  return { cursors }
}
