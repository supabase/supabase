'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { ChatMessage } from '../components/realtime-chat'

interface OnlineUser {
  user_id: string
  username: string
  avatar?: string
  online_at: number
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  avatar?: string
}

export function useRealtimeChat({ roomName, username, avatar }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Create a single channel instance
    const newChannel = supabase.channel(`chat:${roomName}`)

    // Track presence state
    newChannel.on('presence', { event: 'sync' }, () => {
      const state = newChannel.presenceState()
      const presenceList: OnlineUser[] = []

      // Convert presence state to array
      Object.keys(state).forEach((key) => {
        const presences = state[key] as unknown as Array<{
          user_id: string
          username: string
          avatar?: string
          online_at: number
        }>
        presenceList.push(...presences)
      })

      setOnlineUsers(presenceList)
    })

    // Subscribe to broadcast messages
    newChannel
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await newChannel.track({
            user_id: crypto.randomUUID(),
            username,
            avatar,
            online_at: new Date().getTime(),
          })
          setIsConnected(true)
        }
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [roomName, username, avatar, supabase])

  const sendMessage = async (content: string) => {
    if (!channel || !isConnected) return

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: {
        name: username,
        avatar,
      },
      createdAt: new Date().toISOString(),
    }

    // Update local state immediately for the sender
    setMessages((current) => [...current, message])

    // Broadcast to other users
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    })
  }

  return { messages, sendMessage, onlineUsers, isConnected }
}
