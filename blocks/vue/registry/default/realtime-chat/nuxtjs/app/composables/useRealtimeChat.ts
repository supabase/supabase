import { onUnmounted, ref, watch } from 'vue'

// @ts-ignore
import { createClient } from '@/lib/supabase/client'

interface UseRealtimeChatProps {
  roomName: string
  username: string
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat(props: UseRealtimeChatProps) {
  const supabase = createClient()

  const messages = ref<ChatMessage[]>([])
  const channel = ref<ReturnType<typeof supabase.channel> | null>(null)
  const isConnected = ref(false)

  function cleanup() {
    if (channel.value) {
      supabase.removeChannel(channel.value)
      channel.value = null
    }
  }

  function setupChannel() {
    if (!props.roomName) return

    const newChannel = supabase.channel(props.roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload: { payload: ChatMessage }) => {
        messages.value.push(payload.payload as ChatMessage)
      })
      .subscribe((status: string) => {
        isConnected.value = status === 'SUBSCRIBED'
      })

    channel.value = newChannel
  }

  watch(
    () => props.roomName,
    () => {
      cleanup()
      setupChannel()
    },
    { immediate: true }
  )

  onUnmounted(() => {
    cleanup()
  })

  async function sendMessage(content: string) {
    if (!channel.value || !isConnected.value) return

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: {
        name: props.username,
      },
      createdAt: new Date().toISOString(),
    }

    // Optimistic update
    messages.value.push(message)

    await channel.value.send({
      type: 'broadcast',
      event: EVENT_MESSAGE_TYPE,
      payload: message,
    })
  }

  return {
    messages,
    sendMessage,
    isConnected,
  }
}
