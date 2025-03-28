'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { ChatMessage } from '../components/realtime-chat'

interface UseRealtimeChatProps {
  roomName: string
  username: string
}

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = supabase.channel(`chat:${roomName}`)

    newChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, supabase])

  const sendMessage = async (content: string) => {
    if (!channel || !isConnected) return

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: {
        name: username,
      },
      createdAt: new Date().toISOString(),
    }

    // Update local state immediately for the sender
    setMessages((current) => [...current, message])

    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    })
  }

  return { messages, sendMessage, isConnected }
}
