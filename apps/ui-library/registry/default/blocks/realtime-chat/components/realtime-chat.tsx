'use client'

import { useRealtimeChat } from '@/registry/default/blocks/realtime-chat/hooks/use-realtime-chat'
import { ChatMessageItem } from './chat-message'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
    avatar?: string
  }
  createdAt: string
}

interface RealtimeChatProps {
  roomName: string
  username: string
  avatar?: string
}

export const RealtimeChat = ({ roomName, username, avatar }: RealtimeChatProps) => {
  const { messages, sendMessage } = useRealtimeChat({ roomName, username })

  console.log(messages)

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-foreground/50">No messages yet</div>
        ) : null}
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            isOwnMessage={message.user.name === username}
          />
        ))}
      </div>
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const input = form.elements.namedItem('message') as HTMLInputElement
            if (input.value.trim()) {
              sendMessage(input.value)
              input.value = ''
            }
          }}
        >
          <input
            type="text"
            name="message"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Type a message..."
          />
        </form>
      </div>
    </div>
  )
}
